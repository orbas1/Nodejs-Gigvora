import { apiClient } from './apiClient.js';

export async function fetchAdminMobileApps(params = {}) {
  const response = await apiClient.get('/admin/mobile-apps', { params });
  const apps = Array.isArray(response?.apps) ? response.apps : [];
  const summary = response?.summary ?? {};
  return { apps, summary };
}

export async function createAdminMobileApp(payload = {}) {
  return apiClient.post('/admin/mobile-apps', payload);
}

export async function updateAdminMobileApp(appId, payload = {}) {
  if (!appId) {
    throw new Error('appId is required');
  }
  return apiClient.put(`/admin/mobile-apps/${appId}`, payload);
}

export async function createAdminMobileAppVersion(appId, payload = {}) {
  if (!appId) {
    throw new Error('appId is required');
  }
  return apiClient.post(`/admin/mobile-apps/${appId}/versions`, payload);
}

export async function updateAdminMobileAppVersion(appId, versionId, payload = {}) {
  if (!appId || !versionId) {
    throw new Error('appId and versionId are required');
  }
  return apiClient.put(`/admin/mobile-apps/${appId}/versions/${versionId}`, payload);
}

export async function createAdminMobileAppFeature(appId, payload = {}) {
  if (!appId) {
    throw new Error('appId is required');
  }
  return apiClient.post(`/admin/mobile-apps/${appId}/features`, payload);
}

export async function updateAdminMobileAppFeature(appId, featureId, payload = {}) {
  if (!appId || !featureId) {
    throw new Error('appId and featureId are required');
  }
  return apiClient.put(`/admin/mobile-apps/${appId}/features/${featureId}`, payload);
}

export async function deleteAdminMobileAppFeature(appId, featureId) {
  if (!appId || !featureId) {
    throw new Error('appId and featureId are required');
  }
  return apiClient.delete(`/admin/mobile-apps/${appId}/features/${featureId}`);
}

export default {
  fetchAdminMobileApps,
  createAdminMobileApp,
  updateAdminMobileApp,
  createAdminMobileAppVersion,
  updateAdminMobileAppVersion,
  createAdminMobileAppFeature,
  updateAdminMobileAppFeature,
  deleteAdminMobileAppFeature,
};
