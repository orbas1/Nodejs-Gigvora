import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchCompanyDashboard } from '../services/company.js';

function formatNumber(value) {
  if (value == null) return '—';
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return `${value}`;
  }
  return numeric.toLocaleString();
}

export function useCompanyDashboard({ workspaceId, workspaceSlug, lookbackDays = 30, enabled = true } = {}) {
  const cacheKey = useMemo(() => {
    const identifier = workspaceSlug ?? workspaceId ?? 'default';
    return `company:dashboard:${identifier}:${lookbackDays}`;
  }, [workspaceId, workspaceSlug, lookbackDays]);

  const fetcher = useCallback(
    ({ signal } = {}) => fetchCompanyDashboard({ workspaceId, workspaceSlug, lookbackDays, signal }),
    [workspaceId, workspaceSlug, lookbackDays],
  );

  const state = useCachedResource(cacheKey, fetcher, {
    enabled,
    dependencies: [workspaceId, workspaceSlug, lookbackDays],
    ttl: 1000 * 45,
  });

  const summaryCards = useMemo(() => {
    if (!state.data) {
      return [];
    }

    const { pipelineSummary, memberSummary, partnerSummary, offers } = state.data;

    return [
      {
        label: 'Open roles & gigs',
        value: formatNumber(state.data.jobSummary?.total ?? 0),
      },
      {
        label: 'Active candidates',
        value: formatNumber(pipelineSummary?.totals?.applications ?? 0),
      },
      {
        label: 'Avg days to decision',
        value:
          pipelineSummary?.velocity?.averageDaysToDecision != null
            ? `${pipelineSummary.velocity.averageDaysToDecision}`
            : '—',
      },
      {
        label: 'Partner touchpoints',
        value: formatNumber(partnerSummary?.touchpoints ?? 0),
      },
      {
        label: 'Offer win rate',
        value:
          offers?.winRate != null && Number.isFinite(Number(offers.winRate))
            ? `${Number(offers.winRate).toFixed(1)}%`
            : '—',
      },
      {
        label: 'Active recruiters',
        value: formatNumber(memberSummary?.active ?? 0),
      },
    ];
  }, [state.data]);

  return { ...state, summaryCards };
}

export default useCompanyDashboard;

