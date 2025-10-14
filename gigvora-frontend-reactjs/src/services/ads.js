import { apiClient } from './apiClient.js';

export async function fetchAdPlacements(params = {}) {
  const response = await apiClient.get('/ads/placements', { params });
  const placements = Array.isArray(response?.placements) ? response.placements : [];
  return placements;
}

export async function fetchAdDashboard(params = {}) {
  return apiClient.get('/ads/dashboard', { params });
}

export default {
  fetchAdPlacements,
  fetchAdDashboard,
};
