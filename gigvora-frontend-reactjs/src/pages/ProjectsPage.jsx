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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,245,201,0.1),_transparent_60%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Projects"
          title="Co-create on mission-driven initiatives"
          description="Join collaborative squads building products, content, and community programs across the Gigvora ecosystem."
        />
        <div className="space-y-6">
          {projects.map((project) => (
            <article key={project.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-accent/40 hover:bg-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/50">
                <span>{project.stage}</span>
                <span>{project.collaborators} collaborators</span>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-white">{project.title}</h2>
              <p className="mt-2 text-sm text-white/70">{project.summary}</p>
              <button className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-xs font-semibold text-white/80 transition hover:border-accent/50 hover:text-white">
                Join project <span aria-hidden="true">→</span>
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
