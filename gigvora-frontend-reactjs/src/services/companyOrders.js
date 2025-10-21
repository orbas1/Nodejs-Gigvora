import { apiClient } from './apiClient.js';

function ensureId(value, message) {
  if (value === undefined || value === null || `${value}`.trim().length === 0) {
    throw new Error(message);
  }
  return typeof value === 'string' ? value.trim() : value;
}

export function fetchCompanyOrdersDashboard({ status, signal } = {}) {
  const params = {};
  if (status) {
    params.status = status;
  }
  return apiClient.get('/company/orders', { params, signal });
}

export function createCompanyOrder(payload = {}, { signal } = {}) {
  return apiClient.post('/company/orders', payload, { signal });
}

export function updateCompanyOrder(orderId, payload = {}, { signal } = {}) {
  const resolvedOrderId = ensureId(orderId, 'orderId is required to update an order.');
  return apiClient.patch(`/company/orders/${resolvedOrderId}`, payload, { signal });
}

export function deleteCompanyOrder(orderId, { signal } = {}) {
  const resolvedOrderId = ensureId(orderId, 'orderId is required to delete an order.');
  return apiClient.delete(`/company/orders/${resolvedOrderId}`, { signal });
}

export function createCompanyOrderTimeline(orderId, payload = {}, { signal } = {}) {
  const resolvedOrderId = ensureId(orderId, 'orderId is required to create a timeline event.');
  return apiClient.post(`/company/orders/${resolvedOrderId}/timeline`, payload, { signal });
}

export function updateCompanyOrderTimeline(orderId, eventId, payload = {}, { signal } = {}) {
  const resolvedOrderId = ensureId(orderId, 'orderId is required to update a timeline event.');
  const resolvedEventId = ensureId(eventId, 'eventId is required to update a timeline event.');
  return apiClient.patch(`/company/orders/${resolvedOrderId}/timeline/${resolvedEventId}`, payload, { signal });
}

export function postCompanyOrderMessage(orderId, payload = {}, { signal } = {}) {
  const resolvedOrderId = ensureId(orderId, 'orderId is required to post a message.');
  return apiClient.post(`/company/orders/${resolvedOrderId}/messages`, payload, { signal });
}

export function createCompanyOrderEscrow(orderId, payload = {}, { signal } = {}) {
  const resolvedOrderId = ensureId(orderId, 'orderId is required to create escrow.');
  return apiClient.post(`/company/orders/${resolvedOrderId}/escrow`, payload, { signal });
}

export function updateCompanyOrderEscrow(orderId, checkpointId, payload = {}, { signal } = {}) {
  const resolvedOrderId = ensureId(orderId, 'orderId is required to update escrow.');
  const resolvedCheckpointId = ensureId(checkpointId, 'checkpointId is required to update escrow.');
  return apiClient.patch(`/company/orders/${resolvedOrderId}/escrow/${resolvedCheckpointId}`, payload, { signal });
}

export function submitCompanyOrderReview(orderId, payload = {}, { signal } = {}) {
  const resolvedOrderId = ensureId(orderId, 'orderId is required to submit a review.');
  return apiClient.post(`/company/orders/${resolvedOrderId}/review`, payload, { signal });
}

export default {
  fetchCompanyOrdersDashboard,
  createCompanyOrder,
  updateCompanyOrder,
  deleteCompanyOrder,
  createCompanyOrderTimeline,
  updateCompanyOrderTimeline,
  postCompanyOrderMessage,
  createCompanyOrderEscrow,
  updateCompanyOrderEscrow,
  submitCompanyOrderReview,
};
