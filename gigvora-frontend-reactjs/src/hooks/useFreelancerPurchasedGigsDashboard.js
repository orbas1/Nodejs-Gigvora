import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchFreelancerPurchasedGigWorkspace } from '../services/freelancer.js';

function formatCurrency(value, currency = 'USD') {
  if (value == null) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${value}`;
  }
}

export function useFreelancerPurchasedGigsDashboard({ freelancerId, enabled = true, fresh = false } = {}) {
  const cacheKey = useMemo(() => {
    const safeId = freelancerId ?? 'unknown';
    return `freelancer:purchased-gigs:${safeId}`;
  }, [freelancerId]);

  const fetcher = useCallback(
    ({ signal } = {}) => fetchFreelancerPurchasedGigWorkspace(freelancerId, { signal, fresh }),
    [freelancerId, fresh],
  );

  const state = useCachedResource(cacheKey, fetcher, {
    enabled: Boolean(freelancerId) && enabled,
    dependencies: [freelancerId, fresh],
    ttl: 1000 * 60,
  });

  const summaryCards = useMemo(() => {
    if (!state.data) {
      return [];
    }
    const { summary } = state.data;
    const currency = state.data.orders?.[0]?.currencyCode ?? 'USD';
    return [
      {
        label: 'Active orders',
        value: summary?.activeOrders ?? 0,
        hint: `${formatCurrency(summary?.pipelineValue ?? 0, currency)} pipeline value`,
      },
      {
        label: 'Requirements outstanding',
        value: summary?.requirementsDue ?? 0,
        hint: 'Awaiting client inputs to start production',
      },
      {
        label: 'Revision cycles',
        value: summary?.revisionCount ?? 0,
        hint: 'Feedback loops currently in progress',
      },
      {
        label: 'Payouts queued',
        value: formatCurrency(summary?.pendingPayoutValue ?? 0, currency),
        hint: `${summary?.payoutsDueThisWeek ?? 0} expected this week`,
      },
    ];
  }, [state.data]);

  return { ...state, summaryCards };
}

export default useFreelancerPurchasedGigsDashboard;
