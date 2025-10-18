import { apiClient } from './apiClient.js';

function buildBasePath(userId) {
  if (!userId) {
    throw new Error('A userId is required for volunteering management operations.');
  }
  return `/users/${userId}/volunteering`;
}

export function fetchVolunteeringManagement(userId, { signal, fresh = false } = {}) {
  const basePath = buildBasePath(userId);
  const path = fresh ? `${basePath}?fresh=true` : basePath;
  return apiClient.get(path, { signal });
}

export function createVolunteerApplication(userId, payload) {
  const basePath = buildBasePath(userId);
  return apiClient.post(`${basePath}/applications`, payload);
}

export function updateVolunteerApplication(userId, applicationId, payload) {
  const basePath = buildBasePath(userId);
  return apiClient.patch(`${basePath}/applications/${applicationId}`, payload);
}

export function createVolunteerResponse(userId, applicationId, payload) {
  const basePath = buildBasePath(userId);
  return apiClient.post(`${basePath}/applications/${applicationId}/responses`, payload);
}

export function updateVolunteerResponse(userId, applicationId, responseId, payload) {
  const basePath = buildBasePath(userId);
  return apiClient.patch(`${basePath}/applications/${applicationId}/responses/${responseId}`, payload);
}

export function deleteVolunteerResponse(userId, applicationId, responseId) {
  const basePath = buildBasePath(userId);
  return apiClient.delete(`${basePath}/applications/${applicationId}/responses/${responseId}`);
}

export function upsertVolunteerContract(userId, applicationId, payload) {
  const basePath = buildBasePath(userId);
  return apiClient.put(`${basePath}/applications/${applicationId}/contract`, payload);
}

export function createVolunteerSpend(userId, applicationId, payload) {
  const basePath = buildBasePath(userId);
  return apiClient.post(`${basePath}/applications/${applicationId}/spend`, payload);
}

export function updateVolunteerSpend(userId, applicationId, spendId, payload) {
  const basePath = buildBasePath(userId);
  return apiClient.patch(`${basePath}/applications/${applicationId}/spend/${spendId}`, payload);
}

export function deleteVolunteerSpend(userId, applicationId, spendId) {
  const basePath = buildBasePath(userId);
  return apiClient.delete(`${basePath}/applications/${applicationId}/spend/${spendId}`);
}

export function createVolunteerReview(userId, applicationId, payload) {
  const basePath = buildBasePath(userId);
  return apiClient.post(`${basePath}/applications/${applicationId}/reviews`, payload);
}

export function updateVolunteerReview(userId, applicationId, reviewId, payload) {
  const basePath = buildBasePath(userId);
  return apiClient.patch(`${basePath}/applications/${applicationId}/reviews/${reviewId}`, payload);
}

export function deleteVolunteerReview(userId, applicationId, reviewId) {
  const basePath = buildBasePath(userId);
  return apiClient.delete(`${basePath}/applications/${applicationId}/reviews/${reviewId}`);
}

export default {
  fetchVolunteeringManagement,
  createVolunteerApplication,
  updateVolunteerApplication,
  createVolunteerResponse,
  updateVolunteerResponse,
  deleteVolunteerResponse,
  upsertVolunteerContract,
  createVolunteerSpend,
  updateVolunteerSpend,
  deleteVolunteerSpend,
  createVolunteerReview,
  updateVolunteerReview,
  deleteVolunteerReview,
};
