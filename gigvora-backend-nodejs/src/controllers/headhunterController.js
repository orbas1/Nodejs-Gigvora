import { getDashboardSnapshot } from '../services/headhunterService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions, resolveRequestUserId } from '../utils/requestContext.js';

function parsePositiveInteger(value, label, { optional = false } = {}) {
  if (value == null || value === '') {
    if (optional) {
      return null;
    }
    throw new ValidationError(`${label} is required.`);
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return parsed;
}

function resolveWorkspaceMemberships(req) {
  const memberships = new Set();
  const candidateCollections = [req.user?.workspaceIds, req.user?.workspaces, req.user?.companies];
  for (const collection of candidateCollections) {
    if (!collection) continue;
    const array = Array.isArray(collection) ? collection : [collection];
    array
      .map((value) => Number.parseInt(value?.id ?? value, 10))
      .filter((value) => Number.isFinite(value) && value > 0)
      .forEach((value) => memberships.add(value));
  }
  return Array.from(memberships);
}

function ensureHeadhunterAccess(req, workspaceId) {
  const actorId = resolveRequestUserId(req);
  if (!actorId) {
    throw new AuthorizationError('Authentication required.');
  }

  const permissionSet = new Set(resolveRequestPermissions(req).map((permission) => permission.toLowerCase()));
  const roleCandidates = Array.isArray(req.user?.roles) ? req.user.roles : [req.user?.role].filter(Boolean);
  roleCandidates
    .map((role) => `${role}`.toLowerCase())
    .forEach((role) => permissionSet.add(role));

  const globalPermissions = ['admin', 'headhunter.manage.any', 'talent.manage.any', 'headhunter.admin'];
  const membershipPermissions = ['headhunter', 'recruiter', 'employer'];

  const hasGlobalAccess = globalPermissions.some((permission) => permissionSet.has(permission));
  const requiresMembership = membershipPermissions.some((permission) => permissionSet.has(permission));

  if (!workspaceId) {
    if (hasGlobalAccess || requiresMembership) {
      return { actorId, permissionSet };
    }
    throw new AuthorizationError('You do not have permission to access headhunter dashboards.');
  }

  const memberships = resolveWorkspaceMemberships(req);
  if (memberships.length && !memberships.includes(workspaceId) && !hasGlobalAccess) {
    throw new AuthorizationError('You do not have access to this workspace.');
  }

  if (!hasGlobalAccess && memberships.length === 0 && requiresMembership) {
    throw new AuthorizationError('You must belong to the workspace to access this dashboard.');
  }

  return { actorId, permissionSet };
}

export async function dashboard(req, res) {
  const requestedWorkspaceId = parsePositiveInteger(req.query?.workspaceId, 'workspaceId', { optional: true });
  const memberships = resolveWorkspaceMemberships(req);
  const resolvedWorkspaceId = requestedWorkspaceId ?? memberships[0] ?? null;
  if (!resolvedWorkspaceId) {
    throw new ValidationError('workspaceId is required.');
  }

  ensureHeadhunterAccess(req, resolvedWorkspaceId);

  const lookback = req.query?.lookbackDays == null ? 30 : parsePositiveInteger(req.query.lookbackDays, 'lookbackDays');
  const lookbackDays = Math.min(lookback, 365);

  const result = await getDashboardSnapshot({ workspaceId: resolvedWorkspaceId, lookbackDays });
  res.json({
    ...result,
    workspaceId: resolvedWorkspaceId,
    memberships,
    lookbackDays,
  });
}

export default {
  dashboard,
};
