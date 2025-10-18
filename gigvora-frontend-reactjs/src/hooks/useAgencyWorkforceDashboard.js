import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchAgencyWorkforceDashboard } from '../services/agencyWorkforce.js';

function normaliseNumber(value, fallback = 0) {
  if (value == null) {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return numeric;
}

export function useAgencyWorkforceDashboard({ workspaceId, enabled = true } = {}) {
  const cacheKey = useMemo(() => `agency:workforce:${workspaceId ?? 'default'}`, [workspaceId]);

  const fetcher = useCallback(
    ({ signal } = {}) => fetchAgencyWorkforceDashboard({ workspaceId }, { signal }),
    [workspaceId],
  );

  const state = useCachedResource(cacheKey, fetcher, {
    dependencies: [workspaceId],
    enabled,
    ttl: 45 * 1000,
  });

  const summaryCards = useMemo(() => {
    const metrics = state.data?.metrics ?? {};
    return [
      {
        id: 'headcount',
        label: 'Headcount',
        value: normaliseNumber(metrics.totalMembers, 0),
        sectionId: 'team',
      },
      {
        id: 'active',
        label: 'Active team',
        value: normaliseNumber(metrics.activeMembers, 0),
        sectionId: 'team',
      },
      {
        id: 'benchHours',
        label: 'Bench hrs',
        value: `${normaliseNumber(metrics.benchHours, 0).toFixed(1)}`,
        sectionId: 'capacity',
      },
      {
        id: 'assignments',
        label: 'Delegations',
        value: normaliseNumber(metrics.totalActiveAssignments, 0),
        sectionId: 'projects',
      },
      {
        id: 'utilisation',
        label: 'Utilisation',
        value: `${normaliseNumber(metrics.utilizationPercent, 0).toFixed(1)}%`,
        sectionId: 'capacity',
      },
      {
        id: 'payouts',
        label: 'Payouts',
        value: normaliseNumber(metrics.upcomingPayouts, 0),
        sectionId: 'pay',
      },
      {
        id: 'averageRate',
        label: 'Avg rate',
        value:
          metrics.averageBillableRate != null
            ? `$${normaliseNumber(metrics.averageBillableRate, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
            : '—',
        sectionId: 'pay',
      },
      {
        id: 'onLeave',
        label: 'On leave',
        value: normaliseNumber(metrics.onLeave, 0),
        sectionId: 'availability',
      },
    ];
  }, [state.data]);

  const latestCapacity = useMemo(() => {
    const snapshots = state.data?.capacitySnapshots ?? [];
    return snapshots.length ? snapshots[0] : null;
  }, [state.data?.capacitySnapshots]);

  return {
    ...state,
    workspaceId: state.data?.workspaceId ?? workspaceId ?? null,
    summaryCards,
    latestCapacity,
  };
}

export default useAgencyWorkforceDashboard;
