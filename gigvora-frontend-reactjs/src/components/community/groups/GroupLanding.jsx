import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Switch } from '@headlessui/react';
import {
  ArrowTopRightOnSquareIcon,
  BellAlertIcon,
  CalendarIcon,
  ChartBarIcon,
  MegaphoneIcon,
  PlayCircleIcon,
  ShareIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import UserAvatar from '../../UserAvatar.jsx';
import { classNames } from '../../../utils/classNames.js';
import { formatRelativeTime, formatDate } from '../../../utils/groupsFormatting.js';

function PreferenceToggle({ label, description, value, onChange, loading }) {
  return (
    <Switch.Group as="div" className="flex items-center justify-between gap-6 rounded-3xl border border-slate-200/80 bg-white/90 px-5 py-4">
      <div>
        <Switch.Label className="text-sm font-semibold text-slate-900">{label}</Switch.Label>
        <Switch.Description className="mt-1 text-xs text-slate-500">{description}</Switch.Description>
      </div>
      <Switch
        checked={value}
        onChange={onChange}
        disabled={loading}
        className={classNames(
          value ? 'bg-accent' : 'bg-slate-200',
          'relative inline-flex h-7 w-14 items-center rounded-full transition',
          loading ? 'cursor-wait opacity-60' : 'hover:brightness-105',
        )}
      >
        <span
          className={classNames(
            value ? 'translate-x-7 bg-white' : 'translate-x-1 bg-white',
            'inline-block h-5 w-5 transform rounded-full shadow transition',
          )}
        />
      </Switch>
    </Switch.Group>
  );
}

PreferenceToggle.propTypes = {
  label: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  value: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

PreferenceToggle.defaultProps = {
  loading: false,
};

function ValuePropList({ items }) {
  if (!items.length) {
    return null;
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-3 rounded-3xl border border-white/20 bg-white/10 p-4 text-sm text-white/80 backdrop-blur-sm"
        >
          <SparklesIcon className="mt-0.5 h-4 w-4 text-white/70" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

ValuePropList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
};

function InsightChip({ label, value }) {
  if (!value) {
    return null;
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
      <ChartBarIcon className="h-3.5 w-3.5" />
      {label}: {value}
    </span>
  );
}

InsightChip.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
};

InsightChip.defaultProps = {
  value: null,
};

function MemberShowcase({ members, show, onReveal }) {
  if (!members.length) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-white/20 bg-white/10 p-6 text-white/80">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Member spotlight</p>
          <p className="mt-1 text-sm">Leaders sharing wins, briefs, and collaboration offers.</p>
        </div>
        {!show ? (
          <button
            type="button"
            onClick={onReveal}
            className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-white/60"
          >
            Preview roster
            <UserGroupIcon className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {show ? (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {members.map((member) => (
            <li key={member.id ?? member.handle ?? member.name} className="flex items-center gap-4 rounded-3xl border border-white/20 bg-white/5 p-4">
              <UserAvatar name={member.name} imageUrl={member.avatarUrl} size="sm" showGlow={false} />
              <div>
                <p className="text-sm font-semibold text-white">{member.name}</p>
                {member.title ? <p className="text-xs text-white/70">{member.title}</p> : null}
                {member.focus ? <p className="text-xs text-white/60">{member.focus}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

MemberShowcase.propTypes = {
  members: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      handle: PropTypes.string,
      name: PropTypes.string,
      title: PropTypes.string,
      focus: PropTypes.string,
      avatarUrl: PropTypes.string,
    }),
  ).isRequired,
  show: PropTypes.bool.isRequired,
  onReveal: PropTypes.func.isRequired,
};

function PostPreview({ post }) {
  const title = post?.title ?? post?.question ?? post?.prompt ?? 'Pinned discussion';
  const summary = post?.summary ?? post?.excerpt ?? post?.preview ?? post?.description;
  const author = post?.author?.name ?? post?.authorName;
  const replyCount = post?.replyCount ?? post?.responses ?? post?.metrics?.replyCount;
  const tagList = Array.isArray(post?.tags) ? post.tags : Array.isArray(post?.topics) ? post.topics : [];
  const lastActivity = post?.updatedAt ?? post?.lastActivityAt ?? post?.createdAt;

  return (
    <article className="rounded-3xl border border-white/20 bg-white/10 p-5 text-white/90">
      <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-wide text-white/60">
        <span className="inline-flex items-center gap-2">
          <MegaphoneIcon className="h-4 w-4" />
          Pinned insight
        </span>
        {lastActivity ? <span>{formatRelativeTime(lastActivity)}</span> : null}
      </div>
      <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>
      {summary ? <p className="mt-2 text-sm text-white/80">{summary}</p> : null}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/70">
        {author ? <span>by {author}</span> : null}
        {typeof replyCount === 'number' ? <span>• {replyCount} replies</span> : null}
        {tagList.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full border border-white/30 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide"
          >
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}

PostPreview.propTypes = {
  post: PropTypes.object,
};

PostPreview.defaultProps = {
  post: null,
};

function EventPreview({ event }) {
  if (!event) {
    return (
      <div className="rounded-3xl border border-white/20 bg-white/10 p-6 text-white/80">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Upcoming session</p>
        <p className="mt-2 text-sm">Program calendar is loading. RSVP reminders will appear here once events publish.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/20 bg-white/10 p-6 text-white">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Upcoming session</p>
      <h3 className="mt-3 text-lg font-semibold">{event.title}</h3>
      <p className="mt-2 text-sm text-white/80">{event.description ?? 'Join peers for a live collaboration session.'}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-white/70">
        <span className="inline-flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          {formatDate(event.startAt)}
        </span>
        {event.host?.name ? <span>• Host {event.host.name}</span> : null}
        {event.format ? <span>• {event.format}</span> : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={event.url ?? '#'}
          className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/60"
        >
          View details
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
        </a>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40"
        >
          <PlayCircleIcon className="h-4 w-4" />
          Save RSVP
        </button>
      </div>
    </div>
  );
}

EventPreview.propTypes = {
  event: PropTypes.object,
};

EventPreview.defaultProps = {
  event: null,
};

function ResourceHighlight({ resources }) {
  if (!resources.length) {
    return null;
  }
  const [primary, ...rest] = resources;
  return (
    <div className="rounded-3xl border border-white/20 bg-white/10 p-6 text-white">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Featured resources</p>
      <h3 className="mt-3 text-lg font-semibold">{primary.title}</h3>
      {primary.description ? <p className="mt-2 text-sm text-white/80">{primary.description}</p> : null}
      <div className="mt-4 grid gap-3">
        <a
          href={primary.url ?? '#'}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40"
        >
          <ShareIcon className="h-4 w-4" />
          Open featured guide
        </a>
        {rest.slice(0, 2).map((resource) => (
          <a
            key={resource.id ?? resource.title}
            href={resource.url ?? '#'}
            className="inline-flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-left text-xs text-white/70 transition hover:border-white/40"
          >
            <span className="font-semibold text-white/80">{resource.title}</span>
            <ArrowTopRightOnSquareIcon className="h-4 w-4 text-white/60" />
          </a>
        ))}
      </div>
    </div>
  );
}

ResourceHighlight.propTypes = {
  resources: PropTypes.arrayOf(PropTypes.object).isRequired,
};

function QuickAction({ icon: Icon, label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        'inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition',
        disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-white/40 hover:text-white',
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

QuickAction.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
};

QuickAction.defaultProps = {
  onClick: undefined,
  disabled: false,
};

export default function GroupLanding({
  group,
  membership,
  preferences,
  onUpdatePreference,
  onJoin,
  onLeave,
  pendingAction,
  feedback,
  fromCache,
  lastUpdated,
  loading,
  accentColor,
  events,
  pinnedPosts,
  featuredResources,
  analytics,
  formatNumber,
  formatPercent,
  preferencePendingKey,
  onRefresh,
}) {
  const [showMembers, setShowMembers] = useState(false);
  const [shareState, setShareState] = useState(null);

  const accent = accentColor ?? '#2563EB';
  const heroBackground = useMemo(() => {
    if (group?.bannerImageUrl) {
      return {
        backgroundImage: `linear-gradient(135deg, rgba(15,23,42,0.85) 10%, rgba(37,99,235,0.65) 60%), url(${group.bannerImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return {
      background: `linear-gradient(135deg, ${accent} 0%, rgba(15,23,42,0.85) 100%)`,
    };
  }, [group?.bannerImageUrl, accent]);

  const metrics = useMemo(
    () => [
      {
        label: 'Members',
        value: formatNumber(group?.stats?.memberCount ?? '—'),
      },
      {
        label: 'Weekly active',
        value: formatNumber(group?.stats?.weeklyActiveMembers ?? '—'),
      },
      {
        label: 'Retention',
        value: formatPercent(group?.stats?.retentionRate),
      },
    ],
    [group?.stats?.memberCount, group?.stats?.retentionRate, group?.stats?.weeklyActiveMembers, formatNumber, formatPercent],
  );

  const valueProps = useMemo(() => {
    const base = Array.isArray(group?.valuePropositions) ? group.valuePropositions : [];
    const derived = [
      analytics?.activeToday ? `${formatNumber(analytics.activeToday)} conversations active today` : null,
      analytics?.unresolved ? `${formatNumber(analytics.unresolved)} open questions awaiting replies` : null,
      analytics?.contributorsThisWeek ? `${formatNumber(analytics.contributorsThisWeek)} contributors this week` : null,
      events?.length ? `Next: ${events[0].title}` : null,
    ].filter(Boolean);
    const combined = [...base, ...derived];
    const seen = new Set();
    return combined.filter((item) => {
      if (!item || seen.has(item)) {
        return false;
      }
      seen.add(item);
      return true;
    }).slice(0, 4);
  }, [group?.valuePropositions, analytics, events, formatNumber]);

  const eventHighlight = useMemo(() => events?.[0] ?? null, [events]);
  const pinnedHighlight = useMemo(() => pinnedPosts?.[0] ?? null, [pinnedPosts]);
  const memberSpotlight = useMemo(() => {
    if (Array.isArray(group?.memberSpotlight)) {
      return group.memberSpotlight.slice(0, 6);
    }
    if (Array.isArray(group?.members?.spotlight)) {
      return group.members.spotlight.slice(0, 6);
    }
    if (Array.isArray(group?.members)) {
      return group.members.slice(0, 6);
    }
    return [];
  }, [group]);

  const isMember = membership?.status === 'member';

  const handleShare = useCallback(async () => {
    if (typeof window === 'undefined') {
      return;
    }
    const payload = {
      title: group?.name ?? 'Gigvora community',
      text: group?.summary ?? 'Join me inside this Gigvora group.',
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        setShareState('Shared');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload.url);
        setShareState('Link copied');
      } else {
        setShareState('Share feature unavailable');
      }
    } catch (error) {
      setShareState(error?.message ?? 'Share cancelled');
    }
    setTimeout(() => setShareState(null), 3000);
  }, [group?.name, group?.summary]);

  const handleInvite = useCallback(() => {
    const subject = encodeURIComponent(`Join me in ${group?.name ?? 'this Gigvora group'}`);
    const body = encodeURIComponent(`I think you would love the conversations happening inside ${group?.name}. ${typeof window !== 'undefined' ? window.location.href : ''}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }, [group?.name]);

  const pendingJoin = pendingAction === 'join';
  const pendingLeave = pendingAction === 'leave';

  return (
    <div className="relative overflow-hidden text-white">
      <div className="absolute inset-0" aria-hidden="true" style={heroBackground} />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/30 via-transparent to-slate-900/40" aria-hidden="true" />
      <div className="relative">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-wide text-white/70">
            <Link
              to="/groups"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-white/80 transition hover:border-white/40 hover:text-white"
            >
              <UserGroupIcon className="h-4 w-4" /> All groups
            </Link>
            {fromCache ? <span className="rounded-full border border-white/30 px-3 py-1">Cached</span> : null}
            {lastUpdated ? <span>Updated {new Date(lastUpdated).toLocaleTimeString()}</span> : null}
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-white/80 transition hover:border-white/40 hover:text-white"
            >
              Refresh
            </button>
            {loading ? <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-white/70">Refreshing…</span> : null}
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,3fr),minmax(280px,1fr)] lg:items-start">
            <div className="space-y-6">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80">
                  {group?.focusAreas?.join(' • ') || 'Community'}
                </p>
                <h1 className="mt-4 text-3xl font-semibold lg:text-4xl">{group?.name}</h1>
                <p className="mt-4 max-w-2xl text-sm text-white/80">{group?.summary}</p>
              </div>

              <div className="grid gap-4 text-sm sm:grid-cols-3">
                {metrics.map((metric) => (
                  <div key={metric.label} className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-wide text-white/70">{metric.label}</p>
                    <p className="mt-1 text-2xl font-semibold">{metric.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <InsightChip label="Active today" value={analytics?.activeToday ? formatNumber(analytics.activeToday) : null} />
                <InsightChip label="Unresolved" value={analytics?.unresolved ? formatNumber(analytics.unresolved) : null} />
                <InsightChip
                  label="Contributors"
                  value={analytics?.contributorsThisWeek ? `${formatNumber(analytics.contributorsThisWeek)} this week` : null}
                />
              </div>

              <ValuePropList items={valueProps} />

              {pinnedHighlight ? <PostPreview post={pinnedHighlight} /> : null}

              <MemberShowcase members={memberSpotlight} show={showMembers} onReveal={() => setShowMembers(true)} />
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Membership</p>
                <p className="mt-2 text-sm text-white/80">
                  {isMember
                    ? 'You are part of this hub. Invite collaborators and tailor alerts to stay in sync.'
                    : 'Request access to collaborate with mentors, founders, and operators solving similar challenges.'}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {isMember ? (
                    <button
                      type="button"
                      onClick={onLeave}
                      disabled={pendingLeave}
                      className={classNames(
                        'inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white transition',
                        pendingLeave ? 'cursor-wait opacity-60' : 'hover:border-white/50',
                      )}
                    >
                      Leave group
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onJoin}
                      disabled={pendingJoin}
                      className={classNames(
                        'inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-semibold text-slate-900 shadow-soft transition',
                        pendingJoin ? 'cursor-wait bg-white/70' : 'hover:bg-slate-100',
                      )}
                    >
                      {pendingJoin ? 'Joining…' : group?.joinPolicy === 'invite_only' ? 'Request invite' : 'Join community'}
                    </button>
                  )}
                  <QuickAction icon={ShareIcon} label={shareState ?? 'Share'} onClick={handleShare} />
                  <QuickAction
                    icon={BellAlertIcon}
                    label={isMember ? 'Tune alerts' : 'Notify me'}
                    onClick={isMember ? () => onUpdatePreference('digest', true) : onJoin}
                    disabled={isMember ? false : pendingJoin}
                  />
                  <QuickAction icon={MegaphoneIcon} label="Invite" onClick={handleInvite} />
                </div>
                {feedback ? (
                  <div
                    className={classNames(
                      'mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold',
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
                {shareState ? (
                  <div className="mt-2 text-xs text-white/70">{shareState}</div>
                ) : null}
              </div>

              <EventPreview event={eventHighlight} />

              <ResourceHighlight resources={featuredResources} />

              {isMember ? (
                <div className="space-y-4 rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Notification preferences</p>
                  <PreferenceToggle
                    label="Weekly digest"
                    description="Curated highlights delivered every Monday."
                    value={Boolean(preferences?.digest)}
                    loading={preferencePendingKey === 'digest'}
                    onChange={(value) => onUpdatePreference('digest', value)}
                  />
                  <PreferenceToggle
                    label="New thread alerts"
                    description="Instant pings when moderators open new debates."
                    value={Boolean(preferences?.newThread)}
                    loading={preferencePendingKey === 'newThread'}
                    onChange={(value) => onUpdatePreference('newThread', value)}
                  />
                  <PreferenceToggle
                    label="Upcoming event reminders"
                    description="24-hour reminders for confirmed RSVPs."
                    value={Boolean(preferences?.upcomingEvent)}
                    loading={preferencePendingKey === 'upcomingEvent'}
                    onChange={(value) => onUpdatePreference('upcomingEvent', value)}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

GroupLanding.propTypes = {
  group: PropTypes.object.isRequired,
  membership: PropTypes.object.isRequired,
  preferences: PropTypes.shape({
    digest: PropTypes.bool,
    newThread: PropTypes.bool,
    upcomingEvent: PropTypes.bool,
  }).isRequired,
  onUpdatePreference: PropTypes.func.isRequired,
  onJoin: PropTypes.func.isRequired,
  onLeave: PropTypes.func.isRequired,
  pendingAction: PropTypes.string,
  feedback: PropTypes.shape({
    type: PropTypes.string,
    message: PropTypes.string,
  }),
  fromCache: PropTypes.bool,
  lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  loading: PropTypes.bool,
  accentColor: PropTypes.string,
  events: PropTypes.arrayOf(PropTypes.object),
  pinnedPosts: PropTypes.arrayOf(PropTypes.object),
  featuredResources: PropTypes.arrayOf(PropTypes.object),
  analytics: PropTypes.shape({
    activeToday: PropTypes.number,
    unresolved: PropTypes.number,
    contributorsThisWeek: PropTypes.number,
  }),
  formatNumber: PropTypes.func.isRequired,
  formatPercent: PropTypes.func.isRequired,
  preferencePendingKey: PropTypes.string,
  onRefresh: PropTypes.func,
};

GroupLanding.defaultProps = {
  pendingAction: null,
  feedback: null,
  fromCache: false,
  lastUpdated: null,
  loading: false,
  accentColor: '#2563EB',
  events: [],
  pinnedPosts: [],
  featuredResources: [],
  analytics: null,
  preferencePendingKey: null,
  onRefresh: undefined,
};
