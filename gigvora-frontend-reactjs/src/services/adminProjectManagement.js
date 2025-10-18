import { apiClient } from './apiClient.js';

export async function fetchProjectPortfolio(params = {}) {
  const response = await apiClient.get('/admin/project-management', { params });
  return response;
}

export async function fetchProjectSummary() {
  return apiClient.get('/admin/project-management/summary');
}

export async function fetchProject(projectId) {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  return apiClient.get(`/admin/project-management/projects/${projectId}`);
}

export async function createProject(payload) {
  return apiClient.post('/admin/project-management', payload);
}

export async function updateProject(projectId, payload) {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  return apiClient.put(`/admin/project-management/projects/${projectId}`, payload);
}

export async function updateProjectWorkspace(projectId, payload) {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  return apiClient.patch(`/admin/project-management/projects/${projectId}/workspace`, payload);
}

export async function createMilestone(projectId, payload) {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  return apiClient.post(`/admin/project-management/projects/${projectId}/milestones`, payload);
}

export async function updateMilestone(projectId, milestoneId, payload) {
  if (!projectId || !milestoneId) {
    throw new Error('projectId and milestoneId are required');
  }
  return apiClient.put(`/admin/project-management/projects/${projectId}/milestones/${milestoneId}`, payload);
}

export async function deleteMilestone(projectId, milestoneId) {
  if (!projectId || !milestoneId) {
    throw new Error('projectId and milestoneId are required');
  }
  return apiClient.delete(`/admin/project-management/projects/${projectId}/milestones/${milestoneId}`);
}

export async function createCollaborator(projectId, payload) {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  return apiClient.post(`/admin/project-management/projects/${projectId}/collaborators`, payload);
}

export async function updateCollaborator(projectId, collaboratorId, payload) {
  if (!projectId || !collaboratorId) {
    throw new Error('projectId and collaboratorId are required');
  }
  return apiClient.put(
    `/admin/project-management/projects/${projectId}/collaborators/${collaboratorId}`,
    payload,
  );
}

export async function deleteCollaborator(projectId, collaboratorId) {
  if (!projectId || !collaboratorId) {
    throw new Error('projectId and collaboratorId are required');
  }
  return apiClient.delete(`/admin/project-management/projects/${projectId}/collaborators/${collaboratorId}`);
}

export async function createIntegration(projectId, payload) {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  return apiClient.post(`/admin/project-management/projects/${projectId}/integrations`, payload);
}

export async function updateIntegration(projectId, integrationId, payload) {
  if (!projectId || !integrationId) {
    throw new Error('projectId and integrationId are required');
  }
  return apiClient.put(
    `/admin/project-management/projects/${projectId}/integrations/${integrationId}`,
    payload,
  );
}

export async function deleteIntegration(projectId, integrationId) {
  if (!projectId || !integrationId) {
    throw new Error('projectId and integrationId are required');
  }
  return apiClient.delete(`/admin/project-management/projects/${projectId}/integrations/${integrationId}`);
}

export async function createAsset(projectId, payload) {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  return apiClient.post(`/admin/project-management/projects/${projectId}/assets`, payload);
}

export async function deleteAsset(projectId, assetId) {
  if (!projectId || !assetId) {
    throw new Error('projectId and assetId are required');
  }
  return apiClient.delete(`/admin/project-management/projects/${projectId}/assets/${assetId}`);
}

export async function createRetrospective(projectId, payload) {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  return apiClient.post(`/admin/project-management/projects/${projectId}/retrospectives`, payload);
}

export default {
  fetchProjectPortfolio,
  fetchProjectSummary,
  fetchProject,
  createProject,
  updateProject,
  updateProjectWorkspace,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  createCollaborator,
  updateCollaborator,
  deleteCollaborator,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  createAsset,
  deleteAsset,
  createRetrospective,
};
