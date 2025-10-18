import { apiClient } from './apiClient.js';

export async function fetchUserDisputes(userId, params = {}, { signal } = {}) {
  if (!userId) {
    throw new Error('userId is required to fetch disputes.');
  }
  return apiClient.get(`/users/${userId}/disputes`, { params, signal });
}

export async function fetchUserDispute(userId, disputeId, { signal } = {}) {
  if (!userId || !disputeId) {
    throw new Error('userId and disputeId are required.');
  }
  return apiClient.get(`/users/${userId}/disputes/${disputeId}`, { signal });
}

export async function createUserDispute(userId, payload, { signal } = {}) {
  if (!userId) {
    throw new Error('userId is required to create a dispute.');
  }
  return apiClient.post(`/users/${userId}/disputes`, payload, { signal });
}

export async function postUserDisputeEvent(userId, disputeId, payload, { signal } = {}) {
  if (!userId || !disputeId) {
    throw new Error('userId and disputeId are required.');
  }
  return apiClient.post(`/users/${userId}/disputes/${disputeId}/events`, payload, { signal });
}

export default {
  fetchUserDisputes,
  fetchUserDispute,
  createUserDispute,
  postUserDisputeEvent,
};
