import { Op } from 'sequelize';
import {
  sequelize,
  Project,
  AutoAssignQueueEntry,
  ProjectAssignmentEvent,
  WORKSPACE_STATUSES,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { normalizeLocationPayload, areGeoLocationsEqual } from '../utils/location.js';
import { buildAssignmentQueue, getProjectQueue } from './autoAssignService.js';
import { initializeWorkspaceForProject } from './projectWorkspaceService.js';

const DEFAULT_AUTO_ASSIGN_LIMIT = 12;

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

function deriveWorkspaceStatus(projectStatus) {
  if (!projectStatus) {
    return null;
  }
  const normalized = projectStatus.toString().toLowerCase();
  if (normalized.includes('block')) {
    return 'blocked';
  }
  if (normalized.includes('complete') || normalized.includes('launch') || normalized.includes('closed')) {
    return 'completed';
  }
  if (
    normalized.includes('active') ||
    normalized.includes('delivery') ||
    normalized.includes('execution') ||
    normalized.includes('progress') ||
    normalized.includes('live')
  ) {
    return 'active';
  }
  return WORKSPACE_STATUSES.includes('briefing') ? 'briefing' : WORKSPACE_STATUSES[0];
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
  const settings = {
    limit: Math.max(1, Math.min(normalizedLimit, 100)),
    expiresInMinutes: Math.max(30, Math.min(normalizedExpires, 1440)),
    fairness: {
      ensureNewcomer:
        input.fairness?.ensureNewcomer !== undefined
          ? Boolean(input.fairness.ensureNewcomer)
          : fallback.fairness?.ensureNewcomer ?? true,
      maxAssignments:
        input.fairness?.maxAssignments !== undefined
          ? Math.max(0, Number(input.fairness.maxAssignments) || 0)
          : Math.max(0, Number(fallback.fairness?.maxAssignments ?? 3)),
    },
    weights: null,
  };

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
    let workspaceStatusUpdate = null;

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
      workspaceStatusUpdate = deriveWorkspaceStatus(status);
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

    if (workspaceStatusUpdate) {
      const workspace = await initializeWorkspaceForProject(project, { transaction, actorId });
      if (workspace.status !== workspaceStatusUpdate) {
        await workspace.update(
          {
            status: workspaceStatusUpdate,
            lastActivityAt: new Date(),
            updatedById: actorId ?? null,
          },
          { transaction },
        );
      }
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

export default {
  createProject,
  updateProjectAutoAssign,
  getProjectOverview,
  listProjectEvents,
  updateProjectDetails,
};
