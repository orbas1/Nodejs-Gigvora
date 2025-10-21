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

const MENTOR_ROLES = ['super-admin', 'platform-admin', 'mentoring-admin', 'operations-admin'];
const CACHE_TAGS = {
  list: 'admin:mentors:list',
  stats: 'admin:mentors:stats',
};

function normaliseMentorQuery(params = {}) {
  return sanitiseQueryParams({
    status: params.status,
    expertise: params.expertise,
    ownerId: params.ownerId ?? params.owner_id,
    search: params.search,
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

export function listAdminMentors(params = {}, options = {}) {
  assertAdminAccess(MENTOR_ROLES);
  const cleanedParams = normaliseMentorQuery(params);
  const { forceRefresh = false, cacheTtl = 60000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:mentors:list', cleanedParams);

  return fetchWithCache(
    cacheKey,
    () => apiClient.get('/admin/mentors', createRequestOptions(requestOptions, cleanedParams)),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.list,
    },
  );
}

export function fetchAdminMentorStats(options = {}) {
  assertAdminAccess(MENTOR_ROLES);
  const { forceRefresh = false, cacheTtl = 120000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:mentors:stats');

  return fetchWithCache(
    cacheKey,
    () => apiClient.get('/admin/mentors/stats', createRequestOptions(requestOptions)),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.stats,
    },
  );
}

export function createAdminMentor(payload = {}, options = {}) {
  assertAdminAccess(MENTOR_ROLES);
  return performAndInvalidate(() => apiClient.post('/admin/mentors', payload, options));
}

export function updateAdminMentor(mentorId, payload = {}, options = {}) {
  assertAdminAccess(MENTOR_ROLES);
  const identifier = encodeIdentifier(mentorId, { label: 'mentorId' });
  return performAndInvalidate(() => apiClient.put(`/admin/mentors/${identifier}`, payload, options));
}

export function archiveAdminMentor(mentorId, options = {}) {
  assertAdminAccess(MENTOR_ROLES);
  const identifier = encodeIdentifier(mentorId, { label: 'mentorId' });
  return performAndInvalidate(() => apiClient.delete(`/admin/mentors/${identifier}`, options));
}

export function reactivateAdminMentor(mentorId, options = {}) {
  assertAdminAccess(MENTOR_ROLES);
  const identifier = encodeIdentifier(mentorId, { label: 'mentorId' });
  return performAndInvalidate(() =>
    apiClient.post(`/admin/mentors/${identifier}/reactivate`, {}, options),
  );
}

export default {
  listAdminMentors,
  fetchAdminMentorStats,
  createAdminMentor,
  updateAdminMentor,
  archiveAdminMentor,
  reactivateAdminMentor,
};
