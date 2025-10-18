import { apiClient } from './apiClient.js';

export async function fetchAppearanceSummary(options = {}) {
  return apiClient.get('/admin/appearance', options);
}

export async function createAppearanceTheme(payload) {
  return apiClient.post('/admin/appearance/themes', payload);
}

export async function updateAppearanceTheme(themeId, payload) {
  if (!themeId) {
    throw new Error('themeId is required');
  }
  return apiClient.put(`/admin/appearance/themes/${themeId}`, payload);
}

export async function activateAppearanceTheme(themeId) {
  if (!themeId) {
    throw new Error('themeId is required');
  }
  return apiClient.post(`/admin/appearance/themes/${themeId}/activate`);
}

export async function deleteAppearanceTheme(themeId) {
  if (!themeId) {
    throw new Error('themeId is required');
  }
  return apiClient.delete(`/admin/appearance/themes/${themeId}`);
}

export async function createAppearanceAsset(payload) {
  return apiClient.post('/admin/appearance/assets', payload);
}

export async function updateAppearanceAsset(assetId, payload) {
  if (!assetId) {
    throw new Error('assetId is required');
  }
  return apiClient.put(`/admin/appearance/assets/${assetId}`, payload);
}

export async function deleteAppearanceAsset(assetId) {
  if (!assetId) {
    throw new Error('assetId is required');
  }
  return apiClient.delete(`/admin/appearance/assets/${assetId}`);
}

export async function createAppearanceLayout(payload) {
  return apiClient.post('/admin/appearance/layouts', payload);
}

export async function updateAppearanceLayout(layoutId, payload) {
  if (!layoutId) {
    throw new Error('layoutId is required');
  }
  return apiClient.put(`/admin/appearance/layouts/${layoutId}`, payload);
}

export async function publishAppearanceLayout(layoutId, payload) {
  if (!layoutId) {
    throw new Error('layoutId is required');
  }
  return apiClient.post(`/admin/appearance/layouts/${layoutId}/publish`, payload);
}

export async function deleteAppearanceLayout(layoutId) {
  if (!layoutId) {
    throw new Error('layoutId is required');
  }
  return apiClient.delete(`/admin/appearance/layouts/${layoutId}`);
}

export default {
  fetchAppearanceSummary,
  createAppearanceTheme,
  updateAppearanceTheme,
  activateAppearanceTheme,
  deleteAppearanceTheme,
  createAppearanceAsset,
  updateAppearanceAsset,
  deleteAppearanceAsset,
  createAppearanceLayout,
  updateAppearanceLayout,
  publishAppearanceLayout,
  deleteAppearanceLayout,
};
