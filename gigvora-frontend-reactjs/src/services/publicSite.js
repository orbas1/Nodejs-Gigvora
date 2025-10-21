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

function ensureParams(params = {}) {
  if (params === null || params === undefined) {
    return {};
  }
  if (typeof params !== 'object') {
    throw new Error('Query parameters must be provided as an object.');
  }
  return params;
}

function ensureSlug(slug) {
  const normalised = typeof slug === 'string' ? slug.trim() : `${slug ?? ''}`.trim();
  if (!normalised) {
    throw new Error('slug is required to load a site page');
  }
  return encodeURIComponent(normalised);
}

function mergeRequest(params, options) {
  const safeOptions = ensureOptions(options);
  const requestOptions = { ...safeOptions };
  const safeParams = ensureParams(params);
  if (Object.keys(safeParams).length) {
    requestOptions.params = safeParams;
  }
  return Object.keys(requestOptions).length ? requestOptions : undefined;
}

export async function fetchSiteSettings(options = {}) {
  const response = await apiClient.get('/site/settings', mergeRequest(undefined, options));
  return response?.settings ?? response;
}

export async function fetchSiteNavigation(params = {}, options = {}) {
  const response = await apiClient.get('/site/navigation', mergeRequest(params, options));
  return response?.links ?? response;
}

export async function fetchSitePages(params = {}, options = {}) {
  const response = await apiClient.get('/site/pages', mergeRequest(params, options));
  return response?.pages ?? response;
}

export async function fetchSitePage(slug, params = {}, options = {}) {
  const safeSlug = ensureSlug(slug);
  const response = await apiClient.get(`/site/pages/${safeSlug}`, mergeRequest(params, options));
  return response?.page ?? response;
}

export default {
  fetchSiteSettings,
  fetchSiteNavigation,
  fetchSitePages,
  fetchSitePage,
};
