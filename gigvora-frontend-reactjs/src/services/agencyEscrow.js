import { apiClient } from './apiClient.js';

export async function fetchAgencyEscrowOverview(params = {}, { signal } = {}) {
  return apiClient.get('/agency/escrow/overview', { params, signal });
}

export async function fetchAgencyEscrowAccounts(params = {}, { signal } = {}) {
  return apiClient.get('/agency/escrow/accounts', { params, signal });
}

export async function createAgencyEscrowAccount(payload, params = {}, { signal } = {}) {
  return apiClient.post('/agency/escrow/accounts', payload, { params, signal });
}

export async function updateAgencyEscrowAccount(accountId, payload, params = {}, { signal } = {}) {
  return apiClient.patch(`/agency/escrow/accounts/${accountId}`, payload, { params, signal });
}

export async function fetchAgencyEscrowTransactions(params = {}, { signal } = {}) {
  return apiClient.get('/agency/escrow/transactions', { params, signal });
}

export async function createAgencyEscrowTransaction(payload, params = {}, { signal } = {}) {
  return apiClient.post('/agency/escrow/transactions', payload, { params, signal });
}

export async function updateAgencyEscrowTransaction(transactionId, payload, params = {}, { signal } = {}) {
  return apiClient.patch(`/agency/escrow/transactions/${transactionId}`, payload, { params, signal });
}

export async function releaseAgencyEscrowTransaction(transactionId, payload = {}, params = {}, { signal } = {}) {
  return apiClient.post(`/agency/escrow/transactions/${transactionId}/release`, payload, { params, signal });
}

export async function refundAgencyEscrowTransaction(transactionId, payload = {}, params = {}, { signal } = {}) {
  return apiClient.post(`/agency/escrow/transactions/${transactionId}/refund`, payload, { params, signal });
}

export async function updateAgencyEscrowSettings(payload, params = {}, { signal } = {}) {
  return apiClient.patch('/agency/escrow/settings', payload, { params, signal });
}

export default {
  fetchAgencyEscrowOverview,
  fetchAgencyEscrowAccounts,
  createAgencyEscrowAccount,
  updateAgencyEscrowAccount,
  fetchAgencyEscrowTransactions,
  createAgencyEscrowTransaction,
  updateAgencyEscrowTransaction,
  releaseAgencyEscrowTransaction,
  refundAgencyEscrowTransaction,
  updateAgencyEscrowSettings,
};
