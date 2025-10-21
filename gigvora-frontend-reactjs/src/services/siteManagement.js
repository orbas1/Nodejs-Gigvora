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

function ensurePayload(payload, name = 'payload') {
  if (payload === undefined || payload === null) {
    return {};
  }
  if (typeof payload !== 'object') {
    throw new Error(`${name} must be an object`);
  }
  return payload;
}

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

export async function fetchSiteManagementOverview(options = {}) {
  const safeOptions = ensureOptions(options);
  return apiClient.get('/admin/site-management', Object.keys(safeOptions).length ? safeOptions : undefined);
}

export async function updateSiteSettings(payload = {}, options) {
  const safePayload = ensurePayload(payload, 'site settings');
  const safeOptions = ensureOptions(options);
  return apiClient.put(
    '/admin/site-management/settings',
    safePayload,
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
}

export async function createSitePage(payload = {}, options) {
  const safePayload = ensurePayload(payload, 'page payload');
  const safeOptions = ensureOptions(options);
  return apiClient.post(
    '/admin/site-management/pages',
    safePayload,
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
}

export async function updateSitePage(pageId, payload = {}, options) {
  const safePageId = encodeURIComponent(ensureIdentifier('pageId', pageId));
  const safePayload = ensurePayload(payload, 'page payload');
  const safeOptions = ensureOptions(options);
  return apiClient.put(
    `/admin/site-management/pages/${safePageId}`,
    safePayload,
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
}

export async function deleteSitePage(pageId, options) {
  const safePageId = encodeURIComponent(ensureIdentifier('pageId', pageId));
  const safeOptions = ensureOptions(options);
  return apiClient.delete(
    `/admin/site-management/pages/${safePageId}`,
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
}

export async function createNavigationLink(payload = {}, options) {
  const safePayload = ensurePayload(payload, 'navigation payload');
  const safeOptions = ensureOptions(options);
  return apiClient.post(
    '/admin/site-management/navigation',
    safePayload,
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
}

export async function updateNavigationLink(linkId, payload = {}, options) {
  const safeLinkId = encodeURIComponent(ensureIdentifier('linkId', linkId));
  const safePayload = ensurePayload(payload, 'navigation payload');
  const safeOptions = ensureOptions(options);
  return apiClient.put(
    `/admin/site-management/navigation/${safeLinkId}`,
    safePayload,
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
}

export async function deleteNavigationLink(linkId, options) {
  const safeLinkId = encodeURIComponent(ensureIdentifier('linkId', linkId));
  const safeOptions = ensureOptions(options);
  return apiClient.delete(
    `/admin/site-management/navigation/${safeLinkId}`,
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
}

export default {
  fetchSiteManagementOverview,
  updateSiteSettings,
  createSitePage,
  updateSitePage,
  deleteSitePage,
  createNavigationLink,
  updateNavigationLink,
  deleteNavigationLink,
};
