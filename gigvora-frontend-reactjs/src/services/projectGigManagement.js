import apiClient from './apiClient.js';

const BASE_PATH = '/users';

const unwrap = (response) => (response?.data ?? response ?? null);

export async function fetchProjectGigManagement(userId) {
  const response = await apiClient.get(`${BASE_PATH}/${userId}/project-gig-management`);
  return unwrap(response);
}

export async function createProject(userId, payload) {
  const response = await apiClient.post(`${BASE_PATH}/${userId}/project-gig-management/projects`, payload);
  return unwrap(response);
}

export async function updateProject(userId, projectId, payload) {
  const response = await apiClient.patch(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}`,
    payload,
  );
  return unwrap(response);
}

export async function addProjectAsset(userId, projectId, payload) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}/assets`,
    payload,
  );
  return unwrap(response);
}

export async function updateProjectAsset(userId, projectId, assetId, payload) {
  const response = await apiClient.patch(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}/assets/${assetId}`,
    payload,
  );
  return unwrap(response);
}

export async function deleteProjectAsset(userId, projectId, assetId) {
  const response = await apiClient.delete(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}/assets/${assetId}`,
  );
  return unwrap(response);
}

export async function updateWorkspace(userId, projectId, payload) {
  const response = await apiClient.patch(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}/workspace`,
    payload,
  );
  return unwrap(response);
}

export async function createProjectMilestone(userId, projectId, payload) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}/milestones`,
    payload,
  );
  return unwrap(response);
}

export async function updateProjectMilestone(userId, projectId, milestoneId, payload) {
  const response = await apiClient.patch(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}/milestones/${milestoneId}`,
    payload,
  );
  return unwrap(response);
}

export async function deleteProjectMilestone(userId, projectId, milestoneId) {
  const response = await apiClient.delete(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}/milestones/${milestoneId}`,
  );
  return unwrap(response);
}

export async function createProjectCollaborator(userId, projectId, payload) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}/collaborators`,
    payload,
  );
  return unwrap(response);
}

export async function updateProjectCollaborator(userId, projectId, collaboratorId, payload) {
  const response = await apiClient.patch(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}/collaborators/${collaboratorId}`,
    payload,
  );
  return unwrap(response);
}

export async function deleteProjectCollaborator(userId, projectId, collaboratorId) {
  const response = await apiClient.delete(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}/collaborators/${collaboratorId}`,
  );
  return unwrap(response);
}

export async function archiveProject(userId, projectId, payload = {}) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}/archive`,
    payload,
  );
  return unwrap(response);
}

export async function restoreProject(userId, projectId, payload = {}) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}/restore`,
    payload,
  );
  return unwrap(response);
}

export async function createGigOrder(userId, payload) {
  const response = await apiClient.post(`${BASE_PATH}/${userId}/project-gig-management/gig-orders`, payload);
  return unwrap(response);
}

export async function updateGigOrder(userId, orderId, payload) {
  const response = await apiClient.patch(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}`,
    payload,
  );
  return unwrap(response);
}

export async function createProjectBid(userId, payload) {
  const response = await apiClient.post(`${BASE_PATH}/${userId}/project-gig-management/project-bids`, payload);
  return unwrap(response);
}

export async function updateProjectBid(userId, bidId, payload) {
  const response = await apiClient.patch(
    `${BASE_PATH}/${userId}/project-gig-management/project-bids/${bidId}`,
    payload,
  );
  return unwrap(response);
}

export async function addGigTimelineEvent(userId, orderId, payload) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}/timeline`,
    payload,
  );
  return unwrap(response);
}

export async function createGigTimelineEvent(userId, orderId, payload) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}/timeline`,
    payload,
  );
  return unwrap(response);
}

export async function postGigOrderMessage(userId, orderId, payload) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}/messages`,
    payload,
  );
  return unwrap(response);
}

export async function updateGigTimelineEvent(userId, orderId, eventId, payload) {
  const response = await apiClient.patch(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}/timeline/${eventId}`,
    payload,
  );
  return unwrap(response);
}

export async function sendProjectInvitation(userId, payload) {
  const response = await apiClient.post(`${BASE_PATH}/${userId}/project-gig-management/invitations`, payload);
  return unwrap(response);
}

export async function updateProjectInvitation(userId, invitationId, payload) {
  const response = await apiClient.patch(
    `${BASE_PATH}/${userId}/project-gig-management/invitations/${invitationId}`,
    payload,
  );
  return unwrap(response);
}

export async function createGigEscrowCheckpoint(userId, orderId, payload) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}/escrow`,
    payload,
  );
  return unwrap(response);
}

export async function updateGigEscrowCheckpoint(userId, orderId, checkpointId, payload) {
  const response = await apiClient.patch(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}/escrow/${checkpointId}`,
    payload,
  );
  return unwrap(response);
}

export async function createGigSubmission(userId, orderId, payload) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}/submissions`,
    payload,
  );
  return unwrap(response);
}

export async function updateGigSubmission(userId, orderId, submissionId, payload) {
  const response = await apiClient.patch(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}/submissions/${submissionId}`,
    payload,
  );
  return unwrap(response);
}

export async function updateAutoMatchSettings(userId, payload) {
  const response = await apiClient.put(`${BASE_PATH}/${userId}/project-gig-management/auto-match/settings`, payload);
  return unwrap(response);
}

export async function createAutoMatch(userId, payload) {
  const response = await apiClient.post(`${BASE_PATH}/${userId}/project-gig-management/auto-match/matches`, payload);
  return unwrap(response);
}

export async function updateAutoMatch(userId, matchId, payload) {
  const response = await apiClient.patch(
    `${BASE_PATH}/${userId}/project-gig-management/auto-match/matches/${matchId}`,
    payload,
  );
  return unwrap(response);
}

export async function createProjectReview(userId, payload) {
  const response = await apiClient.post(`${BASE_PATH}/${userId}/project-gig-management/reviews`, payload);
  return unwrap(response);
}

export async function createEscrowTransaction(userId, payload) {
  const response = await apiClient.post(`${BASE_PATH}/${userId}/project-gig-management/escrow/transactions`, payload);
  return unwrap(response);
}

export async function updateEscrowSettings(userId, payload) {
  const response = await apiClient.patch(`${BASE_PATH}/${userId}/project-gig-management/escrow/settings`, payload);
  return unwrap(response);
}

export async function postGigChatMessage(userId, orderId, payload) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}/chat`,
    payload,
  );
  return unwrap(response);
}

export async function fetchGigOrderDetail(userId, orderId, { signal } = {}) {
  const response = await apiClient.get(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}`,
    { signal },
  );
  return unwrap(response);
}

export async function acknowledgeGigChatMessage(userId, orderId, messageId) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}/chat/${messageId}/acknowledge`,
    {},
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
