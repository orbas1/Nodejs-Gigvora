import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import sequelize from '../models/sequelizeClient.js';
import { DatabaseAuditEvent } from '../models/databaseAuditEvent.js';
import logger from '../utils/logger.js';
import { markDependencyHealthy, markDependencyUnavailable } from '../lifecycle/runtimeHealth.js';

const poolState = {
  vendor: null,
  max: 0,
  min: 0,
  size: 0,
  available: 0,
  pending: 0,
  borrowed: 0,
  updatedAt: null,
  lastEvent: null,
};

let instrumentationRegistered = false;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIRECTORY = path.resolve(__dirname, '../../database/migrations');

async function listFilesystemMigrations() {
  try {
    const entries = await fs.readdir(MIGRATIONS_DIRECTORY, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && /\.(cjs|js)$/.test(entry.name))
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    logger.warn?.({ err: error }, 'Failed to read migrations directory');
    return [];
  }
}

async function fetchAppliedMigrations(transaction) {
  try {
    const metaTable = sequelize.getQueryInterface().quoteTable('SequelizeMeta');
    const [rows] = await sequelize.query(`SELECT name FROM ${metaTable} ORDER BY name ASC`, {
      transaction,
    });
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows.map((row) => row.name).sort();
  } catch (error) {
    logger.warn?.({ err: error }, 'Unable to read applied migrations from SequelizeMeta');
    return [];
  }
}

async function detectMigrationDrift(transaction) {
  const [filesystem, applied] = await Promise.all([
    listFilesystemMigrations(),
    fetchAppliedMigrations(transaction),
  ]);

  const pending = filesystem.filter((name) => !applied.includes(name));
  const orphaned = applied.filter((name) => !filesystem.includes(name));
  const checksum = crypto
    .createHash('sha256')
    .update(JSON.stringify({ filesystem, applied }))
    .digest('hex');

  return { filesystem, applied, pending, orphaned, checksum };
}

async function resolveIsolationLevel(transaction) {
  const dialect = sequelize.getDialect();
  try {
    if (dialect === 'mysql' || dialect === 'mariadb') {
      const [[row]] = await sequelize.query(
        'SELECT @@transaction_isolation AS isolationLevel, @@global.read_only AS readOnly',
        { transaction },
      );
      return {
        isolationLevel: row?.isolationLevel ?? null,
        readOnly: row?.readOnly === 1 || row?.readOnly === '1',
      };
    }
    if (dialect === 'postgres' || dialect === 'postgresql') {
      const [[row]] = await sequelize.query(
        "SELECT current_setting('transaction_isolation') AS isolationLevel, current_setting('transaction_read_only') AS readOnly",
        { transaction },
      );
      const iso = row?.isolationlevel ?? row?.isolation_level ?? row?.isolationLevel ?? null;
      const roValue = row?.readonly ?? row?.read_only ?? row?.readOnly ?? null;
      const readOnlyNormalized = typeof roValue === 'string' ? roValue.toLowerCase() : roValue;
      const readOnly =
        readOnlyNormalized === 'on' ||
        readOnlyNormalized === 't' ||
        readOnlyNormalized === 'true' ||
        readOnlyNormalized === '1' ||
        readOnlyNormalized === true;
      return {
        isolationLevel: iso,
        readOnly,
      };
    }
    if (dialect === 'sqlite') {
      const [[row]] = await sequelize.query('PRAGMA journal_mode;', { transaction });
      return {
        isolationLevel: `sqlite/${row?.journal_mode ?? 'unknown'}`,
        readOnly: false,
      };
    }
  } catch (error) {
    logger.warn?.({ err: error }, 'Failed to resolve isolation level');
  }
  return { isolationLevel: null, readOnly: null };
}

async function detectReplicationRole(transaction) {
  const dialect = sequelize.getDialect();
  try {
    if (dialect === 'mysql' || dialect === 'mariadb') {
      const [rows] = await sequelize.query('SHOW SLAVE STATUS', { transaction });
      return Array.isArray(rows) && rows.length > 0 ? 'replica' : 'primary';
    }
    if (dialect === 'postgres' || dialect === 'postgresql') {
      const [[row]] = await sequelize.query(
        'SELECT pg_is_in_recovery() AS inRecovery',
        { transaction },
      );
      const rawValue = row?.inrecovery ?? row?.in_recovery ?? row?.inRecovery ?? null;
      if (rawValue == null) {
        return 'unknown';
      }
      const normalized = typeof rawValue === 'string' ? rawValue.toLowerCase() : rawValue;
      return normalized === true || normalized === 't' || normalized === 'true' || normalized === '1'
        ? 'replica'
        : 'primary';
    }
  } catch (error) {
    logger.warn?.({ err: error }, 'Failed to resolve replication role');
  }
  return 'unknown';
}

function resolveLogger(candidate) {
  if (candidate && typeof candidate.info === 'function') {
    return candidate;
  }
  return logger;
}

function readPoolStats() {
  const pool = sequelize?.connectionManager?.pool;
  if (!pool) {
    return null;
  }

  return {
    max: Number.isFinite(pool.max) ? pool.max : null,
    min: Number.isFinite(pool.min) ? pool.min : null,
    size: Number.isFinite(pool.size) ? pool.size : null,
    available: Number.isFinite(pool.available) ? pool.available : null,
    pending: Number.isFinite(pool.pending) ? pool.pending : null,
    borrowed: Number.isFinite(pool.borrowed) ? pool.borrowed : null,
  };
}

function updatePoolSnapshot(event = 'sample') {
  const stats = readPoolStats();
  poolState.vendor = sequelize?.getDialect?.() ?? null;
  poolState.updatedAt = new Date().toISOString();
  poolState.lastEvent = event;

  if (stats) {
    poolState.max = stats.max ?? poolState.max;
    poolState.min = stats.min ?? poolState.min;
    poolState.size = stats.size ?? poolState.size;
    poolState.available = stats.available ?? poolState.available;
    poolState.pending = stats.pending ?? poolState.pending;
    poolState.borrowed = stats.borrowed ?? poolState.borrowed;
  }

  return { ...poolState };
}

function registerPoolInstrumentation(log = logger) {
  if (instrumentationRegistered) {
    return;
  }
  const pool = sequelize?.connectionManager?.pool;
  if (!pool || typeof pool.on !== 'function') {
    return;
  }
  instrumentationRegistered = true;

  const events = ['acquire', 'release', 'destroy', 'create', 'error'];
  events.forEach((event) => {
    pool.on(event, () => {
      updatePoolSnapshot(event);
      log.debug?.({ pool: { ...poolState } }, `database pool event: ${event}`);
    });
  });
}

async function recordAuditEvent(eventType, { reason = null, initiatedBy = null, metadata = {} } = {}) {
  try {
    const record = await DatabaseAuditEvent.recordEvent({
      eventType,
      reason,
      initiatedBy,
      metadata: { ...metadata, pool: { ...poolState } },
    });
    if (record && typeof record.get === 'function') {
      return record.get({ plain: true });
    }
    return record ?? null;
  } catch (error) {
    const auditLogger = resolveLogger();
    auditLogger.warn?.({ err: error, eventType }, 'Failed to persist database audit event');
    return null;
  }
}

export function getDatabasePoolSnapshot() {
  return { ...poolState };
}

export async function warmDatabaseConnections({ logger: candidateLogger, initiatedBy = 'runtime' } = {}) {
  const log = resolveLogger(candidateLogger);
  registerPoolInstrumentation(log);

  const vendor = sequelize?.getDialect?.() ?? 'unknown';
  const started = process.hrtime.bigint();
  try {
    await sequelize.authenticate({ logging: false });
    const finished = process.hrtime.bigint();
    const latencyMs = Number(finished - started) / 1_000_000;
    const snapshot = updatePoolSnapshot('warm');

    const [isolation, replication, drift] = await Promise.all([
      resolveIsolationLevel(),
      detectReplicationRole(),
      detectMigrationDrift(),
    ]);

    const borrowed = snapshot.borrowed ?? 0;
    const max = snapshot.max ?? 0;
    const saturation = max > 0 ? Number((borrowed / max).toFixed(2)) : null;

    markDependencyHealthy('database', {
      vendor,
      latencyMs: Number(latencyMs.toFixed(2)),
      pool: { ...snapshot, saturation },
      isolationLevel: isolation.isolationLevel,
      readOnly: isolation.readOnly,
      replicationRole: replication,
      migrations: drift,
    });

    log.info(
      {
        vendor,
        latencyMs: Number(latencyMs.toFixed(2)),
        pool: { ...snapshot, saturation },
        isolationLevel: isolation.isolationLevel,
        replicationRole: replication,
        migrationChecksum: drift.checksum,
        pendingMigrations: drift.pending.length,
      },
      'Database connectivity verified',
    );
    await recordAuditEvent('startup', {
      initiatedBy,
      metadata: {
        latencyMs: Number(latencyMs.toFixed(2)),
        isolationLevel: isolation.isolationLevel,
        replicationRole: replication,
        migrationChecksum: drift.checksum,
        pendingMigrations: drift.pending,
      },
    });

    return snapshot;
  } catch (error) {
    updatePoolSnapshot('warm_failed');
    markDependencyUnavailable('database', error, { vendor });
    log.error({ err: error, vendor }, 'Failed to warm database connections');
    await recordAuditEvent('connection_failure', {
      initiatedBy,
      reason: error.message,
      metadata: { code: error.code ?? null },
    });
    throw error;
  }
}

export async function drainDatabaseConnections({
  logger: candidateLogger,
  initiatedBy = 'runtime',
  reason = 'shutdown',
} = {}) {
  const log = resolveLogger(candidateLogger);
  updatePoolSnapshot('shutdown_initiated');

  const auditEvent = await recordAuditEvent('shutdown_initiated', {
    initiatedBy,
    reason,
  });

  try {
    await sequelize.close();
    const snapshot = updatePoolSnapshot('shutdown_complete');
    markDependencyHealthy('database', {
      vendor: poolState.vendor,
      status: 'disconnected',
      pool: snapshot,
      reason,
    });
    log.info({ reason }, 'Database connections closed');
    return { pool: snapshot, auditEvent };
  } catch (error) {
    updatePoolSnapshot('shutdown_failed');
    markDependencyUnavailable('database', error, { reason, vendor: poolState.vendor });
    log.error({ err: error, reason }, 'Failed to close database connections');
    await recordAuditEvent('shutdown_failed', {
      initiatedBy,
      reason: error.message,
    });
    throw error;
  }
}

export default {
  warmDatabaseConnections,
  drainDatabaseConnections,
  getDatabasePoolSnapshot,
};
