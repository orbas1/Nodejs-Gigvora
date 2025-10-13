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

export default {
  fetchProjectGigManagement,
  createProject,
  addProjectAsset,
  updateWorkspace,
  createGigOrder,
  updateGigOrder,
};
