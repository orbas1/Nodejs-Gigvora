import { apiClient } from './apiClient.js';

function serialiseArray(values) {
  if (!values) return undefined;
  if (Array.isArray(values)) {
    const normalised = values.map((value) => `${value}`.trim()).filter(Boolean);
    return normalised.length ? normalised.join(',') : undefined;
  }
  return `${values}`.trim();
}

function buildQueryParams({ status, hostId, ownerId, workspaceId, from, to, search, page, pageSize } = {}) {
  const params = {};
  const serialisedStatus = serialiseArray(status);
  if (serialisedStatus) params.status = serialisedStatus;
  if (hostId) params.hostId = hostId;
  if (ownerId) params.ownerId = ownerId;
  if (workspaceId) params.workspaceId = workspaceId;
  if (from) params.from = from;
  if (to) params.to = to;
  if (search) params.search = search;
  if (page) params.page = page;
  if (pageSize) params.pageSize = pageSize;
  return params;
}

export async function fetchAdminSpeedNetworkingCatalog({ signal } = {}) {
  return apiClient.get('/admin/speed-networking/catalog', { signal });
}

export async function fetchAdminSpeedNetworkingSessions(filters = {}, { signal } = {}) {
  return apiClient.get('/admin/speed-networking/sessions', {
    params: buildQueryParams(filters),
    signal,
  });
}

export async function fetchAdminSpeedNetworkingSession(sessionId, { signal } = {}) {
  return apiClient.get(`/admin/speed-networking/sessions/${sessionId}`, { signal });
}

export async function createAdminSpeedNetworkingSession(payload) {
  return apiClient.post('/admin/speed-networking/sessions', payload);
}

export async function updateAdminSpeedNetworkingSession(sessionId, payload) {
  return apiClient.patch(`/admin/speed-networking/sessions/${sessionId}`, payload);
}

export async function deleteAdminSpeedNetworkingSession(sessionId) {
  return apiClient.delete(`/admin/speed-networking/sessions/${sessionId}`);
}

export async function createAdminSpeedNetworkingParticipant(sessionId, payload) {
  return apiClient.post(`/admin/speed-networking/sessions/${sessionId}/participants`, payload);
}

export async function updateAdminSpeedNetworkingParticipant(sessionId, participantId, payload) {
  return apiClient.patch(`/admin/speed-networking/sessions/${sessionId}/participants/${participantId}`, payload);
}

export async function deleteAdminSpeedNetworkingParticipant(sessionId, participantId) {
  return apiClient.delete(`/admin/speed-networking/sessions/${sessionId}/participants/${participantId}`);
}

export default {
  fetchAdminSpeedNetworkingCatalog,
  fetchAdminSpeedNetworkingSessions,
  fetchAdminSpeedNetworkingSession,
  createAdminSpeedNetworkingSession,
  updateAdminSpeedNetworkingSession,
  deleteAdminSpeedNetworkingSession,
  createAdminSpeedNetworkingParticipant,
  updateAdminSpeedNetworkingParticipant,
  deleteAdminSpeedNetworkingParticipant,
};
