import { apiClient } from './apiClient.js';

export function fetchAdminLegalPolicies(params = {}) {
  return apiClient.get('/admin/governance/policies', { params });
}

export function fetchAdminLegalPolicy(slug, params = {}) {
  if (!slug) {
    throw new Error('slug is required to fetch a legal policy.');
  }
  return apiClient.get(`/admin/governance/policies/${slug}`, { params });
}

export function createAdminLegalPolicy(payload) {
  return apiClient.post('/admin/governance/policies', payload);
}

export function updateAdminLegalPolicy(documentId, payload) {
  if (!documentId) {
    throw new Error('documentId is required to update a legal policy.');
  }
  return apiClient.patch(`/admin/governance/policies/${documentId}`, payload);
}

export function createAdminLegalPolicyVersion(documentId, payload) {
  if (!documentId) {
    throw new Error('documentId is required to create a legal policy version.');
  }
  return apiClient.post(`/admin/governance/policies/${documentId}/versions`, payload);
}

export function updateAdminLegalPolicyVersion(documentId, versionId, payload) {
  if (!documentId || !versionId) {
    throw new Error('documentId and versionId are required to update a version.');
  }
  return apiClient.patch(`/admin/governance/policies/${documentId}/versions/${versionId}`, payload);
}

export function publishAdminLegalPolicyVersion(documentId, versionId, payload = {}) {
  if (!documentId || !versionId) {
    throw new Error('documentId and versionId are required to publish a version.');
  }
  return apiClient.post(`/admin/governance/policies/${documentId}/versions/${versionId}/publish`, payload);
}

export function activateAdminLegalPolicyVersion(documentId, versionId) {
  if (!documentId || !versionId) {
    throw new Error('documentId and versionId are required to activate a version.');
  }
  return apiClient.post(`/admin/governance/policies/${documentId}/versions/${versionId}/activate`);
}

export function archiveAdminLegalPolicyVersion(documentId, versionId, payload = {}) {
  if (!documentId || !versionId) {
    throw new Error('documentId and versionId are required to archive a version.');
  }
  return apiClient.post(`/admin/governance/policies/${documentId}/versions/${versionId}/archive`, payload);
}

export default {
  fetchAdminLegalPolicies,
  fetchAdminLegalPolicy,
  createAdminLegalPolicy,
  updateAdminLegalPolicy,
  createAdminLegalPolicyVersion,
  updateAdminLegalPolicyVersion,
  publishAdminLegalPolicyVersion,
  activateAdminLegalPolicyVersion,
  archiveAdminLegalPolicyVersion,
};
