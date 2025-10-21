import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchCompanySystemPreferences } from '../services/companySystemPreferences.js';

export function useCompanySystemPreferences({ workspaceId } = {}, { enabled = true } = {}) {
  const cacheKey = useMemo(() => `company:system-preferences:${workspaceId ?? 'default'}`, [workspaceId]);

  const fetcher = useCallback(
    ({ signal } = {}) => fetchCompanySystemPreferences({ workspaceId, signal }),
    [workspaceId],
  );

  const state = useCachedResource(cacheKey, fetcher, {
    enabled,
    ttl: 1000 * 60,
    dependencies: [workspaceId],
  });

  const workspaceOptions = useMemo(() => {
    if (Array.isArray(state.data?.workspaceOptions)) {
      return state.data.workspaceOptions;
    }
    if (Array.isArray(state.data?.metadata?.workspaceOptions)) {
      return state.data.metadata.workspaceOptions;
    }
    return [];
  }, [state.data]);

  return {
    ...state,
    preferences: state.data?.preferences ?? {},
    automation: state.data?.automation ?? {},
    webhooks: Array.isArray(state.data?.webhooks) ? state.data.webhooks : [],
    apiTokens: Array.isArray(state.data?.apiTokens) ? state.data.apiTokens : [],
    workspace: state.data?.workspace ?? null,
    workspaceOptions,
  };
}

export default useCompanySystemPreferences;
