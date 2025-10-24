import { ValidationError } from './errors.js';
import { resolveRequestUserId } from './requestContext.js';

function normalizePositiveInteger(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export function resolveOwnerIdFromRequest(req, { includeActorFallback = true } = {}) {
  if (!req) {
    return null;
  }

  const candidates = [
    req.params?.ownerId,
    req.params?.userId,
    req.params?.id,
    req.body?.ownerId,
    req.query?.ownerId,
    req.user?.id,
  ];

  for (const candidate of candidates) {
    if (candidate == null || candidate === '') {
      continue;
    }
    const parsed = normalizePositiveInteger(candidate);
    if (parsed) {
      return parsed;
    }
  }

  if (!includeActorFallback) {
    return null;
  }

  const actorId = resolveRequestUserId(req);
  return normalizePositiveInteger(actorId);
}

export function requireOwnerIdFromRequest(req, message = 'ownerId is required.') {
  const ownerId = resolveOwnerIdFromRequest(req);
  if (!ownerId) {
    throw new ValidationError(message);
  }
  return ownerId;
}

export default {
  resolveOwnerIdFromRequest,
  requireOwnerIdFromRequest,
};
