import { apiClient } from './apiClient.js';

export function listAdminCompanies(params = {}, options = {}) {
  return apiClient.get('/admin/companies', { params, ...options });
}

export function createAdminCompany(payload = {}, options = {}) {
  return apiClient.post('/admin/companies', payload, options);
}

export function getAdminCompany(companyId, options = {}) {
  if (!companyId) {
    throw new Error('companyId is required');
  }
  return apiClient.get(`/admin/companies/${companyId}`, options);
}

export function updateAdminCompany(companyId, payload = {}, options = {}) {
  if (!companyId) {
    throw new Error('companyId is required');
  }
  return apiClient.put(`/admin/companies/${companyId}`, payload, options);
}

export function archiveAdminCompany(companyId, options = {}) {
  if (!companyId) {
    throw new Error('companyId is required');
  }
  return apiClient.delete(`/admin/companies/${companyId}`, options);
}

export default {
  listAdminCompanies,
  createAdminCompany,
  getAdminCompany,
  updateAdminCompany,
  archiveAdminCompany,
};

