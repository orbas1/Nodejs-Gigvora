import { apiClient } from './apiClient.js';

export function fetchTwoFactorOverview(params = {}, options = {}) {
  return apiClient.get('/admin/security/two-factor', { params, ...options });
}

export function createTwoFactorPolicy(payload, options = {}) {
  return apiClient.post('/admin/security/two-factor/policies', payload, options);
}

export function updateTwoFactorPolicy(policyId, payload, options = {}) {
  if (!policyId) {
    throw new Error('policyId is required');
  }
  return apiClient.put(`/admin/security/two-factor/policies/${policyId}`, payload, options);
}

export function deleteTwoFactorPolicy(policyId, options = {}) {
  if (!policyId) {
    throw new Error('policyId is required');
  }
  return apiClient.delete(`/admin/security/two-factor/policies/${policyId}`, options);
}

export function issueTwoFactorBypass(payload, options = {}) {
  return apiClient.post('/admin/security/two-factor/bypasses', payload, options);
}

export function updateTwoFactorBypass(bypassId, payload, options = {}) {
  if (!bypassId) {
    throw new Error('bypassId is required');
  }
  return apiClient.patch(`/admin/security/two-factor/bypasses/${bypassId}`, payload, options);
}

export function approveTwoFactorEnrollment(enrollmentId, payload = {}, options = {}) {
  if (!enrollmentId) {
    throw new Error('enrollmentId is required');
  }
  return apiClient.post(`/admin/security/two-factor/enrollments/${enrollmentId}/approve`, payload, options);
}

export function revokeTwoFactorEnrollment(enrollmentId, payload = {}, options = {}) {
  if (!enrollmentId) {
    throw new Error('enrollmentId is required');
  }
  return apiClient.post(`/admin/security/two-factor/enrollments/${enrollmentId}/revoke`, payload, options);
}

export default {
  fetchTwoFactorOverview,
  createTwoFactorPolicy,
  updateTwoFactorPolicy,
  deleteTwoFactorPolicy,
  issueTwoFactorBypass,
  updateTwoFactorBypass,
  approveTwoFactorEnrollment,
  revokeTwoFactorEnrollment,
};
