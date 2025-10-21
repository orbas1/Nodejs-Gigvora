import { apiClient } from './apiClient.js';
import {
  assertAdminAccess,
  buildAdminCacheKey,
  createRequestOptions,
  encodeIdentifier,
  fetchWithCache,
  invalidateCacheByTag,
  sanitiseQueryParams,
} from './adminServiceHelpers.js';

const JOB_ROLES = ['super-admin', 'platform-admin', 'operations-admin', 'talent-admin'];
const CACHE_TAGS = {
  list: 'admin:jobs:posts',
};

function normaliseJobPostQuery(params = {}) {
  return sanitiseQueryParams({
    status: params.status,
    ownerId: params.ownerId ?? params.owner_id,
    workspaceId: params.workspaceId ?? params.workspace_id,
    search: params.search,
    page: params.page,
    pageSize: params.pageSize ?? params.page_size,
    sort: params.sort,
  });
}

function normaliseResponse(response = {}) {
  return {
    results: Array.isArray(response?.results) ? response.results : [],
    pagination: response?.pagination ?? { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    summary: response?.summary ?? { statusCounts: {}, workflowCounts: {} },
  };
}

async function performAndInvalidate(request) {
  const response = await request();
  invalidateCacheByTag(CACHE_TAGS.list);
  return response;
}

export function fetchAdminJobPosts(params = {}, options = {}) {
  assertAdminAccess(JOB_ROLES);
  const cleanedParams = normaliseJobPostQuery(params);
  const { forceRefresh = false, cacheTtl = 60000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:jobs:posts', cleanedParams);

  return fetchWithCache(
    cacheKey,
    async () => {
      const response = await apiClient.get(
        '/admin/jobs/posts',
        createRequestOptions(requestOptions, cleanedParams),
      );
      return normaliseResponse(response);
    },
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.list,
    },
  );
}

export function fetchAdminJobPost(identifier, options = {}) {
  assertAdminAccess(JOB_ROLES);
  const encodedIdentifier = encodeIdentifier(identifier, { label: 'identifier' });
  return apiClient.get(`/admin/jobs/posts/${encodedIdentifier}`, options);
}

export function createAdminJobPost(payload = {}, options = {}) {
  assertAdminAccess(JOB_ROLES);
  return performAndInvalidate(() => apiClient.post('/admin/jobs/posts', payload, options));
}

export function updateAdminJobPost(identifier, payload = {}, options = {}) {
  assertAdminAccess(JOB_ROLES);
  const encodedIdentifier = encodeIdentifier(identifier, { label: 'identifier' });
  return performAndInvalidate(() =>
    apiClient.put(`/admin/jobs/posts/${encodedIdentifier}`, payload, options),
  );
}

export function publishAdminJobPost(identifier, payload = {}, options = {}) {
  assertAdminAccess(JOB_ROLES);
  const encodedIdentifier = encodeIdentifier(identifier, { label: 'identifier' });
  return performAndInvalidate(() =>
    apiClient.post(`/admin/jobs/posts/${encodedIdentifier}/publish`, payload, options),
  );
}

export function archiveAdminJobPost(identifier, payload = {}, options = {}) {
  assertAdminAccess(JOB_ROLES);
  const encodedIdentifier = encodeIdentifier(identifier, { label: 'identifier' });
  return performAndInvalidate(() =>
    apiClient.post(`/admin/jobs/posts/${encodedIdentifier}/archive`, payload, options),
  );
}

export function deleteAdminJobPost(identifier, { hardDelete = false, ...options } = {}) {
  assertAdminAccess(JOB_ROLES);
  const encodedIdentifier = encodeIdentifier(identifier, { label: 'identifier' });
  const params = sanitiseQueryParams({ hardDelete });
  return performAndInvalidate(() =>
    apiClient.delete(`/admin/jobs/posts/${encodedIdentifier}`, createRequestOptions(options, params)),
  );
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
