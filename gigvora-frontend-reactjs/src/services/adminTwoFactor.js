import { apiClient } from './apiClient.js';
import {
  assertAdminAccess,
  buildAdminCacheKey,
  createRequestOptions,
  encodeIdentifier,
  fetchWithCache,
  invalidateCacheByTag,
  sanitiseQueryParams,
} from './adminServiceHelpers.js';

const SECURITY_ROLES = ['super-admin', 'platform-admin', 'security-admin'];
const CACHE_TAGS = {
  overview: 'admin:security:two-factor:overview',
  policies: 'admin:security:two-factor:policies',
  bypasses: 'admin:security:two-factor:bypasses',
};

function buildOverviewParams(params = {}) {
  return sanitiseQueryParams({
    status: params.status,
    search: params.search,
    page: params.page,
    pageSize: params.pageSize ?? params.page_size,
    sort: params.sort,
  });
}

async function performPolicyMutation(request) {
  const response = await request();
  invalidateCacheByTag(CACHE_TAGS.overview, CACHE_TAGS.policies);
  return response;
}

async function performBypassMutation(request) {
  const response = await request();
  invalidateCacheByTag(CACHE_TAGS.overview, CACHE_TAGS.bypasses);
  return response;
}

export function fetchTwoFactorOverview(params = {}, options = {}) {
  assertAdminAccess(SECURITY_ROLES);
  const cleanedParams = buildOverviewParams(params);
  const { forceRefresh = false, cacheTtl = 60000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:security:two-factor:overview', cleanedParams);

  return fetchWithCache(
    cacheKey,
    () =>
      apiClient.get(
        '/admin/security/two-factor',
        createRequestOptions(requestOptions, cleanedParams),
      ),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.overview,
    },
  );
}

export function createTwoFactorPolicy(payload, options = {}) {
  assertAdminAccess(SECURITY_ROLES);
  return performPolicyMutation(() =>
    apiClient.post('/admin/security/two-factor/policies', payload, options),
  );
}

export function updateTwoFactorPolicy(policyId, payload, options = {}) {
  assertAdminAccess(SECURITY_ROLES);
  const identifier = encodeIdentifier(policyId, { label: 'policyId' });
  return performPolicyMutation(() =>
    apiClient.put(`/admin/security/two-factor/policies/${identifier}`, payload, options),
  );
}

export function deleteTwoFactorPolicy(policyId, options = {}) {
  assertAdminAccess(SECURITY_ROLES);
  const identifier = encodeIdentifier(policyId, { label: 'policyId' });
  return performPolicyMutation(() =>
    apiClient.delete(`/admin/security/two-factor/policies/${identifier}`, options),
  );
}

export function issueTwoFactorBypass(payload, options = {}) {
  assertAdminAccess(SECURITY_ROLES);
  return performBypassMutation(() =>
    apiClient.post('/admin/security/two-factor/bypasses', payload, options),
  );
}

export function updateTwoFactorBypass(bypassId, payload, options = {}) {
  assertAdminAccess(SECURITY_ROLES);
  const identifier = encodeIdentifier(bypassId, { label: 'bypassId' });
  return performBypassMutation(() =>
    apiClient.patch(`/admin/security/two-factor/bypasses/${identifier}`, payload, options),
  );
}

export function approveTwoFactorEnrollment(enrollmentId, payload = {}, options = {}) {
  assertAdminAccess(SECURITY_ROLES);
  const identifier = encodeIdentifier(enrollmentId, { label: 'enrollmentId' });
  return performBypassMutation(() =>
    apiClient.post(
      `/admin/security/two-factor/enrollments/${identifier}/approve`,
      payload,
      options,
    ),
  );
}

export function revokeTwoFactorEnrollment(enrollmentId, payload = {}, options = {}) {
  assertAdminAccess(SECURITY_ROLES);
  const identifier = encodeIdentifier(enrollmentId, { label: 'enrollmentId' });
  return performBypassMutation(() =>
    apiClient.post(
      `/admin/security/two-factor/enrollments/${identifier}/revoke`,
      payload,
      options,
    ),
  );
}

export default {
  fetchTwoFactorOverview,
  createTwoFactorPolicy,
  updateTwoFactorPolicy,
  deleteTwoFactorPolicy,
  issueTwoFactorBypass,
  updateTwoFactorBypass,
  approveTwoFactorEnrollment,
  revokeTwoFactorEnrollment,
};
