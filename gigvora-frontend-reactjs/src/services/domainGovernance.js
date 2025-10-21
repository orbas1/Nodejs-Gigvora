import { apiClient } from './apiClient.js';
import { requireIdentifier, optionalString, combineRequestOptions } from './serviceHelpers.js';

export async function fetchDomainGovernanceSummaries(options = {}) {
  const response = await apiClient.get(
    '/domains/governance',
    combineRequestOptions({}, options),
  );
  if (!response || typeof response !== 'object') {
    return { contexts: [], generatedAt: new Date().toISOString() };
  }
  const contexts = Array.isArray(response.contexts) ? response.contexts : [];
  return {
    contexts,
    generatedAt: optionalString(response.generatedAt) || new Date().toISOString(),
  };
}

export async function fetchDomainGovernanceDetail(contextName, options = {}) {
  const resolvedContext = requireIdentifier(contextName, 'contextName');
  return apiClient.get(
    `/domains/${encodeURIComponent(resolvedContext)}/governance`,
    combineRequestOptions({}, options),
  );
}

export default {
  fetchDomainGovernanceSummaries,
  fetchDomainGovernanceDetail,
};
