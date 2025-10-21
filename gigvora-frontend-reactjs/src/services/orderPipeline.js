import { apiClient } from './apiClient.js';

function ensureOrderId(orderId) {
  if (!orderId) {
    throw new Error('orderId is required for order pipeline actions.');
  }
  return orderId;
}

export function fetchFreelancerOrderPipeline({ freelancerId, lookbackDays, signal } = {}) {
  return apiClient.get('/freelancer/order-pipeline', {
    params: {
      freelancerId: freelancerId ?? undefined,
      lookbackDays: lookbackDays ?? undefined,
    },
    signal,
  });
}

export function createFreelancerOrder(payload) {
  if (!payload?.freelancerId) {
    throw new Error('freelancerId is required to create an order.');
  }
  return apiClient.post('/freelancer/order-pipeline/orders', payload);
}

export function updateFreelancerOrder(orderId, payload) {
  ensureOrderId(orderId);
  return apiClient.patch(`/freelancer/order-pipeline/orders/${orderId}`, payload);
}

export function createOrderRequirement(orderId, payload) {
  ensureOrderId(orderId);
  if (!payload?.title) {
    throw new Error('title is required to create a requirement form.');
  }
  return apiClient.post(`/freelancer/order-pipeline/orders/${orderId}/requirement-forms`, payload);
}

export function updateOrderRequirement(orderId, formId, payload) {
  ensureOrderId(orderId);
  if (!formId) {
    throw new Error('formId is required to update a requirement form.');
  }
  return apiClient.patch(
    `/freelancer/order-pipeline/orders/${orderId}/requirement-forms/${formId}`,
    payload,
  );
}

export function createOrderRevision(orderId, payload) {
  ensureOrderId(orderId);
  return apiClient.post(`/freelancer/order-pipeline/orders/${orderId}/revisions`, payload);
}

export function updateOrderRevision(orderId, revisionId, payload) {
  ensureOrderId(orderId);
  if (!revisionId) {
    throw new Error('revisionId is required to update a revision.');
  }
  return apiClient.patch(
    `/freelancer/order-pipeline/orders/${orderId}/revisions/${revisionId}`,
    payload,
  );
}

export function createEscrowCheckpoint(orderId, payload) {
  ensureOrderId(orderId);
  return apiClient.post(`/freelancer/order-pipeline/orders/${orderId}/escrow-checkpoints`, payload);
}

export function updateEscrowCheckpoint(orderId, checkpointId, payload) {
  ensureOrderId(orderId);
  if (!checkpointId) {
    throw new Error('checkpointId is required to update an escrow checkpoint.');
  }
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
