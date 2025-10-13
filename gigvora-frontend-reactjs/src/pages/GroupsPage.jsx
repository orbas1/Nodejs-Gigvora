import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import useSession from '../hooks/useSession.js';
import useEngagementSignals from '../hooks/useEngagementSignals.js';
import groupsService from '../services/groups.js';

const fallbackGroups = [
  {
    id: 1,
    name: 'Future of Work Collective',
    members: 2140,
    description: 'Discussions on marketplaces, talent collaboration models, and community building.',
    memberPolicy: 'request',
  },
  {
    id: 2,
    name: 'Gigvora Launchpad Alumni',
    members: 860,
    description: 'Connect with fellows, mentors, and companies participating in the Experience Launchpad.',
    memberPolicy: 'invite',
  },
];

export default function GroupsPage() {
  const { session } = useSession();
  const engagementSignals = useEngagementSignals({ session, limit: 8 });
  const [catalog, setCatalog] = useState({ loading: true, error: null, groups: [], metadata: {} });
  const [joinState, setJoinState] = useState({});

  useEffect(() => {
    let cancelled = false;
    setCatalog((previous) => ({ ...previous, loading: true, error: null }));

    groupsService
      .fetchDiscoverGroups({ limit: 12 })
      .then((response) => {
        if (cancelled) return;
        const groups = Array.isArray(response?.data) ? response.data : [];
        setCatalog({
          loading: false,
          error: null,
          groups,
          metadata: response?.metadata ?? {},
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setCatalog({
          loading: false,
          error: error?.message ?? 'Unable to load groups at the moment.',
          groups: [],
          metadata: {},
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const catalogGroups = useMemo(() => {
    if (catalog.groups.length) {
      return catalog.groups;
    }
    return fallbackGroups;
  }, [catalog.groups]);

  const recommendedGroups = useMemo(() => {
    if (catalog.groups.length) {
      return catalog.groups.slice(0, 3);
    }
    return engagementSignals.groupSuggestions.slice(0, 3);
  }, [catalog.groups, engagementSignals.groupSuggestions]);

  const suggestedConnections = engagementSignals.connectionSuggestions.slice(0, 3);
  const interestSignals = engagementSignals.interests;

  const handleJoinRequest = useCallback(async (group) => {
    if (!group?.id) {
      return;
    }
    setJoinState((previous) => ({
      ...previous,
      [group.id]: { status: 'loading' },
    }));
    try {
      await groupsService.requestMembership(group.id);
      setJoinState((previous) => ({
        ...previous,
        [group.id]: { status: 'success' },
      }));
    } catch (error) {
      setJoinState((previous) => ({
        ...previous,
        [group.id]: {
          status: 'error',
          message: error?.message ?? 'We could not process your request. Please try again shortly.',
        },
      }));
    }
  }, []);

  const memberCountLabel = (group) => {
    const metrics = group?.metrics ?? {};
    const members = metrics.activeMembers ?? metrics.totalMembers ?? group?.members ?? 0;
    if (!Number.isFinite(members)) {
      return 'Members';
    }
    const formatter = new Intl.NumberFormat('en-US');
    return `${formatter.format(members)} member${members === 1 ? '' : 's'}`;
  };

  const accessLabel = (group) => {
    const policy = group?.memberPolicy ?? group?.accessPolicy;
    if (policy === 'open') return 'Instant join';
    if (policy === 'invite') return 'Invite-only';
    if (policy === 'request') return 'Request to join';
    return 'Curated access';
  };

  const renderJoinFeedback = (groupId) => {
    const state = joinState[groupId];
    if (!state) return null;
    if (state.status === 'success') {
      return <p className="mt-2 text-xs font-semibold text-emerald-600">Request submitted. We\'ll let you know as soon as a moderator responds.</p>;
    }
    if (state.status === 'error') {
      return (
        <p className="mt-2 text-xs font-semibold text-red-600">
          {state.message ?? 'Something went wrong. Please try again later.'}
        </p>
      );
    }
    return null;
  };

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
            {catalog.loading ? (
              <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6">
                <div className="h-4 w-32 rounded-full bg-slate-200" />
                <div className="mt-4 space-y-3">
                  {[1, 2, 3].map((index) => (
                    <div key={index} className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                      <div className="h-4 w-1/3 rounded-full bg-slate-200" />
                      <div className="h-3 w-full rounded-full bg-slate-100" />
                      <div className="h-3 w-2/3 rounded-full bg-slate-100" />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {catalog.error ? (
              <div className="rounded-3xl border border-red-200 bg-red-50/80 p-6">
                <p className="text-sm font-semibold text-red-700">We couldn\'t reach the community catalogue</p>
                <p className="mt-2 text-xs text-red-600">{catalog.error}</p>
              </div>
            ) : null}
            {recommendedGroups.length ? (
              <div className="rounded-3xl border border-accent/30 bg-accentSoft/80 p-6 shadow-soft">
                <p className="text-sm font-semibold text-accentDark">Recommended for you</p>
                <p className="mt-1 text-xs text-slate-600">Signals across your collaborations and interests informed these picks.</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-700">
                  {recommendedGroups.map((group) => {
                    const highlights = Array.isArray(group?.metadata?.domain)
                      ? group.metadata.domain.slice(0, 3)
                      : [];
                    return (
                      <li key={`recommended-${group.id ?? group.name}`} className="rounded-2xl border border-accent/40 bg-white/80 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{group.description ?? 'A tightly curated space to accelerate momentum together.'}</p>
                        <p className="mt-2 text-xs text-slate-400">
                          {memberCountLabel(group)} · {highlights.length ? highlights.join(' • ') : accessLabel(group)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
            {catalogGroups.map((group) => (
              <article
                key={group.id ?? group.name}
                className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{memberCountLabel(group)}</span>
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-600">
                    {accessLabel(group)}
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-semibold text-slate-900">{group.name}</h2>
                <p className="mt-2 text-sm text-slate-600">{group.description ?? 'Discover strategies, share playbooks, and ship stronger outcomes together.'}</p>
                <button
                  type="button"
                  onClick={() => handleJoinRequest(group)}
                  disabled={joinState[group.id]?.status === 'loading' || joinState[group.id]?.status === 'success'}
                  className={`mt-5 inline-flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-semibold transition ${
                    joinState[group.id]?.status === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-600 hover:border-accent hover:text-accent'
                  } ${joinState[group.id]?.status === 'loading' ? 'cursor-wait opacity-70' : ''}`}
                >
                  {joinState[group.id]?.status === 'success'
                    ? 'Request sent'
                    : joinState[group.id]?.status === 'loading'
                      ? 'Submitting...'
                      : 'Request to join'}{' '}
                  <span aria-hidden="true">→</span>
                </button>
                {renderJoinFeedback(group.id)}
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
