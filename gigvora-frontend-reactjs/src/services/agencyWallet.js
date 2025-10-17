import { apiClient } from './apiClient.js';

export function buildWalletOverviewCacheKey(workspaceId) {
  const key = workspaceId == null ? 'default' : String(workspaceId);
  return `agencyWallet:overview:${key}`;
}

export async function fetchWalletOverview({ workspaceId, signal, forceRefresh = false } = {}) {
  const params = {};
  if (workspaceId != null && workspaceId !== '') {
    params.workspaceId = workspaceId;
  }
  if (forceRefresh) {
    params.refresh = 'true';
  }
  return apiClient.get('/agency/wallet/overview', { params, signal });
}

export function buildWalletAccountsCacheKey({ workspaceId, status, search, page, pageSize }) {
  const safeWorkspace = workspaceId == null || workspaceId === '' ? 'all' : String(workspaceId);
  const safeStatus = status == null || status === '' ? 'all' : String(status);
  const safeSearch = search == null ? '' : String(search).trim().toLowerCase();
  const safePage = Number.isFinite(page) ? page : 0;
  const safePageSize = Number.isFinite(pageSize) ? pageSize : 25;
  return `agencyWallet:accounts:${safeWorkspace}:${safeStatus}:${safeSearch}:${safePage}:${safePageSize}`;
}

export async function fetchWalletAccounts({
  workspaceId,
  status,
  search,
  page = 0,
  pageSize = 25,
  signal,
} = {}) {
  const params = {
    limit: pageSize,
    offset: page * pageSize,
  };
  if (workspaceId != null && workspaceId !== '') {
    params.workspaceId = workspaceId;
  }
  if (status) {
    params.status = status;
  }
  if (search) {
    params.search = search;
  }
  return apiClient.get('/agency/wallet/accounts', { params, signal });
}

export async function createWalletAccount(payload) {
  return apiClient.post('/agency/wallet/accounts', payload);
}

export async function updateWalletAccount(accountId, payload) {
  return apiClient.put(`/agency/wallet/accounts/${accountId}`, payload);
}

export function buildLedgerCacheKey(accountId, { page = 0, pageSize = 50, entryType } = {}) {
  const safeEntryType = entryType ? String(entryType) : 'all';
  return `agencyWallet:ledger:${accountId}:${safeEntryType}:${page}:${pageSize}`;
}

export async function fetchWalletLedgerEntries(
  accountId,
  { page = 0, pageSize = 50, entryType, signal } = {},
) {
  if (!accountId) {
    throw new Error('accountId is required to load ledger entries.');
  }
  const params = {
    limit: pageSize,
    offset: page * pageSize,
  };
  if (entryType) {
    params.entryType = entryType;
  }
  return apiClient.get(`/agency/wallet/accounts/${accountId}/ledger`, { params, signal });
}

export async function createWalletLedgerEntry(accountId, payload) {
  return apiClient.post(`/agency/wallet/accounts/${accountId}/ledger`, payload);
}

export function buildFundingSourcesCacheKey(workspaceId) {
  const key = workspaceId == null || workspaceId === '' ? 'all' : String(workspaceId);
  return `agencyWallet:funding:${key}`;
}

export async function fetchFundingSources({ workspaceId, signal } = {}) {
  const params = {};
  if (workspaceId != null && workspaceId !== '') {
    params.workspaceId = workspaceId;
  }
  return apiClient.get('/agency/wallet/funding-sources', { params, signal });
}

export async function createFundingSource(payload) {
  return apiClient.post('/agency/wallet/funding-sources', payload);
}

export async function updateFundingSource(sourceId, payload) {
  return apiClient.put(`/agency/wallet/funding-sources/${sourceId}`, payload);
}

export function buildPayoutRequestsCacheKey({ workspaceId, status }) {
  const safeWorkspace = workspaceId == null || workspaceId === '' ? 'all' : String(workspaceId);
  const safeStatus = status == null || status === '' ? 'all' : String(status);
  return `agencyWallet:payouts:${safeWorkspace}:${safeStatus}`;
}

export async function fetchPayoutRequests({ workspaceId, status, signal } = {}) {
  const params = {};
  if (workspaceId != null && workspaceId !== '') {
    params.workspaceId = workspaceId;
  }
  if (status) {
    params.status = status;
  }
  return apiClient.get('/agency/wallet/payout-requests', { params, signal });
}

export async function createPayoutRequest(payload) {
  return apiClient.post('/agency/wallet/payout-requests', payload);
}

export async function updatePayoutRequest(requestId, payload) {
  return apiClient.put(`/agency/wallet/payout-requests/${requestId}`, payload);
}

export function buildWalletSettingsCacheKey(workspaceId) {
  if (workspaceId == null || workspaceId === '') {
    return 'agencyWallet:settings:none';
  }
  return `agencyWallet:settings:${workspaceId}`;
}

export async function fetchWalletSettings({ workspaceId, signal } = {}) {
  if (workspaceId == null || workspaceId === '') {
    throw new Error('workspaceId is required to load wallet settings.');
  }
  const params = { workspaceId };
  const response = await apiClient.get('/agency/wallet/settings', { params, signal });
  return response?.settings ?? null;
}

export async function updateWalletSettings(payload) {
  const response = await apiClient.put('/agency/wallet/settings', payload);
  return response?.settings ?? null;
}

export function invalidateWalletOverview(workspaceId) {
  apiClient.removeCache(buildWalletOverviewCacheKey(workspaceId));
}

export function invalidateWalletAccounts(params) {
  apiClient.removeCache(buildWalletAccountsCacheKey(params));
}

export function invalidateLedgerCache(accountId, params) {
  apiClient.removeCache(buildLedgerCacheKey(accountId, params));
}

export function invalidateFundingSources(workspaceId) {
  apiClient.removeCache(buildFundingSourcesCacheKey(workspaceId));
}

export function invalidatePayoutRequests(params) {
  apiClient.removeCache(buildPayoutRequestsCacheKey(params));
}

export function invalidateWalletSettings(workspaceId) {
  apiClient.removeCache(buildWalletSettingsCacheKey(workspaceId));
}

export default {
  buildWalletOverviewCacheKey,
  fetchWalletOverview,
  buildWalletAccountsCacheKey,
  fetchWalletAccounts,
  createWalletAccount,
  updateWalletAccount,
  buildLedgerCacheKey,
  fetchWalletLedgerEntries,
  createWalletLedgerEntry,
  buildFundingSourcesCacheKey,
  fetchFundingSources,
  createFundingSource,
  updateFundingSource,
  buildPayoutRequestsCacheKey,
  fetchPayoutRequests,
  createPayoutRequest,
  updatePayoutRequest,
  buildWalletSettingsCacheKey,
  fetchWalletSettings,
  updateWalletSettings,
  invalidateWalletOverview,
  invalidateWalletAccounts,
  invalidateLedgerCache,
  invalidateFundingSources,
  invalidatePayoutRequests,
  invalidateWalletSettings,
};
