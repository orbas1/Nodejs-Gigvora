import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchAgencyTimelineDashboard } from '../services/agencyTimeline.js';

const PIPELINE_ORDER = ['draft', 'scheduled', 'published', 'archived'];

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${(Number(value) * 100).toFixed(1)}%`;
}

export function useAgencyTimeline({ workspaceId, workspaceSlug, lookbackDays = 90, enabled = true } = {}) {
  const cacheKey = useMemo(() => {
    const identifier = workspaceSlug ?? workspaceId ?? 'default';
    return `agency:timeline:${identifier}:${lookbackDays}`;
  }, [workspaceId, workspaceSlug, lookbackDays]);

  const fetcher = useCallback(
    ({ signal } = {}) =>
      fetchAgencyTimelineDashboard({ workspaceId, workspaceSlug, lookbackDays, signal }),
    [workspaceId, workspaceSlug, lookbackDays],
  );

  const state = useCachedResource(cacheKey, fetcher, {
    enabled,
    dependencies: [workspaceId, workspaceSlug, lookbackDays],
    ttl: 1000 * 45,
  });

  const summaryMetrics = useMemo(() => {
    if (!state.data?.summary) {
      return [];
    }
    const summary = state.data.summary;
    return [
      { label: 'Posts', value: summary.totalPosts?.toLocaleString?.() ?? 0 },
      { label: 'Live', value: summary.publishedThisMonth?.toLocaleString?.() ?? 0 },
      { label: 'Queued', value: summary.scheduledCount?.toLocaleString?.() ?? 0 },
      {
        label: 'Eng%',
        value: summary.averageEngagementRate != null ? formatPercent(summary.averageEngagementRate) : '—',
      },
    ];
  }, [state.data?.summary]);

  const pipelineColumns = useMemo(() => {
    const pipeline = state.data?.pipeline ?? {};
    return PIPELINE_ORDER.map((status) => ({
      status,
      items: pipeline[status] ?? [],
    }));
  }, [state.data?.pipeline]);

  const trend = useMemo(() => state.data?.analytics?.trend ?? [], [state.data?.analytics?.trend]);
  const topPosts = useMemo(() => state.data?.analytics?.topPosts ?? [], [state.data?.analytics?.topPosts]);
  const channelBreakdown = useMemo(
    () => state.data?.analytics?.channelBreakdown ?? [],
    [state.data?.analytics?.channelBreakdown],
  );

  return {
    ...state,
    summaryMetrics,
    pipelineColumns,
    trend,
    topPosts,
    channelBreakdown,
  };
}

export default useAgencyTimeline;
