import { apiClient } from './apiClient.js';
import { optionalString, mergeWorkspace, combineRequestOptions } from './serviceHelpers.js';

function normalisePositiveInteger(value, fallback) {
  const parsed = typeof value === 'string' ? Number.parseInt(value.trim(), 10) : value;
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
}

export function searchProjects(query, { page = 1, pageSize = 10, workspaceId, workspaceSlug, ...options } = {}) {
  const params = mergeWorkspace({}, { workspaceId, workspaceSlug });
  const searchQuery = optionalString(query);
  if (searchQuery) {
    params.query = searchQuery;
  }
  params.page = normalisePositiveInteger(page, 1);
  params.pageSize = normalisePositiveInteger(pageSize, 10);
  return apiClient.get(
    '/discovery/projects',
    combineRequestOptions({ params }, options),
  );
}

export default {
  searchProjects,
};
