import { apiClient } from './apiClient.js';

function buildWorkspaceParams({ workspaceId, workspaceSlug }) {
  const params = {};
  if (workspaceId != null && `${workspaceId}`.length) {
    params.workspaceId = workspaceId;
  }
  if (workspaceSlug != null && `${workspaceSlug}`.trim().length) {
    params.workspaceSlug = workspaceSlug.trim();
  }
  return params;
}

export async function fetchLaunchpadJobDashboard({ workspaceId, workspaceSlug, launchpadId, lookbackDays, signal } = {}) {
  const params = {
    ...buildWorkspaceParams({ workspaceId, workspaceSlug }),
  };
  if (launchpadId != null) {
    params.launchpadId = launchpadId;
  }
  if (lookbackDays != null) {
    params.lookbackDays = lookbackDays;
  }
  return apiClient.get('/company/launchpad/jobs', { params, signal });
}

export async function createLaunchpadJobLink({ workspaceId, workspaceSlug, ...payload }) {
  const body = {
    ...payload,
    ...buildWorkspaceParams({ workspaceId, workspaceSlug }),
  };
  return apiClient.post('/company/launchpad/jobs', body);
}

export async function updateLaunchpadJobLink(linkId, { workspaceId, workspaceSlug, ...payload }) {
  const body = {
    ...payload,
    ...buildWorkspaceParams({ workspaceId, workspaceSlug }),
  };
  return apiClient.put(`/company/launchpad/jobs/${linkId}`, body);
}

export async function deleteLaunchpadJobLink(linkId) {
  return apiClient.delete(`/company/launchpad/jobs/${linkId}`);
}

export async function createLaunchpadPlacement(linkId, { workspaceId, workspaceSlug, ...payload }) {
  const body = {
    ...payload,
    ...buildWorkspaceParams({ workspaceId, workspaceSlug }),
  };
  return apiClient.post(`/company/launchpad/jobs/${linkId}/placements`, body);
}

export async function updateLaunchpadPlacement(placementId, { workspaceId, workspaceSlug, ...payload }) {
  const body = {
    ...payload,
    ...buildWorkspaceParams({ workspaceId, workspaceSlug }),
  };
  return apiClient.put(`/company/launchpad/placements/${placementId}`, body);
}

export async function deleteLaunchpadPlacement(placementId) {
  return apiClient.delete(`/company/launchpad/placements/${placementId}`);
}

export default {
  fetchLaunchpadJobDashboard,
  createLaunchpadJobLink,
  updateLaunchpadJobLink,
  deleteLaunchpadJobLink,
  createLaunchpadPlacement,
  updateLaunchpadPlacement,
  deleteLaunchpadPlacement,
};

