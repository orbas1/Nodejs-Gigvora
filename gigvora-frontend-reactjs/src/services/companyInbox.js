
import { apiClient } from './apiClient.js';

function ensureId(value, message) {
  if (value === undefined || value === null || `${value}`.trim().length === 0) {
    throw new Error(message);
  }
  return typeof value === 'string' ? value.trim() : value;
}

function toParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && `${value}`.length > 0),
  );
}

export function fetchCompanyInboxOverview({ workspaceId, workspaceSlug, lookbackDays, signal } = {}) {
  const params = toParams({ workspaceId, workspaceSlug, lookbackDays });
  return apiClient.get('/company/inbox/overview', { params, signal });
}

export function fetchCompanyInboxThreads(
  { workspaceId, workspaceSlug, lookbackDays, filters = {}, pagination = {}, signal } = {},
) {
  const params = toParams({
    workspaceId,
    workspaceSlug,
    lookbackDays,
    page: pagination.page,
    pageSize: pagination.pageSize,
    search: filters.search,
    unreadOnly: filters.unreadOnly,
  });

  if (Array.isArray(filters.channelTypes) && filters.channelTypes.length) {
    params.channelTypes = filters.channelTypes.join(',');
  }
  if (Array.isArray(filters.states) && filters.states.length) {
    params.states = filters.states.join(',');
  }
  if (Array.isArray(filters.labelIds) && filters.labelIds.length) {
    params.labelIds = filters.labelIds.join(',');
  }
  if (Array.isArray(filters.supportStatuses) && filters.supportStatuses.length) {
    params.supportStatuses = filters.supportStatuses.join(',');
  }

  return apiClient.get('/company/inbox/threads', { params, signal });
}

export function fetchCompanyInboxThread(threadId, { workspaceId, workspaceSlug, signal } = {}) {
  const resolvedThreadId = ensureId(threadId, 'threadId is required to load a company inbox thread.');
  const params = toParams({ workspaceId, workspaceSlug });
  return apiClient.get(`/company/inbox/threads/${resolvedThreadId}`, { params, signal });
}

export function fetchCompanyInboxLabels({ workspaceId, workspaceSlug, search, signal } = {}) {
  const params = toParams({ workspaceId, workspaceSlug, search });
  return apiClient.get('/company/inbox/labels', { params, signal });
}

export function createCompanyInboxLabel({ workspaceId, workspaceSlug, name, color, description, metadata, signal } = {}) {
  if (!name || `${name}`.trim().length === 0) {
    throw new Error('name is required to create a label.');
  }
  const params = toParams({ workspaceId, workspaceSlug });
  return apiClient.post('/company/inbox/labels', { name, color, description, metadata }, { params, signal });
}

export function updateCompanyInboxLabel(
  labelId,
  { workspaceId, workspaceSlug, name, color, description, metadata, signal } = {},
) {
  const resolvedLabelId = ensureId(labelId, 'labelId is required to update a label.');
  const params = toParams({ workspaceId, workspaceSlug });
  return apiClient.patch(`/company/inbox/labels/${resolvedLabelId}`, { name, color, description, metadata }, { params, signal });
}

export function deleteCompanyInboxLabel(labelId, { workspaceId, workspaceSlug, signal } = {}) {
  const resolvedLabelId = ensureId(labelId, 'labelId is required to delete a label.');
  const params = toParams({ workspaceId, workspaceSlug });
  return apiClient.delete(`/company/inbox/labels/${resolvedLabelId}`, { params, signal });
}

export function setCompanyThreadLabels(
  threadId,
  { workspaceId, workspaceSlug, labelIds, actorId, signal } = {},
) {
  const resolvedThreadId = ensureId(threadId, 'threadId is required to update thread labels.');
  const params = toParams({ workspaceId, workspaceSlug });
  return apiClient.post(
    `/company/inbox/threads/${resolvedThreadId}/labels`,
    { labelIds: Array.isArray(labelIds) ? labelIds : [], actorId },
    { params, signal },
  );
}

export function fetchCompanyInboxMembers({ workspaceId, workspaceSlug, signal } = {}) {
  const params = toParams({ workspaceId, workspaceSlug });
  return apiClient.get('/company/inbox/members', { params, signal });
}

export default {
  fetchCompanyInboxOverview,
  fetchCompanyInboxThreads,
  fetchCompanyInboxThread,
  fetchCompanyInboxLabels,
  createCompanyInboxLabel,
  updateCompanyInboxLabel,
  deleteCompanyInboxLabel,
  setCompanyThreadLabels,
  fetchCompanyInboxMembers,
};
