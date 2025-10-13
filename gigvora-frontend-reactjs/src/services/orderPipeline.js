import { apiClient } from './apiClient.js';

export function fetchFreelancerOrderPipeline({ freelancerId, lookbackDays } = {}) {
  return apiClient.get('/freelancer/order-pipeline', {
    params: {
      freelancerId: freelancerId ?? undefined,
      lookbackDays: lookbackDays ?? undefined,
    },
  });
}

export function createFreelancerOrder(payload) {
  return apiClient.post('/freelancer/order-pipeline/orders', payload);
}

export function updateFreelancerOrder(orderId, payload) {
  return apiClient.patch(`/freelancer/order-pipeline/orders/${orderId}`, payload);
}

export function createOrderRequirement(orderId, payload) {
  return apiClient.post(`/freelancer/order-pipeline/orders/${orderId}/requirement-forms`, payload);
}

export function updateOrderRequirement(orderId, formId, payload) {
  return apiClient.patch(
    `/freelancer/order-pipeline/orders/${orderId}/requirement-forms/${formId}`,
    payload,
  );
}

export function createOrderRevision(orderId, payload) {
  return apiClient.post(`/freelancer/order-pipeline/orders/${orderId}/revisions`, payload);
}

export function updateOrderRevision(orderId, revisionId, payload) {
  return apiClient.patch(
    `/freelancer/order-pipeline/orders/${orderId}/revisions/${revisionId}`,
    payload,
  );
}

export function createEscrowCheckpoint(orderId, payload) {
  return apiClient.post(`/freelancer/order-pipeline/orders/${orderId}/escrow-checkpoints`, payload);
}

export function updateEscrowCheckpoint(orderId, checkpointId, payload) {
  return apiClient.patch(
    `/freelancer/order-pipeline/orders/${orderId}/escrow-checkpoints/${checkpointId}`,
    payload,
  );
}

export default {
  fetchFreelancerOrderPipeline,
  createFreelancerOrder,
  updateFreelancerOrder,
  createOrderRequirement,
  updateOrderRequirement,
  createOrderRevision,
  updateOrderRevision,
  createEscrowCheckpoint,
  updateEscrowCheckpoint,
};
