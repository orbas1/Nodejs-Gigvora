import apiClient from './apiClient.js';

export function fetchHuddleContext({ workspaceId, projectId, signal } = {}) {
  const params = {};
  if (workspaceId) {
    params.workspaceId = workspaceId;
  }
  if (projectId) {
    params.projectId = projectId;
  }
  return apiClient.get('/collaboration/huddles/context', { params, signal });
}

export function fetchRecommendedParticipants({ workspaceId, projectId, limit = 6, signal } = {}) {
  const params = { limit };
  if (workspaceId) {
    params.workspaceId = workspaceId;
  }
  if (projectId) {
    params.projectId = projectId;
  }
  return apiClient.get('/collaboration/huddles/recommended-participants', { params, signal });
}

export function createHuddle(payload = {}) {
  return apiClient.post('/collaboration/huddles', payload);
}

export function scheduleHuddle(huddleId, payload = {}) {
  if (!huddleId) {
    throw new Error('huddleId is required to schedule a huddle.');
  }
  return apiClient.post(`/collaboration/huddles/${huddleId}/schedule`, payload);
}

export function requestInstantHuddle(payload = {}) {
  return apiClient.post('/collaboration/huddles/instant', payload);
}

export default {
  fetchHuddleContext,
  fetchRecommendedParticipants,
  createHuddle,
  scheduleHuddle,
  requestInstantHuddle,
};
