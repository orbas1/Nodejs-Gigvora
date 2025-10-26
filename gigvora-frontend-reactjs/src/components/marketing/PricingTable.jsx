import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

const DEFAULT_PLANS = [
  {
    id: 'starter',
    badge: 'Launch',
    name: 'Starter',
    description: 'Designed for emerging teams validating market fit with curated storytelling.',
    price: { monthly: 0, annual: 0 },
    seatNote: 'Includes 3 collaborator passes',
    highlights: ['Guided marketing layout presets', 'Weekly strategy office hours', 'Community distribution placement'],
    support: 'Workspace concierge chat',
    cta: { label: 'Activate free plan', href: '/register?intent=company' },
  },
  {
    id: 'growth',
    badge: 'Most popular',
    name: 'Growth',
    description: 'For companies aligning revenue, marketing, and talent teams around one narrative.',
    price: { monthly: 149, annual: 149 * 10 },
    seatNote: 'Includes 12 collaborator passes',
    highlights: [
      'Dynamic product tour orchestration',
      'Predictive pricing insights & ROI simulations',
      'Advanced analytics with CRM enrichment',
      'Priority review cycles with creative ops',
    ],
    support: 'Dedicated growth strategist + quarterly labs',
    cta: { label: 'Start growth trial', href: '/contact/sales?plan=growth' },
    isFeatured: true,
  },
  {
    id: 'enterprise',
    badge: 'Scale',
    name: 'Enterprise',
    description: 'Enterprise grade governance, compliance, and bespoke activation squads.',
    price: { monthly: 399, annual: 399 * 11 },
    seatNote: 'Unlimited collaborators + API access',
    highlights: [
      'Custom analytics warehouse + BI connectors',
      'Workspace governance with role-based guardrails',
      'Dedicated conversion pods & creator network sourcing',
      'Onsite launch support with field enablement kits',
    ],
    support: '24/7 executive desk & compliance concierge',
    cta: { label: 'Book enterprise lab', href: '/contact/enterprise' },
  },
];

function formatPrice(value) {
  if (value === 0) {
    return 'Free';
  }
  return `$${value.toLocaleString()}`;
}

export default function PricingTable({ id, headline, description, plans, className }) {
  const [billingCycle, setBillingCycle] = useState('monthly');

  const resolvedPlans = useMemo(() => {
    if (Array.isArray(plans) && plans.length) {
      return plans;
    }
    return DEFAULT_PLANS;
  }, [plans]);

  const handleToggle = (cycle) => {
    setBillingCycle(cycle);
  };

  return (
    <section
      id={id ?? 'pricing'}
      className={clsx(
        'rounded-[2.5rem] border border-white/10 bg-white/[0.05] p-10 text-white shadow-[0_40px_90px_-60px_rgba(15,23,42,0.85)] backdrop-blur-2xl',
        className,
      )}
    >
      <div className="flex flex-col gap-6 text-center">
        <div className="mx-auto max-w-3xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">{headline ?? 'Pricing'}</p>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">Growth-ready plans for every chapter</h2>
          <p className="text-base text-white/70">
            {description ??
              'Choose the workspace tier that meets your stage. All plans include enterprise-grade security, verified talent access, and premium storytelling templates.'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
          <button
            type="button"
            onClick={() => handleToggle('monthly')}
            className={clsx(
              'rounded-full border px-6 py-3 transition focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-slate-900/60',
              billingCycle === 'monthly'
                ? 'border-white bg-white text-slate-900 shadow-lg shadow-accent/20'
                : 'border-white/20 bg-white/5 text-white/70 hover:border-white/40 hover:text-white',
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => handleToggle('annual')}
            className={clsx(
              'rounded-full border px-6 py-3 transition focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-slate-900/60',
              billingCycle === 'annual'
                ? 'border-white bg-white text-slate-900 shadow-lg shadow-accent/20'
                : 'border-white/20 bg-white/5 text-white/70 hover:border-white/40 hover:text-white',
            )}
          >
            Annual · save up to 2 months
          </button>
        </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        {resolvedPlans.map((plan) => {
          const priceValue = plan.price?.[billingCycle];
          const isFree = priceValue === 0;
          const accentClasses = plan.isFeatured
            ? 'border-white/50 bg-gradient-to-br from-accent/20 via-white/15 to-indigo-500/30 shadow-[0_40px_120px_-55px_rgba(59,130,246,0.8)]'
            : 'border-white/10 bg-white/5 shadow-[0_20px_80px_-55px_rgba(15,23,42,0.6)]';

          return (
            <article
              key={plan.id}
              className={clsx(
                'flex h-full flex-col gap-6 rounded-3xl border p-8 backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-[0_50px_130px_-65px_rgba(56,189,248,0.85)]',
                accentClasses,
              )}
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-white/30 bg-white/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70">
                  {plan.badge}
                </span>
                <span className="text-xs uppercase tracking-[0.35em] text-white/50">{plan.seatNote}</span>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
                <p className="mt-2 text-sm text-white/70">{plan.description}</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-semibold text-white">{formatPrice(priceValue)}</span>
                {isFree ? null : (
                  <span className="text-sm text-white/60">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                )}
              </div>
              {billingCycle === 'annual' && !isFree ? (
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300">
                  Save {formatPrice(plan.price.monthly * 12 - plan.price.annual)} annually
                </p>
              ) : null}

              <ul className="space-y-3 text-sm text-white/80">
                {plan.highlights?.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
                {plan.support}
              </div>

              <div className="mt-auto">
                <a
                  href={plan.cta?.href}
                  className={clsx(
                    'inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition',
                    plan.isFeatured
                      ? 'bg-white text-slate-900 shadow-lg shadow-accent/30 hover:-translate-y-0.5 hover:shadow-xl'
                      : 'border border-white/30 bg-white/10 text-white hover:border-white/50 hover:bg-white/20',
                  )}
                >
                  {plan.cta?.label}
                </a>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
        <span>Need a bespoke deployment? Invite our field team for a roadmap audit.</span>
        <a href="mailto:growth@gigvora.com" className="rounded-full border border-white/20 px-5 py-2 text-white transition hover:border-white/40 hover:bg-white/10">
          Talk to a strategist
        </a>
      </div>
    </section>
  );
}

PricingTable.propTypes = {
  id: PropTypes.string,
  headline: PropTypes.string,
  description: PropTypes.string,
  plans: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      badge: PropTypes.string,
      name: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      price: PropTypes.shape({
        monthly: PropTypes.number,
        annual: PropTypes.number,
      }).isRequired,
      seatNote: PropTypes.string,
      highlights: PropTypes.arrayOf(PropTypes.string),
      support: PropTypes.string,
      cta: PropTypes.shape({
        label: PropTypes.string.isRequired,
        href: PropTypes.string.isRequired,
      }),
      isFeatured: PropTypes.bool,
    }),
  ),
  className: PropTypes.string,
};

PricingTable.defaultProps = {
  id: undefined,
  headline: undefined,
  description: undefined,
  plans: undefined,
  className: undefined,
};
