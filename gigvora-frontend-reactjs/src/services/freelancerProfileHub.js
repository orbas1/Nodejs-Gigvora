import apiClient from './apiClient.js';

const CACHE_TTL = 1000 * 60 * 5;

function cacheKey(userId) {
  return `freelancer:profile-hub:${userId}`;
}

function writeCache(userId, data) {
  apiClient.writeCache(cacheKey(userId), data, CACHE_TTL);
}

export async function fetchFreelancerProfileHub(userId, { force = false, signal } = {}) {
  const key = cacheKey(userId);
  if (!force) {
    const cached = apiClient.readCache(key);
    if (cached?.data) {
      return cached.data;
    }
  }

  const data = await apiClient.get(`/freelancers/${userId}/profile-hub`, { signal });
  writeCache(userId, data);
  return data;
}

export async function saveFreelancerProfileHub(userId, payload) {
  const data = await apiClient.put(`/freelancers/${userId}/profile-hub`, payload);
  writeCache(userId, data);
  return data;
}

export async function saveFreelancerExpertiseAreas(userId, items) {
  const data = await apiClient.put(`/freelancers/${userId}/expertise-areas`, { items });
  writeCache(userId, data);
  return data;
}

export async function saveFreelancerSuccessMetrics(userId, items) {
  const data = await apiClient.put(`/freelancers/${userId}/success-metrics`, { items });
  writeCache(userId, data);
  return data;
}

export async function saveFreelancerTestimonials(userId, items) {
  const data = await apiClient.put(`/freelancers/${userId}/testimonials`, { items });
  writeCache(userId, data);
  return data;
}

export async function saveFreelancerHeroBanners(userId, items) {
  const data = await apiClient.put(`/freelancers/${userId}/hero-banners`, { items });
  writeCache(userId, data);
  return data;
}

export default {
  fetchFreelancerProfileHub,
  saveFreelancerProfileHub,
  saveFreelancerExpertiseAreas,
  saveFreelancerSuccessMetrics,
  saveFreelancerTestimonials,
  saveFreelancerHeroBanners,
};
