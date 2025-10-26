import { useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowTrendingUpIcon,
  BellAlertIcon,
  BoltIcon,
  CheckIcon,
  ClockIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import WalletStatusPill from '../wallet/WalletStatusPill.jsx';
import { formatCurrency, formatDate, formatStatus } from '../wallet/walletFormatting.js';

function SummaryCard({ label, value, helper, accent }) {
  return (
    <div className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
      {accent ? <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-600">{accent}</span> : null}
    </div>
  );
}

SummaryCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  helper: PropTypes.string,
  accent: PropTypes.node,
};

SummaryCard.defaultProps = {
  helper: null,
  accent: null,
};

function UsagePill({ label, value, limit }) {
  const percentage = limit ? Math.min(100, Math.round((Number(value) / Number(limit)) * 100)) : null;

  return (
    <div className="space-y-2 rounded-3xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-700">{label}</span>
        {percentage != null ? <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{percentage}%</span> : null}
      </div>
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
        <span>{value} used</span>
        {limit ? <span>{limit} available</span> : <span>No limit</span>}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-blue-500" style={{ width: `${percentage ?? 100}%` }} />
      </div>
    </div>
  );
}

UsagePill.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  limit: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

UsagePill.defaultProps = {
  limit: null,
};

function PlanCard({ plan, currency, timezone, onUpdateSeats, onToggleAutoRenew, onCancelPlan, onTrackEvent }) {
  const [seatDraft, setSeatDraft] = useState(plan.seatsTotal ?? plan.committedSeats ?? 0);

  const utilization = plan.seatsTotal ? Math.min(100, Math.round((plan.seatsUsed / plan.seatsTotal) * 100)) : 0;
  const renewalLabel = plan.renewsOn ? `Renews ${formatDate(plan.renewsOn)}${timezone ? ` • ${timezone}` : ''}` : 'Renews on usage milestone';
  const recurring = formatCurrency(plan.price ?? 0, plan.currency ?? currency);

  const handleSeatCommit = useCallback(() => {
    if (Number.isFinite(Number(seatDraft)) && Number(seatDraft) !== Number(plan.seatsTotal ?? plan.committedSeats)) {
      const next = Number(seatDraft);
      onTrackEvent?.('subscription_seat_update', { planId: plan.id, seats: next });
      onUpdateSeats?.(plan.id, next);
    }
  }, [seatDraft, plan, onUpdateSeats, onTrackEvent]);

  const handleToggle = useCallback(() => {
    const next = !plan.autoRenew;
    onTrackEvent?.('subscription_toggle_autorenew', { planId: plan.id, autoRenew: next });
    onToggleAutoRenew?.(plan.id, next);
  }, [plan, onToggleAutoRenew, onTrackEvent]);

  const handleCancel = useCallback(() => {
    onTrackEvent?.('subscription_cancel_requested', { planId: plan.id });
    onCancelPlan?.(plan.id);
  }, [plan, onCancelPlan, onTrackEvent]);

  return (
    <article className="space-y-4 rounded-4xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
            <WalletStatusPill value={plan.status ?? 'active'} />
          </div>
          <p className="text-sm text-slate-500">{plan.summary ?? 'Real-time telemetry on seats, usage, and compliance signals for this subscription.'}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1">{recurring} / {plan.interval ?? 'month'}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1">{plan.seatsUsed} of {plan.seatsTotal ?? seatDraft} seats in use</span>
            <span className="rounded-full bg-slate-100 px-3 py-1">{renewalLabel}</span>
            {plan.autoRenew ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Auto-renew on</span>
            ) : (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Manual renewal</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 text-right">
          <div className="text-sm font-semibold text-slate-700">{formatStatus(plan.billingStatus ?? plan.status ?? 'active')}</div>
          {plan.upcomingInvoice ? (
            <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-xs text-slate-500">
              <p className="font-semibold text-slate-700">Upcoming invoice</p>
              <p>{formatCurrency(plan.upcomingInvoice.amount ?? 0, plan.currency ?? currency)}</p>
              <p>On {formatDate(plan.upcomingInvoice.dueDate)}{timezone ? ` • ${timezone}` : ''}</p>
            </div>
          ) : null}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-900/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Seats & automation</p>
            <div className="mt-3 space-y-3 text-sm text-slate-600">
              <label className="flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-700">Committed seats</span>
                <input
                  type="number"
                  min={plan.seatsUsed}
                  value={seatDraft}
                  onChange={(event) => setSeatDraft(event.target.value)}
                  onBlur={handleSeatCommit}
                  className="w-28 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </label>
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
                <span>{utilization}% utilisation</span>
                <span>{plan.seatsUsed} seats active</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${utilization}%` }} />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {plan.usage?.map((entry) => (
              <UsagePill key={entry.id ?? entry.label} label={entry.label} value={entry.value} limit={entry.limit} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Highlights</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {plan.features?.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <CheckIcon className="mt-1 h-4 w-4 text-emerald-500" aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-900/5 p-4 text-sm text-slate-600">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Lifecycle</p>
            <ul className="mt-3 space-y-2">
              <li className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
                Contract started {formatDate(plan.startedOn ?? plan.createdAt)}
              </li>
              <li className="flex items-center gap-2">
                <BoltIcon className="h-4 w-4 text-blue-500" aria-hidden="true" />
                Automation coverage {plan.automationCoverage ?? '100%'}
              </li>
              {plan.lastRiskReview ? (
                <li className="flex items-center gap-2">
                  <BellAlertIcon className="h-4 w-4 text-amber-500" aria-hidden="true" />
                  Last risk review {formatDate(plan.lastRiskReview)}
                </li>
              ) : null}
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleToggle}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            >
              {plan.autoRenew ? (
                <PauseCircleIcon className="h-5 w-5" aria-hidden="true" />
              ) : (
                <PlayCircleIcon className="h-5 w-5" aria-hidden="true" />
              )}
              {plan.autoRenew ? 'Pause auto-renew' : 'Enable auto-renew'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
            >
              <BellAlertIcon className="h-5 w-5" aria-hidden="true" />
              Request cancellation
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

PlanCard.propTypes = {
  plan: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    status: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    billingStatus: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    interval: PropTypes.string,
    seatsUsed: PropTypes.number,
    seatsTotal: PropTypes.number,
    committedSeats: PropTypes.number,
    autoRenew: PropTypes.bool,
    renewsOn: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    summary: PropTypes.string,
    features: PropTypes.arrayOf(PropTypes.string),
    usage: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        label: PropTypes.string.isRequired,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        limit: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      }),
    ),
    automationCoverage: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    startedOn: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    lastRiskReview: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    upcomingInvoice: PropTypes.shape({
      amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    }),
  }).isRequired,
  currency: PropTypes.string.isRequired,
  timezone: PropTypes.string,
  onUpdateSeats: PropTypes.func,
  onToggleAutoRenew: PropTypes.func,
  onCancelPlan: PropTypes.func,
  onTrackEvent: PropTypes.func,
};

PlanCard.defaultProps = {
  timezone: undefined,
  onUpdateSeats: undefined,
  onToggleAutoRenew: undefined,
  onCancelPlan: undefined,
  onTrackEvent: undefined,
};

export default function SubscriptionManager({
  plans,
  metrics,
  currency,
  timezone,
  onUpdateSeats,
  onToggleAutoRenew,
  onCancelPlan,
  onTrackEvent,
}) {
  const summary = useMemo(() => {
    const totals = plans.reduce(
      (acc, plan) => {
        const amount = Number(plan.price ?? 0);
        const seats = Number(plan.seatsUsed ?? 0);
        const committed = Number(plan.seatsTotal ?? plan.committedSeats ?? 0);
        acc.mrr += Number.isFinite(amount) ? amount : 0;
        acc.seatsUsed += Number.isFinite(seats) ? seats : 0;
        acc.seatsTotal += Number.isFinite(committed) ? committed : 0;
        if (plan.status && String(plan.status).toLowerCase() === 'at_risk') {
          acc.atRisk += 1;
        }
        return acc;
      },
      { mrr: 0, seatsUsed: 0, seatsTotal: 0, atRisk: 0 },
    );

    const utilisation = totals.seatsTotal > 0 ? Math.round((totals.seatsUsed / totals.seatsTotal) * 100) : 0;

    return {
      mrr: formatCurrency(totals.mrr, currency),
      seats: `${totals.seatsUsed}/${totals.seatsTotal || '—'}`,
      utilisation: `${utilisation}% utilisation`,
      atRisk: `${totals.atRisk} plans flagged`,
    };
  }, [plans, currency]);

  return (
    <section className="space-y-6 rounded-4xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Subscription manager</h2>
          <p className="mt-1 text-sm text-slate-500">
            Oversee billing health, plan performance, and compliance guardrails across recurring revenue streams.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
            <ArrowTrendingUpIcon className="h-4 w-4" aria-hidden="true" />
            {metrics?.revenueTrend ?? 'Growth monitoring'}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
            <UsersIcon className="h-4 w-4" aria-hidden="true" />
            {metrics?.auditedOn ? `Audited ${formatDate(metrics.auditedOn)}` : 'Awaiting audit'}
          </span>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Monthly recurring revenue" value={summary.mrr} helper="Active recurring charges" />
        <SummaryCard label="Seats" value={summary.seats} helper={summary.utilisation} />
        <SummaryCard
          label="At-risk plans"
          value={summary.atRisk}
          accent={metrics?.churnSignals ? (
            <span className="inline-flex items-center gap-1 text-amber-600">
              <BellAlertIcon className="h-4 w-4" aria-hidden="true" />
              {metrics.churnSignals}
            </span>
          ) : null}
        />
        <SummaryCard
          label="Automation coverage"
          value={metrics?.automationCoverage ?? '92%'}
          helper="Workflows with billing automation enabled"
        />
      </div>

      <div className="space-y-6">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currency={currency}
            timezone={timezone}
            onUpdateSeats={onUpdateSeats}
            onToggleAutoRenew={onToggleAutoRenew}
            onCancelPlan={onCancelPlan}
            onTrackEvent={onTrackEvent}
          />
        ))}
      </div>
    </section>
  );
}

SubscriptionManager.propTypes = {
  plans: PropTypes.arrayOf(PlanCard.propTypes.plan).isRequired,
  metrics: PropTypes.shape({
    revenueTrend: PropTypes.string,
    auditedOn: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    churnSignals: PropTypes.string,
    automationCoverage: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  currency: PropTypes.string,
  timezone: PropTypes.string,
  onUpdateSeats: PropTypes.func,
  onToggleAutoRenew: PropTypes.func,
  onCancelPlan: PropTypes.func,
  onTrackEvent: PropTypes.func,
};

SubscriptionManager.defaultProps = {
  metrics: null,
  currency: 'USD',
  timezone: undefined,
  onUpdateSeats: undefined,
  onToggleAutoRenew: undefined,
  onCancelPlan: undefined,
  onTrackEvent: undefined,
};
