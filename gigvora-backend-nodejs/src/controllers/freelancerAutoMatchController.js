import {
  getFreelancerAutoMatchOverview,
  listFreelancerMatches,
  resolveQueueEntry,
  updateFreelancerAutoMatchPreferences,
} from '../services/autoAssignService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';

function normalizeId(value) {
  if (value == null || value === '') return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function normalizePage(value, { fallback = 1, max = 100 } = {}) {
  const parsed = normalizeId(value) ?? Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, max);
}

function normalizeStatuses(statuses) {
  if (!statuses) {
    return undefined;
  }
  const values = Array.isArray(statuses) ? statuses : `${statuses}`.split(',');
  const allowed = new Set(['pending', 'accepted', 'declined', 'completed', 'expired', 'reassigned']);
  const normalised = Array.from(
    new Set(
      values
        .map((value) => `${value}`.trim().toLowerCase())
        .filter((value) => allowed.has(value)),
    ),
  );
  return normalised.length ? normalised : undefined;
}

function assertAccess(req, targetFreelancerId) {
  const actor = req.user;
  if (!actor) {
    throw new AuthorizationError('Authentication required.');
  }

  if (actor.type === 'freelancer') {
    if (actor.id !== targetFreelancerId) {
      throw new AuthorizationError('You can only manage your own automatch preferences.');
    }
  } else if (!['admin', 'agency', 'company', 'headhunter'].includes(actor.type)) {
    throw new AuthorizationError('You do not have permission to manage freelancer automatch settings.');
  }

  return actor;
}

export async function overview(req, res) {
  const freelancerId = normalizeId(req.params.freelancerId);
  if (!freelancerId) {
    throw new ValidationError('A valid freelancerId is required.');
  }
  assertAccess(req, freelancerId);
  const result = await getFreelancerAutoMatchOverview(freelancerId);
  res.json(result);
}

export async function updatePreferences(req, res) {
  const freelancerId = normalizeId(req.params.freelancerId);
  if (!freelancerId) {
    throw new ValidationError('A valid freelancerId is required.');
  }
  const actor = assertAccess(req, freelancerId);
  const payload = req.body ?? {};
  const preference = await updateFreelancerAutoMatchPreferences(freelancerId, payload, { actorId: actor.id });
  res.json({ preference });
}

export async function matches(req, res) {
  const freelancerId = normalizeId(req.params.freelancerId);
  if (!freelancerId) {
    throw new ValidationError('A valid freelancerId is required.');
  }
  assertAccess(req, freelancerId);

  const { page, pageSize, statuses, includeHistorical } = req.query ?? {};
  const parsedStatuses = normalizeStatuses(statuses);

  const result = await listFreelancerMatches({
    freelancerId,
    page: normalizePage(page, { fallback: 1 }),
    pageSize: normalizePage(pageSize, { fallback: 10, max: 50 }),
    statuses: parsedStatuses,
    includeHistorical: includeHistorical === 'true' || includeHistorical === true,
  });
  res.json(result);
}

export async function respond(req, res) {
  const freelancerId = normalizeId(req.params.freelancerId);
  const entryId = normalizeId(req.params.entryId);
  if (!freelancerId || !entryId) {
    throw new ValidationError('A valid freelancerId and entryId are required.');
  }
  const actor = assertAccess(req, freelancerId);
  const { status, rating, completionValue, reasonCode, reasonLabel, responseNotes, metadata } = req.body ?? {};
  const normalizedStatus = typeof status === 'string' ? status.toLowerCase() : '';

  if (!['accepted', 'declined', 'reassigned'].includes(normalizedStatus)) {
    throw new ValidationError('status must be accepted, declined, or reassigned.');
  }

  const result = await resolveQueueEntry(entryId, normalizedStatus, {
    freelancerId,
    actorId: actor.id,
    rating,
    completionValue,
    reasonCode,
    reasonLabel,
    responseNotes,
    metadata,
  });

  res.json({ entry: result });
}

export default {
  overview,
  matches,
  updatePreferences,
  respond,
};
