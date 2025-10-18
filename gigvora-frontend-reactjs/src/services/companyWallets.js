import { apiClient } from './apiClient.js';

function buildWorkspaceParams({ workspaceId, workspaceSlug } = {}) {
  const params = {};
  if (workspaceId != null && `${workspaceId}`.length) {
    params.workspaceId = workspaceId;
  }
  if (workspaceSlug != null && `${workspaceSlug}`.length) {
    params.workspaceSlug = workspaceSlug;
  }
  return params;
}

export async function fetchCompanyWallets({ workspaceId, workspaceSlug, includeInactive = false, signal } = {}) {
  const params = {
    ...buildWorkspaceParams({ workspaceId, workspaceSlug }),
  };
  if (includeInactive) {
    params.includeInactive = true;
  }
  return apiClient.get('/company/wallets', { params, signal });
}

export async function fetchCompanyWalletDetail(walletId, { workspaceId, workspaceSlug, signal } = {}) {
  const params = buildWorkspaceParams({ workspaceId, workspaceSlug });
  return apiClient.get(`/company/wallets/${walletId}`, { params, signal });
}

export async function createCompanyWallet(payload, { workspaceId, workspaceSlug } = {}) {
  const params = buildWorkspaceParams({ workspaceId, workspaceSlug });
  return apiClient.post('/company/wallets', payload, { params });
}

export async function updateCompanyWallet(walletId, payload, { workspaceId, workspaceSlug } = {}) {
  const params = buildWorkspaceParams({ workspaceId, workspaceSlug });
  return apiClient.patch(`/company/wallets/${walletId}`, payload, { params });
}

export async function createWalletTransaction(walletId, payload, { workspaceId, workspaceSlug } = {}) {
  const params = buildWorkspaceParams({ workspaceId, workspaceSlug });
  return apiClient.post(`/company/wallets/${walletId}/transactions`, payload, { params });
}

export async function fetchWalletTransactions(walletId, { workspaceId, workspaceSlug, type, status, category, dateFrom, dateTo, limit, offset, signal } = {}) {
  const params = {
    ...buildWorkspaceParams({ workspaceId, workspaceSlug }),
  };
  if (type) params.type = type;
  if (status) params.status = status;
  if (category) params.category = category;
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;
  if (limit != null) params.limit = limit;
  if (offset != null) params.offset = offset;
  return apiClient.get(`/company/wallets/${walletId}/transactions`, { params, signal });
}

export async function createWalletFundingSource(walletId, payload, { workspaceId, workspaceSlug } = {}) {
  const params = buildWorkspaceParams({ workspaceId, workspaceSlug });
  return apiClient.post(`/company/wallets/${walletId}/funding-sources`, payload, { params });
}

export async function updateWalletFundingSource(walletId, sourceId, payload, { workspaceId, workspaceSlug } = {}) {
  const params = buildWorkspaceParams({ workspaceId, workspaceSlug });
  return apiClient.patch(`/company/wallets/${walletId}/funding-sources/${sourceId}`, payload, { params });
}

export async function createWalletPayoutMethod(walletId, payload, { workspaceId, workspaceSlug } = {}) {
  const params = buildWorkspaceParams({ workspaceId, workspaceSlug });
  return apiClient.post(`/company/wallets/${walletId}/payout-methods`, payload, { params });
}

export async function updateWalletPayoutMethod(walletId, methodId, payload, { workspaceId, workspaceSlug } = {}) {
  const params = buildWorkspaceParams({ workspaceId, workspaceSlug });
  return apiClient.patch(`/company/wallets/${walletId}/payout-methods/${methodId}`, payload, { params });
}

export async function createWalletSpendingPolicy(walletId, payload, { workspaceId, workspaceSlug } = {}) {
  const params = buildWorkspaceParams({ workspaceId, workspaceSlug });
  return apiClient.post(`/company/wallets/${walletId}/policies`, payload, { params });
}

export async function updateWalletSpendingPolicy(walletId, policyId, payload, { workspaceId, workspaceSlug } = {}) {
  const params = buildWorkspaceParams({ workspaceId, workspaceSlug });
  return apiClient.patch(`/company/wallets/${walletId}/policies/${policyId}`, payload, { params });
}

export async function retireWalletSpendingPolicy(walletId, policyId, { workspaceId, workspaceSlug } = {}) {
  const params = buildWorkspaceParams({ workspaceId, workspaceSlug });
  return apiClient.delete(`/company/wallets/${walletId}/policies/${policyId}`, { params });
}

export async function addWalletMember(walletId, payload, { workspaceId, workspaceSlug } = {}) {
  const params = buildWorkspaceParams({ workspaceId, workspaceSlug });
  return apiClient.post(`/company/wallets/${walletId}/members`, payload, { params });
}

export async function updateWalletMember(walletId, memberId, payload, { workspaceId, workspaceSlug } = {}) {
  const params = buildWorkspaceParams({ workspaceId, workspaceSlug });
  return apiClient.patch(`/company/wallets/${walletId}/members/${memberId}`, payload, { params });
}

export async function removeWalletMember(walletId, memberId, { workspaceId, workspaceSlug } = {}) {
  const params = buildWorkspaceParams({ workspaceId, workspaceSlug });
  return apiClient.delete(`/company/wallets/${walletId}/members/${memberId}`, { params });
}

export default {
  fetchCompanyWallets,
  fetchCompanyWalletDetail,
  createCompanyWallet,
  updateCompanyWallet,
  createWalletTransaction,
  fetchWalletTransactions,
  createWalletFundingSource,
  updateWalletFundingSource,
  createWalletPayoutMethod,
  updateWalletPayoutMethod,
  createWalletSpendingPolicy,
  updateWalletSpendingPolicy,
  retireWalletSpendingPolicy,
  addWalletMember,
  updateWalletMember,
  removeWalletMember,
};
