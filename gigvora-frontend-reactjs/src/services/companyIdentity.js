import { apiClient } from './apiClient.js';

function ensureId(value, message) {
  if (value === undefined || value === null || `${value}`.trim().length === 0) {
    throw new Error(message);
  }
  return typeof value === 'string' ? value.trim() : value;
}

export async function fetchIdentityVerifications(params = {}, options = {}) {
  return apiClient.get('/company/id-verifications', { params, ...options });
}

export async function fetchIdentityVerificationDetail(verificationId, params = {}, options = {}) {
  const resolvedId = ensureId(verificationId, 'verificationId is required.');
  return apiClient.get(`/company/id-verifications/${resolvedId}`, { params, ...options });
}

export async function createIdentityVerification(payload = {}, options = {}) {
  return apiClient.post('/company/id-verifications', payload, options);
}

export async function updateIdentityVerification(verificationId, payload = {}, options = {}) {
  const resolvedId = ensureId(verificationId, 'verificationId is required.');
  return apiClient.patch(`/company/id-verifications/${resolvedId}`, payload, options);
}

export default {
  fetchIdentityVerifications,
  fetchIdentityVerificationDetail,
  createIdentityVerification,
  updateIdentityVerification,
};
