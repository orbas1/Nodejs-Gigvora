import apiClient from './apiClient.js';

const USERS_BASE_PATH = '/users';
const MODULE_SEGMENT = 'project-gig-management';

const unwrap = (response) => response?.data ?? response ?? null;

function ensureIdentifier(name, value) {
  if (value === undefined || value === null) {
    throw new Error(`${name} is required`);
  }
  const trimmed = `${value}`.trim();
  if (!trimmed) {
    throw new Error(`${name} is required`);
  }
  return trimmed;
}

function ensureUserId(userId) {
  return ensureIdentifier('userId', userId);
}

function ensurePayload(payload) {
  if (payload === undefined || payload === null) {
    return {};
  }
  if (typeof payload !== 'object') {
    throw new Error('Payload must be an object.');
  }
  return payload;
}

function ensureOptions(options) {
  if (options === undefined || options === null) {
    return {};
  }
  if (typeof options !== 'object') {
    throw new Error('Options must be an object.');
  }
  return options;
}

function buildPath(userId, ...segments) {
  const safeSegments = [MODULE_SEGMENT, ...segments]
    .filter((segment) => segment !== undefined && segment !== null)
    .map((segment) => `${segment}`.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment));
  const prefix = `${USERS_BASE_PATH}/${encodeURIComponent(ensureUserId(userId))}`;
  return `${prefix}/${safeSegments.join('/')}`;
}

async function getResource(userId, segments, options) {
  const safeOptions = ensureOptions(options);
  const path = buildPath(userId, ...segments);
  const response = await apiClient.get(
    path,
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
  return unwrap(response);
}

async function mutateResource(method, userId, segments, payload, options) {
  const safePayload = ensurePayload(payload);
  const safeOptions = ensureOptions(options);
  const client = apiClient[method];
  if (typeof client !== 'function') {
    throw new Error(`Unsupported method ${method}`);
  }
  const path = buildPath(userId, ...segments);
  const response = await client(
    path,
    safePayload,
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
  return unwrap(response);
}

async function deleteResource(userId, segments, options) {
  const safeOptions = ensureOptions(options);
  const path = buildPath(userId, ...segments);
  const response = await apiClient.delete(
    path,
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
  return unwrap(response);
}

export async function fetchProjectGigManagement(userId, options) {
  return getResource(userId, [], options);
}

export async function createProject(userId, payload, options) {
  return mutateResource('post', userId, ['projects'], payload, options);
}

export async function updateProject(userId, projectId, payload, options) {
  const safeProjectId = ensureIdentifier('projectId', projectId);
  return mutateResource('patch', userId, ['projects', safeProjectId], payload, options);
}

export async function addProjectAsset(userId, projectId, payload, options) {
  const safeProjectId = ensureIdentifier('projectId', projectId);
  return mutateResource('post', userId, ['projects', safeProjectId, 'assets'], payload, options);
}

export async function updateProjectAsset(userId, projectId, assetId, payload, options) {
  const safeProjectId = ensureIdentifier('projectId', projectId);
  const safeAssetId = ensureIdentifier('assetId', assetId);
  return mutateResource('patch', userId, ['projects', safeProjectId, 'assets', safeAssetId], payload, options);
}

export async function deleteProjectAsset(userId, projectId, assetId, options) {
  const safeProjectId = ensureIdentifier('projectId', projectId);
  const safeAssetId = ensureIdentifier('assetId', assetId);
  return deleteResource(userId, ['projects', safeProjectId, 'assets', safeAssetId], options);
}

export async function updateWorkspace(userId, projectId, payload, options) {
  const safeProjectId = ensureIdentifier('projectId', projectId);
  return mutateResource('patch', userId, ['projects', safeProjectId, 'workspace'], payload, options);
}

export async function createProjectMilestone(userId, projectId, payload, options) {
  const safeProjectId = ensureIdentifier('projectId', projectId);
  return mutateResource('post', userId, ['projects', safeProjectId, 'milestones'], payload, options);
}

export async function updateProjectMilestone(userId, projectId, milestoneId, payload, options) {
  const safeProjectId = ensureIdentifier('projectId', projectId);
  const safeMilestoneId = ensureIdentifier('milestoneId', milestoneId);
  return mutateResource('patch', userId, ['projects', safeProjectId, 'milestones', safeMilestoneId], payload, options);
}

export async function deleteProjectMilestone(userId, projectId, milestoneId, options) {
  const safeProjectId = ensureIdentifier('projectId', projectId);
  const safeMilestoneId = ensureIdentifier('milestoneId', milestoneId);
  return deleteResource(userId, ['projects', safeProjectId, 'milestones', safeMilestoneId], options);
}

export async function createProjectCollaborator(userId, projectId, payload, options) {
  const safeProjectId = ensureIdentifier('projectId', projectId);
  return mutateResource('post', userId, ['projects', safeProjectId, 'collaborators'], payload, options);
}

export async function updateProjectCollaborator(userId, projectId, collaboratorId, payload, options) {
  const safeProjectId = ensureIdentifier('projectId', projectId);
  const safeCollaboratorId = ensureIdentifier('collaboratorId', collaboratorId);
  return mutateResource(
    'patch',
    userId,
    ['projects', safeProjectId, 'collaborators', safeCollaboratorId],
    payload,
    options,
  );
}

export async function deleteProjectCollaborator(userId, projectId, collaboratorId, options) {
  const safeProjectId = ensureIdentifier('projectId', projectId);
  const safeCollaboratorId = ensureIdentifier('collaboratorId', collaboratorId);
  return deleteResource(userId, ['projects', safeProjectId, 'collaborators', safeCollaboratorId], options);
}

export async function archiveProject(userId, projectId, payload = {}, options) {
  const safeProjectId = ensureIdentifier('projectId', projectId);
  return mutateResource('post', userId, ['projects', safeProjectId, 'archive'], payload, options);
}

export async function restoreProject(userId, projectId, payload = {}, options) {
  const safeProjectId = ensureIdentifier('projectId', projectId);
  return mutateResource('post', userId, ['projects', safeProjectId, 'restore'], payload, options);
}

export async function createGigOrder(userId, payload, options) {
  return mutateResource('post', userId, ['gig-orders'], payload, options);
}

export async function updateGigOrder(userId, orderId, payload, options) {
  const safeOrderId = ensureIdentifier('orderId', orderId);
  return mutateResource('patch', userId, ['gig-orders', safeOrderId], payload, options);
}

export async function createProjectBid(userId, payload, options) {
  return mutateResource('post', userId, ['project-bids'], payload, options);
}

export async function updateProjectBid(userId, bidId, payload, options) {
  const safeBidId = ensureIdentifier('bidId', bidId);
  return mutateResource('patch', userId, ['project-bids', safeBidId], payload, options);
}

export async function addGigTimelineEvent(userId, orderId, payload, options) {
  return createGigTimelineEvent(userId, orderId, payload, options);
}

export async function createGigTimelineEvent(userId, orderId, payload, options) {
  const safeOrderId = ensureIdentifier('orderId', orderId);
  return mutateResource('post', userId, ['gig-orders', safeOrderId, 'timeline'], payload, options);
}

export async function postGigOrderMessage(userId, orderId, payload, options) {
  const safeOrderId = ensureIdentifier('orderId', orderId);
  return mutateResource('post', userId, ['gig-orders', safeOrderId, 'messages'], payload, options);
}

export async function updateGigTimelineEvent(userId, orderId, eventId, payload, options) {
  const safeOrderId = ensureIdentifier('orderId', orderId);
  const safeEventId = ensureIdentifier('eventId', eventId);
  return mutateResource('patch', userId, ['gig-orders', safeOrderId, 'timeline', safeEventId], payload, options);
}

export async function sendProjectInvitation(userId, payload, options) {
  return mutateResource('post', userId, ['invitations'], payload, options);
}

export async function updateProjectInvitation(userId, invitationId, payload, options) {
  const safeInvitationId = ensureIdentifier('invitationId', invitationId);
  return mutateResource('patch', userId, ['invitations', safeInvitationId], payload, options);
}

export async function createGigEscrowCheckpoint(userId, orderId, payload, options) {
  const safeOrderId = ensureIdentifier('orderId', orderId);
  return mutateResource('post', userId, ['gig-orders', safeOrderId, 'escrow'], payload, options);
}

export async function updateGigEscrowCheckpoint(userId, orderId, checkpointId, payload, options) {
  const safeOrderId = ensureIdentifier('orderId', orderId);
  const safeCheckpointId = ensureIdentifier('checkpointId', checkpointId);
  return mutateResource(
    'patch',
    userId,
    ['gig-orders', safeOrderId, 'escrow', safeCheckpointId],
    payload,
    options,
  );
}

export async function createGigSubmission(userId, orderId, payload, options) {
  const safeOrderId = ensureIdentifier('orderId', orderId);
  return mutateResource('post', userId, ['gig-orders', safeOrderId, 'submissions'], payload, options);
}

export async function updateGigSubmission(userId, orderId, submissionId, payload, options) {
  const safeOrderId = ensureIdentifier('orderId', orderId);
  const safeSubmissionId = ensureIdentifier('submissionId', submissionId);
  return mutateResource(
    'patch',
    userId,
    ['gig-orders', safeOrderId, 'submissions', safeSubmissionId],
    payload,
    options,
  );
}

export async function updateAutoMatchSettings(userId, payload, options) {
  return mutateResource('put', userId, ['auto-match', 'settings'], payload, options);
}

export async function createAutoMatch(userId, payload, options) {
  return mutateResource('post', userId, ['auto-match', 'matches'], payload, options);
}

export async function updateAutoMatch(userId, matchId, payload, options) {
  const safeMatchId = ensureIdentifier('matchId', matchId);
  return mutateResource('patch', userId, ['auto-match', 'matches', safeMatchId], payload, options);
}

export async function createProjectReview(userId, payload, options) {
  return mutateResource('post', userId, ['reviews'], payload, options);
}

export async function createEscrowTransaction(userId, payload, options) {
  return mutateResource('post', userId, ['escrow', 'transactions'], payload, options);
}

export async function updateEscrowSettings(userId, payload, options) {
  return mutateResource('patch', userId, ['escrow', 'settings'], payload, options);
}

export async function postGigChatMessage(userId, orderId, payload, options) {
  const safeOrderId = ensureIdentifier('orderId', orderId);
  return mutateResource('post', userId, ['gig-orders', safeOrderId, 'chat'], payload, options);
}

export async function fetchGigOrderDetail(userId, orderId, options = {}) {
  const { signal, ...rest } = options ?? {};
  const safeOptions = ensureOptions(rest);
  const requestOptions = { ...safeOptions };
  if (signal) {
    requestOptions.signal = signal;
  }
  const safeOrderId = ensureIdentifier('orderId', orderId);
  return getResource(userId, ['gig-orders', safeOrderId], requestOptions);
}

export async function acknowledgeGigChatMessage(userId, orderId, messageId, options) {
  const safeOrderId = ensureIdentifier('orderId', orderId);
  const safeMessageId = ensureIdentifier('messageId', messageId);
  return mutateResource(
    'post',
    userId,
    ['gig-orders', safeOrderId, 'chat', safeMessageId, 'acknowledge'],
    {},
    options,
  );
}

export default {
  fetchProjectGigManagement,
  createProject,
  updateProject,
  addProjectAsset,
  updateProjectAsset,
  deleteProjectAsset,
  updateWorkspace,
  createProjectMilestone,
  updateProjectMilestone,
  deleteProjectMilestone,
  createProjectCollaborator,
  updateProjectCollaborator,
  deleteProjectCollaborator,
  archiveProject,
  restoreProject,
  createGigOrder,
  updateGigOrder,
  createProjectBid,
  updateProjectBid,
  addGigTimelineEvent,
  createGigTimelineEvent,
  postGigOrderMessage,
  updateGigTimelineEvent,
  sendProjectInvitation,
  updateProjectInvitation,
  createGigEscrowCheckpoint,
  updateGigEscrowCheckpoint,
  createGigSubmission,
  updateGigSubmission,
  updateAutoMatchSettings,
  createAutoMatch,
  updateAutoMatch,
  createProjectReview,
  createEscrowTransaction,
  updateEscrowSettings,
  postGigChatMessage,
  fetchGigOrderDetail,
  acknowledgeGigChatMessage,
};
