import apiClient from './apiClient.js';

export async function fetchUser(userId, { signal } = {}) {
  if (!userId) {
    throw new Error('A userId is required to fetch a user profile.');
  }
  return apiClient.get(`/users/${userId}`, { signal });
}

export async function updateUserAccount(userId, payload) {
  if (!userId) {
    throw new Error('A userId is required to update an account.');
  }
  if (payload == null || typeof payload !== 'object') {
    throw new Error('Update payload must be an object.');
  }
  return apiClient.put(`/users/${userId}`, payload);
}

export default {
  fetchUser,
  updateUserAccount,
};
