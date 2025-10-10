import PageHeader from '../components/PageHeader.jsx';

const groups = [
  {
    id: 1,
    name: 'Future of Work Collective',
    members: 2140,
    description: 'Discussions on marketplaces, talent collaboration models, and community building.',
  },
  {
    id: 2,
    name: 'Gigvora Launchpad Alumni',
    members: 860,
    description: 'Connect with fellows, mentors, and companies participating in the Experience Launchpad.',
  },
];

export default function GroupsPage() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,245,201,0.1),_transparent_60%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Groups"
          title="Communities tailored to your craft"
          description="Join cohorts, industry circles, and passion communities to collaborate, learn, and amplify your work."
        />
        <div className="space-y-6">
          {groups.map((group) => (
            <article key={group.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-accent/40 hover:bg-white/10">
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>{group.members} members</span>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-white">{group.name}</h2>
              <p className="mt-2 text-sm text-white/70">{group.description}</p>
              <button className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-xs font-semibold text-white/80 transition hover:border-accent/50 hover:text-white">
                Request to join <span aria-hidden="true">→</span>
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
