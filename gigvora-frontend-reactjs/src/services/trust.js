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
  const response = await apiClient.get('/trust/disputes', { ...options, params });
  const items = Array.isArray(response.items)
    ? response.items
    : Array.isArray(response.disputes)
    ? response.disputes
    : [];

  const fallbackPageSize = items.length > 0 ? items.length : 25;
  const pagination = response.pagination ?? response.meta ?? {
    page: Number(params.page ?? 1),
    pageSize: Number(params.pageSize ?? fallbackPageSize),
    totalItems: response.totalItems ?? items.length,
    totalPages: response.totalPages ?? 1,
  };

  const summary = response.summary ?? response.totals ?? {};
  const filters = response.filters ?? {};

  return {
    ...response,
    items,
    disputes: items,
    summary,
    totals: response.totals ?? summary,
    pagination,
    filters,
  };
}

export async function fetchDisputeCases(params = {}, options = {}) {
  return fetchDisputes(params, options);
}

export async function fetchDisputeCase(disputeId, options = {}) {
  const response = await apiClient.get(`/trust/disputes/${disputeId}`, options);
  return response.dispute;
}

export async function fetchDispute(disputeId, options = {}) {
  return fetchDisputeCase(disputeId, options);
}

export async function updateDispute(disputeId, payload, options = {}) {
  const response = await apiClient.patch(`/trust/disputes/${disputeId}`, payload, options);
  return response.dispute;
}

export async function updateDisputeCase(disputeId, payload, options = {}) {
  return updateDispute(disputeId, payload, options);
}

export async function fetchDisputeSettings(params = {}, options = {}) {
  const response = await apiClient.get('/trust/disputes/settings', { ...options, params });
  return response.settings;
}

export async function updateDisputeSettings(payload, options = {}) {
  const response = await apiClient.put('/trust/disputes/settings', payload, options);
  return response.settings;
}

export async function fetchDisputeTemplates(params = {}, options = {}) {
  const response = await apiClient.get('/trust/disputes/templates', { ...options, params });
  return response.templates;
}

export async function createDisputeTemplate(payload, options = {}) {
  const response = await apiClient.post('/trust/disputes/templates', payload, options);
  return response.template;
}

export async function updateDisputeTemplate(templateId, payload, options = {}) {
  const response = await apiClient.patch(`/trust/disputes/templates/${templateId}`, payload, options);
  return response.template;
}

export async function deleteDisputeTemplate(templateId, options = {}) {
  return apiClient.delete(`/trust/disputes/templates/${templateId}`, options);
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
  fetchDisputeCases,
  fetchDisputeCase,
  updateDisputeCase,
  fetchDisputes,
  fetchDispute,
  updateDispute,
  fetchDisputeSettings,
  updateDisputeSettings,
  fetchDisputeTemplates,
  createDisputeTemplate,
  updateDisputeTemplate,
  deleteDisputeTemplate,
};
