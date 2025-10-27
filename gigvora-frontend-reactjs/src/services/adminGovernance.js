import { apiClient } from './apiClient.js';

export function fetchAdminGovernanceOverview(params = {}) {
  return apiClient.get('/admin/governance/overview', { params });
}

export default {
  fetchAdminGovernanceOverview,
};
