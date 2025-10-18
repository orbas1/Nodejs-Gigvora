import { apiClient } from './apiClient.js';

export async function fetchDirectory(params = {}) {
  return apiClient.get('/admin/users', { params });
}

export async function fetchMetadata() {
  return apiClient.get('/admin/users/meta');
}

export async function fetchUser(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }
  return apiClient.get(`/admin/users/${userId}`);
}

export async function createUser(payload) {
  return apiClient.post('/admin/users', payload);
}

export async function updateUser(userId, payload) {
  if (!userId) {
    throw new Error('userId is required');
  }
  return apiClient.patch(`/admin/users/${userId}`, payload);
}

export async function updateSecurity(userId, payload) {
  if (!userId) {
    throw new Error('userId is required');
  }
  return apiClient.patch(`/admin/users/${userId}/security`, payload);
}

export async function updateStatus(userId, payload) {
  if (!userId) {
    throw new Error('userId is required');
  }
  return apiClient.patch(`/admin/users/${userId}/status`, payload);
}

export async function updateRoles(userId, roles) {
  if (!userId) {
    throw new Error('userId is required');
  }
  return apiClient.put(`/admin/users/${userId}/roles`, { roles });
}

export async function removeRole(userId, role) {
  if (!userId || !role) {
    throw new Error('userId and role are required');
  }
  return apiClient.delete(`/admin/users/${userId}/roles/${encodeURIComponent(role)}`);
}

export async function resetPassword(userId, payload = {}) {
  if (!userId) {
    throw new Error('userId is required');
  }
  return apiClient.post(`/admin/users/${userId}/reset-password`, payload);
}

export async function createNote(userId, payload) {
  if (!userId) {
    throw new Error('userId is required');
  }
  return apiClient.post(`/admin/users/${userId}/notes`, payload);
}

export default {
  fetchDirectory,
  fetchMetadata,
  fetchUser,
  createUser,
  updateUser,
  updateSecurity,
  updateStatus,
  updateRoles,
  removeRole,
  resetPassword,
  createNote,
};

