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

const MENTORING_ROLES = ['super-admin', 'platform-admin', 'mentoring-admin', 'operations-admin'];
const CACHE_TAGS = {
  catalog: 'admin:mentoring:catalog',
  sessions: 'admin:mentoring:sessions',
};

function buildSessionParams(filters = {}) {
  return sanitiseQueryParams({
    status: filters.status,
    mentorId: filters.mentorId ?? filters.mentor_id,
    menteeId: filters.menteeId ?? filters.mentee_id,
    serviceLineId: filters.serviceLineId ?? filters.service_line_id,
    ownerId: filters.ownerId ?? filters.owner_id,
    from: filters.from,
    to: filters.to,
    search: filters.search,
    page: filters.page,
    pageSize: filters.pageSize ?? filters.page_size,
    sort: filters.sort,
  });
}

async function performAndInvalidate(request) {
  const response = await request();
  invalidateCacheByTag(CACHE_TAGS.catalog, CACHE_TAGS.sessions);
  return response;
}

export function fetchAdminMentoringCatalog(options = {}) {
  assertAdminAccess(MENTORING_ROLES);
  const { forceRefresh = false, cacheTtl = 10 * 60 * 1000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:mentoring:catalog');

  return fetchWithCache(
    cacheKey,
    () => apiClient.get('/admin/mentoring/catalog', createRequestOptions(requestOptions)),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.catalog,
    },
  );
}

export function fetchAdminMentoringSessions(filters = {}, options = {}) {
  assertAdminAccess(MENTORING_ROLES);
  const cleanedParams = buildSessionParams(filters);
  const { forceRefresh = false, cacheTtl = 60000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:mentoring:sessions', cleanedParams);

  return fetchWithCache(
    cacheKey,
    () =>
      apiClient.get(
        '/admin/mentoring/sessions',
        createRequestOptions(requestOptions, cleanedParams),
      ),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.sessions,
    },
  );
}

export function createAdminMentoringSession(payload, options = {}) {
  assertAdminAccess(MENTORING_ROLES);
  return performAndInvalidate(() => apiClient.post('/admin/mentoring/sessions', payload, options));
}

export function updateAdminMentoringSession(sessionId, payload, options = {}) {
  assertAdminAccess(MENTORING_ROLES);
  const identifier = encodeIdentifier(sessionId, { label: 'sessionId' });
  return performAndInvalidate(() =>
    apiClient.patch(`/admin/mentoring/sessions/${identifier}`, payload, options),
  );
}

export function createAdminMentoringNote(sessionId, payload, options = {}) {
  assertAdminAccess(MENTORING_ROLES);
  const identifier = encodeIdentifier(sessionId, { label: 'sessionId' });
  return performAndInvalidate(() =>
    apiClient.post(`/admin/mentoring/sessions/${identifier}/notes`, payload, options),
  );
}

export function updateAdminMentoringNote(sessionId, noteId, payload, options = {}) {
  assertAdminAccess(MENTORING_ROLES);
  const sessionIdentifier = encodeIdentifier(sessionId, { label: 'sessionId' });
  const noteIdentifier = encodeIdentifier(noteId, { label: 'noteId' });
  return performAndInvalidate(() =>
    apiClient.patch(
      `/admin/mentoring/sessions/${sessionIdentifier}/notes/${noteIdentifier}`,
      payload,
      options,
    ),
  );
}

export function deleteAdminMentoringNote(sessionId, noteId, options = {}) {
  assertAdminAccess(MENTORING_ROLES);
  const sessionIdentifier = encodeIdentifier(sessionId, { label: 'sessionId' });
  const noteIdentifier = encodeIdentifier(noteId, { label: 'noteId' });
  return performAndInvalidate(() =>
    apiClient.delete(`/admin/mentoring/sessions/${sessionIdentifier}/notes/${noteIdentifier}`, options),
  );
}

export function createAdminMentoringAction(sessionId, payload, options = {}) {
  assertAdminAccess(MENTORING_ROLES);
  const identifier = encodeIdentifier(sessionId, { label: 'sessionId' });
  return performAndInvalidate(() =>
    apiClient.post(`/admin/mentoring/sessions/${identifier}/actions`, payload, options),
  );
}

export function updateAdminMentoringAction(sessionId, actionId, payload, options = {}) {
  assertAdminAccess(MENTORING_ROLES);
  const sessionIdentifier = encodeIdentifier(sessionId, { label: 'sessionId' });
  const actionIdentifier = encodeIdentifier(actionId, { label: 'actionId' });
  return performAndInvalidate(() =>
    apiClient.patch(
      `/admin/mentoring/sessions/${sessionIdentifier}/actions/${actionIdentifier}`,
      payload,
      options,
    ),
  );
}

export function deleteAdminMentoringAction(sessionId, actionId, options = {}) {
  assertAdminAccess(MENTORING_ROLES);
  const sessionIdentifier = encodeIdentifier(sessionId, { label: 'sessionId' });
  const actionIdentifier = encodeIdentifier(actionId, { label: 'actionId' });
  return performAndInvalidate(() =>
    apiClient.delete(
      `/admin/mentoring/sessions/${sessionIdentifier}/actions/${actionIdentifier}`,
      options,
    ),
  );
}

export default {
  fetchAdminMentoringCatalog,
  fetchAdminMentoringSessions,
  createAdminMentoringSession,
  updateAdminMentoringSession,
  createAdminMentoringNote,
  updateAdminMentoringNote,
  deleteAdminMentoringNote,
  createAdminMentoringAction,
  updateAdminMentoringAction,
  deleteAdminMentoringAction,
};
