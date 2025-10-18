import { apiClient } from './apiClient.js';

function serialiseStatus(status) {
  if (!status) {
    return undefined;
  }
  if (Array.isArray(status)) {
    const filtered = status.map((entry) => `${entry}`.trim()).filter(Boolean);
    return filtered.length ? filtered.join(',') : undefined;
  }
  return `${status}`.trim();
}

function buildQueryParams({
  status,
  mentorId,
  menteeId,
  serviceLineId,
  ownerId,
  from,
  to,
  search,
  page,
  pageSize,
  sort,
} = {}) {
  const params = {};
  const serialisedStatus = serialiseStatus(status);
  if (serialisedStatus) {
    params.status = serialisedStatus;
  }
  if (mentorId) params.mentorId = mentorId;
  if (menteeId) params.menteeId = menteeId;
  if (serviceLineId) params.serviceLineId = serviceLineId;
  if (ownerId) params.ownerId = ownerId;
  if (from) params.from = from;
  if (to) params.to = to;
  if (search) params.search = search;
  if (page) params.page = page;
  if (pageSize) params.pageSize = pageSize;
  if (sort) params.sort = sort;
  return params;
}

export async function fetchAdminMentoringCatalog({ signal } = {}) {
  return apiClient.get('/admin/mentoring/catalog', { signal });
}

export async function fetchAdminMentoringSessions(filters = {}, { signal } = {}) {
  return apiClient.get('/admin/mentoring/sessions', {
    params: buildQueryParams(filters),
    signal,
  });
}

export async function createAdminMentoringSession(payload) {
  return apiClient.post('/admin/mentoring/sessions', payload);
}

export async function updateAdminMentoringSession(sessionId, payload) {
  return apiClient.patch(`/admin/mentoring/sessions/${sessionId}`, payload);
}

export async function createAdminMentoringNote(sessionId, payload) {
  return apiClient.post(`/admin/mentoring/sessions/${sessionId}/notes`, payload);
}

export async function updateAdminMentoringNote(sessionId, noteId, payload) {
  return apiClient.patch(`/admin/mentoring/sessions/${sessionId}/notes/${noteId}`, payload);
}

export async function deleteAdminMentoringNote(sessionId, noteId) {
  return apiClient.delete(`/admin/mentoring/sessions/${sessionId}/notes/${noteId}`);
}

export async function createAdminMentoringAction(sessionId, payload) {
  return apiClient.post(`/admin/mentoring/sessions/${sessionId}/actions`, payload);
}

export async function updateAdminMentoringAction(sessionId, actionId, payload) {
  return apiClient.patch(`/admin/mentoring/sessions/${sessionId}/actions/${actionId}`, payload);
}

export async function deleteAdminMentoringAction(sessionId, actionId) {
  return apiClient.delete(`/admin/mentoring/sessions/${sessionId}/actions/${actionId}`);
}

export default {
  fetchAdminMentoringCatalog,
  fetchAdminMentoringSessions,
  createAdminMentoringSession,
  updateAdminMentoringSession,
  createAdminMentoringNote,
  updateAdminMentoringNote,
  deleteAdminMentoringNote,
  createAdminMentoringAction,
  updateAdminMentoringAction,
  deleteAdminMentoringAction,
};
