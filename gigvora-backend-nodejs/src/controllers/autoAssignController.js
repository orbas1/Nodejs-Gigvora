import {
  buildAssignmentQueue,
  listFreelancerQueue,
  resolveQueueEntry,
  getProjectQueue,
} from '../services/autoAssignService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';

function parseNumber(value, fallback = undefined) {
  if (value == null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function enqueueProjectAssignments(req, res) {
  const { projectId } = req.params;
  const { projectValue, limit, expiresInMinutes, targetType, weights, fairness } = req.body ?? {};
  const actorId = req.user?.id ?? null;
  const queue = await buildAssignmentQueue({
    targetType: targetType ?? 'project',
    targetId: parseNumber(projectId, projectId),
    projectValue,
    limit,
    expiresInMinutes,
    actorId,
    weightOverrides: weights,
    fairnessConfig: fairness,
  });
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
  const { status, freelancerId, rating, completionValue } = req.body ?? {};
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
