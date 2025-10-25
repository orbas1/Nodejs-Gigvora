import { apiClient } from './apiClient.js';

function buildBasePath(userId) {
  if (!userId) {
    throw new Error('A userId is required to manage mentoring sessions.');
  }
  return `/users/${userId}/mentoring`;
}

export function fetchMentoringDashboard(userId, { signal, fresh } = {}) {
  const path = `${buildBasePath(userId)}/dashboard`;
  return apiClient.get(path, { params: fresh ? { fresh: 'true' } : undefined, signal });
}

export function createMentoringSession(userId, payload) {
  return apiClient.post(`${buildBasePath(userId)}/sessions`, payload);
}

export function updateMentoringSession(userId, sessionId, payload) {
  return apiClient.patch(`${buildBasePath(userId)}/sessions/${sessionId}`, payload);
}

export function recordMentorshipPurchase(userId, payload) {
  return apiClient.post(`${buildBasePath(userId)}/purchases`, payload);
}

export function updateMentorshipPurchase(userId, orderId, payload) {
  return apiClient.patch(`${buildBasePath(userId)}/purchases/${orderId}`, payload);
}

export function addFavouriteMentor(userId, payload) {
  return apiClient.post(`${buildBasePath(userId)}/favourites`, payload);
}

export function removeFavouriteMentor(userId, mentorId) {
  return apiClient.delete(`${buildBasePath(userId)}/favourites/${mentorId}`);
}

export function submitMentorReview(userId, payload) {
  return apiClient.post(`${buildBasePath(userId)}/reviews`, payload);
}

export function refreshMentorRecommendations(userId) {
  return apiClient.post(`${buildBasePath(userId)}/recommendations/refresh`);
}

export default {
  fetchMentoringDashboard,
  createMentoringSession,
  updateMentoringSession,
  recordMentorshipPurchase,
  updateMentorshipPurchase,
  addFavouriteMentor,
  removeFavouriteMentor,
  submitMentorReview,
  refreshMentorRecommendations,
};
