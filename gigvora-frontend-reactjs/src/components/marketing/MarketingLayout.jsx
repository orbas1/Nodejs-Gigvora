import { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import analytics from '../../services/analytics.js';

const DEFAULT_TRUST_BADGES = [
  { label: 'SOC2 controls monitored', description: 'Independent audits and 24/7 compliance telemetry.' },
  { label: 'Global mentor guild', description: '7,800+ curated mentors spanning 42 countries.' },
  { label: 'Enterprise SLA', description: '99.95% uptime with dedicated customer success.' },
];

function normaliseMetrics(metrics) {
  if (!Array.isArray(metrics)) {
    return [];
  }

  return metrics
    .map((metric) => {
      if (!metric) return null;
      if (typeof metric === 'string') {
        return { label: metric, value: metric };
      }

      const label = metric.label ?? metric.title ?? metric.name ?? null;
      const value = metric.value ?? metric.metric ?? null;
      if (!label && !value) {
        return null;
      }

      return {
        id: metric.id ?? label ?? value ?? undefined,
        label: label ?? value,
        value: value ?? label,
        helper: metric.helper ?? metric.description ?? null,
      };
    })
    .filter(Boolean);
}

export default function MarketingLayout({
  hero,
  announcement,
  metrics,
  trustBadges,
  personaSwitcher,
  insight,
  analyticsMetadata = {},
  children,
  className,
}) {
  const displayMetrics = useMemo(() => {
    const resolved = normaliseMetrics(metrics);
    if (resolved.length) {
      return resolved;
    }
    return [
      { id: 'global-placements', label: 'Global placements', value: '3,400+', helper: 'Active roles filled across 62 industries.' },
      { id: 'avg-time-to-hire', label: 'Average time to hire', value: '9 days', helper: 'Full funnel orchestration cuts decision cycles.' },
      { id: 'mentor-nps', label: 'Mentor NPS', value: '71', helper: 'Trusted by leaders mentoring founders and operators.' },
    ];
  }, [metrics]);

  const displayBadges = useMemo(() => {
    if (!Array.isArray(trustBadges) || trustBadges.length === 0) {
      return DEFAULT_TRUST_BADGES;
    }

    return trustBadges
      .map((badge) => {
        if (!badge) return null;
        if (typeof badge === 'string') {
          return { label: badge, description: null };
        }
        return {
          id: badge.id ?? badge.label ?? badge.name ?? undefined,
          label: badge.label ?? badge.name ?? badge.title ?? 'Trust signal',
          description: badge.description ?? badge.copy ?? null,
        };
      })
      .filter(Boolean);
  }, [trustBadges]);

  useEffect(() => {
    analytics.track(
      'marketing_layout_viewed',
      {
        layoutId: hero?.id ?? 'marketing-home',
        metricCount: displayMetrics.length,
        trustSignals: displayBadges.length,
        hasPersonaSwitcher: Boolean(personaSwitcher?.personas?.length),
      },
      { source: analyticsMetadata.source ?? 'web_marketing_site' },
    );
  }, [analyticsMetadata.source, displayBadges.length, displayMetrics.length, hero?.id, personaSwitcher?.personas?.length]);

  const handlePersonaSelect = (persona) => {
    analytics.track(
      'marketing_layout_persona_selected',
      {
        layoutId: hero?.id ?? 'marketing-home',
        persona: persona?.id ?? persona?.key ?? persona,
      },
      { source: analyticsMetadata.source ?? 'web_marketing_site' },
    );

    if (personaSwitcher?.onSelect) {
      personaSwitcher.onSelect(persona);
    }
  };

  const heroNode = hero?.node ?? null;

  return (
    <main className={clsx('relative isolate bg-slate-950 text-white', className)}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.24),_transparent_65%)]"
        aria-hidden="true"
      />

      {announcement ? (
        <div className="border-b border-white/10 bg-white/5">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-4 text-center text-sm text-white/80 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold uppercase tracking-[0.3em] text-accent">{announcement.title}</p>
            <p className="text-pretty text-white/70 sm:text-left">{announcement.description}</p>
            {announcement.cta ? (
              <button
                type="button"
                onClick={() => {
                  analytics.track(
                    'marketing_layout_announcement_clicked',
                    {
                      layoutId: hero?.id ?? 'marketing-home',
                      action: announcement.cta.action ?? 'learn_more',
                    },
                    { source: analyticsMetadata.source ?? 'web_marketing_site' },
                  );
                  announcement.cta.onClick?.();
                }}
                className="inline-flex items-center justify-center rounded-full border border-white/30 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:border-white/60 hover:bg-white/10"
              >
                {announcement.cta.label ?? 'Explore'}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <section className="relative">
        {heroNode}
      </section>

      <section className="relative border-y border-white/5 bg-white/5">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-12 sm:grid-cols-3">
          {displayMetrics.map((metric) => (
            <article
              key={metric.id ?? metric.label}
              className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
              {metric.helper ? <p className="mt-2 text-sm text-white/70">{metric.helper}</p> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="relative">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">Trusted across growth stages</p>
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">Operators trust Gigvora with revenue-critical launches.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {displayBadges.map((badge) => (
              <div key={badge.id ?? badge.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
                <p className="text-sm font-semibold text-white">{badge.label}</p>
                {badge.description ? <p className="mt-2 text-xs text-white/70">{badge.description}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {personaSwitcher?.personas?.length ? (
        <section className="relative border-y border-white/5 bg-slate-900/40">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">Personalise the story</p>
              <h3 className="text-2xl font-semibold text-white">
                Choose the persona that mirrors your role and see how Gigvora accelerates your roadmap.
              </h3>
              {insight ? <p className="text-sm text-white/70">{insight}</p> : null}
            </div>
            <div className="flex flex-wrap gap-3">
              {personaSwitcher.personas.map((persona) => {
                const isActive = persona.id === personaSwitcher.selectedId;
                return (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => handlePersonaSelect(persona)}
                    className={clsx(
                      'rounded-full border px-5 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                      isActive
                        ? 'border-accent bg-accent text-slate-950 shadow-soft'
                        : 'border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10',
                    )}
                    aria-pressed={isActive}
                  >
                    {persona.label ?? persona.name ?? persona.title ?? 'Persona'}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <div className="relative">{children}</div>
    </main>
  );
}

MarketingLayout.propTypes = {
  hero: PropTypes.shape({
    id: PropTypes.string,
    node: PropTypes.node,
  }).isRequired,
  announcement: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    cta: PropTypes.shape({
      label: PropTypes.string,
      action: PropTypes.string,
      onClick: PropTypes.func,
    }),
  }),
  metrics: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
        title: PropTypes.string,
        name: PropTypes.string,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        metric: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        helper: PropTypes.string,
        description: PropTypes.string,
      }),
    ]),
  ),
  trustBadges: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
        name: PropTypes.string,
        title: PropTypes.string,
        description: PropTypes.string,
        copy: PropTypes.string,
      }),
    ]),
  ),
  personaSwitcher: PropTypes.shape({
    personas: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        key: PropTypes.string,
        label: PropTypes.string,
        name: PropTypes.string,
        title: PropTypes.string,
      }),
    ),
    selectedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onSelect: PropTypes.func,
  }),
  insight: PropTypes.string,
  analyticsMetadata: PropTypes.shape({
    source: PropTypes.string,
  }),
  children: PropTypes.node,
  className: PropTypes.string,
};

MarketingLayout.defaultProps = {
  announcement: null,
  metrics: null,
  trustBadges: null,
  personaSwitcher: null,
  insight: null,
  analyticsMetadata: {},
  children: null,
  className: undefined,
};
