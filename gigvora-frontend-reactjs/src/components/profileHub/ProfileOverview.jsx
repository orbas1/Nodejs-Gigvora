import { useMemo } from 'react';
import {
  ArrowTopRightOnSquareIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  PlayCircleIcon,
  ShareIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import UserAvatar from '../UserAvatar.jsx';

function formatNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  if (Math.abs(numeric) >= 1000) {
    return new Intl.NumberFormat(undefined, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(numeric);
  }
  return numeric.toLocaleString();
}

function buildMetric(label, value, suffix) {
  if (value == null || value === '') {
    return null;
  }
  const formattedValue = typeof value === 'number' || typeof value === 'string' ? formatNumber(value) : value;
  return suffix ? { label, value: formattedValue, suffix } : { label, value: formattedValue };
}

function dedupeHighlights(highlights) {
  const seen = new Set();
  const result = [];
  for (const highlight of highlights) {
    const label = typeof highlight === 'string' ? highlight : highlight?.title ?? highlight?.label;
    if (!label) {
      continue;
    }
    if (seen.has(label)) {
      continue;
    }
    seen.add(label);
    result.push({
      id: highlight?.id ?? label,
      label,
      metric: highlight?.metric ?? highlight?.value ?? null,
      description: highlight?.description ?? highlight?.summary ?? null,
    });
  }
  return result.slice(0, 6);
}

const CTA_CONFIG = [
  { id: 'connect', label: 'Connect', icon: UserGroupIcon },
  { id: 'message', label: 'Message', icon: ChatBubbleLeftRightIcon },
  { id: 'share', label: 'Share profile', icon: ShareIcon },
];

function resolveHeroVideo(profileOverview, profileHub) {
  return profileOverview?.heroVideoUrl ?? profileHub?.heroVideoUrl ?? profileHub?.media?.heroVideoUrl ?? null;
}

function resolveHeroImage(profileOverview, profileHub) {
  return (
    profileOverview?.heroImageUrl ??
    profileHub?.heroImageUrl ??
    profileHub?.media?.heroImageUrl ??
    profileOverview?.coverImageUrl ??
    null
  );
}

function buildRecommendedAction(persona) {
  if (!persona) {
    return null;
  }
  const normalized = persona.toLowerCase();
  switch (normalized) {
    case 'recruiter':
      return {
        title: 'Recommended for recruiters',
        body: 'Showcase collaborative case studies and invite them to schedule a chemistry session.',
      };
    case 'mentor':
      return {
        title: 'Recommended for mentors',
        body: 'Highlight growth metrics and open office hour availability to drive meaningful intros.',
      };
    case 'investor':
      return {
        title: 'Recommended for investors',
        body: 'Pin traction snapshots and share the go-to-market reel for diligence-ready storytelling.',
      };
    case 'community':
      return {
        title: 'Recommended for community members',
        body: 'Surface recent wins and invite them to co-create sessions through quick connect.',
      };
    default:
      return {
        title: 'Recommended next step',
        body: 'Personalise the hero message and feature the strongest achievement to inspire action.',
      };
  }
}

export default function ProfileOverview({
  profileOverview,
  profileHub,
  viewerPersona,
  onAction,
}) {
  const name = profileOverview?.name ?? profileHub?.name ?? 'Your profile';
  const headline =
    profileOverview?.headline ?? profileOverview?.missionStatement ?? profileHub?.headline ?? 'Add your headline';
  const bio = profileOverview?.bio ?? profileHub?.bio ?? '';
  const location = profileOverview?.location ?? profileHub?.location ?? '';
  const availability = profileHub?.availability ?? profileOverview?.availability ?? null;
  const heroVideoUrl = resolveHeroVideo(profileOverview, profileHub);
  const heroImageUrl = resolveHeroImage(profileOverview, profileHub);

  const metrics = useMemo(() => {
    const statSource = profileHub?.stats ?? profileHub?.metrics ?? profileOverview?.stats ?? {};
    const stats = [
      buildMetric('Followers', statSource.followers ?? profileHub?.followers?.total ?? profileHub?.followersTotal),
      buildMetric('Connections', statSource.connections ?? profileHub?.connections?.total),
      buildMetric('Projects led', statSource.projects ?? statSource.projectsLed ?? profileHub?.projects?.total),
      buildMetric('Avg. satisfaction', statSource.satisfaction, statSource.satisfaction ? 'NPS' : null),
    ].filter(Boolean);
    if (stats.length === 0 && profileHub?.workspace?.metrics) {
      return Object.entries(profileHub.workspace.metrics)
        .map(([label, value]) => buildMetric(label, value))
        .filter(Boolean)
        .slice(0, 4);
    }
    return stats.slice(0, 4);
  }, [profileHub, profileOverview]);

  const highlightReel = useMemo(() => {
    const highlightSource = [
      profileOverview?.highlightReel,
      profileHub?.highlightReel,
      profileHub?.workspace?.highlights,
      profileHub?.timeline?.spotlight?.highlights,
    ].filter(Boolean);
    const combined = highlightSource.flatMap((entry) => {
      if (!entry) {
        return [];
      }
      if (Array.isArray(entry)) {
        return entry;
      }
      if (typeof entry === 'string') {
        return [entry];
      }
      if (typeof entry === 'object') {
        return Object.values(entry);
      }
      return [];
    });
    return dedupeHighlights(combined);
  }, [profileHub, profileOverview]);

  const mutualConnections = useMemo(() => {
    const connections = profileHub?.mutualConnections ?? profileHub?.connections?.mutual ?? [];
    if (Array.isArray(connections)) {
      return connections.slice(0, 6);
    }
    if (connections && typeof connections === 'object') {
      return Object.values(connections).slice(0, 6);
    }
    return [];
  }, [profileHub]);

  const trustBadges = useMemo(() => {
    const badges = profileHub?.trustBadges ?? profileHub?.badges ?? [];
    if (!Array.isArray(badges)) {
      return [];
    }
    return badges
      .map((badge) =>
        typeof badge === 'string'
          ? { id: badge, label: badge }
          : {
              id: badge?.id ?? badge?.label,
              label: badge?.label ?? badge?.title ?? '',
              description: badge?.description ?? badge?.subtitle ?? null,
            },
      )
      .filter((badge) => badge.label)
      .slice(0, 4);
  }, [profileHub]);

  const recommendedAction = useMemo(() => buildRecommendedAction(viewerPersona), [viewerPersona]);

  return (
    <section className="overflow-hidden rounded-4xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-accent/70 text-white shadow-[0_45px_90px_-40px_rgba(15,23,42,0.6)]">
      <div className="relative">
        {heroImageUrl ? (
          <img
            src={heroImageUrl}
            alt="Profile showcase"
            className="h-60 w-full object-cover opacity-60"
            loading="lazy"
          />
        ) : (
          <div className="h-60 w-full bg-gradient-to-r from-slate-900/70 via-slate-900/40 to-accent/40" />
        )}
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
        <div className="relative flex flex-col gap-6 px-8 pb-8 pt-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-5">
            <UserAvatar
              name={name}
              imageUrl={profileOverview?.avatarUrl ?? profileHub?.avatarUrl}
              seed={profileOverview?.avatarSeed ?? profileHub?.avatarSeed ?? name}
              size="lg"
              className="ring-4 ring-white/20 lg:h-24 lg:w-24"
            />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">{name}</h1>
                {availability?.status ? (
                  <span className="inline-flex items-center gap-2 rounded-3xl bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                    <ShieldCheckIcon className="h-4 w-4" />
                    {availability.status.replace(/_/g, ' ')}
                  </span>
                ) : null}
              </div>
              <p className="text-lg text-slate-200">{headline}</p>
              {location ? <p className="text-sm text-slate-300">{location}</p> : null}
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center lg:gap-4">
            {CTA_CONFIG.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onAction?.(id)}
                className={clsx(
                  'inline-flex items-center gap-2 rounded-3xl px-5 py-2 text-sm font-semibold transition',
                  id === 'connect'
                    ? 'bg-white text-slate-900 shadow-lg shadow-white/20 hover:bg-slate-100'
                    : 'border border-white/30 bg-white/5 text-slate-100 hover:bg-white/15',
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 px-8 pb-10 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
        <div className="space-y-6">
          {bio ? (
            <p className="text-base leading-relaxed text-slate-100">{bio}</p>
          ) : (
            <p className="text-base text-slate-300">
              Add a short narrative that captures your value proposition, signature programmes, and ideal collaborators.
            </p>
          )}

          <div className="grid gap-4 rounded-3xl bg-white/5 p-6 backdrop-blur-sm lg:grid-cols-4">
            {metrics.length ? (
              metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-300">{metric.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {metric.value}
                    {metric.suffix ? (
                      <span className="ml-1 text-sm font-medium text-slate-200">{metric.suffix}</span>
                    ) : null}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-full rounded-2xl border border-dashed border-white/20 p-6 text-slate-200">
                Wire up live metrics from your programmes to spotlight traction and credibility.
              </div>
            )}
          </div>

          <section>
            <header className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Highlight reel</h2>
              {heroVideoUrl ? (
                <a
                  href={heroVideoUrl}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-3 py-1.5 text-xs text-slate-200 transition hover:border-white hover:text-white"
                >
                  <PlayCircleIcon className="h-4 w-4" /> Watch intro
                </a>
              ) : null}
            </header>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {highlightReel.length ? (
                highlightReel.map((highlight) => (
                  <div key={highlight.id} className="rounded-3xl border border-white/15 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-white">{highlight.label}</p>
                        {highlight.description ? (
                          <p className="mt-1 text-sm text-slate-200">{highlight.description}</p>
                        ) : null}
                      </div>
                      {highlight.metric ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100">
                          <BoltIcon className="h-4 w-4" />
                          {highlight.metric}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full rounded-3xl border border-dashed border-white/20 p-6 text-slate-200">
                  Elevate this space with marquee milestones, transformation stats, and signature programmes.
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          {mutualConnections.length ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <header className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                  <UserGroupIcon className="h-5 w-5" /> Mutual connections
                </span>
                <span className="text-xs text-slate-200">{mutualConnections.length} of note</span>
              </header>
              <ul className="mt-4 space-y-3 text-sm text-slate-200">
                {mutualConnections.map((connection) => (
                  <li key={connection.id ?? connection.email ?? connection.name} className="flex items-center gap-3">
                    <UserAvatar
                      name={connection.name}
                      imageUrl={connection.avatarUrl}
                      seed={connection.avatarSeed ?? connection.name}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium text-white">{connection.name}</p>
                      <p className="text-xs text-slate-300">{connection.headline ?? connection.relationship ?? 'Introduced via network'}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {trustBadges.length ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Trust signals</h3>
              <ul className="mt-3 space-y-3 text-sm text-slate-200">
                {trustBadges.map((badge) => (
                  <li key={badge.id} className="flex items-start gap-3">
                    <SparklesIcon className="mt-0.5 h-4 w-4 text-amber-200" />
                    <div>
                      <p className="font-semibold text-white">{badge.label}</p>
                      {badge.description ? <p className="text-xs text-slate-300">{badge.description}</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {recommendedAction ? (
            <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-5 text-slate-200">
              <p className="text-sm font-semibold text-white">{recommendedAction.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">{recommendedAction.body}</p>
              <button
                type="button"
                onClick={() => onAction?.('open-guidance')}
                className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-white/30 px-3 py-1.5 text-xs text-slate-100 transition hover:border-white hover:text-white"
              >
                Playbook <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

const highlightShape = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    label: PropTypes.string,
    metric: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    description: PropTypes.string,
    summary: PropTypes.string,
  }),
]);

const connectionShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  name: PropTypes.string.isRequired,
  headline: PropTypes.string,
  relationship: PropTypes.string,
  avatarUrl: PropTypes.string,
  avatarSeed: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
});

const badgeShape = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    subtitle: PropTypes.string,
  }),
]);

ProfileOverview.propTypes = {
  profileOverview: PropTypes.shape({
    name: PropTypes.string,
    headline: PropTypes.string,
    missionStatement: PropTypes.string,
    bio: PropTypes.string,
    location: PropTypes.string,
    availability: PropTypes.shape({
      status: PropTypes.string,
    }),
    avatarUrl: PropTypes.string,
    avatarSeed: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    heroVideoUrl: PropTypes.string,
    heroImageUrl: PropTypes.string,
    highlightReel: PropTypes.arrayOf(highlightShape),
    stats: PropTypes.object,
  }),
  profileHub: PropTypes.shape({
    name: PropTypes.string,
    headline: PropTypes.string,
    bio: PropTypes.string,
    location: PropTypes.string,
    availability: PropTypes.shape({
      status: PropTypes.string,
    }),
    followers: PropTypes.shape({
      total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    connections: PropTypes.shape({
      total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      mutual: PropTypes.arrayOf(connectionShape),
    }),
    stats: PropTypes.object,
    metrics: PropTypes.object,
    workspace: PropTypes.shape({
      highlights: PropTypes.arrayOf(highlightShape),
      metrics: PropTypes.object,
    }),
    trustBadges: PropTypes.arrayOf(badgeShape),
    badges: PropTypes.arrayOf(badgeShape),
    mutualConnections: PropTypes.arrayOf(connectionShape),
    highlightReel: PropTypes.arrayOf(highlightShape),
    heroVideoUrl: PropTypes.string,
    heroImageUrl: PropTypes.string,
    media: PropTypes.shape({
      heroVideoUrl: PropTypes.string,
      heroImageUrl: PropTypes.string,
    }),
  }),
  viewerPersona: PropTypes.string,
  onAction: PropTypes.func,
};

ProfileOverview.defaultProps = {
  profileOverview: undefined,
  profileHub: undefined,
  viewerPersona: undefined,
  onAction: undefined,
};
