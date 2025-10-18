
import { apiClient } from './apiClient.js';

function toParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && `${value}`.length > 0),
  );
}

export function fetchCompanyInboxOverview({ workspaceId, workspaceSlug, lookbackDays } = {}) {
  const params = toParams({ workspaceId, workspaceSlug, lookbackDays });
  return apiClient.get('/company/inbox/overview', { params });
}

export function fetchCompanyInboxThreads({ workspaceId, workspaceSlug, lookbackDays, filters = {}, pagination = {} } = {}) {
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

  return apiClient.get('/company/inbox/threads', { params });
}

export function fetchCompanyInboxThread(threadId, { workspaceId, workspaceSlug } = {}) {
  if (!threadId) {
    throw new Error('threadId is required to load a company inbox thread.');
  }
  const params = toParams({ workspaceId, workspaceSlug });
  return apiClient.get(`/company/inbox/threads/${threadId}`, { params });
}

export function fetchCompanyInboxLabels({ workspaceId, workspaceSlug, search } = {}) {
  const params = toParams({ workspaceId, workspaceSlug, search });
  return apiClient.get('/company/inbox/labels', { params });
}

export function createCompanyInboxLabel({ workspaceId, workspaceSlug, name, color, description, metadata } = {}) {
  if (!name) {
    throw new Error('name is required to create a label.');
  }
  const params = toParams({ workspaceId, workspaceSlug });
  return apiClient.post('/company/inbox/labels', { name, color, description, metadata }, { params });
}

export function updateCompanyInboxLabel(labelId, { workspaceId, workspaceSlug, name, color, description, metadata } = {}) {
  if (!labelId) {
    throw new Error('labelId is required to update a label.');
  }
  const params = toParams({ workspaceId, workspaceSlug });
  return apiClient.patch(`/company/inbox/labels/${labelId}`, { name, color, description, metadata }, { params });
}

export function deleteCompanyInboxLabel(labelId, { workspaceId, workspaceSlug } = {}) {
  if (!labelId) {
    throw new Error('labelId is required to delete a label.');
  }
  const params = toParams({ workspaceId, workspaceSlug });
  return apiClient.delete(`/company/inbox/labels/${labelId}`, { params });
}

export function setCompanyThreadLabels(threadId, { workspaceId, workspaceSlug, labelIds, actorId } = {}) {
  if (!threadId) {
    throw new Error('threadId is required to update thread labels.');
  }
  const params = toParams({ workspaceId, workspaceSlug });
  return apiClient.post(
    `/company/inbox/threads/${threadId}/labels`,
    { labelIds: Array.isArray(labelIds) ? labelIds : [], actorId },
    { params },
  );
}

export function fetchCompanyInboxMembers({ workspaceId, workspaceSlug } = {}) {
  const params = toParams({ workspaceId, workspaceSlug });
  return apiClient.get('/company/inbox/members', { params });
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
