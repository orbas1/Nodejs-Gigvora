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

export default {
  fetchCreationStudioOverview,
  fetchCreationStudioItems,
  createCreationStudioItem,
  updateCreationStudioItem,
  publishCreationStudioItem,
  deleteCreationStudioItem,
};
