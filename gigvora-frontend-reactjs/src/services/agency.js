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

export async function fetchAgencyProfile(
  { includeFollowers = true, includeConnections = true, followersLimit, followersOffset, userId } = {},
  { signal } = {},
) {
  return apiClient.get('/agency/profile', {
    params: {
      includeFollowers,
      includeConnections,
      followersLimit,
      followersOffset,
      userId,
    },
    signal,
  });
}

export async function updateAgencyProfile(body, { signal } = {}) {
  return apiClient.put('/agency/profile', body, { signal });
}

export async function updateAgencyAvatar(body, { signal } = {}) {
  return apiClient.put('/agency/profile/avatar', body, { signal });
}

export async function listAgencyFollowers(
  { limit, offset, userId } = {},
  { signal } = {},
) {
  return apiClient.get('/agency/profile/followers', {
    params: { limit, offset, userId },
    signal,
  });
}

export async function updateAgencyFollower(followerId, body, { signal } = {}) {
  return apiClient.patch(`/agency/profile/followers/${followerId}`, body, { signal });
}

export async function removeAgencyFollower(followerId, { signal } = {}) {
  return apiClient.delete(`/agency/profile/followers/${followerId}`, { signal });
}

export async function fetchAgencyConnections({ userId } = {}, { signal } = {}) {
  return apiClient.get('/agency/profile/connections', {
    params: { userId },
    signal,
  });
}

export async function requestAgencyConnection(targetId, { signal } = {}) {
  return apiClient.post('/agency/profile/connections', { targetId }, { signal });
}

export async function respondToAgencyConnection(connectionId, decision, { signal } = {}) {
  return apiClient.post(
    `/agency/profile/connections/${connectionId}/respond`,
    { decision },
    { signal },
  );
}

export async function removeAgencyConnection(connectionId, { signal } = {}) {
  return apiClient.delete(`/agency/profile/connections/${connectionId}`, { signal });
}

export default {
  fetchAgencyDashboard,
  fetchAgencyProfile,
  updateAgencyProfile,
  updateAgencyAvatar,
  listAgencyFollowers,
  updateAgencyFollower,
  removeAgencyFollower,
  fetchAgencyConnections,
  requestAgencyConnection,
  respondToAgencyConnection,
  removeAgencyConnection,
};

