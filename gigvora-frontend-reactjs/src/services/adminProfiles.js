import { apiClient } from './apiClient.js';

export async function fetchAdminProfiles(params = {}, options = {}) {
  const config = { params, ...options };
  return apiClient.get('/admin/profiles', config);
}

export async function createAdminProfile(payload, options = {}) {
  return apiClient.post('/admin/profiles', payload, options);
}

export async function fetchAdminProfile(profileId, options = {}) {
  if (!profileId) {
    throw new Error('profileId is required');
  }
  return apiClient.get(`/admin/profiles/${profileId}`, options);
}

export async function updateAdminProfile(profileId, payload, options = {}) {
  if (!profileId) {
    throw new Error('profileId is required');
  }
  return apiClient.put(`/admin/profiles/${profileId}`, payload, options);
}

export async function createAdminProfileReference(profileId, payload, options = {}) {
  if (!profileId) {
    throw new Error('profileId is required');
  }
  return apiClient.post(`/admin/profiles/${profileId}/references`, payload, options);
}

export async function updateAdminProfileReference(profileId, referenceId, payload, options = {}) {
  if (!profileId) {
    throw new Error('profileId is required');
  }
  if (!referenceId) {
    throw new Error('referenceId is required');
  }
  return apiClient.put(`/admin/profiles/${profileId}/references/${referenceId}`, payload, options);
}

export async function deleteAdminProfileReference(profileId, referenceId, options = {}) {
  if (!profileId) {
    throw new Error('profileId is required');
  }
  if (!referenceId) {
    throw new Error('referenceId is required');
  }
  return apiClient.delete(`/admin/profiles/${profileId}/references/${referenceId}`, options);
}

export async function createAdminProfileNote(profileId, payload, options = {}) {
  if (!profileId) {
    throw new Error('profileId is required');
  }
  return apiClient.post(`/admin/profiles/${profileId}/notes`, payload, options);
}

export async function updateAdminProfileNote(profileId, noteId, payload, options = {}) {
  if (!profileId) {
    throw new Error('profileId is required');
  }
  if (!noteId) {
    throw new Error('noteId is required');
  }
  return apiClient.put(`/admin/profiles/${profileId}/notes/${noteId}`, payload, options);
}

export async function deleteAdminProfileNote(profileId, noteId, options = {}) {
  if (!profileId) {
    throw new Error('profileId is required');
  }
  if (!noteId) {
    throw new Error('noteId is required');
  }
  return apiClient.delete(`/admin/profiles/${profileId}/notes/${noteId}`, options);
}

export default {
  fetchAdminProfiles,
  fetchAdminProfile,
  createAdminProfile,
  updateAdminProfile,
  createAdminProfileReference,
  updateAdminProfileReference,
  deleteAdminProfileReference,
  createAdminProfileNote,
  updateAdminProfileNote,
  deleteAdminProfileNote,
};
