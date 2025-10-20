import { apiClient } from './apiClient.js';

export function fetchAdminHubOverview({ lookbackDays = 30, signal } = {}) {
  return apiClient.get('/admin/hub', {
    params: { lookbackDays },
    signal,
  });
}

export function triggerAdminHubSync(options = {}) {
  return apiClient.post('/admin/hub/sync', {}, options);
}

export default {
  fetchAdminHubOverview,
  triggerAdminHubSync,
};
