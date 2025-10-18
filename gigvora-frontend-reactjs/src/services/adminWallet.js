import { apiClient } from './apiClient.js';

export async function fetchWalletAccounts(params = {}, options = {}) {
  const config = { params, ...options };
  return apiClient.get('/admin/wallets/accounts', config);
}

export async function fetchWalletAccount(accountId, options = {}) {
  if (!accountId) {
    throw new Error('accountId is required');
  }
  return apiClient.get(`/admin/wallets/accounts/${accountId}`, options);
}

export async function createWalletAccount(payload = {}, options = {}) {
  return apiClient.post('/admin/wallets/accounts', payload, options);
}

export async function updateWalletAccount(accountId, payload = {}, options = {}) {
  if (!accountId) {
    throw new Error('accountId is required');
  }
  return apiClient.put(`/admin/wallets/accounts/${accountId}`, payload, options);
}

export async function fetchWalletLedger(accountId, params = {}, options = {}) {
  if (!accountId) {
    throw new Error('accountId is required');
  }
  const config = { params, ...options };
  return apiClient.get(`/admin/wallets/accounts/${accountId}/ledger`, config);
}

export async function createWalletLedgerEntry(accountId, payload = {}, options = {}) {
  if (!accountId) {
    throw new Error('accountId is required');
  }
  return apiClient.post(`/admin/wallets/accounts/${accountId}/ledger`, payload, options);
}

export default {
  fetchWalletAccounts,
  fetchWalletAccount,
  createWalletAccount,
  updateWalletAccount,
  fetchWalletLedger,
  createWalletLedgerEntry,
};
