import { DataTypes, Op } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const BACKUP_STATUSES = ['pending', 'running', 'success', 'failed', 'expired'];
export const BACKUP_VERIFICATION_STATUSES = ['unverified', 'in_progress', 'verified', 'failed'];
export const BACKUP_TYPES = ['full', 'incremental', 'differential', 'logical', 'physical'];
export const DRILL_STATUSES = ['scheduled', 'running', 'passed', 'failed', 'cancelled'];
export const DRILL_SCENARIOS = [
  'regional_outage',
  'ransomware_response',
  'config_corruption',
  'operator_error',
  'cloud_provider_failure',
  'data_center_loss',
];

function normalizeKey(value, { fallback = 'entry', maxLength = 160 } = {}) {
  const base = String(value ?? '').trim().toLowerCase();
  if (!base) {
    return fallback;
  }
  return base
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, maxLength);
}

function coerceInteger(value, fallback = null) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.trunc(numeric);
}

function coerceFloat(value, fallback = null) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return numeric;
}

function sanitizeStatus(status, allowed, fallback) {
  if (!status) {
    return fallback;
  }
  const normalized = String(status).trim().toLowerCase();
  return allowed.includes(normalized) ? normalized : fallback;
}

function sanitizeType(type, allowed, fallback) {
  if (!type) {
    return fallback;
  }
  const normalized = String(type).trim().toLowerCase();
  return allowed.includes(normalized) ? normalized : fallback;
}

function toIsoDate(value) {
  return value instanceof Date ? value.toISOString() : value ?? null;
}

export const BackupSnapshot = sequelize.define(
  'BackupSnapshot',
  {
    snapshotKey: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    backupType: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'full' },
    source: { type: DataTypes.STRING(80), allowNull: false },
    environment: { type: DataTypes.STRING(40), allowNull: false },
    region: { type: DataTypes.STRING(60), allowNull: true },
    status: { type: DataTypes.STRING(24), allowNull: false, defaultValue: 'pending' },
    storageLocationKey: { type: DataTypes.STRING(160), allowNull: true },
    storageClass: { type: DataTypes.STRING(64), allowNull: true },
    storageUri: { type: DataTypes.STRING(2048), allowNull: true },
    checksum: { type: DataTypes.STRING(128), allowNull: true },
    checksumAlgorithm: { type: DataTypes.STRING(32), allowNull: true },
    sizeBytes: { type: DataTypes.BIGINT, allowNull: true },
    retentionDays: { type: DataTypes.INTEGER, allowNull: true },
    initiatedBy: { type: DataTypes.STRING(160), allowNull: true },
    initiatedFrom: { type: DataTypes.STRING(160), allowNull: true },
    verificationStatus: { type: DataTypes.STRING(24), allowNull: false, defaultValue: 'unverified' },
    verifiedAt: { type: DataTypes.DATE, allowNull: true },
    startedAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    failureReason: { type: DataTypes.TEXT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    datasetScope: { type: jsonType, allowNull: true, defaultValue: {} },
    metadata: { type: jsonType, allowNull: true, defaultValue: {} },
  },
  {
    tableName: 'backup_snapshots',
    indexes: [
      { fields: ['snapshotKey'], unique: true },
      { fields: ['status'] },
      { fields: ['environment'] },
      { fields: ['startedAt'] },
    ],
  },
);

BackupSnapshot.addHook('beforeValidate', (snapshot) => {
  snapshot.snapshotKey = normalizeKey(snapshot.snapshotKey);
  snapshot.backupType = sanitizeType(snapshot.backupType, BACKUP_TYPES, 'full');
  snapshot.status = sanitizeStatus(snapshot.status, BACKUP_STATUSES, 'pending');
  snapshot.verificationStatus = sanitizeStatus(
    snapshot.verificationStatus,
    BACKUP_VERIFICATION_STATUSES,
    'unverified',
  );
  snapshot.retentionDays = coerceInteger(snapshot.retentionDays, null);
  snapshot.sizeBytes = coerceInteger(snapshot.sizeBytes, null);
  snapshot.metadata = snapshot.metadata ?? {};
  snapshot.datasetScope = snapshot.datasetScope ?? {};
});

BackupSnapshot.prototype.isHealthy = function isHealthy() {
  return this.status === 'success' || this.status === 'running';
};

BackupSnapshot.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    key: plain.snapshotKey,
    type: plain.backupType,
    source: plain.source,
    environment: plain.environment,
    region: plain.region ?? null,
    status: plain.status,
    storage: {
      locationKey: plain.storageLocationKey ?? null,
      class: plain.storageClass ?? null,
      uri: plain.storageUri ?? null,
    },
    checksum: plain.checksum
      ? { value: plain.checksum, algorithm: plain.checksumAlgorithm ?? null }
      : null,
    retentionDays: plain.retentionDays ?? null,
    initiatedBy: plain.initiatedBy ?? null,
    initiatedFrom: plain.initiatedFrom ?? null,
    verification: {
      status: plain.verificationStatus,
      verifiedAt: toIsoDate(plain.verifiedAt),
    },
    startedAt: toIsoDate(plain.startedAt),
    completedAt: toIsoDate(plain.completedAt),
    expiresAt: toIsoDate(plain.expiresAt),
    sizeBytes: plain.sizeBytes != null ? Number(plain.sizeBytes) : null,
    failureReason: plain.failureReason ?? null,
    notes: plain.notes ?? null,
    datasetScope: plain.datasetScope ?? {},
    metadata: plain.metadata ?? {},
    createdAt: toIsoDate(plain.createdAt),
    updatedAt: toIsoDate(plain.updatedAt),
  };
};

BackupSnapshot.findByKey = async function findByKey(snapshotKey, options = {}) {
  const normalized = normalizeKey(snapshotKey);
  return BackupSnapshot.findOne({ where: { snapshotKey: normalized }, ...options });
};

BackupSnapshot.scopeExpiringSoon = function scopeExpiringSoon(withinDays = 7) {
  const now = new Date();
  const upcoming = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
  return BackupSnapshot.findAll({
    where: {
      status: 'success',
      expiresAt: { [Op.lte]: upcoming },
    },
    order: [['expiresAt', 'ASC']],
  });
};

export const DisasterRecoveryDrill = sequelize.define(
  'DisasterRecoveryDrill',
  {
    drillKey: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    scenario: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'regional_outage' },
    status: { type: DataTypes.STRING(24), allowNull: false, defaultValue: 'scheduled' },
    environment: { type: DataTypes.STRING(40), allowNull: false },
    region: { type: DataTypes.STRING(60), allowNull: true },
    rtoMinutes: { type: DataTypes.INTEGER, allowNull: true },
    rpoMinutes: { type: DataTypes.INTEGER, allowNull: true },
    restoreDurationMs: { type: DataTypes.DECIMAL(14, 3), allowNull: true },
    dataLossSeconds: { type: DataTypes.INTEGER, allowNull: true },
    initiatedBy: { type: DataTypes.STRING(160), allowNull: true },
    initiatedFrom: { type: DataTypes.STRING(160), allowNull: true },
    startedAt: { type: DataTypes.DATE, allowNull: true },
    restoreStartedAt: { type: DataTypes.DATE, allowNull: true },
    restoreCompletedAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    verifiedAt: { type: DataTypes.DATE, allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    issuesFound: { type: jsonType, allowNull: true, defaultValue: [] },
    evidenceUri: { type: DataTypes.STRING(1024), allowNull: true },
    metadata: { type: jsonType, allowNull: true, defaultValue: {} },
  },
  {
    tableName: 'disaster_recovery_drills',
    indexes: [
      { fields: ['drillKey'], unique: true },
      { fields: ['status'] },
      { fields: ['environment'] },
      { fields: ['startedAt'] },
    ],
  },
);

DisasterRecoveryDrill.addHook('beforeValidate', (drill) => {
  drill.drillKey = normalizeKey(drill.drillKey);
  drill.scenario = sanitizeType(drill.scenario, DRILL_SCENARIOS, 'regional_outage');
  drill.status = sanitizeStatus(drill.status, DRILL_STATUSES, 'scheduled');
  drill.metadata = drill.metadata ?? {};
  drill.issuesFound = Array.isArray(drill.issuesFound) ? drill.issuesFound : [];
  drill.rtoMinutes = coerceInteger(drill.rtoMinutes, null);
  drill.rpoMinutes = coerceInteger(drill.rpoMinutes, null);
  drill.restoreDurationMs = coerceFloat(drill.restoreDurationMs, null);
  drill.dataLossSeconds = coerceInteger(drill.dataLossSeconds, null);
});

DisasterRecoveryDrill.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    key: plain.drillKey,
    name: plain.name,
    scenario: plain.scenario,
    status: plain.status,
    environment: plain.environment,
    region: plain.region ?? null,
    objectives: {
      rtoMinutes: plain.rtoMinutes ?? null,
      rpoMinutes: plain.rpoMinutes ?? null,
    },
    restore: {
      durationMs: plain.restoreDurationMs != null ? Number(plain.restoreDurationMs) : null,
      dataLossSeconds: plain.dataLossSeconds ?? null,
    },
    initiatedBy: plain.initiatedBy ?? null,
    initiatedFrom: plain.initiatedFrom ?? null,
    startedAt: toIsoDate(plain.startedAt),
    restoreStartedAt: toIsoDate(plain.restoreStartedAt),
    restoreCompletedAt: toIsoDate(plain.restoreCompletedAt),
    completedAt: toIsoDate(plain.completedAt),
    verifiedAt: toIsoDate(plain.verifiedAt),
    summary: plain.summary ?? null,
    issuesFound: plain.issuesFound ?? [],
    evidenceUri: plain.evidenceUri ?? null,
    metadata: plain.metadata ?? {},
    createdAt: toIsoDate(plain.createdAt),
    updatedAt: toIsoDate(plain.updatedAt),
  };
};

DisasterRecoveryDrill.findByKey = async function findByKey(drillKey, options = {}) {
  const normalized = normalizeKey(drillKey);
  return DisasterRecoveryDrill.findOne({ where: { drillKey: normalized }, ...options });
};

export function summarizeBackupHealth(records = []) {
  const summary = {
    total: records.length,
    byStatus: BACKUP_STATUSES.reduce((acc, status) => ({ ...acc, [status]: 0 }), {}),
    verified: 0,
    unhealthy: 0,
    latestSuccessAt: null,
    oldestSnapshotAt: null,
  };

  records.forEach((record) => {
    const status = BACKUP_STATUSES.includes(record.status) ? record.status : 'pending';
    summary.byStatus[status] += 1;
    if (record.verificationStatus === 'verified') {
      summary.verified += 1;
    }
    if (record.status === 'failed' || record.status === 'expired') {
      summary.unhealthy += 1;
    }
    if (record.completedAt && (summary.latestSuccessAt == null || summary.latestSuccessAt < record.completedAt)) {
      summary.latestSuccessAt = record.completedAt;
    }
    if (record.startedAt && (summary.oldestSnapshotAt == null || summary.oldestSnapshotAt > record.startedAt)) {
      summary.oldestSnapshotAt = record.startedAt;
    }
  });

  summary.latestSuccessAt = toIsoDate(summary.latestSuccessAt);
  summary.oldestSnapshotAt = toIsoDate(summary.oldestSnapshotAt);

  return summary;
}

export function summarizeDrillReadiness(records = []) {
  const summary = {
    total: records.length,
    byStatus: DRILL_STATUSES.reduce((acc, status) => ({ ...acc, [status]: 0 }), {}),
    passedWithinQuarter: 0,
    outstandingIssues: 0,
    latestVerificationAt: null,
  };

  const now = Date.now();
  const quarterMs = 90 * 24 * 60 * 60 * 1000;

  records.forEach((record) => {
    const status = DRILL_STATUSES.includes(record.status) ? record.status : 'scheduled';
    summary.byStatus[status] += 1;
    if (record.status === 'passed' && record.verifiedAt) {
      const verifiedAtMs = new Date(record.verifiedAt).getTime();
      if (Number.isFinite(verifiedAtMs) && now - verifiedAtMs <= quarterMs) {
        summary.passedWithinQuarter += 1;
      }
      if (!summary.latestVerificationAt || summary.latestVerificationAt < record.verifiedAt) {
        summary.latestVerificationAt = record.verifiedAt;
      }
    }
    if (Array.isArray(record.issuesFound) && record.issuesFound.length > 0 && record.status !== 'passed') {
      summary.outstandingIssues += 1;
    }
  });

  summary.latestVerificationAt = toIsoDate(summary.latestVerificationAt);

  return summary;
}
