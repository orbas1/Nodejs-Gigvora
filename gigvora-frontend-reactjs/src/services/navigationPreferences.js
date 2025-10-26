import { apiClient } from './apiClient.js';

function ensureUserId(userId) {
  if (!userId) {
    throw new Error('userId is required to manage navigation preferences.');
  }
}

export async function fetchNavigationPreferences(userId, { dashboardKey, signal } = {}) {
  ensureUserId(userId);
  const params = {};
  if (dashboardKey) {
    params.dashboardKey = dashboardKey;
  }
  return apiClient.get(`/users/${userId}/navigation-preferences`, { signal, params });
}

export async function saveNavigationPreferences(userId, payload = {}, { signal } = {}) {
  ensureUserId(userId);
  return apiClient.put(`/users/${userId}/navigation-preferences`, payload, { signal });
}

export default {
  fetchNavigationPreferences,
  saveNavigationPreferences,
};
