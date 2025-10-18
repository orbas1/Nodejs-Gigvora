import { apiClient } from './apiClient.js';

export function searchProjects(query, { page = 1, pageSize = 10, signal } = {}) {
  const params = {};
  if (query != null) {
    params.query = query;
  }
  params.page = page;
  params.pageSize = pageSize;
  return apiClient.get('/discovery/projects', { params, signal });
}

export default {
  searchProjects,
};
