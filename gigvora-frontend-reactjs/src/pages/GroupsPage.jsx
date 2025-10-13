import { useDeferredValue, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import useSession from '../hooks/useSession.js';
import useEngagementSignals from '../hooks/useEngagementSignals.js';
import { useGroupDirectory } from '../hooks/useGroups.js';
import { joinGroup, leaveGroup } from '../services/groups.js';
import { resolveActorId } from '../utils/session.js';
import { classNames } from '../utils/classNames.js';

const COMMUNITY_MEMBERSHIPS = ['user', 'freelancer', 'agency', 'company', 'mentor', 'headhunter'];

const FOCUS_SEGMENTS = [
  { id: 'all', label: 'All communities' },
  { id: 'future of work', label: 'Future of work' },
  { id: 'experience launchpad', label: 'Launchpad alumni' },
  { id: 'sustainability', label: 'Impact & volunteering' },
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

function formatNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return value ?? '—';
  }
  if (numeric >= 1000) {
    return `${(numeric / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return numeric.toString();
}

function getErrorMessage(error) {
  if (!error) {
    return null;
  }
  if (error.body?.message) {
    return error.body.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'We could not process that request. Please try again.';
}

function GroupCard({ group, onJoin, onLeave, pendingSlug }) {
  const isMember = group.membership?.status === 'member';
  const joinPolicy = group.joinPolicy;
  const primaryTopic = group.focusAreas?.[0] ?? 'Community';
  const upcomingEvent = group.upcomingEvents?.[0] ?? null;
  const accentColor = group.accentColor ?? '#2563EB';

  return (
    <article
      className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft"
      style={{ boxShadow: '0 24px 45px -35px rgba(37, 99, 235, 0.35)' }}
    >
      <div
        className="absolute inset-0 opacity-0 transition group-hover:opacity-100"
        aria-hidden="true"
        style={{
          background: `linear-gradient(135deg, ${accentColor}0F 0%, ${accentColor}1A 35%, rgba(255,255,255,0) 100%)`,
        }}
      />
      <div className="relative">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-600">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accentColor }} />
            {primaryTopic}
          </span>
          <span>{formatNumber(group.stats?.memberCount)} members</span>
        </div>
        <h2 className="mt-4 text-xl font-semibold text-slate-900">{group.name}</h2>
        <p className="mt-2 text-sm text-slate-600">{group.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(group.focusAreas ?? []).map((area) => (
            <span
              key={area}
              className="inline-flex items-center rounded-full bg-slate-100/80 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              {area}
            </span>
          ))}
        </div>
        <div className="mt-5 grid gap-4 text-xs text-slate-600 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
            <p className="font-semibold text-slate-700">Weekly active</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatNumber(group.stats?.weeklyActiveMembers)}
            </p>
            <p className="mt-1 text-[0.7rem] uppercase tracking-wide text-slate-500">Members collaborating</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
            <p className="font-semibold text-slate-700">Signal strength</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 capitalize">
              {group.insights?.signalStrength ?? 'steady'}
            </p>
            <p className="mt-1 text-[0.7rem] uppercase tracking-wide text-slate-500">Live discussion energy</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
            <p className="font-semibold text-slate-700">Opportunities</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatNumber(group.stats?.opportunitiesSharedThisWeek)}
            </p>
            <p className="mt-1 text-[0.7rem] uppercase tracking-wide text-slate-500">Shared this week</p>
          </div>
        </div>
        {upcomingEvent ? (
          <div className="mt-5 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next live session</p>
            <div className="mt-2 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">{upcomingEvent.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  <CalendarIcon className="mr-1 inline h-3.5 w-3.5 text-slate-400" />
                  {new Date(upcomingEvent.startAt).toLocaleString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {upcomingEvent.host?.name ? ` · ${upcomingEvent.host.name}` : ''}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
                {upcomingEvent.format ?? 'Session'}
              </span>
            </div>
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          {isMember ? (
            <>
              <Link
                to={`/groups/${group.slug}`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Open workspace
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => onLeave(group)}
                disabled={pendingSlug === group.slug}
                className={classNames(
                  'inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold transition',
                  pendingSlug === group.slug
                    ? 'border-slate-200 bg-slate-100 text-slate-400'
                    : 'border-slate-200 text-slate-600 hover:border-rose-200 hover:text-rose-600',
                )}
              >
                Leave group
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onJoin(group)}
              disabled={pendingSlug === group.slug || joinPolicy === 'invite_only'}
              className={classNames(
                'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white transition',
                pendingSlug === group.slug
                  ? 'bg-slate-300'
                  : joinPolicy === 'invite_only'
                  ? 'bg-slate-400'
                  : 'bg-accent hover:bg-accentDark',
              )}
              style={joinPolicy === 'invite_only' ? {} : { backgroundColor: accentColor }}
            >
              {joinPolicy === 'invite_only' ? 'Invite only' : pendingSlug === group.slug ? 'Joining…' : 'Join community'}
            </button>
          )}
          <Link
            to={`/groups/${group.slug}`}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Learn more
          </Link>
        </div>
      </div>
    </article>
  );
}

function GroupCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6">
      <div className="h-4 w-24 rounded bg-slate-200" />
      <div className="mt-4 h-6 w-2/3 rounded bg-slate-200" />
      <div className="mt-3 h-4 w-full rounded bg-slate-200" />
      <div className="mt-2 h-4 w-3/4 rounded bg-slate-200" />
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="h-20 rounded-2xl bg-slate-100" />
        <div className="h-20 rounded-2xl bg-slate-100" />
        <div className="h-20 rounded-2xl bg-slate-100" />
      </div>
      <div className="mt-6 h-10 w-40 rounded-full bg-slate-200" />
    </div>
  );
}

export default function GroupsPage() {
  const [search, setSearch] = useState('');
  const [focus, setFocus] = useState('all');
  const deferredSearch = useDeferredValue(search);
  const { session, isAuthenticated } = useSession();
  const actorId = resolveActorId(session);
  const navigate = useNavigate();
  const location = useLocation();
  const { groupSuggestions } = useEngagementSignals({ session, limit: 12 });

  const { data, loading, error, fromCache, lastUpdated, refresh } = useGroupDirectory({
    query: deferredSearch,
    focus: focus === 'all' ? undefined : focus,
    includeEmpty: false,
    enabled: true,
  });

  const groups = data?.items ?? [];
  const featuredSlugs = data?.metadata?.featured ?? [];
  const [pendingSlug, setPendingSlug] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const joinedGroups = useMemo(
    () => groups.filter((group) => group.membership?.status === 'member'),
    [groups],
  );

  const spotlightGroup = useMemo(() => {
    if (!groups.length) {
      return null;
    }
    for (const slug of featuredSlugs) {
      const match = groups.find((group) => group.slug === slug);
      if (match) {
        return match;
      }
    }
    return groups[0];
  }, [featuredSlugs, groups]);

  const recommendedGroups = useMemo(() => {
    if (!Array.isArray(groupSuggestions) || !groupSuggestions.length) {
      return [];
    }
    const lookup = new Map(groups.map((group) => [group.name.toLowerCase(), group]));
    return groupSuggestions
      .map((suggestion) => lookup.get((suggestion.name ?? '').toLowerCase()))
      .filter(Boolean)
      .slice(0, 3);
  }, [groupSuggestions, groups]);

  const handleJoin = async (group) => {
    if (!isAuthenticated || !actorId) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setPendingSlug(group.slug);
    try {
      await joinGroup(group.slug, { actorId });
      await refresh({ force: true });
      setFeedback({
        type: 'success',
        message: `You are now a member of ${group.name}.` ,
      });
    } catch (err) {
      setFeedback({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setPendingSlug(null);
    }
  };

  const handleLeave = async (group) => {
    if (!isAuthenticated || !actorId) {
      return;
    }
    setPendingSlug(group.slug);
    try {
      await leaveGroup(group.slug, { actorId });
      await refresh({ force: true });
      setFeedback({
        type: 'neutral',
        message: `You have left ${group.name}.`,
      });
    } catch (err) {
      setFeedback({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setPendingSlug(null);
    }
  };

  const showAccessWarning = useMemo(() => {
    if (!isAuthenticated) {
      return false;
    }
    if (!Array.isArray(session?.memberships)) {
      return true;
    }
    return !session.memberships.some((membership) => COMMUNITY_MEMBERSHIPS.includes(membership));
  }, [isAuthenticated, session?.memberships]);
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
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-accent/15 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-emerald-200/20 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <PageHeader
          eyebrow="Community"
          title="Communities tailored to your craft"
          description="Join curated circles that accelerate collaboration, learning, and opportunity flow across the Gigvora network."
        />
        {feedback ? (
          <div
            className={classNames(
              'mt-6 rounded-3xl border px-6 py-4 text-sm shadow-soft',
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : feedback.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-600'
                : 'border-slate-200 bg-slate-50 text-slate-700',
            )}
          >
            {feedback.message}
          </div>
        ) : null}
        {showAccessWarning ? (
          <div className="mt-6 flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-700">
            <ShieldCheckIcon className="mt-1 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Community access requires a verified membership.</p>
              <p className="mt-1 text-xs text-amber-600">
                Switch to a freelancer, agency, or company workspace to unlock groups, or contact support to enable community features for your account.
              </p>
            </div>
          </div>
        ) : null}
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,2.3fr),minmax(260px,1fr)]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative flex-1">
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search groups, topics, or hosts"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20"
                  />
                  {fromCache ? (
                    <span className="absolute right-3 top-2.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-amber-600">
                      Cached
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {FOCUS_SEGMENTS.map((segment) => (
                    <button
                      key={segment.id}
                      type="button"
                      onClick={() => setFocus(segment.id)}
                      className={classNames(
                        'rounded-full border px-4 py-2 text-xs font-semibold transition',
                        focus === segment.id
                          ? 'border-accent bg-accent text-white'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900',
                      )}
                    >
                      {segment.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
                {getErrorMessage(error)}
              </div>
            ) : null}

            {loading && groups.length === 0 ? (
              <div className="space-y-6">
                <GroupCardSkeleton />
                <GroupCardSkeleton />
              </div>
            ) : null}

            {!loading && groups.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-soft">
                <UserGroupIcon className="mx-auto h-10 w-10 text-slate-400" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">No groups matched your filters</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Adjust your search or filter to discover other communities active on Gigvora.
                </p>
              </div>
            ) : null}

            <div className="space-y-6">
              {groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onJoin={handleJoin}
                  onLeave={handleLeave}
                  pendingSlug={pendingSlug}
                />
              ))}
            </div>
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
            {spotlightGroup ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Featured community</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{spotlightGroup.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{spotlightGroup.summary}</p>
                <div className="mt-4 space-y-2 text-xs text-slate-500">
                  {(spotlightGroup.insights?.trendingTopics ?? []).slice(0, 3).map((topic) => (
                    <div key={topic} className="flex items-start gap-2">
                      <SparklesIcon className="mt-1 h-4 w-4 flex-shrink-0 text-accent" />
                      <span>{topic}</span>
                    </div>
                  ))}
                </div>
                <Link
                  to={`/groups/${spotlightGroup.slug}`}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Explore {spotlightGroup.name}
                </Link>
              </div>
            ) : null}

            {joinedGroups.length ? (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Your memberships</p>
                <ul className="mt-3 space-y-3 text-sm text-emerald-700">
                  {joinedGroups.map((group) => (
                    <li key={group.id} className="flex items-start gap-3">
                      <CheckCircleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                      <div>
                        <p className="font-semibold text-emerald-800">{group.name}</p>
                        <p className="text-xs text-emerald-600">{group.focusAreas?.slice(0, 2).join(' • ')}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {recommendedGroups.length ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recommended for you</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {recommendedGroups.map((group) => (
                    <li key={group.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{group.summary}</p>
                      <Link
                        to={`/groups/${group.slug}`}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accentDark"
                      >
                        View community
                        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {lastUpdated ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-xs text-slate-500">
                Last refreshed {new Date(lastUpdated).toLocaleTimeString()} ·
                <button
                  type="button"
                  className="ml-2 font-semibold text-accent hover:text-accentDark"
                  onClick={() => refresh({ force: true })}
                >
                  Refresh now
                </button>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}
