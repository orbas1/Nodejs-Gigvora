import sequelize from '../models/sequelizeClient.js';
import {
  BackupSnapshot,
  DisasterRecoveryDrill,
  BACKUP_STATUSES,
  BACKUP_TYPES,
  BACKUP_VERIFICATION_STATUSES,
  DRILL_STATUSES,
  DRILL_SCENARIOS,
  summarizeBackupHealth,
  summarizeDrillReadiness,
} from '../models/backupRecoveryModels.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

async function withTransaction(handler, { transaction } = {}) {
  if (transaction) {
    return handler(transaction);
  }
  const managed = await sequelize.transaction();
  try {
    const result = await handler(managed);
    await managed.commit();
    return result;
  } catch (error) {
    await managed.rollback();
    throw error;
  }
}

function normalizeDatasetScope(scope) {
  if (!scope) {
    return {};
  }
  if (Array.isArray(scope)) {
    return { datasets: scope };
  }
  if (typeof scope === 'object') {
    return scope;
  }
  return { description: String(scope) };
}

function buildAuditMetadata(metadata = {}, context = {}) {
  const actor = context?.actor ?? {};
  const source = context?.source ?? context?.channel ?? context?.initiatedFrom ?? null;
  return {
    ...metadata,
    audit: {
      ...(metadata.audit ?? {}),
      actor: actor.email ?? actor.name ?? actor.id ?? null,
      actorId: actor.id ?? null,
      actorRole: actor.role ?? null,
      source,
      capturedAt: new Date().toISOString(),
    },
  };
}

function assertInSet(value, set, message) {
  if (value == null) {
    return null;
  }
  const normalized = String(value).trim().toLowerCase();
  if (!set.includes(normalized)) {
    throw new ValidationError(message);
  }
  return normalized;
}

async function loadSnapshot(snapshotIdOrKey, options = {}) {
  const where = Number.isInteger(snapshotIdOrKey)
    ? { id: snapshotIdOrKey }
    : { snapshotKey: String(snapshotIdOrKey).trim().toLowerCase() };
  const record = await BackupSnapshot.findOne({ where, ...options });
  if (!record) {
    throw new NotFoundError('Backup snapshot not found.');
  }
  return record;
}

async function loadDrill(drillIdOrKey, options = {}) {
  const where = Number.isInteger(drillIdOrKey)
    ? { id: drillIdOrKey }
    : { drillKey: String(drillIdOrKey).trim().toLowerCase() };
  const record = await DisasterRecoveryDrill.findOne({ where, ...options });
  if (!record) {
    throw new NotFoundError('Disaster recovery drill not found.');
  }
  return record;
}

export async function scheduleBackupSnapshot(payload = {}, context = {}, options = {}) {
  const { snapshotKey, source, environment } = payload;
  if (!snapshotKey) {
    throw new ValidationError('snapshotKey is required to schedule a backup snapshot.');
  }
  if (!source) {
    throw new ValidationError('source is required to schedule a backup snapshot.');
  }
  if (!environment) {
    throw new ValidationError('environment is required to schedule a backup snapshot.');
  }
  const normalizedType = payload.backupType
    ? assertInSet(payload.backupType, BACKUP_TYPES, 'Unsupported backup type.')
    : 'full';
  const normalizedStatus = payload.status
    ? assertInSet(payload.status, BACKUP_STATUSES, 'Unsupported backup status.')
    : 'pending';
  const normalizedVerification = payload.verificationStatus
    ? assertInSet(payload.verificationStatus, BACKUP_VERIFICATION_STATUSES, 'Unsupported verification status.')
    : 'unverified';

  const auditMetadata = buildAuditMetadata(payload.metadata, context);
  const retentionDays = payload.retentionDays != null ? Number.parseInt(payload.retentionDays, 10) : 30;
  const normalizedRetention = Number.isFinite(retentionDays) && retentionDays > 0 ? retentionDays : 30;

  return withTransaction(async (transaction) => {
    const existing = await BackupSnapshot.findByKey(snapshotKey, { transaction, lock: transaction.LOCK.UPDATE });
    if (existing) {
      throw new ValidationError('A snapshot with this key already exists.');
    }

    const snapshot = await BackupSnapshot.create(
      {
        snapshotKey,
        backupType: normalizedType,
        source,
        environment,
        region: payload.region ?? null,
        status: normalizedStatus,
        storageLocationKey: payload.storageLocationKey ?? null,
        storageClass: payload.storageClass ?? null,
        storageUri: payload.storageUri ?? null,
        checksum: payload.checksum ?? null,
        checksumAlgorithm: payload.checksumAlgorithm ?? null,
        retentionDays: normalizedRetention,
        sizeBytes: payload.sizeBytes ?? null,
        initiatedBy: payload.initiatedBy ?? context?.actor?.email ?? context?.actor?.id ?? null,
        initiatedFrom: payload.initiatedFrom ?? context?.channel ?? context?.source ?? null,
        verificationStatus: normalizedVerification,
        startedAt: payload.startedAt ?? null,
        completedAt: payload.completedAt ?? null,
        expiresAt: payload.expiresAt ?? null,
        failureReason: payload.failureReason ?? null,
        notes: payload.notes ?? null,
        datasetScope: normalizeDatasetScope(payload.datasetScope),
        metadata: auditMetadata,
      },
      { transaction },
    );

    logger.info?.({ snapshotKey }, 'Backup snapshot scheduled');
    return snapshot.toPublicObject();
  }, options);
}

export async function markBackupSnapshotRunning(snapshotIdOrKey, context = {}, options = {}) {
  return withTransaction(async (transaction) => {
    const snapshot = await loadSnapshot(snapshotIdOrKey, { transaction, lock: transaction.LOCK.UPDATE });
    await snapshot.update(
      {
        status: 'running',
        startedAt: snapshot.startedAt ?? new Date(),
        metadata: buildAuditMetadata(snapshot.metadata, context),
      },
      { transaction },
    );
    return snapshot.toPublicObject();
  }, options);
}

function resolveExpiresAt(snapshot, retentionDaysOverride) {
  const retention = retentionDaysOverride ?? snapshot.retentionDays;
  if (!retention || !snapshot.completedAt) {
    return snapshot.expiresAt ?? null;
  }
  const completion = snapshot.completedAt instanceof Date ? snapshot.completedAt : new Date(snapshot.completedAt);
  if (!Number.isFinite(completion.getTime())) {
    return snapshot.expiresAt ?? null;
  }
  return new Date(completion.getTime() + retention * 24 * 60 * 60 * 1000);
}

function computeDurationMs(start, end) {
  if (!start || !end) {
    return null;
  }
  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end instanceof Date ? end : new Date(end);
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
    return null;
  }
  return endMs - startMs;
}

function resolveMinutesFromDuration(durationMs) {
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return null;
  }
  return Math.ceil(durationMs / (60 * 1000));
}

function resolveSecondsFromMinutes(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return null;
  }
  return Math.max(Math.round(minutes * 60), 0);
}

export async function completeBackupSnapshot(snapshotIdOrKey, payload = {}, context = {}, options = {}) {
  const normalizedVerification = payload.verificationStatus
    ? assertInSet(payload.verificationStatus, BACKUP_VERIFICATION_STATUSES, 'Unsupported verification status.')
    : null;
  const statusOverride = payload.status
    ? assertInSet(payload.status, BACKUP_STATUSES, 'Unsupported backup status override.')
    : null;
  const retentionOverrideRaw =
    payload.retentionDays != null ? Number.parseInt(payload.retentionDays, 10) : null;
  const retentionOverride =
    Number.isFinite(retentionOverrideRaw) && retentionOverrideRaw > 0 ? retentionOverrideRaw : null;

  return withTransaction(async (transaction) => {
    const snapshot = await loadSnapshot(snapshotIdOrKey, { transaction, lock: transaction.LOCK.UPDATE });
    const completedAt = payload.completedAt ? new Date(payload.completedAt) : new Date();
    const verificationStatus = normalizedVerification ?? snapshot.verificationStatus ?? 'unverified';
    const verifiedAt = ['verified', 'failed'].includes(verificationStatus)
      ? new Date(payload.verifiedAt ?? Date.now())
      : snapshot.verifiedAt ?? null;
    const finalStatus =
      statusOverride ?? (verificationStatus === 'failed' ? 'failed' : 'success');
    const expiresAt =
      finalStatus === 'success'
        ? resolveExpiresAt({ ...snapshot.get(), completedAt }, retentionOverride)
        : null;
    const failureReason =
      finalStatus === 'failed'
        ? payload.failureReason ?? snapshot.failureReason ?? 'Backup verification failed.'
        : null;

    await snapshot.update(
      {
        status: finalStatus,
        completedAt,
        sizeBytes: payload.sizeBytes ?? snapshot.sizeBytes ?? null,
        checksum: payload.checksum ?? snapshot.checksum ?? null,
        checksumAlgorithm: payload.checksumAlgorithm ?? snapshot.checksumAlgorithm ?? null,
        storageUri: payload.storageUri ?? snapshot.storageUri ?? null,
        storageClass: payload.storageClass ?? snapshot.storageClass ?? null,
        storageLocationKey: payload.storageLocationKey ?? snapshot.storageLocationKey ?? null,
        retentionDays: retentionOverride ?? snapshot.retentionDays,
        verificationStatus,
        verifiedAt,
        expiresAt,
        failureReason,
        notes: payload.notes ?? snapshot.notes ?? null,
        metadata: buildAuditMetadata({ ...snapshot.metadata, ...(payload.metadata ?? {}) }, context),
      },
      { transaction },
    );

    logger.info?.({ snapshotKey: snapshot.snapshotKey }, 'Backup snapshot completed');
    return snapshot.toPublicObject();
  }, options);
}

export async function failBackupSnapshot(snapshotIdOrKey, payload = {}, context = {}, options = {}) {
  const failureReason = payload.failureReason ?? 'Backup failed without a specified reason.';
  const verificationStatus =
    assertInSet(
      payload.verificationStatus ?? 'failed',
      BACKUP_VERIFICATION_STATUSES,
      'Unsupported verification status.',
    ) ?? 'failed';

  return withTransaction(async (transaction) => {
    const snapshot = await loadSnapshot(snapshotIdOrKey, { transaction, lock: transaction.LOCK.UPDATE });
    await snapshot.update(
      {
        status: 'failed',
        failureReason,
        verificationStatus,
        completedAt: payload.completedAt ? new Date(payload.completedAt) : new Date(),
        metadata: buildAuditMetadata({ ...snapshot.metadata, ...(payload.metadata ?? {}) }, context),
      },
      { transaction },
    );

    logger.warn?.({ snapshotKey: snapshot.snapshotKey }, 'Backup snapshot failed');
    return snapshot.toPublicObject();
  }, options);
}

export async function verifyBackupSnapshot(snapshotIdOrKey, payload = {}, context = {}, options = {}) {
  const desiredVerification = payload.verificationStatus ?? payload.status ?? 'verified';
  const verificationStatus =
    assertInSet(desiredVerification, BACKUP_VERIFICATION_STATUSES, 'Unsupported verification status.') ?? 'verified';
  const backupStatusOverride = payload.backupStatus ?? payload.snapshotStatus ?? null;
  const normalizedBackupStatus = backupStatusOverride
    ? assertInSet(backupStatusOverride, BACKUP_STATUSES, 'Unsupported backup status override.')
    : null;
  const retentionOverrideRaw =
    payload.retentionDays != null ? Number.parseInt(payload.retentionDays, 10) : null;
  const retentionOverride =
    Number.isFinite(retentionOverrideRaw) && retentionOverrideRaw > 0 ? retentionOverrideRaw : null;

  return withTransaction(async (transaction) => {
    const snapshot = await loadSnapshot(snapshotIdOrKey, { transaction, lock: transaction.LOCK.UPDATE });
    const updates = {
      verificationStatus,
      verifiedAt: new Date(),
      metadata: buildAuditMetadata({ ...snapshot.metadata, verification: payload.metadata ?? {} }, context),
    };

    const derivedStatus =
      normalizedBackupStatus ??
      (verificationStatus === 'failed'
        ? 'failed'
        : verificationStatus === 'verified'
        ? 'success'
        : null);

    if (derivedStatus) {
      updates.status = derivedStatus;
      if (derivedStatus === 'failed') {
        updates.failureReason = payload.failureReason ?? snapshot.failureReason ?? 'Backup verification failed.';
        updates.expiresAt = null;
      } else if (derivedStatus === 'success') {
        updates.failureReason = payload.failureReason ?? null;
        updates.expiresAt = resolveExpiresAt(
          { ...snapshot.get(), completedAt: snapshot.completedAt ?? new Date() },
          retentionOverride,
        );
        if (retentionOverride != null) {
          updates.retentionDays = retentionOverride;
        }
      }
    } else if (payload.failureReason) {
      updates.failureReason = payload.failureReason;
    }

    if (retentionOverride != null && derivedStatus !== 'success') {
      updates.retentionDays = retentionOverride;
    }

    if (payload.notes !== undefined) {
      updates.notes = payload.notes;
    }

    await snapshot.update(
      updates,
      { transaction },
    );
    return snapshot.toPublicObject();
  }, options);
}

export async function listBackupSnapshots(filters = {}) {
  const where = {};
  if (filters.environment) {
    where.environment = filters.environment;
  }
  if (filters.status) {
    where.status = assertInSet(filters.status, BACKUP_STATUSES, 'Unsupported status filter.');
  }
  if (filters.verificationStatus) {
    where.verificationStatus = assertInSet(
      filters.verificationStatus,
      BACKUP_VERIFICATION_STATUSES,
      'Unsupported verification filter.',
    );
  }
  if (filters.source) {
    where.source = filters.source;
  }

  const snapshots = await BackupSnapshot.findAll({
    where,
    order: [
      ['completedAt', 'DESC'],
      ['startedAt', 'DESC'],
    ],
    limit: filters.limit ?? 100,
  });

  return snapshots.map((record) => record.toPublicObject());
}

export async function getBackupSnapshot(snapshotIdOrKey) {
  const snapshot = await loadSnapshot(snapshotIdOrKey);
  return snapshot.toPublicObject();
}

export async function scheduleRecoveryDrill(payload = {}, context = {}, options = {}) {
  const { drillKey, name, scenario, environment } = payload;
  if (!drillKey) {
    throw new ValidationError('drillKey is required to schedule a recovery drill.');
  }
  if (!name) {
    throw new ValidationError('name is required to schedule a recovery drill.');
  }
  if (!environment) {
    throw new ValidationError('environment is required to schedule a recovery drill.');
  }
  const normalizedScenario = scenario
    ? assertInSet(scenario, DRILL_SCENARIOS, 'Unsupported disaster recovery scenario.')
    : 'regional_outage';
  const normalizedStatus = payload.status
    ? assertInSet(payload.status, DRILL_STATUSES, 'Unsupported disaster recovery status.')
    : 'scheduled';

  const auditMetadata = buildAuditMetadata(payload.metadata, context);

  return withTransaction(async (transaction) => {
    const existing = await DisasterRecoveryDrill.findByKey(drillKey, { transaction, lock: transaction.LOCK.UPDATE });
    if (existing) {
      throw new ValidationError('A recovery drill with this key already exists.');
    }

    const drill = await DisasterRecoveryDrill.create(
      {
        drillKey,
        name,
        scenario: normalizedScenario,
        status: normalizedStatus,
        environment,
        region: payload.region ?? null,
        rtoMinutes: payload.rtoMinutes ?? null,
        rpoMinutes: payload.rpoMinutes ?? null,
        restoreDurationMs: payload.restoreDurationMs ?? null,
        dataLossSeconds: payload.dataLossSeconds ?? null,
        initiatedBy: payload.initiatedBy ?? context?.actor?.email ?? context?.actor?.id ?? null,
        initiatedFrom: payload.initiatedFrom ?? context?.channel ?? context?.source ?? null,
        startedAt: payload.startedAt ?? null,
        summary: payload.summary ?? null,
        issuesFound: Array.isArray(payload.issuesFound) ? payload.issuesFound : [],
        evidenceUri: payload.evidenceUri ?? null,
        metadata: auditMetadata,
      },
      { transaction },
    );

    logger.info?.({ drillKey }, 'Disaster recovery drill scheduled');
    return drill.toPublicObject();
  }, options);
}

export async function startRecoveryDrill(drillIdOrKey, payload = {}, context = {}, options = {}) {
  return withTransaction(async (transaction) => {
    const drill = await loadDrill(drillIdOrKey, { transaction, lock: transaction.LOCK.UPDATE });
    await drill.update(
      {
        status: 'running',
        startedAt: drill.startedAt ?? new Date(),
        restoreStartedAt: payload.restoreStartedAt ?? drill.restoreStartedAt ?? null,
        metadata: buildAuditMetadata(drill.metadata, context),
      },
      { transaction },
    );
    return drill.toPublicObject();
  }, options);
}

export async function completeRecoveryDrill(drillIdOrKey, payload = {}, context = {}, options = {}) {
  return withTransaction(async (transaction) => {
    const drill = await loadDrill(drillIdOrKey, { transaction, lock: transaction.LOCK.UPDATE });
    const completedAt = payload.completedAt ? new Date(payload.completedAt) : new Date();
    const verifiedAt = payload.verifiedAt ? new Date(payload.verifiedAt) : completedAt;
    const status = payload.status
      ? assertInSet(payload.status, DRILL_STATUSES, 'Unsupported disaster recovery status.') ?? 'passed'
      : 'passed';
    const restoreStartedAt = payload.restoreStartedAt
      ? new Date(payload.restoreStartedAt)
      : drill.restoreStartedAt ?? drill.startedAt ?? new Date(completedAt.getTime() - 30 * 60 * 1000);
    const restoreCompletedAt = payload.restoreCompletedAt
      ? new Date(payload.restoreCompletedAt)
      : drill.restoreCompletedAt ?? completedAt;
    const restoreDurationMs =
      payload.restoreDurationMs ??
      drill.restoreDurationMs ??
      computeDurationMs(restoreStartedAt ?? drill.startedAt, restoreCompletedAt);
    const computedRtoMinutes = resolveMinutesFromDuration(
      restoreDurationMs ?? computeDurationMs(drill.startedAt, completedAt),
    );
    const rtoMinutes = payload.rtoMinutes ?? computedRtoMinutes ?? drill.rtoMinutes ?? null;
    const rpoMinutes = payload.rpoMinutes ?? drill.rpoMinutes ?? null;
    const dataLossSeconds =
      payload.dataLossSeconds ??
      drill.dataLossSeconds ??
      resolveSecondsFromMinutes(rpoMinutes) ??
      0;

    await drill.update(
      {
        status,
        restoreCompletedAt,
        restoreStartedAt,
        restoreDurationMs,
        dataLossSeconds,
        completedAt,
        verifiedAt,
        rtoMinutes,
        rpoMinutes,
        summary: payload.summary ?? drill.summary ?? null,
        issuesFound: Array.isArray(payload.issuesFound) ? payload.issuesFound : drill.issuesFound ?? [],
        evidenceUri: payload.evidenceUri ?? drill.evidenceUri ?? null,
        metadata: buildAuditMetadata({ ...drill.metadata, ...(payload.metadata ?? {}) }, context),
      },
      { transaction },
    );

    logger.info?.({ drillKey: drill.drillKey }, 'Disaster recovery drill completed');
    return drill.toPublicObject();
  }, options);
}

export async function failRecoveryDrill(drillIdOrKey, payload = {}, context = {}, options = {}) {
  return withTransaction(async (transaction) => {
    const drill = await loadDrill(drillIdOrKey, { transaction, lock: transaction.LOCK.UPDATE });
    const completedAt = payload.completedAt ? new Date(payload.completedAt) : new Date();
    const restoreStartedAt = payload.restoreStartedAt
      ? new Date(payload.restoreStartedAt)
      : drill.restoreStartedAt ?? drill.startedAt ?? new Date(completedAt.getTime() - 30 * 60 * 1000);
    const restoreCompletedAt = payload.restoreCompletedAt
      ? new Date(payload.restoreCompletedAt)
      : drill.restoreCompletedAt ?? completedAt;
    const restoreDurationMs =
      payload.restoreDurationMs ??
      drill.restoreDurationMs ??
      computeDurationMs(restoreStartedAt ?? drill.startedAt, restoreCompletedAt);
    const computedRtoMinutes = resolveMinutesFromDuration(
      restoreDurationMs ?? computeDurationMs(drill.startedAt, completedAt),
    );
    const rpoMinutes = payload.rpoMinutes ?? drill.rpoMinutes ?? null;
    const rtoMinutes = payload.rtoMinutes ?? computedRtoMinutes ?? drill.rtoMinutes ?? null;
    const dataLossSeconds =
      payload.dataLossSeconds ??
      drill.dataLossSeconds ??
      resolveSecondsFromMinutes(rpoMinutes) ??
      null;

    await drill.update(
      {
        status: 'failed',
        completedAt,
        restoreStartedAt,
        restoreCompletedAt,
        restoreDurationMs,
        dataLossSeconds,
        issuesFound: Array.isArray(payload.issuesFound)
          ? payload.issuesFound
          : [...(drill.issuesFound ?? []), payload.failureReason ?? 'Unspecified failure'],
        summary: payload.summary ?? drill.summary ?? 'Recovery drill failed.',
        rtoMinutes,
        rpoMinutes,
        metadata: buildAuditMetadata({ ...drill.metadata, ...(payload.metadata ?? {}) }, context),
      },
      { transaction },
    );

    logger.warn?.({ drillKey: drill.drillKey }, 'Disaster recovery drill failed');
    return drill.toPublicObject();
  }, options);
}

export async function listRecoveryDrills(filters = {}) {
  const where = {};
  if (filters.environment) {
    where.environment = filters.environment;
  }
  if (filters.status) {
    where.status = assertInSet(filters.status, DRILL_STATUSES, 'Unsupported disaster recovery status.');
  }
  if (filters.scenario) {
    where.scenario = assertInSet(
      filters.scenario,
      DRILL_SCENARIOS,
      'Unsupported disaster recovery scenario.',
    );
  }

  const drills = await DisasterRecoveryDrill.findAll({
    where,
    order: [
      ['completedAt', 'DESC'],
      ['startedAt', 'DESC'],
    ],
    limit: filters.limit ?? 100,
  });

  return drills.map((record) => record.toPublicObject());
}

export async function getRecoveryDrill(drillIdOrKey) {
  const drill = await loadDrill(drillIdOrKey);
  return drill.toPublicObject();
}

export async function getBackupRecoveryOverview() {
  const [snapshots, drills] = await Promise.all([
    BackupSnapshot.findAll({ order: [['completedAt', 'DESC']], limit: 250 }),
    DisasterRecoveryDrill.findAll({ order: [['completedAt', 'DESC']], limit: 250 }),
  ]);

  const backupSummary = summarizeBackupHealth(snapshots.map((record) => record.get({ plain: true })));
  const drillSummary = summarizeDrillReadiness(drills.map((record) => record.get({ plain: true })));

  return {
    backups: {
      summary: backupSummary,
      recent: snapshots.slice(0, 10).map((record) => record.toPublicObject()),
    },
    drills: {
      summary: drillSummary,
      recent: drills.slice(0, 10).map((record) => record.toPublicObject()),
    },
  };
}

export default {
  scheduleBackupSnapshot,
  markBackupSnapshotRunning,
  completeBackupSnapshot,
  failBackupSnapshot,
  verifyBackupSnapshot,
  listBackupSnapshots,
  getBackupSnapshot,
  scheduleRecoveryDrill,
  startRecoveryDrill,
  completeRecoveryDrill,
  failRecoveryDrill,
  listRecoveryDrills,
  getRecoveryDrill,
  getBackupRecoveryOverview,
};
