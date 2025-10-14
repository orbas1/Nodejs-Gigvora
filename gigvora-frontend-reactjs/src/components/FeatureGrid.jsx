const features = [
  {
    title: 'Launch ready crews',
    blurb: 'Spin up vetted designers, engineers and strategists the same day you share a brief.',
    image:
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1000&q=80',
  },
  {
    title: 'Client-grade collaboration',
    blurb: 'Chat, files and milestones live in one elegant view your stakeholders understand instantly.',
    image:
      'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1000&q=80',
  },
  {
    title: 'Payments without paperwork',
    blurb: 'Secure contracts, payouts and renewals in a couple taps—no spreadsheets or back-and-forth.',
    image:
      'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1000&q=80',
  },
];

export default function FeatureGrid() {
  return (
    <section className="relative overflow-hidden bg-white py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(219,234,254,0.35),_transparent_70%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <header className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-accentDark">For modern teams</span>
          <h2 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">Everything customers love in one home</h2>
          <p className="mt-4 text-base text-slate-600">
            Less jargon, more flow. Gigvora delivers an experience that feels personal on web and on the go.
          </p>
        </header>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-soft"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent" />
                <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">
                  Seamless
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-4 px-6 pb-6 pt-6">
                <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.blurb}</p>
                <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-accent">
                  See how it works
                  <span aria-hidden="true">→</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
