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

const FINANCE_ROLES = ['super-admin', 'platform-admin', 'finance-admin', 'treasury-admin'];
const CACHE_TAGS = {
  dashboard: 'admin:finance:dashboard',
};

function normaliseDashboardParams(params = {}) {
  return sanitiseQueryParams({
    lookbackDays: params.lookbackDays ?? params.lookback_days,
    currency: params.currency,
    includeEscrow: params.includeEscrow ?? params.include_escrow,
  });
}

async function performAndInvalidate(request, ...tags) {
  const response = await request();
  invalidateCacheByTag(CACHE_TAGS.dashboard, ...tags);
  return response;
}

export async function fetchFinanceDashboard(params = {}, options = {}) {
  assertAdminAccess(FINANCE_ROLES);
  const cleanedParams = normaliseDashboardParams(params);
  const { forceRefresh = false, cacheTtl = 60000, ...requestOptions } = options ?? {};
  const cacheKey = buildAdminCacheKey('admin:finance:dashboard', cleanedParams);

  return fetchWithCache(
    cacheKey,
    () => apiClient.get('/admin/finance/dashboard', createRequestOptions(requestOptions, cleanedParams)),
    {
      ttl: cacheTtl,
      forceRefresh,
      tag: CACHE_TAGS.dashboard,
    },
  );
}

export async function saveTreasuryPolicy(payload = {}, options = {}) {
  assertAdminAccess([...FINANCE_ROLES, 'compliance-admin']);
  return performAndInvalidate(() => apiClient.put('/admin/finance/treasury-policy', payload, options));
}

export async function createFeeRule(payload = {}, options = {}) {
  assertAdminAccess(FINANCE_ROLES);
  return performAndInvalidate(() => apiClient.post('/admin/finance/fee-rules', payload, options));
}

export async function updateFeeRule(feeRuleId, payload = {}, options = {}) {
  assertAdminAccess(FINANCE_ROLES);
  const identifier = encodeIdentifier(feeRuleId, { label: 'feeRuleId' });
  return performAndInvalidate(() => apiClient.put(`/admin/finance/fee-rules/${identifier}`, payload, options));
}

export async function deleteFeeRule(feeRuleId, options = {}) {
  assertAdminAccess(FINANCE_ROLES);
  const identifier = encodeIdentifier(feeRuleId, { label: 'feeRuleId' });
  return performAndInvalidate(() => apiClient.delete(`/admin/finance/fee-rules/${identifier}`, options));
}

export async function createPayoutSchedule(payload = {}, options = {}) {
  assertAdminAccess(FINANCE_ROLES);
  return performAndInvalidate(() => apiClient.post('/admin/finance/payout-schedules', payload, options));
}

export async function updatePayoutSchedule(payoutScheduleId, payload = {}, options = {}) {
  assertAdminAccess(FINANCE_ROLES);
  const identifier = encodeIdentifier(payoutScheduleId, { label: 'payoutScheduleId' });
  return performAndInvalidate(() =>
    apiClient.put(`/admin/finance/payout-schedules/${identifier}`, payload, options),
  );
}

export async function deletePayoutSchedule(payoutScheduleId, options = {}) {
  assertAdminAccess(FINANCE_ROLES);
  const identifier = encodeIdentifier(payoutScheduleId, { label: 'payoutScheduleId' });
  return performAndInvalidate(() => apiClient.delete(`/admin/finance/payout-schedules/${identifier}`, options));
}

export async function createEscrowAdjustment(payload = {}, options = {}) {
  assertAdminAccess([...FINANCE_ROLES, 'escrow-admin']);
  return performAndInvalidate(() => apiClient.post('/admin/finance/escrow-adjustments', payload, options));
}

export async function updateEscrowAdjustment(adjustmentId, payload = {}, options = {}) {
  assertAdminAccess([...FINANCE_ROLES, 'escrow-admin']);
  const identifier = encodeIdentifier(adjustmentId, { label: 'adjustmentId' });
  return performAndInvalidate(() =>
    apiClient.put(`/admin/finance/escrow-adjustments/${identifier}`, payload, options),
  );
}

export async function deleteEscrowAdjustment(adjustmentId, options = {}) {
  assertAdminAccess([...FINANCE_ROLES, 'escrow-admin']);
  const identifier = encodeIdentifier(adjustmentId, { label: 'adjustmentId' });
  return performAndInvalidate(() => apiClient.delete(`/admin/finance/escrow-adjustments/${identifier}`, options));
}

export default {
  fetchFinanceDashboard,
  saveTreasuryPolicy,
  createFeeRule,
  updateFeeRule,
  deleteFeeRule,
  createPayoutSchedule,
  updatePayoutSchedule,
  deletePayoutSchedule,
  createEscrowAdjustment,
  updateEscrowAdjustment,
  deleteEscrowAdjustment,
};
