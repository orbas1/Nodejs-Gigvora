import { apiClient } from './apiClient.js';

export async function fetchAdminJobPosts(params = {}) {
  const response = await apiClient.get('/admin/jobs/posts', { params });
  return {
    results: Array.isArray(response?.results) ? response.results : [],
    pagination: response?.pagination ?? { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    summary: response?.summary ?? { statusCounts: {}, workflowCounts: {} },
  };
}

export async function fetchAdminJobPost(identifier) {
  if (!identifier) {
    throw new Error('identifier is required');
  }
  return apiClient.get(`/admin/jobs/posts/${identifier}`);
}

export async function createAdminJobPost(payload = {}) {
  return apiClient.post('/admin/jobs/posts', payload);
}

export async function updateAdminJobPost(identifier, payload = {}) {
  if (!identifier) {
    throw new Error('identifier is required');
  }
  return apiClient.put(`/admin/jobs/posts/${identifier}`, payload);
}

export async function publishAdminJobPost(identifier, payload = {}) {
  if (!identifier) {
    throw new Error('identifier is required');
  }
  return apiClient.post(`/admin/jobs/posts/${identifier}/publish`, payload);
}

export async function archiveAdminJobPost(identifier, payload = {}) {
  if (!identifier) {
    throw new Error('identifier is required');
  }
  return apiClient.post(`/admin/jobs/posts/${identifier}/archive`, payload);
}

export async function deleteAdminJobPost(identifier, { hardDelete = false } = {}) {
  if (!identifier) {
    throw new Error('identifier is required');
  }
  const params = hardDelete ? { hardDelete: true } : undefined;
  return apiClient.delete(`/admin/jobs/posts/${identifier}`, { params });
}

export default {
  fetchAdminJobPosts,
  fetchAdminJobPost,
  createAdminJobPost,
  updateAdminJobPost,
  publishAdminJobPost,
  archiveAdminJobPost,
  deleteAdminJobPost,
};
