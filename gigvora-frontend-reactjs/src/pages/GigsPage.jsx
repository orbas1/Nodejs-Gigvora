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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,245,201,0.1),_transparent_60%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Gigs"
          title="High-impact collaborations for independents"
          description="Short-term missions from agencies, startups, and companies ready for agile execution."
        />
        <div className="space-y-6">
          {gigs.map((gig) => (
            <article key={gig.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-accent/40 hover:bg-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/50">
                <span>{gig.poster}</span>
                <span>{gig.duration}</span>
                <span>{gig.budget}</span>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-white">{gig.title}</h2>
              <p className="mt-2 text-sm text-white/70">{gig.description}</p>
              <button className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-xs font-semibold text-white/80 transition hover:border-accent/50 hover:text-white">
                Pitch this gig <span aria-hidden="true">→</span>
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
