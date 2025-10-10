import PageHeader from '../components/PageHeader.jsx';

const connections = [
  {
    id: 1,
    name: 'Sasha Strategist',
    type: 'Follower',
    description: 'Growth strategist exploring collaborations with creative agencies.',
  },
  {
    id: 2,
    name: 'Noor Designer',
    type: 'Connection',
    description: 'Product designer from Launchpad Cohort 02 — co-led a fintech design sprint.',
  },
  {
    id: 3,
    name: 'Atlas Agency',
    type: 'Connection',
    description: 'Boutique agency specializing in brand storytelling and motion design.',
  },
];

export default function ConnectionsPage() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,245,201,0.08),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Network"
          title="Followers &amp; connects"
          description="Nurture your relationships across the Gigvora network and unlock collaborations faster."
        />
        <div className="space-y-5">
          {connections.map((connection) => (
            <article key={connection.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-accent/40 hover:bg-white/10">
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>{connection.type}</span>
                <button className="rounded-full border border-white/15 px-4 py-1.5 text-[11px] font-semibold text-white/70 transition hover:border-accent/50 hover:text-white">
                  Message
                </button>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-white">{connection.name}</h2>
              <p className="mt-2 text-sm text-white/70">{connection.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
