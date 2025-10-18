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

export async function updateAutoReplySettings(payload = {}) {
  return apiClient.put(`${BASE_PATH}/settings`, payload);
}

export async function listAutoReplyTemplates({ workspaceId, signal } = {}) {
  return apiClient.get(`${BASE_PATH}/templates`, { params: buildParams(workspaceId), signal });
}

export async function createAutoReplyTemplate({ workspaceId, template }) {
  const body = { ...(template || {}), workspaceId: workspaceId ?? template?.workspaceId ?? null };
  return apiClient.post(`${BASE_PATH}/templates`, body);
}

export async function updateAutoReplyTemplate(templateId, { workspaceId, template }) {
  if (!templateId) {
    throw new Error('templateId is required');
  }
  const body = { ...(template || {}), workspaceId: workspaceId ?? template?.workspaceId ?? null };
  return apiClient.put(`${BASE_PATH}/templates/${templateId}`, body);
}

export async function deleteAutoReplyTemplate(templateId, { workspaceId } = {}) {
  if (!templateId) {
    throw new Error('templateId is required');
  }
  return apiClient.delete(`${BASE_PATH}/templates/${templateId}`, { params: buildParams(workspaceId) });
}

export async function testAutoReply(payload = {}) {
  return apiClient.post(`${BASE_PATH}/test`, payload);
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
