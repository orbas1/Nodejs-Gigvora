import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchCompanyProfileWorkspace } from '../services/companyProfile.js';

export function useCompanyProfileWorkspace({ enabled = true } = {}) {
  const cacheKey = 'company:profile:workspace';
  const fetcher = useCallback(({ signal } = {}) => fetchCompanyProfileWorkspace({ signal }), []);

  const state = useCachedResource(cacheKey, fetcher, {
    enabled,
    ttl: 1000 * 30,
  });

  const metrics = useMemo(() => ({
    followersTotal: state.data?.metrics?.followersTotal ?? 0,
    followersActive: state.data?.metrics?.followersActive ?? 0,
    followersNew30d: state.data?.metrics?.followersNew30d ?? 0,
    connectionsTotal: state.data?.metrics?.connectionsTotal ?? 0,
    connectionsActive: state.data?.metrics?.connectionsActive ?? 0,
    connectionsPending: state.data?.metrics?.connectionsPending ?? 0,
  }), [state.data?.metrics]);

  return {
    ...state,
    metrics,
    profile: state.data?.profile ?? null,
    followers: state.data?.followers ?? [],
    connections: state.data?.connections ?? [],
    permissions: state.data?.permissions ?? {
      canEditProfile: false,
      canManageFollowers: false,
      canManageConnections: false,
    },
  };
}

export default useCompanyProfileWorkspace;
