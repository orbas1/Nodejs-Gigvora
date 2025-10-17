import { apiClient } from './apiClient.js';

export async function fetchAgencyDashboard(
  { workspaceSlug, workspaceId, lookbackDays } = {},
  { signal } = {},
) {
  return apiClient.get('/agency/dashboard', {
    params: {
      workspaceSlug: workspaceSlug ?? undefined,
      workspaceId: workspaceId ?? undefined,
      lookbackDays: lookbackDays ?? undefined,
    },
    signal,
  });
}

export async function fetchAgencyOverview({ workspaceSlug, workspaceId } = {}, { signal } = {}) {
  return apiClient.get('/agency/dashboard/overview', {
    params: {
      workspaceSlug: workspaceSlug ?? undefined,
      workspaceId: workspaceId ?? undefined,
    },
    signal,
  });
}

export async function updateAgencyOverview(payload, options = {}) {
  return apiClient.put('/agency/dashboard/overview', payload, options);
}

export default {
  fetchAgencyDashboard,
  fetchAgencyOverview,
  updateAgencyOverview,
};

