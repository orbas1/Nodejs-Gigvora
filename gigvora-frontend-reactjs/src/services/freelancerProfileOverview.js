import apiClient from './apiClient.js';

const CACHE_TTL = 1000 * 60 * 3;

function cacheKey(userId) {
  return `freelancer:profile-overview:${userId}`;
}

function writeCache(userId, data) {
  apiClient.writeCache(cacheKey(userId), data, CACHE_TTL);
}

export async function fetchFreelancerProfileOverview(userId, { signal, fresh = false } = {}) {
  if (!userId) {
    throw new Error('userId is required to load the freelancer profile overview.');
  }
  const key = cacheKey(userId);
  if (!fresh) {
    const cached = apiClient.readCache(key);
    if (cached?.data) {
      return cached.data;
    }
  }
  const params = fresh ? { fresh: 'true' } : undefined;
  const data = await apiClient.get(`/freelancers/${userId}/profile-overview`, { signal, params });
  writeCache(userId, data);
  return data;
}

export async function saveFreelancerProfileOverview(userId, payload) {
  if (!userId) {
    throw new Error('userId is required to update the freelancer profile overview.');
  }
  const data = await apiClient.put(`/freelancers/${userId}/profile-overview`, payload);
  writeCache(userId, data);
  return data;
}

export async function uploadFreelancerAvatar(userId, file) {
  if (!userId) {
    throw new Error('userId is required to upload an avatar.');
  }
  if (!(file instanceof File)) {
    throw new Error('A valid File instance must be provided for the avatar upload.');
  }
  const formData = new FormData();
  formData.append('avatar', file);
  const data = await apiClient.post(`/freelancers/${userId}/profile-avatar`, formData);
  writeCache(userId, data);
  return data;
}

export async function createFreelancerConnection(userId, payload) {
  const data = await apiClient.post(`/freelancers/${userId}/connections`, payload);
  writeCache(userId, data);
  return data;
}

export async function updateFreelancerConnection(userId, connectionId, payload) {
  const data = await apiClient.patch(`/freelancers/${userId}/connections/${connectionId}`, payload);
  writeCache(userId, data);
  return data;
}

export async function deleteFreelancerConnection(userId, connectionId) {
  const data = await apiClient.delete(`/freelancers/${userId}/connections/${connectionId}`);
  writeCache(userId, data);
  return data;
}

export default {
  fetchFreelancerProfileOverview,
  saveFreelancerProfileOverview,
  uploadFreelancerAvatar,
  createFreelancerConnection,
  updateFreelancerConnection,
  deleteFreelancerConnection,
};
