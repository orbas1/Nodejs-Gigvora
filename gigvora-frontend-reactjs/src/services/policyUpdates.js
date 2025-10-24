import { apiClient } from './apiClient.js';

export async function fetchPolicyReleaseMetadata(options = {}) {
  try {
    const response = await apiClient.get('/legal/policies/releases/latest', options);
    if (response?.data) {
      return response.data;
    }
    return response ?? null;
  } catch (error) {
    throw error;
  }
}

export default {
  fetchPolicyReleaseMetadata,
};
