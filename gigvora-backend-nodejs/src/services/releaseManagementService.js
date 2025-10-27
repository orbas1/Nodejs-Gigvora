import { Op } from 'sequelize';

import baseModels, {
  RELEASE_CHECKLIST_STATUSES,
  RELEASE_MONITOR_STATUSES,
  RELEASE_PHASE_STATUSES,
  RELEASE_PIPELINE_RUN_STATUSES,
  RELEASE_PIPELINE_STATUSES,
  RELEASE_SEGMENT_STATUSES,
} from '../models/releaseManagementModels.js';
import logger from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

let modelsContainer = baseModels;
let sequelizeInstance = baseModels.sequelize;
let log = logger.child({ component: 'releaseManagementService' });

function reinitialiseLogger(nextLogger) {
  if (nextLogger) {
    log = typeof nextLogger.child === 'function' ? nextLogger.child({ component: 'releaseManagementService' }) : nextLogger;
  } else {
    log = logger.child({ component: 'releaseManagementService' });
  }
}

export function __setDependencies({ models = baseModels, sequelize = models?.sequelize ?? baseModels.sequelize, logger: override } = {}) {
  modelsContainer = models ?? baseModels;
  sequelizeInstance = sequelize;
  reinitialiseLogger(override);
}

export function __resetDependencies() {
  modelsContainer = baseModels;
  sequelizeInstance = baseModels.sequelize;
  reinitialiseLogger();
}

function getModels(strict = false) {
  const container = modelsContainer ?? baseModels;
  if (strict && (!container || !container.ReleasePipeline)) {
    throw new Error('Release management models are not configured.');
  }
  return container;
}

function getSequelize(strict = false) {
  const instance = sequelizeInstance ?? getModels(strict).sequelize ?? baseModels.sequelize;
  if (strict && (!instance || typeof instance.transaction !== 'function')) {
    throw new Error('Sequelize instance is not configured.');
  }
  return instance;
}

const PHASE_STATUS_SET = new Set(RELEASE_PHASE_STATUSES);
const CHECKLIST_STATUS_SET = new Set(RELEASE_CHECKLIST_STATUSES);
const MONITOR_STATUS_SET = new Set(RELEASE_MONITOR_STATUSES);
const SEGMENT_STATUS_SET = new Set(RELEASE_SEGMENT_STATUSES);
const PIPELINE_RUN_STATUS_SET = new Set(RELEASE_PIPELINE_RUN_STATUSES);
const PIPELINE_STATUS_SET = new Set(RELEASE_PIPELINE_STATUSES);

function toIsoDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function normaliseKey(value, { fallbackPrefix, index }) {
  const raw = value ?? (fallbackPrefix ? `${fallbackPrefix}-${index + 1}` : '');
  if (!raw) {
    return '';
  }
  return `${raw}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function clampCoverage(value, { fallback = null } = {}) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  if (numeric < 0) {
    return 0;
  }
  if (numeric > 100) {
    return 100;
  }
  return Math.round(numeric * 100) / 100;
}

function resolvePipelineStatus(status, fallback = 'in_progress') {
  if (!status) {
    return fallback;
  }
  const lowered = `${status}`.trim().toLowerCase();
  if (PIPELINE_STATUS_SET.has(lowered)) {
    return lowered;
  }
  return fallback;
}

function computeActivePhaseKey(phases = []) {
  if (!Array.isArray(phases) || phases.length === 0) {
    return null;
  }
  const byOrder = [...phases].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  const inProgress = byOrder.find((phase) => phase.status === 'in_progress');
  if (inProgress) {
    return inProgress.key;
  }
  const attention = byOrder.find((phase) => phase.status === 'attention');
  if (attention) {
    return attention.key;
  }
  const blocked = byOrder.find((phase) => phase.status === 'blocked');
  if (blocked) {
    return blocked.key;
  }
  const pending = byOrder.find((phase) => phase.status === 'pending');
  if (pending) {
    return pending.key;
  }
  return byOrder[byOrder.length - 1]?.key ?? null;
}

function toPhasePayload(record) {
  const payload = record.toPublicObject();
  return {
    key: payload.key,
    name: payload.name,
    status: payload.status,
    owner: payload.owner,
    summary: payload.summary,
    coverage: payload.coverage,
    order: payload.order ?? record.orderIndex ?? 0,
    startedAt: payload.startedAt,
    completedAt: payload.completedAt,
  };
}

function toSegmentPayload(record) {
  const payload = record.toPublicObject();
  return {
    key: payload.key,
    name: payload.name,
    status: payload.status,
    owner: payload.owner,
    summary: payload.summary,
    coverage: payload.coverage,
  };
}

function toChecklistPayload(record) {
  const payload = record.toPublicObject();
  return {
    key: payload.key,
    name: payload.name,
    status: payload.status,
    owner: payload.owner,
    summary: payload.description,
    dueAt: payload.dueAt,
    completedAt: payload.completedAt,
  };
}

function toMonitorPayload(record) {
  const payload = record.toPublicObject();
  return {
    id: record.monitorKey ?? payload.key ?? record.id,
    key: payload.key ?? record.monitorKey ?? record.id,
    name: payload.name,
    description: payload.description,
    environment: payload.environment,
    status: payload.status,
    coverage: payload.coverage,
    metrics: payload.metrics,
    metadata: payload.metadata,
    lastSampleAt: payload.lastSampledAt,
  };
}

function toPipelineRunPayload(record) {
  const payload = record.toPublicObject();
  return {
    id: payload.id,
    pipelineKey: payload.pipelineKey,
    status: payload.status,
    startedAt: payload.startedAt,
    completedAt: payload.completedAt,
    durationMs: payload.durationMs,
    tasks: payload.tasks,
    metadata: payload.metadata,
  };
}

function computeChecklistSummary(items = []) {
  const total = items.length;
  const completed = items.filter((item) => item.status === 'complete').length;
  return { total, completed, items };
}

async function fetchActiveRelease({ transaction, lock = false, includeAssociations = true } = {}) {
  const models = getModels(true);
  const options = {
    where: { isActive: true },
    transaction,
  };
  if (includeAssociations) {
    options.include = [
      { model: models.ReleasePhase, as: 'phases' },
      { model: models.ReleaseSegment, as: 'segments' },
      { model: models.ReleaseChecklistItem, as: 'checklist' },
      { model: models.ReleaseMonitor, as: 'monitors' },
      { model: models.ReleasePipelineRun, as: 'pipelineRuns', separate: true, limit: 5, order: [['startedAt', 'DESC']] },
    ];
  }
  if (lock && transaction) {
    options.lock = transaction.LOCK.UPDATE;
  }
  return models.ReleasePipeline.findOne(options);
}

function buildReleaseSnapshot(releaseRecord) {
  if (!releaseRecord) {
    return {
      active: false,
      release: null,
      monitors: [],
      checklist: { total: 0, completed: 0, items: [] },
    };
  }

  const phases = (releaseRecord.phases ?? [])
    .map(toPhasePayload)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const segments = (releaseRecord.segments ?? []).map(toSegmentPayload);
  const checklistItems = (releaseRecord.checklist ?? []).map(toChecklistPayload);
  const monitors = (releaseRecord.monitors ?? []).map(toMonitorPayload);

  const activePhaseKey = releaseRecord.activePhaseKey ?? computeActivePhaseKey(releaseRecord.phases ?? []);

  return {
    active: true,
    release: {
      id: releaseRecord.id,
      key: releaseRecord.key,
      name: releaseRecord.name,
      version: releaseRecord.version ?? null,
      owner: releaseRecord.ownerName ?? null,
      ownerEmail: releaseRecord.ownerEmail ?? null,
      status: releaseRecord.status,
      startedAt: releaseRecord.startedAt?.toISOString?.() ?? null,
      targetCompletion: releaseRecord.targetReleaseAt?.toISOString?.() ?? null,
      releasedAt: releaseRecord.releasedAt?.toISOString?.() ?? null,
      releaseNotesUrl: releaseRecord.releaseNotesUrl ?? null,
      releaseNotesRef: releaseRecord.releaseNotesRef ?? null,
      metadata: releaseRecord.metadata ?? {},
      phase: activePhaseKey,
      phases,
      segments,
    },
    monitors,
    checklist: computeChecklistSummary(checklistItems),
  };
}

async function syncPhases(releaseId, phases = [], transaction) {
  const models = getModels(true);
  const existing = await models.ReleasePhase.findAll({ where: { releaseId }, transaction });
  const existingMap = new Map(existing.map((entry) => [entry.key, entry]));
  const retained = new Set();

  for (let index = 0; index < phases.length; index += 1) {
    const phasePayload = phases[index] ?? {};
    const key = normaliseKey(phasePayload.key ?? phasePayload.id ?? phasePayload.name, {
      fallbackPrefix: 'phase',
      index,
    });
    if (!key) {
      throw new ValidationError('Each phase requires a key or name.');
    }
    const status = PHASE_STATUS_SET.has((phasePayload.status ?? '').toLowerCase())
      ? phasePayload.status.toLowerCase()
      : 'pending';
    const coverage = clampCoverage(phasePayload.coverage ?? phasePayload.coveragePercent, { fallback: 0 });
    const attributes = {
      releaseId,
      key,
      name: phasePayload.name ?? key,
      summary: phasePayload.summary ?? null,
      ownerName: phasePayload.owner ?? phasePayload.ownerName ?? null,
      status,
      coveragePercent: coverage ?? 0,
      orderIndex: index,
      startedAt: toIsoDate(phasePayload.startedAt),
      completedAt: toIsoDate(phasePayload.completedAt),
    };

    const record = existingMap.get(key);
    if (record) {
      await record.update(attributes, { transaction });
    } else {
      await models.ReleasePhase.create(attributes, { transaction });
    }
    retained.add(key);
  }

  const removeIds = existing.filter((record) => !retained.has(record.key)).map((record) => record.id);
  if (removeIds.length) {
    await models.ReleasePhase.destroy({ where: { id: removeIds }, transaction });
  }
}

async function syncSegments(releaseId, segments = [], transaction) {
  const models = getModels(true);
  const existing = await models.ReleaseSegment.findAll({ where: { releaseId }, transaction });
  const existingMap = new Map(existing.map((entry) => [entry.key, entry]));
  const retained = new Set();

  for (let index = 0; index < segments.length; index += 1) {
    const segmentPayload = segments[index] ?? {};
    const key = normaliseKey(segmentPayload.key ?? segmentPayload.id ?? segmentPayload.name, {
      fallbackPrefix: 'segment',
      index,
    });
    if (!key) {
      throw new ValidationError('Each segment requires a key or name.');
    }
    const status = SEGMENT_STATUS_SET.has((segmentPayload.status ?? '').toLowerCase())
      ? segmentPayload.status.toLowerCase()
      : 'pending';
    const attributes = {
      releaseId,
      key,
      name: segmentPayload.name ?? key,
      summary: segmentPayload.summary ?? null,
      ownerName: segmentPayload.owner ?? segmentPayload.ownerName ?? null,
      status,
      coveragePercent: clampCoverage(segmentPayload.coverage ?? segmentPayload.coveragePercent, { fallback: 0 }) ?? 0,
    };
    const record = existingMap.get(key);
    if (record) {
      await record.update(attributes, { transaction });
    } else {
      await models.ReleaseSegment.create(attributes, { transaction });
    }
    retained.add(key);
  }

  const removeIds = existing.filter((record) => !retained.has(record.key)).map((record) => record.id);
  if (removeIds.length) {
    await models.ReleaseSegment.destroy({ where: { id: removeIds }, transaction });
  }
}

async function syncChecklist(releaseId, checklist = [], transaction) {
  const models = getModels(true);
  const existing = await models.ReleaseChecklistItem.findAll({ where: { releaseId }, transaction });
  const existingMap = new Map(existing.map((entry) => [entry.key, entry]));
  const retained = new Set();

  for (let index = 0; index < checklist.length; index += 1) {
    const itemPayload = checklist[index] ?? {};
    const key = normaliseKey(itemPayload.key ?? itemPayload.id ?? itemPayload.name, {
      fallbackPrefix: 'item',
      index,
    });
    if (!key) {
      throw new ValidationError('Each checklist item requires a key or name.');
    }
    const status = CHECKLIST_STATUS_SET.has((itemPayload.status ?? '').toLowerCase())
      ? itemPayload.status.toLowerCase()
      : 'pending';
    const attributes = {
      releaseId,
      key,
      name: itemPayload.name ?? key,
      description: itemPayload.summary ?? itemPayload.description ?? null,
      ownerName: itemPayload.owner ?? itemPayload.ownerName ?? null,
      status,
      dueAt: toIsoDate(itemPayload.dueAt ?? itemPayload.due_at),
      completedAt: status === 'complete' ? toIsoDate(itemPayload.completedAt ?? itemPayload.completed_at ?? new Date()) : toIsoDate(itemPayload.completedAt ?? itemPayload.completed_at),
    };
    const record = existingMap.get(key);
    if (record) {
      await record.update(attributes, { transaction });
    } else {
      await models.ReleaseChecklistItem.create(attributes, { transaction });
    }
    retained.add(key);
  }

  const removeIds = existing.filter((record) => !retained.has(record.key)).map((record) => record.id);
  if (removeIds.length) {
    await models.ReleaseChecklistItem.destroy({ where: { id: removeIds }, transaction });
  }
}

async function appendEvent({ releaseId, eventType, resourceKey, status, summary, actorName, actorRole, payload = {}, transaction }) {
  const models = getModels(true);
  await models.ReleaseEvent.create(
    {
      releaseId: releaseId ?? null,
      eventType,
      resourceKey: resourceKey ?? null,
      status: status ?? null,
      summary: summary ?? null,
      actorName: actorName ?? null,
      actorRole: actorRole ?? null,
      payload,
      occurredAt: new Date(),
    },
    { transaction },
  );
}

export async function getReleaseRolloutSnapshot() {
  const releaseRecord = await fetchActiveRelease({ includeAssociations: true });
  return buildReleaseSnapshot(releaseRecord);
}

export async function getReleaseState({ limitEvents = 20, limitPipelineRuns = 5 } = {}) {
  const models = getModels(true);
  const releaseRecord = await fetchActiveRelease({ includeAssociations: true });
  const snapshot = buildReleaseSnapshot(releaseRecord);

  const releaseId = releaseRecord?.id ?? null;
  const [events, pipelineRuns] = await Promise.all([
    releaseId
      ? models.ReleaseEvent.findAll({
          where: { releaseId },
          order: [['occurredAt', 'DESC']],
          limit: limitEvents,
        })
      : [],
    releaseId
      ? models.ReleasePipelineRun.findAll({
          where: { releaseId },
          order: [['startedAt', 'DESC']],
          limit: limitPipelineRuns,
        })
      : [],
  ]);

  return {
    ...snapshot,
    release: snapshot.release,
    monitors: snapshot.monitors,
    checklist: snapshot.checklist,
    pipelineRuns: pipelineRuns.map(toPipelineRunPayload),
    events: events.map((event) => event.toPublicObject()),
  };
}

export async function upsertActiveRelease(payload = {}) {
  const sequelize = getSequelize(true);
  const models = getModels(true);

  const key = normaliseKey(payload.key ?? payload.id ?? payload.version ?? payload.name, {
    fallbackPrefix: 'release',
    index: 0,
  });

  if (!key) {
    throw new ValidationError('key or name must be provided to upsert a release.');
  }

  const name = `${payload.name ?? key}`.trim();
  if (!name) {
    throw new ValidationError('Release name cannot be empty.');
  }

  const status = resolvePipelineStatus(payload.status);

  const transaction = await sequelize.transaction();
  try {
    await models.ReleasePipeline.update(
      { isActive: false },
      { where: { key: { [Op.ne]: key } }, transaction },
    );

    let releaseRecord = await models.ReleasePipeline.findOne({ where: { key }, transaction, lock: transaction.LOCK.UPDATE });
    const metadata = payload.metadata && typeof payload.metadata === 'object' ? { ...payload.metadata } : {};

    if (releaseRecord) {
      releaseRecord.set({
        name,
        version: payload.version ?? releaseRecord.version ?? null,
        summary: payload.summary ?? releaseRecord.summary ?? null,
        ownerName: payload.owner ?? payload.ownerName ?? releaseRecord.ownerName ?? null,
        ownerEmail: payload.ownerEmail ?? releaseRecord.ownerEmail ?? null,
        status,
        isActive: true,
        startedAt: toIsoDate(payload.startedAt) ?? releaseRecord.startedAt,
        targetReleaseAt: toIsoDate(payload.targetCompletion ?? payload.targetReleaseAt) ?? releaseRecord.targetReleaseAt,
        releasedAt: toIsoDate(payload.releasedAt) ?? releaseRecord.releasedAt,
        releaseNotesUrl: payload.releaseNotesUrl ?? releaseRecord.releaseNotesUrl ?? null,
        releaseNotesRef: payload.releaseNotesRef ?? releaseRecord.releaseNotesRef ?? null,
        metadata: { ...(releaseRecord.metadata ?? {}), ...metadata },
      });
      await releaseRecord.save({ transaction });
    } else {
      releaseRecord = await models.ReleasePipeline.create(
        {
          key,
          name,
          version: payload.version ?? null,
          summary: payload.summary ?? null,
          ownerName: payload.owner ?? payload.ownerName ?? null,
          ownerEmail: payload.ownerEmail ?? null,
          status,
          isActive: true,
          startedAt: toIsoDate(payload.startedAt),
          targetReleaseAt: toIsoDate(payload.targetCompletion ?? payload.targetReleaseAt),
          releasedAt: toIsoDate(payload.releasedAt),
          releaseNotesUrl: payload.releaseNotesUrl ?? null,
          releaseNotesRef: payload.releaseNotesRef ?? null,
          metadata,
        },
        { transaction },
      );
    }

    if (Array.isArray(payload.phases)) {
      await syncPhases(releaseRecord.id, payload.phases, transaction);
    }
    if (Array.isArray(payload.segments)) {
      await syncSegments(releaseRecord.id, payload.segments, transaction);
    }
    if (Array.isArray(payload.checklist)) {
      await syncChecklist(releaseRecord.id, payload.checklist, transaction);
    }

    const freshPhases = await models.ReleasePhase.findAll({ where: { releaseId: releaseRecord.id }, transaction });
    releaseRecord.activePhaseKey = computeActivePhaseKey(freshPhases);
    await releaseRecord.save({ transaction });

    const reloaded = await models.ReleasePipeline.findByPk(releaseRecord.id, {
      include: [
        { model: models.ReleasePhase, as: 'phases' },
        { model: models.ReleaseSegment, as: 'segments' },
        { model: models.ReleaseChecklistItem, as: 'checklist' },
      ],
      transaction,
    });

    await transaction.commit();
    return reloaded.toPublicObject();
  } catch (error) {
    await transaction.rollback();
    log.error({ err: error, key }, 'Failed to upsert active release');
    throw error;
  }
}

export async function markReleasePhaseStatus(
  phaseKey,
  status,
  { actor = null, summary = null, coverage = null } = {},
) {
  const sequelize = getSequelize(true);
  const models = getModels(true);

  if (!phaseKey) {
    throw new ValidationError('phaseKey is required.');
  }

  const nextStatus = PHASE_STATUS_SET.has((status ?? '').toLowerCase()) ? status.toLowerCase() : 'pending';

  const transaction = await sequelize.transaction();
  try {
    const releaseRecord = await fetchActiveRelease({ transaction, lock: true, includeAssociations: false });
    if (!releaseRecord) {
      throw new NotFoundError('No active release configured.');
    }

    const phaseRecord = await models.ReleasePhase.findOne({
      where: { releaseId: releaseRecord.id, key: phaseKey },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!phaseRecord) {
      throw new NotFoundError(`Unknown release phase: ${phaseKey}`);
    }

    const now = new Date();
    const nextCoverage = coverage == null ? phaseRecord.coveragePercent : clampCoverage(coverage, { fallback: phaseRecord.coveragePercent });

    phaseRecord.status = nextStatus;
    phaseRecord.coveragePercent = nextCoverage ?? phaseRecord.coveragePercent;
    if (summary) {
      phaseRecord.summary = summary;
    }
    if (nextStatus === 'in_progress' && !phaseRecord.startedAt) {
      phaseRecord.startedAt = now;
    }
    if (nextStatus === 'complete') {
      phaseRecord.completedAt = now;
      if (phaseRecord.coveragePercent == null) {
        phaseRecord.coveragePercent = 100;
      }
    }

    await phaseRecord.save({ transaction });

    const allPhases = await models.ReleasePhase.findAll({ where: { releaseId: releaseRecord.id }, transaction });
    releaseRecord.activePhaseKey = computeActivePhaseKey(allPhases);
    releaseRecord.status = releaseRecord.status ?? 'in_progress';
    await releaseRecord.save({ transaction });

    await appendEvent({
      releaseId: releaseRecord.id,
      eventType: 'phase_status',
      resourceKey: phaseKey,
      status: nextStatus,
      summary: summary ?? null,
      actorName: actor ?? null,
      actorRole: actor ? 'automation' : null,
      payload: {
        coverage: phaseRecord.coveragePercent == null ? null : Number.parseFloat(phaseRecord.coveragePercent),
      },
      transaction,
    });

    await transaction.commit();
    return toPhasePayload(phaseRecord);
  } catch (error) {
    await transaction.rollback();
    log.error({ err: error, phaseKey }, 'Failed to update release phase status');
    throw error;
  }
}

export async function markChecklistItemStatus(
  checklistKey,
  status,
  { actor = null, summary = null } = {},
) {
  const sequelize = getSequelize(true);
  const models = getModels(true);

  if (!checklistKey) {
    throw new ValidationError('checklistKey is required.');
  }

  const nextStatus = CHECKLIST_STATUS_SET.has((status ?? '').toLowerCase()) ? status.toLowerCase() : 'pending';

  const transaction = await sequelize.transaction();
  try {
    const releaseRecord = await fetchActiveRelease({ transaction, lock: true, includeAssociations: false });
    if (!releaseRecord) {
      throw new NotFoundError('No active release configured.');
    }

    const itemRecord = await models.ReleaseChecklistItem.findOne({
      where: { releaseId: releaseRecord.id, key: checklistKey },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!itemRecord) {
      throw new NotFoundError(`Unknown checklist item: ${checklistKey}`);
    }

    const now = new Date();
    itemRecord.status = nextStatus;
    if (summary) {
      itemRecord.description = summary;
    }
    if (nextStatus === 'complete') {
      itemRecord.completedAt = now;
    }
    await itemRecord.save({ transaction });

    await appendEvent({
      releaseId: releaseRecord.id,
      eventType: 'checklist_status',
      resourceKey: checklistKey,
      status: nextStatus,
      summary: summary ?? null,
      actorName: actor ?? null,
      actorRole: actor ? 'automation' : null,
      payload: {},
      transaction,
    });

    await transaction.commit();
    return toChecklistPayload(itemRecord);
  } catch (error) {
    await transaction.rollback();
    log.error({ err: error, checklistKey }, 'Failed to update checklist item status');
    throw error;
  }
}

export async function recordMonitorSample(
  monitorKey,
  { name = null, status = 'unknown', environment = 'production', metrics = {}, coverage = null, trend = null, description = null, metadata = {}, releaseId: explicitReleaseId = null } = {},
) {
  if (!monitorKey) {
    throw new ValidationError('monitorKey is required.');
  }

  const sequelize = getSequelize(true);
  const models = getModels(true);

  const nextStatus = MONITOR_STATUS_SET.has((status ?? '').toLowerCase()) ? status.toLowerCase() : 'unknown';
  const nextEnvironment = `${environment ?? 'production'}`.trim() || 'production';
  const transaction = await sequelize.transaction();
  try {
    let releaseRecord = null;
    if (explicitReleaseId) {
      releaseRecord = await models.ReleasePipeline.findByPk(explicitReleaseId, { transaction });
    }
    if (!releaseRecord) {
      releaseRecord = await fetchActiveRelease({ transaction, lock: false, includeAssociations: false });
    }

    let monitorRecord = await models.ReleaseMonitor.findOne({
      where: { monitorKey },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const now = new Date();
    if (monitorRecord) {
      monitorRecord.set({
        name: name ?? monitorRecord.name ?? monitorKey,
        description: description ?? monitorRecord.description ?? null,
        environment: nextEnvironment,
        status: nextStatus,
        coveragePercent:
          coverage == null ? monitorRecord.coveragePercent : clampCoverage(coverage, { fallback: monitorRecord.coveragePercent }),
        metrics: { ...(monitorRecord.metrics ?? {}), ...(metrics ?? {}) },
        metadata: { ...(monitorRecord.metadata ?? {}), ...(metadata ?? {}) },
        lastSampledAt: now,
      });
      if (releaseRecord && !monitorRecord.releaseId) {
        monitorRecord.releaseId = releaseRecord.id;
      }
      await monitorRecord.save({ transaction });
    } else {
      monitorRecord = await models.ReleaseMonitor.create(
        {
          releaseId: releaseRecord?.id ?? null,
          monitorKey,
          name: name ?? monitorKey,
          description,
          environment: nextEnvironment,
          status: nextStatus,
          coveragePercent: clampCoverage(coverage),
          metrics: metrics ?? {},
          metadata: metadata ?? (trend ? { trend } : {}),
          lastSampledAt: now,
        },
        { transaction },
      );
    }

    await appendEvent({
      releaseId: monitorRecord.releaseId ?? releaseRecord?.id ?? null,
      eventType: 'monitor_sample',
      resourceKey: monitorKey,
      status: nextStatus,
      summary: description ?? null,
      actorName: 'MonitorCollector',
      actorRole: 'automation',
      payload: {
        metrics: monitorRecord.metrics,
        coverage: monitorRecord.coveragePercent == null ? null : Number.parseFloat(monitorRecord.coveragePercent),
      },
      transaction,
    });

    await transaction.commit();
    return toMonitorPayload(monitorRecord);
  } catch (error) {
    await transaction.rollback();
    log.error({ err: error, monitorKey }, 'Failed to record monitor sample');
    throw error;
  }
}

export async function recordPipelineRunResult(
  pipelineKey,
  { status, startedAt = new Date(), completedAt = null, durationMs = null, tasks = [], metadata = {} } = {},
  { releaseId: explicitReleaseId = null } = {},
) {
  if (!pipelineKey) {
    throw new ValidationError('pipelineKey is required.');
  }

  const nextStatus = PIPELINE_RUN_STATUS_SET.has((status ?? '').toLowerCase()) ? status.toLowerCase() : 'failed';

  const sequelize = getSequelize(true);
  const models = getModels(true);

  const transaction = await sequelize.transaction();
  try {
    let releaseRecord = null;
    if (explicitReleaseId) {
      releaseRecord = await models.ReleasePipeline.findByPk(explicitReleaseId, { transaction });
    }
    if (!releaseRecord) {
      releaseRecord = await fetchActiveRelease({ transaction, lock: false, includeAssociations: false });
    }

    const pipelineRun = await models.ReleasePipelineRun.create(
      {
        releaseId: releaseRecord?.id ?? null,
        pipelineKey,
        status: nextStatus,
        startedAt: toIsoDate(startedAt) ?? new Date(),
        completedAt: toIsoDate(completedAt),
        durationMs: durationMs == null ? null : Number(durationMs),
        tasks: Array.isArray(tasks) ? tasks : [],
        metadata: metadata && typeof metadata === 'object' ? { ...metadata } : {},
      },
      { transaction },
    );

    await appendEvent({
      releaseId: pipelineRun.releaseId,
      eventType: 'pipeline_run',
      resourceKey: pipelineKey,
      status: nextStatus,
      summary:
        nextStatus === 'passed'
          ? 'Pipeline run completed successfully.'
          : nextStatus === 'running'
            ? 'Pipeline run started.'
            : 'Pipeline run completed with failures.',
      actorName: metadata?.triggeredBy ?? 'CI Orchestrator',
      actorRole: 'automation',
      payload: {
        durationMs: pipelineRun.durationMs,
        tasks: pipelineRun.tasks,
      },
      transaction,
    });

    await transaction.commit();
    return toPipelineRunPayload(pipelineRun);
  } catch (error) {
    await transaction.rollback();
    log.error({ err: error, pipelineKey }, 'Failed to record pipeline run result');
    throw error;
  }
}

export async function getPipelineRunHistory({ pipelineKey = null, limit = 5 } = {}) {
  const models = getModels(true);
  const where = {};
  if (pipelineKey) {
    where.pipelineKey = pipelineKey;
  }
  const runs = await models.ReleasePipelineRun.findAll({
    where,
    order: [['startedAt', 'DESC']],
    limit,
  });
  return runs.map(toPipelineRunPayload);
}

export async function listRecentReleaseEvents({ limit = 20 } = {}) {
  const models = getModels(true);
  const releaseRecord = await fetchActiveRelease({ includeAssociations: false });
  if (!releaseRecord) {
    return [];
  }
  const events = await models.ReleaseEvent.findAll({
    where: { releaseId: releaseRecord.id },
    order: [['occurredAt', 'DESC']],
    limit,
  });
  return events.map((event) => event.toPublicObject());
}

export default {
  getReleaseRolloutSnapshot,
  getReleaseState,
  upsertActiveRelease,
  markReleasePhaseStatus,
  markChecklistItemStatus,
  recordMonitorSample,
  recordPipelineRunResult,
  getPipelineRunHistory,
  listRecentReleaseEvents,
};
