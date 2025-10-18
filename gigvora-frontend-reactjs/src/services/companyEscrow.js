import { apiClient } from './apiClient.js';

export function buildCompanyEscrowCacheKey({ workspaceId, workspaceSlug, lookbackDays }) {
  const idPart = workspaceId ? `id:${workspaceId}` : 'id:current';
  const slugPart = workspaceSlug ? `slug:${workspaceSlug}` : 'slug:current';
  const lookbackPart = lookbackDays ?? 'default';
  return `company:escrow:${idPart}:${slugPart}:${lookbackPart}`;
}

export async function fetchCompanyEscrowOverview({ workspaceId, workspaceSlug, lookbackDays, signal, forceRefresh = false } = {}) {
  const params = {};
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    params.workspaceId = workspaceId;
  }
  if (workspaceSlug != null && `${workspaceSlug}`.length > 0) {
    params.workspaceSlug = workspaceSlug;
  }
  if (lookbackDays != null) {
    params.lookbackDays = lookbackDays;
  }
  if (forceRefresh) {
    params.forceRefresh = true;
  }
  return apiClient.get('/company/escrow/overview', { params, signal });
}

export async function createEscrowAccount(payload) {
  return apiClient.post('/company/escrow/accounts', payload);
}

export async function updateEscrowAccount(accountId, payload) {
  return apiClient.patch(`/company/escrow/accounts/${accountId}`, payload);
}

export async function initiateEscrowTransaction(payload) {
  return apiClient.post('/company/escrow/transactions', payload);
}

export async function releaseEscrowTransaction(transactionId, payload) {
  return apiClient.post(`/company/escrow/transactions/${transactionId}/release`, payload);
}

export async function refundEscrowTransaction(transactionId, payload) {
  return apiClient.post(`/company/escrow/transactions/${transactionId}/refund`, payload);
}

export async function updateEscrowAutomationSettings(payload) {
  return apiClient.patch('/company/escrow/automation', payload);
}

export default {
  buildCompanyEscrowCacheKey,
  fetchCompanyEscrowOverview,
  createEscrowAccount,
  updateEscrowAccount,
  initiateEscrowTransaction,
  releaseEscrowTransaction,
  refundEscrowTransaction,
  updateEscrowAutomationSettings,
};
