import * as workflowService from '../services/projectGigManagementWorkflowService.js';
import { parsePositiveInteger } from '../utils/controllerAccess.js';
import { ValidationError } from '../utils/errors.js';
import {
  requireOwnerContext,
  sanitizeMemberActorPayload,
  attachMemberAccess,
  respondWithMemberAccess,
} from '../utils/projectMemberAccess.js';

function parseParam(req, config) {
  if (typeof config === 'string') {
    return parsePositiveInteger(req.params?.[config], config);
  }
  const { name, label = name, optional = false } = config;
  return parsePositiveInteger(req.params?.[name], label, { optional });
}

async function refreshDashboard(ownerId, access, actorId) {
  const snapshot = await workflowService.getProjectGigManagementOverview(ownerId);
  return attachMemberAccess(snapshot, access, { performedBy: actorId });
}

function resolveActorName(req) {
  return req.user?.name ?? req.user?.fullName ?? req.user?.email ?? null;
}

function createDashboardMutationHandler({ service, params = [], resultKey, status = 200, includeBody = true }) {
  if (typeof service !== 'string' || !service) {
    throw new Error('Dashboard mutation handler requires a service method name.');
  }
  return async function handler(req, res) {
    const { ownerId, access } = requireOwnerContext(req, { mode: 'manage' });
    const { actorId, payload } = sanitizeMemberActorPayload(req.body, access);
    const args = [ownerId];
    params.forEach((param) => {
      const parsed = parseParam(req, param);
      if (parsed == null && !(typeof param === 'object' && param.optional)) {
        const label = typeof param === 'string' ? param : param.label ?? param.name;
        throw new ValidationError(`${label} is required.`);
      }
      if (parsed != null) {
        args.push(parsed);
      }
    });

    if (includeBody) {
      args.push(payload);
    }

    const serviceFn = workflowService[service];
    if (typeof serviceFn !== 'function') {
      throw new Error(`Service method ${service} is not implemented.`);
    }

    const result = await serviceFn(...args);
    const dashboard = await refreshDashboard(ownerId, access, actorId);
    const response = { dashboard };
    if (resultKey) {
      response[resultKey] = result ?? null;
    }
    respondWithMemberAccess(res, response, access, { status, performedBy: actorId });
  };
}

export async function overview(req, res) {
  const { ownerId, access } = requireOwnerContext(req, { mode: 'view' });
  const dashboard = await workflowService.getProjectGigManagementOverview(ownerId);
  respondWithMemberAccess(res, { dashboard: attachMemberAccess(dashboard, access) }, access);
}

export const storeProject = createDashboardMutationHandler({
  service: 'createProject',
  resultKey: 'project',
  status: 201,
});

export const patchProject = createDashboardMutationHandler({
  service: 'updateProject',
  params: ['projectId'],
  resultKey: 'project',
});

export const storeAsset = createDashboardMutationHandler({
  service: 'addProjectAsset',
  params: ['projectId'],
  resultKey: 'asset',
  status: 201,
});

export const patchAsset = createDashboardMutationHandler({
  service: 'updateProjectAsset',
  params: ['projectId', 'assetId'],
  resultKey: 'asset',
});

export const destroyAsset = createDashboardMutationHandler({
  service: 'deleteProjectAsset',
  params: ['projectId', 'assetId'],
  resultKey: 'asset',
  includeBody: false,
});

export const patchWorkspace = createDashboardMutationHandler({
  service: 'updateProjectWorkspace',
  params: ['projectId'],
  resultKey: 'workspace',
});

export const archiveProjectAction = createDashboardMutationHandler({
  service: 'archiveProject',
  params: ['projectId'],
  resultKey: 'project',
});

export const restoreProjectAction = createDashboardMutationHandler({
  service: 'restoreProject',
  params: ['projectId'],
  resultKey: 'project',
});

export const storeMilestone = createDashboardMutationHandler({
  service: 'createProjectMilestone',
  params: ['projectId'],
  resultKey: 'milestone',
  status: 201,
});

export const patchMilestone = createDashboardMutationHandler({
  service: 'updateProjectMilestone',
  params: ['projectId', 'milestoneId'],
  resultKey: 'milestone',
});

export const destroyMilestone = createDashboardMutationHandler({
  service: 'deleteProjectMilestone',
  params: ['projectId', 'milestoneId'],
  resultKey: 'milestone',
  includeBody: false,
});

export const storeCollaborator = createDashboardMutationHandler({
  service: 'createProjectCollaborator',
  params: ['projectId'],
  resultKey: 'collaborator',
  status: 201,
});

export const patchCollaborator = createDashboardMutationHandler({
  service: 'updateProjectCollaborator',
  params: ['projectId', 'collaboratorId'],
  resultKey: 'collaborator',
});

export const destroyCollaborator = createDashboardMutationHandler({
  service: 'deleteProjectCollaborator',
  params: ['projectId', 'collaboratorId'],
  resultKey: 'collaborator',
  includeBody: false,
});

export const storeGigOrder = createDashboardMutationHandler({
  service: 'createGigOrder',
  resultKey: 'order',
  status: 201,
});

export const patchGigOrder = createDashboardMutationHandler({
  service: 'updateGigOrder',
  params: ['orderId'],
  resultKey: 'order',
});

export const storeBid = createDashboardMutationHandler({
  service: 'createProjectBid',
  resultKey: 'bid',
  status: 201,
});

export const patchBid = createDashboardMutationHandler({
  service: 'updateProjectBid',
  params: ['bidId'],
  resultKey: 'bid',
});

export const storeInvitation = createDashboardMutationHandler({
  service: 'sendProjectInvitation',
  resultKey: 'invitation',
  status: 201,
});

export const patchInvitation = createDashboardMutationHandler({
  service: 'updateProjectInvitation',
  params: ['invitationId'],
  resultKey: 'invitation',
});

export const upsertAutoMatchSettings = createDashboardMutationHandler({
  service: 'updateAutoMatchSettings',
  resultKey: 'settings',
});

export const storeAutoMatch = createDashboardMutationHandler({
  service: 'recordAutoMatchCandidate',
  resultKey: 'match',
  status: 201,
});

export const patchAutoMatch = createDashboardMutationHandler({
  service: 'updateAutoMatchCandidate',
  params: ['matchId'],
  resultKey: 'match',
});

export const storeReview = createDashboardMutationHandler({
  service: 'createProjectReview',
  resultKey: 'review',
  status: 201,
});

export const storeEscrowTransaction = createDashboardMutationHandler({
  service: 'createEscrowTransaction',
  resultKey: 'transaction',
  status: 201,
});

export const patchEscrowSettings = createDashboardMutationHandler({
  service: 'updateEscrowSettings',
  resultKey: 'account',
});

export async function storeGigTimelineEvent(req, res) {
  const { ownerId, access } = requireOwnerContext(req, { mode: 'manage' });
  const orderId = parseParam(req, 'orderId');
  const { actorId, payload } = sanitizeMemberActorPayload(req.body, access);
  const shouldUseExtendedPayload =
    payload.eventType != null || payload.visibility != null || payload.summary != null || payload.attachments != null;

  const serviceFn = shouldUseExtendedPayload
    ? () => workflowService.createGigTimelineEvent(ownerId, orderId, payload, { actorId })
    : () => workflowService.addGigTimelineEvent(ownerId, orderId, payload);

  const event = await serviceFn();
  const detail = await workflowService.getGigOrderDetail(ownerId, orderId);
  const order = attachMemberAccess(detail, access, { performedBy: actorId });
  respondWithMemberAccess(res, { event, order }, access, { status: 201, performedBy: actorId });
}

export async function patchGigTimelineEvent(req, res) {
  const { ownerId, access } = requireOwnerContext(req, { mode: 'manage' });
  const orderId = parseParam(req, 'orderId');
  const eventId = parseParam(req, 'eventId');
  const { actorId, payload } = sanitizeMemberActorPayload(req.body, access);
  const event = await workflowService.updateGigTimelineEvent(ownerId, orderId, eventId, payload);
  const detail = await workflowService.getGigOrderDetail(ownerId, orderId);
  const order = attachMemberAccess(detail, access, { performedBy: actorId });
  respondWithMemberAccess(res, { event, order }, access, { performedBy: actorId });
}

export async function storeGigMessage(req, res) {
  const { ownerId, access } = requireOwnerContext(req, { mode: 'manage' });
  const orderId = parseParam(req, 'orderId');
  const { actorId, payload, actorRole } = sanitizeMemberActorPayload(req.body, access);
  const actorContext = { actorId, actorRole, actorName: resolveActorName(req) };
  const message = await workflowService.createGigOrderMessage(ownerId, orderId, payload, actorContext);
  const dashboard = await refreshDashboard(ownerId, access, actorId);
  respondWithMemberAccess(res, { message, dashboard }, access, { status: 201, performedBy: actorId });
}

export async function storeGigEscrowCheckpoint(req, res) {
  const { ownerId, access } = requireOwnerContext(req, { mode: 'manage' });
  const orderId = parseParam(req, 'orderId');
  const { actorId, payload, actorRole } = sanitizeMemberActorPayload(req.body, access);
  const actorContext = { actorId, actorRole };
  const checkpoint = await workflowService.createGigOrderEscrowCheckpoint(ownerId, orderId, payload, actorContext);
  const dashboard = await refreshDashboard(ownerId, access, actorId);
  respondWithMemberAccess(res, { checkpoint, dashboard }, access, { status: 201, performedBy: actorId });
}

export async function patchGigEscrowCheckpoint(req, res) {
  const { ownerId, access } = requireOwnerContext(req, { mode: 'manage' });
  const checkpointId = parseParam(req, 'checkpointId');
  const { actorId, payload, actorRole } = sanitizeMemberActorPayload(req.body, access);
  const actorContext = { actorId, actorRole };
  const checkpoint = await workflowService.updateGigOrderEscrowCheckpoint(ownerId, checkpointId, payload, actorContext);
  const dashboard = await refreshDashboard(ownerId, access, actorId);
  respondWithMemberAccess(res, { checkpoint, dashboard }, access, { performedBy: actorId });
}

export async function storeGigSubmission(req, res) {
  const { ownerId, access } = requireOwnerContext(req, { mode: 'manage' });
  const orderId = parseParam(req, 'orderId');
  const { actorId, payload } = sanitizeMemberActorPayload(req.body, access);
  const shouldUseExtendedPayload = payload.eventType != null || payload.attachments != null || payload.description != null;
  const result = await (shouldUseExtendedPayload
    ? workflowService.createGigSubmission(ownerId, orderId, payload, { actorId })
    : workflowService.addGigSubmission(ownerId, orderId, payload));
  const detail = await workflowService.getGigOrderDetail(ownerId, orderId);
  const order = attachMemberAccess(detail, access, { performedBy: actorId });
  respondWithMemberAccess(res, { submission: result, order }, access, { status: 201, performedBy: actorId });
}

export async function patchGigSubmission(req, res) {
  const { ownerId, access } = requireOwnerContext(req, { mode: 'manage' });
  const orderId = parseParam(req, 'orderId');
  const submissionId = parseParam(req, 'submissionId');
  const { actorId, payload } = sanitizeMemberActorPayload(req.body, access);
  const submission = await workflowService.updateGigSubmission(ownerId, orderId, submissionId, payload, { actorId });
  const detail = await workflowService.getGigOrderDetail(ownerId, orderId);
  const order = attachMemberAccess(detail, access, { performedBy: actorId });
  respondWithMemberAccess(res, { submission, order }, access, { performedBy: actorId });
}

export async function storeGigChatMessage(req, res) {
  const { ownerId, access } = requireOwnerContext(req, { mode: 'manage' });
  const orderId = parseParam(req, 'orderId');
  const { actorId, payload, actorRole } = sanitizeMemberActorPayload(req.body, access);
  const actorContext = { actorId, actorRole };
  const message = await workflowService.postGigChatMessage(ownerId, orderId, payload, actorContext);
  const detail = await workflowService.getGigOrderDetail(ownerId, orderId);
  const order = attachMemberAccess(detail, access, { performedBy: actorId });
  respondWithMemberAccess(res, { message, order }, access, { status: 201, performedBy: actorId });
}

export async function showGigOrder(req, res) {
  const { ownerId, access } = requireOwnerContext(req, { mode: 'view' });
  const orderId = parseParam(req, 'orderId');
  const detail = await workflowService.getGigOrderDetail(ownerId, orderId);
  const order = attachMemberAccess(detail, access);
  respondWithMemberAccess(res, { order }, access);
}

export async function acknowledgeGigMessage(req, res) {
  const { ownerId, access } = requireOwnerContext(req, { mode: 'manage' });
  const orderId = parseParam(req, 'orderId');
  const messageId = parseParam(req, 'messageId');
  const { actorId } = sanitizeMemberActorPayload(req.body, access);
  const message = await workflowService.acknowledgeGigChatMessage(ownerId, orderId, messageId, { actorId });
  const detail = await workflowService.getGigOrderDetail(ownerId, orderId);
  const order = attachMemberAccess(detail, access, { performedBy: actorId });
  respondWithMemberAccess(res, { message, order }, access, { performedBy: actorId });
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
