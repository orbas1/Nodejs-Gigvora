import { AuthorizationError, ValidationError } from './errors.js';
import {
  resolveRequestPermissions,
  resolveRequestUserId,
  resolveRequestUserRole,
} from './requestContext.js';

const PROJECT_GIG_ALLOWED_ROLES = new Set([
  'client',
  'client_admin',
  'client_lead',
  'operations_lead',
  'operations_manager',
  'program_manager',
  'project_owner',
  'project_operator',
  'talent_lead',
  'admin',
]);

export function normalizeRole(role) {
  return role?.toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '_') ?? null;
}

export function resolveOwnerId(req) {
  const candidates = [req.params?.userId, req.params?.id, req.user?.id, resolveRequestUserId(req)];
  for (const candidate of candidates) {
    const parsed = Number.parseInt(candidate, 10);
    if (Number.isInteger(parsed)) {
      return parsed;
    }
  }
  return null;
}

export function parseOwnerId(req) {
  const candidates = [req.params?.userId, req.params?.id, req.user?.id];
  for (const candidate of candidates) {
    const parsed = Number.parseInt(candidate, 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }
  const fallback = resolveRequestUserId(req);
  if (fallback != null) {
    return fallback;
  }
  return null;
}

export function requireOwnerId(req, { fieldName = 'ownerId' } = {}) {
  const candidate = parseOwnerId(req) ?? resolveOwnerId(req);
  const ownerId = Number.parseInt(candidate, 10);
  if (!ownerId || ownerId <= 0) {
    throw new ValidationError(`An authenticated ${fieldName} is required for gig operations.`);
  }
  return ownerId;
}

export function resolveProjectAccess(req, ownerId) {
  const actorId = resolveRequestUserId(req);
  const actorRoleRaw = resolveRequestUserRole(req);
  const permissions = resolveRequestPermissions(req) ?? [];
  const normalizedRole = normalizeRole(actorRoleRaw);

  const permissionFlags = permissions
    .map((permission) => permission.toString().toLowerCase())
    .reduce(
      (acc, permission) => {
        if (permission === 'project-gig-management:manage') {
          acc.manage = true;
        }
        if (permission === 'project-gig-management:read' || permission === 'project-gig-management:manage') {
          acc.read = true;
        }
        return acc;
      },
      { read: false, manage: false },
    );

  const isOwner = actorId != null && ownerId === actorId;

  const hasRoleAccess = normalizedRole
    ? Array.from(PROJECT_GIG_ALLOWED_ROLES).some(
        (role) => normalizedRole === role || normalizedRole.endsWith(role) || normalizedRole.includes(role),
      )
    : false;

  const canManage = Boolean(isOwner || permissionFlags.manage || hasRoleAccess);
  const canView = Boolean(canManage || permissionFlags.read);

  const reason = canManage
    ? null
    : actorRoleRaw
    ? `Gig operations are restricted for the ${actorRoleRaw.replace(/_/g, ' ')} role.`
    : 'Gig operations are restricted for your current access level.';

  return {
    canManage,
    canView,
    actorId,
    actorRole: normalizedRole,
    allowedRoles: Array.from(PROJECT_GIG_ALLOWED_ROLES),
    reason,
  };
}

export function ensureViewAccess(req, ownerId) {
  const access = resolveProjectAccess(req, ownerId);
  if (!access.canView) {
    throw new AuthorizationError('You do not have permission to view gig operations for this member.');
  }
  return access;
}

export function ensureManageAccess(req, ownerId) {
  const access = ensureViewAccess(req, ownerId);
  if (!access.canManage) {
    throw new AuthorizationError('You do not have permission to manage gig operations for this member.');
  }
  return access;
}

export default {
  normalizeRole,
  resolveOwnerId,
  parseOwnerId,
  requireOwnerId,
  resolveProjectAccess,
  ensureViewAccess,
  ensureManageAccess,
};
