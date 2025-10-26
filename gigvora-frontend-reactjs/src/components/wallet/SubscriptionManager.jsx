import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch (error) {
    return `${currency} ${Number(value).toFixed(2)}`;
  }
}

export default function SubscriptionManager({
  currency,
  plans,
  activePlanId,
  seatCount,
  usage,
  addOns,
  includedAddOns,
  onPlanChange,
  onSeatChange,
  onAddOnToggle,
  onCheckout,
  onCancel,
}) {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedPlanId, setSelectedPlanId] = useState(() => activePlanId ?? plans?.[0]?.id ?? null);
  const [seats, setSeats] = useState(seatCount ?? 5);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState(new Set(includedAddOns ?? []));

  const selectedPlan = useMemo(
    () => (plans ?? []).find((plan) => plan.id === selectedPlanId) ?? plans?.[0] ?? null,
    [plans, selectedPlanId],
  );

  const basePrice = selectedPlan ? selectedPlan.pricing[billingCycle] ?? 0 : 0;
  const seatMultiplier = Math.max(seats, selectedPlan?.minimumSeats ?? 1);
  const addOnTotal = useMemo(() => {
    return addOns
      .filter((addOn) => selectedAddOnIds.has(addOn.id))
      .reduce((acc, addOn) => acc + (addOn.pricing?.[billingCycle] ?? 0), 0);
  }, [addOns, billingCycle, selectedAddOnIds]);

  const billingSummary = useMemo(() => {
    const seatCost = selectedPlan?.pricingPerSeat?.[billingCycle] ?? 0;
    const base = basePrice + seatCost * seatMultiplier;
    const total = base + addOnTotal;
    return {
      base,
      addOns: addOnTotal,
      total,
    };
  }, [addOnTotal, basePrice, seatMultiplier, selectedPlan, billingCycle]);

  function handleBillingCycleChange(nextCycle) {
    setBillingCycle(nextCycle);
  }

  function handlePlanSelect(planId) {
    setSelectedPlanId(planId);
    onPlanChange?.(planId, billingCycle);
  }

  function handleSeatChange(nextSeats) {
    const safeSeats = Math.max(selectedPlan?.minimumSeats ?? 1, Number(nextSeats) || 1);
    setSeats(safeSeats);
    onSeatChange?.(safeSeats);
  }

  function toggleAddOn(addOnId) {
    setSelectedAddOnIds((current) => {
      const next = new Set(current);
      if (next.has(addOnId)) {
        next.delete(addOnId);
      } else {
        next.add(addOnId);
      }
      onAddOnToggle?.(addOnId, next.has(addOnId));
      return next;
    });
  }

  function handleCheckout() {
    if (!selectedPlan) return;
    onCheckout?.({
      planId: selectedPlan.id,
      billingCycle,
      seats,
      addOns: Array.from(selectedAddOnIds),
      total: billingSummary.total,
    });
  }

  function handleCancel() {
    onCancel?.({ planId: activePlanId });
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/40 backdrop-blur">
      <header className="flex flex-col gap-3 border-b border-slate-100 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Subscription control hub</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Curate plans, seats & add-ons</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Compare membership tiers, monitor usage against commitments, and orchestrate renewals with enterprise polish. Give
            operators and finance teams the clarity they expect from LinkedIn-class suites.
          </p>
        </div>
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50/70 p-1 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => handleBillingCycleChange('monthly')}
            className={`rounded-full px-4 py-1 transition ${
              billingCycle === 'monthly' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-white'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => handleBillingCycleChange('annual')}
            className={`rounded-full px-4 py-1 transition ${
              billingCycle === 'annual' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-white'
            }`}
          >
            Annual (save 15%)
          </button>
        </div>
      </header>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_1.3fr]">
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(plans ?? []).map((plan) => {
              const isSelected = plan.id === selectedPlan?.id;
              const isActive = plan.id === activePlanId;
              return (
                <article
                  key={plan.id}
                  className={`flex flex-col justify-between rounded-3xl border p-5 shadow-sm transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-sky-500 ${
                    isSelected
                      ? 'border-sky-200 bg-gradient-to-br from-sky-50 via-white to-indigo-50 shadow-sky-100'
                      : 'border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="space-y-3">
                    <header className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{plan.category ?? 'Plan'}</p>
                        <h3 className="mt-1 text-xl font-semibold text-slate-900">{plan.name}</h3>
                      </div>
                      {plan.recommended ? (
                        <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-400 to-rose-400 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                          Recommended
                        </span>
                      ) : null}
                    </header>
                    <p className="text-sm text-slate-600">{plan.description}</p>
                    <p className="text-3xl font-semibold text-slate-900">
                      {formatCurrency(plan.pricing[billingCycle], currency)}
                      <span className="ml-1 text-base font-medium text-slate-500">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                    </p>
                    {plan.pricingPerSeat ? (
                      <p className="text-xs text-slate-500">
                        + {formatCurrency(plan.pricingPerSeat[billingCycle], currency)} per seat · includes{' '}
                        {plan.minimumSeats ?? 1} seats
                      </p>
                    ) : null}
                    <ul className="mt-4 space-y-2 text-sm text-slate-600">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => handlePlanSelect(plan.id)}
                      className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${
                        isSelected ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      {isActive ? 'Current plan' : isSelected ? 'Selected' : 'Select plan'}
                    </button>
                    <p className="text-xs text-slate-500">
                      SLA: {plan.sla ?? 'Standard'} · Support: {plan.supportTier ?? 'Core'}
                    </p>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Seat management</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">Seats & collaborators</h3>
              </div>
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50/70 p-1 text-sm text-slate-600">
                <button
                  type="button"
                  onClick={() => handleSeatChange(seats - 1)}
                  className="px-3 py-1 font-semibold transition hover:bg-white"
                  aria-label="Decrease seats"
                >
                  −
                </button>
                <input
                  type="number"
                  min={selectedPlan?.minimumSeats ?? 1}
                  value={seats}
                  onChange={(event) => handleSeatChange(event.target.value)}
                  className="w-16 rounded-full border border-slate-200 bg-white px-3 py-1 text-center text-sm font-semibold text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
                <button
                  type="button"
                  onClick={() => handleSeatChange(seats + 1)}
                  className="px-3 py-1 font-semibold transition hover:bg-white"
                  aria-label="Increase seats"
                >
                  +
                </button>
              </div>
            </header>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Active seats</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{usage?.activeSeats ?? 0}</p>
                <p className="text-xs text-slate-500">{usage?.pendingInvites ?? 0} pending invites</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Utilisation</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {Math.round(((usage?.activeSeats ?? 0) / Math.max(seats, 1)) * 100) || 0}%
                </p>
                <p className="text-xs text-slate-500">of allocated seats</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Renewal</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{usage?.renewalDate ?? '30 days'}</p>
                <p className="text-xs text-slate-500">Auto reminders 14 / 7 / 1 days before</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Add-ons</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">Specialised upgrades</h3>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {selectedAddOnIds.size} selected
              </p>
            </header>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {addOns.map((addOn) => {
                const selected = selectedAddOnIds.has(addOn.id);
                return (
                  <article
                    key={addOn.id}
                    className={`rounded-2xl border p-4 transition hover:border-slate-300 hover:bg-white ${
                      selected ? 'border-emerald-200 bg-emerald-50/70 shadow-sm' : 'border-slate-200 bg-white/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-semibold text-slate-900">{addOn.name}</h4>
                        <p className="mt-1 text-sm text-slate-600">{addOn.description}</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {formatCurrency(addOn.pricing?.[billingCycle] ?? 0, currency)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleAddOn(addOn.id)}
                      className={`mt-4 inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                        selected ? 'border-emerald-400 bg-emerald-500 text-white' : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      {selected ? 'Added' : 'Add to plan'}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-200/60">
            <header className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Billing overview</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{selectedPlan?.name ?? 'Plan'}</h3>
                <p className="text-sm text-slate-500">
                  {billingCycle === 'monthly' ? 'Billed monthly' : 'Billed annually with savings applied'}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                {currency}
              </span>
            </header>

            <dl className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <dt>Plan base</dt>
                <dd className="font-semibold text-slate-900">{formatCurrency(basePrice, currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Seats ({seatMultiplier})</dt>
                <dd className="font-semibold text-slate-900">
                  {formatCurrency((selectedPlan?.pricingPerSeat?.[billingCycle] ?? 0) * seatMultiplier, currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Add-ons</dt>
                <dd className="font-semibold text-slate-900">{formatCurrency(addOnTotal, currency)}</dd>
              </div>
              <div className="flex justify-between rounded-2xl bg-slate-900/90 px-4 py-3 text-base font-semibold text-white">
                <dt>Total due</dt>
                <dd>{formatCurrency(billingSummary.total, currency)}</dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCheckout}
                className="inline-flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-sky-600 hover:to-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                Confirm changes
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
              >
                Manage cancellation
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Usage analytics</p>
            <div className="mt-4 space-y-4">
              {(usage?.metrics ?? []).map((metric) => {
                const ratio = Math.min(1, Math.max(0, (metric.value ?? 0) / (metric.quota ?? 1)));
                return (
                  <div key={metric.label}>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span className="font-semibold text-slate-700">{metric.label}</span>
                      <span>
                        {metric.value ?? 0}/{metric.quota ?? '∞'} {metric.unit ?? ''}
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-emerald-400 via-sky-500 to-indigo-500"
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Automated alerts fire when you exceed 85% utilisation and weekly summaries deliver to finance, operations, and
              success teams.
            </p>
          </section>
        </aside>
      </div>
    </section>
  );
}

SubscriptionManager.propTypes = {
  currency: PropTypes.string,
  plans: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      category: PropTypes.string,
      description: PropTypes.string,
      pricing: PropTypes.shape({
        monthly: PropTypes.number,
        annual: PropTypes.number,
      }).isRequired,
      pricingPerSeat: PropTypes.shape({
        monthly: PropTypes.number,
        annual: PropTypes.number,
      }),
      minimumSeats: PropTypes.number,
      features: PropTypes.arrayOf(PropTypes.string).isRequired,
      recommended: PropTypes.bool,
      sla: PropTypes.string,
      supportTier: PropTypes.string,
    }),
  ),
  activePlanId: PropTypes.string,
  seatCount: PropTypes.number,
  usage: PropTypes.shape({
    activeSeats: PropTypes.number,
    pendingInvites: PropTypes.number,
    renewalDate: PropTypes.string,
    metrics: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.number,
        quota: PropTypes.number,
        unit: PropTypes.string,
      }),
    ),
  }),
  addOns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      pricing: PropTypes.shape({
        monthly: PropTypes.number,
        annual: PropTypes.number,
      }),
    }),
  ),
  includedAddOns: PropTypes.arrayOf(PropTypes.string),
  onPlanChange: PropTypes.func,
  onSeatChange: PropTypes.func,
  onAddOnToggle: PropTypes.func,
  onCheckout: PropTypes.func,
  onCancel: PropTypes.func,
};

SubscriptionManager.defaultProps = {
  currency: 'USD',
  plans: [],
  activePlanId: null,
  seatCount: 5,
  usage: { metrics: [] },
  addOns: [],
  includedAddOns: [],
  onPlanChange: undefined,
  onSeatChange: undefined,
  onAddOnToggle: undefined,
  onCheckout: undefined,
  onCancel: undefined,
};

