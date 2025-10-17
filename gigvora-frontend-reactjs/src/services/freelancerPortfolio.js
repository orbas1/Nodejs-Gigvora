import apiClient from './apiClient.js';

function buildCacheKey(userId) {
  return `freelancer:portfolio:${userId}`;
}

export async function fetchFreelancerPortfolio(userId, { signal, fresh = false } = {}) {
  if (!userId) {
    throw new Error('Freelancer identifier is required to load portfolio data.');
  }
  const params = fresh ? { fresh: 'true' } : undefined;
  return apiClient.get(`/freelancers/${userId}/portfolio`, { signal, params });
}

export async function createFreelancerPortfolioItem(userId, payload) {
  const data = await apiClient.post(`/freelancers/${userId}/portfolio`, payload);
  apiClient.removeCache(buildCacheKey(userId));
  return data;
}

export async function updateFreelancerPortfolioItem(userId, portfolioId, payload) {
  const data = await apiClient.put(`/freelancers/${userId}/portfolio/${portfolioId}`, payload);
  apiClient.removeCache(buildCacheKey(userId));
  return data;
}

export async function deleteFreelancerPortfolioItem(userId, portfolioId) {
  await apiClient.delete(`/freelancers/${userId}/portfolio/${portfolioId}`);
  apiClient.removeCache(buildCacheKey(userId));
}

export async function createFreelancerPortfolioAsset(userId, portfolioId, payload) {
  const data = await apiClient.post(`/freelancers/${userId}/portfolio/${portfolioId}/assets`, payload);
  apiClient.removeCache(buildCacheKey(userId));
  return data;
}

export async function updateFreelancerPortfolioAsset(userId, portfolioId, assetId, payload) {
  const data = await apiClient.put(`/freelancers/${userId}/portfolio/${portfolioId}/assets/${assetId}`, payload);
  apiClient.removeCache(buildCacheKey(userId));
  return data;
}

export async function deleteFreelancerPortfolioAsset(userId, portfolioId, assetId) {
  await apiClient.delete(`/freelancers/${userId}/portfolio/${portfolioId}/assets/${assetId}`);
  apiClient.removeCache(buildCacheKey(userId));
}

export async function updateFreelancerPortfolioSettings(userId, payload) {
  const data = await apiClient.put(`/freelancers/${userId}/portfolio-settings`, payload);
  apiClient.removeCache(buildCacheKey(userId));
  return data;
}

export function invalidateFreelancerPortfolioCache(userId) {
  apiClient.removeCache(buildCacheKey(userId));
}

export default {
  fetchFreelancerPortfolio,
  createFreelancerPortfolioItem,
  updateFreelancerPortfolioItem,
  deleteFreelancerPortfolioItem,
  createFreelancerPortfolioAsset,
  updateFreelancerPortfolioAsset,
  deleteFreelancerPortfolioAsset,
  updateFreelancerPortfolioSettings,
  invalidateFreelancerPortfolioCache,
};
