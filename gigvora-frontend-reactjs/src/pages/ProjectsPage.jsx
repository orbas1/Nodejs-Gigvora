import PageHeader from '../components/PageHeader.jsx';

const projects = [
  {
    id: 1,
    title: 'Experience Launchpad Sprint 03',
    summary: 'A 6-week product build pairing founders with rising talent to ship MVP experiments.',
    collaborators: 24,
    stage: 'Accepting applications',
  },
  {
    id: 2,
    title: 'Creator Studio Collective',
    summary: 'Cross-functional storytellers teaming up with agencies on branded podcast pilots.',
    collaborators: 18,
    stage: 'In progress',
  },
];

export default function ProjectsPage() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Projects"
          title="Co-create on mission-driven initiatives"
          description="Join collaborative squads building products, content, and community programs across the Gigvora ecosystem."
        />
        <div className="space-y-6">
          {projects.map((project) => (
            <article
              key={project.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <span>{project.stage}</span>
                <span>{project.collaborators} collaborators</span>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">{project.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{project.summary}</p>
              <button className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent">
                Join project <span aria-hidden="true">→</span>
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
