import { apiClient } from './apiClient.js';

const BASE_PATH = '/company/ai/auto-reply';

function buildParams(workspaceId) {
  const params = {};
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    params.workspaceId = workspaceId;
  }
  return params;
}

export async function fetchAutoReplyOverview({ workspaceId, signal } = {}) {
  return apiClient.get(`${BASE_PATH}/overview`, { params: buildParams(workspaceId), signal });
}

export async function updateAutoReplySettings(payload = {}, { signal } = {}) {
  return apiClient.put(`${BASE_PATH}/settings`, payload, { signal });
}

export async function listAutoReplyTemplates({ workspaceId, signal } = {}) {
  return apiClient.get(`${BASE_PATH}/templates`, { params: buildParams(workspaceId), signal });
}

export async function createAutoReplyTemplate({ workspaceId, template, signal } = {}) {
  const body = { ...(template || {}), workspaceId: workspaceId ?? template?.workspaceId ?? null };
  return apiClient.post(`${BASE_PATH}/templates`, body, { signal });
}

export async function updateAutoReplyTemplate(templateId, { workspaceId, template, signal } = {}) {
  if (!templateId) {
    throw new Error('templateId is required');
  }
  const body = { ...(template || {}), workspaceId: workspaceId ?? template?.workspaceId ?? null };
  return apiClient.put(`${BASE_PATH}/templates/${templateId}`, body, { signal });
}

export async function deleteAutoReplyTemplate(templateId, { workspaceId, signal } = {}) {
  if (!templateId) {
    throw new Error('templateId is required');
  }
  return apiClient.delete(`${BASE_PATH}/templates/${templateId}`, { params: buildParams(workspaceId), signal });
}

export async function testAutoReply(payload = {}, { signal } = {}) {
  return apiClient.post(`${BASE_PATH}/test`, payload, { signal });
}

export default {
  fetchAutoReplyOverview,
  updateAutoReplySettings,
  listAutoReplyTemplates,
  createAutoReplyTemplate,
  updateAutoReplyTemplate,
  deleteAutoReplyTemplate,
  testAutoReply,
};
