import { Op } from 'sequelize';
import { sequelize, Project, AutoAssignQueueEntry, ProjectAssignmentEvent, User } from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { normalizeLocationPayload, areGeoLocationsEqual } from '../utils/location.js';
import { buildAssignmentQueue, getProjectQueue } from './autoAssignService.js';
import { initializeWorkspaceForProject } from './projectWorkspaceService.js';
import { getMarketplaceDomainService } from '../domains/serviceCatalog.js';

const DEFAULT_AUTO_ASSIGN_LIMIT = 12;
const marketplaceDomainService = getMarketplaceDomainService();
const AUTO_ASSIGN_REGEN_EVENT_TYPES = [
  'auto_assign_queue_generated',
  'auto_assign_queue_regenerated',
  'auto_assign_queue_exhausted',
  'auto_assign_queue_failed',
];
const METRICS_CACHE_TTL_MS = 60 * 1000;

let metricsCache = { value: null, expiresAt: 0 };

function sanitizeActor(actorInstance) {
  if (!actorInstance) {
    return null;
  }
  const plain = actorInstance.get ? actorInstance.get({ plain: true }) : actorInstance;
  return {
    id: plain.id,
    firstName: plain.firstName ?? null,
    lastName: plain.lastName ?? null,
    email: plain.email ?? null,
    userType: plain.userType ?? null,
  };
}

function invalidateAutoAssignMetricsCache() {
  metricsCache = { value: null, expiresAt: 0 };
}

function sanitizeProject(projectInstance) {
  if (!projectInstance) {
    return null;
  }
  return projectInstance.toPublicObject?.() ?? projectInstance.get({ plain: true });
}

function normalizeBudgetAmount(input) {
  if (input == null || input === '') {
    return null;
  }
  const numeric = Number(input);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new ValidationError('budgetAmount must be a positive number when provided.');
  }
  return Number(numeric.toFixed(2));
}

function normalizeCurrency(input) {
  if (input == null || input === '') {
    return null;
  }
  if (typeof input !== 'string') {
    throw new ValidationError('budgetCurrency must be a string if provided.');
  }
  const trimmed = input.trim().toUpperCase();
  if (!trimmed) {
    return null;
  }
  if (!/^[A-Z]{3}$/.test(trimmed)) {
    throw new ValidationError('budgetCurrency must be a 3-letter ISO code.');
  }
  return trimmed;
}

function calculateMedian(values = []) {
  if (!values.length) {
    return null;
  }
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

function roundNumber(value, precision = 2) {
  if (!Number.isFinite(value)) {
    return null;
  }
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function normaliseWeights(weights = {}) {
  if (!weights || typeof weights !== 'object') {
    return null;
  }
  const filtered = Object.entries(weights).reduce((acc, [key, value]) => {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric >= 0) {
      acc[key] = numeric;
    }
    return acc;
  }, {});
  if (!Object.keys(filtered).length) {
    return null;
  }
  const total = Object.values(filtered).reduce((sum, weight) => sum + weight, 0);
  if (!total) {
    return null;
  }
  return Object.fromEntries(
    Object.entries(filtered).map(([key, weight]) => [key, Number((weight / total).toFixed(6))]),
  );
}

function normalizeAutoAssignSettings(input = {}, fallback = {}) {
  const rawLimit = input.limit ?? fallback.limit ?? DEFAULT_AUTO_ASSIGN_LIMIT;
  const limitNumber = Number(rawLimit);
  const normalizedLimit = Number.isFinite(limitNumber) && limitNumber > 0 ? limitNumber : DEFAULT_AUTO_ASSIGN_LIMIT;

  const rawExpires = input.expiresInMinutes ?? fallback.expiresInMinutes ?? 180;
  const expiresNumber = Number(rawExpires);
  const normalizedExpires = Number.isFinite(expiresNumber) && expiresNumber > 0 ? expiresNumber : 180;

  const inputFairness = input.fairness ?? {};
  const fallbackFairness = fallback.fairness ?? {};

  const ensureNewcomer =
    inputFairness.ensureNewcomer !== undefined
      ? Boolean(inputFairness.ensureNewcomer)
      : fallbackFairness.ensureNewcomer !== undefined
      ? Boolean(fallbackFairness.ensureNewcomer)
      : true;

  const fallbackMaxRaw =
    fallbackFairness.maxAssignments ?? fallbackFairness.maxAssignmentsForPriority ?? 3;
  const fallbackMaxNumeric = Number(fallbackMaxRaw);
  const fallbackMax = Number.isFinite(fallbackMaxNumeric) ? Math.max(0, fallbackMaxNumeric) : 3;

  const requestedMaxRaw =
    inputFairness.maxAssignments ?? inputFairness.maxAssignmentsForPriority ?? fallbackMax;
  const requestedMaxNumeric = Number(requestedMaxRaw);
  const normalizedMaxAssignments = Number.isFinite(requestedMaxNumeric)
    ? Math.max(0, requestedMaxNumeric)
    : fallbackMax;

  const windowDaysRaw = inputFairness.windowDays ?? fallbackFairness.windowDays ?? null;
  const windowDaysNumeric = Number(windowDaysRaw);
  const normalizedWindowDays = Number.isFinite(windowDaysNumeric) && windowDaysNumeric > 0
    ? Math.round(windowDaysNumeric)
    : null;

  const settings = {
    limit: Math.max(1, Math.min(normalizedLimit, 100)),
    expiresInMinutes: Math.max(30, Math.min(normalizedExpires, 1440)),
    fairness: {
      ensureNewcomer,
      maxAssignments: normalizedMaxAssignments,
      maxAssignmentsForPriority: normalizedMaxAssignments,
    },
    weights: null,
  };

  if (normalizedWindowDays != null) {
    settings.fairness.windowDays = normalizedWindowDays;
  }

  const mergedWeights = normaliseWeights({ ...(fallback.weights ?? {}), ...(input.weights ?? {}) });
  if (mergedWeights) {
    settings.weights = mergedWeights;
  }

  return settings;
}

function extractAutoAssignSettingsPayload(input = {}) {
  if (!input || typeof input !== 'object') {
    return {};
  }
  if (input.settings && typeof input.settings === 'object') {
    return input.settings;
  }
  const payload = {};
  if (input.limit !== undefined) payload.limit = input.limit;
  if (input.expiresInMinutes !== undefined) payload.expiresInMinutes = input.expiresInMinutes;
  if (input.fairness !== undefined) payload.fairness = input.fairness;
  if (input.weights !== undefined) payload.weights = input.weights;
  return payload;
}

function queueProjectEvent(eventQueue, projectId, actorId, eventType, payload) {
  eventQueue.push({
    projectId,
    actorId: actorId ?? null,
    eventType,
    payload,
  });
}

function registerEventsAfterCommit(transaction, events) {
  if (!events.length) {
    return;
  }
  transaction.afterCommit(async () => {
    for (const event of events) {
      try {
        await ProjectAssignmentEvent.create(event);
      } catch (error) {
        error.message = `Failed to persist project event: ${error.message}`;
        throw error;
      }
    }
  });
}

async function enableAutoAssignForProject({
  project,
  actorId,
  settingsInput = {},
  fallbackSettings = {},
  transaction,
  events,
  emitEnabledEvent = false,
  queueEventType = 'auto_assign_queue_generated',
  projectValueOverride,
}) {
  const normalizedSettings = normalizeAutoAssignSettings(settingsInput, fallbackSettings);
  if (emitEnabledEvent) {
    queueProjectEvent(events, project.id, actorId, 'auto_assign_enabled', normalizedSettings);
  }

  const queueEntries = await buildAssignmentQueue({
    targetType: 'project',
    targetId: project.id,
    projectValue: projectValueOverride ?? project.budgetAmount ?? null,
    limit: normalizedSettings.limit,
    expiresInMinutes: normalizedSettings.expiresInMinutes,
    actorId,
    weightOverrides: normalizedSettings.weights ?? undefined,
    fairnessConfig: normalizedSettings.fairness,
    transaction,
  });

  const queueStatus = queueEntries.length ? 'queue_active' : 'awaiting_candidates';
  await project.update(
    {
      autoAssignEnabled: true,
      autoAssignStatus: queueStatus,
      autoAssignSettings: normalizedSettings,
      autoAssignLastRunAt: new Date(),
      autoAssignLastQueueSize: queueEntries.length,
    },
    { transaction },
  );

  const queueEventTypeToPersist = queueEntries.length ? queueEventType : 'auto_assign_queue_exhausted';
  queueProjectEvent(events, project.id, actorId, queueEventTypeToPersist, {
    queueSize: queueEntries.length,
    settings: normalizedSettings,
  });

  invalidateAutoAssignMetricsCache();

  return { queueEntries, normalizedSettings };
}

async function disableAutoAssignForProject({
  project,
  actorId,
  settingsInput = {},
  fallbackSettings = {},
  transaction,
  events,
}) {
  const normalizedSettings = normalizeAutoAssignSettings(settingsInput, fallbackSettings);
  await expireOpenQueueEntries(project.id, transaction);
  await project.update(
    {
      autoAssignEnabled: false,
      autoAssignStatus: 'inactive',
      autoAssignSettings: normalizedSettings,
      autoAssignLastQueueSize: 0,
    },
    { transaction },
  );
  queueProjectEvent(events, project.id, actorId, 'auto_assign_disabled', normalizedSettings);
  invalidateAutoAssignMetricsCache();
  return { queueEntries: [], normalizedSettings };
}

async function expireOpenQueueEntries(projectId, transaction) {
  await AutoAssignQueueEntry.update(
    { status: 'expired', resolvedAt: new Date() },
    {
      where: {
        targetType: 'project',
        targetId: projectId,
        status: { [Op.in]: ['pending', 'notified'] },
      },
      transaction,
    },
  );
}

export async function createProject(payload = {}, { actorId } = {}) {
  const title = payload.title?.trim();
  const description = payload.description?.trim();
  if (!title) {
    throw new ValidationError('title is required.');
  }
  if (!description) {
    throw new ValidationError('description is required.');
  }

  const status = payload.status?.trim() || 'draft';
  const locationPayload = normalizeLocationPayload({
    location: payload.location,
    geoLocation: payload.geoLocation,
  });
  const location = locationPayload.location;
  const geoLocation = locationPayload.geoLocation;
  const budgetAmount = normalizeBudgetAmount(payload.budgetAmount);
  const budgetCurrency = normalizeCurrency(payload.budgetCurrency);
  const autoAssignInput = payload.autoAssign ?? {};
  const autoAssignSettings = normalizeAutoAssignSettings(autoAssignInput);
  const enableAutoAssign = Boolean(autoAssignInput.enabled);

  return sequelize.transaction(async (transaction) => {
    const project = await Project.create(
      {
        title,
        description,
        status,
        location,
        geoLocation,
        budgetAmount,
        budgetCurrency,
        autoAssignEnabled: enableAutoAssign,
        autoAssignStatus: enableAutoAssign ? 'queue_pending' : 'inactive',
        autoAssignSettings: enableAutoAssign ? autoAssignSettings : autoAssignSettings ?? null,
      },
      { transaction },
    );

    await initializeWorkspaceForProject(project, { transaction, actorId });

    const eventsToPersist = [];
    queueProjectEvent(eventsToPersist, project.id, actorId, 'created', {
      status,
      location,
      budgetAmount,
      budgetCurrency,
    });

    let queueEntries = [];
    if (enableAutoAssign) {
      const result = await enableAutoAssignForProject({
        project,
        actorId,
        settingsInput: autoAssignSettings,
        fallbackSettings: {},
        transaction,
        events: eventsToPersist,
        emitEnabledEvent: true,
        queueEventType: 'auto_assign_queue_generated',
        projectValueOverride: budgetAmount,
      });
      queueEntries = result.queueEntries;
    }

    registerEventsAfterCommit(transaction, eventsToPersist);
    await project.reload({ transaction });
    return {
      project: sanitizeProject(project),
      queueEntries,
    };
  });
}

export async function updateProjectAutoAssign(projectId, update = {}, { actorId } = {}) {
  if (!projectId) {
    throw new ValidationError('projectId is required.');
  }

  const enableAutoAssign = update.enabled !== undefined ? Boolean(update.enabled) : undefined;
  const settingsInput = update.settings ?? {};

  return sequelize.transaction(async (transaction) => {
    const project = await Project.findByPk(projectId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!project) {
      throw new NotFoundError('Project not found.');
    }

    const eventsToPersist = [];
    const normalizedSettings = normalizeAutoAssignSettings(settingsInput, project.autoAssignSettings ?? {});

    if (enableAutoAssign === false) {
      await disableAutoAssignForProject({
        project,
        actorId,
        settingsInput: normalizedSettings,
        fallbackSettings: project.autoAssignSettings ?? {},
        transaction,
        events: eventsToPersist,
      });
      registerEventsAfterCommit(transaction, eventsToPersist);
      await project.reload({ transaction });
      return {
        project: sanitizeProject(project),
        queueEntries: [],
      };
    }

    const budgetAmount = normalizeBudgetAmount(update.budgetAmount ?? project.budgetAmount);
    const result = await enableAutoAssignForProject({
      project,
      actorId,
      settingsInput: normalizedSettings,
      fallbackSettings: project.autoAssignSettings ?? {},
      transaction,
      events: eventsToPersist,
      emitEnabledEvent: !project.autoAssignEnabled,
      queueEventType: project.autoAssignEnabled ? 'auto_assign_queue_regenerated' : 'auto_assign_queue_generated',
      projectValueOverride: budgetAmount,
    });
    const queueEntries = result.queueEntries;

    registerEventsAfterCommit(transaction, eventsToPersist);
    await project.reload({ transaction });
    return {
      project: sanitizeProject(project),
      queueEntries,
    };
  });
}

export async function getProjectOverview(projectId) {
  if (!projectId) {
    throw new ValidationError('projectId is required.');
  }
  const project = await Project.findByPk(projectId);
  if (!project) {
    throw new NotFoundError('Project not found.');
  }
  const queueEntries = await getProjectQueue('project', projectId);
  return {
    project: sanitizeProject(project),
    queueEntries,
  };
}

export async function listProjectEvents(projectId, { limit = 25 } = {}) {
  if (!projectId) {
    throw new ValidationError('projectId is required.');
  }
  const safeLimit = Math.max(1, Math.min(Number(limit) || 25, 100));
  const events = await ProjectAssignmentEvent.findAll({
    where: { projectId },
    order: [['createdAt', 'DESC']],
    limit: safeLimit,
  });
  return events.map((event) => event.toPublicObject());
}

export async function updateProjectDetails(projectId, payload = {}, { actorId } = {}) {
  if (!projectId) {
    throw new ValidationError('projectId is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const project = await Project.findByPk(projectId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!project) {
      throw new NotFoundError('Project not found.');
    }

    const eventsToPersist = [];
    const previousState = project.get({ plain: true });
    const updates = {};
    const changes = [];
    let shouldSyncWorkspace = false;

    if (payload.title !== undefined) {
      const title = payload.title?.trim();
      if (!title) {
        throw new ValidationError('title cannot be empty when provided.');
      }
      if (title !== project.title) {
        updates.title = title;
        changes.push({ field: 'title', previous: project.title, current: title });
      }
    }

    if (payload.description !== undefined) {
      const description = payload.description?.trim();
      if (!description) {
        throw new ValidationError('description cannot be empty when provided.');
      }
      if (description !== project.description) {
        updates.description = description;
        changes.push({ field: 'description', previous: project.description, current: description });
      }
    }

    if (payload.status !== undefined) {
      const status = payload.status?.trim();
      if (!status) {
        throw new ValidationError('status cannot be empty when provided.');
      }
      if (status !== project.status) {
        updates.status = status;
        changes.push({ field: 'status', previous: project.status, current: status });
      }
      shouldSyncWorkspace = true;
    }

    const hasLocation = Object.prototype.hasOwnProperty.call(payload, 'location');
    const hasGeoLocation = Object.prototype.hasOwnProperty.call(payload, 'geoLocation');
    if (hasLocation || hasGeoLocation) {
      const normalized = normalizeLocationPayload({
        location: hasLocation ? payload.location : project.location,
        geoLocation: hasGeoLocation ? payload.geoLocation : undefined,
      });

      if (hasLocation) {
        const nextLocation = normalized.location;
        const previousLocation = project.location ?? null;
        if (nextLocation !== previousLocation) {
          updates.location = nextLocation;
          changes.push({ field: 'location', previous: previousLocation, current: nextLocation });
        }
        if (nextLocation == null && !hasGeoLocation && project.geoLocation != null) {
          updates.geoLocation = null;
          changes.push({ field: 'geoLocation', previous: project.geoLocation ?? null, current: null });
        }
      } else if (hasGeoLocation && normalized.location !== (project.location ?? null)) {
        updates.location = normalized.location;
        changes.push({ field: 'location', previous: project.location ?? null, current: normalized.location });
      }

      if (hasGeoLocation) {
        const previousGeo = project.geoLocation ?? null;
        const nextGeo = normalized.geoLocation;
        if (!areGeoLocationsEqual(previousGeo, nextGeo)) {
          updates.geoLocation = nextGeo;
          changes.push({ field: 'geoLocation', previous: previousGeo, current: nextGeo });
        }
      }
    }

    let budgetChanged = false;
    if (payload.budgetAmount !== undefined) {
      const budgetAmount = normalizeBudgetAmount(payload.budgetAmount);
      const currentValue = project.budgetAmount ?? null;
      if (!(budgetAmount == null && currentValue == null) && Number(budgetAmount ?? 0) !== Number(currentValue ?? 0)) {
        updates.budgetAmount = budgetAmount;
        budgetChanged = true;
        changes.push({ field: 'budgetAmount', previous: currentValue, current: budgetAmount });
      }
    }

    let currencyChanged = false;
    if (payload.budgetCurrency !== undefined) {
      const currency = normalizeCurrency(payload.budgetCurrency);
      if ((currency || null) !== (project.budgetCurrency || null)) {
        updates.budgetCurrency = currency;
        currencyChanged = true;
        changes.push({ field: 'budgetCurrency', previous: project.budgetCurrency, current: currency });
      }
    }

    if (Object.keys(updates).length) {
      await project.update(updates, { transaction });
    }

    if (shouldSyncWorkspace) {
      await marketplaceDomainService.ensureWorkspaceForProject(project, { actorId, transaction });
    }

    if (changes.length) {
      queueProjectEvent(eventsToPersist, project.id, actorId, 'updated', {
        changes,
        previousUpdatedAt: previousState.updatedAt,
      });
    }

    const autoAssignInput = payload.autoAssign ?? {};
    const settingsPayload = extractAutoAssignSettingsPayload(autoAssignInput);
    const shouldDisable = autoAssignInput.enabled === false;
    const shouldEnable = autoAssignInput.enabled === true;
    const regenerateRequested = autoAssignInput.regenerateQueue === true;

    let queueEntries = null;

    if (shouldDisable && project.autoAssignEnabled) {
      const disableResult = await disableAutoAssignForProject({
        project,
        actorId,
        settingsInput: settingsPayload,
        fallbackSettings: project.autoAssignSettings ?? {},
        transaction,
        events: eventsToPersist,
      });
      queueEntries = disableResult.queueEntries;
    } else if (shouldEnable && !project.autoAssignEnabled) {
      const enableResult = await enableAutoAssignForProject({
        project,
        actorId,
        settingsInput: settingsPayload,
        fallbackSettings: project.autoAssignSettings ?? {},
        transaction,
        events: eventsToPersist,
        emitEnabledEvent: true,
        queueEventType: 'auto_assign_queue_generated',
      });
      queueEntries = enableResult.queueEntries;
    } else if (project.autoAssignEnabled && (budgetChanged || currencyChanged || regenerateRequested || Object.keys(settingsPayload).length)) {
      const enableResult = await enableAutoAssignForProject({
        project,
        actorId,
        settingsInput: settingsPayload,
        fallbackSettings: project.autoAssignSettings ?? {},
        transaction,
        events: eventsToPersist,
        emitEnabledEvent: false,
        queueEventType: 'auto_assign_queue_regenerated',
      });
      queueEntries = enableResult.queueEntries;
    }

    registerEventsAfterCommit(transaction, eventsToPersist);
    await project.reload({ transaction });

    return {
      project: sanitizeProject(project),
      queueEntries,
    };
  });
}

export async function getAutoAssignRegenerationContext(projectId, { fallbackActorId, fallbackGeneratedAt } = {}) {
  if (!projectId) {
    throw new ValidationError('projectId is required.');
  }

  const event = await ProjectAssignmentEvent.findOne({
    where: { projectId, eventType: { [Op.in]: AUTO_ASSIGN_REGEN_EVENT_TYPES } },
    include: [{ model: User, as: 'actor' }],
    order: [['createdAt', 'DESC']],
  });

  let actor = event?.actor ? sanitizeActor(event.actor) : null;
  let actorId = event?.actorId ?? null;

  const fallbackActor = fallbackActorId ?? null;
  if (!actor && (actorId || fallbackActor)) {
    const resolvedActorId = actorId ?? fallbackActor;
    const actorInstance = resolvedActorId ? await User.findByPk(resolvedActorId) : null;
    actor = actorInstance ? sanitizeActor(actorInstance) : null;
    actorId = resolvedActorId ?? null;
  }

  const occurredAtDate = event?.createdAt
    ? new Date(event.createdAt)
    : fallbackGeneratedAt
    ? new Date(fallbackGeneratedAt)
    : null;

  const payload = event?.payload ?? null;
  const status = (() => {
    if (!event) {
      return occurredAtDate ? 'succeeded' : 'unknown';
    }
    if (event.eventType === 'auto_assign_queue_failed') {
      return 'failed';
    }
    if (event.eventType === 'auto_assign_queue_exhausted' && Number(payload?.queueSize ?? 0) === 0) {
      return 'exhausted';
    }
    return 'succeeded';
  })();

  return {
    actorId: actorId ?? null,
    actor,
    eventType: event?.eventType ?? null,
    status,
    occurredAt: occurredAtDate ? occurredAtDate.toISOString() : null,
    payload,
    reason:
      payload?.message ??
      payload?.reason ??
      (status === 'failed' ? 'Auto-match queue regeneration failed.' : null),
  };
}

export async function recordAutoAssignFailure({ projectId, actorId, error, settings, metadata } = {}) {
  if (!projectId) {
    throw new ValidationError('projectId is required.');
  }

  const payload = {
    message: error?.message ?? 'Auto-match queue regeneration failed.',
    code: error?.code ?? null,
    settings: settings ?? null,
    metadata: metadata ?? null,
  };

  if (error?.response?.data) {
    payload.response = error.response.data;
  }
  if (error?.stack) {
    payload.stack = String(error.stack).split('\n').slice(0, 5).join('\n');
  }

  await ProjectAssignmentEvent.create({
    projectId,
    actorId: actorId ?? null,
    eventType: 'auto_assign_queue_failed',
    payload,
  });

  invalidateAutoAssignMetricsCache();
}

async function computeAutoAssignCommandCenterMetrics() {
  const [projects, statusRows, resolvedEntries] = await Promise.all([
    Project.findAll({
      attributes: [
        'id',
        'autoAssignEnabled',
        'autoAssignStatus',
        'autoAssignLastQueueSize',
        'autoAssignLastRunAt',
        'autoAssignSettings',
      ],
    }),
    AutoAssignQueueEntry.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
      group: ['status'],
      raw: true,
    }),
    AutoAssignQueueEntry.findAll({
      attributes: ['status', 'notifiedAt', 'resolvedAt'],
      where: {
        status: { [Op.in]: ['accepted', 'completed', 'declined'] },
        notifiedAt: { [Op.not]: null },
        resolvedAt: { [Op.not]: null },
      },
      order: [['resolvedAt', 'DESC']],
      limit: 200,
    }),
  ]);

  const totals = {
    totalProjects: projects.length,
    autoAssignEnabled: 0,
    totalQueueEntries: 0,
    averageQueueSize: 0,
    newcomerGuarantees: 0,
    latestQueueGeneratedAt: null,
  };

  projects.forEach((project) => {
    if (project.autoAssignEnabled) {
      totals.autoAssignEnabled += 1;
      totals.totalQueueEntries += Number(project.autoAssignLastQueueSize ?? 0);
    }
    const settings = project.autoAssignSettings ?? {};
    const fairness = settings?.fairness ?? {};
    if (fairness.ensureNewcomer !== false) {
      totals.newcomerGuarantees += 1;
    }
    if (project.autoAssignLastRunAt) {
      const timestamp = new Date(project.autoAssignLastRunAt).getTime();
      if (Number.isFinite(timestamp)) {
        if (!totals.latestQueueGeneratedAt || timestamp > totals.latestQueueGeneratedAt) {
          totals.latestQueueGeneratedAt = timestamp;
        }
      }
    }
  });

  totals.averageQueueSize = totals.autoAssignEnabled
    ? Math.round(totals.totalQueueEntries / totals.autoAssignEnabled)
    : 0;
  totals.latestQueueGeneratedAt = totals.latestQueueGeneratedAt
    ? new Date(totals.latestQueueGeneratedAt).toISOString()
    : null;

  const statusCounts = statusRows.reduce((acc, row) => {
    const status = row.status ?? 'unknown';
    acc[status] = Number(row.count ?? 0);
    return acc;
  }, {});

  const durations = resolvedEntries
    .map((entry) => {
      const notified = entry.notifiedAt ? new Date(entry.notifiedAt).getTime() : null;
      const resolved = entry.resolvedAt ? new Date(entry.resolvedAt).getTime() : null;
      if (!Number.isFinite(notified) || !Number.isFinite(resolved) || resolved < notified) {
        return null;
      }
      return (resolved - notified) / 60000;
    })
    .filter((value) => Number.isFinite(value) && value >= 0);

  const averageResponseMinutes = durations.length
    ? roundNumber(durations.reduce((sum, value) => sum + value, 0) / durations.length, 2)
    : null;
  const medianResponseMinutes = durations.length ? roundNumber(calculateMedian(durations), 2) : null;

  const successfulCount = resolvedEntries.filter((entry) => ['accepted', 'completed'].includes(entry.status)).length;
  const completionRate = resolvedEntries.length
    ? roundNumber((successfulCount / resolvedEntries.length) * 100, 1)
    : null;

  return {
    totals,
    queue: {
      statusCounts,
      activeEntries: (statusCounts.pending ?? 0) + (statusCounts.notified ?? 0),
    },
    velocity: {
      averageResponseMinutes,
      medianResponseMinutes,
      completionRate,
      sampleSize: durations.length,
    },
    updatedAt: new Date().toISOString(),
  };
}

export async function getAutoAssignCommandCenterMetrics({ forceRefresh = false } = {}) {
  const now = Date.now();
  if (!forceRefresh && metricsCache.value && metricsCache.expiresAt > now) {
    return metricsCache.value;
  }

  const metrics = await computeAutoAssignCommandCenterMetrics();
  metricsCache = { value: metrics, expiresAt: now + METRICS_CACHE_TTL_MS };
  return metrics;
}

export default {
  createProject,
  updateProjectAutoAssign,
  getProjectOverview,
  listProjectEvents,
  updateProjectDetails,
  getAutoAssignCommandCenterMetrics,
  getAutoAssignRegenerationContext,
  recordAutoAssignFailure,
};
