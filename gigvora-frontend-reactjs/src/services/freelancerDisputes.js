import apiClient from './apiClient.js';

export async function fetchDisputeDashboard(freelancerId, params = {}, options = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to load disputes.');
  }
  const response = await apiClient.get(`/freelancer/${freelancerId}/disputes`, {
    params,
    ...options,
  });
  return response;
}

export async function createDispute(freelancerId, payload, options = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to create a dispute.');
  }
  const response = await apiClient.post(`/freelancer/${freelancerId}/disputes`, payload, options);
  return response;
}

export async function fetchDisputeDetail(freelancerId, disputeId, options = {}) {
  if (!freelancerId || !disputeId) {
    throw new Error('freelancerId and disputeId are required to load a dispute.');
  }
  const response = await apiClient.get(`/freelancer/${freelancerId}/disputes/${disputeId}`, options);
  return response;
}

export async function appendDisputeEvent(freelancerId, disputeId, payload, options = {}) {
  if (!freelancerId || !disputeId) {
    throw new Error('freelancerId and disputeId are required to append events.');
  }
  const response = await apiClient.post(
    `/freelancer/${freelancerId}/disputes/${disputeId}/events`,
    payload,
    options,
  );
  return response;
}

export default {
  fetchDisputeDashboard,
  createDispute,
  fetchDisputeDetail,
  appendDisputeEvent,
};
