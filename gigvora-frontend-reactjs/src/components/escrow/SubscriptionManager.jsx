import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

const FILTERS = [
  { key: 'all', label: 'All subscriptions' },
  { key: 'active', label: 'Active' },
  { key: 'paused', label: 'Paused' },
  { key: 'cancelled', label: 'Cancelled' },
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

  const filtered = useMemo(() => {
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
  }, [filter, subscriptions]);

  const upcoming = useMemo(
    () =>
      subscriptions
        .filter((subscription) => subscription.nextRenewalAt)
        .slice()
        .sort((a, b) => new Date(a.nextRenewalAt).getTime() - new Date(b.nextRenewalAt).getTime())
        .slice(0, 6),
    [subscriptions],
  );

  const autoReleaseEnabled = settings?.autoReleaseEnabled ?? false;
  const autoReleaseAfterDays = settings?.autoReleaseAfterDays ?? 7;

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Subscription manager</h3>
          <p className="text-sm text-slate-500">
            Govern retainers, renewals, and recurring billing rules in one command center.
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
                  return (
                    <tr key={subscription.id} className="hover:bg-blue-50/40">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{subscription.name}</div>
                        <p className="text-xs text-slate-500">
                          {subscription.averageCycleDays
                            ? `${subscription.averageCycleDays}-day cycle`
                            : 'Variable cadence'}
                        </p>
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
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
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
                  <li key={subscription.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2">
                    <div>
                      <p className="font-medium text-slate-900">{subscription.name}</p>
                      <p className="text-xs text-slate-500">
                        Due {formatRelativeTime(subscription.nextRenewalAt)}
                      </p>
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
