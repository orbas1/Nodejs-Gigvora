import { useMemo } from 'react';
import {
  BoltIcon,
  ChartPieIcon,
  CurrencyDollarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import SectionShell from '../SectionShell.jsx';
import DataStatus from '../../../../components/DataStatus.jsx';
import useSession from '../../../../hooks/useSession.js';
import useFreelancerOrderPipeline from '../../../../hooks/useFreelancerOrderPipeline.js';
import { formatCurrency } from '../../../../utils/currency.js';

function computeFreelancerId(session) {
  return (
    session?.freelancerId ??
    session?.profileId ??
    session?.primaryProfileId ??
    session?.userId ??
    session?.id ??
    null
  );
}

function hasFreelancerAccess(session) {
  const role = (session?.activeRole ?? session?.role ?? '').toString().toLowerCase();
  const workspace = (session?.workspace?.role ?? session?.workspace?.type ?? '')
    .toString()
    .toLowerCase();
  const memberships = Array.isArray(session?.memberships)
    ? session.memberships.map((value) => value.toString().toLowerCase())
    : [];
  return [role, workspace, ...memberships].some((value) => value.includes('freelancer'));
}

function formatNumber(value) {
  if (value == null) {
    return '—';
  }
  try {
    return new Intl.NumberFormat().format(value);
  } catch (error) {
    return `${value}`;
  }
}

function formatPercent(value) {
  if (value == null) {
    return '—';
  }
  return `${Number(value).toFixed(1)}%`;
}

function MetricCard({ icon: Icon, label, value, hint }) {
  return (
    <article className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
        {Icon ? <Icon className="h-5 w-5 text-blue-500" aria-hidden="true" /> : null}
        <span>{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </article>
  );
}

function ProgressList({ title, items }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="mt-4 space-y-4">
        {items.map((item) => (
          <li key={item.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>{item.label}</span>
              <span className="font-semibold text-slate-900">{item.value}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${item.color}`}
                style={{ width: `${Math.min(100, Math.max(0, item.percent ?? 0))}%` }}
              />
            </div>
            {item.hint ? <p className="text-xs text-slate-500">{item.hint}</p> : null}
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function GigMarketplaceOperationsSection() {
  const { session } = useSession();
  const freelancerId = useMemo(() => computeFreelancerId(session), [session]);
  const accessGranted = useMemo(() => hasFreelancerAccess(session), [session]);

  const {
    summary,
    conversion,
    loading,
    error,
    fromCache,
    lastUpdated,
    refresh,
  } = useFreelancerOrderPipeline({
    freelancerId,
    enabled: accessGranted && Boolean(freelancerId),
  });

  const totals = summary?.totals ?? {};
  const currency = totals.currency ?? summary?.escrow?.amounts?.currency ?? 'USD';

  const metricCards = useMemo(() => {
    const outstandingEscrow = summary?.escrow?.amounts?.outstanding ?? 0;
    const pendingRelease = summary?.escrow?.counts?.pendingRelease ?? 0;
    return [
      {
        icon: SparklesIcon,
        label: 'Total orders',
        value: formatNumber(totals.orders ?? 0),
        hint: `${formatNumber(totals.openOrders ?? 0)} active • ${formatNumber(totals.closedOrders ?? 0)} closed`,
      },
      {
        icon: CurrencyDollarIcon,
        label: 'Value in play',
        value: formatCurrency(totals.openValue ?? 0, currency),
        hint: `Completed ${formatCurrency(totals.completedValue ?? 0, currency)}`,
      },
      {
        icon: ChartPieIcon,
        label: 'Win rate',
        value: formatPercent(conversion?.winRate ?? null),
        hint: `Cancellations ${formatPercent(conversion?.cancellationRate ?? null)}`,
      },
      {
        icon: BoltIcon,
        label: 'Outstanding escrow',
        value: formatCurrency(outstandingEscrow, summary?.escrow?.amounts?.currency ?? currency),
        hint: `${pendingRelease} checkpoints awaiting release`,
      },
    ];
  }, [summary, totals, conversion, currency]);

  const stageBreakdown = useMemo(() => {
    const pipeline = summary?.pipeline ?? {};
    const totalOrders = Number(totals.orders ?? 0) || 1;
    const palette = {
      inquiry: 'bg-slate-400',
      qualification: 'bg-sky-500',
      kickoff_scheduled: 'bg-indigo-500',
      production: 'bg-purple-500',
      delivery: 'bg-emerald-500',
      completed: 'bg-emerald-600',
      cancelled: 'bg-rose-500',
      on_hold: 'bg-amber-500',
    };
    const labels = {
      inquiry: 'Inquiry',
      qualification: 'Qualification',
      kickoff_scheduled: 'Kickoff scheduled',
      production: 'Production',
      delivery: 'Delivery',
      completed: 'Completed',
      cancelled: 'Cancelled',
      on_hold: 'On hold',
    };

    return Object.entries(labels).map(([key, label]) => {
      const count = Number(pipeline[key] ?? 0);
      return {
        label,
        value: formatNumber(count),
        percent: (count / totalOrders) * 100,
        color: palette[key] ?? 'bg-slate-400',
        hint:
          key === 'delivery'
            ? `${summary?.health?.deliveryDueSoon ?? 0} deliveries due soon`
            : key === 'kickoff_scheduled'
            ? `${summary?.health?.kickoffScheduled ?? 0} kickoff meetings scheduled`
            : null,
      };
    });
  }, [summary, totals]);

  const conversionBreakdown = useMemo(() => {
    return [
      { label: 'Qualification rate', value: formatPercent(conversion?.qualificationRate ?? null) },
      { label: 'Kickoff rate', value: formatPercent(conversion?.kickoffRate ?? null) },
      { label: 'Delivery rate', value: formatPercent(conversion?.deliveryRate ?? null) },
      { label: 'Win rate', value: formatPercent(conversion?.winRate ?? null) },
      { label: 'Cancellation rate', value: formatPercent(conversion?.cancellationRate ?? null) },
    ].map((item) => ({
      label: item.label,
      value: item.value,
      percent: item.value === '—' ? 0 : Number.parseFloat(item.value),
      color: 'bg-blue-500',
      hint: null,
    }));
  }, [conversion]);

  const operationalSignals = useMemo(() => {
    const requirements = summary?.requirementForms ?? {};
    const revisions = summary?.revisions ?? {};
    return [
      { label: 'Pending requirement forms', value: formatNumber(requirements.pending ?? 0) },
      { label: 'Submitted requirement forms', value: formatNumber(requirements.submitted ?? 0) },
      { label: 'Overdue requirement forms', value: formatNumber(requirements.overdue ?? 0) },
      { label: 'Active revisions', value: formatNumber(revisions.active ?? 0) },
      { label: 'Awaiting review revisions', value: formatNumber(revisions.awaitingReview ?? 0) },
    ];
  }, [summary]);

  const body = useMemo(() => {
    if (!accessGranted || !freelancerId) {
      return (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          Switch to a freelancer workspace to monitor marketplace operations and gig commerce analytics.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((card) => (
            <MetricCard key={card.label} {...card} />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ProgressList title="Pipeline status" items={stageBreakdown} />
          <ProgressList title="Conversion analytics" items={conversionBreakdown} />
        </div>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Operational signals</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {operationalSignals.map((signal) => (
              <li key={signal.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{signal.label}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{signal.value}</p>
              </li>
            ))}
          </ul>
        </article>
      </div>
    );
  }, [accessGranted, freelancerId, metricCards, stageBreakdown, conversionBreakdown, operationalSignals]);

  return (
    <SectionShell
      id="gig-marketplace"
      title="Gig marketplace operations"
      description="Manage the full gig lifecycle from publishing listings to fulfillment, upsells, and post-delivery reviews."
    >
      <DataStatus
        loading={loading}
        error={error}
        fromCache={fromCache}
        lastUpdated={lastUpdated}
        onRefresh={accessGranted && freelancerId ? () => refresh({ force: true }) : undefined}
        statusLabel="Gig pipeline telemetry"
      >
        {body}
      </DataStatus>
    </SectionShell>
  );
}
