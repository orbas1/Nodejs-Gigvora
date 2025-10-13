import { useMemo } from 'react';
import { useCachedResource } from './useCachedResource.js';
import { fetchControlTowerOverview, buildFinanceOverviewCacheKey } from '../services/finance.js';

export function useFinanceControlTower({ userId, enabled = true } = {}) {
  const cacheKey = useMemo(() => buildFinanceOverviewCacheKey(userId), [userId]);

  const resource = useCachedResource(
    cacheKey,
    ({ signal, force }) => fetchControlTowerOverview({ userId, signal, forceRefresh: force }),
    { ttl: 1000 * 60 * 5, dependencies: [userId], enabled },
  );

  return resource;
}

export default useFinanceControlTower;
