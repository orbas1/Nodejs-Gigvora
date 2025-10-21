import apiClient from './apiClient.js';

function ensureOptions(options = {}) {
  if (options === null || options === undefined) {
    return {};
  }
  if (typeof options !== 'object') {
    throw new Error('Options must be an object.');
  }
  return options;
}

function ensurePayload(payload, { allowEmpty = false } = {}) {
  if (payload == null) {
    if (allowEmpty) {
      return {};
    }
    throw new Error('Payload is required.');
  }
  if (typeof payload !== 'object') {
    throw new Error('Payload must be an object.');
  }
  return payload;
}

export async function fetchChatwootSession(options = {}) {
  const { signal, headers } = ensureOptions(options);
  const requestOptions = {};
  if (signal) {
    requestOptions.signal = signal;
  }
  if (headers) {
    requestOptions.headers = headers;
  }
  const response = await apiClient.get('/support/chatwoot/session', Object.keys(requestOptions).length ? requestOptions : undefined);
  return response?.data ?? response;
}

export async function startChatSession(payload = {}, options = {}) {
  const body = ensurePayload(payload, { allowEmpty: true });
  return apiClient.post('/support/chatwoot/session', body, ensureOptions(options));
}

export async function createSupportTicket(payload, options = {}) {
  const body = ensurePayload(payload);
  if (!body.subject || !body.message) {
    throw new Error('Support tickets require both subject and message fields.');
  }
  return apiClient.post('/support/tickets', body, ensureOptions(options));
}

export async function fetchSupportCategories(options = {}) {
  const requestOptions = ensureOptions(options);
  return apiClient.get('/support/categories', Object.keys(requestOptions).length ? requestOptions : undefined);
}

export default {
  fetchChatwootSession,
  startChatSession,
  createSupportTicket,
  fetchSupportCategories,
};
