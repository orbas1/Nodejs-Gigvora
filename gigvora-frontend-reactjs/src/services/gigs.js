import { apiClient } from './apiClient.js';

export function submitCustomGigRequest(gigId, payload, { signal } = {}) {
  if (!gigId) {
    throw new Error('gigId is required to submit a custom request.');
  }
  return apiClient.post(`/discovery/gigs/${gigId}/custom-requests`, payload, { signal }).then((response) => response.data ?? response);
}

export default {
  submitCustomGigRequest,
};
