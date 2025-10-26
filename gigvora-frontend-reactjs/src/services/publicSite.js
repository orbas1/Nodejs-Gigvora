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

function ensureParams(params) {
  const safeParams = ensureOptions(params);
  return Object.fromEntries(
    Object.entries(safeParams)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]),
  );
}

function ensureSlug(slug) {
  if (slug === undefined || slug === null) {
    throw new Error('slug is required to load a site page');
  }
  const trimmed = `${slug}`.trim();
  if (!trimmed) {
    throw new Error('slug is required to load a site page');
  }
  return trimmed;
}

function normaliseResponse(collectionKey, response) {
  if (!response) {
    return response;
  }
  if (collectionKey && Array.isArray(response[collectionKey])) {
    return response[collectionKey];
  }
  if (collectionKey && Array.isArray(response.data)) {
    return response.data;
  }
  return response[collectionKey] ?? response;
}

export async function fetchSiteSettings(options = {}) {
  const { params, ...rest } = options ?? {};
  const safeOptions = ensureOptions(rest);
  const safeParams = params ? ensureParams(params) : undefined;
  const requestOptions = { ...safeOptions };
  if (safeParams) {
    requestOptions.params = safeParams;
  }
  const response = await apiClient.get(
    '/site/settings',
    Object.keys(requestOptions).length ? requestOptions : undefined,
  );
  return response?.settings ?? response;
}

export async function fetchSiteNavigation(params = {}, options = {}) {
  const safeParams = ensureParams(params);
  const safeOptions = ensureOptions(options);
  const response = await apiClient.get('/site/navigation', { ...safeOptions, params: safeParams });
  return normaliseResponse('links', response);
}

export async function fetchSitePages(params = {}, options = {}) {
  const safeParams = ensureParams(params);
  const safeOptions = ensureOptions(options);
  const response = await apiClient.get('/site/pages', { ...safeOptions, params: safeParams });
  return normaliseResponse('pages', response);
}

export async function fetchSitePage(slug, params = {}, options = {}) {
  const safeSlug = encodeURIComponent(ensureSlug(slug));
  const safeParams = ensureParams(params);
  const safeOptions = ensureOptions(options);
  const response = await apiClient.get(`/site/pages/${safeSlug}`, { ...safeOptions, params: safeParams });
  return response?.page ?? response;
}

export async function submitSitePageFeedback(slug, payload = {}, options = {}) {
  const safeSlug = encodeURIComponent(ensureSlug(slug));
  const safeOptions = ensureOptions(options);
  const allowedRatings = new Set(['yes', 'partially', 'no']);

  const rating = `${payload?.rating ?? ''}`.trim().toLowerCase();
  if (!rating) {
    throw new Error('rating is required to submit feedback');
  }
  if (!allowedRatings.has(rating)) {
    throw new Error('rating must be one of yes, partially, or no');
  }

  const body = { rating };
  const message = payload?.message != null ? `${payload.message}`.trim() : '';
  if (message) {
    body.message = message.slice(0, 2000);
  }

  const requestOptions = {};
  if (safeOptions.signal) {
    requestOptions.signal = safeOptions.signal;
  }
  if (safeOptions.headers) {
    requestOptions.headers = safeOptions.headers;
  }
  if (safeOptions.params) {
    requestOptions.params = ensureParams(safeOptions.params);
  }

  const response = await apiClient.post(
    `/site/pages/${safeSlug}/feedback`,
    body,
    Object.keys(requestOptions).length ? requestOptions : undefined,
  );
  return response?.feedback ?? response;
}

export default {
  fetchSiteSettings,
  fetchSiteNavigation,
  fetchSitePages,
  fetchSitePage,
  submitSitePageFeedback,
};
