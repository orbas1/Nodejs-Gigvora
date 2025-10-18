import { apiClient } from './apiClient.js';

export async function fetchWorkspaceProjects({ projectId } = {}, { signal } = {}) {
  return apiClient.get('/projects/workspace/management', {
    params: { projectId: projectId ?? undefined },
    signal,
  });
}

export async function fetchWorkspaceManagement(projectId, { signal } = {}) {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  return apiClient.get(`/projects/${projectId}/workspace/management`, { signal });
}

export async function createWorkspaceRecord(projectId, entity, payload = {}, { signal } = {}) {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  if (!entity) {
    throw new Error('entity is required');
  }
  return apiClient.post(`/projects/${projectId}/workspace/management/${entity}`, payload, { signal });
}

export async function updateWorkspaceRecord(projectId, entity, recordId, payload = {}, { signal } = {}) {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  if (!entity) {
    throw new Error('entity is required');
  }
  if (!recordId && entity !== 'summary') {
    throw new Error('recordId is required');
  }
  const resourcePath = entity === 'summary'
    ? `/projects/${projectId}/workspace/management/${entity}`
    : `/projects/${projectId}/workspace/management/${entity}/${recordId}`;
  return apiClient.put(resourcePath, payload, { signal });
}

export async function deleteWorkspaceRecord(projectId, entity, recordId, { signal } = {}) {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  if (!entity) {
    throw new Error('entity is required');
  }
  if (!recordId) {
    throw new Error('recordId is required');
  }
  return apiClient.delete(`/projects/${projectId}/workspace/management/${entity}/${recordId}`, { signal });
}

export default {
  fetchWorkspaceProjects,
  fetchWorkspaceManagement,
  createWorkspaceRecord,
  updateWorkspaceRecord,
  deleteWorkspaceRecord,
};
