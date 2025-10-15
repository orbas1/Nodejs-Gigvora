import { apiClient } from './apiClient.js';

export async function fetchAdminConsentPolicies(params = {}) {
  return apiClient.get('/admin/governance/consents', { params });
}

export async function fetchConsentPolicy(policyCode) {
  if (!policyCode) {
    throw new Error('policyCode is required');
  }
  return apiClient.get(`/admin/governance/consents/${policyCode}`);
}

export async function createConsentPolicy(payload) {
  return apiClient.post('/admin/governance/consents', payload);
}

export async function updateConsentPolicy(policyId, payload) {
  return apiClient.patch(`/admin/governance/consents/${policyId}`, payload);
}

export async function createConsentPolicyVersion(policyId, payload) {
  return apiClient.post(`/admin/governance/consents/${policyId}/versions`, payload);
}

export async function deleteConsentPolicy(policyId) {
  return apiClient.delete(`/admin/governance/consents/${policyId}`);
}

export async function fetchUserConsentSnapshot(userId, params = {}) {
  if (!userId) {
    throw new Error('userId is required to load consent snapshot');
  }
  return apiClient.get(`/users/${userId}/consents`, { params });
}

export async function updateUserConsent(userId, policyCode, payload) {
  if (!userId || !policyCode) {
    throw new Error('userId and policyCode are required to update consent');
  }
  return apiClient.put(`/users/${userId}/consents/${policyCode}`, payload);
}

export default {
  fetchAdminConsentPolicies,
  fetchConsentPolicy,
  createConsentPolicy,
  updateConsentPolicy,
  createConsentPolicyVersion,
  deleteConsentPolicy,
  fetchUserConsentSnapshot,
  updateUserConsent,
};
