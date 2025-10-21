import { apiClient } from './apiClient.js';

export function fetchCompanyOrdersDashboard({ status, signal } = {}) {
  const params = {};
  if (status) {
    params.status = status;
  }
  return apiClient.get('/company/orders', { params, signal });
}

export function createCompanyOrder(payload) {
  return apiClient.post('/company/orders', payload ?? {});
}

export function updateCompanyOrder(orderId, payload) {
  return apiClient.patch(`/company/orders/${orderId}`, payload ?? {});
}

export function deleteCompanyOrder(orderId) {
  return apiClient.delete(`/company/orders/${orderId}`);
}

export function createCompanyOrderTimeline(orderId, payload) {
  return apiClient.post(`/company/orders/${orderId}/timeline`, payload ?? {});
}

export function updateCompanyOrderTimeline(orderId, eventId, payload) {
  return apiClient.patch(`/company/orders/${orderId}/timeline/${eventId}`, payload ?? {});
}

export function postCompanyOrderMessage(orderId, payload) {
  return apiClient.post(`/company/orders/${orderId}/messages`, payload ?? {});
}

export function createCompanyOrderEscrow(orderId, payload) {
  return apiClient.post(`/company/orders/${orderId}/escrow`, payload ?? {});
}

export function updateCompanyOrderEscrow(orderId, checkpointId, payload) {
  return apiClient.patch(`/company/orders/${orderId}/escrow/${checkpointId}`, payload ?? {});
}

export function submitCompanyOrderReview(orderId, payload) {
  return apiClient.post(`/company/orders/${orderId}/review`, payload ?? {});
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
