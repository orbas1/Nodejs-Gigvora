import { apiClient } from './apiClient.js';

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
