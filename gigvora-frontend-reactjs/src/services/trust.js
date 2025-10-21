import apiClient from './apiClient.js';

const TRUST_BASE_PATH = '/trust';

function ensureIdentifier(name, value) {
  if (value === undefined || value === null) {
    throw new Error(`${name} is required`);
  }
  const trimmed = `${value}`.trim();
  if (!trimmed) {
    throw new Error(`${name} is required`);
  }
  return trimmed;
}

function ensureOptions(options) {
  if (options === undefined || options === null) {
    return {};
  }
  if (typeof options !== 'object') {
    throw new Error('Options must be an object.');
  }
  return options;
}

function normalisePayload(payload, { allowEmpty = true, name = 'payload' } = {}) {
  if (payload === undefined || payload === null) {
    if (allowEmpty) {
      return {};
    }
    throw new Error(`${name} is required`);
  }
  if (typeof payload !== 'object') {
    throw new Error(`${name} must be an object.`);
  }
  return payload;
}

function buildPath(...segments) {
  const safeSegments = segments
    .filter((segment) => segment !== undefined && segment !== null)
    .map((segment) => `${segment}`.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment));
  const suffix = safeSegments.length ? `/${safeSegments.join('/')}` : '';
  return `${TRUST_BASE_PATH}${suffix}`;
}

function mergeOptions(options, overrides = {}) {
  const safeOptions = ensureOptions(options);
  const merged = { ...safeOptions, ...overrides };
  return merged;
}

export async function fetchTrustOverview(options = {}) {
  const response = await apiClient.get(buildPath('overview'), mergeOptions(options));
  return response?.overview ?? response;
}

export async function createEscrowAccount(payload, options = {}) {
  const response = await apiClient.post(
    buildPath('escrow', 'accounts'),
    normalisePayload(payload, { name: 'Escrow account payload' }),
    mergeOptions(options),
  );
  return response.account ?? response;
}

export async function updateEscrowAccount(accountId, payload, options = {}) {
  const response = await apiClient.patch(
    buildPath('escrow', 'accounts', ensureIdentifier('accountId', accountId)),
    normalisePayload(payload, { name: 'Escrow account payload' }),
    mergeOptions(options),
  );
  return response.account ?? response;
}

export async function initiateEscrowTransaction(payload, options = {}) {
  const response = await apiClient.post(
    buildPath('escrow', 'transactions'),
    normalisePayload(payload, { name: 'Escrow transaction payload' }),
    mergeOptions(options),
  );
  return response.transaction ?? response;
}

export async function updateEscrowTransaction(transactionId, payload, options = {}) {
  const response = await apiClient.patch(
    buildPath('escrow', 'transactions', ensureIdentifier('transactionId', transactionId)),
    normalisePayload(payload, { name: 'Escrow transaction payload' }),
    mergeOptions(options),
  );
  return response.transaction ?? response;
}

export async function releaseEscrow(transactionId, payload = {}, options = {}) {
  const response = await apiClient.post(
    buildPath('escrow', 'transactions', ensureIdentifier('transactionId', transactionId), 'release'),
    normalisePayload(payload, { name: 'Escrow release payload' }),
    mergeOptions(options),
  );
  return response.transaction ?? response;
}

export async function refundEscrow(transactionId, payload = {}, options = {}) {
  const response = await apiClient.post(
    buildPath('escrow', 'transactions', ensureIdentifier('transactionId', transactionId), 'refund'),
    normalisePayload(payload, { name: 'Escrow refund payload' }),
    mergeOptions(options),
  );
  return response.transaction ?? response;
}

export async function createDispute(payload, options = {}) {
  const response = await apiClient.post(
    buildPath('disputes'),
    normalisePayload(payload, { name: 'Dispute payload' }),
    mergeOptions(options),
  );
  return response.dispute ?? response;
}

export async function appendDisputeEvent(disputeId, payload, options = {}) {
  return apiClient.post(
    buildPath('disputes', ensureIdentifier('disputeId', disputeId), 'events'),
    normalisePayload(payload, { name: 'Dispute event payload' }),
    mergeOptions(options),
  );
}

function normaliseDisputeParams(params = {}) {
  const safeParams = ensureOptions(params);
  return Object.fromEntries(
    Object.entries(safeParams)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return [key, value.map((item) => (typeof item === 'string' ? item.trim() : item)).filter(Boolean).join(',')];
        }
        if (typeof value === 'string') {
          return [key, value.trim()];
        }
        return [key, value];
      }),
  );
}

export async function fetchDisputes(params = {}, options = {}) {
  const safeParams = normaliseDisputeParams(params);
  const response = await apiClient.get(
    buildPath('disputes'),
    mergeOptions(options, { params: safeParams }),
  );
  const items = Array.isArray(response?.items)
    ? response.items
    : Array.isArray(response?.disputes)
    ? response.disputes
    : [];

  const fallbackPageSize = items.length > 0 ? items.length : 25;
  const pagination = response?.pagination ?? response?.meta ?? {
    page: Number(safeParams.page ?? 1),
    pageSize: Number(safeParams.pageSize ?? fallbackPageSize),
    totalItems: response?.totalItems ?? items.length,
    totalPages: response?.totalPages ?? 1,
  };

  const summary = response?.summary ?? response?.totals ?? {};
  const filters = response?.filters ?? {};

  return {
    ...response,
    items,
    disputes: items,
    summary,
    totals: response?.totals ?? summary,
    pagination,
    filters,
  };
}

export async function fetchDisputeCases(params = {}, options = {}) {
  return fetchDisputes(params, options);
}

export async function fetchDisputeCase(disputeId, options = {}) {
  const response = await apiClient.get(
    buildPath('disputes', ensureIdentifier('disputeId', disputeId)),
    mergeOptions(options),
  );
  return response.dispute ?? response;
}

export async function fetchDispute(disputeId, options = {}) {
  return fetchDisputeCase(disputeId, options);
}

export async function updateDispute(disputeId, payload, options = {}) {
  const response = await apiClient.patch(
    buildPath('disputes', ensureIdentifier('disputeId', disputeId)),
    normalisePayload(payload, { name: 'Dispute payload' }),
    mergeOptions(options),
  );
  return response.dispute ?? response;
}

export async function updateDisputeCase(disputeId, payload, options = {}) {
  return updateDispute(disputeId, payload, options);
}

export async function fetchDisputeSettings(params = {}, options = {}) {
  const safeParams = normaliseDisputeParams(params);
  const response = await apiClient.get(
    buildPath('disputes', 'settings'),
    mergeOptions(options, { params: safeParams }),
  );
  return response.settings ?? response;
}

export async function updateDisputeSettings(payload, options = {}) {
  const response = await apiClient.put(
    buildPath('disputes', 'settings'),
    normalisePayload(payload, { name: 'Dispute settings payload' }),
    mergeOptions(options),
  );
  return response.settings ?? response;
}

export async function fetchDisputeTemplates(params = {}, options = {}) {
  const safeParams = normaliseDisputeParams(params);
  const response = await apiClient.get(
    buildPath('disputes', 'templates'),
    mergeOptions(options, { params: safeParams }),
  );
  return response.templates ?? response;
}

export async function createDisputeTemplate(payload, options = {}) {
  const response = await apiClient.post(
    buildPath('disputes', 'templates'),
    normalisePayload(payload, { name: 'Dispute template payload' }),
    mergeOptions(options),
  );
  return response.template ?? response;
}

export async function updateDisputeTemplate(templateId, payload, options = {}) {
  const response = await apiClient.patch(
    buildPath('disputes', 'templates', ensureIdentifier('templateId', templateId)),
    normalisePayload(payload, { name: 'Dispute template payload' }),
    mergeOptions(options),
  );
  return response.template ?? response;
}

export async function deleteDisputeTemplate(templateId, options = {}) {
  return apiClient.delete(
    buildPath('disputes', 'templates', ensureIdentifier('templateId', templateId)),
    mergeOptions(options),
  );
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
