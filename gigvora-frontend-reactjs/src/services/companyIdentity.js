import { apiClient } from './apiClient.js';

export async function fetchIdentityVerifications(params = {}, options = {}) {
  return apiClient.get('/company/id-verifications', { params, ...options });
}

export async function fetchIdentityVerificationDetail(verificationId, params = {}, options = {}) {
  return apiClient.get(`/company/id-verifications/${verificationId}`, { params, ...options });
}

export async function createIdentityVerification(payload, options = {}) {
  return apiClient.post('/company/id-verifications', payload, options);
}

export async function updateIdentityVerification(verificationId, payload, options = {}) {
  return apiClient.patch(`/company/id-verifications/${verificationId}`, payload, options);
}

export default {
  fetchIdentityVerifications,
  fetchIdentityVerificationDetail,
  createIdentityVerification,
  updateIdentityVerification,
};
