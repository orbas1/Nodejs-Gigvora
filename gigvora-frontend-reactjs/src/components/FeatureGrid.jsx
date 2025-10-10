const features = [
  {
    title: 'Experience Launchpad',
    description: 'Curated sprints that help emerging talent ship portfolio-ready work alongside mentors and teams.',
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
    <section className="border-y border-white/5 bg-slate-950/70 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 max-w-2xl space-y-4">
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">Everything you need to launch, hire, and grow</h2>
          <p className="text-base text-white/70">
            Gigvora fuses marketplace capabilities with a professional community so freelancers, companies, agencies, and career seekers each have a tailored home base.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900 to-slate-950 p-8 transition duration-300 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/10">
              <div className="absolute -top-8 -right-6 h-24 w-24 rounded-full bg-accent/5 blur-2xl transition duration-300 group-hover:bg-accent/20" aria-hidden="true" />
              <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
              <p className="mt-3 text-sm text-white/70">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
