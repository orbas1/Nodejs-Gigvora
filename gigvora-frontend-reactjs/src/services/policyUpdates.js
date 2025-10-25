import { apiClient } from './apiClient.js';

export async function fetchPolicyReleaseMetadata(options = {}) {
  const response = await apiClient.get('/legal/policies/releases/latest', options);
  if (response?.data) {
    return response.data;
  }
  return response ?? null;
}

export default {
  fetchPolicyReleaseMetadata,
};
