import apiClient from './apiClient.js';

export async function fetchTrustOverview(options = {}) {
  const response = await apiClient.get('/trust/overview', options);
  return response.overview;
}

export async function createEscrowAccount(payload, options = {}) {
  const response = await apiClient.post('/trust/escrow/accounts', payload, options);
  return response.account;
}

export async function updateEscrowAccount(accountId, payload, options = {}) {
  const response = await apiClient.patch(`/trust/escrow/accounts/${accountId}`, payload, options);
  return response.account;
}

export async function initiateEscrowTransaction(payload, options = {}) {
  const response = await apiClient.post('/trust/escrow/transactions', payload, options);
  return response.transaction;
}

export async function updateEscrowTransaction(transactionId, payload, options = {}) {
  const response = await apiClient.patch(
    `/trust/escrow/transactions/${transactionId}`,
    payload,
    options,
  );
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

export async function fetchDisputes(params = {}, options = {}) {
  const response = await apiClient.get('/trust/disputes', { params, ...options });
  return {
    disputes: response.disputes ?? [],
    pagination: response.pagination ?? {},
    totals: response.totals ?? {},
    filters: response.filters ?? {},
  };
}

export async function fetchDispute(disputeId, options = {}) {
  const response = await apiClient.get(`/trust/disputes/${disputeId}`, options);
  return response.dispute;
}

export async function updateDispute(disputeId, payload, options = {}) {
  const response = await apiClient.patch(`/trust/disputes/${disputeId}`, payload, options);
  return response.dispute;
}

export default {
  fetchTrustOverview,
  createEscrowAccount,
  updateEscrowAccount,
  initiateEscrowTransaction,
  updateEscrowTransaction,
  releaseEscrow,
  refundEscrow,
  createDispute,
  appendDisputeEvent,
  fetchDisputes,
  fetchDispute,
  updateDispute,
};
