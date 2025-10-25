import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchFreelancerOrderPipeline } from '../services/orderPipeline.js';

const DEFAULT_SUMMARY = Object.freeze({
  totals: {
    orders: 0,
    openOrders: 0,
    closedOrders: 0,
    totalValue: 0,
    openValue: 0,
    completedValue: 0,
    currency: 'USD',
  },
  pipeline: {},
  requirementForms: {
    pending: 0,
    submitted: 0,
    approved: 0,
    needsRevision: 0,
    overdue: 0,
  },
  revisions: {
    active: 0,
    awaitingReview: 0,
    completed: 0,
    declined: 0,
  },
  escrow: {
    counts: {
      funded: 0,
      pendingRelease: 0,
      released: 0,
      held: 0,
      disputed: 0,
    },
    amounts: {
      totalFunded: 0,
      outstanding: 0,
      releasedValue: 0,
      currency: 'USD',
    },
  },
  health: {
    csatAverage: null,
    kickoffScheduled: 0,
    deliveryDueSoon: 0,
  },
});

function normaliseSummary(raw) {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_SUMMARY;
  }

  const escrowCounts = {
    ...DEFAULT_SUMMARY.escrow.counts,
    ...(raw.escrow?.counts ?? {}),
  };

  return {
    totals: { ...DEFAULT_SUMMARY.totals, ...(raw.totals ?? {}) },
    pipeline: { ...(raw.pipeline ?? {}) },
    requirementForms: { ...DEFAULT_SUMMARY.requirementForms, ...(raw.requirementForms ?? {}) },
    revisions: { ...DEFAULT_SUMMARY.revisions, ...(raw.revisions ?? {}) },
    escrow: {
      counts: escrowCounts,
      amounts: { ...DEFAULT_SUMMARY.escrow.amounts, ...(raw.escrow?.amounts ?? {}) },
    },
    health: { ...DEFAULT_SUMMARY.health, ...(raw.health ?? {}) },
  };
}

function buildStageDistribution(pipeline = {}) {
  return Object.entries(pipeline)
    .map(([stage, count]) => ({ stage, count: Number(count) || 0 }))
    .sort((a, b) => b.count - a.count);
}

function buildRequirementBreakdown(requirements) {
  return [
    { id: 'pending', label: 'Awaiting client input', count: requirements.pending },
    { id: 'overdue', label: 'Follow-ups overdue', count: requirements.overdue },
    { id: 'submitted', label: 'Submitted for review', count: requirements.submitted },
    { id: 'approved', label: 'Approved and ready', count: requirements.approved },
  ];
}

function buildRevisionBreakdown(revisions) {
  return [
    { id: 'active', label: 'Revisions in progress', count: revisions.active },
    { id: 'awaiting-review', label: 'Awaiting freelancer review', count: revisions.awaitingReview },
    { id: 'completed', label: 'Completed this period', count: revisions.completed },
  ];
}

function formatCurrency(value, currency = 'USD') {
  if (value == null) {
    return '—';
  }
  const numeric = Number(value) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: numeric % 1 === 0 ? 0 : 2,
    minimumFractionDigits: numeric % 1 === 0 ? 0 : 2,
  }).format(numeric);
}

function formatNumber(value) {
  const numeric = Number(value) || 0;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(numeric);
}

function computeHighlights(summary) {
  const { totals, health, escrow } = summary;
  const outstandingCheckpoints =
    escrow.counts.pendingRelease + escrow.counts.funded + escrow.counts.held + escrow.counts.disputed;
  return [
    {
      id: 'open-orders',
      name: 'Open orders',
      primary: formatNumber(totals.openOrders),
      secondary: `${formatCurrency(totals.openValue, totals.currency)} in flight`,
    },
    {
      id: 'deliveries-due',
      name: 'Deliveries due in 3 days',
      primary: formatNumber(health.deliveryDueSoon),
      secondary: health.deliveryDueSoon === 1 ? 'One delivery needs attention' : 'On-time delivery safety net',
    },
    {
      id: 'kickoff-scheduled',
      name: 'Kickoff calls scheduled',
      primary: formatNumber(health.kickoffScheduled),
      secondary: 'Keep agendas ready for smooth onboarding',
    },
    {
      id: 'escrow-outstanding',
      name: 'Outstanding escrow',
      primary: formatCurrency(escrow.amounts.outstanding, escrow.amounts.currency),
      secondary:
        outstandingCheckpoints === 1
          ? '1 checkpoint awaiting release'
          : `${formatNumber(outstandingCheckpoints)} checkpoints awaiting release`,
    },
  ];
}

function buildDefaultPayload(lookbackDays = 120) {
  return {
    summary: DEFAULT_SUMMARY,
    orders: [],
    meta: {
      lookbackDays,
      fetchedAt: new Date().toISOString(),
      filters: { freelancerId: null },
    },
  };
}

export default function useFreelancerOrderPipelineSummary({
  freelancerId,
  lookbackDays,
  enabled = true,
} = {}) {
  const cacheKey = freelancerId
    ? `freelancer:order-pipeline:${freelancerId}:${lookbackDays ?? 'default'}`
    : 'freelancer:order-pipeline:demo';
  const shouldFetch = Boolean(freelancerId) && enabled;

  const fetcher = useCallback(
    ({ signal } = {}) => {
      if (!shouldFetch) {
        return Promise.resolve(buildDefaultPayload(lookbackDays));
      }
      return fetchFreelancerOrderPipeline({ freelancerId, lookbackDays, signal });
    },
    [freelancerId, lookbackDays, shouldFetch],
  );

  const resource = useCachedResource(cacheKey, fetcher, {
    enabled,
    dependencies: [cacheKey, lookbackDays ?? 'default'],
    ttl: 1000 * 45,
  });

  const payload = resource.data ?? buildDefaultPayload(lookbackDays);

  const summary = useMemo(() => normaliseSummary(payload.summary), [payload.summary]);
  const stageDistribution = useMemo(() => buildStageDistribution(summary.pipeline), [summary.pipeline]);
  const requirementBreakdown = useMemo(
    () => buildRequirementBreakdown(summary.requirementForms),
    [summary.requirementForms],
  );
  const revisionBreakdown = useMemo(
    () => buildRevisionBreakdown(summary.revisions),
    [summary.revisions],
  );
  const highlights = useMemo(() => computeHighlights(summary), [summary]);

  return {
    summary,
    stageDistribution,
    requirementBreakdown,
    revisionBreakdown,
    highlights,
    orders: Array.isArray(payload.orders) ? payload.orders : [],
    meta: payload.meta ?? { lookbackDays: lookbackDays ?? 120, fetchedAt: null },
    lookback: payload.meta?.lookbackDays ?? lookbackDays ?? 120,
    loading: resource.loading,
    error: resource.error,
    refresh: resource.refresh,
    fromCache: resource.fromCache,
    lastUpdated: resource.lastUpdated,
  };
}
