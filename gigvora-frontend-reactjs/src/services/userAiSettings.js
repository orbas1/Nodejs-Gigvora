import { apiClient } from './apiClient.js';

function ensureUserId(userId) {
  if (!userId) {
    throw new Error('A userId is required to manage AI settings.');
  }
  return userId;
}

export async function fetchUserAiSettings(userId, { signal } = {}) {
  const id = ensureUserId(userId);
  return apiClient.get(`/users/${id}/ai-settings`, { signal });
}

export async function updateUserAiSettings(userId, payload, { signal } = {}) {
  const id = ensureUserId(userId);
  if (payload == null || typeof payload !== 'object') {
    throw new Error('Payload must be an object when updating AI settings.');
  }
  return apiClient.put(`/users/${id}/ai-settings`, payload, { signal });
}

export async function testUserAiSettingsConnection(userId, payload = {}, { signal } = {}) {
  const id = ensureUserId(userId);
  try {
    return await apiClient.post(`/users/${id}/ai-settings/test`, payload, { signal });
  } catch (error) {
    const status = error?.response?.status;
    if (status === 404 || status === 501) {
      const message =
        error?.response?.data?.message ??
        'AI concierge connection testing is not yet available on this environment. Please contact your administrator to enable it.';
      const unavailableError = new Error(message);
      unavailableError.code = 'AI_TEST_UNAVAILABLE';
      throw unavailableError;
    }
    throw error;
  }
}

export default {
  fetchUserAiSettings,
  updateUserAiSettings,
  testUserAiSettingsConnection,
};
