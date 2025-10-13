import { useMemo } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import useSession from '../hooks/useSession.js';
import useEngagementSignals from '../hooks/useEngagementSignals.js';

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
  const { session } = useSession();
  const engagementSignals = useEngagementSignals({ session, limit: 8 });
  const recommendedGroups = useMemo(() => engagementSignals.groupSuggestions.slice(0, 3), [engagementSignals.groupSuggestions]);
  const suggestedConnections = engagementSignals.connectionSuggestions.slice(0, 3);
  const interestSignals = engagementSignals.interests;

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Groups"
          title="Communities tailored to your craft"
          description="Join cohorts, industry circles, and passion communities to collaborate, learn, and amplify your work."
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,2fr),minmax(240px,1fr)]">
          <div className="space-y-6">
            {recommendedGroups.length ? (
              <div className="rounded-3xl border border-accent/30 bg-accentSoft p-6 shadow-soft">
                <p className="text-sm font-semibold text-accentDark">Recommended for you</p>
                <p className="mt-1 text-xs text-slate-600">Insights based on your active collaborations and interests.</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-700">
                  {recommendedGroups.map((group) => (
                    <li key={`recommended-${group.id}`} className="rounded-2xl border border-accent/40 bg-white/70 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{group.description}</p>
                      <p className="mt-2 text-xs text-slate-400">{group.members} members · {group.focus.slice(0, 2).join(' • ')}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {groups.map((group) => (
              <article
                key={group.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{group.members} members</span>
                </div>
                <h2 className="mt-3 text-xl font-semibold text-slate-900">{group.name}</h2>
                <p className="mt-2 text-sm text-slate-600">{group.description}</p>
                <button className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent">
                  Request to join <span aria-hidden="true">→</span>
                </button>
              </article>
            ))}
          </div>
          <aside className="space-y-6">
            {interestSignals.length ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <p className="text-sm font-semibold text-slate-900">Your interest signals</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {interestSignals.slice(0, 10).map((interest) => (
                    <span key={interest} className="inline-flex rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {suggestedConnections.length ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <p className="text-sm font-semibold text-slate-900">Members to meet</p>
                <p className="mt-1 text-xs text-slate-500">Start conversations with people active in your target groups.</p>
                <ul className="mt-4 space-y-3 text-sm">
                  {suggestedConnections.map((connection) => (
                    <li key={connection.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={connection.name} seed={connection.name} size="xs" showGlow={false} />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{connection.name}</p>
                          <p className="text-xs text-slate-500">{connection.headline}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{connection.reason}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}
