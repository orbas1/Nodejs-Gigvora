import { apiClient } from './apiClient.js';

function ensureId(value, message) {
  if (value === undefined || value === null || `${value}`.trim().length === 0) {
    throw new Error(message);
  }
  return typeof value === 'string' ? value.trim() : value;
}

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
    params.workspaceSlug = `${workspaceSlug}`.trim();
  }
  if (lookbackDays != null) {
    params.lookbackDays = lookbackDays;
  }
  if (forceRefresh) {
    params.forceRefresh = 'true';
  }
  return apiClient.get('/company/escrow/overview', { params, signal });
}

export async function createEscrowAccount(payload = {}, { signal } = {}) {
  return apiClient.post('/company/escrow/accounts', payload, { signal });
}

export async function updateEscrowAccount(accountId, payload = {}, { signal } = {}) {
  const resolvedAccountId = ensureId(accountId, 'accountId is required to update an escrow account.');
  return apiClient.patch(`/company/escrow/accounts/${resolvedAccountId}`, payload, { signal });
}

export async function initiateEscrowTransaction(payload = {}, { signal } = {}) {
  return apiClient.post('/company/escrow/transactions', payload, { signal });
}

export async function releaseEscrowTransaction(transactionId, payload = {}, { signal } = {}) {
  const resolvedTransactionId = ensureId(transactionId, 'transactionId is required to release escrow.');
  return apiClient.post(`/company/escrow/transactions/${resolvedTransactionId}/release`, payload, { signal });
}

export async function refundEscrowTransaction(transactionId, payload = {}, { signal } = {}) {
  const resolvedTransactionId = ensureId(transactionId, 'transactionId is required to refund escrow.');
  return apiClient.post(`/company/escrow/transactions/${resolvedTransactionId}/refund`, payload, { signal });
}

export async function updateEscrowAutomationSettings(payload = {}, { signal } = {}) {
  return apiClient.patch('/company/escrow/automation', payload, { signal });
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
