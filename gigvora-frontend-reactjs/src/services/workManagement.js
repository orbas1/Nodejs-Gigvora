import apiClient from './apiClient.js';

export async function fetchWorkManagement(projectId, { signal } = {}) {
  if (!projectId) {
    throw new Error('projectId is required to load work management data.');
  }
  return apiClient.get(`/projects/${projectId}/work-management`, { signal });
}

export async function createSprint(projectId, payload) {
  return apiClient.post(`/projects/${projectId}/work-management/sprints`, payload);
}

export async function createTask(projectId, payload) {
  if (payload?.sprintId) {
    return apiClient.post(`/projects/${projectId}/work-management/sprints/${payload.sprintId}/tasks`, payload);
  }
  return apiClient.post(`/projects/${projectId}/work-management/tasks`, payload);
}

export async function updateTask(projectId, taskId, payload) {
  return apiClient.patch(`/projects/${projectId}/work-management/tasks/${taskId}`, payload);
}

export async function logTime(projectId, taskId, payload) {
  return apiClient.post(`/projects/${projectId}/work-management/tasks/${taskId}/time-entries`, payload);
}

export async function createRisk(projectId, payload) {
  return apiClient.post(`/projects/${projectId}/work-management/risks`, payload);
}

export async function updateRisk(projectId, riskId, payload) {
  return apiClient.patch(`/projects/${projectId}/work-management/risks/${riskId}`, payload);
}

export async function createChangeRequest(projectId, payload) {
  return apiClient.post(`/projects/${projectId}/work-management/change-requests`, payload);
}

export async function approveChangeRequest(projectId, changeRequestId, payload) {
  return apiClient.patch(
    `/projects/${projectId}/work-management/change-requests/${changeRequestId}/approve`,
    payload,
  );
}

export default {
  fetchWorkManagement,
  createSprint,
  createTask,
  updateTask,
  logTime,
  createRisk,
  updateRisk,
  createChangeRequest,
  approveChangeRequest,
};
