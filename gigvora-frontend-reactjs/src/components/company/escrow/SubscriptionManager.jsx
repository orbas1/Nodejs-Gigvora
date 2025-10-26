import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  FireIcon,
  SparklesIcon,
  UsersIcon,
  WalletIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDateTime } from '../../wallet/walletFormatting.js';

const BILLING_CYCLES = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'annual', label: 'Annual (save 15%)' },
];

function normalizePlans(plans, usage, currency) {
  const normalizedPlans = Array.isArray(plans) && plans.length
    ? plans
    : [
        {
          id: 'starter',
          name: 'Starter',
          monthlyPrice: 99,
          annualPrice: 999,
          seatsIncluded: 5,
          storageGb: 50,
          description: 'Launch with essential escrow, invoicing, and automation controls.',
          features: ['Milestone escrow', 'Invoice studio', 'Automated reminders'],
          recommended: false,
        },
        {
          id: 'growth',
          name: 'Growth',
          monthlyPrice: 199,
          annualPrice: 1990,
          seatsIncluded: 20,
          storageGb: 250,
          description: 'Upgrade to analytics, premium automation, and compliance guardrails.',
          features: ['Escrow risk analytics', 'Subscription governance', 'Premium support'],
          recommended: true,
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          monthlyPrice: 399,
          annualPrice: 3990,
          seatsIncluded: 50,
          storageGb: 1000,
          description: 'Full enterprise controls with advanced compliance and custom integrations.',
          features: ['Custom automations', 'Dedicated success manager', 'SAML/SCIM'],
          recommended: false,
        },
      ];

  const planUsage = usage ?? {};
  const currentPlanId = planUsage.planId ?? normalizedPlans.find((plan) => plan.recommended)?.id ?? normalizedPlans[0].id;

  return {
    plans: normalizedPlans.map((plan) => ({
      ...plan,
      price: {
        monthly: plan.monthlyPrice ?? plan.price?.monthly ?? 0,
        annual: plan.annualPrice ?? plan.price?.annual ?? 0,
      },
      seatsIncluded: plan.seatsIncluded ?? plan.metrics?.seats ?? 0,
      storageGb: plan.storageGb ?? plan.metrics?.storageGb ?? 0,
      currency: plan.currency ?? currency ?? 'USD',
    })),
    currentPlanId,
    usage: {
      seatsUsed: planUsage.seatsUsed ?? 0,
      seatsIncluded: planUsage.seatsIncluded ?? 0,
      storageGbUsed: planUsage.storageGbUsed ?? 0,
      storageGbIncluded: planUsage.storageGbIncluded ?? 0,
      renewalDate: planUsage.renewalDate ?? null,
      billingEmail: planUsage.billingEmail ?? '',
    },
    invoices: Array.isArray(planUsage.invoices) ? planUsage.invoices : [],
    addOns: Array.isArray(planUsage.addOns) ? planUsage.addOns : [],
  };
}

function PlanCard({ plan, cycle, active, onSelect, currency }) {
  const price = cycle === 'annual' ? plan.price.annual : plan.price.monthly;
  const displayPrice = formatCurrency(price, plan.currency ?? currency);
  const badge = plan.recommended ? 'Recommended' : plan.name === 'Enterprise' ? 'Customisable' : null;

  return (
    <article
      className={`flex h-full flex-col justify-between rounded-3xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
        active
          ? 'border-blue-500 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 text-white shadow-blue-200/60'
          : 'border-slate-200 bg-white text-slate-700'
      }`}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`text-xl font-semibold ${active ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
          {badge ? (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                active ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
              }`}
            >
              {badge}
            </span>
          ) : null}
        </div>
        <p className={`text-sm ${active ? 'text-white/80' : 'text-slate-600'}`}>{plan.description}</p>
        <p className={`text-3xl font-semibold ${active ? 'text-white' : 'text-slate-900'}`}>{displayPrice}</p>
        <p className={`text-xs font-semibold uppercase tracking-wide ${active ? 'text-white/70' : 'text-slate-500'}`}>
          {cycle === 'annual' ? 'Per year' : 'Per month'} · Includes {plan.seatsIncluded} seats
        </p>
        <ul className="space-y-2 text-sm">
          {plan.features.map((feature) => (
            <li key={feature} className={`flex items-center gap-2 ${active ? 'text-white/90' : 'text-slate-600'}`}>
              <CheckCircleIcon className="h-4 w-4" aria-hidden="true" /> {feature}
            </li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        onClick={() => onSelect(plan)}
        className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
          active ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-500'
        }`}
      >
        {active ? 'Current plan' : 'Choose plan'}
        {!active ? <ChevronRightIcon className="h-4 w-4" aria-hidden="true" /> : null}
      </button>
    </article>
  );
}

PlanCard.propTypes = {
  plan: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    price: PropTypes.shape({ monthly: PropTypes.number, annual: PropTypes.number }).isRequired,
    seatsIncluded: PropTypes.number.isRequired,
    features: PropTypes.arrayOf(PropTypes.string).isRequired,
    recommended: PropTypes.bool,
    currency: PropTypes.string,
  }).isRequired,
  cycle: PropTypes.oneOf(['monthly', 'annual']).isRequired,
  active: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  currency: PropTypes.string.isRequired,
};

PlanCard.defaultProps = {
  active: false,
};

function UsagePanel({ usage, onManageSeats, onManageAddOns }) {
  const seatProgress = usage.seatsIncluded
    ? Math.min(100, Math.round((usage.seatsUsed / usage.seatsIncluded) * 100))
    : 0;
  const storageProgress = usage.storageGbIncluded
    ? Math.min(100, Math.round((usage.storageGbUsed / usage.storageGbIncluded) * 100))
    : 0;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Usage analytics</p>
      <div className="mt-4 space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
            <span className="flex items-center gap-2"><UsersIcon className="h-4 w-4" aria-hidden="true" /> Seats</span>
            <span>
              {usage.seatsUsed}/{usage.seatsIncluded || '—'}
            </span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
            <div className="h-2 rounded-full bg-blue-600" style={{ width: `${seatProgress}%` }} />
          </div>
          <button
            type="button"
            onClick={onManageSeats}
            className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
          >
            Manage seats
          </button>
        </div>
        <div>
          <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
            <span className="flex items-center gap-2"><WalletIcon className="h-4 w-4" aria-hidden="true" /> Storage</span>
            <span>
              {usage.storageGbUsed}GB / {usage.storageGbIncluded || '—'}GB
            </span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
            <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${storageProgress}%` }} />
          </div>
          <button
            type="button"
            onClick={onManageAddOns}
            className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
          >
            Manage add-ons
          </button>
        </div>
        {usage.renewalDate ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-semibold uppercase tracking-wide text-slate-500">Next renewal</p>
            <p className="mt-1 text-sm text-slate-700">{formatDateTime(usage.renewalDate)}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

UsagePanel.propTypes = {
  usage: PropTypes.shape({
    seatsUsed: PropTypes.number,
    seatsIncluded: PropTypes.number,
    storageGbUsed: PropTypes.number,
    storageGbIncluded: PropTypes.number,
    renewalDate: PropTypes.string,
  }).isRequired,
  onManageSeats: PropTypes.func,
  onManageAddOns: PropTypes.func,
};

UsagePanel.defaultProps = {
  onManageSeats: null,
  onManageAddOns: null,
};

function InvoiceHistory({ invoices, currency }) {
  if (!invoices.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        No invoices yet. Billing history appears once subscriptions are active.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Invoice</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Issued</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoices.map((invoice) => (
            <tr key={invoice.id ?? invoice.number} className="text-slate-700">
              <td className="px-4 py-3 font-semibold text-slate-800">{invoice.number ?? invoice.id}</td>
              <td className="px-4 py-3">{formatCurrency(invoice.amount ?? 0, invoice.currency ?? currency)}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {invoice.status ?? 'Paid'}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{invoice.issuedAt ? formatDateTime(invoice.issuedAt) : '—'}</td>
              <td className="px-4 py-3">
                {invoice.downloadUrl ? (
                  <a
                    href={invoice.downloadUrl}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 transition hover:text-blue-800"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" /> Download
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">No file</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

InvoiceHistory.propTypes = {
  invoices: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      number: PropTypes.string,
      amount: PropTypes.number,
      currency: PropTypes.string,
      status: PropTypes.string,
      issuedAt: PropTypes.string,
      downloadUrl: PropTypes.string,
    }),
  ),
  currency: PropTypes.string,
};

InvoiceHistory.defaultProps = {
  invoices: [],
  currency: 'USD',
};

export default function SubscriptionManager({
  plans,
  usage,
  currency,
  onChangePlan,
  onManageSeats,
  onManageAddOns,
  onRefresh,
}) {
  const { plans: normalizedPlans, currentPlanId, usage: normalizedUsage, invoices, addOns } = useMemo(
    () => normalizePlans(plans, usage, currency),
    [plans, usage, currency],
  );
  const [cycle, setCycle] = useState('monthly');

  const activePlan = normalizedPlans.find((plan) => plan.id === (usage?.planId ?? currentPlanId)) ?? normalizedPlans[0];

  return (
    <section className="space-y-6 rounded-[2.5rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Subscription governance</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">Manage workspace subscriptions</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Review plan benefits, monitor usage, and orchestrate add-ons with the same polish your clients expect from LinkedIn-
            class platforms. Recommendations adapt to usage, guiding upgrades and renewals with confidence.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {BILLING_CYCLES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setCycle(option.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                cycle === option.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-white text-slate-600 shadow-sm hover:bg-slate-100'
              }`}
            >
              {option.label}
            </button>
          ))}
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
            >
              <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> Refresh
            </button>
          ) : null}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {normalizedPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            cycle={cycle}
            active={plan.id === activePlan.id}
            onSelect={(selectedPlan) => onChangePlan && onChangePlan(selectedPlan, cycle)}
            currency={currency}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <UsagePanel usage={normalizedUsage} onManageSeats={onManageSeats} onManageAddOns={onManageAddOns} />
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Add-ons & automation</p>
          <ul className="mt-3 space-y-3 text-sm text-slate-600">
            {addOns.length ? (
              addOns.map((addOn) => (
                <li key={addOn.id ?? addOn.name} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div>
                    <p className="font-semibold text-slate-800">{addOn.name}</p>
                    <p className="text-xs text-slate-500">{addOn.description}</p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {formatCurrency(addOn.price ?? 0, addOn.currency ?? currency)}
                  </span>
                </li>
              ))
            ) : (
              <li className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
                No add-ons yet. Launch analytics, concierge upgrades, or compliance packs here.
              </li>
            )}
          </ul>
          <button
            type="button"
            onClick={onManageAddOns}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-blue-500"
          >
            <FireIcon className="h-4 w-4" aria-hidden="true" /> Explore add-ons
          </button>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Highlights</p>
          <ul className="mt-3 space-y-3 text-sm text-slate-600">
            <li className="flex items-center gap-2"><SparklesIcon className="h-4 w-4 text-blue-500" aria-hidden="true" />
              Escrow, invoicing, and subscriptions orchestrated from one control tower.</li>
            <li className="flex items-center gap-2"><UsersIcon className="h-4 w-4 text-blue-500" aria-hidden="true" />
              Recommended plan adapts to usage and projected growth.</li>
            <li className="flex items-center gap-2"><WalletIcon className="h-4 w-4 text-blue-500" aria-hidden="true" />
              Finance receives analytics-ready exports with every change.</li>
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice history</p>
        <InvoiceHistory invoices={invoices} currency={currency} />
      </div>
    </section>
  );
}

SubscriptionManager.propTypes = {
  plans: PropTypes.arrayOf(PropTypes.object),
  usage: PropTypes.object,
  currency: PropTypes.string,
  onChangePlan: PropTypes.func,
  onManageSeats: PropTypes.func,
  onManageAddOns: PropTypes.func,
  onRefresh: PropTypes.func,
};

SubscriptionManager.defaultProps = {
  plans: [],
  usage: null,
  currency: 'USD',
  onChangePlan: null,
  onManageSeats: null,
  onManageAddOns: null,
  onRefresh: null,
};
