import { apiClient } from './apiClient.js';

export async function fetchUserDashboard(userId, { signal } = {}) {
  if (!userId) {
    throw new Error('userId is required to load the user dashboard.');
  }
  return apiClient.get(`/users/${userId}/dashboard`, { signal });
}

export default {
  fetchUserDashboard,
};
