import { apiClient } from './apiClient.js';

export async function fetchSeoSettings(options = {}) {
  return apiClient.get('/admin/seo-settings', options);
}

export async function updateSeoSettings(payload) {
  return apiClient.put('/admin/seo-settings', payload);
}

export default {
  fetchSeoSettings,
  updateSeoSettings,
};
