const showcase = [
  {
    label: 'Web control centre',
    headline: 'Give customers a dashboard that feels like their brand.',
    copy: 'Customize layouts, invite stakeholders, and stay audit-ready with a click.',
    image:
      'https://images.unsplash.com/photo-1526379879527-8559ecfcaec0?auto=format&fit=crop&w=1400&q=80',
    bullets: ['Drag-and-drop workspaces', 'Live status for every milestone', 'Enterprise-grade permissions'],
  },
  {
    label: 'Mobile companion',
    headline: 'A pocket coach that mirrors every action on web.',
    copy: 'Talent and teams respond, approve, and celebrate from anywhere.',
    image:
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1400&q=80',
    bullets: ['Push updates that delight', 'Dark-mode perfection', 'Secure sign-in every time'],
  },
];

export default function ProductShowcase() {
  return (
    <section className="relative overflow-hidden bg-white py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-surfaceMuted via-white to-surfaceMuted" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl space-y-16 px-6">
        <header className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-accentDark">Product tour</span>
          <h2 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">Beautiful parity across web and phone</h2>
          <p className="mt-4 text-base text-slate-600">
            Your customers and talent get the same polished experience whether they log in from a laptop or from the train.
          </p>
        </header>
        <div className="grid gap-8 lg:grid-cols-2">
          {showcase.map((item) => (
            <article
              key={item.label}
              className="group relative flex h-full flex-col overflow-hidden rounded-[44px] border border-slate-200 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:border-accent/50"
            >
              <div className="relative h-72 w-full overflow-hidden">
                <img
                  src={item.image}
                  alt={item.label}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                <div className="absolute left-6 top-6 rounded-full bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">
                  {item.label}
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-4 px-8 py-8">
                <h3 className="text-2xl font-semibold text-slate-900">{item.headline}</h3>
                <p className="text-sm text-slate-600">{item.copy}</p>
                <ul className="space-y-2 text-sm text-slate-600">
                  {item.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-accent">
                  Explore the {item.label.toLowerCase()}
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
