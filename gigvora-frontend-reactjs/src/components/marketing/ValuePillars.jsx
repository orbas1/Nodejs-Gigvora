import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { ChartBarIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/outline';
import analytics from '../../services/analytics.js';

const DEFAULT_PILLARS = [
  {
    id: 'launch-alignment',
    title: 'Orchestrate every launch moment',
    description:
      'Live roadmaps, shared rituals, and async updates keep agencies, founders, and operators aligned without spinning up side chats.',
    highlights: ['Launchpad milestones auto-sync across teams', 'Mentor signals surface blockers before stand-up'],
    metric: { label: 'Faster launches', value: '42% cycle time reduction' },
    icon: SparklesIcon,
  },
  {
    id: 'operations-trust',
    title: 'Run operations with enterprise trust',
    description:
      'Integrated compliance, payment, and approval workflows keep finance, legal, and delivery in lockstep for every engagement.',
    highlights: ['Contracts, payouts, and compliance telemetry in one console', 'SOC2-ready audit trails with role-aware access'],
    metric: { label: 'Operator confidence', value: '99.95% uptime & live status' },
    icon: ShieldCheckIcon,
  },
  {
    id: 'talent-insights',
    title: 'Activate the right talent instantly',
    description:
      'AI-powered matching, mentor guilds, and curated communities bring the exact specialists you need into the room.',
    highlights: ['Signals track readiness, availability, and NPS in real-time', 'Curated pods launch with analytics and shared rituals'],
    metric: { label: 'Talent activation', value: '9 days average time-to-hire' },
    icon: ChartBarIcon,
  },
];

function normalisePillars(pillars) {
  if (!Array.isArray(pillars)) {
    return [];
  }

  return pillars
    .map((pillar) => {
      if (!pillar) return null;
      const title = pillar.title ?? pillar.label ?? pillar.name;
      if (!title) return null;

      const highlights = Array.isArray(pillar.highlights)
        ? pillar.highlights.filter(Boolean)
        : pillar.highlights
        ? [pillar.highlights]
        : [];

      const metric = pillar.metric
        ? {
            label: pillar.metric.label ?? pillar.metric.title ?? 'Key metric',
            value: pillar.metric.value ?? pillar.metric.copy ?? pillar.metric.stat ?? null,
          }
        : null;

      return {
        id: pillar.id ?? title,
        title,
        description: pillar.description ?? pillar.copy ?? pillar.summary ?? null,
        highlights,
        metric,
        icon: pillar.icon ?? pillar.Icon ?? null,
        action: pillar.action ?? null,
      };
    })
    .filter(Boolean);
}

export function ValuePillars({ pillars, loading = false, analyticsMetadata = {} }) {
  const displayPillars = useMemo(() => {
    const resolved = normalisePillars(pillars);
    if (resolved.length) {
      return resolved;
    }
    return DEFAULT_PILLARS;
  }, [pillars]);

  const handleAction = (pillar) => {
    if (!pillar?.action) {
      return;
    }

    analytics.track(
      analyticsMetadata.pillarEventName ?? 'marketing_value_pillar_action',
      {
        pillarId: pillar.id,
        heroId: analyticsMetadata.heroId,
        action: pillar.action.id ?? pillar.action.href ?? pillar.action.to ?? 'cta',
      },
      { source: analyticsMetadata.source ?? 'web_marketing_site' },
    );

    if (typeof pillar.action.onClick === 'function') {
      pillar.action.onClick();
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {displayPillars.map((pillar) => {
        const PillarIcon = pillar.icon ?? SparklesIcon;
        return (
          <article
            key={pillar.id}
            className="flex h-full flex-col gap-6 rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-left shadow-[0_30px_90px_rgba(15,23,42,0.45)] backdrop-blur"
          >
            <div className="flex items-center gap-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/20 text-accent">
                <PillarIcon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{pillar.title}</h3>
                {pillar.metric ? (
                  <p className="text-sm font-medium text-accent/90">
                    {pillar.metric.label}: {pillar.metric.value}
                  </p>
                ) : null}
              </div>
            </div>

            <p className="text-sm leading-relaxed text-white/80">{pillar.description}</p>

            <ul className="space-y-2 text-sm text-white/70">
              {(pillar.highlights?.length ? pillar.highlights : DEFAULT_PILLARS.find((item) => item.id === pillar.id)?.highlights ?? []).map(
                (highlight) => (
                  <li key={highlight} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 flex-none rounded-full bg-accent" aria-hidden="true" />
                    <span>{highlight}</span>
                  </li>
                ),
              )}
            </ul>

            {pillar.action ? (
              pillar.action.href || pillar.action.to ? (
                <a
                  href={pillar.action.href ?? pillar.action.to}
                  onClick={(event) => {
                    if (pillar.action.onClick) {
                      event.preventDefault();
                      handleAction(pillar);
                    }
                  }}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-accentLight"
                >
                  {pillar.action.label ?? 'Explore pillar'}
                  <span aria-hidden="true">→</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => handleAction(pillar)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-accentLight"
                >
                  {pillar.action.label ?? 'Explore pillar'}
                  <span aria-hidden="true">→</span>
                </button>
              )
            ) : null}
          </article>
        );
      })}

      {loading
        ? Array.from({ length: Math.max(0, 3 - displayPillars.length) }).map((_, index) => (
            <div
              key={`pillar-skeleton-${index}`}
              className="hidden rounded-3xl border border-white/10 bg-white/5 p-6 lg:block"
              aria-hidden="true"
            >
              <div className="mb-4 h-12 w-12 rounded-2xl bg-white/10" />
              <div className="mb-3 h-5 w-3/4 rounded-full bg-white/10" />
              <div className="mb-6 h-4 w-full rounded-full bg-white/10" />
              <div className="space-y-3">
                <div className="h-3 w-full rounded-full bg-white/10" />
                <div className="h-3 w-5/6 rounded-full bg-white/10" />
                <div className="h-3 w-2/3 rounded-full bg-white/10" />
              </div>
            </div>
          ))
        : null}
    </div>
  );
}

ValuePillars.propTypes = {
  pillars: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string,
      highlights: PropTypes.arrayOf(PropTypes.string),
      metric: PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.string,
      }),
      icon: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
      action: PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
        href: PropTypes.string,
        to: PropTypes.string,
        onClick: PropTypes.func,
      }),
    }),
  ),
  loading: PropTypes.bool,
  analyticsMetadata: PropTypes.shape({
    source: PropTypes.string,
    heroId: PropTypes.string,
    pillarEventName: PropTypes.string,
  }),
};

ValuePillars.defaultProps = {
  pillars: undefined,
  loading: false,
  analyticsMetadata: {},
};

export default ValuePillars;
