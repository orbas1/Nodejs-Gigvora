import { apiClient } from './apiClient.js';

export async function listIdentityVerifications(params = {}, { signal } = {}) {
  return apiClient.get('/agency/id-verifications', { params, signal });
}

export async function fetchIdentityVerificationSummary(params = {}, { signal } = {}) {
  return apiClient.get('/agency/id-verifications/summary', { params, signal });
}

export async function createIdentityVerification(payload, { signal } = {}) {
  return apiClient.post('/agency/id-verifications', payload, { signal });
}

export async function updateIdentityVerification(verificationId, payload, { signal } = {}) {
  return apiClient.patch(`/agency/id-verifications/${verificationId}`, payload, { signal });
}

export async function createIdentityVerificationEvent(verificationId, payload, { signal } = {}) {
  return apiClient.post(`/agency/id-verifications/${verificationId}/events`, payload, { signal });
}

export async function fetchIdentityVerificationSettings(params = {}, { signal } = {}) {
  return apiClient.get('/agency/id-verifications/settings', { params, signal });
}

export async function updateIdentityVerificationSettings(payload, { signal } = {}) {
  return apiClient.patch('/agency/id-verifications/settings', payload, { signal });
}

export default {
  listIdentityVerifications,
  fetchIdentityVerificationSummary,
  createIdentityVerification,
  updateIdentityVerification,
  createIdentityVerificationEvent,
  fetchIdentityVerificationSettings,
  updateIdentityVerificationSettings,
};
