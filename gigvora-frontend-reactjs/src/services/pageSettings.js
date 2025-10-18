import { apiClient } from './apiClient.js';

export async function listPageSettings(params = {}) {
  return apiClient.get('/admin/page-settings', { params });
}

export async function createPageSetting(payload) {
  return apiClient.post('/admin/page-settings', payload);
}

export async function updatePageSetting(pageId, payload) {
  return apiClient.put(`/admin/page-settings/${encodeURIComponent(pageId)}`, payload);
}

export async function deletePageSetting(pageId) {
  return apiClient.delete(`/admin/page-settings/${encodeURIComponent(pageId)}`);
}

export default {
  listPageSettings,
  createPageSetting,
  updatePageSetting,
  deletePageSetting,
};
