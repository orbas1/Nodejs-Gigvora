import { apiClient } from './apiClient.js';

export async function fetchStorageOverview(signal) {
  return apiClient.get('/admin/storage/overview', { signal });
}

export async function createStorageLocation(payload) {
  return apiClient.post('/admin/storage/locations', payload);
}

export async function updateStorageLocation(id, payload) {
  if (!id) {
    throw new Error('Storage location id is required');
  }
  return apiClient.put(`/admin/storage/locations/${id}`, payload);
}

export async function deleteStorageLocation(id) {
  if (!id) {
    throw new Error('Storage location id is required');
  }
  return apiClient.delete(`/admin/storage/locations/${id}`);
}

export async function createLifecycleRule(payload) {
  return apiClient.post('/admin/storage/lifecycle-rules', payload);
}

export async function updateLifecycleRule(id, payload) {
  if (!id) {
    throw new Error('Lifecycle rule id is required');
  }
  return apiClient.put(`/admin/storage/lifecycle-rules/${id}`, payload);
}

export async function deleteLifecycleRule(id) {
  if (!id) {
    throw new Error('Lifecycle rule id is required');
  }
  return apiClient.delete(`/admin/storage/lifecycle-rules/${id}`);
}

export async function createUploadPreset(payload) {
  return apiClient.post('/admin/storage/upload-presets', payload);
}

export async function updateUploadPreset(id, payload) {
  if (!id) {
    throw new Error('Upload preset id is required');
  }
  return apiClient.put(`/admin/storage/upload-presets/${id}`, payload);
}

export async function deleteUploadPreset(id) {
  if (!id) {
    throw new Error('Upload preset id is required');
  }
  return apiClient.delete(`/admin/storage/upload-presets/${id}`);
}

export default {
  fetchStorageOverview,
  createStorageLocation,
  updateStorageLocation,
  deleteStorageLocation,
  createLifecycleRule,
  updateLifecycleRule,
  deleteLifecycleRule,
  createUploadPreset,
  updateUploadPreset,
  deleteUploadPreset,
};
