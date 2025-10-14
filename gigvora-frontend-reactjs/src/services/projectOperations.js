import { apiClient } from './apiClient.js';

export function fetchProjectOperations(projectId, { signal } = {}) {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  return apiClient.get(`/projects/${projectId}/operations`, { signal });
}

export function updateProjectOperations(projectId, payload) {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  return apiClient.put(`/projects/${projectId}/operations`, payload);
}

export function addProjectTask(projectId, payload) {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  return apiClient.post(`/projects/${projectId}/operations/tasks`, payload);
}

export function updateProjectTask(projectId, taskId, payload) {
  if (!projectId || !taskId) {
    throw new Error('projectId and taskId are required');
  }
  return apiClient.patch(`/projects/${projectId}/operations/tasks/${taskId}`, payload);
}

export function deleteProjectTask(projectId, taskId) {
  if (!projectId || !taskId) {
    throw new Error('projectId and taskId are required');
  }
  return apiClient.delete(`/projects/${projectId}/operations/tasks/${taskId}`);
}

export default {
  fetchProjectOperations,
  updateProjectOperations,
  addProjectTask,
  updateProjectTask,
  deleteProjectTask,
};
