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

const TIMELINE_ROLES = ['super-admin', 'platform-admin', 'operations-admin', 'timeline-admin'];
const CACHE_TAGS = {
  list: 'admin:timelines:list',
  timeline: (identifier) => `admin:timelines:${identifier}`,
};

function buildTimelineQuery(params = {}) {
  return sanitiseQueryParams({
    status: params.status,
    ownerId: params.ownerId ?? params.owner_id,
    search: params.search,
    page: params.page,
    pageSize: params.pageSize ?? params.page_size,
    sort: params.sort,
  });
}

function timelineCache(projectId) {
  const identifier = normaliseIdentifier(projectId, { label: 'timelineId' });
  return {
    key: buildAdminCacheKey('admin:timelines:detail', { timelineId: identifier }),
    tag: CACHE_TAGS.timeline(identifier),
  };
}

async function performAndInvalidate(timelineId, request) {
  const response = await request();
  const tags = [CACHE_TAGS.list];
  if (timelineId) {
    const identifier = normaliseIdentifier(timelineId, { label: 'timelineId' });
    tags.push(CACHE_TAGS.timeline(identifier));
  }
  invalidateCacheByTag(tags);
  return response;
}

export function fetchAdminTimelines(params = {}, options = {}) {
  assertAdminAccess(TIMELINE_ROLES);
  const cleanedParams = buildTimelineQuery(params);
  const { forceRefresh = false, cacheTtl = 60000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:timelines:list', cleanedParams);

  return fetchWithCache(
    cacheKey,
    () => apiClient.get('/admin/timelines', createRequestOptions(requestOptions, cleanedParams)),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.list,
    },
  );
}

export function fetchAdminTimeline(timelineId, options = {}) {
  assertAdminAccess(TIMELINE_ROLES);
  const { forceRefresh = false, cacheTtl = 60000, ...requestOptions } = options ?? {};
  const { key, tag } = timelineCache(timelineId);
  const identifier = encodeIdentifier(timelineId, { label: 'timelineId' });

  return fetchWithCache(
    key,
    () =>
      apiClient.get(`/admin/timelines/${identifier}`, createRequestOptions(requestOptions)),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag,
    },
  );
}

export function createAdminTimeline(payload, options = {}) {
  assertAdminAccess(TIMELINE_ROLES);
  return performAndInvalidate(null, () => apiClient.post('/admin/timelines', payload, options));
}

export function updateAdminTimeline(timelineId, payload, options = {}) {
  assertAdminAccess(TIMELINE_ROLES);
  const identifier = encodeIdentifier(timelineId, { label: 'timelineId' });
  return performAndInvalidate(timelineId, () =>
    apiClient.put(`/admin/timelines/${identifier}`, payload, options),
  );
}

export function deleteAdminTimeline(timelineId, options = {}) {
  assertAdminAccess(TIMELINE_ROLES);
  const identifier = encodeIdentifier(timelineId, { label: 'timelineId' });
  return performAndInvalidate(timelineId, () =>
    apiClient.delete(`/admin/timelines/${identifier}`, options),
  );
}

export function createAdminTimelineEvent(timelineId, payload, options = {}) {
  assertAdminAccess(TIMELINE_ROLES);
  const identifier = encodeIdentifier(timelineId, { label: 'timelineId' });
  return performAndInvalidate(timelineId, () =>
    apiClient.post(`/admin/timelines/${identifier}/events`, payload, options),
  );
}

export function updateAdminTimelineEvent(timelineId, eventId, payload, options = {}) {
  assertAdminAccess(TIMELINE_ROLES);
  const timelineIdentifier = encodeIdentifier(timelineId, { label: 'timelineId' });
  const eventIdentifier = encodeIdentifier(eventId, { label: 'eventId' });
  return performAndInvalidate(timelineId, () =>
    apiClient.put(
      `/admin/timelines/${timelineIdentifier}/events/${eventIdentifier}`,
      payload,
      options,
    ),
  );
}

export function deleteAdminTimelineEvent(timelineId, eventId, options = {}) {
  assertAdminAccess(TIMELINE_ROLES);
  const timelineIdentifier = encodeIdentifier(timelineId, { label: 'timelineId' });
  const eventIdentifier = encodeIdentifier(eventId, { label: 'eventId' });
  return performAndInvalidate(timelineId, () =>
    apiClient.delete(
      `/admin/timelines/${timelineIdentifier}/events/${eventIdentifier}`,
      options,
    ),
  );
}

export function reorderAdminTimelineEvents(timelineId, order = [], options = {}) {
  assertAdminAccess(TIMELINE_ROLES);
  const identifier = encodeIdentifier(timelineId, { label: 'timelineId' });
  return performAndInvalidate(timelineId, () =>
    apiClient.post(`/admin/timelines/${identifier}/events/reorder`, { order }, options),
  );
}

export default {
  fetchAdminTimelines,
  fetchAdminTimeline,
  createAdminTimeline,
  updateAdminTimeline,
  deleteAdminTimeline,
  createAdminTimelineEvent,
  updateAdminTimelineEvent,
  deleteAdminTimelineEvent,
  reorderAdminTimelineEvents,
};
