import { apiClient } from './apiClient.js';

export async function fetchDomainGovernanceSummaries(options = {}) {
  const response = await apiClient.get('/domains/governance', options);
  if (!response || typeof response !== 'object') {
    return { contexts: [], generatedAt: new Date().toISOString() };
  }
  const contexts = Array.isArray(response.contexts) ? response.contexts : [];
  return {
    contexts,
    generatedAt: typeof response.generatedAt === 'string' ? response.generatedAt : new Date().toISOString(),
  };
}

export async function fetchDomainGovernanceDetail(contextName, options = {}) {
  if (!contextName) {
    throw new Error('contextName is required');
  }
  return apiClient.get(`/domains/${encodeURIComponent(contextName)}/governance`, options);
}

export default {
  fetchDomainGovernanceSummaries,
  fetchDomainGovernanceDetail,
};
