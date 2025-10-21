import { apiClient } from './apiClient.js';

function requireLaunchpadId(payload) {
  const launchpadId = payload?.launchpadId;
  if (!launchpadId) {
    throw new Error('launchpadId is required for Launchpad submissions.');
  }
  return launchpadId;
}

function normaliseArray(value) {
  if (!value) {
    return undefined;
  }
  const list = Array.isArray(value) ? value : `${value}`.split(',');
  const filtered = list.map((entry) => `${entry}`.trim()).filter(Boolean);
  return filtered.length ? filtered.join(',') : undefined;
}

function sanitiseParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

export async function submitTalentApplication(payload = {}, { signal } = {}) {
  const launchpadId = requireLaunchpadId(payload);
  return apiClient.post('/launchpad/applications', { ...payload, launchpadId }, { signal });
}

export async function submitEmployerBrief(payload = {}, { signal } = {}) {
  const launchpadId = requireLaunchpadId(payload);
  return apiClient.post('/launchpad/employers', { ...payload, launchpadId }, { signal });
}

export async function recordEmployerPlacement(payload = {}, { signal } = {}) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('A payload is required to record an employer placement.');
  }
  return apiClient.post('/launchpad/placements', payload, { signal });
}

export async function fetchLaunchpadDashboard({ launchpadId, lookbackDays = 60, signal } = {}) {
  return apiClient.get('/launchpad/dashboard', {
    params: sanitiseParams({ launchpadId, lookbackDays }),
    signal,
  });
}

export async function fetchLaunchpadWorkflow({ launchpadId, lookbackDays = 45, signal } = {}) {
  return apiClient.get('/launchpad/workflow', {
    params: sanitiseParams({ launchpadId, lookbackDays }),
    signal,
  });
}

export async function fetchLaunchpadApplications(params = {}, { signal } = {}) {
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
    params: sanitiseParams({
      launchpadId,
      status,
      statuses: normaliseArray(statuses) ?? normaliseArray(status),
      search,
      page,
      pageSize,
      minScore,
      maxScore,
      sort,
      includeMatches: includeMatches ? 'true' : 'false',
    }),
    signal,
  });
}

export async function updateLaunchpadApplicationStatus(applicationId, payload = {}, { signal } = {}) {
  if (!applicationId) {
    throw new Error('applicationId is required to update a Launchpad application.');
  }
  if (!payload.status) {
    throw new Error('status is required to update a Launchpad application.');
  }
  return apiClient.patch(`/launchpad/applications/${applicationId}/status`, payload, { signal });
}

export default {
  submitTalentApplication,
  submitEmployerBrief,
  recordEmployerPlacement,
  fetchLaunchpadDashboard,
  fetchLaunchpadWorkflow,
  fetchLaunchpadApplications,
  updateLaunchpadApplicationStatus,
};
