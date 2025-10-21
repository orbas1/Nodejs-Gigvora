import apiClient from './apiClient.js';

function buildCacheKey(workspaceId) {
  return `workspace:experience-settings:${workspaceId}`;
}

export async function fetchWorkspaceExperienceSettings(workspaceId, { signal, fresh = false } = {}) {
  if (!workspaceId) {
    throw new Error('Workspace identifier is required to load settings.');
  }
  const params = fresh ? { fresh: 'true' } : undefined;
  return apiClient.get(`/workspaces/${workspaceId}/experience-settings`, { signal, params });
}

export async function updateWorkspaceExperienceSettings(workspaceId, payload = {}) {
  if (!workspaceId) {
    throw new Error('Workspace identifier is required to update settings.');
  }
  const data = await apiClient.put(`/workspaces/${workspaceId}/experience-settings`, payload);
  apiClient.removeCache(buildCacheKey(workspaceId));
  return data;
}

export async function toggleWorkspaceFeature(workspaceId, featureId, enabled) {
  if (!workspaceId || !featureId) {
    throw new Error('Workspace and feature identifiers are required to toggle features.');
  }
  const data = await apiClient.post(`/workspaces/${workspaceId}/experience-settings/features/${featureId}`, {
    enabled: Boolean(enabled),
  });
  apiClient.removeCache(buildCacheKey(workspaceId));
  return data;
}

export default {
  fetchWorkspaceExperienceSettings,
  updateWorkspaceExperienceSettings,
  toggleWorkspaceFeature,
};
