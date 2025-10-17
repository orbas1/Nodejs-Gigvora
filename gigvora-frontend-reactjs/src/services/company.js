import { apiClient } from './apiClient.js';

export async function fetchCompanyDashboard({ workspaceId, workspaceSlug, lookbackDays, signal } = {}) {
  const params = {};
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    params.workspaceId = workspaceId;
  }
  if (workspaceSlug != null && `${workspaceSlug}`.length > 0) {
    params.workspaceSlug = workspaceSlug;
  }
  if (lookbackDays != null) {
    params.lookbackDays = lookbackDays;
  }
  return apiClient.get('/company/dashboard', { params, signal });
}

export async function updateCompanyDashboardOverview(payload, { signal } = {}) {
  return apiClient.put('/company/dashboard/overview', payload, { signal });
}

export default {
  fetchCompanyDashboard,
  updateCompanyDashboardOverview,
};

