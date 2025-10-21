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

export default {
  fetchUserAiSettings,
  updateUserAiSettings,
};
