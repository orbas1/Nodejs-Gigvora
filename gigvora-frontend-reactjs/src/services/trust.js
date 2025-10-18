import apiClient from './apiClient.js';

function normalizePagination(raw = {}, params = {}) {
  const page = Number(raw.page ?? params.page ?? 1);
  const pageSize = Number(raw.pageSize ?? params.pageSize ?? 25);
  const totalItems = Number(raw.totalItems ?? raw.total ?? raw.count ?? 0);
  const totalPages = Number(
    raw.totalPages ?? raw.totalPage ?? (pageSize > 0 ? Math.ceil(totalItems / pageSize) || 1 : 1),
  );

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}

function normalizeSummary(raw) {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  return { ...raw };
}

async function requestDisputes(params = {}, options = {}) {
  const response = await apiClient.get('/trust/disputes', { ...options, params });
  const disputes = Array.isArray(response?.disputes) ? response.disputes : [];
  const pagination = normalizePagination(response?.pagination, params);
  const summary = normalizeSummary(response?.summary ?? response?.totals);

  return {
    response,
    disputes,
    pagination,
    summary,
  };
}

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
  const response = await apiClient.patch(`/trust/escrow/transactions/${transactionId}`, payload, options);
  return response.transaction;
}

export async function releaseEscrow(transactionId, payload = {}, options = {}) {
  const response = await apiClient.post(
    `/trust/escrow/transactions/${transactionId}/release`,
    payload,
    options,
  );
  return response.transaction;
}

export async function refundEscrow(transactionId, payload = {}, options = {}) {
  const response = await apiClient.post(
    `/trust/escrow/transactions/${transactionId}/refund`,
    payload,
    options,
  );
  return response.transaction;
}

export async function createDispute(payload, options = {}) {
  const response = await apiClient.post('/trust/disputes', payload, options);
  return response.dispute;
}

export async function appendDisputeEvent(disputeId, payload, options = {}) {
  const response = await apiClient.post(`/trust/disputes/${disputeId}/events`, payload, options);
  return response.event ?? response;
}

export async function fetchDisputeCases(params = {}, options = {}) {
  const { disputes, pagination, summary } = await requestDisputes(params, options);
  return {
    items: disputes,
    summary,
    pagination,
  };
}

export async function fetchDisputes(params = {}, options = {}) {
  const { disputes, pagination, summary, response } = await requestDisputes(params, options);
  return {
    disputes,
    pagination,
    summary,
    totals: normalizeSummary(response?.totals ?? summary),
  };
}

export async function fetchDisputeCase(disputeId, options = {}) {
  const response = await apiClient.get(`/trust/disputes/${disputeId}`, options);
  return response.dispute;
}

export async function fetchDispute(disputeId, options = {}) {
  return fetchDisputeCase(disputeId, options);
}

export async function updateDisputeCase(disputeId, payload, options = {}) {
  const response = await apiClient.patch(`/trust/disputes/${disputeId}`, payload, options);
  return response.dispute;
}

export async function updateDispute(disputeId, payload, options = {}) {
  return updateDisputeCase(disputeId, payload, options);
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
  fetchDisputes,
  fetchDisputeCase,
  fetchDispute,
  updateDisputeCase,
  updateDispute,
  fetchDisputeSettings,
  updateDisputeSettings,
  fetchDisputeTemplates,
  createDisputeTemplate,
  updateDisputeTemplate,
  deleteDisputeTemplate,
};
