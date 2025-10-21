import { apiClient } from './apiClient.js';
import {
  requireIdentifier,
  optionalString,
  mergeWorkspace,
  combineRequestOptions,
} from './serviceHelpers.js';

export async function fetchAdminConsentPolicies(filters = {}, options = {}) {
  const { workspaceId, workspaceSlug, ...restFilters } = filters;
  const params = {
    ...restFilters,
    ...mergeWorkspace({}, { workspaceId, workspaceSlug }),
  };

  return apiClient.get(
    '/admin/governance/consents',
    combineRequestOptions({ params }, options),
  );
}

export async function fetchConsentPolicy(policyCode, options = {}) {
  const resolvedPolicyCode = requireIdentifier(policyCode, 'policyCode');
  return apiClient.get(
    `/admin/governance/consents/${resolvedPolicyCode}`,
    combineRequestOptions({}, options),
  );
}

export async function createConsentPolicy(payload = {}, { workspaceId, workspaceSlug, ...options } = {}) {
  const body = mergeWorkspace({ ...(payload || {}) }, { workspaceId, workspaceSlug });
  return apiClient.post('/admin/governance/consents', body, combineRequestOptions({}, options));
}

export async function updateConsentPolicy(policyId, payload = {}, { workspaceId, workspaceSlug, ...options } = {}) {
  const resolvedPolicyId = requireIdentifier(policyId, 'policyId');
  const body = mergeWorkspace({ ...(payload || {}) }, { workspaceId, workspaceSlug });
  return apiClient.patch(
    `/admin/governance/consents/${resolvedPolicyId}`,
    body,
    combineRequestOptions({}, options),
  );
}

export async function createConsentPolicyVersion(policyId, payload = {}, { workspaceId, workspaceSlug, ...options } = {}) {
  const resolvedPolicyId = requireIdentifier(policyId, 'policyId');
  const body = mergeWorkspace({ ...(payload || {}) }, { workspaceId, workspaceSlug });
  return apiClient.post(
    `/admin/governance/consents/${resolvedPolicyId}/versions`,
    body,
    combineRequestOptions({}, options),
  );
}

export async function deleteConsentPolicy(policyId, options = {}) {
  const resolvedPolicyId = requireIdentifier(policyId, 'policyId');
  return apiClient.delete(
    `/admin/governance/consents/${resolvedPolicyId}`,
    combineRequestOptions({}, options),
  );
}

export async function fetchUserConsentSnapshot(userId, filters = {}, options = {}) {
  const resolvedUserId = requireIdentifier(userId, 'userId');
  return apiClient.get(
    `/users/${resolvedUserId}/consents`,
    combineRequestOptions({ params: filters }, options),
  );
}

export async function updateUserConsent(userId, policyCode, payload = {}, options = {}) {
  const resolvedUserId = requireIdentifier(userId, 'userId');
  const resolvedPolicyCode = requireIdentifier(policyCode, 'policyCode');
  const body = { ...(payload || {}) };
  const status = optionalString(body.status);
  if (status) {
    body.status = status;
  } else {
    delete body.status;
  }
  return apiClient.put(
    `/users/${resolvedUserId}/consents/${resolvedPolicyCode}`,
    body,
    combineRequestOptions({}, options),
  );
}

export default {
  fetchAdminConsentPolicies,
  fetchConsentPolicy,
  createConsentPolicy,
  updateConsentPolicy,
  createConsentPolicyVersion,
  deleteConsentPolicy,
  fetchUserConsentSnapshot,
  updateUserConsent,
};
