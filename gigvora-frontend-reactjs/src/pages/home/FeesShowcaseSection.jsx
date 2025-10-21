import { Link } from 'react-router-dom';

const pricingTiers = [
  {
    title: '5× Job Posts',
    headline: '£39.99',
    badge: 'Hiring bundle',
    details: [
      {
        label: 'Who pays',
        value: 'Workspace admins or hiring leads launching a campaign.',
      },
      {
        label: "What's included",
        value: 'Five featured listings, direct messaging, and talent shortlists.',
      },
      {
        label: 'When it applies',
        value: 'Per 30-day publishing window—renew only when new roles go live.',
      },
    ],
  },
  {
    title: 'Contracts',
    headline: '2.5% commission',
    badge: 'Service partners',
    details: [
      {
        label: 'Who pays',
        value: 'Clients confirming project or retainer engagements.',
      },
      {
        label: "What's included",
        value: 'Contract generation, e-signatures, dispute cover, and payout tracking.',
      },
      {
        label: 'When it applies',
        value: 'Automatically on successful contract releases and funded milestones.',
      },
    ],
  },
  {
    title: 'Gigs',
    headline: '4% commission',
    badge: 'Independent talent',
    details: [
      {
        label: 'Who pays',
        value: 'Specialists on delivered gigs and micro-projects.',
      },
      {
        label: "What's included",
        value: 'Gig vault hosting, verified reviews, and instant payouts to your wallet.',
      },
      {
        label: 'When it applies',
        value: 'Applied only when the client approves and funds the gig outcome.',
      },
    ],
  },
];

export function FeesShowcaseSection() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.35),_transparent_55%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6 text-white">
        <div className="max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
            Transparent fees
          </span>
          <h2 className="text-3xl font-semibold sm:text-4xl">Pricing that respects every partnership</h2>
          <p className="text-base text-white/70">
            Understand exactly how Gigvora charges across hiring, contracts, and gig delivery. Every package keeps incentives aligned so you only pay when value is created.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {pricingTiers.map((tier) => (
            <article
              key={tier.title}
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-8 shadow-[0_35px_80px_-40px_rgba(37,99,235,0.55)] backdrop-blur"
            >
              <div className="pointer-events-none absolute -top-10 right-0 h-32 w-32 rounded-full bg-accent/30 blur-3xl transition group-hover:bg-accent/50" aria-hidden="true" />
              <div className="relative space-y-4">
                <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                  {tier.badge}
                </span>
                <div>
                  <h3 className="text-2xl font-semibold text-white">{tier.title}</h3>
                  <p className="mt-2 text-3xl font-semibold text-white">{tier.headline}</p>
                </div>
                <dl className="mt-6 space-y-3 text-sm text-white/80">
                  {tier.details.map((detail) => (
                    <div key={detail.label}>
                      <dt className="font-semibold text-white">{detail.label}</dt>
                      <dd className="mt-1 text-white/70">{detail.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </article>
          ))}
        </div>

        <div className="relative mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-soft transition hover:-translate-y-0.5"
          >
            Explore detailed pricing
          </Link>
          <p className="text-sm text-white/60">
            Want the full breakdown? Visit our pricing desk to compare subscriptions, add-ons, and enterprise terms.
          </p>
        </div>
      </div>
    </section>
  );
}
