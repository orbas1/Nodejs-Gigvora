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

const NETWORKING_ROLES = ['super-admin', 'platform-admin', 'operations-admin', 'networking-admin'];
const CACHE_TAGS = {
  catalog: 'admin:speed-networking:catalog',
  sessions: 'admin:speed-networking:sessions',
};

function buildSessionParams(filters = {}) {
  return sanitiseQueryParams({
    status: filters.status,
    hostId: filters.hostId ?? filters.host_id,
    ownerId: filters.ownerId ?? filters.owner_id,
    workspaceId: filters.workspaceId ?? filters.workspace_id,
    from: filters.from,
    to: filters.to,
    search: filters.search,
    page: filters.page,
    pageSize: filters.pageSize ?? filters.page_size,
    sort: filters.sort,
  });
}

async function performAndInvalidate(sessionId, request) {
  const response = await request();
  const tags = [CACHE_TAGS.catalog, CACHE_TAGS.sessions];
  if (sessionId) {
    const identifier = encodeIdentifier(sessionId, { label: 'sessionId' });
    tags.push(`admin:speed-networking:session:${identifier}`);
  }
  invalidateCacheByTag(tags);
  return response;
}

export function fetchAdminSpeedNetworkingCatalog(options = {}) {
  assertAdminAccess(NETWORKING_ROLES);
  const { forceRefresh = false, cacheTtl = 5 * 60 * 1000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:speed-networking:catalog');

  return fetchWithCache(
    cacheKey,
    () => apiClient.get('/admin/speed-networking/catalog', createRequestOptions(requestOptions)),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.catalog,
    },
  );
}

export function fetchAdminSpeedNetworkingSessions(filters = {}, options = {}) {
  assertAdminAccess(NETWORKING_ROLES);
  const cleanedParams = buildSessionParams(filters);
  const { forceRefresh = false, cacheTtl = 60000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:speed-networking:sessions', cleanedParams);

  return fetchWithCache(
    cacheKey,
    () =>
      apiClient.get(
        '/admin/speed-networking/sessions',
        createRequestOptions(requestOptions, cleanedParams),
      ),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.sessions,
    },
  );
}

export function fetchAdminSpeedNetworkingSession(sessionId, options = {}) {
  assertAdminAccess(NETWORKING_ROLES);
  return apiClient.get(
    `/admin/speed-networking/sessions/${encodeIdentifier(sessionId, { label: 'sessionId' })}`,
    options,
  );
}

export function createAdminSpeedNetworkingSession(payload, options = {}) {
  assertAdminAccess(NETWORKING_ROLES);
  return performAndInvalidate(null, () =>
    apiClient.post('/admin/speed-networking/sessions', payload, options),
  );
}

export function updateAdminSpeedNetworkingSession(sessionId, payload, options = {}) {
  assertAdminAccess(NETWORKING_ROLES);
  const identifier = encodeIdentifier(sessionId, { label: 'sessionId' });
  return performAndInvalidate(sessionId, () =>
    apiClient.patch(`/admin/speed-networking/sessions/${identifier}`, payload, options),
  );
}

export function deleteAdminSpeedNetworkingSession(sessionId, options = {}) {
  assertAdminAccess(NETWORKING_ROLES);
  const identifier = encodeIdentifier(sessionId, { label: 'sessionId' });
  return performAndInvalidate(sessionId, () =>
    apiClient.delete(`/admin/speed-networking/sessions/${identifier}`, options),
  );
}

export function createAdminSpeedNetworkingParticipant(sessionId, payload, options = {}) {
  assertAdminAccess(NETWORKING_ROLES);
  const identifier = encodeIdentifier(sessionId, { label: 'sessionId' });
  return performAndInvalidate(sessionId, () =>
    apiClient.post(`/admin/speed-networking/sessions/${identifier}/participants`, payload, options),
  );
}

export function updateAdminSpeedNetworkingParticipant(sessionId, participantId, payload, options = {}) {
  assertAdminAccess(NETWORKING_ROLES);
  const sessionIdentifier = encodeIdentifier(sessionId, { label: 'sessionId' });
  const participantIdentifier = encodeIdentifier(participantId, { label: 'participantId' });
  return performAndInvalidate(sessionId, () =>
    apiClient.patch(
      `/admin/speed-networking/sessions/${sessionIdentifier}/participants/${participantIdentifier}`,
      payload,
      options,
    ),
  );
}

export function deleteAdminSpeedNetworkingParticipant(sessionId, participantId, options = {}) {
  assertAdminAccess(NETWORKING_ROLES);
  const sessionIdentifier = encodeIdentifier(sessionId, { label: 'sessionId' });
  const participantIdentifier = encodeIdentifier(participantId, { label: 'participantId' });
  return performAndInvalidate(sessionId, () =>
    apiClient.delete(
      `/admin/speed-networking/sessions/${sessionIdentifier}/participants/${participantIdentifier}`,
      options,
    ),
  );
}

export default {
  fetchAdminSpeedNetworkingCatalog,
  fetchAdminSpeedNetworkingSessions,
  fetchAdminSpeedNetworkingSession,
  createAdminSpeedNetworkingSession,
  updateAdminSpeedNetworkingSession,
  deleteAdminSpeedNetworkingSession,
  createAdminSpeedNetworkingParticipant,
  updateAdminSpeedNetworkingParticipant,
  deleteAdminSpeedNetworkingParticipant,
};
