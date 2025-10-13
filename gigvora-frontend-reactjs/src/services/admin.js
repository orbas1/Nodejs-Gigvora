import { apiClient } from './apiClient.js';

export async function fetchAdminDashboard(params = {}) {
  return apiClient.get('/admin/dashboard', { params });
}

export default {
  fetchAdminDashboard,
};
