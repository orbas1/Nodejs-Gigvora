import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const SCHEMA_MIGRATION_DIRECTIONS = Object.freeze(['up', 'down']);
export const SCHEMA_MIGRATION_STATUSES = Object.freeze(['completed', 'failed', 'rolled_back']);

export const SEED_EXECUTION_DIRECTIONS = Object.freeze(['up', 'down']);
export const SEED_EXECUTION_STATUSES = Object.freeze(['completed', 'failed', 'rolled_back']);

function clampDuration(durationMs) {
  if (durationMs == null) {
    return null;
  }
  const numeric = Number(durationMs);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return Number(numeric.toFixed(3));
}

function sanitiseMetadata(value) {
  if (value == null) {
    return {};
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  return { value };
}

export const SchemaMigrationAudit = sequelize.define(
  'SchemaMigrationAudit',
  {
    migrationName: { type: DataTypes.STRING(255), allowNull: false },
    checksum: { type: DataTypes.STRING(128), allowNull: true },
    direction: {
      type: DataTypes.STRING(12),
      allowNull: false,
      validate: { isIn: [SCHEMA_MIGRATION_DIRECTIONS] },
    },
    status: {
      type: DataTypes.STRING(24),
      allowNull: false,
      validate: { isIn: [SCHEMA_MIGRATION_STATUSES] },
    },
    executedBy: { type: DataTypes.STRING(120), allowNull: true },
    executedFrom: { type: DataTypes.STRING(120), allowNull: true },
    environment: { type: DataTypes.STRING(40), allowNull: true },
    durationMs: { type: DataTypes.DECIMAL(12, 3), allowNull: true },
    executedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'schema_migration_audits',
    indexes: [
      { fields: ['migrationName'], name: 'schema_migration_audits_name_idx' },
      { fields: ['status'], name: 'schema_migration_audits_status_idx' },
      { fields: ['executedAt'], name: 'schema_migration_audits_executed_at_idx' },
    ],
  },
);

SchemaMigrationAudit.logRun = async function logRun({
  migrationName,
  checksum = null,
  direction,
  status,
  executedBy = null,
  executedFrom = null,
  environment = null,
  durationMs = null,
  executedAt = new Date(),
  notes = null,
  metadata = {},
} = {}) {
  if (!migrationName) {
    throw new Error('migrationName is required to record a schema migration audit');
  }
  if (!SCHEMA_MIGRATION_DIRECTIONS.includes(direction)) {
    throw new Error(`direction must be one of: ${SCHEMA_MIGRATION_DIRECTIONS.join(', ')}`);
  }
  if (!SCHEMA_MIGRATION_STATUSES.includes(status)) {
    throw new Error(`status must be one of: ${SCHEMA_MIGRATION_STATUSES.join(', ')}`);
  }

  return SchemaMigrationAudit.create({
    migrationName,
    checksum,
    direction,
    status,
    executedBy,
    executedFrom,
    environment,
    durationMs: clampDuration(durationMs),
    executedAt,
    notes,
    metadata: sanitiseMetadata(metadata),
  });
};

SchemaMigrationAudit.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    migrationName: plain.migrationName,
    checksum: plain.checksum ?? null,
    direction: plain.direction,
    status: plain.status,
    executedBy: plain.executedBy ?? null,
    executedFrom: plain.executedFrom ?? null,
    environment: plain.environment ?? null,
    durationMs: plain.durationMs != null ? Number(plain.durationMs) : null,
    executedAt: plain.executedAt,
    notes: plain.notes ?? null,
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const SeedExecutionAudit = sequelize.define(
  'SeedExecutionAudit',
  {
    seederName: { type: DataTypes.STRING(255), allowNull: false },
    checksum: { type: DataTypes.STRING(128), allowNull: true },
    direction: {
      type: DataTypes.STRING(12),
      allowNull: false,
      validate: { isIn: [SEED_EXECUTION_DIRECTIONS] },
    },
    status: {
      type: DataTypes.STRING(24),
      allowNull: false,
      validate: { isIn: [SEED_EXECUTION_STATUSES] },
    },
    executedBy: { type: DataTypes.STRING(120), allowNull: true },
    executedFrom: { type: DataTypes.STRING(120), allowNull: true },
    environment: { type: DataTypes.STRING(40), allowNull: true },
    durationMs: { type: DataTypes.DECIMAL(12, 3), allowNull: true },
    executedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    datasetTags: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'seed_execution_audits',
    indexes: [
      { fields: ['seederName'], name: 'seed_execution_audits_name_idx' },
      { fields: ['status'], name: 'seed_execution_audits_status_idx' },
      { fields: ['executedAt'], name: 'seed_execution_audits_executed_at_idx' },
    ],
  },
);

SeedExecutionAudit.logRun = async function logRun({
  seederName,
  checksum = null,
  direction,
  status,
  executedBy = null,
  executedFrom = null,
  environment = null,
  durationMs = null,
  executedAt = new Date(),
  datasetTags = null,
  metadata = {},
  notes = null,
} = {}) {
  if (!seederName) {
    throw new Error('seederName is required to record a seed execution audit');
  }
  if (!SEED_EXECUTION_DIRECTIONS.includes(direction)) {
    throw new Error(`direction must be one of: ${SEED_EXECUTION_DIRECTIONS.join(', ')}`);
  }
  if (!SEED_EXECUTION_STATUSES.includes(status)) {
    throw new Error(`status must be one of: ${SEED_EXECUTION_STATUSES.join(', ')}`);
  }

  return SeedExecutionAudit.create({
    seederName,
    checksum,
    direction,
    status,
    executedBy,
    executedFrom,
    environment,
    durationMs: clampDuration(durationMs),
    executedAt,
    datasetTags: Array.isArray(datasetTags) ? datasetTags : datasetTags ?? null,
    metadata: sanitiseMetadata(metadata),
    notes,
  });
};

SeedExecutionAudit.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    seederName: plain.seederName,
    checksum: plain.checksum ?? null,
    direction: plain.direction,
    status: plain.status,
    executedBy: plain.executedBy ?? null,
    executedFrom: plain.executedFrom ?? null,
    environment: plain.environment ?? null,
    durationMs: plain.durationMs != null ? Number(plain.durationMs) : null,
    executedAt: plain.executedAt,
    datasetTags: plain.datasetTags ?? null,
    metadata: plain.metadata ?? {},
    notes: plain.notes ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export default SchemaMigrationAudit;
