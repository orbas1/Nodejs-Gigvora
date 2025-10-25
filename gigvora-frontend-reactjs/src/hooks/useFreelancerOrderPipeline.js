import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchFreelancerOrderPipeline } from '../services/orderPipeline.js';

function computeDerivedConversion(summary) {
  if (!summary) {
    return null;
  }

  const totals = summary.totals ?? {};
  const pipeline = summary.pipeline ?? {};
  const totalOrders = Number(totals.orders ?? 0);
  if (!totalOrders) {
    return {
      qualificationRate: null,
      kickoffRate: null,
      deliveryRate: null,
      winRate: null,
      cancellationRate: null,
    };
  }

  const cancelled = Number(pipeline.cancelled ?? 0);
  const activeOrders = Math.max(totalOrders - cancelled, 0);
  const progressedQualification = Math.max(
    totalOrders - (Number(pipeline.inquiry ?? 0) + cancelled),
    0,
  );
  const progressedKickoff =
    Number(pipeline.kickoff_scheduled ?? 0) +
    Number(pipeline.production ?? 0) +
    Number(pipeline.delivery ?? 0) +
    Number(pipeline.completed ?? 0);
  const progressedDelivery = Number(pipeline.delivery ?? 0) + Number(pipeline.completed ?? 0);
  const wins = Number(pipeline.completed ?? 0);

  const toPercent = (count, total) => {
    if (!total) {
      return null;
    }
    const value = (Number(count ?? 0) / Number(total)) * 100;
    return Math.round(value * 10) / 10;
  };

  return {
    qualificationRate: summary.conversion?.qualificationRate ?? toPercent(progressedQualification, totalOrders),
    kickoffRate: summary.conversion?.kickoffRate ?? toPercent(progressedKickoff, totalOrders),
    deliveryRate: summary.conversion?.deliveryRate ?? toPercent(progressedDelivery, totalOrders),
    winRate:
      summary.conversion?.winRate ??
      toPercent(wins, activeOrders > 0 ? activeOrders : totalOrders),
    cancellationRate:
      summary.conversion?.cancellationRate ?? toPercent(cancelled, totalOrders),
  };
}

const DEFAULT_META = Object.freeze({
  lookbackDays: null,
  fetchedAt: null,
  filters: { freelancerId: null },
});

export default function useFreelancerOrderPipeline({
  freelancerId,
  enabled = true,
  lookbackDays,
} = {}) {
  const cacheKey = freelancerId
    ? `freelancer:order-pipeline:${freelancerId}:${lookbackDays ?? 'default'}`
    : 'freelancer:order-pipeline:anonymous';

  const fetcher = useCallback(
    ({ signal, force } = {}) => {
      if (!enabled || !freelancerId) {
        return Promise.resolve(null);
      }
      return fetchFreelancerOrderPipeline({ freelancerId, lookbackDays, signal });
    },
    [enabled, freelancerId, lookbackDays],
  );

  const resource = useCachedResource(cacheKey, fetcher, {
    enabled: enabled && Boolean(freelancerId),
    dependencies: [freelancerId ?? null, lookbackDays ?? null],
    ttl: 1000 * 30,
  });

  const summary = resource.data?.summary ?? null;
  const orders = resource.data?.orders ?? [];
  const meta = resource.data?.meta ??
    (freelancerId
      ? { lookbackDays: lookbackDays ?? null, fetchedAt: null, filters: { freelancerId } }
      : DEFAULT_META);
  const conversion = computeDerivedConversion(summary);

  return useMemo(
    () => ({
      ...resource,
      summary,
      orders,
      meta,
      conversion,
    }),
    [resource, summary, orders, meta, conversion],
  );
}
