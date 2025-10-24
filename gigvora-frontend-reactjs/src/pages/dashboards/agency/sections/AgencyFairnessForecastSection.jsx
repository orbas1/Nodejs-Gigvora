import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { ArrowTrendingUpIcon, ChartPieIcon, ClockIcon, UsersIcon } from '@heroicons/react/24/outline';
import CollapsibleSection from '../../../../components/dashboard/shared/CollapsibleSection.jsx';

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${Math.round(Number(value))}%`;
}

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(value));
}

function formatCurrency(amount, currency = 'USD') {
  if (amount == null || Number.isNaN(Number(amount))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch (error) {
    return `${currency} ${Math.round(Number(amount))}`;
  }
}

export default function AgencyFairnessForecastSection({ orders, overview, finance }) {
  const metrics = useMemo(() => {
    const allOrders = orders ?? [];
    const totalOrders = allOrders.length;
    const activeOrders = allOrders.filter((order) => !['completed', 'cancelled'].includes(order.status));
    const completedOrders = allOrders.filter((order) => order.status === 'completed');

    const vendors = new Map();
    for (const order of allOrders) {
      const key = order.vendorId ?? order.vendorName ?? 'unknown';
      const previous = vendors.get(key) ?? 0;
      vendors.set(key, previous + 1);
    }
    const vendorCounts = Array.from(vendors.values());
    const maxVendorCount = vendorCounts.length ? Math.max(...vendorCounts) : 0;
    const fairnessScore = totalOrders > 0 ? Math.round((1 - maxVendorCount / totalOrders) * 100) : null;

    const newVendorAssignments = allOrders.filter((order) => {
      if (order.vendorOnboardedAt) {
        const onboarded = new Date(order.vendorOnboardedAt);
        if (!Number.isNaN(onboarded.getTime())) {
          const diffDays = (Date.now() - onboarded.getTime()) / (1000 * 60 * 60 * 24);
          return diffDays < 90;
        }
      }
      if (order.vendorTenureMonths != null) {
        return Number(order.vendorTenureMonths) < 6;
      }
      return Boolean(order.isNewVendor || order.isFirstEngagement);
    });

    const dueSoon = activeOrders.filter((order) => {
      if (!order.dueAt) {
        return false;
      }
      const due = new Date(order.dueAt);
      if (Number.isNaN(due.getTime())) {
        return false;
      }
      const diffDays = (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 7;
    });

    const overdue = activeOrders.filter((order) => {
      if (!order.dueAt) {
        return false;
      }
      const due = new Date(order.dueAt);
      return !Number.isNaN(due.getTime()) && due.getTime() < Date.now();
    });

    const totalRevenue = allOrders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
    const lookbackWindow = Number(overview?.lookbackDays);
    const normalizedLookback = Number.isFinite(lookbackWindow) && lookbackWindow > 0 ? lookbackWindow : 12;
    const weeklyForecast = (totalRevenue / normalizedLookback) * 7;

    const activeMembers = overview?.summary?.members?.active ?? null;
    const capacityHours = activeMembers != null ? activeMembers * 32 : null;
    const plannedHours = activeOrders.reduce(
      (sum, order) => sum + (Number(order.estimatedHours) || Number(order.scopedHours) || 24),
      0,
    );
    const coverage = capacityHours && plannedHours
      ? Math.round((capacityHours / plannedHours) * 100)
      : null;

    return {
      totalOrders,
      activeOrders: activeOrders.length,
      completedOrders: completedOrders.length,
      fairnessScore,
      uniqueVendors: vendors.size,
      newVendorShare: totalOrders > 0 ? Math.round((newVendorAssignments.length / totalOrders) * 100) : null,
      dueSoonCount: dueSoon.length,
      overdueCount: overdue.length,
      totalRevenue,
      weeklyForecast,
      capacityHours,
      plannedHours,
      coverage,
    };
  }, [orders, overview]);

  const currency = finance?.currency ?? overview?.workspace?.currency ?? 'USD';

  return (
    <CollapsibleSection
      id="agency-fairness-forecast"
      title="Fairness analytics & staffing forecast"
      description="Stay ahead of delivery risk by monitoring equitable rotations, onboarding momentum, and short-range staffing coverage."
      badge="Intelligence"
    >
      <div className="grid gap-4 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Fairness score</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <ChartPieIcon className="h-6 w-6 text-indigo-500" aria-hidden="true" />
            {formatPercent(metrics.fairnessScore)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Unique vendors: {formatNumber(metrics.uniqueVendors)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">New vendor momentum</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <UsersIcon className="h-6 w-6 text-emerald-500" aria-hidden="true" />
            {formatPercent(metrics.newVendorShare)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Orders: {formatNumber(metrics.totalOrders)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Staffing coverage</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <ClockIcon className="h-6 w-6 text-sky-500" aria-hidden="true" />
            {formatPercent(metrics.coverage)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Planned hrs {formatNumber(metrics.plannedHours)} • Capacity {formatNumber(metrics.capacityHours)}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Revenue forecast</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <ArrowTrendingUpIcon className="h-6 w-6 text-amber-500" aria-hidden="true" />
            {formatCurrency(metrics.weeklyForecast, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Total pipeline {formatCurrency(metrics.totalRevenue, currency)}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-inner">
          <h3 className="text-lg font-semibold text-slate-900">Rotation health</h3>
          <p className="mt-1 text-sm text-slate-600">
            Balance assignments so no vendor exceeds {formatPercent(100 / Math.max(metrics.uniqueVendors || 1, 1))} of workload.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>• Keep fairness score above 65% to satisfy compliance guardrails.</li>
            <li>• Invite new vendors to reach at least 20% of active assignments.</li>
            <li>
              • Escalate to the fairness auditor if overdue orders exceed {formatNumber(metrics.overdueCount)} engagements.
            </li>
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-inner">
          <h3 className="text-lg font-semibold text-slate-900">Staffing plan</h3>
          <p className="mt-1 text-sm text-slate-600">
            Monitor short-range demand to keep due-soon orders ({formatNumber(metrics.dueSoonCount)}) aligned with capacity.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>• Review bench availability when coverage falls under 100%.</li>
            <li>• Surface due soon engagements in the gig workspace to pre-assign reviewers.</li>
            <li>• Sync these metrics with the finance control tower for margin modelling.</li>
          </ul>
        </div>
      </div>
    </CollapsibleSection>
  );
}

AgencyFairnessForecastSection.propTypes = {
  orders: PropTypes.arrayOf(PropTypes.object),
  overview: PropTypes.object,
  finance: PropTypes.object,
};

AgencyFairnessForecastSection.defaultProps = {
  orders: [],
  overview: null,
  finance: null,
};
