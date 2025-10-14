import { apiClient } from './apiClient.js';

export async function fetchPlatformSettings(options = {}) {
  return apiClient.get('/admin/platform-settings', options);
}

export async function updatePlatformSettings(payload) {
  return apiClient.put('/admin/platform-settings', payload);
}

export default {
  fetchPlatformSettings,
  updatePlatformSettings,
};
