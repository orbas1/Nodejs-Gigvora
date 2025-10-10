const partners = [
  { name: 'Atlas Labs', tagline: 'Fintech collective' },
  { name: 'Nova Creative', tagline: 'Design agency' },
  { name: 'Orbit Systems', tagline: 'AI innovation' },
  { name: 'Blue Horizon', tagline: 'Impact hub' },
  { name: 'Vanguard Talent', tagline: 'Global staffing' },
];

export default function PartnerStrip() {
  return (
    <section className="border-y border-slate-200 bg-white/90 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
          Trusted by teams scaling work with Gigvora
        </p>
        <div className="grid grid-cols-2 gap-6 text-left text-slate-500 sm:grid-cols-3 lg:grid-cols-5">
          {partners.map((partner) => (
            <div
              key={partner.name}
              className="rounded-2xl border border-transparent bg-surface px-4 py-3 text-sm transition hover:border-accent/40 hover:bg-white hover:text-accentDark"
            >
              <p className="font-semibold text-slate-600">{partner.name}</p>
              <p className="text-xs text-slate-400">{partner.tagline}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
