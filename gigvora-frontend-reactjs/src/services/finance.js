import { apiClient } from './apiClient.js';

function buildFinanceOverviewCacheKey(userId) {
  return userId ? `finance:controlTower:${userId}` : 'finance:controlTower:self';
}

async function fetchControlTowerOverview({ userId, signal, forceRefresh = false } = {}) {
  const params = {};
  if (userId) {
    params.userId = userId;
  }
  if (forceRefresh) {
    params.refresh = 'true';
  }
  return apiClient.get('/finance/control-tower/overview', { params, signal });
}

function invalidateFinanceOverviewCache(userId) {
  apiClient.removeCache(buildFinanceOverviewCacheKey(userId));
}

async function fetchFreelancerFinanceInsights(freelancerId, { signal } = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to fetch finance insights.');
  }
  return apiClient.get(`/finance/freelancers/${freelancerId}/insights`, { signal });
}

export {
  buildFinanceOverviewCacheKey,
  fetchControlTowerOverview,
  invalidateFinanceOverviewCache,
  fetchFreelancerFinanceInsights,
};

export default {
  buildFinanceOverviewCacheKey,
  fetchControlTowerOverview,
  invalidateFinanceOverviewCache,
  fetchFreelancerFinanceInsights,
};
