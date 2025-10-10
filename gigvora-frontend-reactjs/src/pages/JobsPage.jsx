import PageHeader from '../components/PageHeader.jsx';

const jobs = [
  {
    id: 1,
    title: 'Senior Frontend Engineer',
    company: 'Orbit Labs',
    location: 'Remote',
    salary: '$130k - $150k',
    description: 'Lead the next iteration of our hiring marketplace UI with React and Tailwind.',
  },
  {
    id: 2,
    title: 'Growth Marketing Lead',
    company: 'Gigvora HQ',
    location: 'Hybrid • NYC',
    salary: '$110k - $130k + bonus',
    description: 'Build demand generation programs for agencies, companies, and freelancers.',
  },
];

export default function JobsPage() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,245,201,0.1),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Jobs"
          title="Roles designed for Gigvora talent"
          description="Full-time and long-term opportunities curated for the marketplace community with transparent salary bands."
        />
        <div className="space-y-6">
          {jobs.map((job) => (
            <article key={job.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-accent/40 hover:bg-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/50">
                <span>{job.company}</span>
                <span>{job.location}</span>
                <span>{job.salary}</span>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-white">{job.title}</h2>
              <p className="mt-2 text-sm text-white/70">{job.description}</p>
              <button className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-slate-950 shadow shadow-accent/30 transition hover:shadow-accent/50">
                Apply now <span aria-hidden="true">→</span>
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
