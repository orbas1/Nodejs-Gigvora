import { apiClient } from './apiClient.js';

export function fetchCreationStudioOverview({ workspaceId, signal } = {}) {
  const params = {};
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    params.workspaceId = workspaceId;
  }
  return apiClient.get('/company/creation-studio/overview', { params, signal });
}

export function fetchCreationStudioItems({ workspaceId, type, status, search, limit, offset, signal } = {}) {
  const params = {};
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    params.workspaceId = workspaceId;
  }
  if (type) {
    params.type = type;
  }
  if (status) {
    params.status = status;
  }
  if (search) {
    params.search = search;
  }
  if (limit != null) {
    params.limit = limit;
  }
  if (offset != null) {
    params.offset = offset;
  }
  return apiClient.get('/company/creation-studio', { params, signal });
}

export function createCreationStudioItem(payload, { signal } = {}) {
  return apiClient.post('/company/creation-studio', payload, { signal });
}

export function updateCreationStudioItem(itemId, payload, { signal } = {}) {
  return apiClient.put(`/company/creation-studio/${itemId}`, payload, { signal });
}

export function publishCreationStudioItem(itemId, payload = {}, { signal } = {}) {
  return apiClient.post(`/company/creation-studio/${itemId}/publish`, payload, { signal });
}

export function deleteCreationStudioItem(itemId, { signal } = {}) {
  return apiClient.delete(`/company/creation-studio/${itemId}`, { signal });
}

export async function fetchCreationWorkspace(userId, { includeArchived = false, signal } = {}) {
  if (!userId) {
    throw new Error('userId is required to load the creation studio workspace.');
  }
  const params = {};
  if (includeArchived) {
    params.includeArchived = 'true';
  }
  return apiClient.get(`/users/${userId}/creation-studio`, { params, signal });
}

export async function createCreationItem(userId, payload, { signal } = {}) {
  if (!userId) {
    throw new Error('userId is required to create a creation studio item.');
  }
  return apiClient.post(`/users/${userId}/creation-studio`, payload, { signal });
}

export async function updateCreationItem(userId, itemId, payload, { signal } = {}) {
  if (!userId || !itemId) {
    throw new Error('userId and itemId are required to update a creation studio item.');
  }
  return apiClient.put(`/users/${userId}/creation-studio/${itemId}`, payload, { signal });
}

export async function saveCreationStep(userId, itemId, stepKey, payload, { signal } = {}) {
  if (!userId || !itemId || !stepKey) {
    throw new Error('userId, itemId, and stepKey are required to update a creation studio step.');
  }
  return apiClient.post(`/users/${userId}/creation-studio/${itemId}/steps/${encodeURIComponent(stepKey)}`, payload, {
    signal,
  });
}

export async function shareCreationItem(userId, itemId, payload, { signal } = {}) {
  if (!userId || !itemId) {
    throw new Error('userId and itemId are required to share a creation studio item.');
  }
  return apiClient.post(`/users/${userId}/creation-studio/${itemId}/share`, payload, { signal });
}

export async function archiveCreationItem(userId, itemId, { signal } = {}) {
  if (!userId || !itemId) {
    throw new Error('userId and itemId are required to archive a creation studio item.');
  }
  return apiClient.delete(`/users/${userId}/creation-studio/${itemId}`, { signal });
}

export default {
  fetchCreationWorkspace,
  createCreationItem,
  updateCreationItem,
  saveCreationStep,
  shareCreationItem,
  archiveCreationItem,
  publishCreationStudioItem,
};
