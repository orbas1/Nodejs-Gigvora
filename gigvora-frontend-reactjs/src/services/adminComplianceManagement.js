import apiClient from './apiClient.js';

export async function fetchComplianceOverview(options = {}) {
  return apiClient.get('/admin/compliance', options);
}

export async function createComplianceFramework(payload) {
  return apiClient.post('/admin/compliance/frameworks', payload);
}

export async function updateComplianceFramework(frameworkId, payload) {
  if (!frameworkId) {
    throw new Error('frameworkId is required to update a compliance framework.');
  }
  return apiClient.put(`/admin/compliance/frameworks/${frameworkId}`, payload);
}

export async function deleteComplianceFramework(frameworkId) {
  if (!frameworkId) {
    throw new Error('frameworkId is required to delete a compliance framework.');
  }
  return apiClient.delete(`/admin/compliance/frameworks/${frameworkId}`);
}

export async function createComplianceAudit(payload) {
  return apiClient.post('/admin/compliance/audits', payload);
}

export async function updateComplianceAudit(auditId, payload) {
  if (!auditId) {
    throw new Error('auditId is required to update a compliance audit.');
  }
  return apiClient.put(`/admin/compliance/audits/${auditId}`, payload);
}

export async function deleteComplianceAudit(auditId) {
  if (!auditId) {
    throw new Error('auditId is required to delete a compliance audit.');
  }
  return apiClient.delete(`/admin/compliance/audits/${auditId}`);
}

export async function createComplianceObligation(payload) {
  return apiClient.post('/admin/compliance/obligations', payload);
}

export async function updateComplianceObligation(obligationId, payload) {
  if (!obligationId) {
    throw new Error('obligationId is required to update a compliance obligation.');
  }
  return apiClient.put(`/admin/compliance/obligations/${obligationId}`, payload);
}

export async function deleteComplianceObligation(obligationId) {
  if (!obligationId) {
    throw new Error('obligationId is required to delete a compliance obligation.');
  }
  return apiClient.delete(`/admin/compliance/obligations/${obligationId}`);
}

export async function logComplianceEvidence(obligationId, payload) {
  if (!obligationId) {
    throw new Error('obligationId is required to attach evidence.');
  }
  return apiClient.post(`/admin/compliance/obligations/${obligationId}/evidence`, payload);
}

export default {
  fetchComplianceOverview,
  createComplianceFramework,
  updateComplianceFramework,
  deleteComplianceFramework,
  createComplianceAudit,
  updateComplianceAudit,
  deleteComplianceAudit,
  createComplianceObligation,
  updateComplianceObligation,
  deleteComplianceObligation,
  logComplianceEvidence,
};
