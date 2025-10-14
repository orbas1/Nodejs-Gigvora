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

const PROJECT_GIG_ALLOWED_ROLES = [
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
];

function normalizeRole(role) {
  return role?.toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '_') ?? null;
}

function resolveOwnerId(req) {
  const candidates = [req.params?.userId, req.params?.id, req.user?.id, resolveRequestUserId(req)];
  for (const candidate of candidates) {
    const parsed = Number.parseInt(candidate, 10);
    if (Number.isInteger(parsed)) {
      return parsed;
    }
  }
  return null;
}

function resolveAccess(req, ownerId) {
  const actorId = resolveRequestUserId(req);
  const actorRoleRaw = resolveRequestUserRole(req);
  const permissions = resolveRequestPermissions(req);
  const normalizedRole = normalizeRole(actorRoleRaw);

  const permissionList = Array.isArray(permissions) ? permissions : [];

  const isOwner = actorId != null && ownerId === actorId;
  const hasManagePermission = permissionList
    .map((permission) => permission.toString().toLowerCase())
    .some((permission) => permission === 'project-gig-management:manage');
  const hasReadPermission =
    hasManagePermission ||
    permissionList
      .map((permission) => permission.toString().toLowerCase())
      .some((permission) => permission === 'project-gig-management:read');

  const isAllowedRole = normalizedRole
    ? PROJECT_GIG_ALLOWED_ROLES.some(
        (role) => normalizedRole === role || normalizedRole.endsWith(role) || normalizedRole.includes(role),
      )
    : false;

  const canManage = Boolean(isOwner || hasManagePermission || isAllowedRole);
  const canView = Boolean(canManage || hasReadPermission);
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
    allowedRoles: PROJECT_GIG_ALLOWED_ROLES,
    reason,
  };
}

function assertCanView(req, ownerId) {
  const access = resolveAccess(req, ownerId);
  if (!access.canView) {
    throw new AuthorizationError('You do not have permission to view gig operations for this member.');
  }
  return access;
}

function assertCanManage(req, ownerId) {
  const access = assertCanView(req, ownerId);
  if (!access.canManage) {
    throw new AuthorizationError('You do not have permission to manage gig operations for this member.');
  }
  return access;
}

export async function overview(req, res) {
  const ownerId = resolveOwnerId(req);
  const access = assertCanView(req, ownerId);
  const snapshot = await getProjectGigManagementOverview(ownerId);
  res.json({ ...snapshot, access });
}

export async function storeProject(req, res) {
  const ownerId = resolveOwnerId(req);
  const access = assertCanManage(req, ownerId);
  const project = await createProject(ownerId, req.body);
  const snapshot = await getProjectGigManagementOverview(ownerId);
  res.status(201).json({ project, dashboard: { ...snapshot, access } });
}

export async function storeAsset(req, res) {
  const ownerId = resolveOwnerId(req);
  const access = assertCanManage(req, ownerId);
  const asset = await addProjectAsset(ownerId, req.params.projectId, req.body);
  const snapshot = await getProjectGigManagementOverview(ownerId);
  res.status(201).json({ asset, dashboard: { ...snapshot, access } });
}

export async function patchWorkspace(req, res) {
  const ownerId = resolveOwnerId(req);
  const access = assertCanManage(req, ownerId);
  const workspace = await updateProjectWorkspace(ownerId, req.params.projectId, req.body);
  const snapshot = await getProjectGigManagementOverview(ownerId);
  res.json({ workspace, dashboard: { ...snapshot, access } });
}

export async function storeGigOrder(req, res) {
  const ownerId = resolveOwnerId(req);
  const access = assertCanManage(req, ownerId);
  const order = await createGigOrder(ownerId, req.body);
  const snapshot = await getProjectGigManagementOverview(ownerId);
  res.status(201).json({ order, dashboard: { ...snapshot, access } });
}

export async function patchGigOrder(req, res) {
  const ownerId = resolveOwnerId(req);
  const access = assertCanManage(req, ownerId);
  const order = await updateGigOrder(ownerId, req.params.orderId, req.body);
  const snapshot = await getProjectGigManagementOverview(ownerId);
  res.json({ order, dashboard: { ...snapshot, access } });
}

export default {
  overview,
  storeProject,
  storeAsset,
  patchWorkspace,
  storeGigOrder,
  patchGigOrder,
};
