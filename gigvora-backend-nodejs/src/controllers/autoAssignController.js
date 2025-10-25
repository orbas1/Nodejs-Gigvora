import {
  buildAssignmentQueue,
  getProjectQueue,
  listFreelancerQueue,
  resolveQueueEntry,
} from '../services/autoAssignService.js';
import { queueNotification } from '../services/notificationService.js';
import {
  getAutoAssignCommandCenterMetrics,
  getAutoAssignRegenerationContext,
  recordAutoAssignFailure,
} from '../services/projectService.js';
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

function buildQueueSummary(entries) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const summary = {
    totalEntries: safeEntries.length,
    statusCounts: {},
    ensuredNewcomers: 0,
    newcomers: 0,
    returning: 0,
    generatedAt: null,
    expiresAt: null,
    generatedBy: null,
    averageScore: null,
    averageConfidence: null,
    confidenceDistribution: { high: 0, medium: 0, low: 0 },
    confidenceSampleSize: 0,
  };

  let latestGeneratedAt = null;
  let earliestExpiry = null;
  let scoreAccumulator = 0;
  let confidenceAccumulator = 0;

  safeEntries.forEach((entry) => {
    const status = typeof entry?.status === 'string' ? entry.status.toLowerCase() : 'pending';
    summary.statusCounts[status] = (summary.statusCounts[status] || 0) + 1;

    const metadata = entry?.metadata && typeof entry.metadata === 'object' ? entry.metadata : {};
    const fairness = metadata?.fairness && typeof metadata.fairness === 'object' ? metadata.fairness : {};
    if (fairness.ensuredNewcomer) {
      summary.ensuredNewcomers += 1;
    }

    const assignmentCount = Number(entry?.breakdown?.totalAssigned ?? metadata?.totalAssigned ?? 0);
    if (!Number.isFinite(assignmentCount) || assignmentCount <= 0) {
      summary.newcomers += 1;
    } else {
      summary.returning += 1;
    }

    const scoreValue = Number(entry?.score);
    if (Number.isFinite(scoreValue)) {
      scoreAccumulator += scoreValue;
    }

    const confidenceValue = (() => {
      if (entry?.confidence != null && Number.isFinite(Number(entry.confidence))) {
        return Number(entry.confidence);
      }
      const metaConfidence = metadata?.confidence;
      if (metaConfidence == null || metaConfidence === '') {
        return null;
      }
      const parsed = Number(metaConfidence);
      return Number.isFinite(parsed) ? parsed : null;
    })();
    if (confidenceValue != null) {
      confidenceAccumulator += confidenceValue;
      summary.confidenceSampleSize += 1;
      if (confidenceValue >= 0.75) {
        summary.confidenceDistribution.high += 1;
      } else if (confidenceValue >= 0.55) {
        summary.confidenceDistribution.medium += 1;
      } else {
        summary.confidenceDistribution.low += 1;
      }
    }

    if (metadata.generatedBy && !summary.generatedBy) {
      summary.generatedBy = metadata.generatedBy;
    }

    const generatedAt = metadata.generatedAt;
    if (generatedAt) {
      const timestamp = new Date(generatedAt).getTime();
      if (Number.isFinite(timestamp) && (!latestGeneratedAt || timestamp > latestGeneratedAt)) {
        latestGeneratedAt = timestamp;
      }
    }

    const expiresAt = entry?.expiresAt ?? metadata.expiresAt;
    if (expiresAt) {
      const timestamp = new Date(expiresAt).getTime();
      if (Number.isFinite(timestamp) && (!earliestExpiry || timestamp < earliestExpiry)) {
        earliestExpiry = timestamp;
      }
    }
  });

  summary.generatedAt = latestGeneratedAt ? new Date(latestGeneratedAt).toISOString() : null;
  summary.expiresAt = earliestExpiry ? new Date(earliestExpiry).toISOString() : null;
  summary.averageScore = summary.totalEntries ? Number((scoreAccumulator / summary.totalEntries).toFixed(2)) : null;
  summary.averageConfidence = summary.confidenceSampleSize
    ? Number((confidenceAccumulator / summary.confidenceSampleSize).toFixed(3))
    : null;

  return summary;
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
    await queueNotification(
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
    if (targetId) {
      await recordAutoAssignFailure({
        projectId: targetId,
        actorId,
        error,
        settings: {
          projectValue,
          limit,
          expiresInMinutes,
          targetType: targetType ?? 'project',
          fairness: ensureObject(fairness),
          weights,
        },
      });
    }
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

async function resolveQueueEnvelope(targetType, projectId) {
  const entries = await getProjectQueue(targetType, projectId);
  const summary = buildQueueSummary(entries);
  let regeneration = null;

  if (targetType === 'project' && projectId) {
    regeneration = await getAutoAssignRegenerationContext(projectId, {
      fallbackActorId: summary.generatedBy ?? null,
      fallbackGeneratedAt: summary.generatedAt ?? null,
    });
  }

  return { entries, summary, regeneration };
}

export async function projectQueue(req, res) {
  const { projectId } = req.params;
  const { targetType } = req.query ?? {};
  const normalizedTargetType = targetType ?? 'project';
  const resolvedProjectId = parseNumber(projectId, projectId);
  const payload = await resolveQueueEnvelope(normalizedTargetType, resolvedProjectId);
  res.json(payload);
}

export async function streamProjectQueue(req, res) {
  const { projectId } = req.params;
  const { targetType, interval } = req.query ?? {};
  const resolvedProjectId = parseNumber(projectId, projectId);
  const normalizedTargetType = targetType ?? 'project';
  const refreshInterval = Math.max(2000, Number(interval) || 5000);

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  let closed = false;
  let lastPayload = null;

  const sendPayload = async () => {
    if (closed) {
      return;
    }

    try {
      const envelope = await resolveQueueEnvelope(normalizedTargetType, resolvedProjectId);
      const payload = {
        ...envelope,
        timestamp: new Date().toISOString(),
      };
      const serialised = JSON.stringify(payload);
      if (serialised !== lastPayload) {
        lastPayload = serialised;
        res.write('event: queue\n');
        res.write(`data: ${serialised}\n\n`);
      } else {
        res.write(`: heartbeat ${payload.timestamp}\n\n`);
      }
    } catch (error) {
      logger.error('Failed to stream auto-assign queue', { error, projectId: resolvedProjectId });
      res.write('event: error\n');
      res.write(
        `data: ${JSON.stringify({ message: 'Unable to refresh queue stream.', details: error?.message ?? null })}\n\n`,
      );
    }
  };

  const intervalId = setInterval(sendPayload, refreshInterval);
  req.on('close', () => {
    closed = true;
    clearInterval(intervalId);
  });

  await sendPayload();
}

export async function projectMetrics(req, res) {
  const { force } = req.query ?? {};
  const metrics = await getAutoAssignCommandCenterMetrics({
    forceRefresh: force === 'true' || force === '1',
  });
  res.json(metrics);
}
