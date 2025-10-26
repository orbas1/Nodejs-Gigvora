import { apiClient } from './apiClient.js';

const BASE_PATH = '/admin/platform/feature-flags';

function ensureKey(flagKey) {
  if (!flagKey || typeof flagKey !== 'string') {
    throw new Error('A feature flag key is required.');
  }
  return flagKey.trim();
}

function buildPath(flagKey) {
  const key = ensureKey(flagKey);
  return `${BASE_PATH}/${encodeURIComponent(key)}`;
}

export async function listFeatureFlags(params = {}, { signal } = {}) {
  return apiClient.get(BASE_PATH, { params, signal });
}

export async function fetchFeatureFlag(flagKey, { signal } = {}) {
  return apiClient.get(buildPath(flagKey), { signal });
}

export async function updateFeatureFlag(flagKey, payload = {}, { signal } = {}) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('A payload object is required to update a feature flag.');
  }
  return apiClient.patch(buildPath(flagKey), payload, { signal });
}

export async function toggleFeatureFlag(flagKey, enabled, { signal } = {}) {
  return updateFeatureFlag(flagKey, { enabled: Boolean(enabled) }, { signal });
}

export default {
  listFeatureFlags,
  fetchFeatureFlag,
  updateFeatureFlag,
  toggleFeatureFlag,
};
