import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchWalletTransactions } from '../services/companyWallets.js';

export default function useWalletTransactions(
  walletId,
  {
    workspaceId,
    workspaceSlug,
    filters = {},
    enabled = true,
  } = {},
) {
  const {
    type = undefined,
    status = undefined,
    category = undefined,
    dateFrom = undefined,
    dateTo = undefined,
    limit = 25,
    offset = 0,
  } = filters ?? {};

  const workspaceKey = useMemo(
    () => (workspaceSlug ? `slug:${workspaceSlug}` : workspaceId ? `id:${workspaceId}` : 'default'),
    [workspaceId, workspaceSlug],
  );

  const normalizedFilters = useMemo(
    () => ({
      type: type || undefined,
      status: status || undefined,
      category: category || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      limit: limit ?? 25,
      offset: offset ?? 0,
    }),
    [type, status, category, dateFrom, dateTo, limit, offset],
  );

  const filterKey = useMemo(() => JSON.stringify(normalizedFilters), [normalizedFilters]);

  const cacheKey = useMemo(() => {
    if (!walletId) {
      return `company:wallet:transactions:none:${workspaceKey}:${filterKey}`;
    }
    return `company:wallet:${walletId}:transactions:${workspaceKey}:${filterKey}`;
  }, [walletId, workspaceKey, filterKey]);

  const fetcher = useCallback(
    ({ signal } = {}) => {
      if (!walletId) {
        return Promise.resolve({ items: [], pagination: { total: 0, limit: normalizedFilters.limit, offset: 0 } });
      }
      return fetchWalletTransactions(walletId, {
        workspaceId,
        workspaceSlug,
        ...normalizedFilters,
        signal,
      });
    },
    [walletId, workspaceId, workspaceSlug, normalizedFilters],
  );

  const resource = useCachedResource(cacheKey, fetcher, {
    enabled: enabled && Boolean(walletId),
    dependencies: [walletId, workspaceId, workspaceSlug, filterKey],
    ttl: 1000 * 15,
  });

  if (!walletId) {
    return {
      data: { items: [], pagination: { total: 0, limit: normalizedFilters.limit, offset: 0 } },
      error: null,
      loading: false,
      fromCache: false,
      lastUpdated: null,
      refresh: async () => ({ data: { items: [], pagination: { total: 0, limit: normalizedFilters.limit, offset: 0 } } }),
      filters: normalizedFilters,
      cacheKey,
    };
  }

  return {
    ...resource,
    filters: normalizedFilters,
    cacheKey,
  };
}
