import { apiClient } from './apiClient.js';

export function listAdminAgencies(params = {}, options = {}) {
  return apiClient.get('/admin/agencies', { params, ...options });
}

export function createAdminAgency(payload = {}, options = {}) {
  return apiClient.post('/admin/agencies', payload, options);
}

export function getAdminAgency(agencyId, options = {}) {
  if (!agencyId) {
    throw new Error('agencyId is required');
  }
  return apiClient.get(`/admin/agencies/${agencyId}`, options);
}

export function updateAdminAgency(agencyId, payload = {}, options = {}) {
  if (!agencyId) {
    throw new Error('agencyId is required');
  }
  return apiClient.put(`/admin/agencies/${agencyId}`, payload, options);
}

export function archiveAdminAgency(agencyId, options = {}) {
  if (!agencyId) {
    throw new Error('agencyId is required');
  }
  return apiClient.delete(`/admin/agencies/${agencyId}`, options);
}

export default {
  listAdminAgencies,
  createAdminAgency,
  getAdminAgency,
  updateAdminAgency,
  archiveAdminAgency,
};

