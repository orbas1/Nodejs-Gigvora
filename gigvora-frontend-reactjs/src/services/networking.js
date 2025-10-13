import { apiClient } from './apiClient.js';

export function listNetworkingSessions({ companyId, status, upcomingOnly, includeMetrics = true, lookbackDays, signal } = {}) {
  const params = {};
  if (companyId != null) params.companyId = companyId;
  if (status) params.status = status;
  if (upcomingOnly != null) params.upcomingOnly = upcomingOnly;
  if (includeMetrics != null) params.includeMetrics = includeMetrics;
  if (lookbackDays != null) params.lookbackDays = lookbackDays;
  return apiClient.get('/networking/sessions', { params, signal });
}

export function getNetworkingSession(sessionId, { includeAssociations = true, signal } = {}) {
  return apiClient.get(`/networking/sessions/${sessionId}`, {
    params: { includeAssociations },
    signal,
  });
}

export function createNetworkingSession(payload) {
  return apiClient.post('/networking/sessions', payload);
}

export function updateNetworkingSession(sessionId, payload) {
  return apiClient.put(`/networking/sessions/${sessionId}`, payload);
}

export function regenerateNetworkingRotations(sessionId, payload) {
  return apiClient.post(`/networking/sessions/${sessionId}/rotations/regenerate`, payload);
}

export function registerForNetworkingSession(sessionId, payload) {
  return apiClient.post(`/networking/sessions/${sessionId}/signups`, payload);
}

export function updateNetworkingSignup(sessionId, signupId, payload) {
  return apiClient.patch(`/networking/sessions/${sessionId}/signups/${signupId}`, payload);
}

export function listNetworkingBusinessCards({ ownerId, companyId, signal } = {}) {
  const params = {};
  if (ownerId != null) params.ownerId = ownerId;
  if (companyId != null) params.companyId = companyId;
  return apiClient.get('/networking/business-cards', { params, signal });
}

export function createNetworkingBusinessCard(payload) {
  return apiClient.post('/networking/business-cards', payload);
}

export function updateNetworkingBusinessCard(cardId, payload) {
  return apiClient.put(`/networking/business-cards/${cardId}`, payload);
}

export function getNetworkingSessionRuntime(sessionId, { signal } = {}) {
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
