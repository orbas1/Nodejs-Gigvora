import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Switch } from '@headlessui/react';
import {
  CalendarIcon,
  SparklesIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import useSession from '../hooks/useSession.js';
import { useGroupProfile } from '../hooks/useGroups.js';
import { joinGroup, leaveGroup, updateGroupMembership } from '../services/groups.js';
import { resolveActorId } from '../utils/session.js';
import { GigvoraAdBanner, GigvoraAdGrid } from '../components/marketing/GigvoraAds.jsx';
import { GIGVORA_GROUPS_ADS, GIGVORA_GROUPS_BANNER } from '../constants/marketing.js';
import { classNames } from '../utils/classNames.js';
import GroupLanding from '../components/groups/GroupLanding.jsx';
import GroupDiscussionBoard from '../components/groups/GroupDiscussionBoard.jsx';
import ResourceLibrary from '../components/groups/ResourceLibrary.jsx';
import {
  formatGroupDate,
  formatGroupPercent,
  formatGroupTimelineDate,
} from '../utils/groupFormatting.js';

export const formatPercent = formatGroupPercent;
export const formatDate = formatGroupDate;
export const formatTimelineDate = formatGroupTimelineDate;

function PreferenceToggle({ label, description, checked, onChange, disabled }) {
  return (
    <Switch.Group as="div" className="flex items-center justify-between gap-6 rounded-3xl border border-slate-200 bg-white/80 px-5 py-4">
      <div>
        <Switch.Label className="text-sm font-semibold text-slate-900">{label}</Switch.Label>
        <Switch.Description className="mt-1 text-xs text-slate-500">{description}</Switch.Description>
      </div>
      <Switch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={classNames(
          checked ? 'bg-accent' : 'bg-slate-200',
          'relative inline-flex h-7 w-14 items-center rounded-full transition',
          disabled ? 'opacity-50' : 'hover:brightness-105',
        )}
      >
        <span
          className={classNames(
            checked ? 'translate-x-7 bg-white' : 'translate-x-1 bg-white',
            'inline-block h-5 w-5 transform rounded-full shadow transition',
          )}
        />
      </Switch>
    </Switch.Group>
  );
}

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
  const legacyResources = (group?.resources ?? []).map((resource, index) => ({
    id: resource.id ?? `legacy-${index}`,
    ...resource,
  }));
  const guidelines = group?.guidelines ?? [];
  const events = group?.upcomingEvents ?? [];
  const timeline = group?.timeline ?? [];
  const discussionBoard = group?.discussionBoard ?? null;
  const resourceLibrary = group?.resourceLibrary ??
    (legacyResources.length
      ? {
          items: legacyResources,
          featured: legacyResources.slice(0, 2),
        }
      : null);
  const featuredResource = resourceLibrary?.featured?.[0] ?? resourceLibrary?.items?.[0] ?? null;
  const membershipBreakdown = group?.membershipBreakdown ?? [];

  const boardLoading = loading && !discussionBoard;

  const handleCreateThread = useCallback(() => {
    if (membership.status !== 'member') {
      setFeedback({ type: 'error', message: 'Join the community to start a discussion thread.' });
      return;
    }
    setFeedback({
      type: 'success',
      message: 'Thread composer is in beta. Moderators will reach out to enable posting access shortly.',
    });
  }, [membership.status]);

  const handleSelectThread = useCallback(
    (thread) => {
      if (thread?.url && typeof window !== 'undefined') {
        window.open(thread.url, '_blank', 'noopener,noreferrer');
        return;
      }
      setFeedback({
        type: 'neutral',
        message: thread?.title ? `${thread.title} preview coming soon.` : 'Thread preview coming soon.',
      });
    },
    [],
  );

  const handleOpenResource = useCallback((resource) => {
    if (resource?.url && typeof window !== 'undefined') {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
      return;
    }
    setFeedback({
      type: 'neutral',
      message: resource?.title ? `${resource.title} preview coming soon.` : 'Resource preview coming soon.',
    });
  }, []);

  const handleSaveResource = useCallback(
    (resource) => {
      if (membership.status !== 'member') {
        setFeedback({ type: 'error', message: 'Join the community to save resources for quick access.' });
        return;
      }
      setFeedback({
        type: 'success',
        message: resource?.title ? `${resource.title} saved to your library.` : 'Resource saved to your library.',
      });
    },
    [membership.status],
  );

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

  return (
    <section className="relative">
      <GroupLanding
        group={group}
        membership={membership}
        onJoin={handleJoin}
        onLeave={handleLeave}
        joining={pendingAction === 'join'}
        leaving={pendingAction === 'leave'}
        feedback={feedback}
        accentColor={accentColor}
        lastUpdated={lastUpdated}
        fromCache={fromCache}
        discussionStats={discussionBoard?.stats}
        featuredResource={featuredResource}
      />

      <div className="relative bg-slate-50 pb-24 pt-16">
        <div className="mx-auto max-w-6xl space-y-12 px-6">
          <GigvoraAdBanner {...GIGVORA_GROUPS_BANNER} />

          {membership.status === 'member' ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notification preferences</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <PreferenceToggle
                  label="Weekly digest"
                  description="Curated highlights delivered every Monday."
                  checked={preferences.digest}
                  onChange={(value) => updatePreference('digest', value)}
                  disabled={pendingAction?.startsWith('pref-')}
                />
                <PreferenceToggle
                  label="New thread alerts"
                  description="Immediate alerts when moderators open new debates."
                  checked={preferences.newThread}
                  onChange={(value) => updatePreference('newThread', value)}
                  disabled={pendingAction?.startsWith('pref-')}
                />
                <PreferenceToggle
                  label="Upcoming event reminders"
                  description="24h reminders for events you RSVP for."
                  checked={preferences.upcomingEvent}
                  onChange={(value) => updatePreference('upcomingEvent', value)}
                  disabled={pendingAction?.startsWith('pref-')}
                />
              </div>
            </div>
          ) : null}

          <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
            <GroupDiscussionBoard
              board={discussionBoard}
              loading={boardLoading}
              onRefresh={() => refresh({ force: true })}
              onCreateThread={handleCreateThread}
              onSelectThread={handleSelectThread}
            />

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <SparklesIcon className="h-4 w-4" /> Live community signals
                  </div>
                  {Number.isFinite(group.stats?.opportunitiesSharedThisWeek) ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {group.stats.opportunitiesSharedThisWeek} intros unlocked this week
                    </span>
                  ) : null}
                </div>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {(group.insights?.trendingTopics ?? []).map((topic) => (
                    <li key={topic} className="rounded-2xl border border-slate-200 px-4 py-3">
                      {topic}
                    </li>
                  ))}
                  {(group.insights?.trendingTopics ?? []).length === 0 ? (
                    <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500">
                      Signals loading – check back after members share updates.
                    </li>
                  ) : null}
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <CalendarIcon className="h-4 w-4" /> Upcoming sessions
                </div>
                {events.length ? (
                  <ul className="mt-4 space-y-4 text-sm text-slate-600">
                    {events.map((event) => (
                      <li key={event.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatGroupDate(event.startAt)} · {event.format ?? 'Session'}
                        </p>
                        {event.host?.name ? (
                          <p className="mt-1 text-xs text-slate-400">Hosted by {event.host.name}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    Programming calendar is loading. Check back soon for new sessions.
                  </p>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <ShieldCheckIcon className="h-4 w-4" /> Operating principles
                </div>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {guidelines.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                      <span>{line}</span>
                    </li>
                  ))}
                  {guidelines.length === 0 ? (
                    <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500">
                      Community guidelines are being refreshed by moderators.
                    </li>
                  ) : null}
                </ul>
              </div>
            </div>
          </div>

          {resourceLibrary ? (
            <ResourceLibrary
              library={resourceLibrary}
              onOpenResource={handleOpenResource}
              onSaveResource={handleSaveResource}
            />
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {leadership.length ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Leadership circle</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {leadership.map((leader) => (
                    <li key={leader.name} className="rounded-2xl border border-slate-200 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{leader.name}</p>
                      <p className="text-xs text-slate-500">{leader.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{leader.role}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {timeline.length ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Community timeline</p>
                <ul className="mt-4 space-y-3">
                  {timeline.map((item) => (
                    <li key={item.label} className="flex gap-4 text-sm text-slate-600">
                      <span className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {formatGroupTimelineDate(item.occursAt)}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {membershipBreakdown.length ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Member roles</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {membershipBreakdown.map((entry) => (
                    <li key={entry.role} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                      <span className="font-semibold text-slate-900">{entry.role}</span>
                      <span className="text-xs text-slate-500">{entry.count} members</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <GigvoraAdGrid ads={GIGVORA_GROUPS_ADS} />
        </div>
      </div>
    </section>
  );
}
