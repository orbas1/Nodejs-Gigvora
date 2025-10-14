import {
  getProjectGigManagementOverview,
  createProject,
  addProjectAsset,
  updateProjectWorkspace,
  createGigOrder,
  updateGigOrder,
} from '../services/projectGigManagementWorkflowService.js';
import { AuthorizationError } from '../utils/errors.js';
import {
  resolveRequestPermissions,
  resolveRequestUserId,
  resolveRequestUserRole,
} from '../utils/requestContext.js';

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

function normalizeRole(role) {
  return role?.toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '_') ?? null;
}

function resolveAccess(req, ownerId) {
  const actorId = resolveRequestUserId(req);
  const actorRoleRaw = resolveRequestUserRole(req);
  const permissions = resolveRequestPermissions(req) ?? [];
  const normalizedRole = normalizeRole(actorRoleRaw);

  const isOwner = actorId != null && ownerId === actorId;
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

function ensureViewAccess(req, ownerId) {
  const access = resolveAccess(req, ownerId);
  if (!access.canView) {
    throw new AuthorizationError('You do not have permission to view gig operations for this member.');
  }
  return access;
}

function ensureManageAccess(req, ownerId) {
  const access = ensureViewAccess(req, ownerId);
  if (!access.canManage) {
    throw new AuthorizationError('You do not have permission to manage gig operations for this member.');
  }
  return access;
}

function parseOwnerId(req) {
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

export async function overview(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureViewAccess(req, ownerId);
  const snapshot = await getProjectGigManagementOverview(ownerId);
  res.json({ ...snapshot, access });
}

async function withDashboardRefresh(ownerId, access, resolver) {
  const result = await resolver();
  const snapshot = await getProjectGigManagementOverview(ownerId);
  return { result, snapshot: { ...snapshot, access } };
}

export async function storeProject(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () => createProject(ownerId, req.body));
  res.status(201).json({ project: result, dashboard: snapshot });
}

export async function storeAsset(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    addProjectAsset(ownerId, projectId, req.body),
  );
  res.status(201).json({ asset: result, dashboard: snapshot });
}

export async function patchWorkspace(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    updateProjectWorkspace(ownerId, projectId, req.body),
  );
  res.json({ workspace: result, dashboard: snapshot });
}

export async function storeGigOrder(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () => createGigOrder(ownerId, req.body));
  res.status(201).json({ order: result, dashboard: snapshot });
}

export async function patchGigOrder(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const orderId = Number.parseInt(req.params?.orderId, 10);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    updateGigOrder(ownerId, orderId, req.body),
  );
  res.json({ order: result, dashboard: snapshot });
}

export default {
  overview,
  storeProject,
  storeAsset,
  patchWorkspace,
  storeGigOrder,
  patchGigOrder,
};
