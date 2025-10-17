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

export async function addProjectAsset(userId, projectId, payload) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/projects/${projectId}/assets`,
    payload,
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

export default {
  fetchProjectGigManagement,
  createProject,
  addProjectAsset,
  updateWorkspace,
  createGigOrder,
  updateGigOrder,
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
};
