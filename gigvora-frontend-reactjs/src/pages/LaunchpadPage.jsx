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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Experience Launchpad"
          title="Guided programs to ship portfolio-ready work"
          description="Co-create alongside mentors and companies with structured sprints, feedback rituals, and community support."
        />
        <div className="space-y-6">
          {cohorts.map((cohort) => (
            <article
              key={cohort.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <span>{cohort.dates}</span>
                <span>{cohort.mentors.join(', ')}</span>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">{cohort.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{cohort.description}</p>
              <button className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark">
                Apply to cohort <span aria-hidden="true">→</span>
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
