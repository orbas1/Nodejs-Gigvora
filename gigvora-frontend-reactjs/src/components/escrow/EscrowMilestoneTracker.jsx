import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

const FILTERS = [
  { key: 'all', label: 'All milestones' },
  { key: 'due_soon', label: 'Due soon' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'disputed', label: 'Disputed' },
  { key: 'at_risk', label: 'At risk' },
];

const HEALTH_BUCKETS = [
  { key: 'overdue', label: 'Overdue', tone: 'bg-rose-100 text-rose-700 border-rose-200' },
  { key: 'dueSoon', label: 'Due soon', tone: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'disputed', label: 'Disputed', tone: 'bg-rose-50 text-rose-600 border-rose-200' },
  { key: 'held', label: 'On hold', tone: 'bg-slate-100 text-slate-600 border-slate-200' },
  { key: 'scheduled', label: 'Scheduled', tone: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'released', label: 'Released', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

function normaliseText(value) {
  return value?.toString().toLowerCase() ?? '';
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\]/g, '\$&');
}

function highlightMatch(text, query) {
  const stringValue = text == null ? '' : String(text);
  const trimmedQuery = query?.trim();
  if (!trimmedQuery) {
    return stringValue;
  }

  const safeQuery = escapeRegExp(trimmedQuery);
  const regex = new RegExp(`(${safeQuery})`, 'ig');
  const parts = stringValue.split(regex);
  if (parts.length === 1) {
    return stringValue;
  }

  const lowerQuery = trimmedQuery.toLowerCase();
  return parts.map((part, index) => {
    if (!part) {
      return <span key={`empty-${index}`} />;
    }
    return part.toLowerCase() === lowerQuery ? (
      <mark key={`${part}-${index}`} className="rounded bg-blue-100 px-0.5 text-blue-700">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    );
  });
}

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

function getRiskLabel({ risk, hasOpenDispute }) {
  if (hasOpenDispute) {
    return 'Disputed';
  }
  if (risk === 'critical') {
    return 'Overdue';
  }
  if (risk === 'warning') {
    return 'Due soon';
  }
  return 'Healthy';
}

function resolveStatusBucket(milestone) {
  if (milestone.hasOpenDispute) {
    return 'disputed';
  }

  switch (milestone.status) {
    case 'overdue':
      return 'overdue';
    case 'due_soon':
      return 'dueSoon';
    case 'released':
      return 'released';
    case 'held':
    case 'on_hold':
      return 'held';
    default:
      return 'scheduled';
  }
}

function computeAutoReleaseDate(milestone, policy) {
  const enabled = policy?.enabled ?? policy?.autoReleaseEnabled ?? false;
  if (!enabled) {
    return null;
  }

  const baseDateValue =
    milestone.completedAt ??
    milestone.approvedAt ??
    milestone.scheduledReleaseAt ??
    milestone.updatedAt ??
    milestone.createdAt;

  if (!baseDateValue) {
    return null;
  }

  const baseDate = new Date(baseDateValue);
  if (Number.isNaN(baseDate.getTime())) {
    return null;
  }

  const hours =
    policy?.autoReleaseAfterHours ??
    (policy?.autoReleaseAfterDays != null ? policy.autoReleaseAfterDays * 24 : 0);

  if (!hours) {
    return baseDate;
  }

  return new Date(baseDate.getTime() + hours * 60 * 60 * 1000);
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
  autoReleasePolicy,
}) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const highlightQuery = searchTerm.trim();

  const derivedSummary = useMemo(
    () => deriveSummaryFromItems(milestones, summary),
    [milestones, summary],
  );

  const disputeCount = useMemo(
    () => milestones.filter((milestone) => milestone.hasOpenDispute).length,
    [milestones],
  );

  const overdueCount = useMemo(
    () => milestones.filter((milestone) => milestone.status === 'overdue').length,
    [milestones],
  );

  const autoReleaseInsights = useMemo(() => {
    if (!milestones.length) {
      return { eligible: 0, imminent: 0, nextDate: null };
    }

    const eligibleDates = milestones
      .map((milestone) => computeAutoReleaseDate(milestone, autoReleasePolicy))
      .filter((date) => date instanceof Date && !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    if (!eligibleDates.length) {
      return { eligible: 0, imminent: 0, nextDate: null };
    }

    const now = Date.now();
    const alertThresholdHours =
      autoReleasePolicy?.alertHours ??
      Math.max(
        24,
        Math.round(
          (autoReleasePolicy?.autoReleaseAfterHours ??
            (autoReleasePolicy?.autoReleaseAfterDays ?? 0) * 24) / 4,
        ) || 24,
      );

    const imminent = eligibleDates.filter(
      (date) => (date.getTime() - now) / (60 * 60 * 1000) <= alertThresholdHours,
    ).length;

    return {
      eligible: eligibleDates.length,
      imminent,
      nextDate: eligibleDates[0] ?? null,
    };
  }, [autoReleasePolicy, milestones]);

  const counterpartyInsight = useMemo(() => {
    if (!milestones.length) {
      return null;
    }

    const map = milestones.reduce((accumulator, milestone) => {
      const name = milestone.counterpartyName ?? 'Unassigned';
      const amount = Number(milestone.amount ?? 0);
      const entry = accumulator.get(name) ?? { amount: 0, dueSoon: 0, disputed: 0 };
      entry.amount += amount;
      if (milestone.status === 'due_soon') {
        entry.dueSoon += 1;
      }
      if (milestone.hasOpenDispute) {
        entry.disputed += 1;
      }
      accumulator.set(name, entry);
      return accumulator;
    }, new Map());

    let topEntry = null;
    map.forEach((value, key) => {
      if (!topEntry || value.amount > topEntry.value.amount) {
        topEntry = { name: key, value };
      }
    });

    return topEntry;
  }, [milestones]);

  const filtered = useMemo(() => {
    const base = (() => {
      switch (filter) {
        case 'due_soon':
          return milestones.filter((milestone) => milestone.status === 'due_soon');
        case 'overdue':
          return milestones.filter((milestone) => milestone.status === 'overdue');
        case 'disputed':
          return milestones.filter((milestone) => milestone.hasOpenDispute);
        case 'at_risk':
          return milestones.filter(
            (milestone) =>
              milestone.status === 'overdue' ||
              milestone.status === 'due_soon' ||
              milestone.hasOpenDispute,
          );
        default:
          return milestones;
      }
    })();

    if (!highlightQuery) {
      return base;
    }

    const trimmed = highlightQuery.toLowerCase();
    return base.filter((milestone) => {
      const haystack = [
        milestone.label,
        milestone.reference,
        milestone.counterpartyName,
        milestone.transactionId,
      ]
        .map(normaliseText)
        .join(' ');
      return haystack.includes(trimmed);
    });
  }, [filter, highlightQuery, milestones]);

  const progress = useMemo(() => {
    if (!derivedSummary.upcomingCount) {
      return 0;
    }
    const releasedCount = milestones.filter((milestone) => milestone.status === 'released').length;
    return Math.round((releasedCount / derivedSummary.upcomingCount) * 100);
  }, [derivedSummary.upcomingCount, milestones]);

  const autoReleaseQueue = useMemo(() => {
    if (!milestones.length) {
      return [];
    }

    return milestones
      .map((milestone) => {
        const autoReleaseDate = computeAutoReleaseDate(milestone, autoReleasePolicy);
        if (!autoReleaseDate) {
          return null;
        }
        return {
          id: milestone.id,
          label: milestone.label ?? 'Untitled milestone',
          counterpartyName: milestone.counterpartyName ?? 'Unassigned',
          amount: Number(milestone.amount ?? 0),
          currencyCode: milestone.currencyCode ?? derivedSummary.currency,
          risk: milestone.risk,
          hasOpenDispute: Boolean(milestone.hasOpenDispute),
          date: autoReleaseDate,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  }, [autoReleasePolicy, derivedSummary.currency, milestones]);

  const autoReleaseQueueStats = useMemo(() => {
    if (!autoReleaseQueue.length) {
      return { count: 0, totalVolume: 0, withinWindow: 0 };
    }

    const totalVolume = autoReleaseQueue.reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0);
    const now = Date.now();
    const alertThresholdHours =
      autoReleasePolicy?.alertHours ??
      Math.max(
        24,
        Math.round(
          (autoReleasePolicy?.autoReleaseAfterHours ??
            (autoReleasePolicy?.autoReleaseAfterDays ?? 0) * 24) / 4,
        ) || 24,
      );

    const withinWindow = autoReleaseQueue.filter((entry) => {
      const diff = (entry.date.getTime() - now) / (60 * 60 * 1000);
      return diff <= alertThresholdHours;
    }).length;

    return {
      count: autoReleaseQueue.length,
      totalVolume: Number(totalVolume.toFixed(2)),
      withinWindow,
    };
  }, [autoReleasePolicy, autoReleaseQueue]);

  const milestoneHealthMix = useMemo(() => {
    if (!milestones.length) {
      return {
        total: 0,
        breakdown: {
          overdue: 0,
          dueSoon: 0,
          disputed: 0,
          held: 0,
          scheduled: 0,
          released: 0,
        },
        atRiskTotal: 0,
      };
    }

    const breakdown = {
      overdue: 0,
      dueSoon: 0,
      disputed: 0,
      held: 0,
      scheduled: 0,
      released: 0,
    };

    milestones.forEach((milestone) => {
      const bucket = resolveStatusBucket(milestone);
      breakdown[bucket] += 1;
    });

    const total = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
    const atRiskTotal = breakdown.overdue + breakdown.dueSoon + breakdown.disputed;

    return { total, breakdown, atRiskTotal };
  }, [milestones]);

  const reviewFocusList = useMemo(() => {
    if (!milestones.length) {
      return [];
    }

    const weightMap = { critical: 3, warning: 2, info: 1 };

    const toWeight = (milestone) => {
      if (milestone.hasOpenDispute) {
        return 4;
      }
      if (milestone.status === 'overdue') {
        return 3;
      }
      if (milestone.status === 'due_soon') {
        return 2;
      }
      return weightMap[milestone.risk] ?? 1;
    };

    return milestones
      .filter(
        (milestone) =>
          milestone.hasOpenDispute ||
          milestone.status === 'overdue' ||
          milestone.status === 'due_soon',
      )
      .map((milestone) => ({
        id: milestone.id,
        label: milestone.label ?? 'Untitled milestone',
        counterpartyName: milestone.counterpartyName ?? 'Unassigned',
        dueAt: milestone.scheduledReleaseAt ?? milestone.dueAt ?? milestone.expectedReleaseAt ?? null,
        weight: toWeight(milestone),
        hasOpenDispute: Boolean(milestone.hasOpenDispute),
        risk: milestone.risk,
        status: milestone.status,
      }))
      .sort((a, b) => {
        if (b.weight !== a.weight) {
          return b.weight - a.weight;
        }
        if (a.dueAt && b.dueAt) {
          return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
        }
        if (a.dueAt) {
          return -1;
        }
        if (b.dueAt) {
          return 1;
        }
        return a.label.localeCompare(b.label);
      })
      .slice(0, 4);
  }, [milestones]);

  return (
    <section className="space-y-5 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Milestone tracker</h3>
          <p className="text-sm text-slate-500">
            Monitor escrow milestones, surface risk, and release funds with confidence.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
          <label className="relative flex items-center">
            <span className="sr-only">Search milestones</span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search counterparty, reference, or ID"
              className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Risk outlook</p>
          <p className="mt-2 text-sm text-slate-600">
            {disputeCount} dispute{disputeCount === 1 ? '' : 's'} and {overdueCount} overdue milestone
            {overdueCount === 1 ? '' : 's'} require prioritised follow-up.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Auto-release timeline</p>
          <p className="mt-2 text-sm text-blue-700">
            {autoReleaseInsights.eligible ? (
              <>
                {autoReleaseInsights.eligible} milestone
                {autoReleaseInsights.eligible === 1 ? '' : 's'} eligible ·{' '}
                {autoReleaseInsights.imminent} flagged for review in the next window.
              </>
            ) : (
              'No milestones are currently queued for auto-release.'
            )}
          </p>
          {autoReleaseInsights.nextDate ? (
            <p className="mt-2 text-xs text-blue-600">
              Next auto-release {formatRelativeTime(autoReleaseInsights.nextDate)} ·{' '}
              {formatAbsolute(autoReleaseInsights.nextDate, { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Top counterparty</p>
          <p className="mt-2 text-sm text-emerald-700">
            {counterpartyInsight ? (
              <>
                {highlightMatch(counterpartyInsight.name, highlightQuery)}{' '}
                <span className="text-xs text-emerald-600">
                  · {counterpartyInsight.value.dueSoon} due soon ·{' '}
                  {counterpartyInsight.value.disputed} disputed
                </span>
              </>
            ) : (
              'Counterparty insights populate once milestones arrive.'
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),minmax(0,0.55fr)]">
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Milestone</th>
              <th className="px-4 py-3">Counterparty</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3">Auto-release</th>
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
                  const riskClass = getRiskTone(
                    milestone.hasOpenDispute ? 'critical' : milestone.risk,
                  );
                  const autoReleaseDate = computeAutoReleaseDate(milestone, autoReleasePolicy);
                  const autoReleaseRelative = autoReleaseDate
                    ? formatRelativeTime(autoReleaseDate)
                    : null;
                  const subtitle = `#${milestone.reference ?? milestone.transactionId ?? '—'}`;
                  return (
                    <tr key={milestone.id} className="hover:bg-blue-50/40">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {highlightMatch(milestone.label ?? 'Untitled milestone', highlightQuery)}
                        </div>
                        <p className="text-xs text-slate-500">
                          {highlightMatch(subtitle, highlightQuery)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {highlightMatch(milestone.counterpartyName ?? 'Unassigned', highlightQuery)}
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
                          {getRiskLabel(milestone)}
                          {milestone.hasOpenDispute ? (
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-600">
                              {milestone.disputeCount ?? 1} case
                            </span>
                          ) : null}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {autoReleasePolicy?.enabled || autoReleasePolicy?.autoReleaseEnabled ? (
                        autoReleaseDate ? (
                          <>
                            <div>{autoReleaseRelative}</div>
                            <p className="text-xs text-slate-500">
                              {formatAbsolute(autoReleaseDate, { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                          </>
                        ) : (
                          <span className="text-xs text-slate-500">Manual review only</span>
                        )
                      ) : (
                        <span className="text-xs text-slate-500">Manual release</span>
                      )}
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
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                  No milestones match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Auto-release review queue</p>
            <p className="mt-2 text-sm text-blue-700">
              {autoReleaseQueueStats.count ? (
                <>
                  {autoReleaseQueueStats.count} milestone
                  {autoReleaseQueueStats.count === 1 ? '' : 's'} queued ·{' '}
                  {autoReleaseQueueStats.withinWindow} within review window.
                </>
              ) : (
                'No milestones are currently queued for auto-release review.'
              )}
            </p>
            <p className="mt-2 text-xs text-blue-600">
              Queue volume {formatCurrency(autoReleaseQueueStats.totalVolume, derivedSummary.currency)}
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {autoReleaseQueue.length ? (
                autoReleaseQueue.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-2xl border border-blue-200 bg-white/80 px-3 py-2 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {highlightMatch(entry.label, highlightQuery)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {highlightMatch(entry.counterpartyName, highlightQuery)}
                        </p>
                        <p className="text-xs text-blue-600">
                          Auto-release {formatRelativeTime(entry.date)} ·{' '}
                          {formatAbsolute(entry.date, { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatCurrency(entry.amount, entry.currencyCode)}
                        </p>
                        <span
                          className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getRiskTone(
                            entry.hasOpenDispute ? 'critical' : entry.risk,
                          )}`}
                        >
                          {entry.hasOpenDispute ? 'Dispute review' : getRiskLabel(entry)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="rounded-2xl border border-dashed border-blue-200 px-3 py-6 text-center text-sm text-blue-700">
                  Queue populates once automation schedules releases.
                </li>
              )}
            </ul>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Milestone health mix</p>
            <p className="mt-2 text-xs text-violet-600">
              {milestoneHealthMix.total
                ? `${milestoneHealthMix.atRiskTotal} of ${milestoneHealthMix.total} milestones need proactive follow-up.`
                : 'Health breakdown populates once milestones arrive.'}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {HEALTH_BUCKETS.map((bucket) => {
                const count = milestoneHealthMix.breakdown[bucket.key] ?? 0;
                const percent = milestoneHealthMix.total
                  ? Math.round((count / milestoneHealthMix.total) * 100)
                  : 0;
                return (
                  <li
                    key={bucket.key}
                    className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 ${bucket.tone}`}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide">{bucket.label}</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {count}
                      <span className="ml-1 text-xs text-slate-600">{percent}%</span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-violet-600">Review focus</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              {reviewFocusList.length ? (
                reviewFocusList.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-2xl border border-violet-200 bg-white/80 px-3 py-2 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {highlightMatch(entry.label, highlightQuery)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {highlightMatch(entry.counterpartyName, highlightQuery)}
                        </p>
                        {entry.dueAt ? (
                          <p className="text-xs text-violet-600">
                            Review {formatRelativeTime(entry.dueAt)} ·{' '}
                            {formatAbsolute(entry.dueAt, { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        ) : null}
                      </div>
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getRiskTone(
                          entry.hasOpenDispute ? 'critical' : entry.risk,
                        )}`}
                      >
                        {entry.hasOpenDispute ? 'Dispute' : getRiskLabel(entry)}
                      </span>
                    </div>
                  </li>
                ))
              ) : (
                <li className="rounded-2xl border border-dashed border-violet-200 px-3 py-6 text-center text-xs text-violet-600">
                  Review list populates once at-risk milestones appear.
                </li>
              )}
            </ul>
          </div>
        </div>
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
  autoReleasePolicy: PropTypes.shape({
    enabled: PropTypes.bool,
    autoReleaseEnabled: PropTypes.bool,
    autoReleaseAfterDays: PropTypes.number,
    autoReleaseAfterHours: PropTypes.number,
    alertHours: PropTypes.number,
  }),
};

EscrowMilestoneTracker.defaultProps = {
  summary: null,
  milestones: [],
  onRequestReview: null,
  autoReleasePolicy: null,
};
