import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchCompanySettings } from '../services/companySettings.js';

export function useCompanySettings({ workspaceId } = {}, { enabled = true } = {}) {
  const cacheKey = useMemo(() => `company:settings:${workspaceId ?? 'default'}`, [workspaceId]);

  const fetcher = useCallback(({ signal } = {}) => fetchCompanySettings({ workspaceId, signal }), [workspaceId]);

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
    general: state.data?.general ?? {},
    notifications: state.data?.notifications ?? {},
    workflows: Array.isArray(state.data?.workflows) ? state.data.workflows : [],
    journeys: Array.isArray(state.data?.journeys) ? state.data.journeys : [],
    directories: state.data?.directories ?? {},
    workspace: state.data?.workspace ?? null,
    workspaceOptions,
  };
}

export default useCompanySettings;
