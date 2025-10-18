import { apiClient } from './apiClient.js';

export async function fetchHomepageSettings(options = {}) {
  return apiClient.get('/admin/homepage-settings', options);
}

export async function updateHomepageSettings(payload) {
  return apiClient.put('/admin/homepage-settings', payload);
}

export default {
  fetchHomepageSettings,
  updateHomepageSettings,
};
