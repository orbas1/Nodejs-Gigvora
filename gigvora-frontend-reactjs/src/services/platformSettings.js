import { apiClient } from './apiClient.js';

export async function fetchPlatformSettings({ signal, params } = {}) {
  return apiClient.get('/admin/platform-settings', { signal, params });
}

export async function updatePlatformSettings(payload = {}, { signal } = {}) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('A payload is required to update platform settings.');
  }
  return apiClient.put('/admin/platform-settings', payload, { signal });
}

export default {
  fetchPlatformSettings,
  updatePlatformSettings,
};
