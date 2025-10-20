import { apiClient } from './apiClient.js';

// Company creation studio endpoints
export function fetchCompanyCreationStudioOverview({ workspaceId, signal } = {}) {
  const params = {};
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    params.workspaceId = workspaceId;
  }
  return apiClient.get('/company/creation-studio/overview', { params, signal });
}

export function fetchCompanyCreationStudioItems({ workspaceId, type, status, search, limit, offset } = {}, { signal } = {}) {
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

export function createCompanyCreationStudioItem(payload, { signal } = {}) {
  return apiClient.post('/company/creation-studio', payload, { signal });
}

export function updateCompanyCreationStudioItem(itemId, payload, { signal } = {}) {
  if (!itemId) {
    throw new Error('itemId is required to update a creation studio item.');
  }
  return apiClient.put(`/company/creation-studio/${itemId}`, payload, { signal });
}

export function publishCompanyCreationStudioItem(itemId, payload = {}, { signal } = {}) {
  if (!itemId) {
    throw new Error('itemId is required to publish a creation studio item.');
  }
  return apiClient.post(`/company/creation-studio/${itemId}/publish`, payload, { signal });
}

export function deleteCompanyCreationStudioItem(itemId, { signal } = {}) {
  if (!itemId) {
    throw new Error('itemId is required to delete a creation studio item.');
  }
  return apiClient.delete(`/company/creation-studio/${itemId}`, { signal });
}

// User creation studio workspace endpoints
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

export function createCreationItem(userId, payload, { signal } = {}) {
  if (!userId) {
    throw new Error('userId is required to create a creation studio item.');
  }
  return apiClient.post(`/users/${userId}/creation-studio`, payload, { signal });
}

export function updateCreationItem(userId, itemId, payload, { signal } = {}) {
  if (!userId || !itemId) {
    throw new Error('userId and itemId are required to update a creation studio item.');
  }
  return apiClient.put(`/users/${userId}/creation-studio/${itemId}`, payload, { signal });
}

export function saveCreationStep(userId, itemId, stepKey, payload, { signal } = {}) {
  if (!userId || !itemId || !stepKey) {
    throw new Error('userId, itemId, and stepKey are required to update a creation studio step.');
  }
  return apiClient.post(`/users/${userId}/creation-studio/${itemId}/steps/${encodeURIComponent(stepKey)}`, payload, { signal });
}

export function shareCreationItem(userId, itemId, payload, { signal } = {}) {
  if (!userId || !itemId) {
    throw new Error('userId and itemId are required to share a creation studio item.');
  }
  return apiClient.post(`/users/${userId}/creation-studio/${itemId}/share`, payload, { signal });
}

export function archiveCreationItem(userId, itemId, { signal } = {}) {
  if (!userId || !itemId) {
    throw new Error('userId and itemId are required to archive a creation studio item.');
  }
  return apiClient.delete(`/users/${userId}/creation-studio/${itemId}`, { signal });
}

// Public creation studio catalogue endpoints
export function listCreationStudioItems(params = {}, options = {}) {
  return apiClient.get('/creation-studio/items', { params, ...options });
}

export function getCreationStudioItem(itemId, options = {}) {
  if (!itemId) {
    throw new Error('itemId is required to fetch a creation studio item.');
  }
  return apiClient.get(`/creation-studio/items/${itemId}`, options);
}

export function createCreationStudioItem(payload, options = {}) {
  return apiClient.post('/creation-studio/items', payload, options);
}

export function updateCreationStudioItem(itemId, payload, options = {}) {
  if (!itemId) {
    throw new Error('itemId is required to update a creation studio item.');
  }
  return apiClient.put(`/creation-studio/items/${itemId}`, payload, options);
}

export function publishCreationStudioItem(itemId, payload = {}, options = {}) {
  if (!itemId) {
    throw new Error('itemId is required to publish a creation studio item.');
  }
  return apiClient.post(`/creation-studio/items/${itemId}/publish`, payload, options);
}

export default {
  fetchCompanyCreationStudioOverview,
  fetchCompanyCreationStudioItems,
  createCompanyCreationStudioItem,
  updateCompanyCreationStudioItem,
  publishCompanyCreationStudioItem,
  deleteCompanyCreationStudioItem,
  fetchCreationWorkspace,
  createCreationItem,
  updateCreationItem,
  saveCreationStep,
  shareCreationItem,
  archiveCreationItem,
  listCreationStudioItems,
  getCreationStudioItem,
  createCreationStudioItem,
  updateCreationStudioItem,
  publishCreationStudioItem,
  deleteCreationStudioItem,
};

export const creationStudioService = {
  ...companyCreationStudio,
  ...userCreationStudio,
  ...communityCreationStudio,
  company: companyCreationStudio,
  user: userCreationStudio,
  community: communityCreationStudio,
};

export default creationStudioService;
