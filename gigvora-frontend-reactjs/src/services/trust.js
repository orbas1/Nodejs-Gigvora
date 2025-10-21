import apiClient from './apiClient.js';

function ensureString(value) {
  if (value === undefined || value === null) {
    return '';
  }
  return `${value}`.trim();
}

function ensureIdentifier(name, value) {
  const normalised = ensureString(value);
  if (!normalised) {
    throw new Error(`${name} is required`);
  }
  return encodeURIComponent(normalised);
}

function ensureOptions(options = {}) {
  if (options === null || options === undefined) {
    return {};
  }
  if (typeof options !== 'object') {
    throw new Error('Options must be provided as an object.');
  }
  return options;
}

function ensurePayload(payload, { allowEmpty = false } = {}) {
  if (payload == null) {
    if (allowEmpty) {
      return {};
    }
    throw new Error('Payload must be provided.');
  }
  if (typeof payload !== 'object') {
    throw new Error('Payload must be an object.');
  }
  return payload;
}

function unwrap(response, key) {
  if (!key) {
    return response;
  }
  return response?.[key] ?? response;
}

function buildPath(...segments) {
  const encodedSegments = segments
    .filter((segment) => segment !== undefined && segment !== null)
    .map((segment) => ensureString(segment))
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment));
  return `/trust${encodedSegments.length ? `/${encodedSegments.join('/')}` : ''}`;
}

function request(method, segments, { payload, options, allowEmptyPayload = false, unwrapKey } = {}) {
  const path = buildPath(...segments);
  const safeOptions = ensureOptions(options);

  if (method === 'get') {
    return apiClient.get(path, Object.keys(safeOptions).length ? safeOptions : undefined);
  }

  if (method === 'delete') {
    return apiClient.delete(path, Object.keys(safeOptions).length ? safeOptions : undefined);
  }

  const client = apiClient[method];
  if (typeof client !== 'function') {
    throw new Error(`Unsupported method: ${method}`);
  }
  const body = ensurePayload(payload, { allowEmpty: allowEmptyPayload });
  return client(path, body, Object.keys(safeOptions).length ? safeOptions : undefined);
}

export async function fetchTrustOverview(options = {}) {
  const response = await request('get', ['overview'], { options });
  return unwrap(response, 'overview');
}

export async function createEscrowAccount(payload, options = {}) {
  const response = await request('post', ['escrow', 'accounts'], { payload, options });
  return unwrap(response, 'account');
}

export async function updateEscrowAccount(accountId, payload, options = {}) {
  const response = await request('patch', ['escrow', 'accounts', ensureIdentifier('accountId', accountId)], {
    payload,
    options,
  });
  return unwrap(response, 'account');
}

export async function initiateEscrowTransaction(payload, options = {}) {
  const response = await request('post', ['escrow', 'transactions'], { payload, options });
  return unwrap(response, 'transaction');
}

export async function updateEscrowTransaction(transactionId, payload, options = {}) {
  const response = await request(
    'patch',
    ['escrow', 'transactions', ensureIdentifier('transactionId', transactionId)],
    { payload, options },
  );
  return unwrap(response, 'transaction');
}

export async function releaseEscrow(transactionId, payload = {}, options = {}) {
  const response = await request(
    'post',
    ['escrow', 'transactions', ensureIdentifier('transactionId', transactionId), 'release'],
    { payload, options, allowEmptyPayload: true },
  );
  return unwrap(response, 'transaction');
}

export async function refundEscrow(transactionId, payload = {}, options = {}) {
  const response = await request(
    'post',
    ['escrow', 'transactions', ensureIdentifier('transactionId', transactionId), 'refund'],
    { payload, options, allowEmptyPayload: true },
  );
  return unwrap(response, 'transaction');
}

export async function createDispute(payload, options = {}) {
  const response = await request('post', ['disputes'], { payload, options });
  return unwrap(response, 'dispute');
}

export async function appendDisputeEvent(disputeId, payload, options = {}) {
  return request(
    'post',
    ['disputes', ensureIdentifier('disputeId', disputeId), 'events'],
    { payload, options },
  );
}

function normaliseQuery(params = {}) {
  if (params === null || params === undefined) {
    return {};
  }
  if (typeof params !== 'object') {
    throw new Error('Query parameters must be an object.');
  }
  const safe = { ...params };
  if (safe.page !== undefined) {
    const page = Number.parseInt(safe.page, 10);
    safe.page = Number.isFinite(page) && page > 0 ? page : 1;
  }
  if (safe.pageSize !== undefined) {
    const size = Number.parseInt(safe.pageSize, 10);
    safe.pageSize = Number.isFinite(size) && size > 0 ? size : undefined;
  }
  return safe;
}

export async function fetchDisputes(params = {}, options = {}) {
  const safeOptions = ensureOptions(options);
  const safeParams = normaliseQuery(params);
  const response = await apiClient.get('/trust/disputes', {
    ...safeOptions,
    params: safeParams,
  });

  const items = Array.isArray(response?.items)
    ? response.items
    : Array.isArray(response?.disputes)
    ? response.disputes
    : [];

  const fallbackPageSize = items.length > 0 ? items.length : 25;
  const pagination = response?.pagination ?? response?.meta ?? {
    page: safeParams.page ?? 1,
    pageSize: safeParams.pageSize ?? fallbackPageSize,
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
  const response = await request('get', ['disputes', ensureIdentifier('disputeId', disputeId)], { options });
  return unwrap(response, 'dispute');
}

export async function fetchDispute(disputeId, options = {}) {
  return fetchDisputeCase(disputeId, options);
}

export async function updateDispute(disputeId, payload, options = {}) {
  const response = await request('patch', ['disputes', ensureIdentifier('disputeId', disputeId)], { payload, options });
  return unwrap(response, 'dispute');
}

export async function updateDisputeCase(disputeId, payload, options = {}) {
  return updateDispute(disputeId, payload, options);
}

export async function fetchDisputeSettings(params = {}, options = {}) {
  const safeOptions = ensureOptions(options);
  const safeParams = normaliseQuery(params);
  const response = await apiClient.get('/trust/disputes/settings', {
    ...safeOptions,
    params: safeParams,
  });
  return unwrap(response, 'settings');
}

export async function updateDisputeSettings(payload, options = {}) {
  const response = await request('put', ['disputes', 'settings'], { payload, options });
  return unwrap(response, 'settings');
}

export async function fetchDisputeTemplates(params = {}, options = {}) {
  const safeOptions = ensureOptions(options);
  const safeParams = normaliseQuery(params);
  const response = await apiClient.get('/trust/disputes/templates', {
    ...safeOptions,
    params: safeParams,
  });
  return unwrap(response, 'templates');
}

export async function createDisputeTemplate(payload, options = {}) {
  const response = await request('post', ['disputes', 'templates'], {
    payload,
    options,
    allowEmptyPayload: true,
  });
  return unwrap(response, 'template');
}

export async function updateDisputeTemplate(templateId, payload, options = {}) {
  const response = await request('patch', ['disputes', 'templates', ensureIdentifier('templateId', templateId)], {
    payload,
    options,
  });
  return unwrap(response, 'template');
}

export async function deleteDisputeTemplate(templateId, options = {}) {
  return request('delete', ['disputes', 'templates', ensureIdentifier('templateId', templateId)], { options });
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
