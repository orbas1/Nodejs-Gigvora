import { apiClient } from './apiClient.js';
import {
  assertAdminAccess,
  buildAdminCacheKey,
  createRequestOptions,
  fetchWithCache,
  invalidateCacheByTag,
  sanitiseQueryParams,
} from './adminServiceHelpers.js';

const HUB_ROLES = ['super-admin', 'platform-admin', 'operations-admin'];
const CACHE_TAG = 'admin:hub:overview';

export function fetchAdminHubOverview({ lookbackDays = 30, forceRefresh = false, cacheTtl = 60000, ...options } = {}) {
  assertAdminAccess(HUB_ROLES);
  const params = sanitiseQueryParams({ lookbackDays });
  const cacheKey = buildAdminCacheKey('admin:hub:overview', params);

  return fetchWithCache(
    cacheKey,
    () => apiClient.get('/admin/hub', createRequestOptions(options, params)),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAG,
    },
  );
}

export async function triggerAdminHubSync(options = {}) {
  assertAdminAccess(HUB_ROLES);
  const response = await apiClient.post('/admin/hub/sync', {}, options);
  invalidateCacheByTag(CACHE_TAG);
  return response;
}

export default {
  fetchAdminHubOverview,
  triggerAdminHubSync,
};
