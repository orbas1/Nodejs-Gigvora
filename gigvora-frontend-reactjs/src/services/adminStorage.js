import { apiClient } from './apiClient.js';
import {
  assertAdminAccess,
  buildAdminCacheKey,
  createRequestOptions,
  encodeIdentifier,
  fetchWithCache,
  invalidateCacheByTag,
} from './adminServiceHelpers.js';

const STORAGE_ROLES = ['super-admin', 'platform-admin', 'operations-admin', 'storage-admin'];
const CACHE_TAG = 'admin:storage:overview';

function normaliseOptions(input) {
  const isAbortSignal = typeof AbortSignal !== 'undefined' && input instanceof AbortSignal;
  if (isAbortSignal) {
    return { options: { signal: input }, forceRefresh: false, cacheTtl: 60000 };
  }

  const { forceRefresh = false, cacheTtl = 60000, ...rest } = input ?? {};
  return { options: rest, forceRefresh, cacheTtl };
}

async function performAndInvalidate(request) {
  const response = await request();
  invalidateCacheByTag(CACHE_TAG);
  return response;
}

export function fetchStorageOverview(input) {
  assertAdminAccess(STORAGE_ROLES);
  const { options = {}, forceRefresh, cacheTtl } = normaliseOptions(input);
  const cacheKey = buildAdminCacheKey('admin:storage:overview');

  return fetchWithCache(
    cacheKey,
    () => apiClient.get('/admin/storage/overview', createRequestOptions(options)),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAG,
    },
  );
}

export function createStorageLocation(payload, options = {}) {
  assertAdminAccess(STORAGE_ROLES);
  return performAndInvalidate(() => apiClient.post('/admin/storage/locations', payload, options));
}

export function updateStorageLocation(id, payload, options = {}) {
  assertAdminAccess(STORAGE_ROLES);
  const identifier = encodeIdentifier(id, { label: 'Storage location id' });
  return performAndInvalidate(() =>
    apiClient.put(`/admin/storage/locations/${identifier}`, payload, options),
  );
}

export function deleteStorageLocation(id, options = {}) {
  assertAdminAccess(STORAGE_ROLES);
  const identifier = encodeIdentifier(id, { label: 'Storage location id' });
  return performAndInvalidate(() =>
    apiClient.delete(`/admin/storage/locations/${identifier}`, options),
  );
}

export function createLifecycleRule(payload, options = {}) {
  assertAdminAccess(STORAGE_ROLES);
  return performAndInvalidate(() => apiClient.post('/admin/storage/lifecycle-rules', payload, options));
}

export function updateLifecycleRule(id, payload, options = {}) {
  assertAdminAccess(STORAGE_ROLES);
  const identifier = encodeIdentifier(id, { label: 'Lifecycle rule id' });
  return performAndInvalidate(() =>
    apiClient.put(`/admin/storage/lifecycle-rules/${identifier}`, payload, options),
  );
}

export function deleteLifecycleRule(id, options = {}) {
  assertAdminAccess(STORAGE_ROLES);
  const identifier = encodeIdentifier(id, { label: 'Lifecycle rule id' });
  return performAndInvalidate(() =>
    apiClient.delete(`/admin/storage/lifecycle-rules/${identifier}`, options),
  );
}

export function createUploadPreset(payload, options = {}) {
  assertAdminAccess(STORAGE_ROLES);
  return performAndInvalidate(() => apiClient.post('/admin/storage/upload-presets', payload, options));
}

export function updateUploadPreset(id, payload, options = {}) {
  assertAdminAccess(STORAGE_ROLES);
  const identifier = encodeIdentifier(id, { label: 'Upload preset id' });
  return performAndInvalidate(() =>
    apiClient.put(`/admin/storage/upload-presets/${identifier}`, payload, options),
  );
}

export function deleteUploadPreset(id, options = {}) {
  assertAdminAccess(STORAGE_ROLES);
  const identifier = encodeIdentifier(id, { label: 'Upload preset id' });
  return performAndInvalidate(() =>
    apiClient.delete(`/admin/storage/upload-presets/${identifier}`, options),
  );
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
