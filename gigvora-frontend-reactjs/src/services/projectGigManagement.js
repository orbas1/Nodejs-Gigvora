import apiClient from './apiClient.js';

const BASE_PATH = '/users';

const unwrap = (response) => (response?.data ?? response ?? null);

function ensureString(value) {
  if (value === undefined || value === null) {
    return '';
  }
  return `${value}`.trim();
}

function ensureIdentifier(name, value) {
  const normalised = ensureString(value);
  if (!normalised) {
    throw new Error(`${name} is required`);
  }
  return normalised;
}

function ensureUserId(userId) {
  return ensureIdentifier('userId', userId);
}

function ensurePayload(payload) {
  if (payload == null) {
    return {};
  }
  if (typeof payload !== 'object') {
    throw new Error('Payload must be an object.');
  }
  return payload;
}

function ensureOptions(options = {}) {
  if (options === null || options === undefined) {
    return {};
  }
  if (typeof options !== 'object') {
    throw new Error('Options must be an object.');
  }
  return options;
}

function buildPath(userId, ...segments) {
  const safeUserId = encodeURIComponent(ensureUserId(userId));
  const encodedSegments = segments
    .filter((segment) => segment !== undefined && segment !== null)
    .map((segment) => ensureString(segment))
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment));
  const suffix = encodedSegments.length ? `/${encodedSegments.join('/')}` : '';
  return `${BASE_PATH}/${safeUserId}/project-gig-management${suffix}`;
}

function asRequestOptions(options = {}) {
  const safe = ensureOptions(options);
  return Object.keys(safe).length ? safe : undefined;
}

function sendMutation(method, userId, segments, payload, options) {
  const path = buildPath(userId, ...segments);
  const safeOptions = ensureOptions(options);

  if (method === 'delete') {
    return apiClient.delete(path, Object.keys(safeOptions).length ? safeOptions : undefined);
  }

  const client = apiClient[method];
  if (typeof client !== 'function') {
    throw new Error(`Unsupported method: ${method}`);
  }
  const body = ensurePayload(payload);
  return client(path, body, Object.keys(safeOptions).length ? safeOptions : undefined);
}

function sendGet(userId, segments, options) {
  const path = buildPath(userId, ...segments);
  const requestOptions = asRequestOptions(options);
  return apiClient.get(path, requestOptions);
}

export async function fetchProjectGigManagement(userId, options = {}) {
  const response = await sendGet(userId, [], options);
  return unwrap(response);
}

export async function createProject(userId, payload, options = {}) {
  const response = await sendMutation('post', userId, ['projects'], payload, options);
  return unwrap(response);
}

export async function updateProject(userId, projectId, payload, options = {}) {
  const response = await sendMutation('patch', userId, ['projects', ensureIdentifier('projectId', projectId)], payload, options);
  return unwrap(response);
}

export async function addProjectAsset(userId, projectId, payload, options = {}) {
  const response = await sendMutation(
    'post',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'assets'],
    payload,
    options,
  );
  return unwrap(response);
}

export async function updateProjectAsset(userId, projectId, assetId, payload, options = {}) {
  const response = await sendMutation(
    'patch',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'assets', ensureIdentifier('assetId', assetId)],
    payload,
    options,
  );
  return unwrap(response);
}

export async function deleteProjectAsset(userId, projectId, assetId, options = {}) {
  const response = await sendMutation(
    'delete',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'assets', ensureIdentifier('assetId', assetId)],
    undefined,
    options,
  );
  return unwrap(response);
}

export async function updateWorkspace(userId, projectId, payload, options = {}) {
  const response = await sendMutation(
    'patch',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'workspace'],
    payload,
    options,
  );
  return unwrap(response);
}

export async function createProjectMilestone(userId, projectId, payload, options = {}) {
  const response = await sendMutation(
    'post',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'milestones'],
    payload,
    options,
  );
  return unwrap(response);
}

export async function updateProjectMilestone(userId, projectId, milestoneId, payload, options = {}) {
  const response = await sendMutation(
    'patch',
    userId,
    [
      'projects',
      ensureIdentifier('projectId', projectId),
      'milestones',
      ensureIdentifier('milestoneId', milestoneId),
    ],
    payload,
    options,
  );
  return unwrap(response);
}

export async function deleteProjectMilestone(userId, projectId, milestoneId, options = {}) {
  const response = await sendMutation(
    'delete',
    userId,
    [
      'projects',
      ensureIdentifier('projectId', projectId),
      'milestones',
      ensureIdentifier('milestoneId', milestoneId),
    ],
    undefined,
    options,
  );
  return unwrap(response);
}

export async function createProjectCollaborator(userId, projectId, payload, options = {}) {
  const response = await sendMutation(
    'post',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'collaborators'],
    payload,
    options,
  );
  return unwrap(response);
}

export async function updateProjectCollaborator(userId, projectId, collaboratorId, payload, options = {}) {
  const response = await sendMutation(
    'patch',
    userId,
    [
      'projects',
      ensureIdentifier('projectId', projectId),
      'collaborators',
      ensureIdentifier('collaboratorId', collaboratorId),
    ],
    payload,
    options,
  );
  return unwrap(response);
}

export async function deleteProjectCollaborator(userId, projectId, collaboratorId, options = {}) {
  const response = await sendMutation(
    'delete',
    userId,
    [
      'projects',
      ensureIdentifier('projectId', projectId),
      'collaborators',
      ensureIdentifier('collaboratorId', collaboratorId),
    ],
    undefined,
    options,
  );
  return unwrap(response);
}

export async function archiveProject(userId, projectId, payload = {}, options = {}) {
  const response = await sendMutation(
    'post',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'archive'],
    payload,
    options,
  );
  return unwrap(response);
}

export async function restoreProject(userId, projectId, payload = {}, options = {}) {
  const response = await sendMutation(
    'post',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'restore'],
    payload,
    options,
  );
  return unwrap(response);
}

export async function createGigOrder(userId, payload, options = {}) {
  const response = await sendMutation('post', userId, ['gig-orders'], payload, options);
  return unwrap(response);
}

export async function updateGigOrder(userId, orderId, payload, options = {}) {
  const response = await sendMutation(
    'patch',
    userId,
    ['gig-orders', ensureIdentifier('orderId', orderId)],
    payload,
    options,
  );
  return unwrap(response);
}

export async function createProjectBid(userId, payload, options = {}) {
  const response = await sendMutation('post', userId, ['project-bids'], payload, options);
  return unwrap(response);
}

export async function updateProjectBid(userId, bidId, payload, options = {}) {
  const response = await sendMutation(
    'patch',
    userId,
    ['project-bids', ensureIdentifier('bidId', bidId)],
    payload,
    options,
  );
  return unwrap(response);
}

export async function addGigTimelineEvent(userId, orderId, payload, options = {}) {
  const response = await sendMutation(
    'post',
    userId,
    ['gig-orders', ensureIdentifier('orderId', orderId), 'timeline'],
    payload,
    options,
  );
  return unwrap(response);
}

export async function createGigTimelineEvent(userId, orderId, payload, options = {}) {
  return addGigTimelineEvent(userId, orderId, payload, options);
}

export async function postGigOrderMessage(userId, orderId, payload, options = {}) {
  const response = await sendMutation(
    'post',
    userId,
    ['gig-orders', ensureIdentifier('orderId', orderId), 'messages'],
    payload,
    options,
  );
  return unwrap(response);
}

export async function updateGigTimelineEvent(userId, orderId, eventId, payload, options = {}) {
  const response = await sendMutation(
    'patch',
    userId,
    [
      'gig-orders',
      ensureIdentifier('orderId', orderId),
      'timeline',
      ensureIdentifier('eventId', eventId),
    ],
    payload,
    options,
  );
  return unwrap(response);
}

export async function sendProjectInvitation(userId, payload, options = {}) {
  const response = await sendMutation('post', userId, ['invitations'], payload, options);
  return unwrap(response);
}

export async function updateProjectInvitation(userId, invitationId, payload, options = {}) {
  const response = await sendMutation(
    'patch',
    userId,
    ['invitations', ensureIdentifier('invitationId', invitationId)],
    payload,
    options,
  );
  return unwrap(response);
}

export async function createGigEscrowCheckpoint(userId, orderId, payload, options = {}) {
  const response = await sendMutation(
    'post',
    userId,
    ['gig-orders', ensureIdentifier('orderId', orderId), 'escrow'],
    payload,
    options,
  );
  return unwrap(response);
}

export async function updateGigEscrowCheckpoint(userId, orderId, checkpointId, payload, options = {}) {
  const response = await sendMutation(
    'patch',
    userId,
    [
      'gig-orders',
      ensureIdentifier('orderId', orderId),
      'escrow',
      ensureIdentifier('checkpointId', checkpointId),
    ],
    payload,
    options,
  );
  return unwrap(response);
}

export async function createGigSubmission(userId, orderId, payload, options = {}) {
  const response = await sendMutation(
    'post',
    userId,
    ['gig-orders', ensureIdentifier('orderId', orderId), 'submissions'],
    payload,
    options,
  );
  return unwrap(response);
}

export async function updateGigSubmission(userId, orderId, submissionId, payload, options = {}) {
  const response = await sendMutation(
    'patch',
    userId,
    [
      'gig-orders',
      ensureIdentifier('orderId', orderId),
      'submissions',
      ensureIdentifier('submissionId', submissionId),
    ],
    payload,
    options,
  );
  return unwrap(response);
}

export async function updateAutoMatchSettings(userId, payload, options = {}) {
  const response = await sendMutation('put', userId, ['auto-match', 'settings'], payload, options);
  return unwrap(response);
}

export async function createAutoMatch(userId, payload, options = {}) {
  const response = await sendMutation('post', userId, ['auto-match', 'matches'], payload, options);
  return unwrap(response);
}

export async function updateAutoMatch(userId, matchId, payload, options = {}) {
  const response = await sendMutation(
    'patch',
    userId,
    ['auto-match', 'matches', ensureIdentifier('matchId', matchId)],
    payload,
    options,
  );
  return unwrap(response);
}

export async function createProjectReview(userId, payload, options = {}) {
  const response = await sendMutation('post', userId, ['reviews'], payload, options);
  return unwrap(response);
}

export async function createEscrowTransaction(userId, payload, options = {}) {
  const response = await sendMutation('post', userId, ['escrow', 'transactions'], payload, options);
  return unwrap(response);
}

export async function updateEscrowSettings(userId, payload, options = {}) {
  const response = await sendMutation('patch', userId, ['escrow', 'settings'], payload, options);
  return unwrap(response);
}

export async function postGigChatMessage(userId, orderId, payload, options = {}) {
  const response = await sendMutation(
    'post',
    userId,
    ['gig-orders', ensureIdentifier('orderId', orderId), 'chat'],
    payload,
    options,
  );
  return unwrap(response);
}

export async function fetchGigOrderDetail(userId, orderId, options = {}) {
  const response = await sendGet(userId, ['gig-orders', ensureIdentifier('orderId', orderId)], options);
  return unwrap(response);
}

export async function acknowledgeGigChatMessage(userId, orderId, messageId, options = {}) {
  const response = await sendMutation(
    'post',
    userId,
    [
      'gig-orders',
      ensureIdentifier('orderId', orderId),
      'chat',
      ensureIdentifier('messageId', messageId),
      'acknowledge',
    ],
    {},
    options,
  );
  return unwrap(response);
}

export default {
  fetchProjectGigManagement,
  createProject,
  updateProject,
  addProjectAsset,
  updateProjectAsset,
  deleteProjectAsset,
  createProjectMilestone,
  updateProjectMilestone,
  deleteProjectMilestone,
  createProjectCollaborator,
  updateProjectCollaborator,
  deleteProjectCollaborator,
  updateWorkspace,
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
