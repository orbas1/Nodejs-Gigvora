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

const FREELANCER_ROLES = ['super-admin', 'platform-admin', 'operations-admin', 'talent-admin'];
const CACHE_TAGS = {
  list: 'admin:freelancers:list',
  stats: 'admin:freelancers:stats',
};

function normaliseFreelancerQuery(params = {}) {
  return sanitiseQueryParams({
    search: params.search,
    status: params.status,
    tier: params.tier,
    discipline: params.discipline,
    ownerId: params.ownerId ?? params.owner_id,
    page: params.page,
    pageSize: params.pageSize ?? params.page_size,
    sort: params.sort,
  });
}

async function performAndInvalidate(request) {
  const response = await request();
  invalidateCacheByTag(CACHE_TAGS.list, CACHE_TAGS.stats);
  return response;
}

export function listAdminFreelancers(params = {}, options = {}) {
  assertAdminAccess(FREELANCER_ROLES);
  const cleanedParams = normaliseFreelancerQuery(params);
  const { forceRefresh = false, cacheTtl = 60000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:freelancers:list', cleanedParams);

  return fetchWithCache(
    cacheKey,
    () => apiClient.get('/admin/freelancers', createRequestOptions(requestOptions, cleanedParams)),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.list,
    },
  );
}

export function fetchAdminFreelancerStats(options = {}) {
  assertAdminAccess(FREELANCER_ROLES);
  const { forceRefresh = false, cacheTtl = 120000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:freelancers:stats');

  return fetchWithCache(
    cacheKey,
    () => apiClient.get('/admin/freelancers/stats', createRequestOptions(requestOptions)),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.stats,
    },
  );
}

export function createAdminFreelancer(payload = {}, options = {}) {
  assertAdminAccess(FREELANCER_ROLES);
  return performAndInvalidate(() => apiClient.post('/admin/freelancers', payload, options));
}

export function updateAdminFreelancer(freelancerId, payload = {}, options = {}) {
  assertAdminAccess(FREELANCER_ROLES);
  const identifier = encodeIdentifier(freelancerId, { label: 'freelancerId' });
  return performAndInvalidate(() => apiClient.put(`/admin/freelancers/${identifier}`, payload, options));
}

export function archiveAdminFreelancer(freelancerId, options = {}) {
  assertAdminAccess(FREELANCER_ROLES);
  const identifier = encodeIdentifier(freelancerId, { label: 'freelancerId' });
  return performAndInvalidate(() => apiClient.delete(`/admin/freelancers/${identifier}`, options));
}

export function reactivateAdminFreelancer(freelancerId, options = {}) {
  assertAdminAccess(FREELANCER_ROLES);
  const identifier = encodeIdentifier(freelancerId, { label: 'freelancerId' });
  return performAndInvalidate(() =>
    apiClient.post(`/admin/freelancers/${identifier}/reactivate`, {}, options),
  );
}

export function sendAdminFreelancerInvite(freelancerId, payload = {}, options = {}) {
  assertAdminAccess(FREELANCER_ROLES);
  const identifier = encodeIdentifier(freelancerId, { label: 'freelancerId' });
  return apiClient.post(`/admin/freelancers/${identifier}/invite`, payload, options);
}

export default {
  listAdminFreelancers,
  fetchAdminFreelancerStats,
  createAdminFreelancer,
  updateAdminFreelancer,
  archiveAdminFreelancer,
  reactivateAdminFreelancer,
  sendAdminFreelancerInvite,
};
