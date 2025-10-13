import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import useSession from '../hooks/useSession.js';
import useEngagementSignals from '../hooks/useEngagementSignals.js';

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
  const { session } = useSession();
  const engagementSignals = useEngagementSignals({ session, limit: 8 });
  const recommendedConnections = useMemo(
    () =>
      engagementSignals.connectionSuggestions.filter(
        (suggestion) => !connections.some((connection) => connection.name === suggestion.name),
      ),
    [engagementSignals.connectionSuggestions],
  );
  const groupSuggestions = engagementSignals.groupSuggestions;

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Network"
          title="Followers &amp; connects"
          description="Nurture your relationships across the Gigvora network and unlock collaborations faster."
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,2fr),minmax(240px,1fr)]">
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
          <aside className="space-y-6">
            {recommendedConnections.length ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <p className="text-sm font-semibold text-slate-900">People you should connect with</p>
                <p className="mt-1 text-xs text-slate-500">
                  Matches are based on shared interests and mutual collaborators.
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  {recommendedConnections.slice(0, 4).map((person) => (
                    <li key={person.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={person.name} seed={person.name} size="xs" showGlow={false} />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{person.name}</p>
                          <p className="text-xs text-slate-500">{person.headline}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{person.reason}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                        <span>{person.location}</span>
                        <span>{person.mutualConnections} mutual</span>
                      </div>
                      <button className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent/40 px-4 py-2 text-xs font-semibold text-accent transition hover:border-accent hover:bg-accentSoft">
                        Connect
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {groupSuggestions.length ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <p className="text-sm font-semibold text-slate-900">Groups to join</p>
                <p className="mt-1 text-xs text-slate-500">
                  Grow relationships faster by joining aligned discussion circles.
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  {groupSuggestions.slice(0, 3).map((group) => (
                    <li key={group.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{group.description}</p>
                      <p className="mt-2 text-xs text-slate-400">{group.members} members · {group.focus.slice(0, 2).join(' • ')}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 text-right text-xs text-accent">
                  <Link to="/groups" className="font-semibold hover:text-accentDark">
                    View all groups
                  </Link>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}
