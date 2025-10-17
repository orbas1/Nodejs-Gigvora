import { apiClient } from './apiClient.js';

export async function fetchAgencyAiControl({ workspaceId, workspaceSlug } = {}, { signal } = {}) {
  return apiClient.get('/agency/ai-control', {
    params: {
      workspaceId: workspaceId ?? undefined,
      workspaceSlug: workspaceSlug ?? undefined,
    },
    signal,
  });
}

export async function updateAgencyAiSettings({ workspaceId, workspaceSlug, ...body }) {
  return apiClient.put('/agency/ai-control', body, {
    params: {
      workspaceId: workspaceId ?? undefined,
      workspaceSlug: workspaceSlug ?? undefined,
    },
  });
}

export async function createAgencyBidTemplate({ workspaceId, workspaceSlug, ...body }) {
  return apiClient.post('/agency/ai-control/templates', body, {
    params: {
      workspaceId: workspaceId ?? undefined,
      workspaceSlug: workspaceSlug ?? undefined,
    },
  });
}

export async function updateAgencyBidTemplate(templateId, { workspaceId, workspaceSlug, ...body }) {
  return apiClient.put(`/agency/ai-control/templates/${templateId}`, body, {
    params: {
      workspaceId: workspaceId ?? undefined,
      workspaceSlug: workspaceSlug ?? undefined,
    },
  });
}

export async function deleteAgencyBidTemplate(templateId, { workspaceId, workspaceSlug } = {}) {
  return apiClient.delete(`/agency/ai-control/templates/${templateId}`, {
    params: {
      workspaceId: workspaceId ?? undefined,
      workspaceSlug: workspaceSlug ?? undefined,
    },
  });
}

export default {
  fetchAgencyAiControl,
  updateAgencyAiSettings,
  createAgencyBidTemplate,
  updateAgencyBidTemplate,
  deleteAgencyBidTemplate,
};
