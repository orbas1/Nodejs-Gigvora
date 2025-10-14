import { apiClient } from './apiClient.js';

export async function fetchAffiliateSettings({ signal } = {}) {
  return apiClient.get('/admin/affiliate-settings', { signal });
}

export async function updateAffiliateSettings(payload, { signal } = {}) {
  return apiClient.put('/admin/affiliate-settings', payload, { signal });
}

export async function fetchAffiliateDashboard(userId, { signal } = {}) {
  if (!userId) {
    throw new Error('A userId is required to load affiliate analytics.');
  }
  return apiClient.get(`/users/${userId}/affiliate/dashboard`, { signal });
}

export default {
  fetchAffiliateSettings,
  updateAffiliateSettings,
  fetchAffiliateDashboard,
};
