import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { ArrowUpRightIcon, PlayIcon } from '@heroicons/react/24/outline';
import analytics from '../../services/analytics.js';
import { ValuePillars } from './ValuePillars.jsx';

const DEFAULT_GRADIENT = {
  background:
    'relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-[0_40px_120px_rgba(15,23,42,0.55)]',
  overlays: [
    'pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.28),_transparent_55%)]',
    'pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(165,243,252,0.18),_transparent_60%)]',
  ],
  tickerFades: {
    start:
      'pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent',
    end: 'pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-slate-950 via-slate-950/60 to-transparent',
  },
};

const DEFAULT_PRIMARY_ACTION = {
  id: 'book_demo',
  label: 'Book a strategy session',
};

const DEFAULT_SECONDARY_ACTION = {
  id: 'explore_platform',
  label: 'Explore the product',
};

const DEFAULT_PERSONA_CHIPS = [
  { id: 'founders', label: 'Founders & venture studios' },
  { id: 'agencies', label: 'Agencies & collectives' },
  { id: 'mentors', label: 'Mentors & advisors' },
  { id: 'talent', label: 'Talent leads & ops' },
];

const DEFAULT_TICKER = [
  'AI-powered portfolio review in progress · Design ops',
  'Agency onboarding complete · Sydney',
  'Live mentor office hours starting · Growth marketing',
  'Launchpad milestone approved · Remote',
];

const DEFAULT_MEDIA = {
  imageUrl:
    'https://images.unsplash.com/photo-1587614295999-6c0c1a7af25b?auto=format&fit=crop&w=1280&q=80',
  alt: 'Professionals collaborating inside a Gigvora workspace dashboard.',
  posterUrl:
    'https://images.unsplash.com/photo-1587614295999-6c0c1a7af25b?auto=format&fit=crop&w=1280&q=80',
};

function normaliseTickerItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') return item;
      if (typeof item === 'object') {
        return item.label ?? item.title ?? item.keyword ?? item.text ?? null;
      }
      return null;
    })
    .filter(Boolean);
}

function normaliseAction(action, fallback) {
  if (!action) {
    return fallback;
  }

  if (typeof action === 'string') {
    return { id: action, label: action };
  }

  return {
    id: action.id ?? fallback?.id ?? action.label,
    label: action.label ?? fallback?.label ?? 'Learn more',
    onClick: action.onClick ?? fallback?.onClick ?? null,
    href: action.href ?? null,
    to: action.to ?? null,
    icon: action.icon ?? null,
  };
}

function normalisePersonaChips(chips) {
  if (!Array.isArray(chips)) {
    return [];
  }

  return chips
    .map((chip) => {
      if (!chip) return null;
      if (typeof chip === 'string') {
        return { id: chip, label: chip };
      }

      const label = chip.label ?? chip.title ?? chip.name ?? chip.text ?? null;
      if (!label) {
        return null;
      }

      return {
        id: chip.id ?? label,
        label,
      };
    })
    .filter(Boolean);
}

export function PublicHero({
  componentId = 'public-hero',
  gradient = DEFAULT_GRADIENT,
  eyebrow = 'Community OS',
  headline,
  subheading,
  fallbackHeadline = 'Coordinate every contributor in one trusted command centre.',
  fallbackSubheading =
    'Gigvora syncs launchpads, mentoring, and operations so your teams, partners, and talent see the same roadmap and ship with confidence.',
  highlightBadge = 'Trusted by operators, founders, and talent leaders',
  tickerItems,
  fallbackTickerItems = DEFAULT_TICKER,
  loading = false,
  error = null,
  primaryAction,
  secondaryAction,
  analyticsMetadata = {},
  personaChips,
  valuePillars,
  media,
  mediaCaption,
}) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const { personaHighlights, personaSource } = useMemo(() => {
    const normalised = normalisePersonaChips(personaChips);
    if (normalised.length) {
      return { personaHighlights: normalised, personaSource: 'custom' };
    }

    return { personaHighlights: DEFAULT_PERSONA_CHIPS, personaSource: 'default' };
  }, [personaChips]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updatePreference = (event) => {
      setReduceMotion(event.matches);
    };

    setReduceMotion(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updatePreference);
      return () => mediaQuery.removeEventListener('change', updatePreference);
    }

    mediaQuery.addListener(updatePreference);
    return () => mediaQuery.removeListener(updatePreference);
  }, []);

  useEffect(() => {
    analytics.track(
      analyticsMetadata.viewEventName ?? 'marketing_hero_viewed',
      {
        heroId: componentId,
        hasCustomHeadline: Boolean(headline),
        hasCustomTicker: Boolean(tickerItems?.length),
      },
      { source: analyticsMetadata.source ?? 'web_marketing_site' },
    );
  }, [
    analyticsMetadata.source,
    analyticsMetadata.viewEventName,
    componentId,
    headline,
    tickerItems?.length,
  ]);

  useEffect(() => {
    if (!personaHighlights.length) {
      return;
    }

    analytics.track(
      analyticsMetadata.personaEventName ?? 'marketing_hero_personas_resolved',
      {
        heroId: componentId,
        personas: personaHighlights.map((chip) => chip.id ?? chip.label),
        personaSource,
      },
      { source: analyticsMetadata.source ?? 'web_marketing_site' },
    );
  }, [
    analyticsMetadata.personaEventName,
    analyticsMetadata.source,
    componentId,
    personaHighlights,
    personaSource,
  ]);

  const resolvedTicker = normaliseTickerItems(tickerItems);
  const fallbackTicker = useMemo(() => {
    const normalised = normaliseTickerItems(fallbackTickerItems);
    if (normalised.length) {
      return normalised;
    }
    return DEFAULT_TICKER;
  }, [fallbackTickerItems]);
  const hasCustomTicker = resolvedTicker.length > 0;
  const tickerData = hasCustomTicker ? resolvedTicker : fallbackTicker;
  const tickerRenderList = reduceMotion ? tickerData : [...tickerData, ...tickerData];
  const showTickerSkeleton = loading && !hasCustomTicker;

  const resolvedHeadline = error ? 'Stay tuned for what is next.' : headline;
  const resolvedSubheading =
    loading && !subheading ? 'Gathering the latest programmes…' : subheading;
  const showCopySkeleton = loading && !headline && !error;

  const resolvedPrimaryAction = normaliseAction(primaryAction, DEFAULT_PRIMARY_ACTION);
  const resolvedSecondaryAction = normaliseAction(secondaryAction, DEFAULT_SECONDARY_ACTION);

  const heroMedia = useMemo(() => ({ ...DEFAULT_MEDIA, ...(media ?? {}) }), [media]);
  const hasVideo = useMemo(() => {
    if (heroMedia.videoSources && Array.isArray(heroMedia.videoSources)) {
      return heroMedia.videoSources.some((source) => source?.src || source?.url);
    }
    return Boolean(heroMedia.videoUrl);
  }, [heroMedia.videoSources, heroMedia.videoUrl]);

  const videoSources = useMemo(() => {
    if (!hasVideo) return [];
    if (Array.isArray(heroMedia.videoSources) && heroMedia.videoSources.length) {
      return heroMedia.videoSources
        .map((source) => {
          if (!source) return null;
          const src = source.src ?? source.url;
          if (!src) return null;
          return { src, type: source.type ?? 'video/mp4' };
        })
        .filter(Boolean);
    }

    if (heroMedia.videoUrl) {
      return [
        {
          src: heroMedia.videoUrl,
          type: heroMedia.videoType ?? 'video/mp4',
        },
      ];
    }

    return [];
  }, [hasVideo, heroMedia.videoSources, heroMedia.videoType, heroMedia.videoUrl]);

  const showMediaSkeleton = loading && !heroMedia.imageUrl && !hasVideo;
  const handleAction = (action, actionType) => {
    analytics.track(
      analyticsMetadata.ctaEventName ?? 'marketing_hero_cta',
      {
        heroId: componentId,
        action: action.id ?? actionType,
        label: action.label,
      },
      { source: analyticsMetadata.source ?? 'web_marketing_site' },
    );

    if (typeof action.onClick === 'function') {
      action.onClick();
    }
  };

  const renderAction = (action, variant, defaultIcon) => {
    if (!action || !action.label) {
      return null;
    }

    const content = (
      <span className="inline-flex items-center gap-2">
        <span>{action.label}</span>
        {(action.icon ?? defaultIcon) ? (
          (action.icon ?? defaultIcon)({ className: 'h-5 w-5', 'aria-hidden': true })
        ) : null}
      </span>
    );

    if (action.href) {
      return (
        <a
          key={action.id ?? action.label}
          href={action.href}
          onClick={(event) => {
            if (action.onClick) {
              event.preventDefault();
              handleAction(action, variant);
            } else {
              analytics.track(
                analyticsMetadata.ctaEventName ?? 'marketing_hero_cta',
                {
                  heroId: componentId,
                  action: action.id ?? variant,
                  label: action.label,
                },
                { source: analyticsMetadata.source ?? 'web_marketing_site' },
              );
            }
          }}
          className={clsx(
            'inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-3 text-base font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
            variant === 'primary'
              ? 'bg-accent text-white shadow-soft hover:-translate-y-0.5 hover:bg-accentDark focus-visible:ring-accent'
              : 'border border-white/30 bg-white/5 text-white hover:border-white/60 hover:bg-white/10 focus-visible:ring-white/80',
          )}
        >
          {content}
        </a>
      );
    }

    if (action.to) {
      return (
        <a
          key={action.id ?? action.label}
          href={action.to}
          onClick={(event) => {
            event.preventDefault();
            handleAction(action, variant);
          }}
          className={clsx(
            'inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-3 text-base font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
            variant === 'primary'
              ? 'bg-accent text-white shadow-soft hover:-translate-y-0.5 hover:bg-accentDark focus-visible:ring-accent'
              : 'border border-white/30 bg-white/5 text-white hover:border-white/60 hover:bg-white/10 focus-visible:ring-white/80',
          )}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        key={action.id ?? action.label}
        type="button"
        onClick={() => handleAction(action, variant)}
        className={clsx(
          'inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-3 text-base font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
          variant === 'primary'
            ? 'bg-accent text-white shadow-soft hover:-translate-y-0.5 hover:bg-accentDark focus-visible:ring-accent'
            : 'border border-white/30 bg-white/5 text-white hover:border-white/60 hover:bg-white/10 focus-visible:ring-white/80',
        )}
      >
        {content}
      </button>
    );
  };

  const renderPersonaChip = (chip) => (
    <span
      key={chip.id}
      data-hero-persona={chip.id}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 shadow-[0_10px_30px_rgba(15,23,42,0.35)]"
    >
      <span className="inline-block h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
      {chip.label}
    </span>
  );

  return (
    <section className={gradient.background}>
      <div className="absolute inset-0">
        {gradient.overlays.map((overlay) => (
          <div key={overlay} className={overlay} aria-hidden="true" />
        ))}
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-16 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:gap-20 lg:py-24">
        <div className="mx-auto max-w-2xl space-y-10 text-center lg:mx-0 lg:max-w-xl lg:text-left">
          <div className="space-y-6">
            <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-accent lg:mx-0">
              {eyebrow}
            </span>

            <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              {showCopySkeleton ? (
                <span className="block h-12 w-3/4 animate-pulse rounded-full bg-white/10 sm:h-16" />
              ) : (
                resolvedHeadline ?? fallbackHeadline
              )}
            </h1>

            <p className="text-pretty text-base text-slate-200 sm:text-xl">
              {showCopySkeleton ? (
                <span className="mt-2 block h-6 w-full max-w-md animate-pulse rounded-full bg-white/10" />
              ) : (
                resolvedSubheading ?? fallbackSubheading
              )}
            </p>

            <p className="text-sm text-white/70">
              {highlightBadge}
            </p>
          </div>

          {personaHighlights.length ? (
            <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
              {personaHighlights.map((chip) => renderPersonaChip(chip))}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center lg:justify-start">
            {renderAction(resolvedPrimaryAction, 'primary', (props) => <ArrowUpRightIcon {...props} />)}
            {renderAction(resolvedSecondaryAction, 'secondary', (props) => <ArrowUpRightIcon {...props} />)}
          </div>

          <div className="relative mt-8 h-auto min-h-[3.25rem] overflow-hidden rounded-full border border-white/10 bg-white/5 sm:mt-10 sm:h-14">
            <div className={gradient.tickerFades.start} aria-hidden="true" />
            <div className={gradient.tickerFades.end} aria-hidden="true" />

            <div
              className={clsx(
                'flex h-full items-center gap-10 whitespace-nowrap text-sm font-medium text-white/80',
                reduceMotion ? 'justify-center px-8' : 'animate-[hero-ticker_24s_linear_infinite] pr-8',
              )}
            >
              {showTickerSkeleton
                ? Array.from({ length: 4 }).map((_, index) => (
                    <span key={`skeleton-${index}`} className="block h-3 w-32 animate-pulse rounded-full bg-white/10" />
                  ))
                : tickerRenderList.map((item, index) => (
                    <span key={`${item}-${index}`} className="flex items-center gap-3">
                      <span className="inline-block h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                      {item}
                    </span>
                  ))}
            </div>
          </div>
        </div>

        <div className="relative w-full max-w-xl self-center lg:max-w-2xl">
          <div className="absolute -inset-6 rounded-[46px] bg-accent/30 blur-3xl" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-[36px] border border-white/15 bg-slate-900/60 shadow-[0_40px_120px_rgba(15,23,42,0.55)] backdrop-blur">
            {showMediaSkeleton ? (
              <div className="aspect-[4/3] w-full animate-pulse bg-white/10" aria-hidden="true" />
            ) : hasVideo && videoSources.length ? (
              <video
                data-testid={`${componentId}-media-video`}
                className="aspect-[4/3] w-full object-cover"
                autoPlay={!reduceMotion}
                muted
                playsInline
                loop
                poster={heroMedia.posterUrl}
              >
                {videoSources.map((source) => (
                  <source key={source.src} src={source.src} type={source.type} />
                ))}
              </video>
            ) : (
              <img
                data-testid={`${componentId}-media-image`}
                src={heroMedia.imageUrl}
                alt={heroMedia.alt ?? 'Hero illustration showing Gigvora in action.'}
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
            )}

            {hasVideo ? (
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent px-6 py-4 text-left">
                <div>
                  <p className="text-sm font-semibold text-white">Immersive workspace preview</p>
                  {mediaCaption ? <p className="text-xs text-white/70">{mediaCaption}</p> : null}
                </div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
                  <PlayIcon className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:pb-24">
        <ValuePillars
          pillars={valuePillars}
          loading={loading}
          analyticsMetadata={{
            ...analyticsMetadata,
            source: analyticsMetadata.source ?? 'web_marketing_site',
            heroId: componentId,
            pillarEventName: analyticsMetadata.pillarEventName,
            viewEventName: analyticsMetadata.pillarViewEventName,
          }}
        />
      </div>
    </section>
  );
}

PublicHero.propTypes = {
  componentId: PropTypes.string,
  gradient: PropTypes.shape({
    background: PropTypes.string,
    overlays: PropTypes.arrayOf(PropTypes.string),
    tickerFades: PropTypes.shape({
      start: PropTypes.string,
      end: PropTypes.string,
    }),
  }),
  eyebrow: PropTypes.string,
  headline: PropTypes.string,
  subheading: PropTypes.string,
  highlightBadge: PropTypes.string,
  fallbackHeadline: PropTypes.string,
  fallbackSubheading: PropTypes.string,
  tickerItems: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        label: PropTypes.string,
        title: PropTypes.string,
        keyword: PropTypes.string,
        text: PropTypes.string,
      }),
    ]),
  ),
  fallbackTickerItems: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        label: PropTypes.string,
        title: PropTypes.string,
        keyword: PropTypes.string,
        text: PropTypes.string,
      }),
    ]),
  ),
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  primaryAction: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string,
      onClick: PropTypes.func,
      href: PropTypes.string,
      to: PropTypes.string,
      icon: PropTypes.func,
    }),
  ]),
  secondaryAction: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string,
      onClick: PropTypes.func,
      href: PropTypes.string,
      to: PropTypes.string,
      icon: PropTypes.func,
    }),
  ]),
  analyticsMetadata: PropTypes.shape({
    source: PropTypes.string,
    viewEventName: PropTypes.string,
    ctaEventName: PropTypes.string,
    pillarEventName: PropTypes.string,
    personaEventName: PropTypes.string,
    pillarViewEventName: PropTypes.string,
  }),
  personaChips: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
        title: PropTypes.string,
        name: PropTypes.string,
        text: PropTypes.string,
      }),
    ]),
  ),
  valuePillars: PropTypes.arrayOf(PropTypes.object),
  media: PropTypes.shape({
    imageUrl: PropTypes.string,
    alt: PropTypes.string,
    posterUrl: PropTypes.string,
    videoUrl: PropTypes.string,
    videoType: PropTypes.string,
    videoSources: PropTypes.arrayOf(
      PropTypes.shape({
        src: PropTypes.string,
        url: PropTypes.string,
        type: PropTypes.string,
      }),
    ),
  }),
  mediaCaption: PropTypes.string,
};

PublicHero.defaultProps = {
  componentId: 'public-hero',
  gradient: DEFAULT_GRADIENT,
  eyebrow: 'Community OS',
  headline: undefined,
  subheading: undefined,
  highlightBadge: 'Trusted by operators, founders, and talent leaders',
  fallbackHeadline: 'Coordinate every contributor in one trusted command centre.',
  fallbackSubheading:
    'Gigvora syncs launchpads, mentoring, and operations so your teams, partners, and talent see the same roadmap and ship with confidence.',
  tickerItems: undefined,
  fallbackTickerItems: DEFAULT_TICKER,
  loading: false,
  error: null,
  primaryAction: DEFAULT_PRIMARY_ACTION,
  secondaryAction: DEFAULT_SECONDARY_ACTION,
  analyticsMetadata: {},
  personaChips: undefined,
  valuePillars: undefined,
  media: undefined,
  mediaCaption: undefined,
};

export default PublicHero;
