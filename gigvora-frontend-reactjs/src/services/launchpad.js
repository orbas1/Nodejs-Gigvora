import { apiClient } from './apiClient.js';

export async function submitTalentApplication(payload) {
  return apiClient.post('/launchpad/applications', {
    ...payload,
    launchpadId: payload.launchpadId,
  });
}

export async function submitEmployerBrief(payload) {
  return apiClient.post('/launchpad/employers', {
    ...payload,
    launchpadId: payload.launchpadId,
  });
}

export async function recordEmployerPlacement(payload) {
  return apiClient.post('/launchpad/placements', payload);
}

export async function fetchLaunchpadDashboard({ launchpadId, lookbackDays = 60 } = {}) {
  return apiClient.get('/launchpad/dashboard', {
    params: {
      launchpadId: launchpadId ?? undefined,
      lookbackDays,
    },
  });
}

export async function fetchLaunchpadWorkflow({ launchpadId, lookbackDays = 45 } = {}) {
  return apiClient.get('/launchpad/workflow', {
    params: {
      launchpadId,
      lookbackDays,
    },
  });
}

export async function fetchLaunchpadApplications(params = {}) {
  const {
    launchpadId,
    status,
    statuses,
    search,
    page,
    pageSize,
    minScore,
    maxScore,
    sort,
    includeMatches = true,
  } = params;

  return apiClient.get('/launchpad/applications', {
    params: {
      launchpadId,
      status,
      statuses,
      search,
      page,
      pageSize,
      minScore,
      maxScore,
      sort,
      includeMatches,
    },
  });
}

export default {
  submitTalentApplication,
  submitEmployerBrief,
  recordEmployerPlacement,
  fetchLaunchpadDashboard,
  fetchLaunchpadWorkflow,
  fetchLaunchpadApplications,
};
