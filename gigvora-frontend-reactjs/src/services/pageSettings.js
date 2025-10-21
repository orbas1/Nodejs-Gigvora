import { apiClient } from './apiClient.js';

function requirePageId(pageId, action) {
  if (!pageId) {
    throw new Error(`pageId is required to ${action} a page setting.`);
  }
  return encodeURIComponent(pageId);
}

export async function listPageSettings(params = {}, { signal } = {}) {
  return apiClient.get('/admin/page-settings', { params, signal });
}

export async function createPageSetting(payload, { signal } = {}) {
  if (!payload?.pageId) {
    throw new Error('pageId is required to create a page setting.');
  }
  return apiClient.post('/admin/page-settings', payload, { signal });
}

export async function updatePageSetting(pageId, payload, { signal } = {}) {
  const id = requirePageId(pageId, 'update');
  return apiClient.put(`/admin/page-settings/${id}`, payload, { signal });
}

export async function deletePageSetting(pageId, { signal } = {}) {
  const id = requirePageId(pageId, 'delete');
  return apiClient.delete(`/admin/page-settings/${id}`, { signal });
}

export default {
  listPageSettings,
  createPageSetting,
  updatePageSetting,
  deletePageSetting,
};
