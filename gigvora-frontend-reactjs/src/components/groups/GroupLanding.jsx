import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  SignalIcon,
  BookmarkSquareIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { formatGroupDate, formatGroupPercent } from '../../utils/groupFormatting.js';
import { classNames } from '../../utils/classNames.js';

function MetricTile({ label, value, description }) {
  return (
    <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {description ? <p className="mt-1 text-xs text-white/70">{description}</p> : null}
    </div>
  );
}

MetricTile.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  description: PropTypes.string,
};

MetricTile.defaultProps = {
  description: undefined,
};

function HighlightCard({ icon: Icon, title, description, accent = 'bg-white/10', href }) {
  const content = (
    <div
      className={classNames(
        'flex h-full flex-col justify-between gap-3 rounded-3xl border border-white/15 p-5 text-left backdrop-blur transition hover:border-white/30',
        accent,
      )}
    >
      <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/70">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <p className="text-sm text-white/80">{description}</p>
      {href ? (
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/80">
          View details
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
        </span>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block" target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return content;
}

HighlightCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  accent: PropTypes.string,
  href: PropTypes.string,
};

HighlightCard.defaultProps = {
  accent: 'bg-white/10',
  href: undefined,
};

export default function GroupLanding({
  group,
  membership,
  onJoin,
  onLeave,
  joining,
  leaving,
  feedback,
  exploreHref,
  accentColor,
  lastUpdated,
  fromCache,
  discussionStats,
  featuredResource,
}) {
  const { focusAreas = [], stats = {}, insights = {}, upcomingEvents = [] } = group;
  const heroEvent = upcomingEvents[0] ?? null;

  const accentGradient = `linear-gradient(135deg, ${accentColor} 0%, rgba(15,23,42,0.85) 100%)`;
  const showJoin = membership?.status !== 'member';

  return (
    <section className="relative overflow-hidden text-white">
      <div className="absolute inset-0 bg-slate-950" aria-hidden="true" />
      <div className="absolute inset-0 opacity-90" aria-hidden="true" style={{ background: accentGradient }} />

      <div className="relative">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-white/70">
            <Link
              to={exploreHref ?? '/groups'}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 transition hover:border-white/40 hover:text-white"
            >
              <ArrowLeftIcon className="h-4 w-4" /> Back to groups
            </Link>
            {fromCache ? <span className="rounded-full border border-white/25 px-3 py-1">Cached</span> : null}
            {lastUpdated ? <span>Updated {new Date(lastUpdated).toLocaleTimeString()}</span> : null}
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,3fr),minmax(260px,1fr)] lg:items-start">
            <div>
              <div className="flex flex-wrap gap-3">
                {focusAreas.length ? (
                  focusAreas.map((area) => (
                    <span
                      key={area}
                      className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80"
                    >
                      {area}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80">
                    Community
                  </span>
                )}
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">{group.name}</h1>
              <p className="mt-4 max-w-2xl text-lg text-white/80">{group.summary}</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <MetricTile label="Members" value={stats.memberCount ?? '—'} description="Global operators exchanging weekly" />
                <MetricTile label="Weekly active" value={stats.weeklyActiveMembers ?? '—'} description="Active contributors last 7 days" />
                <MetricTile label="Retention" value={formatGroupPercent(stats.retentionRate)} description="Trailing 90-day retention" />
              </div>

              {feedback ? (
                <div
                  className={classNames(
                    'mt-8 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide',
                    feedback.type === 'success'
                      ? 'bg-emerald-400/20 text-emerald-100'
                      : feedback.type === 'error'
                      ? 'bg-rose-400/20 text-rose-100'
                      : 'bg-white/20 text-white',
                  )}
                >
                  {feedback.message}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
              {showJoin ? (
                <button
                  type="button"
                  onClick={onJoin}
                  disabled={joining}
                  className={classNames(
                    'inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow transition',
                    joining ? 'opacity-70' : 'hover:bg-slate-100',
                  )}
                >
                  {joining ? 'Joining…' : group.joinPolicy === 'invite_only' ? 'Request invite' : 'Join community'}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onLeave}
                    disabled={leaving}
                    className={classNames(
                      'inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition',
                      leaving ? 'opacity-60' : 'hover:border-white/40 hover:text-white',
                    )}
                  >
                    {leaving ? 'Leaving…' : 'Leave group'}
                  </button>
                  <a
                    href="mailto:community@gigvora.com"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/70 transition hover:border-white/40 hover:text-white"
                  >
                    Invite collaborators
                  </a>
                </>
              )}

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-xs text-white/80">
                <p className="font-semibold uppercase tracking-wide">Access policy</p>
                <p className="mt-2">Join policy: {group.joinPolicy === 'invite_only' ? 'Invite only' : 'Community approval'}</p>
                <p className="mt-1">Eligible roles: {group.allowedUserTypes?.join(', ') ?? 'Gigvora members'}</p>
                <p className="mt-1">Engagement score: {stats.engagementScore ?? '—'}/1.0</p>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {heroEvent ? (
              <HighlightCard
                icon={CalendarDaysIcon}
                title="Next live session"
                description={`${heroEvent.title} · ${formatGroupDate(heroEvent.startAt)}`}
                accent="bg-white/10"
                href={heroEvent.url}
              />
            ) : (
              <HighlightCard
                icon={CalendarDaysIcon}
                title="Programming cadence"
                description="Live salons and deep dives are announced every Monday at 12:00 UTC."
              />
            )}
            <HighlightCard
              icon={SignalIcon}
              title="Community signals"
              description={
                (insights.trendingTopics ?? []).length
                  ? insights.trendingTopics.slice(0, 2).join(' • ')
                  : 'Join the conversation to unlock the latest market intelligence.'
              }
            />
            <HighlightCard
              icon={BookmarkSquareIcon}
              title="Featured resource"
              description={
                featuredResource
                  ? `${featuredResource.title} · ${featuredResource.type}`
                  : 'Curated playbooks, templates, and recordings for members.'
              }
              href={featuredResource?.url}
            />
          </div>

          {discussionStats ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                <p className="text-xs uppercase tracking-wide text-white/60">Active contributors</p>
                <p className="mt-1 text-2xl font-semibold text-white">{discussionStats.activeContributors ?? '—'}</p>
                <p className="mt-2 text-xs text-white/60">Shared insights in the last 72 hours.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                <p className="text-xs uppercase tracking-wide text-white/60">Unresolved questions</p>
                <p className="mt-1 text-2xl font-semibold text-white">{discussionStats.unresolvedCount ?? '—'}</p>
                <p className="mt-2 text-xs text-white/60">Prioritised for mentor responses.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                <p className="text-xs uppercase tracking-wide text-white/60">New this week</p>
                <p className="mt-1 text-2xl font-semibold text-white">{discussionStats.newThreads ?? '—'}</p>
                <p className="mt-2 text-xs text-white/60">Fresh conversations opened in the last 7 days.</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

GroupLanding.propTypes = {
  group: PropTypes.shape({
    name: PropTypes.string.isRequired,
    summary: PropTypes.string,
    focusAreas: PropTypes.arrayOf(PropTypes.string),
    stats: PropTypes.object,
    insights: PropTypes.object,
    joinPolicy: PropTypes.string,
    allowedUserTypes: PropTypes.arrayOf(PropTypes.string),
    upcomingEvents: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        startAt: PropTypes.string,
        url: PropTypes.string,
      }),
    ),
  }).isRequired,
  membership: PropTypes.shape({ status: PropTypes.string }),
  onJoin: PropTypes.func,
  onLeave: PropTypes.func,
  joining: PropTypes.bool,
  leaving: PropTypes.bool,
  feedback: PropTypes.shape({
    type: PropTypes.string,
    message: PropTypes.string,
  }),
  exploreHref: PropTypes.string,
  accentColor: PropTypes.string,
  lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  fromCache: PropTypes.bool,
  discussionStats: PropTypes.shape({
    activeContributors: PropTypes.number,
    unresolvedCount: PropTypes.number,
    newThreads: PropTypes.number,
  }),
  featuredResource: PropTypes.shape({
    title: PropTypes.string,
    type: PropTypes.string,
    url: PropTypes.string,
  }),
};

GroupLanding.defaultProps = {
  membership: null,
  onJoin: undefined,
  onLeave: undefined,
  joining: false,
  leaving: false,
  feedback: null,
  exploreHref: '/groups',
  accentColor: '#2563EB',
  lastUpdated: undefined,
  fromCache: false,
  discussionStats: null,
  featuredResource: null,
};
