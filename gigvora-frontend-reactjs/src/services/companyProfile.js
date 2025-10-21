import { apiClient } from './apiClient.js';

function ensureId(value, message) {
  if (value === undefined || value === null || `${value}`.trim().length === 0) {
    throw new Error(message);
  }
  return typeof value === 'string' ? value.trim() : value;
}

export function fetchCompanyProfileWorkspace({ signal } = {}) {
  return apiClient.get('/company/profile/workspace', { signal });
}

export function updateCompanyProfile(payload = {}, { signal } = {}) {
  return apiClient.put('/company/profile', payload, { signal });
}

export function updateCompanyAvatar(payload = {}, { signal } = {}) {
  return apiClient.patch('/company/profile/avatar', payload, { signal });
}

export function listCompanyFollowers({ signal } = {}) {
  return apiClient.get('/company/profile/followers', { signal });
}

export function addCompanyFollower(payload = {}, { signal } = {}) {
  return apiClient.post('/company/profile/followers', payload, { signal });
}

export function updateCompanyFollower(followerId, payload = {}, { signal } = {}) {
  const resolvedFollowerId = ensureId(followerId, 'followerId is required to update a follower.');
  return apiClient.patch(`/company/profile/followers/${resolvedFollowerId}`, payload, { signal });
}

export function removeCompanyFollower(followerId, { signal } = {}) {
  const resolvedFollowerId = ensureId(followerId, 'followerId is required to remove a follower.');
  return apiClient.delete(`/company/profile/followers/${resolvedFollowerId}`, { signal });
}

export function listCompanyConnections({ signal } = {}) {
  return apiClient.get('/company/profile/connections', { signal });
}

export function createCompanyConnection(payload = {}, { signal } = {}) {
  return apiClient.post('/company/profile/connections', payload, { signal });
}

export function updateCompanyConnection(connectionId, payload = {}, { signal } = {}) {
  const resolvedConnectionId = ensureId(connectionId, 'connectionId is required to update a connection.');
  return apiClient.patch(`/company/profile/connections/${resolvedConnectionId}`, payload, { signal });
}

export function removeCompanyConnection(connectionId, { signal } = {}) {
  const resolvedConnectionId = ensureId(connectionId, 'connectionId is required to remove a connection.');
  return apiClient.delete(`/company/profile/connections/${resolvedConnectionId}`, { signal });
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
