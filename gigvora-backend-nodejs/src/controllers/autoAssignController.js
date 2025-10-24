import {
  buildAssignmentQueue,
  listFreelancerQueue,
  resolveQueueEntry,
  getProjectQueue,
} from '../services/autoAssignService.js';
import notificationService from '../services/notificationService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

function parseNumber(value, fallback = undefined) {
  if (value == null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function ensureObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function summariseQueue(entries, fallbackName, fairnessConfig = {}) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const queueSize = safeEntries.length;
  const namedEntry = safeEntries.find((entry) => entry && entry.projectName);
  const fairnessFromQueue = safeEntries
    .map((entry) => ensureObject(entry?.metadata?.fairness))
    .find((fairness) => Object.keys(fairness).length);
  const requestedFairness = fairnessConfig?.ensureNewcomer;
  const ensuredNewcomer =
    fairnessFromQueue?.ensuredNewcomer ??
    fairnessFromQueue?.ensureNewcomer ??
    (requestedFairness !== undefined ? Boolean(requestedFairness) : undefined) ??
    false;

  return {
    projectName: namedEntry?.projectName || fallbackName,
    queueSize,
    ensuredNewcomer,
  };
}

async function dispatchAutoAssignNotification({
  userId,
  projectId,
  projectName,
  queueSize,
  ensuredNewcomer,
  limit,
  expiresInMinutes,
  error,
}) {
  if (!userId) {
    return;
  }

  const success = !error;
  const safeProjectName = projectName || (projectId ? `Project ${projectId}` : 'This project');
  const invitesLabel = queueSize === 1 ? '1 invite' : `${queueSize} invites`;

  const messageParts = success
    ? [
        queueSize > 0
          ? `${safeProjectName} auto-match queue regenerated with ${invitesLabel}.`
          : `${safeProjectName} auto-match queue regenerated but no invites were created.`,
        limit != null ? `Limit ${limit}.` : null,
        ensuredNewcomer ? 'Newcomer guarantee applied.' : 'No newcomer guarantee this cycle.',
        expiresInMinutes != null ? `Invites expire in ${expiresInMinutes} minutes.` : null,
      ]
    : [
        `Auto-match queue regeneration failed for ${safeProjectName}.`,
        error,
      ];

  const body = messageParts.filter(Boolean).join(' ');
  const payload = {
    projectId: projectId ?? null,
    queueSize,
    limit: limit != null ? Number(limit) : null,
    ensureNewcomer: Boolean(ensuredNewcomer),
    expiresInMinutes: expiresInMinutes != null ? Number(expiresInMinutes) : null,
    status: success ? 'success' : 'failure',
  };

  if (!success && error) {
    payload.error = error;
  }

  try {
    await notificationService.queueNotification(
      {
        userId,
        category: 'project',
        priority: success ? 'normal' : 'high',
        type: success ? 'auto-assign.queue-regenerated' : 'auto-assign.queue-failed',
        title: success ? 'Auto-match queue regenerated' : 'Auto-match queue failed',
        body,
        payload,
      },
      { bypassQuietHours: true },
    );
  } catch (notificationError) {
    logger.warn('Failed to queue auto-assign notification', { error: notificationError });
  }
}

export async function enqueueProjectAssignments(req, res) {
  const { projectId } = req.params;
  const { projectValue, limit, expiresInMinutes, targetType, weights, fairness } = req.body ?? {};
  const actorId = req.user?.id ?? null;
  const targetId = parseNumber(projectId, projectId);

  let queue;
  try {
    queue = await buildAssignmentQueue({
      targetType: targetType ?? 'project',
      targetId,
      projectValue,
      limit,
      expiresInMinutes,
      actorId,
      weightOverrides: weights,
      fairnessConfig: fairness,
    });
  } catch (error) {
    await dispatchAutoAssignNotification({
      userId: actorId,
      projectId: targetId,
      projectName: targetId ? `Project ${targetId}` : undefined,
      queueSize: 0,
      ensuredNewcomer: ensureObject(fairness).ensureNewcomer !== false,
      limit,
      expiresInMinutes,
      error: error?.message || 'Queue regeneration failed.',
    });
    throw error;
  }

  if (actorId) {
    const summary = summariseQueue(queue, targetId ? `Project ${targetId}` : 'Auto-match workspace', ensureObject(fairness));
    await dispatchAutoAssignNotification({
      userId: actorId,
      projectId: targetId,
      projectName: summary.projectName,
      queueSize: summary.queueSize,
      ensuredNewcomer: summary.ensuredNewcomer,
      limit,
      expiresInMinutes,
    });
  }

  res.status(201).json({ entries: queue });
}

export async function listQueue(req, res) {
  const { freelancerId, page, pageSize, statuses } = req.query ?? {};
  const actor = req.user;
  if (!actor) {
    throw new AuthorizationError('Authentication required.');
  }

  const parsedStatuses = Array.isArray(statuses)
    ? statuses
    : typeof statuses === 'string'
    ? statuses.split(',').map((value) => value.trim())
    : undefined;

  let resolvedFreelancerId;
  if (actor.type === 'freelancer') {
    const normalized = parseNumber(freelancerId, actor.id);
    if (normalized && normalized !== actor.id) {
      throw new AuthorizationError('You can only access your own auto-assign queue.');
    }
    resolvedFreelancerId = actor.id;
  } else if (['admin', 'agency', 'company'].includes(actor.type)) {
    resolvedFreelancerId = parseNumber(freelancerId);
    if (!resolvedFreelancerId) {
      throw new ValidationError('freelancerId query parameter is required.');
    }
  } else {
    throw new AuthorizationError('You do not have permission to view auto-assign queues.');
  }

  const result = await listFreelancerQueue({
    freelancerId: resolvedFreelancerId,
    page: parseNumber(page),
    pageSize: parseNumber(pageSize),
    statuses: parsedStatuses,
  });
  res.json(result);
}

export async function updateQueueEntryStatus(req, res) {
  const { entryId } = req.params;
  const { status, freelancerId, rating, completionValue, reasonCode, reasonLabel, responseNotes, metadata } =
    req.body ?? {};
  const actor = req.user;
  if (!actor) {
    throw new AuthorizationError('Authentication required.');
  }

  const resolvedFreelancerId =
    actor.type === 'freelancer' ? actor.id : parseNumber(freelancerId, undefined);

  const result = await resolveQueueEntry(entryId, status, {
    freelancerId: resolvedFreelancerId,
    actorId: actor.id,
    rating: rating == null ? undefined : Number(rating),
    completionValue: completionValue == null ? undefined : Number(completionValue),
    reasonCode,
    reasonLabel,
    responseNotes,
    metadata,
  });
  res.json(result);
}

export async function projectQueue(req, res) {
  const { projectId } = req.params;
  const { targetType } = req.query ?? {};
  const queue = await getProjectQueue(targetType ?? 'project', parseNumber(projectId, projectId));
  res.json({ entries: queue });
}

export default {
  enqueueProjectAssignments,
  listQueue,
  updateQueueEntryStatus,
  projectQueue,
};
