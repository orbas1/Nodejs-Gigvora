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

function ensurePayload(payload, { allowEmpty = true } = {}) {
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

function ensureIdentifier(name, value) {
  const normalised = value === undefined || value === null ? '' : `${value}`.trim();
  if (!normalised) {
    throw new Error(`${name} is required`);
  }
  return encodeURIComponent(normalised);
}

function withOptions(options) {
  const safeOptions = ensureOptions(options);
  return Object.keys(safeOptions).length ? safeOptions : undefined;
}

export async function fetchSiteManagementOverview(options = {}) {
  return apiClient.get('/admin/site-management', withOptions(options));
}

export async function updateSiteSettings(payload = {}, options = {}) {
  return apiClient.put('/admin/site-management/settings', ensurePayload(payload), withOptions(options));
}

export async function createSitePage(payload = {}, options = {}) {
  return apiClient.post('/admin/site-management/pages', ensurePayload(payload), withOptions(options));
}

export async function updateSitePage(pageId, payload = {}, options = {}) {
  const safePageId = ensureIdentifier('pageId', pageId);
  return apiClient.put(`/admin/site-management/pages/${safePageId}`, ensurePayload(payload), withOptions(options));
}

export async function deleteSitePage(pageId, options = {}) {
  const safePageId = ensureIdentifier('pageId', pageId);
  return apiClient.delete(`/admin/site-management/pages/${safePageId}`, withOptions(options));
}

export async function createNavigationLink(payload = {}, options = {}) {
  return apiClient.post('/admin/site-management/navigation', ensurePayload(payload), withOptions(options));
}

export async function updateNavigationLink(linkId, payload = {}, options = {}) {
  const safeLinkId = ensureIdentifier('linkId', linkId);
  const body = ensurePayload(payload, { allowEmpty: false });
  return apiClient.put(`/admin/site-management/navigation/${safeLinkId}`, body, withOptions(options));
}

export async function deleteNavigationLink(linkId, options = {}) {
  const safeLinkId = ensureIdentifier('linkId', linkId);
  return apiClient.delete(`/admin/site-management/navigation/${safeLinkId}`, withOptions(options));
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
