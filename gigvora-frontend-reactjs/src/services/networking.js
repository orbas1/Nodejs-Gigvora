import { apiClient } from './apiClient.js';

function ensureId(value, message) {
  if (!value) {
    throw new Error(message);
  }
  return value;
}

function sanitiseParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

export function listNetworkingSessions({
  companyId,
  status,
  upcomingOnly,
  includeMetrics = true,
  lookbackDays,
  signal,
} = {}) {
  const params = sanitiseParams({
    companyId,
    status,
    lookbackDays,
    includeMetrics: includeMetrics ? 'true' : 'false',
    upcomingOnly: upcomingOnly != null ? (upcomingOnly ? 'true' : 'false') : undefined,
  });
  return apiClient.get('/networking/sessions', { params, signal });
}

export function getNetworkingSession(sessionId, { includeAssociations = true, signal } = {}) {
  ensureId(sessionId, 'sessionId is required to fetch a networking session.');
  return apiClient.get(`/networking/sessions/${sessionId}`, {
    params: sanitiseParams({ includeAssociations: includeAssociations ? 'true' : 'false' }),
    signal,
  });
}

export function createNetworkingSession(payload) {
  if (!payload?.name) {
    throw new Error('name is required to create a networking session.');
  }
  return apiClient.post('/networking/sessions', payload);
}

export function updateNetworkingSession(sessionId, payload) {
  ensureId(sessionId, 'sessionId is required to update a networking session.');
  return apiClient.put(`/networking/sessions/${sessionId}`, payload);
}

export function regenerateNetworkingRotations(sessionId, payload) {
  ensureId(sessionId, 'sessionId is required to regenerate networking rotations.');
  return apiClient.post(`/networking/sessions/${sessionId}/rotations/regenerate`, payload);
}

export function registerForNetworkingSession(sessionId, payload) {
  ensureId(sessionId, 'sessionId is required to register for a networking session.');
  if (!payload?.participantId) {
    throw new Error('participantId is required to register for a networking session.');
  }
  return apiClient.post(`/networking/sessions/${sessionId}/signups`, payload);
}

export function updateNetworkingSignup(sessionId, signupId, payload) {
  ensureId(sessionId, 'sessionId is required to update a networking signup.');
  ensureId(signupId, 'signupId is required to update a networking signup.');
  return apiClient.patch(`/networking/sessions/${sessionId}/signups/${signupId}`, payload);
}

export function listNetworkingBusinessCards({ ownerId, companyId, signal } = {}) {
  return apiClient.get('/networking/business-cards', {
    params: sanitiseParams({ ownerId, companyId }),
    signal,
  });
}

export function createNetworkingBusinessCard(payload) {
  if (!payload?.ownerId) {
    throw new Error('ownerId is required to create a networking business card.');
  }
  return apiClient.post('/networking/business-cards', payload);
}

export function updateNetworkingBusinessCard(cardId, payload) {
  ensureId(cardId, 'cardId is required to update a networking business card.');
  return apiClient.put(`/networking/business-cards/${cardId}`, payload);
}

export function getNetworkingSessionRuntime(sessionId, { signal } = {}) {
  ensureId(sessionId, 'sessionId is required to fetch networking runtime details.');
  return apiClient.get(`/networking/sessions/${sessionId}/runtime`, { signal });
}

export default {
  listNetworkingSessions,
  getNetworkingSession,
  createNetworkingSession,
  updateNetworkingSession,
  regenerateNetworkingRotations,
  registerForNetworkingSession,
  updateNetworkingSignup,
  listNetworkingBusinessCards,
  createNetworkingBusinessCard,
  updateNetworkingBusinessCard,
  getNetworkingSessionRuntime,
};
