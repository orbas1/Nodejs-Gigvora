import { apiClient } from './apiClient.js';
import {
  buildParams,
  buildRequestOptions,
  mergeWorkspace,
  optionalString,
  requireIdentifier,
  resolveSignal,
} from './serviceHelpers.js';

export async function fetchTimelineSnapshot({ workspaceId, lookbackDays, signal } = {}, options = {}) {
  const params = buildParams({
    workspaceId: optionalString(workspaceId),
    lookbackDays,
  });
  const requestOptions = buildRequestOptions({
    params,
    signal: resolveSignal(signal, options.signal),
  });
  return apiClient.get('/company/dashboard/timeline', requestOptions);
}

export async function createTimelineEvent({ workspaceId, ...payload } = {}, options = {}) {
  const body = mergeWorkspace(payload ?? {}, { workspaceId });
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.post('/company/dashboard/timeline/events', body, requestOptions);
}

export async function updateTimelineEvent(eventId, { workspaceId, ...payload } = {}, options = {}) {
  const eventIdentifier = requireIdentifier(eventId, 'eventId');
  const body = mergeWorkspace(payload ?? {}, { workspaceId });
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.patch(`/company/dashboard/timeline/events/${eventIdentifier}`, body, requestOptions);
}

export async function deleteTimelineEvent(eventId, { workspaceId } = {}, options = {}) {
  const eventIdentifier = requireIdentifier(eventId, 'eventId');
  const body = mergeWorkspace({}, { workspaceId });
  const requestOptions = buildRequestOptions({
    signal: resolveSignal(options.signal),
    body,
  });
  return apiClient.delete(`/company/dashboard/timeline/events/${eventIdentifier}`, requestOptions);
}

export async function createTimelinePost({ workspaceId, ...payload } = {}, options = {}) {
  const body = mergeWorkspace(payload ?? {}, { workspaceId });
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.post('/company/dashboard/timeline/posts', body, requestOptions);
}

export async function updateTimelinePost(postId, { workspaceId, ...payload } = {}, options = {}) {
  const postIdentifier = requireIdentifier(postId, 'postId');
  const body = mergeWorkspace(payload ?? {}, { workspaceId });
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.patch(`/company/dashboard/timeline/posts/${postIdentifier}`, body, requestOptions);
}

export async function changeTimelinePostStatus(postId, { workspaceId, ...payload } = {}, options = {}) {
  const postIdentifier = requireIdentifier(postId, 'postId');
  const body = mergeWorkspace(payload ?? {}, { workspaceId });
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.post(`/company/dashboard/timeline/posts/${postIdentifier}/status`, body, requestOptions);
}

export async function deleteTimelinePost(postId, { workspaceId } = {}, options = {}) {
  const postIdentifier = requireIdentifier(postId, 'postId');
  const body = mergeWorkspace({}, { workspaceId });
  const requestOptions = buildRequestOptions({
    signal: resolveSignal(options.signal),
    body,
  });
  return apiClient.delete(`/company/dashboard/timeline/posts/${postIdentifier}`, requestOptions);
}

export async function recordTimelinePostMetrics(postId, { workspaceId, ...payload } = {}, options = {}) {
  const postIdentifier = requireIdentifier(postId, 'postId');
  const body = mergeWorkspace(payload ?? {}, { workspaceId });
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.post(`/company/dashboard/timeline/posts/${postIdentifier}/metrics`, body, requestOptions);
}

export default {
  fetchTimelineSnapshot,
  createTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
  createTimelinePost,
  updateTimelinePost,
  changeTimelinePostStatus,
  deleteTimelinePost,
  recordTimelinePostMetrics,
};
