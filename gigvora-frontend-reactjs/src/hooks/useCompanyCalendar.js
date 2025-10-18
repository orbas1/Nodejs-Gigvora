import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchCompanyCalendar } from '../services/companyCalendar.js';

const EMPTY_GROUPED_EVENTS = Object.freeze({
  project: [],
  interview: [],
  gig: [],
  mentorship: [],
  volunteering: [],
});

export function useCompanyCalendar({ workspaceId, filters = {}, enabled = true } = {}) {
  const normalizedFilters = useMemo(() => {
    const { from = null, to = null, types = [], limit = undefined, search = null } = filters || {};
    const cleanTypes = Array.isArray(types) ? types.filter(Boolean) : [];
    return {
      from,
      to,
      types: cleanTypes,
      limit,
      search: search && `${search}`.trim().length ? `${search}`.trim() : null,
    };
  }, [filters]);

  const filterKey = useMemo(() => JSON.stringify(normalizedFilters), [normalizedFilters]);

  const cacheKey = useMemo(() => {
    const identifier = workspaceId ?? 'unassigned';
    return `company:calendar:${identifier}:${filterKey}`;
  }, [workspaceId, filterKey]);

  const fetcher = useCallback(
    ({ signal } = {}) => {
      if (!workspaceId) {
        return Promise.resolve(null);
      }
      return fetchCompanyCalendar({ workspaceId, ...normalizedFilters, signal });
    },
    [workspaceId, normalizedFilters],
  );

  const state = useCachedResource(cacheKey, fetcher, {
    enabled: enabled && Boolean(workspaceId),
    dependencies: [workspaceId ?? null, filterKey],
    ttl: 1000 * 45,
  });

  const eventsByType = useMemo(() => {
    if (!state.data?.eventsByType) {
      return EMPTY_GROUPED_EVENTS;
    }
    return {
      project: state.data.eventsByType.project ?? [],
      interview: state.data.eventsByType.interview ?? [],
      gig: state.data.eventsByType.gig ?? [],
      mentorship: state.data.eventsByType.mentorship ?? [],
      volunteering: state.data.eventsByType.volunteering ?? [],
    };
  }, [state.data?.eventsByType]);

  const summary = useMemo(() => state.data?.summary ?? { totalsByType: {}, totalEvents: 0, upcomingByType: {}, overdueCount: 0 }, [
    state.data?.summary,
  ]);

  const workspace = state.data?.workspace ?? null;
  const availableWorkspaces = state.data?.meta?.availableWorkspaces ?? [];
  const supportedEventTypes = state.data?.meta?.supportedEventTypes ?? ['project', 'interview', 'gig', 'mentorship', 'volunteering'];
  const appliedFilters = state.data?.filters ?? normalizedFilters;

  return {
    ...state,
    eventsByType,
    summary,
    workspace,
    availableWorkspaces,
    supportedEventTypes,
    filters: appliedFilters,
  };
}

export default useCompanyCalendar;
