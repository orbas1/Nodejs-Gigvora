import { apiClient } from './apiClient.js';

function cacheKeyForUser(userId) {
  return userId ? `finance:controlTower:${userId}` : 'finance:controlTower:self';
}

export async function fetchControlTowerOverview({ userId, signal, forceRefresh = false } = {}) {
  const params = {};
  if (userId) {
    params.userId = userId;
  }
  if (forceRefresh) {
    params.refresh = 'true';
  }
  return apiClient.get('/finance/control-tower/overview', { params, signal });
}

export function invalidateFinanceOverviewCache(userId) {
  apiClient.removeCache(cacheKeyForUser(userId));
}

export { cacheKeyForUser as buildFinanceOverviewCacheKey };

export default {
  fetchControlTowerOverview,
  invalidateFinanceOverviewCache,
  buildFinanceOverviewCacheKey,
};
