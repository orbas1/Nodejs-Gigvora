import { apiClient } from './apiClient.js';

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
export function listCreationStudioItems(params = {}, options = {}) {
  return apiClient.get('/creation-studio/items', { params, ...options });
}

export function getCreationStudioItem(itemId, options = {}) {
  if (!itemId) {
    throw new Error('itemId is required to fetch a Creation Studio item.');
  }
  return apiClient.get(`/creation-studio/items/${itemId}`, options);
}

export function createCreationStudioItem(payload, options = {}) {
  return apiClient.post('/creation-studio/items', payload, options);
}

export function updateCreationStudioItem(itemId, payload, options = {}) {
  if (!itemId) {
    throw new Error('itemId is required to update a Creation Studio item.');
  }
  return apiClient.put(`/creation-studio/items/${itemId}`, payload, options);
}

export function publishCreationStudioItem(itemId, payload = {}, options = {}) {
  if (!itemId) {
    throw new Error('itemId is required to publish a Creation Studio item.');
  }
  return apiClient.post(`/creation-studio/items/${itemId}/publish`, payload, options);
}

export default {
  listCreationStudioItems,
  getCreationStudioItem,
  createCreationStudioItem,
  updateCreationStudioItem,
  publishCreationStudioItem,
};
