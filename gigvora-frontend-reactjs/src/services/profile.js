import apiClient from './apiClient.js';

const PROFILE_CACHE_TTL = 1000 * 60 * 5; // five minutes

function cacheKey(userId) {
  return `profiles:overview:${userId}`;
}

export async function fetchProfile(userId, { force = false, signal } = {}) {
  const key = cacheKey(userId);
  if (!force) {
    const cached = apiClient.readCache(key);
    if (cached?.data) {
      return cached.data;
    }
  }

  const profile = await apiClient.get(`/users/${userId}`, { signal });
  apiClient.writeCache(key, profile, PROFILE_CACHE_TTL);
  return profile;
}

export async function updateProfile(userId, payload) {
  const key = cacheKey(userId);
  const profile = await apiClient.patch(`/users/${userId}/profile`, payload);
  apiClient.writeCache(key, profile, PROFILE_CACHE_TTL);
  return profile;
}

export async function updateProfileAvailability(userId, payload) {
  return updateProfile(userId, payload);
}

export default {
  fetchProfile,
  updateProfile,
  updateProfileAvailability,
};
