import { Sequelize, Op } from 'sequelize';
import { DatabaseConnectionProfile } from '../models/databaseConnectionProfile.js';
import { DatabaseAuditEvent } from '../models/databaseAuditEvent.js';
import { encryptSecret, decryptSecret } from '../utils/secretCipher.js';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

const ALLOWED_DIALECTS = new Set(['postgres', 'postgresql', 'mysql', 'mariadb', 'mssql', 'sqlite']);
const ALLOWED_SSL_MODES = new Set(['disable', 'prefer', 'require', 'verify-ca', 'verify-full']);
const STATUS_HEALTHY = 'healthy';
const STATUS_WARNING = 'warning';
const STATUS_ERROR = 'error';
const STATUS_UNKNOWN = 'unknown';

function slugify(value, fallback = 'connection') {
  if (!value) {
    return fallback;
  }
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 140) || fallback;
}

function maskSecret(secret) {
  if (!secret) {
    return null;
  }
  const visible = secret.slice(-4);
  return `${'•'.repeat(Math.max(4, secret.length - 4))}${visible}`;
}

function normalizeRoles(roles = []) {
  if (!Array.isArray(roles)) {
    return [];
  }
  const sanitized = roles
    .map((role) => `${role}`.trim().toLowerCase())
    .filter((role) => role.length > 0);
  return Array.from(new Set(sanitized));
}

function normalizeSslMode(mode) {
  if (!mode) {
    return 'require';
  }
  const normalized = `${mode}`.trim().toLowerCase();
  if (!ALLOWED_SSL_MODES.has(normalized)) {
    return 'require';
  }
  return normalized;
}

function normalizeDialect(dialect, fallback = 'postgres') {
  if (!dialect) {
    return fallback;
  }
  const normalized = `${dialect}`.trim().toLowerCase();
  if (normalized === 'postgresql') {
    return 'postgres';
  }
  if (!ALLOWED_DIALECTS.has(normalized)) {
    throw new ValidationError(`Unsupported database dialect "${dialect}".`);
  }
  return normalized;
}

function coerceInteger(value, fallback = null, { min, max } = {}) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('Numeric value expected.');
  }
  const integer = Math.trunc(numeric);
  if (typeof min === 'number' && integer < min) {
    return min;
  }
  if (typeof max === 'number' && integer > max) {
    return max;
  }
  return integer;
}

function coerceOptionalString(value, fallback = null) {
  if (value == null) {
    return fallback;
  }
  const text = `${value}`.trim();
  return text.length > 0 ? text : fallback;
}

function normalizeOptions(input = {}, fallback = {}) {
  const options = { ...fallback };
  if (input.poolMin != null) {
    options.poolMin = coerceInteger(input.poolMin, 0, { min: 0 });
  }
  if (input.poolMax != null) {
    options.poolMax = coerceInteger(input.poolMax, 10, { min: 1 });
  }
  if (options.poolMin != null && options.poolMax != null && options.poolMax < options.poolMin) {
    throw new ValidationError('Pool maximum cannot be less than pool minimum.');
  }
  if (input.idleTimeoutMs != null) {
    options.idleTimeoutMs = coerceInteger(input.idleTimeoutMs, 10000, { min: 0 });
  }
  if (input.connectionTimeoutMs != null) {
    options.connectionTimeoutMs = coerceInteger(input.connectionTimeoutMs, 10000, { min: 1000 });
  }
  if (input.maxLifetimeMs != null) {
    options.maxLifetimeMs = coerceInteger(input.maxLifetimeMs, 300000, { min: 0 });
  }
  if (input.replicaLagThresholdMs != null) {
    options.replicaLagThresholdMs = coerceInteger(input.replicaLagThresholdMs, 0, { min: 0 });
  }
  return options;
}

async function ensureUniqueSlug(baseSlug, ignoreId = null) {
  const slugBase = slugify(baseSlug);
  let candidate = slugBase;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await DatabaseConnectionProfile.findOne({
      where: ignoreId
        ? { slug: candidate, id: { [Op.ne]: ignoreId } }
        : { slug: candidate },
    });
    if (!existing) {
      return candidate;
    }
    suffix += 1;
    candidate = `${slugBase}-${suffix}`;
  }
}

function toDto(record, { includeSecret = false } = {}) {
  if (!record) {
    return null;
  }
  const base = record.toAdminPayload();
  const password = record.passwordCiphertext ? decryptSecret(record.passwordCiphertext) : null;
  return {
    ...base,
    password: includeSecret ? password : undefined,
    passwordPreview: maskSecret(password),
  };
}

function buildSummary(connections = []) {
  const statusCounts = {
    [STATUS_HEALTHY]: 0,
    [STATUS_WARNING]: 0,
    [STATUS_ERROR]: 0,
    [STATUS_UNKNOWN]: 0,
  };
  const byEnvironment = {};
  const byRole = {};

  connections.forEach((connection) => {
    const status = connection.status && statusCounts[connection.status] != null ? connection.status : STATUS_UNKNOWN;
    statusCounts[status] += 1;

    const environment = connection.environment || 'unknown';
    if (!byEnvironment[environment]) {
      byEnvironment[environment] = {
        total: 0,
        [STATUS_HEALTHY]: 0,
        [STATUS_WARNING]: 0,
        [STATUS_ERROR]: 0,
        [STATUS_UNKNOWN]: 0,
      };
    }
    byEnvironment[environment].total += 1;
    byEnvironment[environment][status] += 1;

    const role = connection.role || 'unspecified';
    if (!byRole[role]) {
      byRole[role] = { total: 0 };
    }
    byRole[role].total += 1;
  });

  return {
    total: connections.length,
    byStatus: statusCounts,
    byEnvironment,
    byRole,
  };
}

export async function listDatabaseConnections({ environment, role } = {}) {
  const where = {};
  if (environment) {
    where.environment = `${environment}`.toLowerCase();
  }
  if (role) {
    where.role = `${role}`.toLowerCase();
  }
  const records = await DatabaseConnectionProfile.findAll({
    where,
    order: [
      ['environment', 'ASC'],
      ['role', 'ASC'],
      ['name', 'ASC'],
    ],
  });

  const items = records.map((record) => toDto(record, { includeSecret: false }));
  return {
    items,
    summary: buildSummary(items),
  };
}

export async function getDatabaseConnection(connectionId, { includeSecret = false } = {}) {
  const record = await DatabaseConnectionProfile.findByPk(connectionId);
  if (!record) {
    throw new NotFoundError('Database connection profile not found.');
  }
  return toDto(record, { includeSecret });
}

export async function createDatabaseConnection(payload = {}, { actor } = {}) {
  const name = coerceOptionalString(payload.name);
  if (!name) {
    throw new ValidationError('Connection name is required.');
  }
  const environment = coerceOptionalString(payload.environment, 'production')?.toLowerCase();
  const role = coerceOptionalString(payload.role, 'primary')?.toLowerCase();
  const host = coerceOptionalString(payload.host);
  const username = coerceOptionalString(payload.username);
  const database = coerceOptionalString(payload.database);
  const port = coerceInteger(payload.port, 5432, { min: 1, max: 65535 });
  const password = coerceOptionalString(payload.password);

  if (!host) {
    throw new ValidationError('Database host is required.');
  }
  if (!database) {
    throw new ValidationError('Database name is required.');
  }
  if (!username) {
    throw new ValidationError('Database username is required.');
  }
  if (!password) {
    throw new ValidationError('Database password is required.');
  }

  const slug = await ensureUniqueSlug(payload.slug ?? name);
  const dialect = normalizeDialect(payload.dialect, 'postgres');
  const sslMode = normalizeSslMode(payload.sslMode);
  const allowedRoles = normalizeRoles(payload.allowedRoles);
  const description = coerceOptionalString(payload.description, null);
  const options = normalizeOptions(payload.options, {});
  const isPrimary = Boolean(payload.isPrimary);
  const readOnly = Boolean(payload.readOnly);

  try {
    const record = await DatabaseConnectionProfile.create({
      name,
      slug,
      environment,
      role,
      description,
      dialect,
      host,
      port,
      databaseName: database,
      username,
      passwordCiphertext: encryptSecret(password),
      sslMode,
      options,
      allowedRoles,
      isPrimary,
      readOnly,
      status: STATUS_UNKNOWN,
      lastRotatedAt: new Date(),
      lastRotatedBy: actor ?? null,
    });

    await DatabaseAuditEvent.recordEvent({
      eventType: 'database.connection.created',
      initiatedBy: actor ?? null,
      metadata: { connectionId: record.id, slug: record.slug, environment, role },
    });

    return toDto(record, { includeSecret: false });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new ConflictError('A database connection with this slug already exists.');
    }
    throw error;
  }
}

export async function updateDatabaseConnection(connectionId, payload = {}, { actor } = {}) {
  const record = await DatabaseConnectionProfile.findByPk(connectionId);
  if (!record) {
    throw new NotFoundError('Database connection profile not found.');
  }

  if (payload.name != null) {
    const name = coerceOptionalString(payload.name);
    if (!name) {
      throw new ValidationError('Connection name is required.');
    }
    if (name !== record.name) {
      record.name = name;
      record.slug = await ensureUniqueSlug(payload.slug ?? name, record.id);
    }
  }

  if (payload.environment != null) {
    record.environment = coerceOptionalString(payload.environment, record.environment)?.toLowerCase();
  }
  if (payload.role != null) {
    record.role = coerceOptionalString(payload.role, record.role)?.toLowerCase();
  }
  if (payload.description !== undefined) {
    record.description = coerceOptionalString(payload.description, null);
  }
  if (payload.dialect != null) {
    record.dialect = normalizeDialect(payload.dialect, record.dialect);
  }
  if (payload.host != null) {
    const host = coerceOptionalString(payload.host);
    if (!host) {
      throw new ValidationError('Database host is required.');
    }
    record.host = host;
  }
  if (payload.port != null) {
    record.port = coerceInteger(payload.port, record.port, { min: 1, max: 65535 });
  }
  if (payload.database != null) {
    const database = coerceOptionalString(payload.database);
    if (!database) {
      throw new ValidationError('Database name is required.');
    }
    record.databaseName = database;
  }
  if (payload.username != null) {
    const username = coerceOptionalString(payload.username);
    if (!username) {
      throw new ValidationError('Database username is required.');
    }
    record.username = username;
  }
  if (payload.sslMode != null) {
    record.sslMode = normalizeSslMode(payload.sslMode);
  }
  if (payload.options != null) {
    record.options = normalizeOptions(payload.options, record.options ?? {});
  }
  if (payload.allowedRoles != null) {
    record.allowedRoles = normalizeRoles(payload.allowedRoles);
  }
  if (payload.isPrimary != null) {
    record.isPrimary = Boolean(payload.isPrimary);
  }
  if (payload.readOnly != null) {
    record.readOnly = Boolean(payload.readOnly);
  }
  if (payload.password != null) {
    const password = coerceOptionalString(payload.password);
    if (!password) {
      throw new ValidationError('Database password cannot be empty.');
    }
    record.passwordCiphertext = encryptSecret(password);
    record.lastRotatedAt = new Date();
    record.lastRotatedBy = actor ?? null;
  }

  await record.save();

  await DatabaseAuditEvent.recordEvent({
    eventType: 'database.connection.updated',
    initiatedBy: actor ?? null,
    metadata: { connectionId, changes: Object.keys(payload) },
  });

  await record.reload();
  return toDto(record, { includeSecret: false });
}

export async function deleteDatabaseConnection(connectionId, { actor } = {}) {
  const record = await DatabaseConnectionProfile.findByPk(connectionId);
  if (!record) {
    throw new NotFoundError('Database connection profile not found.');
  }
  await record.destroy();
  await DatabaseAuditEvent.recordEvent({
    eventType: 'database.connection.deleted',
    initiatedBy: actor ?? null,
    metadata: { connectionId, slug: record.slug },
  });
}

function buildSequelizeConfig(connection, password) {
  const dialect = normalizeDialect(connection.dialect || 'postgres');
  const database = connection.database ?? connection.databaseName;
  const username = connection.username;
  const host = connection.host;
  const port = Number(connection.port) || 5432;
  const sslMode = normalizeSslMode(connection.sslMode);
  const options = connection.options ?? {};

  const sslConfig = (() => {
    if (sslMode === 'disable') {
      return false;
    }
    if (sslMode === 'prefer') {
      return { require: false, rejectUnauthorized: false };
    }
    if (sslMode === 'require') {
      return { require: true, rejectUnauthorized: false };
    }
    return { require: true, rejectUnauthorized: sslMode === 'verify-full' };
  })();

  return {
    database,
    username,
    password,
    options: {
      host,
      port,
      dialect,
      logging: false,
      pool: {
        min: Number.isFinite(options.poolMin) ? options.poolMin : 0,
        max: Number.isFinite(options.poolMax) ? options.poolMax : 5,
        idle: Number.isFinite(options.idleTimeoutMs) ? options.idleTimeoutMs : 10000,
        acquire: Number.isFinite(options.connectionTimeoutMs) ? options.connectionTimeoutMs : 10000,
        evict: Number.isFinite(options.maxLifetimeMs) ? options.maxLifetimeMs : undefined,
      },
      dialectOptions: sslConfig ? { ssl: sslConfig } : {},
    },
  };
}

export async function testDatabaseConnection(payload = {}, { actor } = {}) {
  let record = null;
  if (payload.connectionId) {
    record = await DatabaseConnectionProfile.findByPk(payload.connectionId);
    if (!record) {
      throw new NotFoundError('Database connection profile not found.');
    }
  }

  const baseline = record ? record.toAdminPayload() : {};
  const merged = {
    ...baseline,
    ...payload,
    database: payload.database ?? baseline.database,
    username: payload.username ?? baseline.username,
    host: payload.host ?? baseline.host,
    port: payload.port ?? baseline.port,
    dialect: payload.dialect ?? baseline.dialect,
    sslMode: payload.sslMode ?? baseline.sslMode,
    options: normalizeOptions(payload.options ?? {}, baseline.options ?? {}),
  };

  const password = payload.password ?? (record ? decryptSecret(record.passwordCiphertext) : null);
  if (!password) {
    throw new ValidationError('Database password is required to test connectivity.');
  }

  const config = buildSequelizeConfig(merged, password);
  const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config.options,
  );

  const start = Date.now();
  let latencyMs = null;
  let status = STATUS_UNKNOWN;
  let errorMessage = null;
  try {
    await sequelize.authenticate({ retry: { max: 0 } });
    latencyMs = Date.now() - start;
    status = latencyMs > 1200 ? STATUS_WARNING : STATUS_HEALTHY;
  } catch (error) {
    latencyMs = Date.now() - start;
    status = STATUS_ERROR;
    errorMessage = error.message || 'Connection test failed.';
    logger.error({ error }, 'Database connection test failed.');
  } finally {
    await sequelize.close().catch((closeError) => {
      logger.warn({ error: closeError }, 'Failed to close transient database connection.');
    });
  }

  if (record) {
    record.status = status;
    record.lastTestedAt = new Date();
    record.lastTestedBy = actor ?? null;
    record.lastTestError = errorMessage;
    await record.save();

    await DatabaseAuditEvent.recordEvent({
      eventType: 'database.connection.tested',
      initiatedBy: actor ?? null,
      metadata: {
        connectionId: record.id,
        status,
        latencyMs,
        error: errorMessage,
      },
    });
    await record.reload();
  }

  return {
    status,
    latencyMs,
    error: errorMessage,
    connection: record ? toDto(record, { includeSecret: false }) : null,
  };
}
