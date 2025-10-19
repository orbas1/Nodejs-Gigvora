import apiClient from './apiClient.js';

const BASE_PATH = '/users';

export async function fetchProjectGigManagement(userId) {
  const response = await apiClient.get(`${BASE_PATH}/${userId}/project-gig-management`);
  return response.data;
}

export async function createProject(userId, payload) {
  const response = await apiClient.post(`${BASE_PATH}/${userId}/project-gig-management/projects`, payload);
  return response.data;
}

export async function updateProject(userId, projectId, payload) {
  const response = await apiClient.patch(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}`,
    payload,
  );
  return response.data;
}

export async function addProjectAsset(userId, projectId, payload) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}/assets`,
    payload,
  );
  return response.data;
}

export async function updateProjectAsset(userId, projectId, assetId, payload) {
  const response = await apiClient.patch(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}/assets/${assetId}`,
    payload,
  );
  return response.data;
}

export async function deleteProjectAsset(userId, projectId, assetId) {
  const response = await apiClient.delete(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}/assets/${assetId}`,
  );
  return response.data;
}

export async function updateWorkspace(userId, projectId, payload) {
  const response = await apiClient.patch(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}/workspace`,
    payload,
  );
  return response.data;
}

export async function createProjectMilestone(userId, projectId, payload) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}/milestones`,
    payload,
  );
  return response.data;
}

export async function updateProjectMilestone(userId, projectId, milestoneId, payload) {
  const response = await apiClient.patch(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}/milestones/${milestoneId}`,
    payload,
  );
  return response.data;
}

export async function deleteProjectMilestone(userId, projectId, milestoneId) {
  const response = await apiClient.delete(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}/milestones/${milestoneId}`,
  );
  return response.data;
}

export async function createProjectCollaborator(userId, projectId, payload) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}/collaborators`,
    payload,
  );
  return response.data;
}

export async function updateProjectCollaborator(userId, projectId, collaboratorId, payload) {
  const response = await apiClient.patch(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}/collaborators/${collaboratorId}`,
    payload,
  );
  return response.data;
}

export async function deleteProjectCollaborator(userId, projectId, collaboratorId) {
  const response = await apiClient.delete(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}/collaborators/${collaboratorId}`,
  );
  return response.data;
}

export async function archiveProject(userId, projectId, payload = {}) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}/archive`,
    payload,
  );
  return response.data;
}

export async function restoreProject(userId, projectId, payload = {}) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}/restore`,
    payload,
  );
  return response.data;
}

export async function createGigOrder(userId, payload) {
  const response = await apiClient.post(`${BASE_PATH}/${userId}/project-gig-management/gig-orders`, payload);
  return response.data;
}

export async function updateGigOrder(userId, orderId, payload) {
  const response = await apiClient.patch(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}`,
    payload,
  );
  return response.data;
}

export async function createProjectBid(userId, payload) {
  const response = await apiClient.post(`${BASE_PATH}/${userId}/project-gig-management/project-bids`, payload);
  return response.data;
}

export async function updateProjectBid(userId, bidId, payload) {
  const response = await apiClient.patch(
    `${BASE_PATH}/${userId}/project-gig-management/project-bids/${bidId}`,
    payload,
  );
  return response.data;
}

export async function addGigTimelineEvent(userId, orderId, payload) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}/timeline`,
    payload,
  );
  return response.data;
}

export async function createGigTimelineEvent(userId, orderId, payload) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}/timeline`,
    payload,
  );
  return response.data;
}

export async function postGigOrderMessage(userId, orderId, payload) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}/messages`,
    payload,
  );
  return response.data;
}

export async function updateGigTimelineEvent(userId, orderId, eventId, payload) {
  const response = await apiClient.patch(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}/timeline/${eventId}`,
    payload,
  );
  return response.data;
}

export async function sendProjectInvitation(userId, payload) {
  const response = await apiClient.post(`${BASE_PATH}/${userId}/project-gig-management/invitations`, payload);
  return response.data;
}

export async function updateProjectInvitation(userId, invitationId, payload) {
  const response = await apiClient.patch(
    `${BASE_PATH}/${userId}/project-gig-management/invitations/${invitationId}`,
    payload,
  );
  return response.data;
}

export async function createGigEscrowCheckpoint(userId, orderId, payload) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}/escrow`,
    payload,
  );
  return response.data;
}

export async function updateGigEscrowCheckpoint(userId, orderId, checkpointId, payload) {
  const response = await apiClient.patch(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}/escrow/${checkpointId}`,
    payload,
  );
  return response.data;
}

export async function createGigSubmission(userId, orderId, payload) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}/submissions`,
    payload,
  );
  return response.data;
}

export async function updateGigSubmission(userId, orderId, submissionId, payload) {
  const response = await apiClient.patch(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}/submissions/${submissionId}`,
    payload,
  );
  return response.data;
}

export async function updateAutoMatchSettings(userId, payload) {
  const response = await apiClient.put(`${BASE_PATH}/${userId}/project-gig-management/auto-match/settings`, payload);
  return response.data;
}

export async function createAutoMatch(userId, payload) {
  const response = await apiClient.post(`${BASE_PATH}/${userId}/project-gig-management/auto-match/matches`, payload);
  return response.data;
}

export async function updateAutoMatch(userId, matchId, payload) {
  const response = await apiClient.patch(
    `${BASE_PATH}/${userId}/project-gig-management/auto-match/matches/${matchId}`,
    payload,
  );
  return response.data;
}

export async function createProjectReview(userId, payload) {
  const response = await apiClient.post(`${BASE_PATH}/${userId}/project-gig-management/reviews`, payload);
  return response.data;
}

export async function createEscrowTransaction(userId, payload) {
  const response = await apiClient.post(`${BASE_PATH}/${userId}/project-gig-management/escrow/transactions`, payload);
  return response.data;
}

export async function updateEscrowSettings(userId, payload) {
  const response = await apiClient.patch(`${BASE_PATH}/${userId}/project-gig-management/escrow/settings`, payload);
  return response.data;
}

export async function postGigChatMessage(userId, orderId, payload) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}/chat`,
    payload,
  );
  return response.data;
}

export async function fetchGigOrderDetail(userId, orderId, { signal } = {}) {
  const response = await apiClient.get(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}`,
    { signal },
  );
  return response.data;
}

export async function acknowledgeGigChatMessage(userId, orderId, messageId) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}/chat/${messageId}/acknowledge`,
    {},
  );
  return response.data;
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
