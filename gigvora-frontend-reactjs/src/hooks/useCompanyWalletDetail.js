import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchCompanyWalletDetail } from '../services/companyWallets.js';

export default function useCompanyWalletDetail(
  walletId,
  { workspaceId, workspaceSlug, enabled = true } = {},
) {
  const workspaceKey = useMemo(
    () => (workspaceSlug ? `slug:${workspaceSlug}` : workspaceId ? `id:${workspaceId}` : 'default'),
    [workspaceId, workspaceSlug],
  );

  const cacheKey = useMemo(() => {
    if (!walletId) {
      return `company:wallet:none:${workspaceKey}`;
    }
    return `company:wallet:${walletId}:${workspaceKey}`;
  }, [walletId, workspaceKey]);

  const fetcher = useCallback(
    ({ signal } = {}) => {
      if (!walletId) {
        return Promise.resolve(null);
      }
      return fetchCompanyWalletDetail(walletId, { workspaceId, workspaceSlug, signal });
    },
    [walletId, workspaceId, workspaceSlug],
  );

  const resource = useCachedResource(cacheKey, fetcher, {
    enabled: enabled && Boolean(walletId),
    dependencies: [walletId, workspaceId, workspaceSlug],
    ttl: 1000 * 15,
  });

  if (!walletId) {
    return {
      data: null,
      error: null,
      loading: false,
      fromCache: false,
      lastUpdated: null,
      refresh: async () => ({ data: null, fromCache: false }),
    };
  }

  return resource;
}
