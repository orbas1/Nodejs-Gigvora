import apiClient from './apiClient.js';

export async function fetchFreelancerEscrowOverview(freelancerId, params = {}, options = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to load escrow data.');
  }
  const query = {};
  if (params.status) {
    query.status = params.status;
  }
  if (params.limit) {
    query.limit = params.limit;
  }
  return apiClient.get(`/freelancers/${freelancerId}/escrow/overview`, {
    params: query,
    signal: options.signal,
  });
}

export async function createFreelancerEscrowAccount(freelancerId, payload, options = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to create an escrow account.');
  }
  const response = await apiClient.post(`/freelancers/${freelancerId}/escrow/accounts`, payload, options);
  return response.account;
}

export async function updateFreelancerEscrowAccount(freelancerId, accountId, payload, options = {}) {
  if (!freelancerId || !accountId) {
    throw new Error('freelancerId and accountId are required to update an escrow account.');
  }
  const response = await apiClient.patch(
    `/freelancers/${freelancerId}/escrow/accounts/${accountId}`,
    payload,
    options,
  );
  return response.account;
}

export async function createFreelancerEscrowTransaction(freelancerId, payload, options = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to create an escrow transaction.');
  }
  const response = await apiClient.post(`/freelancers/${freelancerId}/escrow/transactions`, payload, options);
  return response.transaction;
}

export async function releaseFreelancerEscrowTransaction(
  freelancerId,
  transactionId,
  payload = {},
  options = {},
) {
  if (!freelancerId || !transactionId) {
    throw new Error('freelancerId and transactionId are required to release escrow funds.');
  }
  const response = await apiClient.post(
    `/freelancers/${freelancerId}/escrow/transactions/${transactionId}/release`,
    payload,
    options,
  );
  return response.transaction;
}

export async function refundFreelancerEscrowTransaction(
  freelancerId,
  transactionId,
  payload = {},
  options = {},
) {
  if (!freelancerId || !transactionId) {
    throw new Error('freelancerId and transactionId are required to refund escrow funds.');
  }
  const response = await apiClient.post(
    `/freelancers/${freelancerId}/escrow/transactions/${transactionId}/refund`,
    payload,
    options,
  );
  return response.transaction;
}

export async function openFreelancerEscrowDispute(
  freelancerId,
  transactionId,
  payload = {},
  options = {},
) {
  if (!freelancerId || !transactionId) {
    throw new Error('freelancerId and transactionId are required to open an escrow dispute.');
  }
  const response = await apiClient.post(
    `/freelancers/${freelancerId}/escrow/transactions/${transactionId}/disputes`,
    payload,
    options,
  );
  return response.dispute;
}

export async function appendFreelancerEscrowDisputeEvent(
  freelancerId,
  disputeId,
  payload = {},
  options = {},
) {
  if (!freelancerId || !disputeId) {
    throw new Error('freelancerId and disputeId are required to append a dispute event.');
  }
  return apiClient.post(
    `/freelancers/${freelancerId}/escrow/disputes/${disputeId}/events`,
    payload,
    options,
  );
}

export default {
  fetchFreelancerEscrowOverview,
  createFreelancerEscrowAccount,
  updateFreelancerEscrowAccount,
  createFreelancerEscrowTransaction,
  releaseFreelancerEscrowTransaction,
  refundFreelancerEscrowTransaction,
  openFreelancerEscrowDispute,
  appendFreelancerEscrowDisputeEvent,
};
