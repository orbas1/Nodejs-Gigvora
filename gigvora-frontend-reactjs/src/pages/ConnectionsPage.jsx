import PageHeader from '../components/PageHeader.jsx';
import UserAvatar from '../components/UserAvatar.jsx';

const connections = [
  {
    id: 1,
    name: 'Sasha Strategist',
    type: 'Follower',
    description: 'Growth strategist exploring collaborations with creative agencies.',
    seed: 'Sasha Strategist',
  },
  {
    id: 2,
    name: 'Noor Designer',
    type: 'Connection',
    description: 'Product designer from Launchpad Cohort 02 — co-led a fintech design sprint.',
    seed: 'Noor Designer',
  },
  {
    id: 3,
    name: 'Atlas Agency',
    type: 'Connection',
    description: 'Boutique agency specializing in brand storytelling and motion design.',
    seed: 'Atlas Agency',
  },
];

export default function ConnectionsPage() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Network"
          title="Followers &amp; connects"
          description="Nurture your relationships across the Gigvora network and unlock collaborations faster."
        />
        <div className="space-y-5">
          {connections.map((connection) => (
            <article
              key={connection.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft"
            >
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <UserAvatar name={connection.name} seed={connection.seed} size="xs" showGlow={false} />
                  {connection.type}
                </span>
                <button className="rounded-full border border-slate-200 px-4 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-accent hover:text-accent">
                  Message
                </button>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-slate-900">{connection.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{connection.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
