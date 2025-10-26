import apiClient from './apiClient.js';

export async function fetchInsightsOverview(params = {}) {
  return apiClient.get('/admin/monitoring/insights-overview', { params });
}

export async function fetchMetricsExplorer(params = {}) {
  return apiClient.get('/admin/monitoring/metrics-explorer', { params });
}

export async function fetchMetricsExplorerViews() {
  return apiClient.get('/admin/monitoring/metrics-explorer/views');
}

export async function createMetricsExplorerView(payload) {
  return apiClient.post('/admin/monitoring/metrics-explorer/views', payload);
}

export async function deleteMetricsExplorerView(viewId) {
  return apiClient.delete(`/admin/monitoring/metrics-explorer/views/${viewId}`);
}

export async function fetchAuditTrail(params = {}) {
  return apiClient.get('/admin/monitoring/audit-trail', { params });
}

export async function exportAuditTrail(params = {}) {
  return apiClient.get('/admin/monitoring/audit-trail/export', { params });
}

export default {
  fetchInsightsOverview,
  fetchMetricsExplorer,
  fetchMetricsExplorerViews,
  createMetricsExplorerView,
  deleteMetricsExplorerView,
  fetchAuditTrail,
  exportAuditTrail,
};
