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

const IDENTITY_ROLES = ['super-admin', 'platform-admin', 'compliance-admin', 'trust-admin'];
const CACHE_TAGS = {
  overview: 'admin:identity:overview',
  list: 'admin:identity:requests',
  settings: 'admin:identity:settings',
};

function normaliseOverviewParams(params = {}) {
  return sanitiseQueryParams({
    lookbackDays: params.lookbackDays ?? params.lookback_days,
    includeRiskSignals: params.includeRiskSignals ?? params.include_risk_signals,
  });
}

function normaliseRequestParams(params = {}) {
  return sanitiseQueryParams({
    status: params.status,
    riskLevel: params.riskLevel ?? params.risk_level,
    ownerId: params.ownerId ?? params.owner_id,
    page: params.page,
    pageSize: params.pageSize ?? params.page_size,
    search: params.search,
    sort: params.sort,
  });
}

export function fetchIdentityVerificationOverview(params = {}, options = {}) {
  assertAdminAccess(IDENTITY_ROLES);
  const cleanedParams = normaliseOverviewParams(params);
  const { forceRefresh = false, cacheTtl = 60000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:identity:overview', cleanedParams);

  return fetchWithCache(
    cacheKey,
    () =>
      apiClient.get(
        '/admin/verification/identity/overview',
        createRequestOptions(requestOptions, cleanedParams),
      ),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.overview,
    },
  );
}

export function fetchIdentityVerifications(params = {}, options = {}) {
  assertAdminAccess(IDENTITY_ROLES);
  const cleanedParams = normaliseRequestParams(params);
  const { forceRefresh = false, cacheTtl = 60000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:identity:requests', cleanedParams);

  return fetchWithCache(
    cacheKey,
    () =>
      apiClient.get(
        '/admin/verification/identity/requests',
        createRequestOptions(requestOptions, cleanedParams),
      ),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.list,
    },
  );
}

export function fetchIdentityVerification(verificationId, options = {}) {
  assertAdminAccess(IDENTITY_ROLES);
  const identifier = encodeIdentifier(verificationId, { label: 'verificationId' });
  return apiClient.get(`/admin/verification/identity/requests/${identifier}`, options);
}

async function performAndInvalidate(request) {
  const response = await request();
  invalidateCacheByTag(CACHE_TAGS.overview, CACHE_TAGS.list);
  return response;
}

export function createIdentityVerification(payload = {}, options = {}) {
  assertAdminAccess(IDENTITY_ROLES);
  return performAndInvalidate(() =>
    apiClient.post('/admin/verification/identity/requests', payload, options),
  );
}

export function updateIdentityVerification(verificationId, payload = {}, options = {}) {
  assertAdminAccess(IDENTITY_ROLES);
  const identifier = encodeIdentifier(verificationId, { label: 'verificationId' });
  return performAndInvalidate(() =>
    apiClient.patch(`/admin/verification/identity/requests/${identifier}`, payload, options),
  );
}

export function createIdentityVerificationEvent(verificationId, payload = {}, options = {}) {
  assertAdminAccess(IDENTITY_ROLES);
  const identifier = encodeIdentifier(verificationId, { label: 'verificationId' });
  return performAndInvalidate(() =>
    apiClient.post(`/admin/verification/identity/requests/${identifier}/events`, payload, options),
  );
}

export function fetchIdentityVerificationSettings(options = {}) {
  assertAdminAccess(IDENTITY_ROLES);
  const { forceRefresh = false, cacheTtl = 5 * 60 * 1000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:identity:settings');

  return fetchWithCache(
    cacheKey,
    () =>
      apiClient.get(
        '/admin/verification/identity/settings',
        createRequestOptions(requestOptions),
      ),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.settings,
    },
  );
}

export async function updateIdentityVerificationSettings(payload = {}, options = {}) {
  assertAdminAccess(IDENTITY_ROLES);
  const response = await apiClient.put('/admin/verification/identity/settings', payload, options);
  invalidateCacheByTag(CACHE_TAGS.settings);
  return response;
}

export default {
  fetchIdentityVerificationOverview,
  fetchIdentityVerifications,
  fetchIdentityVerification,
  createIdentityVerification,
  updateIdentityVerification,
  createIdentityVerificationEvent,
  fetchIdentityVerificationSettings,
  updateIdentityVerificationSettings,
};
