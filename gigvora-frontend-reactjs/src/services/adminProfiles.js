import { apiClient } from './apiClient.js';
import {
  assertAdminAccess,
  buildAdminCacheKey,
  createRequestOptions,
  encodeIdentifier,
  fetchWithCache,
  invalidateCacheByTag,
  sanitiseQueryParams,
} from './adminServiceHelpers.js';

const PROFILE_ROLES = ['super-admin', 'platform-admin', 'operations-admin', 'profile-admin'];
const CACHE_TAGS = {
  list: 'admin:profiles:list',
};

function normaliseProfileQuery(params = {}) {
  return sanitiseQueryParams({
    status: params.status,
    ownerId: params.ownerId ?? params.owner_id,
    search: params.search,
    page: params.page,
    pageSize: params.pageSize ?? params.page_size,
    sort: params.sort,
  });
}

async function performAndInvalidate(request) {
  const response = await request();
  invalidateCacheByTag(CACHE_TAGS.list);
  return response;
}

export function fetchAdminProfiles(params = {}, options = {}) {
  assertAdminAccess(PROFILE_ROLES);
  const cleanedParams = normaliseProfileQuery(params);
  const { forceRefresh = false, cacheTtl = 60000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:profiles:list', cleanedParams);

  return fetchWithCache(
    cacheKey,
    () => apiClient.get('/admin/profiles', createRequestOptions(requestOptions, cleanedParams)),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.list,
    },
  );
}

export function fetchAdminProfile(profileId, options = {}) {
  assertAdminAccess(PROFILE_ROLES);
  const identifier = encodeIdentifier(profileId, { label: 'profileId' });
  return apiClient.get(`/admin/profiles/${identifier}`, options);
}

export function createAdminProfile(payload, options = {}) {
  assertAdminAccess(PROFILE_ROLES);
  return performAndInvalidate(() => apiClient.post('/admin/profiles', payload, options));
}

export function updateAdminProfile(profileId, payload, options = {}) {
  assertAdminAccess(PROFILE_ROLES);
  const identifier = encodeIdentifier(profileId, { label: 'profileId' });
  return performAndInvalidate(() => apiClient.put(`/admin/profiles/${identifier}`, payload, options));
}

export function createAdminProfileReference(profileId, payload, options = {}) {
  assertAdminAccess(PROFILE_ROLES);
  const identifier = encodeIdentifier(profileId, { label: 'profileId' });
  return performAndInvalidate(() =>
    apiClient.post(`/admin/profiles/${identifier}/references`, payload, options),
  );
}

export function updateAdminProfileReference(profileId, referenceId, payload, options = {}) {
  assertAdminAccess(PROFILE_ROLES);
  const profileIdentifier = encodeIdentifier(profileId, { label: 'profileId' });
  const referenceIdentifier = encodeIdentifier(referenceId, { label: 'referenceId' });
  return performAndInvalidate(() =>
    apiClient.put(
      `/admin/profiles/${profileIdentifier}/references/${referenceIdentifier}`,
      payload,
      options,
    ),
  );
}

export function deleteAdminProfileReference(profileId, referenceId, options = {}) {
  assertAdminAccess(PROFILE_ROLES);
  const profileIdentifier = encodeIdentifier(profileId, { label: 'profileId' });
  const referenceIdentifier = encodeIdentifier(referenceId, { label: 'referenceId' });
  return performAndInvalidate(() =>
    apiClient.delete(
      `/admin/profiles/${profileIdentifier}/references/${referenceIdentifier}`,
      options,
    ),
  );
}

export function createAdminProfileNote(profileId, payload, options = {}) {
  assertAdminAccess(PROFILE_ROLES);
  const identifier = encodeIdentifier(profileId, { label: 'profileId' });
  return performAndInvalidate(() =>
    apiClient.post(`/admin/profiles/${identifier}/notes`, payload, options),
  );
}

export function updateAdminProfileNote(profileId, noteId, payload, options = {}) {
  assertAdminAccess(PROFILE_ROLES);
  const profileIdentifier = encodeIdentifier(profileId, { label: 'profileId' });
  const noteIdentifier = encodeIdentifier(noteId, { label: 'noteId' });
  return performAndInvalidate(() =>
    apiClient.put(
      `/admin/profiles/${profileIdentifier}/notes/${noteIdentifier}`,
      payload,
      options,
    ),
  );
}

export function deleteAdminProfileNote(profileId, noteId, options = {}) {
  assertAdminAccess(PROFILE_ROLES);
  const profileIdentifier = encodeIdentifier(profileId, { label: 'profileId' });
  const noteIdentifier = encodeIdentifier(noteId, { label: 'noteId' });
  return performAndInvalidate(() =>
    apiClient.delete(`/admin/profiles/${profileIdentifier}/notes/${noteIdentifier}`, options),
  );
}

export default {
  fetchAdminProfiles,
  fetchAdminProfile,
  createAdminProfile,
  updateAdminProfile,
  createAdminProfileReference,
  updateAdminProfileReference,
  deleteAdminProfileReference,
  createAdminProfileNote,
  updateAdminProfileNote,
  deleteAdminProfileNote,
};
