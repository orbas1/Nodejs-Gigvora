import { apiClient } from './apiClient.js';

export function fetchEscrowOverview(params = {}) {
  return apiClient.get('/admin/finance/escrow/overview', { params });
}

export function fetchEscrowAccounts(params = {}) {
  return apiClient.get('/admin/finance/escrow/accounts', { params });
}

export function createEscrowAccount(payload) {
  return apiClient.post('/admin/finance/escrow/accounts', payload);
}

export function updateEscrowAccount(accountId, payload) {
  return apiClient.put(`/admin/finance/escrow/accounts/${accountId}`, payload);
}

export function fetchEscrowTransactions(params = {}) {
  return apiClient.get('/admin/finance/escrow/transactions', { params });
}

export function updateEscrowTransaction(transactionId, payload) {
  return apiClient.put(`/admin/finance/escrow/transactions/${transactionId}`, payload);
}

export function releaseEscrowTransaction(transactionId, payload = {}) {
  return apiClient.post(`/admin/finance/escrow/transactions/${transactionId}/release`, payload);
}

export function refundEscrowTransaction(transactionId, payload = {}) {
  return apiClient.post(`/admin/finance/escrow/transactions/${transactionId}/refund`, payload);
}

export function updateEscrowProviderSettings(payload) {
  return apiClient.put('/admin/finance/escrow/provider', payload);
}

export function fetchEscrowFeeTiers() {
  return apiClient.get('/admin/finance/escrow/fee-tiers');
}

export function createEscrowFeeTier(payload) {
  return apiClient.post('/admin/finance/escrow/fee-tiers', payload);
}

export function updateEscrowFeeTier(tierId, payload) {
  return apiClient.put(`/admin/finance/escrow/fee-tiers/${tierId}`, payload);
}

export function deleteEscrowFeeTier(tierId) {
  return apiClient.delete(`/admin/finance/escrow/fee-tiers/${tierId}`);
}

export function fetchEscrowReleasePolicies() {
  return apiClient.get('/admin/finance/escrow/release-policies');
}

export function createEscrowReleasePolicy(payload) {
  return apiClient.post('/admin/finance/escrow/release-policies', payload);
}

export function updateEscrowReleasePolicy(policyId, payload) {
  return apiClient.put(`/admin/finance/escrow/release-policies/${policyId}`, payload);
}

export function deleteEscrowReleasePolicy(policyId) {
  return apiClient.delete(`/admin/finance/escrow/release-policies/${policyId}`);
}

export default {
  fetchEscrowOverview,
  fetchEscrowAccounts,
  createEscrowAccount,
  updateEscrowAccount,
  fetchEscrowTransactions,
  updateEscrowTransaction,
  releaseEscrowTransaction,
  refundEscrowTransaction,
  updateEscrowProviderSettings,
  fetchEscrowFeeTiers,
  createEscrowFeeTier,
  updateEscrowFeeTier,
  deleteEscrowFeeTier,
  fetchEscrowReleasePolicies,
  createEscrowReleasePolicy,
  updateEscrowReleasePolicy,
  deleteEscrowReleasePolicy,
};
