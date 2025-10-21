import apiClient from './apiClient.js';

function ensureOptions(options) {
  if (options === undefined || options === null) {
    return {};
  }
  if (typeof options !== 'object') {
    throw new Error('Options must be an object.');
  }
  return options;
}

export async function fetchChatwootSession(options = {}) {
  const { signal, ...rest } = options ?? {};
  const safeOptions = ensureOptions(rest);
  const requestOptions = { ...safeOptions };
  if (signal) {
    requestOptions.signal = signal;
  }
  const response = await apiClient.get(
    '/support/chatwoot/session',
    Object.keys(requestOptions).length ? requestOptions : undefined,
  );
  return response?.data ?? response;
}

export default {
  fetchChatwootSession,
};
