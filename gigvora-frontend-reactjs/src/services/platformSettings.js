import { apiClient } from './apiClient.js';

export async function fetchPlatformSettings() {
  return apiClient.get('/admin/platform-settings');
}

export async function updatePlatformSettings(payload) {
  return apiClient.put('/admin/platform-settings', payload);
}

export default {
  fetchPlatformSettings,
  updatePlatformSettings,
};
