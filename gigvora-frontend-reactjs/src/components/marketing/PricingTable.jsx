import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { ArrowUpRightIcon, CheckIcon, SparklesIcon } from '@heroicons/react/24/outline';
import analytics from '../../services/analytics.js';

const BILLING_CYCLES = ['monthly', 'annual'];

function formatPrice(value) {
  if (value == null) {
    return 'Custom';
  }
  if (typeof value === 'string') {
    return value;
  }
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
}

function resolveFeatureMatrix(matrix, plans) {
  if (!Array.isArray(matrix) || !matrix.length) {
    return [];
  }

  const planIds = plans.map((plan) => plan.id);

  return matrix
    .map((row) => {
      if (!row) return null;
      const tiers = planIds.reduce((accumulator, planId) => {
        const value = row.tiers?.[planId];
        return {
          ...accumulator,
          [planId]: value ?? false,
        };
      }, {});

      return {
        key: row.key ?? row.label ?? row.description,
        label: row.label ?? row.name ?? 'Feature',
        description: row.description ?? null,
        tiers,
      };
    })
    .filter(Boolean);
}

export default function PricingTable({
  plans,
  featureMatrix,
  metrics,
  defaultBillingCycle = 'annual',
  analyticsMetadata = {},
  onPlanSelected,
  className,
}) {
  const [billingCycle, setBillingCycle] = useState(BILLING_CYCLES.includes(defaultBillingCycle) ? defaultBillingCycle : 'annual');
  const safePlans = useMemo(() => (Array.isArray(plans) ? plans.filter(Boolean) : []), [plans]);
  const resolvedFeatureMatrix = useMemo(() => resolveFeatureMatrix(featureMatrix, safePlans), [featureMatrix, safePlans]);
  const resolvedMetrics = useMemo(() => {
    if (!Array.isArray(metrics) || !metrics.length) {
      return [
        { label: 'Average ROI', value: '6.4x', helper: 'Based on anonymised operator cohorts over 12 months.' },
        { label: 'Payback period', value: '41 days', helper: 'Marketing & ops teams recover platform costs in under 6 weeks.' },
        { label: 'Activation', value: '93%', helper: 'Members launching workflows within the first 14 days.' },
      ];
    }

    return metrics
      .map((item) => {
        if (!item) return null;
        const label = item.label ?? item.name ?? item.title ?? null;
        const value = item.value ?? item.metric ?? null;
        if (!label && !value) {
          return null;
        }
        return {
          label: label ?? value,
          value: value ?? label,
          helper: item.helper ?? item.description ?? null,
        };
      })
      .filter(Boolean);
  }, [metrics]);

  const displayPlans = useMemo(
    () =>
      safePlans.map((plan) => {
        const price = plan.pricing?.[billingCycle] ?? null;
        const cadence = plan.cadenceLabel ?? (billingCycle === 'annual' ? 'per user / month, billed annually' : 'per user / month');
        return {
          ...plan,
          price,
          cadence,
          savings: plan.savings?.[billingCycle] ?? null,
        };
      }),
    [billingCycle, safePlans],
  );

  useEffect(() => {
    analytics.track(
      'marketing_pricing_viewed',
      {
        planCount: displayPlans.length,
        defaultBillingCycle: billingCycle,
      },
      { source: analyticsMetadata.source ?? 'web_marketing_site' },
    );
  }, [analyticsMetadata.source, billingCycle, displayPlans.length]);

  const handleBillingChange = (cycle) => {
    if (!BILLING_CYCLES.includes(cycle) || cycle === billingCycle) {
      return;
    }
    setBillingCycle(cycle);
    analytics.track(
      'marketing_pricing_cycle_changed',
      {
        cycle,
      },
      { source: analyticsMetadata.source ?? 'web_marketing_site' },
    );
  };

  const handlePlanAction = (plan, action) => {
    analytics.track(
      'marketing_pricing_plan_selected',
      {
        plan: plan.id,
        billingCycle,
        action,
      },
      { source: analyticsMetadata.source ?? 'web_marketing_site' },
    );
    onPlanSelected?.({ plan, billingCycle, action });
  };

  return (
    <section className={clsx('relative overflow-hidden bg-slate-950/60 py-20', className)}>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.18),_transparent_65%)]" aria-hidden="true" />
      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-6">
        <header className="flex flex-col items-start gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-rose-200">
              Pricing & plans
            </p>
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">Flexible subscriptions built for high-velocity teams.</h2>
              <p className="text-sm text-white/70">
                Compare plans, calculate ROI, and trigger a tailored quote without leaving the page. Switching between monthly and
                annual billing reveals guaranteed savings and unlocks launch concierge support for growth and enterprise tiers.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 text-xs font-semibold uppercase tracking-[0.32em] text-white/70">
            {BILLING_CYCLES.map((cycle) => (
              <button
                key={cycle}
                type="button"
                onClick={() => handleBillingChange(cycle)}
                className={clsx(
                  'rounded-full px-4 py-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                  billingCycle === cycle ? 'bg-white text-slate-900 shadow-soft' : 'bg-transparent text-white/60 hover:text-white',
                )}
                aria-pressed={billingCycle === cycle}
              >
                {cycle === 'annual' ? 'Annual · 2 months free' : 'Monthly'}
              </button>
            ))}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          {displayPlans.map((plan) => (
            <article
              key={plan.id}
              className={clsx(
                'relative flex flex-col gap-6 rounded-4xl border p-8 shadow-[0_40px_120px_rgba(15,23,42,0.45)] backdrop-blur',
                plan.recommended
                  ? 'border-white/30 bg-gradient-to-br from-white/15 via-white/5 to-transparent'
                  : 'border-white/10 bg-white/5',
              )}
            >
              {plan.recommended ? (
                <div className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-950 shadow-soft">
                  <SparklesIcon className="h-4 w-4" aria-hidden="true" />
                  Most popular
                </div>
              ) : null}

              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
                <p className="text-sm text-white/70">{plan.headline}</p>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-semibold text-white">{formatPrice(plan.price)}</span>
                <span className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">{plan.cadence}</span>
              </div>
              {plan.savings ? <p className="text-xs text-emerald-300">{plan.savings}</p> : null}

              <ul className="space-y-3 text-sm text-white/80">
                {Array.isArray(plan.features)
                  ? plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <CheckIcon className="mt-1 h-4 w-4 flex-none text-emerald-400" aria-hidden="true" />
                        <span>{feature}</span>
                      </li>
                    ))
                  : null}
              </ul>

              <div className="mt-auto flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => handlePlanAction(plan, 'primary')}
                  className={clsx(
                    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                    plan.recommended
                      ? 'bg-accent text-slate-950 shadow-soft hover:-translate-y-0.5 hover:bg-accentDark'
                      : 'bg-white/10 text-white hover:bg-white/20',
                  )}
                >
                  {plan.ctaLabel ?? 'Start a 14-day pilot'}
                  <ArrowUpRightIcon className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => handlePlanAction(plan, 'secondary')}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
                >
                  Talk to sales
                </button>
              </div>

              {plan.metrics ? (
                <dl className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
                  {Object.entries(plan.metrics).map(([label, value]) => (
                    <div key={label}>
                      <dt className="font-semibold uppercase tracking-[0.28em] text-white/50">{label}</dt>
                      <dd className="mt-1 text-sm text-white">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </article>
          ))}
        </div>

        {resolvedFeatureMatrix.length ? (
          <div className="space-y-6 rounded-4xl border border-white/10 bg-white/5 p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Feature comparison</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Clarify what each tier unlocks before you book a call.</h3>
              </div>
              <p className="text-xs text-white/60">Hover each check to see governance notes and data residency coverage.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse text-left text-sm text-white/80">
                <thead>
                  <tr>
                    <th scope="col" className="w-2/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/50">
                      Capability
                    </th>
                    {displayPlans.map((plan) => (
                      <th
                        key={plan.id}
                        scope="col"
                        className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/50"
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resolvedFeatureMatrix.map((row) => (
                    <tr key={row.key} className="border-t border-white/10">
                      <th scope="row" className="px-4 py-4 align-top text-white">
                        <div className="font-semibold">{row.label}</div>
                        {row.description ? <p className="mt-1 text-xs text-white/60">{row.description}</p> : null}
                      </th>
                      {displayPlans.map((plan) => {
                        const value = row.tiers[plan.id];
                        const isString = typeof value === 'string';
                        const isEnabled = Boolean(value) && !isString;
                        return (
                          <td key={plan.id} className="px-4 py-4 align-top text-center">
                            {isString ? (
                              <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                                {value}
                              </span>
                            ) : isEnabled ? (
                              <CheckIcon className="mx-auto h-5 w-5 text-emerald-400" aria-hidden="true" />
                            ) : (
                              <span className="mx-auto block h-2 w-2 rounded-full bg-white/15" aria-hidden="true" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 rounded-4xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8 text-sm text-white/80 sm:grid-cols-3">
          {resolvedMetrics.map((metric) => (
            <article key={metric.label} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">{metric.label}</p>
              <p className="text-3xl font-semibold text-white">{metric.value}</p>
              {metric.helper ? <p className="text-xs text-white/60">{metric.helper}</p> : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

PricingTable.propTypes = {
  plans: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      headline: PropTypes.string,
      pricing: PropTypes.shape({
        monthly: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        annual: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      }),
      cadenceLabel: PropTypes.string,
      savings: PropTypes.shape({
        monthly: PropTypes.string,
        annual: PropTypes.string,
      }),
      features: PropTypes.arrayOf(PropTypes.string),
      metrics: PropTypes.object,
      recommended: PropTypes.bool,
      ctaLabel: PropTypes.string,
    }),
  ).isRequired,
  featureMatrix: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      label: PropTypes.string,
      description: PropTypes.string,
      tiers: PropTypes.object,
    }),
  ),
  metrics: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      helper: PropTypes.string,
      description: PropTypes.string,
      metric: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      title: PropTypes.string,
    }),
  ),
  defaultBillingCycle: PropTypes.oneOf(BILLING_CYCLES),
  analyticsMetadata: PropTypes.shape({
    source: PropTypes.string,
  }),
  onPlanSelected: PropTypes.func,
  className: PropTypes.string,
};

PricingTable.defaultProps = {
  featureMatrix: [],
  metrics: [],
  defaultBillingCycle: 'annual',
  analyticsMetadata: {},
  onPlanSelected: undefined,
  className: undefined,
};
