import {
  getProjectGigManagementOverview,
  createProject,
  updateProject,
  addProjectAsset,
  updateProjectAsset,
  deleteProjectAsset,
  updateProjectWorkspace,
  archiveProject,
  restoreProject,
  createProjectMilestone,
  updateProjectMilestone,
  deleteProjectMilestone,
  createProjectCollaborator,
  updateProjectCollaborator,
  deleteProjectCollaborator,
  createGigOrder,
  updateGigOrder,
  createProjectBid,
  updateProjectBid,
  sendProjectInvitation,
  updateProjectInvitation,
  updateAutoMatchSettings,
  recordAutoMatchCandidate,
  updateAutoMatchCandidate,
  createProjectReview,
  createEscrowTransaction,
  updateEscrowSettings,
  addGigTimelineEvent,
  updateGigTimelineEvent,
  addGigSubmission,
  updateGigSubmission as updateGigSubmissionService,
  postGigChatMessage,
  getGigOrderDetail,
  createGigTimelineEvent,
  createGigSubmission,
  acknowledgeGigChatMessage,
  createGigOrderMessage,
  createGigOrderEscrowCheckpoint,
  updateGigOrderEscrowCheckpoint,
} from '../services/projectGigManagementWorkflowService.js';
import { ensureManageAccess, ensureViewAccess, parseOwnerId } from '../utils/projectAccess.js';

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

export async function overview(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureViewAccess(req, ownerId);
  const snapshot = await getProjectGigManagementOverview(ownerId);
  res.json({ ...snapshot, access });
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
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () => updateProject(ownerId, projectId, req.body));
  res.json({ project: result, dashboard: snapshot });
}

export async function storeAsset(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () => addProjectAsset(ownerId, projectId, req.body));
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
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () => updateGigOrder(ownerId, orderId, req.body));
  res.json({ order: result, dashboard: snapshot });
}

export async function storeBid(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () => createProjectBid(ownerId, req.body));
  res.status(201).json({ bid: result, dashboard: snapshot });
}

export async function patchBid(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const bidId = Number.parseInt(req.params?.bidId, 10);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () => updateProjectBid(ownerId, bidId, req.body));
  res.json({ bid: result, dashboard: snapshot });
}

export async function storeInvitation(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () => sendProjectInvitation(ownerId, req.body));
  res.status(201).json({ invitation: result, dashboard: snapshot });
}

export async function patchInvitation(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const invitationId = Number.parseInt(req.params?.invitationId, 10);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    updateProjectInvitation(ownerId, invitationId, req.body),
  );
  res.json({ invitation: result, dashboard: snapshot });
}

export async function upsertAutoMatchSettings(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    updateAutoMatchSettings(ownerId, req.body),
  );
  res.json({ settings: result, dashboard: snapshot });
}

export async function storeAutoMatch(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    recordAutoMatchCandidate(ownerId, req.body),
  );
  res.status(201).json({ match: result, dashboard: snapshot });
}

export async function patchAutoMatch(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const matchId = Number.parseInt(req.params?.matchId, 10);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    updateAutoMatchCandidate(ownerId, matchId, req.body),
  );
  res.json({ match: result, dashboard: snapshot });
}

export async function storeReview(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () => createProjectReview(ownerId, req.body));
  res.status(201).json({ review: result, dashboard: snapshot });
}

export async function storeEscrowTransaction(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    createEscrowTransaction(ownerId, req.body),
  );
  res.status(201).json({ transaction: result, dashboard: snapshot });
}

export async function patchEscrowSettings(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () => updateEscrowSettings(ownerId, req.body));
  res.json({ account: result, dashboard: snapshot });
}

export async function storeGigTimelineEvent(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const orderId = Number.parseInt(req.params?.orderId, 10);
  const useNewPayload =
    req.body.eventType != null || req.body.visibility != null || req.body.summary != null || req.body.attachments != null;
  const handler = () =>
    (useNewPayload
      ? createGigTimelineEvent(ownerId, orderId, req.body, { actorId: access.actorId })
      : addGigTimelineEvent(ownerId, orderId, req.body));
  const { result, detail } = await withOrderRefresh(ownerId, orderId, handler);
  res.status(201).json({ event: result, order: detail });
}

export async function patchGigTimelineEvent(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const orderId = Number.parseInt(req.params?.orderId, 10);
  const eventId = Number.parseInt(req.params?.eventId, 10);
  const { result, detail } = await withOrderRefresh(ownerId, orderId, () =>
    updateGigTimelineEvent(ownerId, orderId, eventId, req.body),
  );
  res.json({ event: result, order: detail });
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
  const actorContext = { actorId: access.actorId, actorRole: access.actorRole };
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    createGigOrderEscrowCheckpoint(ownerId, orderId, req.body, actorContext),
  );
  res.status(201).json({ checkpoint: result, dashboard: snapshot });
}

export async function patchGigEscrowCheckpoint(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const checkpointId = Number.parseInt(req.params?.checkpointId, 10);
  const actorContext = { actorId: access.actorId, actorRole: access.actorRole };
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    updateGigOrderEscrowCheckpoint(ownerId, checkpointId, req.body, actorContext),
  );
  res.json({ checkpoint: result, dashboard: snapshot });
}

export async function storeGigSubmission(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const orderId = Number.parseInt(req.params?.orderId, 10);
  const handler = () =>
    (req.body.eventType || req.body.attachments || req.body.description
      ? createGigSubmission(ownerId, orderId, req.body, { actorId: access.actorId })
      : addGigSubmission(ownerId, orderId, req.body));
  const { result, detail } = await withOrderRefresh(ownerId, orderId, handler);
  res.status(201).json({ submission: result, order: detail });
}

export async function patchGigSubmission(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const orderId = Number.parseInt(req.params?.orderId, 10);
  const submissionId = Number.parseInt(req.params?.submissionId, 10);
  const { result, detail } = await withOrderRefresh(ownerId, orderId, () =>
    updateGigSubmissionService(ownerId, orderId, submissionId, req.body, { actorId: access.actorId }),
  );
  res.json({ submission: result, order: detail });
}

export async function storeGigChatMessage(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const orderId = Number.parseInt(req.params?.orderId, 10);
  const actorContext = { actorId: access.actorId, actorRole: access.actorRole };
  const { result, detail } = await withOrderRefresh(ownerId, orderId, () =>
    postGigChatMessage(ownerId, orderId, req.body, actorContext),
  );
  res.status(201).json({ message: result, order: detail });
}

export async function showGigOrder(req, res) {
  const ownerId = parseOwnerId(req);
  ensureViewAccess(req, ownerId);
  const orderId = Number.parseInt(req.params?.orderId, 10);
  const detail = await getGigOrderDetail(ownerId, orderId);
  res.json({ order: detail });
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
  storeBid,
  patchBid,
  storeInvitation,
  patchInvitation,
  upsertAutoMatchSettings,
  storeAutoMatch,
  patchAutoMatch,
  storeReview,
  storeEscrowTransaction,
  patchEscrowSettings,
  storeGigTimelineEvent,
  patchGigTimelineEvent,
  storeGigMessage,
  storeGigEscrowCheckpoint,
  patchGigEscrowCheckpoint,
  storeGigSubmission,
  patchGigSubmission,
  storeGigChatMessage,
  showGigOrder,
  acknowledgeGigMessage,
};
