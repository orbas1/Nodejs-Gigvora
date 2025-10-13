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

export default {
  fetchCompanyDashboard,
};

