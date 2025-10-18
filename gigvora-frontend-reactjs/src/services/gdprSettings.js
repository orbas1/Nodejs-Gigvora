import { apiClient } from './apiClient.js';

export async function fetchGdprSettings(options = {}) {
  return apiClient.get('/admin/gdpr-settings', options);
}

export async function updateGdprSettings(payload = {}, options = {}) {
  return apiClient.put('/admin/gdpr-settings', payload, options);
}

export default {
  fetchGdprSettings,
  updateGdprSettings,
};
