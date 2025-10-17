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

export async function createGigTimelineEvent(userId, orderId, payload) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}/timeline`,
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

export async function postGigChatMessage(userId, orderId, payload) {
  const response = await apiClient.post(
    `${BASE_PATH}/${userId}/project-gig-management/gig-orders/${orderId}/chat`,
    payload,
  );
  return response.data;
}

export default {
  fetchProjectGigManagement,
  createProject,
  addProjectAsset,
  updateWorkspace,
  createGigOrder,
  updateGigOrder,
  createGigTimelineEvent,
  updateGigTimelineEvent,
  createGigSubmission,
  updateGigSubmission,
  postGigChatMessage,
};
