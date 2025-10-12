import apiClient from './apiClient.js';

export async function createProject(payload) {
  return apiClient.post('/projects', payload);
}

export async function updateProject(projectId, payload) {
  return apiClient.patch(`/projects/${projectId}`, payload);
}

export async function updateProjectAutoAssign(projectId, payload) {
  return apiClient.patch(`/projects/${projectId}/auto-assign`, payload);
}

export async function fetchProject(projectId) {
  return apiClient.get(`/projects/${projectId}`);
}

export async function fetchProjectEvents(projectId, { limit } = {}) {
  return apiClient.get(`/projects/${projectId}/events`, { params: { limit } });
}

export default {
  createProject,
  updateProject,
  updateProjectAutoAssign,
  fetchProject,
  fetchProjectEvents,
};
