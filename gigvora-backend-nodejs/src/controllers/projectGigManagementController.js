import {
  getProjectGigManagementOverview,
  createProject,
  updateProject,
  addProjectAsset,
  updateProjectAsset,
  deleteProjectAsset,
  updateProjectWorkspace,
  createProjectMilestone,
  updateProjectMilestone,
  deleteProjectMilestone,
  createProjectCollaborator,
  updateProjectCollaborator,
  deleteProjectCollaborator,
  createGigOrder,
  updateGigOrder,
  addGigOrderActivity,
  createGigOrderMessage,
  createGigOrderEscrowCheckpoint,
  updateGigOrderEscrowCheckpoint,
  archiveProject,
  restoreProject,
  addGigTimelineEvent,
  updateGigTimelineEvent,
  addGigSubmission,
  updateGigSubmission,
  postGigChatMessage,
  getGigOrderDetail,
  createGigTimelineEvent,
  createGigSubmission,
  updateGigSubmission,
  postGigChatMessage,
  acknowledgeGigChatMessage,
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

async function withOrderRefresh(ownerId, orderId, resolver) {
  const result = await resolver();
  const detail = await getGigOrderDetail(ownerId, orderId);
  return { result, detail };
}

export async function storeProject(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () => createProject(ownerId, req.body));
  res.status(201).json({ project: result, dashboard: snapshot });
}

export async function patchProject(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    updateProject(ownerId, projectId, req.body),
  );
  res.json({ project: result, dashboard: snapshot });
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

export async function patchAsset(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const assetId = Number.parseInt(req.params?.assetId, 10);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    updateProjectAsset(ownerId, projectId, assetId, req.body),
  );
  res.json({ asset: result, dashboard: snapshot });
}

export async function destroyAsset(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const assetId = Number.parseInt(req.params?.assetId, 10);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    deleteProjectAsset(ownerId, projectId, assetId),
  );
  res.json({ asset: result, dashboard: snapshot });
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

export async function archiveProjectAction(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    archiveProject(ownerId, projectId, req.body ?? {}),
  );
  res.json({ project: result, dashboard: snapshot });
}

export async function restoreProjectAction(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    restoreProject(ownerId, projectId, req.body ?? {}),
  );
  res.json({ project: result, dashboard: snapshot });
}

export async function storeMilestone(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    createProjectMilestone(ownerId, projectId, req.body),
  );
  res.status(201).json({ milestone: result, dashboard: snapshot });
}

export async function patchMilestone(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const milestoneId = Number.parseInt(req.params?.milestoneId, 10);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    updateProjectMilestone(ownerId, projectId, milestoneId, req.body),
  );
  res.json({ milestone: result, dashboard: snapshot });
}

export async function destroyMilestone(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const milestoneId = Number.parseInt(req.params?.milestoneId, 10);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    deleteProjectMilestone(ownerId, projectId, milestoneId),
  );
  res.json({ milestone: result, dashboard: snapshot });
}

export async function storeCollaborator(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    createProjectCollaborator(ownerId, projectId, req.body),
  );
  res.status(201).json({ collaborator: result, dashboard: snapshot });
}

export async function patchCollaborator(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const collaboratorId = Number.parseInt(req.params?.collaboratorId, 10);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    updateProjectCollaborator(ownerId, projectId, collaboratorId, req.body),
  );
  res.json({ collaborator: result, dashboard: snapshot });
}

export async function destroyCollaborator(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const collaboratorId = Number.parseInt(req.params?.collaboratorId, 10);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    deleteProjectCollaborator(ownerId, projectId, collaboratorId),
  );
  res.json({ collaborator: result, dashboard: snapshot });
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

export async function storeGigTimelineEvent(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const orderId = Number.parseInt(req.params?.orderId, 10);
  const actorContext = {
    actorId: access.actorId,
    actorRole: access.actorRole,
  };
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    addGigOrderActivity(ownerId, orderId, req.body, actorContext),
  );
  res.status(201).json({ activity: result, dashboard: snapshot });
}

export async function storeGigMessage(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const orderId = Number.parseInt(req.params?.orderId, 10);
  const actorContext = {
    actorId: access.actorId,
    actorRole: access.actorRole,
    actorName: req.user?.name ?? req.user?.fullName ?? req.user?.email ?? null,
  };
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    createGigOrderMessage(ownerId, orderId, req.body, actorContext),
  );
  res.status(201).json({ message: result, dashboard: snapshot });
}

export async function storeGigEscrowCheckpoint(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const orderId = Number.parseInt(req.params?.orderId, 10);
  const actorContext = {
    actorId: access.actorId,
    actorRole: access.actorRole,
  };
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    createGigOrderEscrowCheckpoint(ownerId, orderId, req.body, actorContext),
  );
  res.status(201).json({ checkpoint: result, dashboard: snapshot });
}

export async function patchGigEscrowCheckpoint(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const checkpointId = Number.parseInt(req.params?.checkpointId, 10);
  const actorContext = {
    actorId: access.actorId,
    actorRole: access.actorRole,
  };
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    updateGigOrderEscrowCheckpoint(ownerId, checkpointId, req.body, actorContext),
  );
  res.json({ checkpoint: result, dashboard: snapshot });
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    addGigTimelineEvent(ownerId, orderId, req.body),
  );
  res.status(201).json({ event: result, dashboard: snapshot });
}

export async function patchGigTimelineEvent(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const orderId = Number.parseInt(req.params?.orderId, 10);
  const eventId = Number.parseInt(req.params?.eventId, 10);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    updateGigTimelineEvent(ownerId, orderId, eventId, req.body),
  );
  res.json({ event: result, dashboard: snapshot });
export async function showGigOrder(req, res) {
  const ownerId = parseOwnerId(req);
  ensureViewAccess(req, ownerId);
  const orderId = Number.parseInt(req.params?.orderId, 10);
  const detail = await getGigOrderDetail(ownerId, orderId);
  res.json({ order: detail });
}

export async function storeGigTimelineEvent(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const orderId = Number.parseInt(req.params?.orderId, 10);
  const { result, detail } = await withOrderRefresh(ownerId, orderId, () =>
    createGigTimelineEvent(ownerId, orderId, req.body, { actorId: access.actorId }),
  );
  res.status(201).json({ event: result, order: detail });
}

export async function storeGigSubmission(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const orderId = Number.parseInt(req.params?.orderId, 10);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    addGigSubmission(ownerId, orderId, req.body),
  );
  res.status(201).json({ submission: result, dashboard: snapshot });
  const { result, detail } = await withOrderRefresh(ownerId, orderId, () =>
    createGigSubmission(ownerId, orderId, req.body, { actorId: access.actorId }),
  );
  res.status(201).json({ submission: result, order: detail });
}

export async function patchGigSubmission(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const orderId = Number.parseInt(req.params?.orderId, 10);
  const submissionId = Number.parseInt(req.params?.submissionId, 10);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    updateGigSubmission(ownerId, orderId, submissionId, req.body),
  );
  res.json({ submission: result, dashboard: snapshot });
  const { result, detail } = await withOrderRefresh(ownerId, orderId, () =>
    updateGigSubmission(ownerId, orderId, submissionId, req.body, { actorId: access.actorId }),
  );
  res.json({ submission: result, order: detail });
}

export async function storeGigChatMessage(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const orderId = Number.parseInt(req.params?.orderId, 10);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    postGigChatMessage(ownerId, orderId, req.body),
  );
  res.status(201).json({ message: result, dashboard: snapshot });
  const { result, detail } = await withOrderRefresh(ownerId, orderId, () =>
    postGigChatMessage(ownerId, orderId, req.body, { actorId: access.actorId, actorRole: access.actorRole }),
  );
  res.status(201).json({ message: result, order: detail });
}

export async function acknowledgeGigMessage(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const orderId = Number.parseInt(req.params?.orderId, 10);
  const messageId = Number.parseInt(req.params?.messageId, 10);
  const { result, detail } = await withOrderRefresh(ownerId, orderId, () =>
    acknowledgeGigChatMessage(ownerId, orderId, messageId, { actorId: access.actorId }),
  );
  res.json({ message: result, order: detail });
}

export default {
  overview,
  storeProject,
  patchProject,
  storeAsset,
  patchAsset,
  destroyAsset,
  patchWorkspace,
  archiveProjectAction,
  restoreProjectAction,
  storeMilestone,
  patchMilestone,
  destroyMilestone,
  storeCollaborator,
  patchCollaborator,
  destroyCollaborator,
  storeGigOrder,
  patchGigOrder,
  storeGigTimelineEvent,
  storeGigMessage,
  storeGigEscrowCheckpoint,
  patchGigEscrowCheckpoint,
  patchGigTimelineEvent,
  storeGigSubmission,
  patchGigSubmission,
  storeGigChatMessage,
  showGigOrder,
  storeGigTimelineEvent,
  storeGigSubmission,
  patchGigSubmission,
  storeGigChatMessage,
  acknowledgeGigMessage,
};
