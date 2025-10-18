import { apiClient } from './apiClient.js';

export async function fetchIdentityVerificationOverview(params = {}) {
  return apiClient.get('/admin/verification/identity/overview', { params });
}

export async function fetchIdentityVerifications(params = {}) {
  return apiClient.get('/admin/verification/identity/requests', { params });
}

export async function fetchIdentityVerification(verificationId) {
  if (!verificationId) {
    throw new Error('verificationId is required');
  }
  return apiClient.get(`/admin/verification/identity/requests/${verificationId}`);
}

export async function createIdentityVerification(payload = {}) {
  return apiClient.post('/admin/verification/identity/requests', payload);
}

export async function updateIdentityVerification(verificationId, payload = {}) {
  if (!verificationId) {
    throw new Error('verificationId is required');
  }
  return apiClient.patch(`/admin/verification/identity/requests/${verificationId}`, payload);
}

export async function createIdentityVerificationEvent(verificationId, payload = {}) {
  if (!verificationId) {
    throw new Error('verificationId is required');
  }
  return apiClient.post(`/admin/verification/identity/requests/${verificationId}/events`, payload);
}

export async function fetchIdentityVerificationSettings() {
  return apiClient.get('/admin/verification/identity/settings');
}

export async function updateIdentityVerificationSettings(payload = {}) {
  return apiClient.put('/admin/verification/identity/settings', payload);
}

export default {
  fetchIdentityVerificationOverview,
  fetchIdentityVerifications,
  fetchIdentityVerification,
  createIdentityVerification,
  updateIdentityVerification,
  createIdentityVerificationEvent,
  fetchIdentityVerificationSettings,
  updateIdentityVerificationSettings,
};
