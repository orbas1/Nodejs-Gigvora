const momentumStats = [
  {
    label: 'Projects launched this week',
    value: '342',
    insight: 'Product, design, data, and community initiatives going live now.',
  },
  {
    label: 'Average response window',
    value: '6 hrs',
    insight: 'Fast connects thanks to proactive agencies and companies.',
  },
  {
    label: 'Mentors on launchpad',
    value: '1.2k',
    insight: 'Leaders across fintech, health, social impact, and more.',
  },
];

const steps = [
  {
    title: 'Craft a standout profile',
    description:
      'Import your experience, spotlight case studies, and weave in availability signals tailored to the Gigvora community.',
  },
  {
    title: 'Engage with the live feed',
    description:
      'Publish updates, join curated groups, and grow your network with meaningful follows and connects.',
  },
  {
    title: 'Activate opportunities',
    description:
      'Match into jobs, gigs, and volunteering that align with your goals—and manage it all from a unified workspace.',
  },
];

export default function MomentumSection() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-surfaceMuted" aria-hidden="true" />
      <div className="absolute -left-32 top-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
      <div className="absolute -right-24 bottom-10 h-52 w-52 rounded-full bg-accentSoft blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-16 px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {momentumStats.map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accentDark">{stat.label}</p>
              <p className="mt-4 text-4xl font-semibold text-slate-900">{stat.value}</p>
              <p className="mt-3 text-sm text-slate-600">{stat.insight}</p>
            </div>
          ))}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-10 shadow-soft">
          <div className="mb-10 flex flex-col gap-4 text-center md:text-left">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-accentDark">How Gigvora works</span>
            <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Momentum for every type of builder</h2>
            <p className="text-base text-slate-600">
              Whether you&apos;re a freelancer, founder, or talent leader, Gigvora orchestrates the journey from first hello to long-term
              collaboration.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="group relative flex flex-col gap-4 rounded-2xl border border-slate-100 bg-surface p-6">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                  {index + 1}
                </span>
                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-accentDark">{step.title}</h3>
                <p className="text-sm text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
