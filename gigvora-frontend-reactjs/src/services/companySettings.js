import { apiClient } from './apiClient.js';
import { buildRequestOptions, resolveSignal, requireIdentifier } from './serviceHelpers.js';

export function fetchCompanySettings({ workspaceId, signal } = {}, options = {}) {
  const params = {};
  if (workspaceId != null && `${workspaceId}`.toString().trim().length > 0) {
    params.workspaceId = `${workspaceId}`.toString().trim();
  }
  const requestOptions = buildRequestOptions({
    params,
    signal: resolveSignal(signal, options.signal),
  });
  return apiClient.get('/company/settings', requestOptions);
}

export function updateCompanySettings(payload = {}, options = {}) {
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.put('/company/settings', payload ?? {}, requestOptions);
}

export function updateCompanyNotificationSettings(payload = {}, options = {}) {
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.put('/company/settings/notifications', payload ?? {}, requestOptions);
}

export function createCompanyWorkflow(payload = {}, options = {}) {
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.post('/company/settings/workflows', payload ?? {}, requestOptions);
}

export function updateCompanyWorkflow(workflowId, payload = {}, options = {}) {
  const workflowIdentifier = requireIdentifier(workflowId, 'workflowId');
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.put(`/company/settings/workflows/${workflowIdentifier}`, payload ?? {}, requestOptions);
}

export function deleteCompanyWorkflow(workflowId, options = {}) {
  const workflowIdentifier = requireIdentifier(workflowId, 'workflowId');
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.delete(`/company/settings/workflows/${workflowIdentifier}`, requestOptions);
}

export function createCompanyJourneyTemplate(payload = {}, options = {}) {
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.post('/company/settings/journeys', payload ?? {}, requestOptions);
}

export function updateCompanyJourneyTemplate(templateId, payload = {}, options = {}) {
  const journeyIdentifier = requireIdentifier(templateId, 'templateId');
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.put(`/company/settings/journeys/${journeyIdentifier}`, payload ?? {}, requestOptions);
}

export function deleteCompanyJourneyTemplate(templateId, options = {}) {
  const journeyIdentifier = requireIdentifier(templateId, 'templateId');
  const requestOptions = buildRequestOptions({ signal: resolveSignal(options.signal) });
  return apiClient.delete(`/company/settings/journeys/${journeyIdentifier}`, requestOptions);
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
