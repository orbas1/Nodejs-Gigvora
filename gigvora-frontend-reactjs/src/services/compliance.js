import apiClient from './apiClient.js';

const CACHE_KEY_PREFIX = 'freelancer:compliance-locker';
const DEFAULT_CACHE_TTL = 1000 * 60;

function buildCacheKey(userId, region, frameworks = []) {
  const normalizedFrameworks = Array.isArray(frameworks) ? frameworks.slice().sort().join(',') : frameworks ?? '';
  return `${CACHE_KEY_PREFIX}:${userId}:${region ?? 'global'}:${normalizedFrameworks}`;
}

export async function fetchComplianceLocker({ userId, region, frameworks, useCache = true } = {}) {
  if (!userId) {
    throw new Error('userId is required to fetch the compliance locker.');
  }

  const cacheKey = buildCacheKey(userId, region, frameworks);
  if (useCache) {
    const cached = apiClient.readCache(cacheKey);
    if (cached?.data) {
      return cached.data;
    }
  }

  const params = { userId };
  if (region) params.region = region;
  if (frameworks && Array.isArray(frameworks) && frameworks.length) {
    params.frameworks = frameworks.join(',');
  }
  if (!useCache) {
    params.useCache = 'false';
  }

  const response = await apiClient.get('/compliance/locker', { params });
  if (useCache) {
    apiClient.writeCache(cacheKey, response, DEFAULT_CACHE_TTL);
  }
  return response;
}

export async function acknowledgeComplianceReminder(reminderId, { actorId, status = 'acknowledged' } = {}) {
  if (!reminderId) {
    throw new Error('reminderId is required to acknowledge a compliance reminder.');
  }
  const payload = { status };
  if (actorId) {
    payload.actorId = actorId;
  }
  return apiClient.patch(`/compliance/reminders/${reminderId}`, payload);
}

export default {
  fetchComplianceLocker,
  acknowledgeComplianceReminder,
};
