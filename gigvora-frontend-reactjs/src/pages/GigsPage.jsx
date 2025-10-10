import PageHeader from '../components/PageHeader.jsx';

const gigs = [
  {
    id: 1,
    title: 'Brand Identity Sprint',
    poster: 'Nova Agency',
    budget: '$3,500',
    duration: '4 weeks',
    description: 'Collaborate with our creative team to deliver a fresh visual identity for a future of work summit.',
  },
  {
    id: 2,
    title: 'AI Recruiting Prototype',
    poster: 'Gigvora Labs',
    budget: '$2,000',
    duration: '2 weeks',
    description: 'Ship a clickable prototype demonstrating AI-assisted candidate matching workflows.',
  },
];

export default function GigsPage() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Gigs"
          title="High-impact collaborations for independents"
          description="Short-term missions from agencies, startups, and companies ready for agile execution."
        />
        <div className="space-y-6">
          {gigs.map((gig) => (
            <article
              key={gig.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <span>{gig.poster}</span>
                <span>{gig.duration}</span>
                <span>{gig.budget}</span>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">{gig.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{gig.description}</p>
              <button className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent">
                Pitch this gig <span aria-hidden="true">→</span>
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
