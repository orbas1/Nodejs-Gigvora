import apiClient from './apiClient.js';

export async function fetchDashboardOverview(options = {}) {
  const response = await apiClient.get('/dashboard/overview', options);
  return response.overview;
}

export default { fetchDashboardOverview };
