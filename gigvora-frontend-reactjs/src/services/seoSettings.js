import { apiClient } from './apiClient.js';

function ensureOptions(options) {
  if (options === undefined || options === null) {
    return {};
  }
  if (typeof options !== 'object') {
    throw new Error('Options must be an object.');
  }
  return options;
}

function ensurePayload(payload) {
  if (payload === undefined || payload === null) {
    throw new Error('payload is required');
  }
  if (typeof payload !== 'object') {
    throw new Error('payload must be an object');
  }
  return payload;
}

export async function fetchSeoSettings(options = {}) {
  const safeOptions = ensureOptions(options);
  return apiClient.get('/admin/seo-settings', Object.keys(safeOptions).length ? safeOptions : undefined);
}

export async function updateSeoSettings(payload, options = {}) {
  const safePayload = ensurePayload(payload);
  const safeOptions = ensureOptions(options);
  return apiClient.put(
    '/admin/seo-settings',
    safePayload,
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
}

export default {
  fetchSeoSettings,
  updateSeoSettings,
};
