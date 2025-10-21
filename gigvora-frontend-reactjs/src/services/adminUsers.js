import { apiClient } from './apiClient.js';
import {
  assertAdminAccess,
  buildAdminCacheKey,
  createRequestOptions,
  encodeIdentifier,
  fetchWithCache,
  invalidateCacheByTag,
  normaliseIdentifier,
  sanitiseQueryParams,
} from './adminServiceHelpers.js';

const USER_ROLES = ['super-admin', 'platform-admin', 'operations-admin', 'user-admin'];
const CACHE_TAGS = {
  directory: 'admin:users:directory',
  metadata: 'admin:users:metadata',
  user: (identifier) => `admin:users:${identifier}`,
};

function buildDirectoryParams(params = {}) {
  return sanitiseQueryParams({
    status: params.status,
    role: params.role,
    search: params.search,
    page: params.page,
    pageSize: params.pageSize ?? params.page_size,
    sort: params.sort,
  });
}

function userCache(userId) {
  const identifier = normaliseIdentifier(userId, { label: 'userId' });
  return {
    key: buildAdminCacheKey('admin:users:detail', { userId: identifier }),
    tag: CACHE_TAGS.user(identifier),
  };
}

async function performDirectoryMutation(userId, request) {
  const response = await request();
  const tags = [CACHE_TAGS.directory, CACHE_TAGS.metadata];
  if (userId) {
    const identifier = normaliseIdentifier(userId, { label: 'userId' });
    tags.push(CACHE_TAGS.user(identifier));
  }
  invalidateCacheByTag(tags);
  return response;
}

export function fetchDirectory(params = {}, options = {}) {
  assertAdminAccess(USER_ROLES);
  const cleanedParams = buildDirectoryParams(params);
  const { forceRefresh = false, cacheTtl = 60000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:users:directory', cleanedParams);

  return fetchWithCache(
    cacheKey,
    () => apiClient.get('/admin/users', createRequestOptions(requestOptions, cleanedParams)),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.directory,
    },
  );
}

export function fetchMetadata(options = {}) {
  assertAdminAccess(USER_ROLES);
  const { forceRefresh = false, cacheTtl = 10 * 60 * 1000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:users:metadata');

  return fetchWithCache(
    cacheKey,
    () => apiClient.get('/admin/users/meta', createRequestOptions(requestOptions)),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.metadata,
    },
  );
}

export function fetchUser(userId, options = {}) {
  assertAdminAccess(USER_ROLES);
  const { forceRefresh = false, cacheTtl = 60000, ...requestOptions } = options ?? {};
  const { key, tag } = userCache(userId);
  const identifier = encodeIdentifier(userId, { label: 'userId' });

  return fetchWithCache(
    key,
    () => apiClient.get(`/admin/users/${identifier}`, createRequestOptions(requestOptions)),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag,
    },
  );
}

export function createUser(payload, options = {}) {
  assertAdminAccess(USER_ROLES);
  return performDirectoryMutation(null, () => apiClient.post('/admin/users', payload, options));
}

export function updateUser(userId, payload, options = {}) {
  assertAdminAccess(USER_ROLES);
  const identifier = encodeIdentifier(userId, { label: 'userId' });
  return performDirectoryMutation(userId, () =>
    apiClient.patch(`/admin/users/${identifier}`, payload, options),
  );
}

export function updateSecurity(userId, payload, options = {}) {
  assertAdminAccess(USER_ROLES);
  const identifier = encodeIdentifier(userId, { label: 'userId' });
  return performDirectoryMutation(userId, () =>
    apiClient.patch(`/admin/users/${identifier}/security`, payload, options),
  );
}

export function updateStatus(userId, payload, options = {}) {
  assertAdminAccess(USER_ROLES);
  const identifier = encodeIdentifier(userId, { label: 'userId' });
  return performDirectoryMutation(userId, () =>
    apiClient.patch(`/admin/users/${identifier}/status`, payload, options),
  );
}

export function updateRoles(userId, roles, options = {}) {
  assertAdminAccess(USER_ROLES);
  const identifier = encodeIdentifier(userId, { label: 'userId' });
  return performDirectoryMutation(userId, () =>
    apiClient.put(`/admin/users/${identifier}/roles`, { roles }, options),
  );
}

export function removeRole(userId, role, options = {}) {
  assertAdminAccess(USER_ROLES);
  const identifier = encodeIdentifier(userId, { label: 'userId' });
  const encodedRole = encodeIdentifier(role, { label: 'role' });
  return performDirectoryMutation(userId, () =>
    apiClient.delete(`/admin/users/${identifier}/roles/${encodedRole}`, options),
  );
}

export function resetPassword(userId, payload = {}, options = {}) {
  assertAdminAccess(USER_ROLES);
  const identifier = encodeIdentifier(userId, { label: 'userId' });
  return performDirectoryMutation(userId, () =>
    apiClient.post(`/admin/users/${identifier}/reset-password`, payload, options),
  );
}

export function createNote(userId, payload, options = {}) {
  assertAdminAccess(USER_ROLES);
  const identifier = encodeIdentifier(userId, { label: 'userId' });
  return performDirectoryMutation(userId, () =>
    apiClient.post(`/admin/users/${identifier}/notes`, payload, options),
  );
}

export default {
  fetchDirectory,
  fetchMetadata,
  fetchUser,
  createUser,
  updateUser,
  updateSecurity,
  updateStatus,
  updateRoles,
  removeRole,
  resetPassword,
  createNote,
};
