import { useMemo } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  BoltIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronUpDownIcon,
  ShieldCheckIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import DataStatus from '../DataStatus.jsx';
import { formatCurrency, formatDate, formatStatus } from '../wallet/walletFormatting.js';
import { formatRelativeTime } from '../../utils/date.js';

const defaultPlans = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Core escrow, invoicing, and reporting for lean teams launching their first marketplace.',
    monthlyPrice: 149,
    yearlyPrice: 1490,
    seatsIncluded: 5,
    overagePerSeat: 25,
    features: ['Milestone tracking', 'Automated invoicing', 'Basic analytics', 'Email support'],
    badge: 'Popular for new studios',
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'Advanced billing automation, compliance insights, and workflow orchestration for scaling operations.',
    monthlyPrice: 349,
    yearlyPrice: 3490,
    seatsIncluded: 15,
    overagePerSeat: 20,
    features: ['Usage-based billing', 'Advanced analytics', 'Dedicated success manager', 'Escrow automation'],
    badge: 'Recommended',
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Tailored compliance, SSO, premium support, and programmatic workflows for global enterprises.',
    monthlyPrice: 649,
    yearlyPrice: 6490,
    seatsIncluded: 40,
    overagePerSeat: 18,
    features: ['Custom SLAs', 'Role-based approval chains', 'SOC2 reports', '24/7 priority support'],
    badge: 'White-glove onboarding',
  },
];

const defaultHandlers = Object.freeze({
  onPlanSelect: () => {},
  onBillingIntervalChange: () => {},
  onSeatChange: () => {},
  onCancelRenewal: () => {},
  onResumeRenewal: () => {},
  onDownloadInvoice: () => {},
  onInviteMember: () => {},
  onOpenUsageAnalytics: () => {},
});

export default function SubscriptionManager({
  plans,
  activePlanId,
  seats,
  billingInterval,
  loading,
  fromCache,
  lastUpdated,
  error,
  usage,
  upcomingInvoice,
  onPlanSelect,
  onBillingIntervalChange,
  onSeatChange,
  onCancelRenewal,
  onResumeRenewal,
  onDownloadInvoice,
  onInviteMember,
  onOpenUsageAnalytics,
}) {
  const handlers = {
    onPlanSelect: onPlanSelect ?? defaultHandlers.onPlanSelect,
    onBillingIntervalChange: onBillingIntervalChange ?? defaultHandlers.onBillingIntervalChange,
    onSeatChange: onSeatChange ?? defaultHandlers.onSeatChange,
    onCancelRenewal: onCancelRenewal ?? defaultHandlers.onCancelRenewal,
    onResumeRenewal: onResumeRenewal ?? defaultHandlers.onResumeRenewal,
    onDownloadInvoice: onDownloadInvoice ?? defaultHandlers.onDownloadInvoice,
    onInviteMember: onInviteMember ?? defaultHandlers.onInviteMember,
    onOpenUsageAnalytics: onOpenUsageAnalytics ?? defaultHandlers.onOpenUsageAnalytics,
  };

  const normalizedPlans = plans?.length ? plans : defaultPlans;
  const resolvedSeats = {
    allocated: Number(seats?.allocated ?? seats?.current ?? normalizedPlans.find((plan) => plan.id === activePlanId)?.seatsIncluded ?? 0),
    requested: Number(seats?.requested ?? seats?.allocated ?? seats?.current ?? 0),
  };

  const resolvedUsage = {
    renewalDate: usage?.renewalDate ?? null,
    renewalStatus: usage?.renewalStatus ?? 'active',
    seatsInUse: Number(usage?.seatsInUse ?? 0),
    seatsAvailable: Number(usage?.seatsAvailable ?? Math.max(resolvedSeats.allocated - Number(usage?.seatsInUse ?? 0), 0)),
    lastInvoiceNumber: upcomingInvoice?.invoiceNumber ?? usage?.lastInvoiceNumber ?? null,
  };

  const selectedPlan = normalizedPlans.find((plan) => plan.id === activePlanId) ?? normalizedPlans[0];

  const pricing = useMemo(() => {
    return normalizedPlans.map((plan) => {
      const seatCount = Math.max(resolvedSeats.requested, plan.seatsIncluded);
      const basePrice = billingInterval === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
      const includedSeats = plan.seatsIncluded;
      const overageSeats = Math.max(seatCount - includedSeats, 0);
      const overageRate = plan.overagePerSeat ?? 0;
      const subtotal = basePrice + overageSeats * overageRate * (billingInterval === 'yearly' ? 12 : 1);
      const savings = billingInterval === 'yearly' ? basePrice * 12 - plan.yearlyPrice : Math.max(plan.yearlyPrice / 12 - plan.monthlyPrice, 0);
      return {
        ...plan,
        seatCount,
        includedSeats,
        overageSeats,
        overageRate,
        subtotal,
        savings,
        intervalLabel: billingInterval === 'yearly' ? 'per year' : 'per month',
      };
    });
  }, [normalizedPlans, billingInterval, resolvedSeats.requested]);

  return (
    <DataStatus loading={loading} fromCache={fromCache} lastUpdated={lastUpdated} error={error} statusLabel="Subscription health">
      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Plan overview</p>
            <h2 className="text-2xl font-semibold text-slate-900">Scale with confidence</h2>
            <p className="text-sm text-slate-500">
              Compare premium plans benchmarked against LinkedIn Premium and Stripe Billing to ensure your revenue engine shines.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
            <button
              type="button"
              onClick={() => handlers.onOpenUsageAnalytics()}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
            >
              <ArrowTrendingUpIcon className="h-5 w-5" aria-hidden="true" />
              View analytics
            </button>
            <button
              type="button"
              onClick={() => handlers.onInviteMember()}
              className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
            >
              <UsersIcon className="h-5 w-5" aria-hidden="true" />
              Invite teammate
            </button>
          </div>
        </header>

        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-inner shadow-slate-200/40 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Active plan"
            value={selectedPlan.name}
            hint={selectedPlan.badge ?? 'Premium controls unlocked'}
            icon={ShieldCheckIcon}
            tone="info"
          />
          <SummaryCard
            label="Seats in use"
            value={`${resolvedUsage.seatsInUse}/${resolvedSeats.requested}`}
            hint={`${resolvedUsage.seatsAvailable} seats available`}
            icon={UsersIcon}
            tone={resolvedUsage.seatsAvailable > 0 ? 'positive' : 'warning'}
          />
          <SummaryCard
            label="Next invoice"
            value={upcomingInvoice?.total ? formatCurrency(upcomingInvoice.total, upcomingInvoice.currency ?? selectedPlan.currency ?? 'USD') : '—'}
            hint={upcomingInvoice?.dueDate ? `Due ${formatDate(upcomingInvoice.dueDate)}` : 'No invoice scheduled'}
            icon={CalendarDaysIcon}
            tone="neutral"
          />
          <SummaryCard
            label="Renewal"
            value={formatStatus(resolvedUsage.renewalStatus)}
            hint={resolvedUsage.renewalDate ? formatRelativeTime(resolvedUsage.renewalDate) : 'Update renewal settings'}
            icon={ArrowPathIcon}
            tone={resolvedUsage.renewalStatus === 'active' ? 'positive' : 'warning'}
          />
        </section>

        <section className="space-y-4">
          <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Billing cadence</h3>
              <p className="text-xs text-slate-500">Toggle intervals to reveal pricing efficiency and savings opportunities.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handlers.onBillingIntervalChange('monthly')}
                className={clsx(
                  'rounded-full px-3 py-1 transition',
                  billingInterval === 'monthly'
                    ? 'bg-white text-slate-900 shadow'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => handlers.onBillingIntervalChange('yearly')}
                className={clsx(
                  'rounded-full px-3 py-1 transition',
                  billingInterval === 'yearly'
                    ? 'bg-white text-slate-900 shadow'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                Yearly <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-600">Save up to 18%</span>
              </button>
            </div>
          </header>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {pricing.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                active={plan.id === selectedPlan.id}
                onSelect={() => handlers.onPlanSelect(plan.id, plan)}
              />
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <SeatManager
            seats={resolvedSeats}
            usage={resolvedUsage}
            onSeatChange={handlers.onSeatChange}
            onCancelRenewal={handlers.onCancelRenewal}
            onResumeRenewal={handlers.onResumeRenewal}
          />
          <InvoiceDigest upcomingInvoice={upcomingInvoice} onDownloadInvoice={handlers.onDownloadInvoice} selectedPlan={selectedPlan} billingInterval={billingInterval} />
        </section>
      </div>
    </DataStatus>
  );
}

SubscriptionManager.propTypes = {
  plans: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    monthlyPrice: PropTypes.number,
    yearlyPrice: PropTypes.number,
    seatsIncluded: PropTypes.number,
    overagePerSeat: PropTypes.number,
    features: PropTypes.arrayOf(PropTypes.string),
    badge: PropTypes.string,
    recommended: PropTypes.bool,
  })),
  activePlanId: PropTypes.string,
  seats: PropTypes.shape({
    allocated: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    requested: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    current: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  billingInterval: PropTypes.oneOf(['monthly', 'yearly']),
  loading: PropTypes.bool,
  fromCache: PropTypes.bool,
  lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  error: PropTypes.shape({ message: PropTypes.string }),
  usage: PropTypes.shape({
    renewalDate: PropTypes.string,
    renewalStatus: PropTypes.string,
    seatsInUse: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    seatsAvailable: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    lastInvoiceNumber: PropTypes.string,
  }),
  upcomingInvoice: PropTypes.shape({
    invoiceNumber: PropTypes.string,
    total: PropTypes.number,
    currency: PropTypes.string,
    dueDate: PropTypes.string,
  }),
  onPlanSelect: PropTypes.func,
  onBillingIntervalChange: PropTypes.func,
  onSeatChange: PropTypes.func,
  onCancelRenewal: PropTypes.func,
  onResumeRenewal: PropTypes.func,
  onDownloadInvoice: PropTypes.func,
  onInviteMember: PropTypes.func,
  onOpenUsageAnalytics: PropTypes.func,
};

SubscriptionManager.defaultProps = {
  plans: undefined,
  activePlanId: 'growth',
  seats: undefined,
  billingInterval: 'monthly',
  loading: false,
  fromCache: false,
  lastUpdated: null,
  error: undefined,
  usage: undefined,
  upcomingInvoice: undefined,
  onPlanSelect: undefined,
  onBillingIntervalChange: undefined,
  onSeatChange: undefined,
  onCancelRenewal: undefined,
  onResumeRenewal: undefined,
  onDownloadInvoice: undefined,
  onInviteMember: undefined,
  onOpenUsageAnalytics: undefined,
};

function SummaryCard({ label, value, hint, icon: Icon, tone }) {
  const toneStyles = {
    neutral: 'border-slate-200 bg-white/80 text-slate-700',
    info: 'border-blue-200 bg-blue-50/80 text-blue-700',
    positive: 'border-emerald-200 bg-emerald-50/80 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50/80 text-amber-700',
  };
  return (
    <div className={clsx('flex flex-col gap-3 rounded-2xl border p-4 shadow-sm backdrop-blur', toneStyles[tone] ?? toneStyles.neutral)}>
      <div className="flex items-center gap-3">
        <span className="rounded-2xl bg-white/80 p-2 shadow-inner">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </div>
      <p className="text-xs text-slate-500">{hint}</p>
    </div>
  );
}

SummaryCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  hint: PropTypes.string,
  icon: PropTypes.elementType.isRequired,
  tone: PropTypes.oneOf(['neutral', 'info', 'positive', 'warning']),
};

SummaryCard.defaultProps = {
  hint: '',
  tone: 'neutral',
};

function PlanCard({ plan, active, onSelect }) {
  return (
    <div
      className={clsx(
        'relative flex h-full flex-col gap-4 rounded-3xl border p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md',
        active
          ? 'border-blue-400 bg-gradient-to-br from-blue-50 via-white to-white shadow-blue-200/60'
          : 'border-slate-200 bg-white/80',
      )}
    >
      {plan.recommended ? (
        <span className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 px-3 py-1 text-xs font-semibold text-white shadow">
          Recommended
        </span>
      ) : null}
      <div className="space-y-2">
        <h4 className="text-lg font-semibold text-slate-900">{plan.name}</h4>
        <p className="text-sm text-slate-600">{plan.description}</p>
        {plan.badge ? <p className="text-xs font-semibold text-blue-600">{plan.badge}</p> : null}
      </div>
      <div className="space-y-1">
        <div className="flex items-end gap-2">
          <span className="text-3xl font-semibold text-slate-900">{formatCurrency(plan.subtotal, 'USD')}</span>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{plan.intervalLabel}</span>
        </div>
        <p className="text-xs text-slate-500">Includes {plan.includedSeats} seats • {plan.overageSeats} extra seats at {formatCurrency(plan.overageRate, 'USD')} each</p>
        {plan.savings > 0 ? (
          <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
            <BoltIcon className="h-4 w-4" aria-hidden="true" />Save {formatCurrency(plan.savings, 'USD')} this interval
          </p>
        ) : null}
      </div>
      <ul className="space-y-2 text-sm text-slate-600">
        {plan.features?.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <CheckIcon className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={onSelect}
          className={clsx(
            'inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition',
            active ? 'border-slate-300 bg-slate-900 text-white hover:bg-slate-800' : 'border-blue-200 bg-white text-blue-600 hover:bg-blue-50',
          )}
        >
          <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
          {active ? 'Current plan' : 'Switch to this plan'}
        </button>
      </div>
    </div>
  );
}

PlanCard.propTypes = {
  plan: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    subtotal: PropTypes.number,
    intervalLabel: PropTypes.string,
    includedSeats: PropTypes.number,
    overageSeats: PropTypes.number,
    overageRate: PropTypes.number,
    features: PropTypes.arrayOf(PropTypes.string),
    recommended: PropTypes.bool,
    badge: PropTypes.string,
    savings: PropTypes.number,
  }).isRequired,
  active: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};

PlanCard.defaultProps = {
  active: false,
};

function SeatManager({ seats, usage, onSeatChange, onCancelRenewal, onResumeRenewal }) {
  const isRenewalPaused = usage.renewalStatus === 'paused';
  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Seat orchestration</h3>
          <p className="text-xs text-slate-500">Manage seat allocations with enterprise guardrails and audit-ready history.</p>
        </div>
        <span className={clsx('rounded-full px-3 py-1 text-xs font-semibold', isRenewalPaused ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700')}>
          {formatStatus(usage.renewalStatus)}
        </span>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Seats requested</span>
          <input
            type="number"
            min={0}
            value={seats.requested}
            onChange={(event) => onSeatChange(Number(event.target.value))}
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 transition focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <div className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Seats in use</span>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {usage.seatsInUse} active • {usage.seatsAvailable} available
          </div>
        </div>
      </div>
      <div className="grid gap-3 text-xs text-slate-500">
        <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3">
          Upcoming renewal {usage.renewalDate ? formatDate(usage.renewalDate) : '—'}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3">
          Last invoice {usage.lastInvoiceNumber ? `#${usage.lastInvoiceNumber}` : '—'}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
        <button
          type="button"
          onClick={isRenewalPaused ? onResumeRenewal : onCancelRenewal}
          className={clsx(
            'inline-flex items-center gap-2 rounded-2xl border px-4 py-2 transition',
            isRenewalPaused
              ? 'border-emerald-200 bg-emerald-600 text-white hover:bg-emerald-700'
              : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
          )}
        >
          <ArrowPathIcon className="h-5 w-5" aria-hidden="true" />
          {isRenewalPaused ? 'Resume renewal' : 'Pause renewal'}
        </button>
        <button
          type="button"
          onClick={() => onSeatChange(seats.requested + 5)}
          className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-blue-600 transition hover:bg-blue-100"
        >
          <BoltIcon className="h-5 w-5" aria-hidden="true" />
          Add 5 seats
        </button>
      </div>
    </div>
  );
}

SeatManager.propTypes = {
  seats: PropTypes.shape({
    requested: PropTypes.number,
  }).isRequired,
  usage: PropTypes.shape({
    renewalStatus: PropTypes.string,
    renewalDate: PropTypes.string,
    seatsInUse: PropTypes.number,
    seatsAvailable: PropTypes.number,
    lastInvoiceNumber: PropTypes.string,
  }).isRequired,
  onSeatChange: PropTypes.func.isRequired,
  onCancelRenewal: PropTypes.func.isRequired,
  onResumeRenewal: PropTypes.func.isRequired,
};

function InvoiceDigest({ upcomingInvoice, onDownloadInvoice, selectedPlan, billingInterval }) {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <header className="space-y-1">
        <h3 className="text-sm font-semibold text-slate-900">Invoice digest</h3>
        <p className="text-xs text-slate-500">Stay ahead of billing by reviewing totals, due dates, and downloadable summaries.</p>
      </header>
      <div className="space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span>Plan</span>
            <span className="font-semibold text-slate-900">{selectedPlan.name}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Billing interval</span>
            <span className="font-semibold text-slate-700">{billingInterval === 'yearly' ? 'Yearly' : 'Monthly'}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span>Total</span>
            <span className="text-lg font-semibold text-slate-900">
              {upcomingInvoice?.total ? formatCurrency(upcomingInvoice.total, upcomingInvoice.currency ?? 'USD') : '—'}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {upcomingInvoice?.dueDate ? `Due ${formatDate(upcomingInvoice.dueDate)}` : 'Awaiting next invoice run'}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
        <button
          type="button"
          onClick={() => onDownloadInvoice(upcomingInvoice)}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
        >
          <ArrowDownTrayIcon className="h-5 w-5" aria-hidden="true" />
          Download latest invoice
        </button>
        <button
          type="button"
          onClick={() => onDownloadInvoice({ ...upcomingInvoice, intent: 'history' })}
          className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
        >
          <CalendarDaysIcon className="h-5 w-5" aria-hidden="true" />
          View billing history
        </button>
      </div>
      <p className="text-xs text-slate-500">Invoices sync with finance automation and unlock compliance-ready exports within seconds.</p>
    </div>
  );
}

InvoiceDigest.propTypes = {
  upcomingInvoice: PropTypes.shape({
    total: PropTypes.number,
    currency: PropTypes.string,
    dueDate: PropTypes.string,
  }),
  onDownloadInvoice: PropTypes.func.isRequired,
  selectedPlan: PropTypes.shape({
    name: PropTypes.string,
  }).isRequired,
  billingInterval: PropTypes.oneOf(['monthly', 'yearly']).isRequired,
};

InvoiceDigest.defaultProps = {
  upcomingInvoice: undefined,
};
