import { apiClient } from './apiClient.js';

export function buildOverviewCacheKey(userId) {
  return `dashboard:user:${userId}:overview`; // local helper if needed in future
}

export async function fetchUserDashboardOverview(userId, { signal, fresh = false } = {}) {
  if (!userId) {
    throw new Error('userId is required to load the dashboard overview.');
  }
  return apiClient.get(`/users/${userId}/dashboard/overview`, {
    signal,
    params: fresh ? { fresh: 'true' } : undefined,
  });
}

export async function updateUserDashboardOverview(userId, payload) {
  if (!userId) {
    throw new Error('userId is required to update the dashboard overview.');
  }
  return apiClient.put(`/users/${userId}/dashboard/overview`, payload ?? {});
}

export async function refreshUserDashboardOverviewWeather(userId) {
  if (!userId) {
    throw new Error('userId is required to refresh the dashboard weather.');
  }
  return apiClient.post(`/users/${userId}/dashboard/overview/refresh-weather`);
}

export default {
  buildOverviewCacheKey,
  fetchUserDashboardOverview,
  updateUserDashboardOverview,
  refreshUserDashboardOverviewWeather,
};
