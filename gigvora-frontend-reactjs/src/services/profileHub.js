import { apiClient } from './apiClient.js';

export async function fetchProfileHub(userId, { signal, fresh = false } = {}) {
  const params = fresh ? { fresh: 'true' } : undefined;
  return apiClient.get(`/users/${userId}/profile-hub`, { signal, params });
}

export async function updateProfileDetails(userId, payload) {
  return apiClient.put(`/users/${userId}/profile`, payload ?? {});
}

export async function uploadProfileAvatar(userId, { file, avatarUrl, metadata } = {}) {
  if (!file && !avatarUrl) {
    throw new Error('Provide a file or avatarUrl to update the profile picture.');
  }
  const formData = new FormData();
  if (file) {
    formData.append('avatar', file);
  }
  if (avatarUrl) {
    formData.append('avatarUrl', avatarUrl);
  }
  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }
  return apiClient.post(`/users/${userId}/profile/avatar`, formData);
}

export async function listFollowers(userId, { signal, fresh = false } = {}) {
  const params = fresh ? { fresh: 'true' } : undefined;
  return apiClient.get(`/users/${userId}/profile/followers`, { signal, params });
}

export async function saveFollower(userId, payload) {
  const followerId = payload?.followerId;
  const method = followerId ? 'patch' : 'post';
  const path = followerId
    ? `/users/${userId}/profile/followers/${followerId}`
    : `/users/${userId}/profile/followers`;
  if (method === 'patch') {
    return apiClient.patch(path, payload ?? {});
  }
  return apiClient.post(path, payload ?? {});
}

export async function deleteFollower(userId, followerId) {
  return apiClient.delete(`/users/${userId}/profile/followers/${followerId}`);
}

export async function listConnections(userId, { signal } = {}) {
  return apiClient.get(`/users/${userId}/connections`, { signal });
}

export async function updateConnection(userId, connectionId, payload) {
  return apiClient.patch(`/users/${userId}/connections/${connectionId}`, payload ?? {});
}

export default {
  fetchProfileHub,
  updateProfileDetails,
  uploadProfileAvatar,
  listFollowers,
  saveFollower,
  deleteFollower,
  listConnections,
  updateConnection,
};
