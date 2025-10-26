import {
  CalendarIntegration,
  CalendarSyncJob,
  UserPresenceStatus,
  sequelize,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function normaliseUserId(userId) {
  const parsed = Number.parseInt(userId, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError('userId must be a positive integer.');
  }
  return parsed;
}

function computeState({ integrations, job }) {
  if (!integrations.length && !job) {
    return { state: 'disconnected', inProgress: false };
  }

  const integrationStatuses = integrations.map((integration) => integration.status ?? 'connected');
  const hasSyncing = integrationStatuses.includes('syncing') || job?.status === 'running';
  if (hasSyncing || job?.status === 'queued') {
    return { state: 'syncing', inProgress: true };
  }

  const hasError = integrationStatuses.includes('error') || job?.status === 'failed';
  if (hasError) {
    return { state: 'error', inProgress: false };
  }

  if (!integrations.length) {
    return { state: 'disconnected', inProgress: false };
  }

  return { state: 'synced', inProgress: false };
}

export async function getCalendarSyncStatus(userId) {
  const normalizedUserId = normaliseUserId(userId);

  const [integrations, latestJob] = await Promise.all([
    CalendarIntegration.findAll({ where: { userId: normalizedUserId }, order: [['updatedAt', 'DESC']] }),
    CalendarSyncJob.findOne({
      where: { userId: normalizedUserId },
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
    }),
  ]);

  const { state, inProgress } = computeState({ integrations, job: latestJob });

  const connectedProviders = integrations
    .filter((integration) => integration.status !== 'disconnected')
    .map((integration) => integration.provider);

  const errors = [];
  integrations
    .filter((integration) => integration.status === 'error' && integration.syncError)
    .forEach((integration) => {
      errors.push({
        source: integration.provider,
        message: integration.syncError,
      });
    });

  if (latestJob?.status === 'failed' && latestJob.errorMessage) {
    errors.push({ source: 'sync_job', message: latestJob.errorMessage, code: latestJob.errorCode ?? null });
  }

  const lastSyncedAtCandidates = [
    ...integrations.map((integration) => integration.lastSyncedAt).filter(Boolean),
    latestJob?.lastSyncedAt ?? null,
  ].filter(Boolean);
  const lastSyncedAt = lastSyncedAtCandidates.length
    ? new Date(Math.max(...lastSyncedAtCandidates.map((value) => new Date(value).getTime())))
    : null;

  const nextSyncAt = latestJob?.nextSyncAt ?? null;

  return {
    state,
    inProgress,
    providers: connectedProviders,
    connectedProviders,
    errors,
    lastSyncedAt,
    nextSyncAt,
    triggeredById: latestJob?.triggeredById ?? null,
    jobId: latestJob?.id ?? null,
  };
}

export async function triggerCalendarSync(userId, { actorId = null } = {}) {
  const normalizedUserId = normaliseUserId(userId);

  return sequelize.transaction(async (transaction) => {
    const integrations = await CalendarIntegration.findAll({
      where: { userId: normalizedUserId },
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (!integrations.length) {
      throw new ValidationError('Connect a calendar provider before triggering a sync.');
    }

    const now = new Date();
    const nextSyncAt = new Date(now.getTime() + 5 * 60 * 1000);

    await CalendarIntegration.update(
      { status: 'syncing', syncError: null },
      { where: { userId: normalizedUserId }, transaction },
    );

    const job = await CalendarSyncJob.create(
      {
        userId: normalizedUserId,
        triggeredById: actorId,
        status: 'queued',
        metadata: { trigger: 'manual_refresh', initiatedAt: now.toISOString() },
        nextSyncAt,
      },
      { transaction },
    );

    await UserPresenceStatus.update(
      { calendarLastSyncedAt: integrations.reduce((latest, integration) => {
        if (!integration.lastSyncedAt) {
          return latest;
        }
        const candidate = new Date(integration.lastSyncedAt).getTime();
        return candidate > latest ? candidate : latest;
      }, 0) || null },
      { where: { userId: normalizedUserId }, transaction },
    );

    return job.toPublicObject();
  });
}

export async function markCalendarSyncComplete(jobId, { status, errorCode, errorMessage, lastSyncedAt } = {}) {
  if (!jobId) {
    throw new ValidationError('jobId is required to update calendar sync job.');
  }

  const job = await CalendarSyncJob.findOne({ where: { id: jobId } });
  if (!job) {
    throw new NotFoundError('Calendar sync job not found.');
  }

  const updates = {
    status: status ?? 'success',
    finishedAt: new Date(),
  };
  if (errorCode || errorMessage) {
    updates.errorCode = errorCode ?? null;
    updates.errorMessage = errorMessage ?? null;
  }
  if (lastSyncedAt) {
    updates.lastSyncedAt = lastSyncedAt;
  }

  await job.update(updates);

  if (updates.status === 'success' && job.userId) {
    await CalendarIntegration.update(
      { status: 'connected', lastSyncedAt: updates.lastSyncedAt ?? new Date() },
      { where: { userId: job.userId } },
    );
  }

  if (updates.status === 'failed' && job.userId) {
    await CalendarIntegration.update(
      { status: 'error', syncError: updates.errorMessage ?? 'Calendar sync failed.' },
      { where: { userId: job.userId } },
    );
  }

  return job.toPublicObject();
}

export default {
  getCalendarSyncStatus,
  triggerCalendarSync,
  markCalendarSyncComplete,
};
