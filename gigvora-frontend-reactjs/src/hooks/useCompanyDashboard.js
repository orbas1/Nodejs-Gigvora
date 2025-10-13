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

    const { pipelineSummary, memberSummary, offers, interviewOperations, candidateExperience, alerts } = state.data;

    const cards = [
      {
        label: 'Open requisitions',
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
        label: 'Candidate NPS',
        value:
          candidateExperience?.nps != null && Number.isFinite(Number(candidateExperience.nps))
            ? `${Number(candidateExperience.nps).toFixed(1)}`
            : '—',
      },
      {
        label: 'Offer win rate',
        value:
          offers?.winRate != null && Number.isFinite(Number(offers.winRate))
            ? `${Number(offers.winRate).toFixed(1)}%`
            : '—',
      },
      {
        label: 'Upcoming interviews',
        value: formatNumber(interviewOperations?.upcomingCount ?? 0),
      },
      {
        label: 'Open alerts',
        value: formatNumber(alerts?.open ?? 0),
      },
      {
        label: 'Active recruiters',
        value: formatNumber(memberSummary?.active ?? 0),
      },
    ];

    const partnerships = state.data?.partnerships ?? {};
    if (partnerships.headhunterProgram?.briefs) {
      cards.push({
        label: 'Active headhunter briefs',
        value: formatNumber(partnerships.headhunterProgram.briefs.active ?? 0),
      });
    }
    if (partnerships.talentPools?.totals) {
      cards.push({
        label: 'Talent pool hires',
        value: formatNumber(partnerships.talentPools.totals.hiresFromPools ?? 0),
      });
    }
    if (partnerships.agencyCollaboration?.billing) {
      cards.push({
        label: 'Agency billing outstanding',
        value: partnerships.agencyCollaboration.billing.outstandingAmount
          ? formatNumber(partnerships.agencyCollaboration.billing.outstandingAmount)
          : '—',
      });
    }

    return cards;
  }, [state.data]);

  return { ...state, summaryCards };
}

export default useCompanyDashboard;

