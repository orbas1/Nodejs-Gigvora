import { apiClient } from './apiClient.js';

function ensureOptions(options = {}) {
  if (options === null || options === undefined) {
    return {};
  }
  if (typeof options !== 'object') {
    throw new Error('Options must be an object.');
  }
  return options;
}

function ensurePayload(payload) {
  if (payload == null) {
    throw new Error('A payload is required to update SEO settings.');
  }
  if (typeof payload !== 'object') {
    throw new Error('SEO settings payload must be an object.');
  }
  return payload;
}

export async function fetchSeoSettings(options = {}) {
  const requestOptions = ensureOptions(options);
  return apiClient.get('/admin/seo-settings', Object.keys(requestOptions).length ? requestOptions : undefined);
}

export async function updateSeoSettings(payload, options = {}) {
  const body = ensurePayload(payload);
  const requestOptions = ensureOptions(options);
  return apiClient.put('/admin/seo-settings', body, Object.keys(requestOptions).length ? requestOptions : undefined);
}

export default {
  fetchSeoSettings,
  updateSeoSettings,
};
