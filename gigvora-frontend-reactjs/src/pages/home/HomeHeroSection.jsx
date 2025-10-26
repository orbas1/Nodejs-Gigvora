import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRightIcon, RocketLaunchIcon, SparklesIcon, UsersIcon } from '@heroicons/react/24/outline';
import analytics from '../../services/analytics.js';
import { HOME_GRADIENTS } from './homeThemeTokens.js';
import PublicHero from '../../components/marketing/PublicHero.jsx';
import ValuePillars from '../../components/marketing/ValuePillars.jsx';
import { valuePillars as defaultValuePillars } from '../../content/home/valuePillars.js';

const DEFAULT_HEADLINE =
  'Freelancers, employers, agencies, mentors, volunteers, new grads & career changers, clients, and job seekers move forward together.';

const DEFAULT_SUBHEADING =
  'Gigvora syncs live briefs, launchpads, and mentoring so every contributor sees the same plan and ships at the same pace.';

const FALLBACK_KEYWORDS = [
  'Product strategy gig kicked off · Lisbon',
  'Mentorship session going live · Design Ops',
  'Launchpad demo uploaded · Creation Studio',
  'Volunteering mission matched · Impact hub',
  'Growth marketing brief approved · Remote',
  'Portfolio review starting · Career changers',
  'UX research sprint recruiting · Explorer',
  'Community co-build in progress · Web3',
];

const FALLBACK_MEDIA = {
  imageUrl:
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
  alt: 'Gigvora workspace preview with creators collaborating on launch milestones.',
  posterUrl:
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
};

const FALLBACK_VALUE_PILLARS = defaultValuePillars;

function normaliseKeywords(keywords) {
  if (!Array.isArray(keywords)) {
    return [];
  }

  return keywords
    .map((keyword) => {
      if (!keyword) return null;
      if (typeof keyword === 'string') return keyword;
      if (typeof keyword === 'object') {
        return keyword.label ?? keyword.title ?? keyword.keyword ?? keyword.name ?? null;
      }
      return null;
    })
    .filter(Boolean);
}

function normaliseValuePillars(pillars) {
  if (!Array.isArray(pillars) || pillars.length === 0) {
    return { items: FALLBACK_VALUE_PILLARS, usedFallback: true };
  }

  const fallbackById = new Map(FALLBACK_VALUE_PILLARS.map((pillar) => [pillar.id, pillar]));
  const merged = pillars
    .map((pillar, index) => {
      if (!pillar) return null;

      if (typeof pillar === 'string') {
        const fallback = FALLBACK_VALUE_PILLARS[index % FALLBACK_VALUE_PILLARS.length];
        return {
          ...fallback,
          title: pillar,
          id: fallback?.id ?? `pillar-${index}`,
        };
      }

      if (typeof pillar === 'object') {
        const fallback = fallbackById.get(pillar.id) ?? FALLBACK_VALUE_PILLARS[index % FALLBACK_VALUE_PILLARS.length];
        const metricValue = pillar.metric?.value ?? pillar.metric?.amount ?? pillar.metric ?? fallback.metric?.value;
        const metricLabel =
          pillar.metric?.label ?? pillar.metric?.subtitle ?? fallback.metric?.label ?? fallback.metric?.subtitle ?? null;

        return {
          ...fallback,
          ...pillar,
          id: pillar.id ?? fallback?.id ?? `pillar-${index}`,
          eyebrow: pillar.eyebrow ?? pillar.tagline ?? fallback?.eyebrow ?? null,
          title: pillar.title ?? pillar.heading ?? pillar.label ?? fallback?.title ?? null,
          description: pillar.description ?? pillar.copy ?? pillar.summary ?? fallback?.description ?? null,
          metric:
            metricValue || metricLabel
              ? {
                  value: typeof metricValue === 'string' ? metricValue : String(metricValue ?? ''),
                  label: metricLabel ?? fallback?.metric?.label ?? fallback?.metric?.subtitle ?? null,
                }
              : fallback?.metric ?? null,
          icon: pillar.icon ?? pillar.Icon ?? fallback?.icon ?? null,
          cta: pillar.cta
            ? {
                ...fallback?.cta,
                ...pillar.cta,
                label: pillar.cta.label ?? fallback?.cta?.label ?? null,
              }
            : fallback?.cta ?? null,
        };
      }

      return null;
    })
    .filter((pillar) => pillar && pillar.title);

  if (!merged.length) {
    return { items: FALLBACK_VALUE_PILLARS, usedFallback: true };
  }

  return { items: merged, usedFallback: false };
}

export function HomeHeroSection({
  headline,
  subheading,
  keywords,
  loading = false,
  error = null,
  onClaimWorkspace,
  onBrowseOpportunities,
  productMedia,
  valuePillars,
}) {
  const [reduceMotion, setReduceMotion] = useState(false);

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

  const displayHeadline = error ? 'Stay tuned for what is next.' : headline ?? DEFAULT_HEADLINE;
  const displaySubheading =
    loading && !subheading ? 'Gathering the latest programmes…' : subheading ?? DEFAULT_SUBHEADING;

  const resolvedKeywords = normaliseKeywords(keywords);
  const hasCustomKeywords = resolvedKeywords.length > 0;
  const showTickerSkeleton = loading && !hasCustomKeywords;
  const tickerItems = hasCustomKeywords ? resolvedKeywords : FALLBACK_KEYWORDS;

  const heroMedia = useMemo(() => ({ ...FALLBACK_MEDIA, ...(productMedia ?? {}) }), [productMedia]);
  const hasProvidedVideo = Boolean(
    (productMedia?.videoSources && Array.isArray(productMedia.videoSources) && productMedia.videoSources.length) ||
      productMedia?.videoUrl,
  );
  const showMediaSkeleton = loading && !productMedia?.imageUrl && !hasProvidedVideo;
  const heroVideoSources = useMemo(() => {
    const hasVideo = Boolean(
      (heroMedia.videoSources && Array.isArray(heroMedia.videoSources) && heroMedia.videoSources.length) || heroMedia.videoUrl,
    );

    if (!hasVideo) {
      return [];
    }

    if (Array.isArray(heroMedia.videoSources) && heroMedia.videoSources.length) {
      return heroMedia.videoSources
        .map((source) =>
          source && (source.src || source.url)
            ? { src: source.src ?? source.url, type: source.type ?? 'video/mp4' }
            : null,
        )
        .filter(Boolean);
    }

    return [
      {
        src: heroMedia.videoUrl,
        type: heroMedia.videoType ?? 'video/mp4',
      },
    ];
  }, [heroMedia]);
  const canRenderVideo = heroVideoSources.length > 0;

  const { items: resolvedValuePillars, usedFallback: usingFallbackPillars } = normaliseValuePillars(valuePillars);
  const showPillarSkeleton = loading && usingFallbackPillars && (!Array.isArray(valuePillars) || valuePillars.length === 0);

  const handleClaimWorkspace = () => {
    analytics.track(
      'web_home_hero_cta',
      { action: 'claim_workspace', hasCustomHeadline: Boolean(headline) },
      { source: 'web_marketing_site' },
    );
    if (typeof onClaimWorkspace === 'function') {
      onClaimWorkspace();
    }
  };

  const handleBrowseOpportunities = () => {
    analytics.track(
      'web_home_hero_cta',
      { action: 'browse_opportunities', hasCustomHeadline: Boolean(headline) },
      { source: 'web_marketing_site' },
    );
    if (typeof onBrowseOpportunities === 'function') {
      onBrowseOpportunities();
    }
  };

  const handleValuePillarSelect = (pillar) => {
    if (!pillar) return;
    analytics.track(
      'web_home_value_pillar_clicked',
      { pillarId: pillar.id, pillarTitle: pillar.title },
      { source: 'web_marketing_site' },
    );
  };

  const headlineNode = loading && !headline && !error ? (
    <span className="block h-12 w-3/4 animate-pulse rounded-full bg-white/10 sm:h-16" />
  ) : (
    displayHeadline
  );

  const subheadingNode = loading && !headline && !error ? (
    <span className="mt-2 block h-6 w-full max-w-md animate-pulse rounded-full bg-white/10" />
  ) : (
    displaySubheading
  );

  const rightColumn = (
    <div className="relative mx-auto max-w-md space-y-6 lg:ml-auto lg:mr-0">
      <div className="absolute -top-12 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-accent/40 blur-2xl" aria-hidden="true" />

      <div className="rounded-[2rem] bg-white/95 p-8 text-slate-900 shadow-2xl ring-1 ring-white/60 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <SparklesIcon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Creation Studio draft</p>
            <p className="text-xs text-slate-500">Campaign kickoff • 78% ready</p>
          </div>
        </div>
        <div className="mt-6 space-y-3 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-900">Storyboard deck</span>
            <span className="text-xs text-slate-400">Last edit 3m ago</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-100/80 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Launchpad sync</span>
            <span className="text-xs font-medium text-slate-600">Mentor feedback pending</span>
          </div>
          <p>
            Notes stream: <span className="font-medium text-slate-900">Prototype v3 ready for review</span>
          </p>
        </div>
        <div className="mt-6 flex items-center gap-3">
          {['AG', 'JT', 'LK'].map((initials) => (
            <span
              key={initials}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent via-accentDark to-slate-900 text-sm font-semibold text-white shadow-soft"
            >
              {initials}
            </span>
          ))}
          <span className="rounded-full border border-slate-200/60 px-3 py-1 text-xs font-medium text-slate-500">+5 mentors watching</span>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/10 p-7 text-white shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Explorer opportunity card</p>
            <p className="text-xs text-slate-300">UX research mission • Volunteering</p>
          </div>
          <RocketLaunchIcon className="h-6 w-6 text-accent" aria-hidden="true" />
        </div>

        <div className="mt-6 space-y-4 text-sm text-slate-100">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-base font-semibold text-white">
              CJ
            </span>
            <div>
              <p className="font-medium text-white">Casey · product mentor</p>
              <p className="text-xs text-slate-300">Hosting live portfolio review, 12 seats remaining</p>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 text-xs text-slate-200">
            Next session: Today · 18:30 UTC · collaborative whiteboard with volunteers & clients.
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          {showMediaSkeleton ? (
            <div className="h-40 w-full animate-pulse bg-slate-800/50" aria-hidden="true" />
          ) : canRenderVideo ? (
            <figure>
              <video
                className="h-40 w-full object-cover"
                poster={heroMedia.posterUrl ?? heroMedia.imageUrl}
                autoPlay={heroMedia.autoPlay ?? true}
                muted={heroMedia.muted ?? true}
                loop={heroMedia.loop ?? true}
                playsInline
                controls={heroMedia.controls ?? false}
                preload="metadata"
                aria-label={heroMedia.alt ?? 'Gigvora product preview'}
                data-testid="home-hero-media-video"
              >
                {heroVideoSources.map((source) => (
                  <source key={`${source.src ?? source.url}-${source.type ?? 'video/mp4'}`} src={source.src ?? source.url} type={source.type ?? 'video/mp4'} />
                ))}
              </video>
              {heroMedia.caption ? (
                <figcaption className="px-4 py-3 text-xs text-slate-200/80">{heroMedia.caption}</figcaption>
              ) : null}
            </figure>
          ) : (
            <figure>
              <img
                src={heroMedia.imageUrl}
                alt={heroMedia.alt ?? 'Gigvora product preview'}
                className="h-40 w-full object-cover"
                loading="lazy"
                data-testid="home-hero-media-image"
              />
              {heroMedia.caption ? (
                <figcaption className="px-4 py-3 text-xs text-slate-200/80">{heroMedia.caption}</figcaption>
              ) : null}
            </figure>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">Community ticker</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
            Join mission
            <ArrowUpRightIcon className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <PublicHero
      eyebrow="Community OS"
      headline={headlineNode}
      subheading={subheadingNode}
      surface={{
        background: HOME_GRADIENTS.hero.background,
        overlays: HOME_GRADIENTS.hero.overlays,
        tickerFades: HOME_GRADIENTS.hero.tickerFades,
      }}
      primaryAction={{
        id: 'home-hero-primary',
        label: 'Claim your workspace',
        onClick: handleClaimWorkspace,
      }}
      secondaryAction={{
        id: 'home-hero-secondary',
        label: 'Browse live opportunities',
        onClick: handleBrowseOpportunities,
      }}
      ticker={{
        items: showTickerSkeleton ? [] : tickerItems,
        showSkeleton: showTickerSkeleton,
        skeletonCount: 4,
        icon: UsersIcon,
        reduceMotion,
        loop: true,
        ariaLabel: 'Community activity ticker',
      }}
      rightColumn={rightColumn}
      bottomSlot={
        <ValuePillars
          pillars={showPillarSkeleton ? [] : resolvedValuePillars}
          loading={showPillarSkeleton}
          analyticsMetadata={{ source: 'web_marketing_site' }}
          onSelect={handleValuePillarSelect}
        />
      }
    />
  );
}
