import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Switch } from '@headlessui/react';
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  SparklesIcon,
  BookmarkIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import useSession from '../hooks/useSession.js';
import { useGroupProfile } from '../hooks/useGroups.js';
import { joinGroup, leaveGroup, updateGroupMembership } from '../services/groups.js';
import { resolveActorId } from '../utils/session.js';
import { GigvoraAdBanner, GigvoraAdGrid } from '../components/marketing/GigvoraAds.jsx';
import { GIGVORA_GROUPS_ADS, GIGVORA_GROUPS_BANNER } from '../constants/marketing.js';
import { classNames } from '../utils/classNames.js';

function formatPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  return `${Math.round(numeric * 100)}%`;
}

function formatDate(value) {
  if (!value) {
    return 'Date TBC';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTimelineDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return value ?? 'Upcoming';
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

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

function ResourceCard({ resource }) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white/80 p-4 text-left text-sm text-slate-600 transition hover:border-accent hover:text-slate-900"
    >
      <BookmarkIcon className="h-4 w-4 text-accent" />
      <p className="text-sm font-semibold text-slate-900">{resource.title}</p>
      <p className="text-xs uppercase tracking-wide text-slate-500">{resource.type}</p>
    </a>
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
  const resources = group?.resources ?? [];
  const guidelines = group?.guidelines ?? [];
  const events = group?.upcomingEvents ?? [];
  const timeline = group?.timeline ?? [];

  const showJoinButton = membership.status !== 'member';

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

  const accentGradient = `linear-gradient(135deg, ${accentColor} 0%, rgba(37,99,235,0.65) 45%, rgba(15,23,42,0.85) 100%)`;

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-slate-900" aria-hidden="true" />
      <div
        className="absolute inset-0 opacity-80"
        aria-hidden="true"
        style={{ background: accentGradient }}
      />
      <div className="relative">
        <div className="mx-auto max-w-5xl px-6 py-16 text-white">
          <div className="flex items-center gap-4 text-sm text-white/70">
            <Link to="/groups" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 transition hover:border-white/40 hover:text-white">
              <ArrowLeftIcon className="h-4 w-4" /> All groups
            </Link>
            {fromCache ? <span className="rounded-full border border-white/30 px-3 py-1 text-xs">Cached</span> : null}
            {lastUpdated ? (
              <span className="text-xs">Updated {new Date(lastUpdated).toLocaleTimeString()}</span>
            ) : null}
          </div>
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,3fr),minmax(240px,1fr)] lg:items-start">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80">
                {group.focusAreas?.join(' • ') || 'Community'}
              </p>
              <h1 className="mt-4 text-3xl font-semibold">{group.name}</h1>
              <p className="mt-4 max-w-2xl text-sm text-white/80">{group.summary}</p>
              <div className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
                <div className="rounded-3xl border border-white/20 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-white/70">Members</p>
                  <p className="mt-1 text-2xl font-semibold">{group.stats?.memberCount ?? '—'}</p>
                </div>
                <div className="rounded-3xl border border-white/20 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-white/70">Weekly active</p>
                  <p className="mt-1 text-2xl font-semibold">{group.stats?.weeklyActiveMembers ?? '—'}</p>
                </div>
                <div className="rounded-3xl border border-white/20 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-white/70">Retention</p>
                  <p className="mt-1 text-2xl font-semibold">{formatPercent(group.stats?.retentionRate)}</p>
                </div>
              </div>
              {feedback ? (
                <div
                  className={classNames(
                    'mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold',
                    feedback.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-100'
                      : feedback.type === 'error'
                      ? 'bg-rose-500/20 text-rose-100'
                      : 'bg-white/20 text-white',
                  )}
                >
                  {feedback.message}
                </div>
              ) : null}
            </div>
            <div className="flex flex-col gap-3">
              {showJoinButton ? (
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={pendingAction === 'join'}
                  className={classNames(
                    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-slate-900 transition',
                    pendingAction === 'join' ? 'bg-white/60' : 'bg-white hover:bg-slate-100',
                  )}
                >
                  {group.joinPolicy === 'invite_only' ? 'Request invite' : pendingAction === 'join' ? 'Joining…' : 'Join community'}
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleLeave}
                    disabled={pendingAction === 'leave'}
                    className={classNames(
                      'inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/70',
                      pendingAction === 'leave' ? 'opacity-50' : '',
                    )}
                  >
                    Leave group
                  </button>
                  <Link
                    to="/groups"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
                  >
                    Explore other groups
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </Link>
                </div>
              )}
              <div className="rounded-3xl border border-white/20 bg-white/10 p-4 text-xs text-white/80">
                <p className="font-semibold uppercase tracking-wide">Access policy</p>
                <p className="mt-2">Join policy: {group.joinPolicy === 'invite_only' ? 'Invite only' : 'Community approval'}</p>
                <p className="mt-1">Eligible roles: {group.allowedUserTypes?.join(', ') ?? 'Gigvora members'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative bg-slate-50 pb-24 pt-16">
        <div className="mx-auto max-w-5xl space-y-12 px-6">
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

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.7fr),minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <SparklesIcon className="h-4 w-4" /> Live signals
                </div>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {(group.insights?.trendingTopics ?? []).map((topic) => (
                    <li key={topic} className="rounded-2xl border border-slate-200 px-4 py-3">{topic}</li>
                  ))}
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
                        <p className="mt-1 text-xs text-slate-500">{formatDate(event.startAt)} · {event.format ?? 'Session'}</p>
                        {event.host?.name ? (
                          <p className="mt-1 text-xs text-slate-400">Hosted by {event.host.name}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">Programming calendar is loading. Check back soon for new sessions.</p>
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
                </ul>
              </div>
            </div>

            <div className="space-y-6">
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

              {resources.length ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resource library</p>
                  <div className="mt-4 grid gap-3">
                    {resources.map((resource) => (
                      <ResourceCard key={resource.id ?? resource.title} resource={resource} />
                    ))}
                  </div>
                </div>
              ) : null}

              {timeline.length ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
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
            </div>
          </div>

          <GigvoraAdGrid ads={GIGVORA_GROUPS_ADS} />
        </div>
      </div>
    </section>
  );
}
