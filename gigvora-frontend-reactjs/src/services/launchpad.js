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

export default {
  submitTalentApplication,
  submitEmployerBrief,
  recordEmployerPlacement,
  fetchLaunchpadDashboard,
};
