import { useMemo } from 'react';
import { useCachedResource } from './useCachedResource.js';
import {
  buildWalletOverviewCacheKey,
  fetchWalletOverview,
  buildWalletAccountsCacheKey,
  fetchWalletAccounts,
  buildLedgerCacheKey,
  fetchWalletLedgerEntries,
  buildFundingSourcesCacheKey,
  fetchFundingSources,
  buildPayoutRequestsCacheKey,
  fetchPayoutRequests,
  buildWalletSettingsCacheKey,
  fetchWalletSettings,
} from '../services/agencyWallet.js';

export function useAgencyWalletOverview({ workspaceId, enabled = true } = {}) {
  const cacheKey = useMemo(() => buildWalletOverviewCacheKey(workspaceId), [workspaceId]);
  return useCachedResource(
    cacheKey,
    ({ signal, force }) => fetchWalletOverview({ workspaceId, signal, forceRefresh: force }),
    { ttl: 1000 * 60, dependencies: [workspaceId], enabled },
  );
}

export function useAgencyWalletAccounts({ workspaceId, status, search, page = 0, pageSize = 25, enabled = true } = {}) {
  const cacheKey = useMemo(
    () => buildWalletAccountsCacheKey({ workspaceId, status, search, page, pageSize }),
    [workspaceId, status, search, page, pageSize],
  );
  return useCachedResource(
    cacheKey,
    ({ signal, force }) =>
      fetchWalletAccounts({ workspaceId, status, search, page, pageSize, signal, forceRefresh: force }),
    {
      ttl: 1000 * 30,
      dependencies: [workspaceId, status, search, page, pageSize],
      enabled,
    },
  );
}

export function useAgencyWalletLedger(accountId, { entryType, page = 0, pageSize = 50, enabled = true } = {}) {
  const cacheKey = useMemo(
    () => (accountId ? buildLedgerCacheKey(accountId, { entryType, page, pageSize }) : null),
    [accountId, entryType, page, pageSize],
  );
  return useCachedResource(
    cacheKey || 'agencyWallet:ledger:none',
    ({ signal, force }) =>
      accountId
        ? fetchWalletLedgerEntries(accountId, { entryType, page, pageSize, signal, forceRefresh: force })
        : Promise.resolve({ items: [], total: 0 }),
    {
      ttl: 1000 * 15,
      dependencies: [accountId, entryType, page, pageSize],
      enabled: enabled && Boolean(accountId),
    },
  );
}

export function useAgencyWalletFundingSources({ workspaceId, enabled = true } = {}) {
  const cacheKey = useMemo(() => buildFundingSourcesCacheKey(workspaceId), [workspaceId]);
  return useCachedResource(
    cacheKey,
    ({ signal, force }) => fetchFundingSources({ workspaceId, signal, forceRefresh: force }),
    { ttl: 1000 * 60, dependencies: [workspaceId], enabled },
  );
}

export function useAgencyWalletPayouts({ workspaceId, status, enabled = true } = {}) {
  const cacheKey = useMemo(
    () => buildPayoutRequestsCacheKey({ workspaceId, status }),
    [workspaceId, status],
  );
  return useCachedResource(
    cacheKey,
    ({ signal, force }) => fetchPayoutRequests({ workspaceId, status, signal, forceRefresh: force }),
    { ttl: 1000 * 45, dependencies: [workspaceId, status], enabled },
  );
}

export function useAgencyWalletSettings({ workspaceId, enabled = true } = {}) {
  const cacheKey = useMemo(() => buildWalletSettingsCacheKey(workspaceId), [workspaceId]);
  return useCachedResource(
    cacheKey,
    ({ signal, force }) => (workspaceId ? fetchWalletSettings({ workspaceId, signal, forceRefresh: force }) : null),
    { ttl: 1000 * 120, dependencies: [workspaceId], enabled: enabled && Boolean(workspaceId) },
  );
}

export default {
  useAgencyWalletOverview,
  useAgencyWalletAccounts,
  useAgencyWalletLedger,
  useAgencyWalletFundingSources,
  useAgencyWalletPayouts,
  useAgencyWalletSettings,
};
