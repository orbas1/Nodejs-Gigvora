import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchCompanyWallets } from '../services/companyWallets.js';

export default function useCompanyWallets({ workspaceId, workspaceSlug, includeInactive = false, enabled = true } = {}) {
  const cacheKey = useMemo(() => {
    const identifier = workspaceSlug ?? workspaceId ?? 'default';
    return `company:wallets:${identifier}:${includeInactive ? 'all' : 'active'}`;
  }, [workspaceId, workspaceSlug, includeInactive]);

  const fetcher = useCallback(
    ({ signal } = {}) =>
      fetchCompanyWallets({ workspaceId, workspaceSlug, includeInactive, signal }),
    [workspaceId, workspaceSlug, includeInactive],
  );

  return useCachedResource(cacheKey, fetcher, {
    enabled,
    dependencies: [workspaceId, workspaceSlug, includeInactive],
    ttl: 1000 * 30,
  });
}
