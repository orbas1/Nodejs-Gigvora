import { apiClient } from './apiClient.js';

export async function fetchSiteManagementOverview(options = {}) {
  return apiClient.get('/admin/site-management', options);
}

export async function updateSiteSettings(payload = {}) {
  return apiClient.put('/admin/site-management/settings', payload);
}

export async function createSitePage(payload = {}) {
  return apiClient.post('/admin/site-management/pages', payload);
}

export async function updateSitePage(pageId, payload = {}) {
  if (!pageId) {
    throw new Error('pageId is required');
  }
  return apiClient.put(`/admin/site-management/pages/${pageId}`, payload);
}

export async function deleteSitePage(pageId) {
  if (!pageId) {
    throw new Error('pageId is required');
  }
  return apiClient.delete(`/admin/site-management/pages/${pageId}`);
}

export async function createNavigationLink(payload = {}) {
  return apiClient.post('/admin/site-management/navigation', payload);
}

export async function updateNavigationLink(linkId, payload = {}) {
  if (!linkId) {
    throw new Error('linkId is required');
  }
  return apiClient.put(`/admin/site-management/navigation/${linkId}`, payload);
}

export async function deleteNavigationLink(linkId) {
  if (!linkId) {
    throw new Error('linkId is required');
  }
  return apiClient.delete(`/admin/site-management/navigation/${linkId}`);
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
