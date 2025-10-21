import { apiClient } from './apiClient.js';

export function fetchCompanyMetricsDashboard({ workspaceId, lookbackDays, focus } = {}, { signal } = {}) {
  const params = {};
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    params.workspaceId = workspaceId;
  }
  if (lookbackDays != null) {
    params.lookbackDays = lookbackDays;
  }
  if (focus != null && `${focus}`.length > 0) {
    params.focus = focus;
  }
  return apiClient.get('/company/metrics', { params, signal });
}

export function createCompanyMetricGoal(payload, { signal } = {}) {
  return apiClient.post('/company/metrics/goals', payload ?? {}, { signal });
}

export function updateCompanyMetricGoal(goalId, payload, { signal } = {}) {
  if (!goalId) {
    throw new Error('goalId is required to update a metric goal.');
  }
  return apiClient.put(`/company/metrics/goals/${goalId}`, payload ?? {}, { signal });
}

export function deleteCompanyMetricGoal(goalId, { signal } = {}) {
  if (!goalId) {
    throw new Error('goalId is required to delete a metric goal.');
  }
  return apiClient.delete(`/company/metrics/goals/${goalId}`, { signal });
}

export function recordCompanyMetricSnapshot(payload, { signal } = {}) {
  return apiClient.post('/company/metrics/snapshots', payload ?? {}, { signal });
}

export function fetchCompanyMetricAlerts({ workspaceId } = {}, { signal } = {}) {
  const params = {};
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    params.workspaceId = workspaceId;
  }
  return apiClient.get('/company/metrics/alerts', { params, signal });
}

export function resolveCompanyMetricAlert(alertId, payload = {}, { signal } = {}) {
  if (!alertId) {
    throw new Error('alertId is required to resolve a metric alert.');
  }
  return apiClient.post(`/company/metrics/alerts/${alertId}/resolve`, payload ?? {}, { signal });
}

export default {
  fetchCompanyMetricsDashboard,
  createCompanyMetricGoal,
  updateCompanyMetricGoal,
  deleteCompanyMetricGoal,
  recordCompanyMetricSnapshot,
  fetchCompanyMetricAlerts,
  resolveCompanyMetricAlert,
};
