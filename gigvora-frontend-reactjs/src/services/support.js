import apiClient from './apiClient.js';

export async function fetchChatwootSession(options = {}) {
  const response = await apiClient.get('/support/chatwoot/session', { signal: options.signal });
  return response?.data ?? response;
}

export default {
  fetchChatwootSession,
};
