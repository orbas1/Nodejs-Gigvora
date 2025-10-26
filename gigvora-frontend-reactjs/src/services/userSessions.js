import apiClient from './apiClient.js';

function ensureUserId(userId) {
  if (userId === null || userId === undefined) {
    throw new Error('userId is required to manage sessions.');
  }
  const normalised = `${userId}`.trim();
  if (!normalised) {
    throw new Error('userId is required to manage sessions.');
  }
  return normalised;
}

export async function listUserSessions(userId, { signal } = {}) {
  const id = ensureUserId(userId);
  return apiClient.get(`/users/${id}/sessions`, { signal });
}

export async function revokeUserSession(userId, sessionId, { reason, signal } = {}) {
  const id = ensureUserId(userId);
  const sessionKey = `${sessionId}`.trim();
  if (!sessionKey) {
    throw new Error('sessionId is required to revoke a session.');
  }
  const payload = {};
  if (reason && `${reason}`.trim()) {
    payload.reason = `${reason}`.trim();
  }
  return apiClient.post(`/users/${id}/sessions/${sessionKey}/revoke`, payload, { signal });
}

export default {
  listUserSessions,
  revokeUserSession,
};
