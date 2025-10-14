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

export default {
  fetchAgencyDashboard,
};

