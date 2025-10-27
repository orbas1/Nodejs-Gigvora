import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

const FILTERS = [
  { key: 'all', label: 'All subscriptions' },
  { key: 'active', label: 'Active' },
  { key: 'paused', label: 'Paused' },
  { key: 'cancelled', label: 'Cancelled' },
];

const SORT_OPTIONS = [
  { key: 'renewal', label: 'Next renewal' },
  { key: 'amount_desc', label: 'Amount high → low' },
  { key: 'amount_asc', label: 'Amount low → high' },
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

function formatStatus(status) {
  switch (status) {
    case 'paused':
      return 'Paused';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Active';
  }
}

function formatChurnRiskLabel(value) {
  switch (value) {
    case 'high':
      return 'High risk';
    case 'medium':
      return 'Moderate risk';
    case 'low':
      return 'Low risk';
    default:
      return 'Stable';
  }
}

function getChurnRiskTone(value) {
  switch (value) {
    case 'high':
      return 'border-rose-200 bg-rose-50 text-rose-600';
    case 'medium':
      return 'border-amber-200 bg-amber-50 text-amber-600';
    case 'low':
      return 'border-emerald-200 bg-emerald-50 text-emerald-600';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600';
  }
}

export default function SubscriptionManager({
  summary,
  subscriptions,
  currency,
  settings,
  onToggleAutoRelease,
  onPause,
  onResume,
  onCancel,
}) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('renewal');
  const [showAutoReleaseEligibleOnly, setShowAutoReleaseEligibleOnly] = useState(false);
  const highlightQuery = searchTerm.trim();

  const filtered = useMemo(() => {
    const base = (() => {
      switch (filter) {
        case 'active':
          return subscriptions.filter((subscription) => subscription.status === 'active');
        case 'paused':
          return subscriptions.filter((subscription) => subscription.status === 'paused');
        case 'cancelled':
          return subscriptions.filter((subscription) => subscription.status === 'cancelled');
        default:
          return subscriptions;
      }
    })();

    const autoFiltered = showAutoReleaseEligibleOnly
      ? base.filter((subscription) => subscription.autoReleaseEligible !== false)
      : base;

    const searched = highlightQuery
      ? autoFiltered.filter((subscription) => {
          const haystack = [
            subscription.name,
            subscription.counterpartyName,
            subscription.planTier,
            subscription.ownerName,
          ]
            .map(normaliseText)
            .join(' ');
          return haystack.includes(highlightQuery.toLowerCase());
        })
      : autoFiltered;

    const parseRenewal = (value) => {
      if (!value) {
        return null;
      }
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date.getTime();
    };

    return searched.slice().sort((a, b) => {
      switch (sortOption) {
        case 'amount_desc':
          return Number(b.amount ?? 0) - Number(a.amount ?? 0);
        case 'amount_asc':
          return Number(a.amount ?? 0) - Number(b.amount ?? 0);
        case 'renewal':
        default: {
          const aRenewal = parseRenewal(a.nextRenewalAt);
          const bRenewal = parseRenewal(b.nextRenewalAt);
          if (aRenewal == null && bRenewal == null) {
            return Number(b.amount ?? 0) - Number(a.amount ?? 0);
          }
          if (aRenewal == null) {
            return 1;
          }
          if (bRenewal == null) {
            return -1;
          }
          return aRenewal - bRenewal;
        }
      }
    });
  }, [filter, highlightQuery, showAutoReleaseEligibleOnly, sortOption, subscriptions]);

  const upcoming = useMemo(
    () =>
      subscriptions
        .filter((subscription) => subscription.nextRenewalAt)
        .slice()
        .sort((a, b) => new Date(a.nextRenewalAt).getTime() - new Date(b.nextRenewalAt).getTime())
        .slice(0, 6),
    [subscriptions],
  );

  const upcomingTotal = useMemo(
    () =>
      upcoming.reduce((sum, subscription) => sum + Number(subscription.amount ?? 0), 0),
    [upcoming],
  );

  const retentionRate = useMemo(() => {
    const active = summary?.activeCount ?? 0;
    const paused = summary?.pausedCount ?? 0;
    const cancelled = summary?.cancelledCount ?? 0;
    const total = active + paused + cancelled;
    if (!total) {
      return 100;
    }
    return Math.round((active / total) * 100);
  }, [summary]);

  const automationAdoptionRate = useMemo(() => {
    if (!subscriptions.length) {
      return 0;
    }
    const eligible = subscriptions.filter((subscription) => subscription.autoReleaseEligible !== false).length;
    return Math.round((eligible / subscriptions.length) * 100);
  }, [subscriptions]);

  const autoReleaseSummary = useMemo(() => {
    const eligible = subscriptions.filter((subscription) => subscription.autoReleaseEligible !== false);
    if (!eligible.length) {
      return { count: 0, nextDate: null };
    }
    const nextDates = eligible
      .map((subscription) => subscription.nextRenewalAt)
      .filter(Boolean)
      .map((value) => new Date(value))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    return {
      count: eligible.length,
      nextDate: nextDates[0] ?? null,
    };
  }, [subscriptions]);

  const highChurnCount = useMemo(
    () => subscriptions.filter((subscription) => subscription.churnRisk === 'high').length,
    [subscriptions],
  );

  const manualReleaseCount = useMemo(
    () => subscriptions.filter((subscription) => subscription.autoReleaseEligible === false).length,
    [subscriptions],
  );

  const churnBreakdown = useMemo(() => {
    return subscriptions.reduce(
      (accumulator, subscription) => {
        const bucket = subscription.churnRisk ?? 'stable';
        accumulator[bucket] = (accumulator[bucket] ?? 0) + 1;
        return accumulator;
      },
      { high: 0, medium: 0, low: 0, stable: 0 },
    );
  }, [subscriptions]);

  const ownerLeaderboard = useMemo(() => {
    if (!subscriptions.length) {
      return [];
    }

    const map = new Map();
    subscriptions.forEach((subscription) => {
      const owner = subscription.ownerName ?? 'Unassigned owner';
      const entry = map.get(owner) ?? {
        owner,
        amount: 0,
        active: 0,
        paused: 0,
        cancelled: 0,
      };
      entry.amount += Number(subscription.amount ?? 0);
      if (subscription.status === 'active') {
        entry.active += 1;
      } else if (subscription.status === 'paused') {
        entry.paused += 1;
      } else if (subscription.status === 'cancelled') {
        entry.cancelled += 1;
      }
      map.set(owner, entry);
    });

    return Array.from(map.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [subscriptions]);

  const renewalWindows = useMemo(() => {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    return subscriptions.reduce(
      (accumulator, subscription) => {
        if (!subscription.nextRenewalAt) {
          return accumulator;
        }
        const date = new Date(subscription.nextRenewalAt);
        if (Number.isNaN(date.getTime())) {
          return accumulator;
        }
        const diff = date.getTime() - now;
        if (diff <= sevenDays) {
          accumulator.within7 += 1;
        } else if (diff <= thirtyDays) {
          accumulator.within30 += 1;
        } else if (diff > 0) {
          accumulator.beyond30 += 1;
        }
        return accumulator;
      },
      { within7: 0, within30: 0, beyond30: 0 },
    );
  }, [subscriptions]);

  const autoReleaseEnabled = settings?.autoReleaseEnabled ?? false;
  const autoReleaseAfterDays = settings?.autoReleaseAfterDays ?? 7;

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Subscription manager</h3>
          <p className="text-sm text-slate-500">
            Govern retainers, renewals, and recurring billing rules in one command center.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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
          <label className="relative block">
            <span className="sr-only">Search subscriptions</span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search plans, clients, or owners"
              className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <input
              type="checkbox"
              checked={showAutoReleaseEligibleOnly}
              onChange={(event) => setShowAutoReleaseEligibleOnly(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Auto-release eligible
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Sort by
            <select
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value)}
              className="mt-1 w-full rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{summary?.activeCount ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Paused</p>
          <p className="mt-2 text-xl font-semibold text-amber-700">{summary?.pausedCount ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Cancelled</p>
          <p className="mt-2 text-xl font-semibold text-rose-700">{summary?.cancelledCount ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Monthly recurring revenue</p>
          <p className="mt-2 text-xl font-semibold text-emerald-700">
            {formatCurrency(summary?.monthlyRecurringRevenue ?? 0, currency)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Retention outlook</p>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.min(retentionRate, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-slate-600">{retentionRate}% of subscriptions remain active.</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Automation readiness</p>
          <p className="mt-2 text-sm text-blue-700">
            {autoReleaseSummary.count} auto-release eligible · {manualReleaseCount} manual-only · {highChurnCount} high-churn
            alerts.
          </p>
          {autoReleaseSummary.nextDate ? (
            <p className="mt-2 text-xs text-blue-600">
              Next auto-release {formatRelativeTime(autoReleaseSummary.nextDate)} ·{' '}
              {formatAbsolute(autoReleaseSummary.nextDate, { dateStyle: 'medium' })}
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Upcoming renewals</p>
          <p className="mt-2 text-xl font-semibold text-amber-700">
            {formatCurrency(upcomingTotal, currency)}
          </p>
          <p className="mt-1 text-xs text-amber-600">Across {upcoming.length} near-term renewal{upcoming.length === 1 ? '' : 's'}.</p>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Engagement spotlight</p>
          <p className="mt-2 text-sm text-violet-700">
            {automationAdoptionRate}% automation adoption · {churnBreakdown.high} high-risk · {churnBreakdown.medium} moderate.
          </p>
          <ul className="mt-2 space-y-1 text-xs text-violet-600">
            <li>Low risk: {churnBreakdown.low}</li>
            <li>Stable/unknown: {churnBreakdown.stable}</li>
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Auto-release guardrails</h4>
            <p className="text-xs text-slate-500">
              {autoReleaseEnabled
                ? `Funds auto-release ${autoReleaseAfterDays} days after milestone sign-off unless paused.`
                : 'Auto-release is disabled. Operators must release funds manually.'}
            </p>
          </div>
          {onToggleAutoRelease ? (
            <button
              type="button"
              onClick={() => onToggleAutoRelease(!autoReleaseEnabled)}
              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                autoReleaseEnabled
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-600 hover:border-emerald-300'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600'
              }`}
            >
              {autoReleaseEnabled ? 'Disable auto-release' : 'Enable auto-release'}
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr,0.9fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Subscription</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Next renewal</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Health</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white/70 text-slate-700">
              {filtered.length ? (
                filtered.map((subscription) => {
                  const nextRenewal = subscription.nextRenewalAt
                    ? formatRelativeTime(subscription.nextRenewalAt)
                    : 'Awaiting schedule';
                  const renewalAbsolute = subscription.nextRenewalAt
                    ? formatAbsolute(subscription.nextRenewalAt, { dateStyle: 'medium' })
                    : null;
                  const cycleLabel = subscription.averageCycleDays
                    ? `${subscription.averageCycleDays}-day cycle`
                    : 'Variable cadence';
                  const counterpartyLabel = subscription.counterpartyName
                    ? ` · ${subscription.counterpartyName}`
                    : '';
                  const ownerLabel = subscription.ownerName
                    ? `Owner ${subscription.ownerName}`
                    : '';
                  return (
                    <tr key={subscription.id} className="hover:bg-blue-50/40">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {highlightMatch(subscription.name ?? 'Untitled subscription', highlightQuery)}
                        </div>
                        <p className="text-xs text-slate-500">
                          {highlightMatch(`${cycleLabel}${counterpartyLabel}`, highlightQuery)}
                        </p>
                        {ownerLabel ? (
                          <p className="text-xs text-slate-500">
                            {highlightMatch(ownerLabel, highlightQuery)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                            subscription.status === 'cancelled'
                              ? 'border-rose-200 bg-rose-50 text-rose-600'
                              : subscription.status === 'paused'
                              ? 'border-amber-200 bg-amber-50 text-amber-600'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          {formatStatus(subscription.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>{nextRenewal}</div>
                        {renewalAbsolute ? (
                          <p className="text-xs text-slate-500">{renewalAbsolute}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatCurrency(subscription.amount, subscription.currencyCode ?? currency)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-col items-start gap-1 text-xs font-semibold">
                          <span className={`inline-flex rounded-full border px-3 py-1 ${getChurnRiskTone(subscription.churnRisk)}`}>
                            {formatChurnRiskLabel(subscription.churnRisk)}
                          </span>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                              subscription.autoReleaseEligible === false
                                ? 'border-slate-200 bg-slate-50 text-slate-600'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-600'
                            }`}
                          >
                            {subscription.autoReleaseEligible === false ? 'Manual release' : 'Auto-ready'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {subscription.status === 'active' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onPause(subscription)}
                                className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600 transition hover:border-amber-300 hover:bg-amber-100"
                              >
                                Pause
                              </button>
                              <button
                                type="button"
                                onClick={() => onCancel(subscription)}
                                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
                              >
                                Cancel
                              </button>
                            </>
                          ) : null}
                          {subscription.status === 'paused' ? (
                            <button
                              type="button"
                              onClick={() => onResume(subscription)}
                              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:border-emerald-300 hover:bg-emerald-100"
                            >
                              Resume
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
                    No subscriptions match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <h4 className="text-sm font-semibold text-slate-900">Upcoming renewals</h4>
            <ul className="mt-3 space-y-3 text-sm text-slate-600">
              {upcoming.length ? (
                upcoming.map((subscription) => (
                  <li
                    key={subscription.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {highlightMatch(subscription.name ?? 'Subscription', highlightQuery)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {subscription.planTier ? (
                          <>{highlightMatch(subscription.planTier, highlightQuery)} · </>
                        ) : null}
                        Due {formatRelativeTime(subscription.nextRenewalAt)}
                      </p>
                      {subscription.counterpartyName ? (
                        <p className="text-xs text-slate-500">
                          {highlightMatch(subscription.counterpartyName, highlightQuery)}
                        </p>
                      ) : null}
                      {subscription.ownerName ? (
                        <p className="text-xs text-slate-500">
                          {highlightMatch(`Owner ${subscription.ownerName}`, highlightQuery)}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(subscription.amount, subscription.currencyCode ?? currency)}
                    </p>
                  </li>
                ))
              ) : (
                <li className="rounded-2xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
                  No renewals scheduled.
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
            <h4 className="text-sm font-semibold text-blue-700">Renewal heat</h4>
            <p className="mt-2 text-xs text-blue-700">
              {renewalWindows.within7 + renewalWindows.within30 + renewalWindows.beyond30
                ? 'Track renewals across the next 7, 30, and 30+ day windows to prioritise outreach.'
                : 'Renewal windows populate once subscriptions include renewal dates.'}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="flex items-center justify-between rounded-2xl border border-blue-200 bg-white/80 px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">Next 7 days</span>
                <span className="text-sm font-semibold text-slate-900">{renewalWindows.within7}</span>
              </li>
              <li className="flex items-center justify-between rounded-2xl border border-blue-200 bg-white/80 px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">7-30 days</span>
                <span className="text-sm font-semibold text-slate-900">{renewalWindows.within30}</span>
              </li>
              <li className="flex items-center justify-between rounded-2xl border border-blue-200 bg-white/80 px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">30+ days</span>
                <span className="text-sm font-semibold text-slate-900">{renewalWindows.beyond30}</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4">
            <h4 className="text-sm font-semibold text-violet-700">Account owner spotlight</h4>
            <p className="mt-2 text-xs text-violet-700">
              {ownerLeaderboard.length
                ? 'Top owners by recurring revenue with status mix for rapid coaching.'
                : 'Owner performance populates once subscriptions capture owner assignments.'}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {ownerLeaderboard.length ? (
                ownerLeaderboard.map((entry) => (
                  <li
                    key={entry.owner}
                    className="rounded-2xl border border-violet-200 bg-white/80 px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {highlightMatch(entry.owner, highlightQuery)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Active {entry.active} · Paused {entry.paused} · Cancelled {entry.cancelled}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {formatCurrency(entry.amount, currency)}
                      </span>
                    </div>
                  </li>
                ))
              ) : (
                <li className="rounded-2xl border border-dashed border-violet-200 px-3 py-6 text-center text-xs text-violet-700">
                  Assign owners to subscriptions to unlock coaching insights.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

SubscriptionManager.propTypes = {
  summary: PropTypes.shape({
    activeCount: PropTypes.number,
    pausedCount: PropTypes.number,
    cancelledCount: PropTypes.number,
    monthlyRecurringRevenue: PropTypes.number,
  }),
  subscriptions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      name: PropTypes.string,
      amount: PropTypes.number,
      currencyCode: PropTypes.string,
      status: PropTypes.oneOf(['active', 'paused', 'cancelled']).isRequired,
      nextRenewalAt: PropTypes.string,
      averageCycleDays: PropTypes.number,
      counterpartyName: PropTypes.string,
      planTier: PropTypes.string,
      ownerName: PropTypes.string,
      autoReleaseEligible: PropTypes.bool,
      churnRisk: PropTypes.oneOf(['high', 'medium', 'low']),
    }),
  ),
  currency: PropTypes.string,
  settings: PropTypes.shape({
    autoReleaseEnabled: PropTypes.bool,
    autoReleaseAfterDays: PropTypes.number,
  }),
  onToggleAutoRelease: PropTypes.func,
  onPause: PropTypes.func.isRequired,
  onResume: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

SubscriptionManager.defaultProps = {
  summary: null,
  subscriptions: [],
  currency: 'USD',
  settings: null,
  onToggleAutoRelease: null,
};
