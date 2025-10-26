import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  AdjustmentsHorizontalIcon,
  ArrowTrendingUpIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeOpenIcon,
  FunnelIcon,
  HandThumbUpIcon,
  SparklesIcon,
  UserGroupIcon,
  TrophyIcon,
  ShieldCheckIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import DataStatus from '../DataStatus.jsx';
import UserAvatar from '../UserAvatar.jsx';
import { formatRelativeTime } from '../../utils/date.js';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function FilterPill({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400',
        active ? 'bg-sky-500/20 text-sky-100 border border-sky-400/40' : 'border border-white/15 bg-white/5 text-white/60 hover:border-white/30 hover:text-white',
      )}
    >
      <UserGroupIcon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}

FilterPill.propTypes = {
  active: PropTypes.bool,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

FilterPill.defaultProps = {
  active: false,
};

function EndorsementCard({ endorsement }) {
  const { endorser, quote, highlights, tags, rating, submittedAt, visibility, headline } = endorsement;
  return (
    <article className="flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/80 shadow-lg shadow-slate-950/30">
      <header className="flex items-center gap-3">
        <UserAvatar size="sm" name={endorser.name} imageUrl={endorser.avatar} />
        <div className="space-y-1 text-left">
          <p className="text-sm font-semibold text-white">{endorser.name}</p>
          <p className="text-xs uppercase tracking-wide text-white/40">{endorser.role}</p>
          {headline ? <p className="text-xs text-white/50">{headline}</p> : null}
        </div>
        <div className="ml-auto flex flex-col items-end text-xs text-white/50">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2 py-0.5 uppercase tracking-wide">
            {visibility}
          </span>
          <span>{formatRelativeTime(submittedAt)}</span>
        </div>
      </header>
      <div className="mt-4 space-y-4">
        <blockquote className="text-base text-white/90">“{quote}”</blockquote>
        {highlights?.length ? (
          <ul className="space-y-2 text-xs text-white/60">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {tags?.length ? (
          <div className="flex flex-wrap gap-2 text-[0.7rem] uppercase tracking-wide text-white/50">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1">
                <SparklesIcon className="h-3.5 w-3.5 text-sky-300" aria-hidden="true" />
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <footer className="mt-4 flex items-center justify-between text-xs text-white/60">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold uppercase tracking-wide text-amber-200">
          <HandThumbUpIcon className="h-4 w-4" aria-hidden="true" /> {rating.toFixed(1)} / 5
        </div>
        <span>{endorsement.channel ?? 'Multi-channel capture'}</span>
      </footer>
    </article>
  );
}

EndorsementCard.propTypes = {
  endorsement: PropTypes.shape({
    id: PropTypes.string.isRequired,
    endorser: PropTypes.shape({
      name: PropTypes.string.isRequired,
      avatar: PropTypes.string,
      role: PropTypes.string,
    }).isRequired,
    quote: PropTypes.string.isRequired,
    highlights: PropTypes.arrayOf(PropTypes.string),
    tags: PropTypes.arrayOf(PropTypes.string),
    rating: PropTypes.number,
    submittedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    visibility: PropTypes.string,
    headline: PropTypes.string,
    channel: PropTypes.string,
  }).isRequired,
};

function Spotlight({ spotlight }) {
  if (!spotlight) return null;
  return (
    <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/15 p-6 text-white shadow-2xl shadow-slate-950/50">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <TrophyIcon className="h-8 w-8 text-amber-300" aria-hidden="true" />
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">Spotlight endorsement</p>
            <h3 className="text-2xl font-semibold tracking-tight">{spotlight.title}</h3>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/60">
          <ShieldCheckIcon className="h-5 w-5 text-sky-200" aria-hidden="true" />
          Verified by {spotlight.verifiedBy}
        </div>
      </header>
      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-4 text-sm text-white/80">
          <p className="text-lg text-white/90">“{spotlight.quote}”</p>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-white/40">
            <UserAvatar size="sm" name={spotlight.endorser.name} imageUrl={spotlight.endorser.avatar} />
            {spotlight.endorser.name}
            <span aria-hidden="true">•</span>
            {spotlight.endorser.role}
            <span aria-hidden="true">•</span>
            {formatRelativeTime(spotlight.submittedAt)}
          </div>
          {spotlight.highlights?.length ? (
            <ul className="space-y-2 text-xs text-white/60">
              {spotlight.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
          <header className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/50">
            <BuildingOffice2Icon className="h-4 w-4" aria-hidden="true" /> Impact snapshot
          </header>
          <dl className="space-y-2 text-xs">
            {spotlight.metrics?.map((metric) => (
              <div key={metric.label} className="flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2">
                <dt className="uppercase tracking-wide text-white/40">{metric.label}</dt>
                <dd className="font-semibold text-white">{metric.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

Spotlight.propTypes = {
  spotlight: PropTypes.shape({
    title: PropTypes.string.isRequired,
    quote: PropTypes.string.isRequired,
    endorser: PropTypes.shape({
      name: PropTypes.string.isRequired,
      avatar: PropTypes.string,
      role: PropTypes.string,
    }).isRequired,
    submittedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    highlights: PropTypes.arrayOf(PropTypes.string),
    verifiedBy: PropTypes.string,
    metrics: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
      }),
    ),
  }),
};

Spotlight.defaultProps = {
  spotlight: null,
};

function SummaryStat({ stat }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
      <p className="text-xs uppercase tracking-wide text-white/40">{stat.label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
      {stat.delta ? (
        <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
          <ArrowTrendingUpIcon className="h-4 w-4" aria-hidden="true" />
          {stat.delta}
        </p>
      ) : null}
      {stat.caption ? <p className="mt-2 text-xs text-white/50">{stat.caption}</p> : null}
    </div>
  );
}

SummaryStat.propTypes = {
  stat: PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    delta: PropTypes.string,
    caption: PropTypes.string,
  }).isRequired,
};

const TIMEFRAME_OPTIONS = [
  { id: '30', label: 'Last 30 days' },
  { id: '90', label: 'Last 90 days' },
  { id: '365', label: 'Last 12 months' },
];

export default function EndorsementWall({
  endorsements,
  spotlight,
  stats,
  loading,
  error,
  lastUpdated,
  onRefresh,
  onRequest,
  onShare,
}) {
  const [activePersona, setActivePersona] = useState('all');
  const [timeframe, setTimeframe] = useState(TIMEFRAME_OPTIONS[0].id);
  const personaFilters = useMemo(
    () => [
      { id: 'all', label: 'All personas' },
      { id: 'mentors', label: 'Mentors' },
      { id: 'founders', label: 'Founders' },
      { id: 'investors', label: 'Investors' },
      { id: 'talent', label: 'Talent partners' },
    ],
    [],
  );

  const filtered = useMemo(() => {
    const byPersona = activePersona === 'all'
      ? endorsements
      : endorsements.filter((item) => item.persona === activePersona);
    return byPersona.filter((item) => {
      if (!item.window) return true;
      if (timeframe === '30') return item.window <= 30;
      if (timeframe === '90') return item.window <= 90;
      return true;
    });
  }, [activePersona, endorsements, timeframe]);

  return (
    <section className="relative space-y-8 rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top,#111827,#020617)] p-8 text-white shadow-2xl shadow-slate-950/60">
      <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden="true">
        <div className="absolute left-12 top-12 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
      </div>
      <div className="relative space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">Social proof hub</p>
            <h2 className="text-3xl font-bold tracking-tight text-white">Endorsement wall</h2>
            <p className="max-w-2xl text-sm text-white/70">
              Curate testimonials, track sentiment trends, and mobilise your champions to mirror the polish of world-class professional networks.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onShare}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/20"
            >
              <EnvelopeOpenIcon className="h-5 w-5" aria-hidden="true" /> Share showcase
            </button>
            <button
              type="button"
              onClick={onRequest}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-emerald-100 transition hover:border-emerald-300 hover:bg-emerald-500/30"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden="true" /> Request new endorsements
            </button>
          </div>
        </header>

        <DataStatus
          loading={loading}
          error={error}
          lastUpdated={lastUpdated}
          statusLabel="Live endorsements"
          onRefresh={onRefresh}
        >
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {stats?.map((stat) => (
                <SummaryStat key={stat.label} stat={stat} />
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
              <div className="flex flex-wrap items-center gap-2">
                <FunnelIcon className="h-4 w-4" aria-hidden="true" />
                Persona filter
                <div className="flex flex-wrap gap-2">
                  {personaFilters.map((filter) => (
                    <FilterPill
                      key={filter.id}
                      active={activePersona === filter.id}
                      label={filter.label}
                      onClick={() => setActivePersona(filter.id)}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AdjustmentsHorizontalIcon className="h-4 w-4" aria-hidden="true" />
                <select
                  value={timeframe}
                  onChange={(event) => setTimeframe(event.target.value)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70 focus:border-sky-400 focus:outline-none"
                >
                  {TIMEFRAME_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id} className="text-slate-900">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Spotlight spotlight={spotlight} />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.length ? (
                filtered.map((endorsement) => <EndorsementCard key={endorsement.id} endorsement={endorsement} />)
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/20 bg-white/5 px-6 py-10 text-center text-sm text-white/70">
                  <SparklesIcon className="h-8 w-8 text-sky-300" aria-hidden="true" />
                  <p>No endorsements match this filter yet.</p>
                  <button
                    type="button"
                    onClick={onRequest}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-white/20 hover:text-white"
                  >
                    Invite champions to contribute
                  </button>
                </div>
              )}
            </div>
          </div>
        </DataStatus>
      </div>
      <footer className="relative mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
        <div className="flex items-center gap-3">
          <ArrowTrendingUpIcon className="h-5 w-5 text-sky-300" aria-hidden="true" />
          Momentum is calculated from rolling 30-day endorsements, referrals, and testimonial reach.
        </div>
        <div className="flex items-center gap-3">
          <SparklesIcon className="h-4 w-4 text-amber-200" aria-hidden="true" />
          Premium prompts keep authenticity high while guarding against over-polished fluff.
        </div>
      </footer>
    </section>
  );
}

EndorsementWall.propTypes = {
  endorsements: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      endorser: PropTypes.shape({
        name: PropTypes.string.isRequired,
        avatar: PropTypes.string,
        role: PropTypes.string,
      }).isRequired,
      quote: PropTypes.string.isRequired,
      highlights: PropTypes.arrayOf(PropTypes.string),
      tags: PropTypes.arrayOf(PropTypes.string),
      rating: PropTypes.number,
      submittedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
      visibility: PropTypes.string,
      persona: PropTypes.string,
      window: PropTypes.number,
      channel: PropTypes.string,
      headline: PropTypes.string,
    }),
  ),
  spotlight: Spotlight.propTypes.spotlight,
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      delta: PropTypes.string,
      caption: PropTypes.string,
    }),
  ),
  loading: PropTypes.bool,
  error: PropTypes.shape({
    message: PropTypes.string,
  }),
  lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  onRefresh: PropTypes.func,
  onRequest: PropTypes.func,
  onShare: PropTypes.func,
};

EndorsementWall.defaultProps = {
  endorsements: [],
  spotlight: null,
  stats: [],
  loading: false,
  error: null,
  lastUpdated: null,
  onRefresh: null,
  onRequest: null,
  onShare: null,
};
