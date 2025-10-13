import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchHeadhunterDashboard } from '../services/headhunter.js';

export function useHeadhunterDashboard({ workspaceId, lookbackDays = 30, enabled = true } = {}) {
  const cacheKey = useMemo(() => {
    const safeWorkspaceId = workspaceId ?? 'default';
    return `headhunter:dashboard:${safeWorkspaceId}:${lookbackDays}`;
  }, [workspaceId, lookbackDays]);

  const fetcher = useCallback(
    ({ signal } = {}) => fetchHeadhunterDashboard({ workspaceId, lookbackDays, signal }),
    [workspaceId, lookbackDays],
  );

  const state = useCachedResource(cacheKey, fetcher, {
    enabled,
    dependencies: [workspaceId, lookbackDays],
    ttl: 1000 * 30,
  });

  const summaryCards = useMemo(() => {
    if (!state.data) {
      return [];
    }
    const { workspaceSummary, pipelineSummary, mandatePortfolio } = state.data;
    const currency = workspaceSummary?.defaultCurrency ?? 'USD';
    const formatCurrency = (value) => {
      if (value == null) return '—';
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
          maximumFractionDigits: 0,
        }).format(Number(value));
      } catch (error) {
        return `${value}`;
      }
    };

    return [
      {
        label: 'Active mandates',
        value: mandatePortfolio?.totals?.activeMandates ?? 0,
      },
      {
        label: 'Pipeline candidates',
        value: pipelineSummary?.totals?.active ?? 0,
      },
      {
        label: 'Avg days to decision',
        value: pipelineSummary?.velocityDays != null ? `${pipelineSummary.velocityDays}` : '—',
      },
      {
        label: 'Pipeline value',
        value: formatCurrency(mandatePortfolio?.totals?.pipelineValue ?? 0),
      },
    ];
  }, [state.data]);

  return { ...state, summaryCards };
}

export default useHeadhunterDashboard;
