import apiClient from './apiClient.js';

export async function fetchComplianceAuditLogs(params = {}, { signal } = {}) {
  return apiClient.get('/compliance/audit-logs', { params, signal });
}

export default {
  fetchComplianceAuditLogs,
};
