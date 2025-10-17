import { apiClient } from './apiClient.js';

export async function fetchWebsitePreferences(userId, { signal } = {}) {
  if (!userId) {
    throw new Error('userId is required to load website preferences.');
  }
  return apiClient.get(`/users/${userId}/website-preferences`, { signal });
}

export async function saveWebsitePreferences(userId, payload, { signal } = {}) {
  if (!userId) {
    throw new Error('userId is required to update website preferences.');
  }
  return apiClient.put(`/users/${userId}/website-preferences`, payload, { signal });
}

export default {
  fetchWebsitePreferences,
  saveWebsitePreferences,
};
