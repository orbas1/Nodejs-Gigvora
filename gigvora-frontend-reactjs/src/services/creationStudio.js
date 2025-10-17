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
};
