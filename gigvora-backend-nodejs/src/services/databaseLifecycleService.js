import sequelize from '../models/sequelizeClient.js';
import { DatabaseAuditEvent } from '../models/databaseAuditEvent.js';
import logger from '../utils/logger.js';
import {
  markDependencyHealthy,
  markDependencyUnavailable,
  markDependencyDegraded,
} from '../lifecycle/runtimeHealth.js';

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

    markDependencyHealthy('database', {
      vendor,
      latencyMs: Number(latencyMs.toFixed(2)),
      pool: snapshot,
    });

    log.info({ vendor, latencyMs: Number(latencyMs.toFixed(2)), pool: snapshot }, 'Database connectivity verified');
    await recordAuditEvent('startup', {
      initiatedBy,
      metadata: { latencyMs: Number(latencyMs.toFixed(2)) },
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
    markDependencyDegraded('database', new Error('Database connections drained'), { reason, vendor: poolState.vendor });
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
