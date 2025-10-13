import { apiClient } from './apiClient.js';

export async function fetchHeadhunterDashboard({ workspaceId, lookbackDays, signal } = {}) {
  const params = {};
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    params.workspaceId = workspaceId;
  }
  if (lookbackDays != null) {
    params.lookbackDays = lookbackDays;
  }
  return apiClient.get('/headhunter/dashboard', { params, signal });
}

export default {
  fetchHeadhunterDashboard,
};
