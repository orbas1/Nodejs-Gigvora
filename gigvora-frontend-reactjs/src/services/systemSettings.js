import { apiClient } from './apiClient.js';

export async function fetchSystemSettings(options = {}) {
  return apiClient.get('/admin/system-settings', options);
}

export async function updateSystemSettings(payload) {
  return apiClient.put('/admin/system-settings', payload);
}

export default {
  fetchSystemSettings,
  updateSystemSettings,
};
