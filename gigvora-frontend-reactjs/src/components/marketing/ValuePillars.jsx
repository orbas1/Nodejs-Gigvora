import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
import analytics from '../../services/analytics.js';

const DEFAULT_ANALYTICS_METADATA = { source: 'web_marketing_site' };

function resolvePillars(pillars) {
  if (!Array.isArray(pillars)) {
    return [];
  }

  return pillars
    .map((pillar, index) => {
      if (!pillar) return null;
      if (typeof pillar === 'string') {
        return {
          id: `pillar-${index}`,
          title: pillar,
          description: null,
        };
      }
      if (typeof pillar === 'object') {
        return {
          id: pillar.id ?? pillar.key ?? `pillar-${index}`,
          eyebrow: pillar.eyebrow ?? pillar.tagline ?? null,
          title: pillar.title ?? pillar.heading ?? pillar.label ?? null,
          description: pillar.description ?? pillar.copy ?? pillar.summary ?? null,
          metric: pillar.metric ?? pillar.highlight ?? null,
          icon: pillar.icon ?? pillar.Icon ?? null,
          cta: pillar.cta ?? null,
        };
      }
      return null;
    })
    .filter((pillar) => pillar && pillar.title);
}

function PillarAction({ pillar = null, analyticsMetadata = DEFAULT_ANALYTICS_METADATA, onSelect }) {
  if (!pillar?.cta?.label) {
    return null;
  }

  const Icon = pillar.cta.icon ?? ArrowUpRightIcon;

  const handleClick = (event) => {
    if (typeof pillar.cta.onClick === 'function') {
      pillar.cta.onClick(event);
    }
    analytics.track(
      'marketing_value_pillar_interacted',
      {
        pillarId: pillar.id,
        pillarTitle: pillar.title,
        action: pillar.cta.action ?? 'cta',
      },
      { source: analyticsMetadata.source ?? 'web_marketing_site' },
    );
    if (typeof onSelect === 'function') {
      onSelect(pillar);
    }
  };

  if (pillar.cta.href) {
    const isExternal = /^https?:/i.test(pillar.cta.href);
    const isInternal = !isExternal && pillar.cta.href.startsWith('/');
    const linkClasses =
      'group inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-accentLight';

    if (isInternal) {
      return (
        <Link
          to={pillar.cta.href}
          target={pillar.cta.target}
          rel={pillar.cta.rel}
          onClick={handleClick}
          className={linkClasses}
        >
          {pillar.cta.label}
          <Icon className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      );
    }

    return (
      <a
        href={pillar.cta.href}
        target={pillar.cta.target ?? (isExternal ? '_blank' : undefined)}
        rel={pillar.cta.rel ?? (isExternal ? 'noreferrer noopener' : undefined)}
        onClick={handleClick}
        className={linkClasses}
      >
        {pillar.cta.label}
        <Icon className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-accentLight"
    >
      {pillar.cta.label}
      <Icon className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
    </button>
  );
}

PillarAction.propTypes = {
  pillar: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    cta: PropTypes.shape({
      label: PropTypes.string,
      href: PropTypes.string,
      onClick: PropTypes.func,
      icon: PropTypes.elementType,
      action: PropTypes.string,
      target: PropTypes.string,
      rel: PropTypes.string,
    }),
  }),
  analyticsMetadata: PropTypes.shape({
    source: PropTypes.string,
  }),
  onSelect: PropTypes.func,
};

export default function ValuePillars({
  eyebrow = null,
  headline = null,
  description = null,
  pillars = [],
  loading = false,
  analyticsMetadata = DEFAULT_ANALYTICS_METADATA,
  onSelect,
  className,
}) {
  const resolvedPillars = resolvePillars(pillars);
  const showSkeleton = loading && resolvedPillars.length === 0;
  const skeletonCount = showSkeleton ? 3 : resolvedPillars.length || 3;

  return (
    <section className={clsx('mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8', className)}>
      <header className="mb-10 space-y-3 text-center lg:text-left">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">{eyebrow}</p>
        ) : null}
        {headline ? <h2 className="text-2xl font-semibold text-white sm:text-3xl">{headline}</h2> : null}
        {description ? <p className="text-sm text-white/70 sm:text-base">{description}</p> : null}
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {showSkeleton
          ? Array.from({ length: skeletonCount }).map((_, index) => (
              <div
                key={`pillar-skeleton-${index}`}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft"
                aria-hidden="true"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
                  <span className="h-6 w-6 animate-pulse rounded-full bg-accent/20" />
                </div>
                <div className="mt-6 space-y-3">
                  <span className="block h-4 w-2/3 animate-pulse rounded-full bg-white/10" />
                  <span className="block h-3 w-full animate-pulse rounded-full bg-white/10" />
                  <span className="block h-3 w-4/5 animate-pulse rounded-full bg-white/10" />
                </div>
                <div className="mt-8 h-3 w-24 animate-pulse rounded-full bg-white/10" />
              </div>
            ))
          : resolvedPillars.map((pillar) => {
              const Icon = pillar.icon ?? SparklesIcon;
              const hasMetricObject = pillar.metric && typeof pillar.metric === 'object';
              const metricValue =
                typeof pillar.metric === 'string'
                  ? pillar.metric
                  : hasMetricObject
                    ? pillar.metric.value ?? pillar.metric.amount ?? pillar.metric.metric ?? null
                    : null;
              const metricLabel = hasMetricObject ? pillar.metric.label ?? pillar.metric.subtitle ?? null : null;

              return (
                <article
                  key={pillar.id}
                  className="flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.55)] backdrop-blur"
                >
                  <div className="space-y-5">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <div className="space-y-3 text-left">
                      {pillar.eyebrow ? (
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">{pillar.eyebrow}</p>
                      ) : null}
                      <h3 className="text-lg font-semibold text-white sm:text-xl">{pillar.title}</h3>
                      {pillar.description ? <p className="text-sm text-white/70">{pillar.description}</p> : null}
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    {metricValue ? (
                      <p className="text-sm font-semibold text-white">
                        {metricValue}
                        {metricLabel ? <span className="block text-xs font-normal uppercase tracking-[0.3em] text-white/50">{metricLabel}</span> : null}
                      </p>
                    ) : null}
                    <PillarAction pillar={pillar} analyticsMetadata={analyticsMetadata} onSelect={onSelect} />
                  </div>
                </article>
              );
            })}
      </div>
    </section>
  );
}

ValuePillars.propTypes = {
  eyebrow: PropTypes.node,
  headline: PropTypes.node,
  description: PropTypes.node,
  pillars: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        id: PropTypes.string,
        eyebrow: PropTypes.string,
        title: PropTypes.string,
        description: PropTypes.string,
        metric: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.shape({
            value: PropTypes.string,
            label: PropTypes.string,
            subtitle: PropTypes.string,
          }),
        ]),
        icon: PropTypes.oneOfType([PropTypes.elementType, PropTypes.node]),
        cta: PropTypes.shape({
          label: PropTypes.string,
          href: PropTypes.string,
          onClick: PropTypes.func,
          icon: PropTypes.elementType,
          action: PropTypes.string,
          target: PropTypes.string,
          rel: PropTypes.string,
        }),
      }),
    ]),
  ),
  loading: PropTypes.bool,
  analyticsMetadata: PropTypes.shape({
    source: PropTypes.string,
  }),
  onSelect: PropTypes.func,
  className: PropTypes.string,
};
