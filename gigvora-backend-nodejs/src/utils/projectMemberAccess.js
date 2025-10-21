import { ensurePlainObject, parsePositiveInteger } from './controllerAccess.js';
import { ValidationError } from './errors.js';
import { ensureManageAccess, ensureViewAccess, parseOwnerId } from './projectAccess.js';

function requireOwnerId(req) {
  const candidate = parseOwnerId(req);
  if (candidate == null || candidate === '') {
    throw new ValidationError('A valid ownerId is required for this operation.');
  }
  return parsePositiveInteger(candidate, 'ownerId');
}

function resolveOwnerAccess(req, { mode = 'view' } = {}) {
  const ownerId = requireOwnerId(req);
  const access = mode === 'manage' ? ensureManageAccess(req, ownerId) : ensureViewAccess(req, ownerId);
  return { ownerId, access };
}

export function requireOwnerContext(req, { mode = 'view' } = {}) {
  return resolveOwnerAccess(req, { mode });
}

export function sanitizeMemberActorPayload(payload, access) {
  const body = ensurePlainObject(payload);
  const override = body.actorId != null ? parsePositiveInteger(body.actorId, 'actorId', { optional: true }) : null;
  const actorId = override ?? access.actorId ?? null;
  const sanitized = { ...body };
  delete sanitized.actorId;
  return {
    actorId,
    actorRole: access.actorRole ?? null,
    payload: sanitized,
  };
}

export function buildMemberAccessSnapshot(access, { performedBy } = {}) {
  const actorId = access?.actorId ?? null;
  const allowedRoles = Array.isArray(access?.allowedRoles) ? [...new Set(access.allowedRoles)] : [];
  const snapshot = {
    actorId,
    actorRole: access?.actorRole ?? null,
    performedBy: performedBy ?? actorId ?? null,
    canView: Boolean(access?.canView),
    canManage: Boolean(access?.canManage),
    allowedRoles,
  };

  if (!snapshot.canManage && access?.reason) {
    snapshot.reason = access.reason;
  }

  return snapshot;
}

export function attachMemberAccess(data, access, { performedBy } = {}) {
  const base = ensurePlainObject(data ?? {}, 'response');
  return { ...base, access: buildMemberAccessSnapshot(access, { performedBy }) };
}

export function respondWithMemberAccess(res, payload, access, { status = 200, performedBy } = {}) {
  const body = payload != null && typeof payload === 'object' && !Array.isArray(payload)
    ? { ...payload }
    : { result: payload };

  body.access = buildMemberAccessSnapshot(access, { performedBy });
  res.status(status).json(body);
}

export default {
  requireOwnerContext,
  sanitizeMemberActorPayload,
  buildMemberAccessSnapshot,
  attachMemberAccess,
  respondWithMemberAccess,
};
