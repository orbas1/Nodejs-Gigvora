import {
  buildAssignmentQueue,
  listFreelancerQueue,
  resolveQueueEntry,
  getProjectQueue,
} from '../services/autoAssignService.js';

function parseNumber(value, fallback = undefined) {
  if (value == null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function enqueueProjectAssignments(req, res) {
  const { projectId } = req.params;
  const { projectValue, limit, expiresInMinutes, actorId, targetType } = req.body ?? {};
  const queue = await buildAssignmentQueue({
    targetType: targetType ?? 'project',
    targetId: parseNumber(projectId, projectId),
    projectValue,
    limit,
    expiresInMinutes,
    actorId,
  });
  res.status(201).json({ entries: queue });
}

export async function listQueue(req, res) {
  const { freelancerId, page, pageSize, statuses } = req.query ?? {};
  const parsedStatuses = Array.isArray(statuses)
    ? statuses
    : typeof statuses === 'string'
    ? statuses.split(',').map((value) => value.trim())
    : undefined;

  const result = await listFreelancerQueue({
    freelancerId: parseNumber(freelancerId),
    page: parseNumber(page),
    pageSize: parseNumber(pageSize),
    statuses: parsedStatuses,
  });
  res.json(result);
}

export async function updateQueueEntryStatus(req, res) {
  const { entryId } = req.params;
  const { status, freelancerId, actorId, rating, completionValue } = req.body ?? {};
  const result = await resolveQueueEntry(entryId, status, {
    freelancerId: parseNumber(freelancerId),
    actorId: parseNumber(actorId),
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
