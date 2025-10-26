import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import useSession from '../hooks/useSession.js';
import { useGroupProfile } from '../hooks/useGroups.js';
import { joinGroup, leaveGroup, updateGroupMembership } from '../services/groups.js';
import { resolveActorId } from '../utils/session.js';
import { GigvoraAdBanner, GigvoraAdGrid } from '../components/marketing/GigvoraAds.jsx';
import { GIGVORA_GROUPS_ADS, GIGVORA_GROUPS_BANNER } from '../constants/marketing.js';
import { classNames } from '../utils/classNames.js';
import GroupLanding from '../components/community/groups/GroupLanding.jsx';
import GroupDiscussionBoard from '../components/community/groups/GroupDiscussionBoard.jsx';
import ResourceLibrary from '../components/community/groups/ResourceLibrary.jsx';
import { formatNumber, formatPercent, formatTimelineDate } from '../utils/groupsFormatting.js';

export { formatPercent, formatDate, formatTimelineDate } from '../utils/groupsFormatting.js';

export default function GroupProfilePage() {
  const { groupId } = useParams();
  const { session, isAuthenticated } = useSession();
  const actorId = resolveActorId(session);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: group, loading, error, refresh, fromCache, lastUpdated } = useGroupProfile(groupId, { enabled: true });
  const [pendingAction, setPendingAction] = useState(null);
  const [preferences, setPreferences] = useState({ digest: true, newThread: true, upcomingEvent: true });
  const [feedback, setFeedback] = useState(null);

  const membership = group?.membership ?? { status: 'not_member' };
  const accentColor = group?.accentColor ?? '#2563EB';

  useEffect(() => {
    const notifications = group?.membership?.preferences?.notifications;
    if (notifications) {
      setPreferences({
        digest: Boolean(notifications.digest),
        newThread: Boolean(notifications.newThread),
        upcomingEvent: Boolean(notifications.upcomingEvent),
      });
    }
  }, [group?.membership?.preferences?.notifications]);

  const handleJoin = useCallback(async () => {
    if (!group) {
      return;
    }
    if (!isAuthenticated || !actorId) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setPendingAction('join');
    try {
      await joinGroup(group.slug ?? group.id, { actorId });
      await refresh({ force: true });
      setFeedback({ type: 'success', message: `Welcome to ${group.name}!` });
    } catch (err) {
      setFeedback({ type: 'error', message: err?.body?.message ?? err?.message ?? 'Unable to join the group.' });
    } finally {
      setPendingAction(null);
    }
  }, [group, actorId, isAuthenticated, navigate, location.pathname, refresh]);

  const handleLeave = useCallback(async () => {
    if (!group || !actorId) {
      return;
    }
    setPendingAction('leave');
    try {
      await leaveGroup(group.slug ?? group.id, { actorId });
      await refresh({ force: true });
      setFeedback({ type: 'neutral', message: `You have left ${group.name}.` });
    } catch (err) {
      setFeedback({ type: 'error', message: err?.body?.message ?? err?.message ?? 'Unable to leave the group.' });
    } finally {
      setPendingAction(null);
    }
  }, [group, actorId, refresh]);

  const updatePreference = async (key, value) => {
    if (!group || !actorId) {
      return;
    }
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    setPendingAction(`pref-${key}`);
    try {
      await updateGroupMembership(group.slug ?? group.id, {
        actorId,
        notifications: next,
      });
      await refresh({ force: true });
    } catch (err) {
      setPreferences((prev) => ({ ...prev, [key]: !value }));
      setFeedback({ type: 'error', message: err?.body?.message ?? err?.message ?? 'Unable to update preferences.' });
    } finally {
      setPendingAction(null);
    }
  };

  const leadership = group?.leadership ?? [];
  const resources = group?.resources ?? [];
  const guidelines = group?.guidelines ?? [];
  const events = group?.upcomingEvents ?? [];
  const timeline = group?.timeline ?? [];

  const board = useMemo(() => {
    const source = group?.discussionBoard ?? {};
    const pinned = source.pinned ?? group?.pinnedPosts ?? [];
    const threads = source.threads ?? group?.threads ?? group?.recentThreads ?? [];
    const tags = source.tags ?? group?.topics ?? group?.focusAreas ?? [];
    const analytics = source.analytics ?? group?.insights?.board ?? {};
    return {
      pinned,
      threads,
      tags,
      moderators: source.moderators ?? leadership,
      trending: source.trending ?? group?.insights?.trendingThreads ?? [],
      stats: {
        activeToday: analytics.activeToday ?? group?.stats?.activeThreadsToday ?? 0,
        unresolved: analytics.unresolved ?? group?.stats?.unresolvedThreads ?? 0,
        contributorsThisWeek: analytics.contributorsThisWeek ?? group?.stats?.contributorsThisWeek ?? 0,
      },
    };
  }, [group, leadership]);

  const resourceLibrary = useMemo(() => {
    const library = group?.resourceLibrary ?? {};
    const items = library.items ?? resources;
    const categories = library.categories ?? items.map((item) => item.category).filter(Boolean);
    const collections = library.collections ?? group?.collections ?? [];
    return {
      items,
      categories,
      collections,
      featured: library.featured ?? items.filter((item) => item.featured),
      analytics: library.analytics ?? group?.insights?.resources ?? {},
    };
  }, [group, resources]);

  if (loading && !group) {
    return (
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
        <div className="mx-auto max-w-5xl px-6">
          <div className="animate-pulse space-y-6">
            <div className="h-12 w-1/2 rounded-3xl bg-slate-200" />
            <div className="h-6 w-2/3 rounded-3xl bg-slate-200" />
            <div className="h-64 rounded-4xl bg-slate-100" />
          </div>
        </div>
      </section>
    );
  }

  if (error && !group) {
    return (
      <section className="py-24">
        <div className="mx-auto max-w-xl rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center text-rose-600">
          {error?.body?.message ?? error?.message ?? 'We were unable to load this group.'}
        </div>
      </section>
    );
  }

  if (!group) {
    return null;
  }

  const preferencePendingKey = pendingAction?.startsWith('pref-') ? pendingAction.replace('pref-', '') : null;

  return (
    <section className="bg-slate-50">
      <GroupLanding
        group={group}
        membership={membership}
        preferences={preferences}
        onUpdatePreference={updatePreference}
        onJoin={handleJoin}
        onLeave={handleLeave}
        pendingAction={pendingAction}
        feedback={feedback}
        fromCache={fromCache}
        lastUpdated={lastUpdated}
        loading={loading}
        accentColor={accentColor}
        events={events}
        pinnedPosts={board.pinned}
        featuredResources={resourceLibrary.items.slice(0, 3)}
        analytics={board.stats}
        formatNumber={formatNumber}
        formatPercent={formatPercent}
        preferencePendingKey={preferencePendingKey}
        onRefresh={() => refresh({ force: true })}
      />

      <div className="relative pb-24 pt-16">
        <div className="mx-auto max-w-5xl space-y-12 px-6">
          <GigvoraAdBanner {...GIGVORA_GROUPS_BANNER} />

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.8fr),minmax(280px,1fr)]">
            <GroupDiscussionBoard
              board={board}
              membership={membership}
              onRefresh={() => refresh({ force: true })}
              loading={loading}
            />

            <aside className="space-y-6">
              {guidelines.length ? (
                <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Operating principles</p>
                  <ul className="mt-4 space-y-3 text-sm text-slate-600">
                    {guidelines.map((line) => (
                      <li key={line} className="flex gap-2">
                        <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {leadership.length ? (
                <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Leadership circle</p>
                  <ul className="mt-4 space-y-3 text-sm text-slate-600">
                    {leadership.map((leader) => (
                      <li key={leader.name} className="rounded-2xl border border-slate-200/70 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{leader.name}</p>
                        <p className="text-xs text-slate-500">{leader.title}</p>
                        <p className="mt-1 text-xs text-slate-400">{leader.role}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {timeline.length ? (
                <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Community timeline</p>
                  <ul className="mt-4 space-y-3">
                    {timeline.map((event) => (
                      <li key={event.label} className="flex gap-4 text-sm text-slate-600">
                        <span className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          {formatTimelineDate(event.occursAt)}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">{event.label}</p>
                          <p className="text-xs text-slate-500">{event.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </aside>
          </div>

          <ResourceLibrary
            library={resourceLibrary}
            formatNumber={formatNumber}
          />

          <GigvoraAdGrid ads={GIGVORA_GROUPS_ADS} />
        </div>
      </div>
    </section>
  );
}
