import { apiClient } from './apiClient.js';

export function fetchCompanyProfileWorkspace({ signal } = {}) {
  return apiClient.get('/company/profile/workspace', { signal });
}

export function updateCompanyProfile(payload) {
  return apiClient.put('/company/profile', payload ?? {});
}

export function updateCompanyAvatar(payload) {
  return apiClient.patch('/company/profile/avatar', payload ?? {});
}

export function listCompanyFollowers({ signal } = {}) {
  return apiClient.get('/company/profile/followers', { signal });
}

export function addCompanyFollower(payload) {
  return apiClient.post('/company/profile/followers', payload ?? {});
}

export function updateCompanyFollower(followerId, payload) {
  return apiClient.patch(`/company/profile/followers/${followerId}`, payload ?? {});
}

export function removeCompanyFollower(followerId) {
  return apiClient.delete(`/company/profile/followers/${followerId}`);
}

export function listCompanyConnections({ signal } = {}) {
  return apiClient.get('/company/profile/connections', { signal });
}

export function createCompanyConnection(payload) {
  return apiClient.post('/company/profile/connections', payload ?? {});
}

export function updateCompanyConnection(connectionId, payload) {
  return apiClient.patch(`/company/profile/connections/${connectionId}`, payload ?? {});
}

export function removeCompanyConnection(connectionId) {
  return apiClient.delete(`/company/profile/connections/${connectionId}`);
}

export default {
  fetchCompanyProfileWorkspace,
  updateCompanyProfile,
  updateCompanyAvatar,
  listCompanyFollowers,
  addCompanyFollower,
  updateCompanyFollower,
  removeCompanyFollower,
  listCompanyConnections,
  createCompanyConnection,
  updateCompanyConnection,
  removeCompanyConnection,
};
