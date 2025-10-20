import apiClient from './apiClient.js';

const CACHE_NAMESPACE = 'support-desk';

function buildCacheKey(userId) {
  return `${CACHE_NAMESPACE}:${userId}`;
}

export async function getSupportDeskSnapshot(userId, { forceRefresh = false } = {}) {
  if (!Number.isInteger(Number(userId)) || Number(userId) <= 0) {
    throw new Error('A valid userId is required to load the support desk snapshot.');
  }

  const cacheKey = buildCacheKey(userId);

  if (!forceRefresh) {
    const cached = apiClient.readCache(cacheKey);
    if (cached?.data) {
      return { data: cached.data, cachedAt: cached.timestamp ?? null, fromCache: true };
    }
  }

  const params = forceRefresh ? { fresh: 'true' } : undefined;
  const data = await apiClient.get(`/users/${userId}/support-desk`, { params });

  apiClient.writeCache(cacheKey, data);

  return { data, cachedAt: new Date(), fromCache: false };
}

export default {
  getSupportDeskSnapshot,
};
