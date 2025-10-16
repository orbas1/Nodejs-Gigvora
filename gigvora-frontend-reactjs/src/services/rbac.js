import { apiClient } from './apiClient.js';

export async function fetchRbacMatrix(params = {}) {
  const response = await apiClient.get('/admin/governance/rbac/matrix', { params });
  return {
    version: response?.version ?? null,
    publishedAt: response?.publishedAt ?? null,
    reviewCadenceDays: response?.reviewCadenceDays ?? null,
    personas: Array.isArray(response?.personas) ? response.personas : [],
    guardrails: Array.isArray(response?.guardrails) ? response.guardrails : [],
    resources: Array.isArray(response?.resources) ? response.resources : [],
  };
}

export async function fetchRbacAuditEvents(params = {}) {
  const response = await apiClient.get('/admin/governance/rbac/audit-events', { params });
  const total = Number(response?.total);
  const limit = Number(response?.limit);
  const offset = Number(response?.offset);
  return {
    total: Number.isFinite(total) ? total : 0,
    limit: Number.isFinite(limit) ? limit : 25,
    offset: Number.isFinite(offset) ? offset : 0,
    events: Array.isArray(response?.events) ? response.events : [],
  };
}

export async function simulateRbacDecision(payload = {}) {
  if (!payload.resource || !payload.action) {
    throw new Error('resource and action are required to simulate an RBAC decision.');
  }
  return apiClient.post('/admin/governance/rbac/simulate', payload);
}

export default {
  fetchRbacMatrix,
  fetchRbacAuditEvents,
  simulateRbacDecision,
};
