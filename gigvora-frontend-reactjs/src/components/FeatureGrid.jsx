const features = [
  {
    title: 'Mentor marketplace',
    description: 'Book 1:1 sessions, clinics, and growth packages with operators across leadership, product, and revenue.',
  },
  {
    title: 'Experience Launchpad',
    description: 'Structured cohort programmes focused on shipping portfolio-ready work with partner companies.',
  },
  {
    title: 'Jobs & Projects',
    description: 'Full-time roles, contract gigs, and mission-driven initiatives with transparent scopes and budgets.',
  },
  {
    title: 'Live Feed & Groups',
    description: 'Share wins, join industry groups, and grow with follows, connects, and collaborative circles.',
  },
  {
    title: 'Agency & Company Hubs',
    description: 'Dedicated spaces for agencies and companies to showcase teams and manage talent pipelines.',
  },
];

export default function FeatureGrid() {
  return (
    <section className="border-y border-slate-200/70 bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 max-w-2xl space-y-4">
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Everything you need to launch, hire, and grow</h2>
          <p className="text-base text-slate-600">
            Gigvora fuses marketplace capabilities with a professional community so freelancers, companies, agencies, and career seekers each have a tailored home base.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-surface p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-soft"
            >
              <div className="absolute -top-10 -right-8 h-24 w-24 rounded-full bg-accentSoft blur-2xl transition duration-300 group-hover:bg-accent/30" aria-hidden="true" />
              <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-3 text-sm text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
