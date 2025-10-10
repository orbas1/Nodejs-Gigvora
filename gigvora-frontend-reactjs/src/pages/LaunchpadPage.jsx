import PageHeader from '../components/PageHeader.jsx';

const cohorts = [
  {
    id: 1,
    name: 'Launchpad Cohort • Product Builders',
    dates: 'June 2024',
    mentors: ['Ava Founder', 'Leo Freelancer'],
    description: 'Six-week immersive focused on product discovery, UX research, and go-to-market storytelling.',
  },
  {
    id: 2,
    name: 'Launchpad Cohort • Creative Producers',
    dates: 'August 2024',
    mentors: ['Nova Agency', 'Atlas Studios'],
    description: 'Produce branded content and narrative design with agencies shipping campaigns worldwide.',
  },
];

export default function LaunchpadPage() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,245,201,0.12),_transparent_60%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Experience Launchpad"
          title="Guided programs to ship portfolio-ready work"
          description="Co-create alongside mentors and companies with structured sprints, feedback rituals, and community support."
        />
        <div className="space-y-6">
          {cohorts.map((cohort) => (
            <article key={cohort.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-accent/40 hover:bg-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/50">
                <span>{cohort.dates}</span>
                <span>{cohort.mentors.join(', ')}</span>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-white">{cohort.name}</h2>
              <p className="mt-2 text-sm text-white/70">{cohort.description}</p>
              <button className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-slate-950 shadow shadow-accent/30 transition hover:shadow-accent/50">
                Apply to cohort <span aria-hidden="true">→</span>
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
