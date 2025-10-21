import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchCompanyMetricsDashboard } from '../services/companyMetrics.js';

function normaliseSummaryCards(summary) {
  if (!summary) {
    return [];
  }
  if (Array.isArray(summary)) {
    return summary
      .filter(Boolean)
      .map((item) => ({
        label: item.label ?? item.name ?? 'Metric',
        value: item.value ?? item.metric ?? '—',
        delta: item.delta ?? item.change ?? null,
        tone: item.tone ?? item.sentiment ?? null,
        helper: item.helper ?? item.description ?? null,
      }));
  }
  if (typeof summary === 'object') {
    return Object.entries(summary).map(([label, value]) => ({
      label,
      value,
    }));
  }
  return [];
}

export function useCompanyMetricsDashboard({ workspaceId, lookbackDays = 30, focus } = {}, { enabled = true } = {}) {
  const cacheKey = useMemo(() => {
    const identifier = workspaceId ?? 'default';
    const scope = focus ?? 'all';
    return `company:metrics:${identifier}:${lookbackDays}:${scope}`;
  }, [workspaceId, lookbackDays, focus]);

  const fetcher = useCallback(
    ({ signal } = {}) => fetchCompanyMetricsDashboard({ workspaceId, lookbackDays, focus, signal }),
    [workspaceId, lookbackDays, focus],
  );

  const state = useCachedResource(cacheKey, fetcher, {
    enabled,
    ttl: 1000 * 45,
    dependencies: [workspaceId, lookbackDays, focus],
  });

  const metrics = useMemo(() => state.data?.metrics ?? {}, [state.data]);
  const summaryCards = useMemo(() => normaliseSummaryCards(metrics.summary), [metrics.summary]);
  const trendSeries = useMemo(() => metrics.trends ?? {}, [metrics.trends]);
  const forecast = useMemo(() => metrics.forecast ?? null, [metrics.forecast]);
  const health = useMemo(() => metrics.health ?? {}, [metrics.health]);

  const workspaceOptions = useMemo(() => {
    if (Array.isArray(state.data?.workspaceOptions)) {
      return state.data.workspaceOptions;
    }
    if (Array.isArray(state.data?.workspaces)) {
      return state.data.workspaces;
    }
    if (Array.isArray(state.data?.metadata?.workspaceOptions)) {
      return state.data.metadata.workspaceOptions;
    }
    return [];
  }, [state.data]);

  return {
    ...state,
    metrics,
    summaryCards,
    trendSeries,
    forecast,
    health,
    goals: Array.isArray(state.data?.goals) ? state.data.goals : [],
    snapshots: Array.isArray(state.data?.snapshots) ? state.data.snapshots : [],
    alerts: Array.isArray(state.data?.alerts) ? state.data.alerts : [],
    workspace: state.data?.workspace ?? null,
    workspaceOptions,
    filters: state.data?.filters ?? {},
  };
}

export default useCompanyMetricsDashboard;
