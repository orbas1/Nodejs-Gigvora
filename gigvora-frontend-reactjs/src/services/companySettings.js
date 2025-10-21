import { apiClient } from './apiClient.js';

export function fetchCompanySettings({ workspaceId } = {}, { signal } = {}) {
  const params = {};
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    params.workspaceId = workspaceId;
  }
  return apiClient.get('/company/settings', { params, signal });
}

export function updateCompanySettings(payload, { signal } = {}) {
  return apiClient.put('/company/settings', payload ?? {}, { signal });
}

export function updateCompanyNotificationSettings(payload, { signal } = {}) {
  return apiClient.put('/company/settings/notifications', payload ?? {}, { signal });
}

export function createCompanyWorkflow(payload, { signal } = {}) {
  return apiClient.post('/company/settings/workflows', payload ?? {}, { signal });
}

export function updateCompanyWorkflow(workflowId, payload, { signal } = {}) {
  if (!workflowId) {
    throw new Error('workflowId is required to update a workflow.');
  }
  return apiClient.put(`/company/settings/workflows/${workflowId}`, payload ?? {}, { signal });
}

export function deleteCompanyWorkflow(workflowId, { signal } = {}) {
  if (!workflowId) {
    throw new Error('workflowId is required to delete a workflow.');
  }
  return apiClient.delete(`/company/settings/workflows/${workflowId}`, { signal });
}

export function createCompanyJourneyTemplate(payload, { signal } = {}) {
  return apiClient.post('/company/settings/journeys', payload ?? {}, { signal });
}

export function updateCompanyJourneyTemplate(templateId, payload, { signal } = {}) {
  if (!templateId) {
    throw new Error('templateId is required to update a journey template.');
  }
  return apiClient.put(`/company/settings/journeys/${templateId}`, payload ?? {}, { signal });
}

export function deleteCompanyJourneyTemplate(templateId, { signal } = {}) {
  if (!templateId) {
    throw new Error('templateId is required to delete a journey template.');
  }
  return apiClient.delete(`/company/settings/journeys/${templateId}`, { signal });
}

export default {
  fetchCompanySettings,
  updateCompanySettings,
  updateCompanyNotificationSettings,
  createCompanyWorkflow,
  updateCompanyWorkflow,
  deleteCompanyWorkflow,
  createCompanyJourneyTemplate,
  updateCompanyJourneyTemplate,
  deleteCompanyJourneyTemplate,
};
