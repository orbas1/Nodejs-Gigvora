import { apiClient } from './apiClient.js';

export async function fetchWorkspaceTemplates({ category, workspaceType, includeStages, includeResources } = {}) {
  return apiClient.get('/workspace-templates', {
    params: {
      category: category ?? undefined,
      workspaceType: workspaceType ?? undefined,
      includeStages: includeStages ?? true,
      includeResources: includeResources ?? true,
    },
  });
}

export async function fetchWorkspaceTemplate(slug, { includeStages, includeResources } = {}) {
  if (!slug) {
    throw new Error('Template slug is required.');
  }
  return apiClient.get(`/workspace-templates/${slug}`, {
    params: {
      includeStages: includeStages ?? true,
      includeResources: includeResources ?? true,
    },
  });
}

export default {
  fetchWorkspaceTemplates,
  fetchWorkspaceTemplate,
};
