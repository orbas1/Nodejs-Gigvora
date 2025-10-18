import apiClient from './apiClient.js';

const BASE_PATH = '/users';

function userScope(userId) {
  return `${BASE_PATH}/${userId}/project-gig-management`;
}

export async function fetchProjectGigManagement(userId) {
  const response = await apiClient.get(`${userScope(userId)}`);
  return response.data;
}

export async function createProject(userId, payload) {
  const response = await apiClient.post(`${userScope(userId)}/projects`, payload);
  return response.data;
}

export async function updateProject(userId, projectId, payload) {
  const response = await apiClient.patch(`${userScope(userId)}/projects/${projectId}`, payload);
  return response.data;
}

export async function addProjectAsset(userId, projectId, payload) {
  const response = await apiClient.post(`${userScope(userId)}/projects/${projectId}/assets`, payload);
  return response.data;
}

export async function updateProjectAsset(userId, projectId, assetId, payload) {
  const response = await apiClient.patch(
    `${userScope(userId)}/projects/${projectId}/assets/${assetId}`,
    payload,
  );
  return response.data;
}

export async function deleteProjectAsset(userId, projectId, assetId) {
  const response = await apiClient.delete(`${userScope(userId)}/projects/${projectId}/assets/${assetId}`);
  return response.data;
}

export async function updateWorkspace(userId, projectId, payload) {
  const response = await apiClient.patch(`${userScope(userId)}/projects/${projectId}/workspace`, payload);
  return response.data;
}

export async function archiveProject(userId, projectId, payload = {}) {
  const response = await apiClient.post(`${userScope(userId)}/projects/${projectId}/archive`, payload);
  return response.data;
}

export async function restoreProject(userId, projectId, payload = {}) {
  const response = await apiClient.post(`${userScope(userId)}/projects/${projectId}/restore`, payload);
  return response.data;
}

export async function createProjectMilestone(userId, projectId, payload) {
  const response = await apiClient.post(`${userScope(userId)}/projects/${projectId}/milestones`, payload);
  return response.data;
}

export async function updateProjectMilestone(userId, projectId, milestoneId, payload) {
  const response = await apiClient.patch(
    `${userScope(userId)}/projects/${projectId}/milestones/${milestoneId}`,
    payload,
  );
  return response.data;
}

export async function deleteProjectMilestone(userId, projectId, milestoneId) {
  const response = await apiClient.delete(
    `${userScope(userId)}/projects/${projectId}/milestones/${milestoneId}`,
  );
  return response.data;
}

export async function createProjectCollaborator(userId, projectId, payload) {
  const response = await apiClient.post(`${userScope(userId)}/projects/${projectId}/collaborators`, payload);
  return response.data;
}

export async function updateProjectCollaborator(userId, projectId, collaboratorId, payload) {
  const response = await apiClient.patch(
    `${userScope(userId)}/projects/${projectId}/collaborators/${collaboratorId}`,
    payload,
  );
  return response.data;
}

export async function deleteProjectCollaborator(userId, projectId, collaboratorId) {
  const response = await apiClient.delete(
    `${userScope(userId)}/projects/${projectId}/collaborators/${collaboratorId}`,
  );
  return response.data;
}

export async function createGigOrder(userId, payload) {
  const response = await apiClient.post(`${userScope(userId)}/gig-orders`, payload);
  return response.data;
}

export async function updateGigOrder(userId, orderId, payload) {
  const response = await apiClient.patch(`${userScope(userId)}/gig-orders/${orderId}`, payload);
  return response.data;
}

export async function addGigTimelineEvent(userId, orderId, payload) {
  const response = await apiClient.post(
    `${userScope(userId)}/gig-orders/${orderId}/timeline`,
    payload,
  );
  return response.data;
}

export async function updateGigTimelineEvent(userId, orderId, eventId, payload) {
  const response = await apiClient.patch(
    `${userScope(userId)}/gig-orders/${orderId}/timeline/${eventId}`,
    payload,
  );
  return response.data;
}

export async function postGigOrderMessage(userId, orderId, payload) {
  const response = await apiClient.post(
    `${userScope(userId)}/gig-orders/${orderId}/messages`,
    payload,
  );
  return response.data;
}

export async function createGigEscrowCheckpoint(userId, orderId, payload) {
  const response = await apiClient.post(
    `${userScope(userId)}/gig-orders/${orderId}/escrow`,
    payload,
  );
  return response.data;
}

export async function updateGigEscrowCheckpoint(userId, orderId, checkpointId, payload) {
  const response = await apiClient.patch(
    `${userScope(userId)}/gig-orders/${orderId}/escrow/${checkpointId}`,
    payload,
  );
  return response.data;
}

export async function createGigSubmission(userId, orderId, payload) {
  const response = await apiClient.post(
    `${userScope(userId)}/gig-orders/${orderId}/submissions`,
    payload,
  );
  return response.data;
}

export async function updateGigSubmission(userId, orderId, submissionId, payload) {
  const response = await apiClient.patch(
    `${userScope(userId)}/gig-orders/${orderId}/submissions/${submissionId}`,
    payload,
  );
  return response.data;
}

export async function postGigChatMessage(userId, orderId, payload) {
  const response = await apiClient.post(
    `${userScope(userId)}/gig-orders/${orderId}/chat`,
    payload,
  );
  return response.data;
}

export async function fetchGigOrderDetail(userId, orderId, { signal } = {}) {
  const response = await apiClient.get(`${userScope(userId)}/gig-orders/${orderId}`, { signal });
  return response.data;
}

export async function acknowledgeGigChatMessage(userId, orderId, messageId) {
  const response = await apiClient.post(
    `${userScope(userId)}/gig-orders/${orderId}/chat/${messageId}/acknowledge`,
    {},
  );
  return response.data;
}

export async function createProjectBid(userId, payload) {
  const response = await apiClient.post(`${userScope(userId)}/project-bids`, payload);
  return response.data;
}

export async function updateProjectBid(userId, bidId, payload) {
  const response = await apiClient.patch(`${userScope(userId)}/project-bids/${bidId}`, payload);
  return response.data;
}

export async function sendProjectInvitation(userId, payload) {
  const response = await apiClient.post(`${userScope(userId)}/invitations`, payload);
  return response.data;
}

export async function updateProjectInvitation(userId, invitationId, payload) {
  const response = await apiClient.patch(`${userScope(userId)}/invitations/${invitationId}`, payload);
  return response.data;
}

export async function updateAutoMatchSettings(userId, payload) {
  const response = await apiClient.put(`${userScope(userId)}/auto-match/settings`, payload);
  return response.data;
}

export async function createAutoMatch(userId, payload) {
  const response = await apiClient.post(`${userScope(userId)}/auto-match/matches`, payload);
  return response.data;
}

export async function updateAutoMatch(userId, matchId, payload) {
  const response = await apiClient.patch(`${userScope(userId)}/auto-match/matches/${matchId}`, payload);
  return response.data;
}

export async function createProjectReview(userId, payload) {
  const response = await apiClient.post(`${userScope(userId)}/reviews`, payload);
  return response.data;
}

export async function createEscrowTransaction(userId, payload) {
  const response = await apiClient.post(`${userScope(userId)}/escrow/transactions`, payload);
  return response.data;
}

export async function updateEscrowSettings(userId, payload) {
  const response = await apiClient.patch(`${userScope(userId)}/escrow/settings`, payload);
  return response.data;
}

export async function createGigTimelineEvent(userId, orderId, payload) {
  // Alias of addGigTimelineEvent for detail views.
  return addGigTimelineEvent(userId, orderId, payload);
}

const projectGigManagementService = {
  fetchProjectGigManagement,
  createProject,
  updateProject,
  addProjectAsset,
  updateProjectAsset,
  deleteProjectAsset,
  updateWorkspace,
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
  addGigTimelineEvent,
  updateGigTimelineEvent,
  postGigOrderMessage,
  createGigEscrowCheckpoint,
  updateGigEscrowCheckpoint,
  createGigSubmission,
  updateGigSubmission,
  postGigChatMessage,
  fetchGigOrderDetail,
  acknowledgeGigChatMessage,
  createProjectBid,
  updateProjectBid,
  sendProjectInvitation,
  updateProjectInvitation,
  updateAutoMatchSettings,
  createAutoMatch,
  updateAutoMatch,
  createProjectReview,
  createEscrowTransaction,
  updateEscrowSettings,
  createGigTimelineEvent,
};

export default projectGigManagementService;
