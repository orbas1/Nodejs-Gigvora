import { apiClient } from './apiClient.js';

function ensureUserId(userId) {
  if (!userId) {
    throw new Error('A userId is required to manage security preferences.');
  }
  return userId;
}

function ensurePayload(payload) {
  if (payload == null || typeof payload !== 'object') {
    throw new Error('Payload must be an object.');
  }
  return payload;
}

export async function fetchSecurityPreferences(userId, { signal } = {}) {
  const id = ensureUserId(userId);
  return apiClient.get(`/users/${id}/security-preferences`, { signal });
}

export async function updateSecurityPreferences(userId, payload, { signal } = {}) {
  const id = ensureUserId(userId);
  const body = ensurePayload(payload);
  return apiClient.put(`/users/${id}/security-preferences`, body, { signal });
}

export default {
  fetchSecurityPreferences,
  updateSecurityPreferences,
};
