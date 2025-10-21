import { apiClient } from './apiClient.js';

function sanitiseQuery(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && `${value}`.length > 0),
  );
}

export function fetchCreationStudioOverview(params = {}, { signal } = {}) {
  return apiClient.get('/agency/creation-studio', {
    params: sanitiseQuery({
      page: params.page,
      pageSize: params.pageSize,
      targetType: params.targetType,
      status: params.status,
      search: params.search,
      agencyProfileId: params.agencyProfileId,
    }),
    signal,
  });
}

export function fetchCreationStudioSnapshot(params = {}, { signal } = {}) {
  return apiClient.get('/agency/creation-studio/snapshot', {
    params: sanitiseQuery({
      targetType: params.targetType,
      status: params.status,
      agencyProfileId: params.agencyProfileId,
    }),
    signal,
  });
}

export function fetchCreationStudioItems(params = {}, { signal } = {}) {
  return apiClient.get('/agency/creation-studio/items', {
    params: sanitiseQuery({
      page: params.page,
      pageSize: params.pageSize,
      targetType: params.targetType,
      status: params.status,
      search: params.search,
      agencyProfileId: params.agencyProfileId,
    }),
    signal,
  });
}

export function fetchCreationStudioItem(itemId, { signal } = {}) {
  if (!itemId) {
    throw new Error('itemId is required to load a creation studio item.');
  }
  return apiClient.get(`/agency/creation-studio/items/${itemId}`, { signal });
}

export function createCreationStudioItem(payload) {
  return apiClient.post('/agency/creation-studio/items', payload);
}

export function updateCreationStudioItem(itemId, payload) {
  if (!itemId) {
    throw new Error('itemId is required to update a creation studio item.');
  }
  return apiClient.put(`/agency/creation-studio/items/${itemId}`, payload);
}

export function publishCreationStudioItem(itemId, payload = {}) {
  if (!itemId) {
    throw new Error('itemId is required to publish a creation studio item.');
  }
  return apiClient.post(`/agency/creation-studio/items/${itemId}/publish`, payload);
}

export function shareCreationStudioItem(itemId, payload = {}) {
  if (!itemId) {
    throw new Error('itemId is required to share a creation studio item.');
  }
  return apiClient.post(`/agency/creation-studio/items/${itemId}/share`, payload);
}

export function deleteCreationStudioItem(itemId) {
  if (!itemId) {
    throw new Error('itemId is required to delete a creation studio item.');
  }
  return apiClient.delete(`/agency/creation-studio/items/${itemId}`);
}

export default {
  fetchCreationStudioOverview,
  fetchCreationStudioSnapshot,
  fetchCreationStudioItems,
  fetchCreationStudioItem,
  createCreationStudioItem,
  updateCreationStudioItem,
  publishCreationStudioItem,
  shareCreationStudioItem,
  deleteCreationStudioItem,
};
