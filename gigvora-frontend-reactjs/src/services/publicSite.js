import { apiClient } from './apiClient.js';

export async function fetchSiteSettings(options = {}) {
  const response = await apiClient.get('/site/settings', options);
  return response?.settings ?? response;
}

export async function fetchSiteNavigation(params = {}, options = {}) {
  const response = await apiClient.get('/site/navigation', { params, ...options });
  return response?.links ?? response;
}

export async function fetchSitePages(params = {}, options = {}) {
  const response = await apiClient.get('/site/pages', { params, ...options });
  return response?.pages ?? response;
}

export async function fetchSitePage(slug, params = {}, options = {}) {
  if (!slug) {
    throw new Error('slug is required to load a site page');
  }
  const response = await apiClient.get(`/site/pages/${slug}`, { params, ...options });
  return response?.page ?? response;
}

export default {
  fetchSiteSettings,
  fetchSiteNavigation,
  fetchSitePages,
  fetchSitePage,
};
