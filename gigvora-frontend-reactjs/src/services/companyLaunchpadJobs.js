import { apiClient } from './apiClient.js';

function ensureId(value, message) {
  if (value === undefined || value === null || `${value}`.trim().length === 0) {
    throw new Error(message);
  }
  return typeof value === 'string' ? value.trim() : value;
}

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

export async function createLaunchpadJobLink({ workspaceId, workspaceSlug, signal, ...payload }) {
  const body = {
    ...payload,
    ...buildWorkspaceParams({ workspaceId, workspaceSlug }),
  };
  return apiClient.post('/company/launchpad/jobs', body, { signal });
}

export async function updateLaunchpadJobLink(linkId, { workspaceId, workspaceSlug, signal, ...payload }) {
  const resolvedLinkId = ensureId(linkId, 'linkId is required to update a launchpad job link.');
  const body = {
    ...payload,
    ...buildWorkspaceParams({ workspaceId, workspaceSlug }),
  };
  return apiClient.put(`/company/launchpad/jobs/${resolvedLinkId}`, body, { signal });
}

export async function deleteLaunchpadJobLink(linkId, { signal } = {}) {
  const resolvedLinkId = ensureId(linkId, 'linkId is required to delete a launchpad job link.');
  return apiClient.delete(`/company/launchpad/jobs/${resolvedLinkId}`, { signal });
}

export async function createLaunchpadPlacement(linkId, { workspaceId, workspaceSlug, signal, ...payload }) {
  const resolvedLinkId = ensureId(linkId, 'linkId is required to create a launchpad placement.');
  const body = {
    ...payload,
    ...buildWorkspaceParams({ workspaceId, workspaceSlug }),
  };
  return apiClient.post(`/company/launchpad/jobs/${resolvedLinkId}/placements`, body, { signal });
}

export async function updateLaunchpadPlacement(placementId, { workspaceId, workspaceSlug, signal, ...payload }) {
  const resolvedPlacementId = ensureId(placementId, 'placementId is required to update a launchpad placement.');
  const body = {
    ...payload,
    ...buildWorkspaceParams({ workspaceId, workspaceSlug }),
  };
  return apiClient.put(`/company/launchpad/placements/${resolvedPlacementId}`, body, { signal });
}

export async function deleteLaunchpadPlacement(placementId, { signal } = {}) {
  const resolvedPlacementId = ensureId(placementId, 'placementId is required to delete a launchpad placement.');
  return apiClient.delete(`/company/launchpad/placements/${resolvedPlacementId}`, { signal });
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

