import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';

export default function useDashboardOverviewResource({
  cacheKey,
  fetcher,
  enabled = true,
  dependencies = [],
  ttl = 1000 * 60,
}) {
  const stableKey = cacheKey || 'dashboard:overview';
  const stableFetcher = useCallback(
    (options = {}) => {
      if (!enabled || !fetcher) {
        return Promise.resolve(null);
      }
      return fetcher(options);
    },
    [enabled, fetcher],
  );

  const resource = useCachedResource(stableKey, stableFetcher, {
    enabled,
    dependencies: [stableKey, ...dependencies],
    ttl,
  });

  return useMemo(
    () => ({
      ...resource,
      data: resource.data ?? null,
    }),
    [resource],
  );
}
