import { apiClient } from './apiClient.js';

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && `${value}`.length > 0)
      .map(([key, value]) => [key, value]),
  );
}

export function fetchAgencyMentoringOverview(params = {}, { signal } = {}) {
  return apiClient.get('/agency/mentoring/overview', { params: cleanParams(params), signal });
}

export function listAgencyMentoringSessions(params = {}, { signal } = {}) {
  return apiClient.get('/agency/mentoring/sessions', { params: cleanParams(params), signal });
}

export function createAgencyMentoringSession(payload, { signal } = {}) {
  return apiClient.post('/agency/mentoring/sessions', payload, { signal });
}

export function updateAgencyMentoringSession(sessionId, payload, { signal } = {}) {
  return apiClient.patch(`/agency/mentoring/sessions/${sessionId}`, payload, { signal });
}

export function deleteAgencyMentoringSession(sessionId, params = {}, { signal } = {}) {
  return apiClient.delete(`/agency/mentoring/sessions/${sessionId}`, { params: cleanParams(params), signal });
}

export function listAgencyMentoringPurchases(params = {}, { signal } = {}) {
  return apiClient.get('/agency/mentoring/purchases', { params: cleanParams(params), signal });
}

export function createAgencyMentoringPurchase(payload, { signal } = {}) {
  return apiClient.post('/agency/mentoring/purchases', payload, { signal });
}

export function updateAgencyMentoringPurchase(purchaseId, payload, { signal } = {}) {
  return apiClient.patch(`/agency/mentoring/purchases/${purchaseId}`, payload, { signal });
}

export function deleteAgencyMentoringPurchase(purchaseId, params = {}, { signal } = {}) {
  return apiClient.delete(`/agency/mentoring/purchases/${purchaseId}`, { params: cleanParams(params), signal });
}

export function listAgencyMentorFavourites(params = {}, { signal } = {}) {
  return apiClient.get('/agency/mentoring/favourites', { params: cleanParams(params), signal });
}

export function createAgencyMentorPreference(payload, { signal } = {}) {
  return apiClient.post('/agency/mentoring/favourites', payload, { signal });
}

export function updateAgencyMentorPreference(preferenceId, payload, { signal } = {}) {
  return apiClient.patch(`/agency/mentoring/favourites/${preferenceId}`, payload, { signal });
}

export function deleteAgencyMentorPreference(preferenceId, params = {}, { signal } = {}) {
  return apiClient.delete(`/agency/mentoring/favourites/${preferenceId}`, { params: cleanParams(params), signal });
}

export function listAgencySuggestedMentors(params = {}, { signal } = {}) {
  return apiClient.get('/agency/mentoring/suggestions', { params: cleanParams(params), signal });
}

export default {
  fetchAgencyMentoringOverview,
  listAgencyMentoringSessions,
  createAgencyMentoringSession,
  updateAgencyMentoringSession,
  deleteAgencyMentoringSession,
  listAgencyMentoringPurchases,
  createAgencyMentoringPurchase,
  updateAgencyMentoringPurchase,
  deleteAgencyMentoringPurchase,
  listAgencyMentorFavourites,
  createAgencyMentorPreference,
  updateAgencyMentorPreference,
  deleteAgencyMentorPreference,
  listAgencySuggestedMentors,
};
