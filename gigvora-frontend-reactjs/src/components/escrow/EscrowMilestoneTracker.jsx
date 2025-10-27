import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

const FILTERS = [
  { key: 'all', label: 'All milestones' },
  { key: 'due_soon', label: 'Due soon' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'disputed', label: 'Disputed' },
];

function formatCurrency(amount, currency) {
  if (amount == null) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch (error) {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
}

function getRiskTone(risk) {
  switch (risk) {
    case 'critical':
      return 'text-rose-600 bg-rose-50 border-rose-200';
    case 'warning':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    default:
      return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  }
}

function deriveSummaryFromItems(items, fallback) {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      currency: fallback?.currency ?? 'USD',
      totalAmount: fallback?.totalAmount ?? 0,
      overdueAmount: fallback?.overdueAmount ?? 0,
      dueSoonCount: fallback?.dueSoonCount ?? 0,
      upcomingCount: fallback?.upcomingCount ?? 0,
      averageCycleDays: fallback?.averageCycleDays ?? null,
    };
  }

  const currency = fallback?.currency ?? items[0]?.currencyCode ?? 'USD';
  const aggregate = items.reduce(
    (accumulator, item) => {
      const amount = Number(item.amount ?? 0);
      accumulator.totalAmount += amount;
      if (item.status === 'overdue') {
        accumulator.overdueAmount += amount;
      }
      if (item.status === 'due_soon') {
        accumulator.dueSoonCount += 1;
      }
      accumulator.upcomingCount += 1;
      if (typeof item.averageCycleDays === 'number') {
        accumulator.cycleSamples.push(item.averageCycleDays);
      }
      return accumulator;
    },
    { totalAmount: 0, overdueAmount: 0, dueSoonCount: 0, upcomingCount: 0, cycleSamples: [] },
  );

  const averageCycleDays = fallback?.averageCycleDays ??
    (aggregate.cycleSamples.length
      ? Number(
          (
            aggregate.cycleSamples.reduce((sum, value) => sum + value, 0) /
            aggregate.cycleSamples.length
          ).toFixed(1),
        )
      : null);

  return {
    currency,
    totalAmount: Number(aggregate.totalAmount.toFixed(2)),
    overdueAmount: Number(aggregate.overdueAmount.toFixed(2)),
    dueSoonCount: aggregate.dueSoonCount,
    upcomingCount: aggregate.upcomingCount,
    averageCycleDays,
  };
}

export default function EscrowMilestoneTracker({
  summary,
  milestones,
  onRelease,
  onHold,
  onRequestReview,
  onInspect,
}) {
  const [filter, setFilter] = useState('all');

  const derivedSummary = useMemo(
    () => deriveSummaryFromItems(milestones, summary),
    [milestones, summary],
  );

  const filtered = useMemo(() => {
    switch (filter) {
      case 'due_soon':
        return milestones.filter((milestone) => milestone.status === 'due_soon');
      case 'overdue':
        return milestones.filter((milestone) => milestone.status === 'overdue');
      case 'disputed':
        return milestones.filter((milestone) => milestone.hasOpenDispute);
      default:
        return milestones;
    }
  }, [filter, milestones]);

  const progress = useMemo(() => {
    if (!derivedSummary.upcomingCount) {
      return 0;
    }
    const releasedCount = milestones.filter((milestone) => milestone.status === 'released').length;
    return Math.round((releasedCount / derivedSummary.upcomingCount) * 100);
  }, [derivedSummary.upcomingCount, milestones]);

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Milestone tracker</h3>
          <p className="text-sm text-slate-500">
            Monitor escrow milestones, surface risk, and release funds with confidence.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setFilter(option.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === option.key
                  ? 'bg-blue-600 text-white shadow'
                  : 'border border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Open volume</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {formatCurrency(derivedSummary.totalAmount, derivedSummary.currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {derivedSummary.upcomingCount} milestones in flight
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Due soon</p>
          <p className="mt-2 text-xl font-semibold text-amber-700">{derivedSummary.dueSoonCount}</p>
          <p className="mt-1 text-xs text-amber-600">Within the next 48 hours</p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Overdue</p>
          <p className="mt-2 text-xl font-semibold text-rose-700">
            {formatCurrency(derivedSummary.overdueAmount, derivedSummary.currency)}
          </p>
          <p className="mt-1 text-xs text-rose-600">Escalate before reputational risk rises</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Cycle speed</p>
          <p className="mt-2 text-xl font-semibold text-emerald-700">
            {derivedSummary.averageCycleDays != null ? `${derivedSummary.averageCycleDays} days` : '—'}
          </p>
          <p className="mt-1 text-xs text-emerald-600">Average request → release duration</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Release readiness</p>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-slate-500">
          {progress}% of scheduled milestones already cleared. Keep momentum high with proactive releases.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Milestone</th>
              <th className="px-4 py-3">Counterparty</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white/70 text-slate-700">
            {filtered.length ? (
              filtered.map((milestone) => {
                const dueDisplay = milestone.scheduledReleaseAt
                  ? formatRelativeTime(milestone.scheduledReleaseAt)
                  : 'Awaiting schedule';
                const dueAbsolute = milestone.scheduledReleaseAt
                  ? formatAbsolute(milestone.scheduledReleaseAt, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : null;
                const riskClass = getRiskTone(milestone.risk);
                return (
                  <tr key={milestone.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{milestone.label}</div>
                      <p className="text-xs text-slate-500">#{milestone.reference}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {milestone.counterpartyName ?? 'Unassigned'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>{dueDisplay}</div>
                      {dueAbsolute ? <p className="text-xs text-slate-500">{dueAbsolute}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatCurrency(milestone.amount, milestone.currencyCode ?? derivedSummary.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${riskClass}`}>
                        {milestone.hasOpenDispute ? 'Disputed' : milestone.risk === 'critical' ? 'Overdue' : milestone.risk === 'warning' ? 'Due soon' : 'Healthy'}
                        {milestone.hasOpenDispute ? (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-600">
                            {milestone.disputeCount ?? 1} case
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onInspect(milestone)}
                          className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                        >
                          Inspect
                        </button>
                        <button
                          type="button"
                          onClick={() => onHold(milestone)}
                          className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600 transition hover:border-amber-300 hover:bg-amber-100"
                        >
                          Hold
                        </button>
                        <button
                          type="button"
                          onClick={() => onRelease(milestone)}
                          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:border-emerald-300 hover:bg-emerald-100"
                        >
                          Release
                        </button>
                        {onRequestReview ? (
                          <button
                            type="button"
                            onClick={() => onRequestReview(milestone)}
                            className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-100"
                          >
                            Flag
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                  No milestones match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

EscrowMilestoneTracker.propTypes = {
  summary: PropTypes.shape({
    currency: PropTypes.string,
    totalAmount: PropTypes.number,
    overdueAmount: PropTypes.number,
    dueSoonCount: PropTypes.number,
    upcomingCount: PropTypes.number,
    averageCycleDays: PropTypes.number,
  }),
  milestones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      transactionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      reference: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      label: PropTypes.string,
      amount: PropTypes.number,
      currencyCode: PropTypes.string,
      counterpartyId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      counterpartyName: PropTypes.string,
      scheduledReleaseAt: PropTypes.string,
      createdAt: PropTypes.string,
      hasOpenDispute: PropTypes.bool,
      disputeCount: PropTypes.number,
      status: PropTypes.string,
      risk: PropTypes.string,
      averageCycleDays: PropTypes.number,
    }),
  ),
  onRelease: PropTypes.func.isRequired,
  onHold: PropTypes.func.isRequired,
  onRequestReview: PropTypes.func,
  onInspect: PropTypes.func.isRequired,
};

EscrowMilestoneTracker.defaultProps = {
  summary: null,
  milestones: [],
  onRequestReview: null,
};
