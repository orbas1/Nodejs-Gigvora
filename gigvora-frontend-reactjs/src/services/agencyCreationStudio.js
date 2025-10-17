import { apiClient } from './apiClient.js';

export function fetchCreationStudioOverview(params = {}, { signal } = {}) {
  return apiClient.get('/agency/creation-studio', {
    params: {
      page: params.page ?? undefined,
      pageSize: params.pageSize ?? undefined,
      targetType: params.targetType ?? undefined,
      status: params.status ?? undefined,
      search: params.search ?? undefined,
      agencyProfileId: params.agencyProfileId ?? undefined,
    },
    signal,
  });
}

export function fetchCreationStudioSnapshot(params = {}, { signal } = {}) {
  return apiClient.get('/agency/creation-studio/snapshot', {
    params: {
      targetType: params.targetType ?? undefined,
      status: params.status ?? undefined,
      agencyProfileId: params.agencyProfileId ?? undefined,
    },
    signal,
  });
}

export function createCreationStudioItem(payload) {
  return apiClient.post('/agency/creation-studio/items', payload);
}

export function updateCreationStudioItem(itemId, payload) {
  return apiClient.put(`/agency/creation-studio/items/${itemId}`, payload);
}

export function deleteCreationStudioItem(itemId) {
  return apiClient.delete(`/agency/creation-studio/items/${itemId}`);
}

export default {
  fetchCreationStudioOverview,
  fetchCreationStudioSnapshot,
  createCreationStudioItem,
  updateCreationStudioItem,
  deleteCreationStudioItem,
};
