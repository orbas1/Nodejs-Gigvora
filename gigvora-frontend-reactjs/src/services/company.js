import { apiClient } from './apiClient.js';

export async function fetchCompanyDashboard({ workspaceId, workspaceSlug, lookbackDays, signal } = {}) {
  const params = {};
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    params.workspaceId = workspaceId;
  }
  if (workspaceSlug != null && `${workspaceSlug}`.length > 0) {
    params.workspaceSlug = workspaceSlug;
  }
  if (lookbackDays != null) {
    params.lookbackDays = lookbackDays;
  }
  return apiClient.get('/company/dashboard', { params, signal });
}

export async function updateCompanyDashboardOverview(payload, { signal } = {}) {
  return apiClient.put('/company/dashboard/overview', payload, { signal });
}

export async function fetchCompanyPages({ workspaceId, status, visibility, search, limit, offset, signal } = {}) {
  if (!workspaceId) {
    throw new Error('workspaceId is required to fetch company pages.');
  }
  const params = { workspaceId };
  if (status) params.status = status;
  if (visibility) params.visibility = visibility;
  if (search) params.search = search;
  if (limit != null) params.limit = limit;
  if (offset != null) params.offset = offset;
  return apiClient.get('/company/dashboard/pages', { params, signal });
}

export async function fetchCompanyPage({ workspaceId, pageId, signal } = {}) {
  if (!workspaceId || !pageId) {
    throw new Error('workspaceId and pageId are required to load a page.');
  }
  return apiClient.get(`/company/dashboard/pages/${pageId}`, { params: { workspaceId }, signal });
}

export async function createCompanyPage(payload, { signal } = {}) {
  if (!payload?.workspaceId) {
    throw new Error('workspaceId is required to create a page.');
  }
  return apiClient.post('/company/dashboard/pages', payload, { signal });
}

export async function updateCompanyPage(pageId, payload, { signal } = {}) {
  if (!payload?.workspaceId || !pageId) {
    throw new Error('workspaceId and pageId are required to update a page.');
  }
  return apiClient.put(`/company/dashboard/pages/${pageId}`, payload, { signal });
}

export async function replaceCompanyPageSections(pageId, payload, { signal } = {}) {
  if (!payload?.workspaceId || !pageId) {
    throw new Error('workspaceId and pageId are required to update sections.');
  }
  return apiClient.put(`/company/dashboard/pages/${pageId}/sections`, payload, { signal });
}

export async function replaceCompanyPageCollaborators(pageId, payload, { signal } = {}) {
  if (!payload?.workspaceId || !pageId) {
    throw new Error('workspaceId and pageId are required to update collaborators.');
  }
  return apiClient.put(`/company/dashboard/pages/${pageId}/collaborators`, payload, { signal });
}

export async function publishCompanyPage(pageId, payload, { signal } = {}) {
  if (!payload?.workspaceId || !pageId) {
    throw new Error('workspaceId and pageId are required to publish a page.');
  }
  return apiClient.post(`/company/dashboard/pages/${pageId}/publish`, payload, { signal });
}

export async function archiveCompanyPage(pageId, payload, { signal } = {}) {
  if (!payload?.workspaceId || !pageId) {
    throw new Error('workspaceId and pageId are required to archive a page.');
  }
  return apiClient.post(`/company/dashboard/pages/${pageId}/archive`, payload, { signal });
}

export async function deleteCompanyPage(pageId, { workspaceId, signal } = {}) {
  if (!workspaceId || !pageId) {
    throw new Error('workspaceId and pageId are required to delete a page.');
  }
  return apiClient.delete(`/company/dashboard/pages/${pageId}`, { params: { workspaceId }, signal });
}

export default {
  fetchCompanyDashboard,
  updateCompanyDashboardOverview,
  fetchCompanyPages,
  fetchCompanyPage,
  createCompanyPage,
  updateCompanyPage,
  replaceCompanyPageSections,
  replaceCompanyPageCollaborators,
  publishCompanyPage,
  archiveCompanyPage,
  deleteCompanyPage,
};

