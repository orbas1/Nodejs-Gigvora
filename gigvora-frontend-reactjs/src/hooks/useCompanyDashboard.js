import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchCompanyDashboard } from '../services/company.js';
import { formatMetricNumber, formatMetricPercent } from '../utils/metrics.js';

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

    const {
      pipelineSummary,
      memberSummary,
      offers,
      interviewOperations,
      candidateExperience,
      alerts,
      employerBrandWorkforce,
    } = state.data;

    const brandWorkforce = employerBrandWorkforce ?? {};
    const attritionRisk = brandWorkforce.workforceAnalytics?.attritionRiskScore;
    const activeCampaigns = brandWorkforce.profileStudio?.campaignSummary?.active;
    const referralConversion = brandWorkforce.internalMobility?.referralConversionRate;

    const cards = [
      {
        label: 'Open requisitions',
        value: formatMetricNumber(state.data.jobSummary?.total ?? 0),
      },
      {
        label: 'Active candidates',
        value: formatMetricNumber(pipelineSummary?.totals?.applications ?? 0),
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
        value: formatMetricNumber(interviewOperations?.upcomingCount ?? 0),
      },
      {
        label: 'Open alerts',
        value: formatMetricNumber(alerts?.open ?? 0),
      },
      {
        label: 'Active recruiters',
        value: formatMetricNumber(memberSummary?.active ?? 0),
      },
      {
        label: 'Attrition risk',
        value: formatMetricPercent(attritionRisk),
      },
      {
        label: 'Brand campaigns',
        value: formatMetricNumber(activeCampaigns ?? 0),
      },
      {
        label: 'Referral conversion',
        value: formatMetricPercent(referralConversion),
      },
    ];

    const partnerships = state.data?.partnerships ?? {};
    if (partnerships.headhunterProgram?.briefs) {
      cards.push({
        label: 'Active headhunter briefs',
        value: formatMetricNumber(partnerships.headhunterProgram.briefs.active ?? 0),
      });
    }
    if (partnerships.talentPools?.totals) {
      cards.push({
        label: 'Talent pool hires',
        value: formatMetricNumber(partnerships.talentPools.totals.hiresFromPools ?? 0),
      });
    }
    if (partnerships.agencyCollaboration?.billing) {
      cards.push({
        label: 'Agency billing outstanding',
        value: partnerships.agencyCollaboration.billing.outstandingAmount
          ? formatMetricNumber(partnerships.agencyCollaboration.billing.outstandingAmount)
          : '—',
      });
    }

    return cards;
  }, [state.data]);

  return { ...state, summaryCards };
}

export default useCompanyDashboard;

