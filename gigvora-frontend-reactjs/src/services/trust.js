import apiClient from './apiClient.js';

export async function fetchTrustOverview(options = {}) {
  const response = await apiClient.get('/trust/overview', options);
  return response.overview;
}

export async function createEscrowAccount(payload, options = {}) {
  const response = await apiClient.post('/trust/escrow/accounts', payload, options);
  return response.account;
}

export async function initiateEscrowTransaction(payload, options = {}) {
  const response = await apiClient.post('/trust/escrow/transactions', payload, options);
  return response.transaction;
}

export async function releaseEscrow(transactionId, payload = {}, options = {}) {
  const response = await apiClient.post(`/trust/escrow/transactions/${transactionId}/release`, payload, options);
  return response.transaction;
}

export async function refundEscrow(transactionId, payload = {}, options = {}) {
  const response = await apiClient.post(`/trust/escrow/transactions/${transactionId}/refund`, payload, options);
  return response.transaction;
}

export async function createDispute(payload, options = {}) {
  const response = await apiClient.post('/trust/disputes', payload, options);
  return response.dispute;
}

export async function appendDisputeEvent(disputeId, payload, options = {}) {
  return apiClient.post(`/trust/disputes/${disputeId}/events`, payload, options);
}

export default {
  fetchTrustOverview,
  createEscrowAccount,
  initiateEscrowTransaction,
  releaseEscrow,
  refundEscrow,
  createDispute,
  appendDisputeEvent,
};
