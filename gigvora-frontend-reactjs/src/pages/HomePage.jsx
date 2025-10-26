import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSession from '../hooks/useSession.js';
import useHomeExperience from '../hooks/useHomeExperience.js';
import analytics from '../services/analytics.js';
import MarketingLayout from '../components/marketing/MarketingLayout.jsx';
import ProductTour from '../components/marketing/ProductTour.jsx';
import PricingTable from '../components/marketing/PricingTable.jsx';
import { testimonials as defaultTestimonials, joinCommunityCta as defaultJoinCommunityCta } from '../content/home/testimonials.js';

import {
  HomeHeroSection,
  CommunityPulseSection,
  PersonaJourneysSection,
  CommunitySpotlightsSection,
  ExplorerShowcaseSection,
  TestimonialsSection,
  MarketplaceLaunchesSection,
  CreationStudioSection,
  CreationStudioWorkflowSection,
  FeesShowcaseSection,
  JoinCommunitySection,
  CollaborationToolkitSection,
  ClosingConversionSection,
  OperationsTrustSection,
} from './home/index.js';

export const DEFAULT_COMMUNITY_STATS = [
  { label: 'Global specialists', value: '12,400+' },
  { label: 'Average NPS', value: '68' },
  { label: 'Completion rate', value: '97%' },
];

function normalizeTestimonialsSection(section) {
  if (!section || typeof section !== 'object') {
    return null;
  }

  if (Array.isArray(section)) {
    return { items: section };
  }

  const heroSource = section.hero && typeof section.hero === 'object' ? section.hero : section;
  const items = Array.isArray(section.items)
    ? section.items
    : Array.isArray(section.testimonials)
    ? section.testimonials
    : Array.isArray(section.quotes)
    ? section.quotes
    : [];

  const hero = heroSource && typeof heroSource === 'object'
    ? {
        eyebrow: heroSource.eyebrow ?? heroSource.label,
        heading: heroSource.heading ?? heroSource.title,
        description: heroSource.description ?? heroSource.summary,
        stats: Array.isArray(heroSource.stats) ? heroSource.stats : heroSource.metrics,
        logos: Array.isArray(heroSource.logos) ? heroSource.logos : undefined,
      }
    : undefined;

  return { hero, items };
}

function normalizeClosingCta(cta) {
  if (!cta || typeof cta !== 'object') {
    return null;
  }
  return cta;
}

function resolveMarketingContent(homeData) {
  const marketingSource = homeData?.marketing && typeof homeData.marketing === 'object' ? homeData.marketing : {};
  const marketingBaseline =
    homeData?.settings?.marketing && typeof homeData.settings.marketing === 'object'
      ? homeData.settings.marketing
      : {};
  const pageContent = homeData?.pageContent && typeof homeData.pageContent === 'object' ? homeData.pageContent : {};
  const pageMarketing = pageContent?.marketing && typeof pageContent.marketing === 'object' ? pageContent.marketing : {};

  const pickList = (primary, secondary, fallback) => {
    if (Array.isArray(primary) && primary.length) {
      return primary;
    }
    if (Array.isArray(secondary) && secondary.length) {
      return secondary;
    }
    if (Array.isArray(fallback) && fallback.length) {
      return fallback;
    }
    return [];
  };

  const pickObject = (primary, secondary, fallback) => {
    if (primary && typeof primary === 'object') {
      return primary;
    }
    if (secondary && typeof secondary === 'object') {
      return secondary;
    }
    if (fallback && typeof fallback === 'object') {
      return fallback;
    }
    return {};
  };

  const pricingSource = marketingSource.pricing ?? {};
  const pricingSecondary = pageMarketing.pricing ?? {};
  const pricingBaseline = marketingBaseline.pricing ?? {};

  return {
    announcement: pickObject(
      marketingSource.announcement,
      pageContent.marketingAnnouncement ?? pageMarketing.announcement,
      marketingBaseline.announcement ?? null,
    ),
    trustBadges: pickList(
      marketingSource.trustBadges,
      pageMarketing.trustBadges ?? pageContent.trustBadges,
      marketingBaseline.trustBadges ?? [],
    ),
    personas: pickList(
      marketingSource.personas,
      pageMarketing.personas ?? pageContent.marketingPersonas,
      marketingBaseline.personas ?? [],
    ),
    productTour: {
      steps: pickList(
        marketingSource?.productTour?.steps ?? marketingSource.productTourSteps,
        pageMarketing?.productTour?.steps ?? pageContent.productTourSteps,
        marketingBaseline?.productTour?.steps ?? [],
      ),
    },
    pricing: {
      plans: pickList(pricingSource.plans, pricingSecondary.plans ?? pageContent.pricingPlans, pricingBaseline.plans ?? []),
      featureMatrix: pickList(
        pricingSource.featureMatrix,
        pricingSecondary.featureMatrix ?? pageContent.pricingFeatureMatrix,
        pricingBaseline.featureMatrix ?? [],
      ),
      metrics: pickList(
        pricingSource.metrics,
        pricingSecondary.metrics ?? pageContent.pricingMetrics,
        pricingBaseline.metrics ?? [],
      ),
    },
    testimonials:
      normalizeTestimonialsSection(marketingSource.testimonials) ||
      normalizeTestimonialsSection(pageMarketing.testimonials ?? pageContent.testimonials) ||
      normalizeTestimonialsSection(marketingBaseline.testimonials) ||
      null,
    closingCta:
      normalizeClosingCta(marketingSource.closingCta ?? marketingSource.ctaBand) ||
      normalizeClosingCta(pageMarketing.closingCta ?? pageContent.closingCta ?? pageContent.joinCommunity) ||
      normalizeClosingCta(marketingBaseline.closingCta) ||
      null,
  };
}

function normaliseTourMedia(media = {}) {
  if (!media || typeof media !== 'object') {
    return undefined;
  }

  if (media.type === 'video') {
    const sources = Array.isArray(media.sources) ? media.sources : media.src ? [{ src: media.src }] : [];
    return {
      type: 'video',
      sources: sources
        .map((item) =>
          item?.src
            ? {
                src: item.src,
                type: item.type ?? 'video/mp4',
              }
            : null,
        )
        .filter(Boolean),
      poster: media.poster ?? media.posterUrl ?? undefined,
      autoPlay: media.autoPlay ?? true,
      muted: media.muted ?? true,
      loop: media.loop ?? true,
      controls: media.controls ?? false,
    };
  }

  if (media.type === 'image' || media.src) {
    return {
      type: 'image',
      src: media.src,
      alt: media.alt ?? media.altText ?? 'Product tour preview',
    };
  }

  return undefined;
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildCta(cta, navigate) {
  if (!cta || typeof cta !== 'object') {
    return null;
  }

  const label = cta.label ?? cta.title;
  if (!label) {
    return null;
  }

  const action = cta.action ?? cta.event;
  const href = cta.href ?? cta.url ?? null;
  const route = !href ? cta.route ?? cta.path ?? null : null;

  const payload = {
    ...cta,
    label,
    ...(action ? { action } : {}),
    ...(href ? { href } : {}),
    ...(route ? { route } : {}),
  };

  if (typeof cta.onClick === 'function') {
    payload.onClick = (context = {}) => cta.onClick({ ...context, navigate });
    return payload;
  }

  payload.onClick = () => {
    if (href) {
      if (/^https?:/i.test(href)) {
        if (typeof window !== 'undefined' && typeof window.open === 'function') {
          window.open(href, '_blank', 'noopener,noreferrer');
          return;
        }
      }
      if (navigate) {
        navigate(href);
      }
      return;
    }

    if (route && navigate) {
      navigate(route);
    }
  };

  return payload;
}

export default function HomePage() {
  const { isAuthenticated } = useSession();
  const navigate = useNavigate();
  const { data: homeData, loading: homeLoading, error: homeError, refresh, fromCache, lastUpdated } =
    useHomeExperience({ enabled: !isAuthenticated });

  const marketingContent = useMemo(
    () => resolveMarketingContent(homeData),
    [homeData?.marketing, homeData?.settings?.marketing, homeData?.pageContent],
  );

  const heroHeadline = homeData?.settings?.heroHeadline?.trim() ? homeData.settings.heroHeadline : undefined;
  const heroSubheading = homeData?.settings?.heroSubheading?.trim()
    ? homeData.settings.heroSubheading
    : undefined;
  const heroMedia = homeData?.settings?.heroMedia;

  const heroKeywords = useMemo(() => {
    if (!Array.isArray(homeData?.settings?.heroKeywords)) {
      return undefined;
    }

    const items = homeData.settings.heroKeywords
      .map((keyword) => {
        if (!keyword) return null;
        if (typeof keyword === 'string') return keyword;
        if (typeof keyword === 'object') {
          return keyword.label ?? keyword.title ?? keyword.keyword ?? keyword.name ?? null;
        }
        return null;
      })
      .filter(Boolean);

    return items.length ? items : undefined;
  }, [homeData?.settings?.heroKeywords]);

  const communityStats = useMemo(() => {
    if (!Array.isArray(homeData?.settings?.communityStats) || !homeData.settings.communityStats.length) {
      return DEFAULT_COMMUNITY_STATS;
    }
    return homeData.settings.communityStats.map((stat) => ({
      label: stat.label ?? stat.name ?? 'Community stat',
      value: stat.value ?? stat.metric ?? '—',
    }));
  }, [homeData?.settings?.communityStats]);

  const personaJourneys = useMemo(() => {
    const settingsPersonas = Array.isArray(homeData?.settings?.personaJourneys)
      ? homeData.settings.personaJourneys
      : [];
    const pagePersonas = Array.isArray(homeData?.pageContent?.personaJourneys)
      ? homeData.pageContent.personaJourneys
      : [];

    if (settingsPersonas.length || pagePersonas.length) {
      return [...settingsPersonas, ...pagePersonas].filter(Boolean);
    }

    const objectLike = homeData?.pageContent?.personaJourneys ?? homeData?.settings?.personaJourneys;
    if (objectLike && typeof objectLike === 'object') {
      return objectLike;
    }

    return undefined;
  }, [homeData?.pageContent?.personaJourneys, homeData?.settings?.personaJourneys]);

  const personaMetrics = useMemo(() => {
    if (homeData?.settings?.personaMetrics) {
      return homeData.settings.personaMetrics;
    }
    if (homeData?.pageContent?.personaMetrics) {
      return homeData.pageContent.personaMetrics;
    }
    if (homeData?.metrics?.personas) {
      return homeData.metrics.personas;
    }
    return undefined;
  }, [homeData?.metrics?.personas, homeData?.pageContent?.personaMetrics, homeData?.settings?.personaMetrics]);

  const trendingCreations = useMemo(
    () =>
      (Array.isArray(homeData?.creations) ? homeData.creations : [])
        .filter((item) => item?.title && item?.type)
        .slice(0, 6),
    [homeData?.creations],
  );

  const marketingAnnouncement = useMemo(() => {
    const announcement = marketingContent.announcement ?? {};
    const cta = buildCta(announcement.cta, navigate);
    return {
      title: announcement.title ?? 'Latest release',
      description: announcement.description ?? announcement.copy ?? '',
      ...(cta ? { cta } : {}),
    };
  }, [marketingContent.announcement, navigate]);

  const marketingTrustBadges = useMemo(() => {
    const badges = ensureArray(marketingContent.trustBadges);
    return badges.length ? badges : undefined;
  }, [marketingContent.trustBadges]);

  const marketingPersonas = useMemo(() => {
    const personas = ensureArray(marketingContent.personas);
    return personas.map((persona, index) => {
      const id = persona.id ?? persona.key ?? persona.slug ?? `persona-${index}`;
      return {
        id,
        key: persona.key ?? persona.id ?? persona.slug ?? id,
        label: persona.label ?? persona.name ?? persona.title ?? 'Persona',
        description: persona.description ?? persona.summary ?? persona.copy ?? '',
        route: persona.route ?? persona.href ?? null,
      };
    });
  }, [marketingContent.personas]);

  const [selectedPersonaId, setSelectedPersonaId] = useState(() => marketingPersonas[0]?.id ?? 'founder');

  useEffect(() => {
    if (!marketingPersonas.length) {
      setSelectedPersonaId('founder');
      return;
    }

    if (!marketingPersonas.some((persona) => persona.id === selectedPersonaId)) {
      setSelectedPersonaId(marketingPersonas[0].id);
    }
  }, [marketingPersonas, selectedPersonaId]);

  const marketingTourSteps = useMemo(() => {
    const steps = ensureArray(marketingContent.productTour?.steps);
    return steps.map((step, index) => {
      const id = step.id ?? step.key ?? step.slug ?? `tour-${index}`;
      return {
        id,
        label: step.label ?? step.shortTitle ?? `Step ${index + 1}`,
        title: step.title ?? step.headline ?? 'Experience Gigvora in motion',
        summary: step.summary ?? step.description ?? '',
        personaHighlights: step.personaHighlights ?? step.highlightsByPersona ?? {},
        highlights: ensureArray(step.highlights),
        metrics: step.metrics && typeof step.metrics === 'object' ? step.metrics : {},
        media: normaliseTourMedia(step.media),
        cta: buildCta(step.cta, navigate) ?? undefined,
        secondaryCta: buildCta(step.secondaryCta, navigate) ?? undefined,
      };
    });
  }, [marketingContent.productTour?.steps, navigate]);

  const marketingPricingPlans = useMemo(() => {
    return ensureArray(marketingContent.pricing?.plans).map((plan, index) => ({
      id: plan.id ?? plan.key ?? plan.slug ?? `plan-${index}`,
      name: plan.name ?? plan.title ?? 'Plan',
      headline: plan.headline ?? plan.description ?? '',
      pricing: plan.pricing ?? {},
      cadenceLabel: plan.cadenceLabel ?? undefined,
      savings: plan.savings ?? {},
      features: ensureArray(plan.features),
      metrics: plan.metrics && typeof plan.metrics === 'object' ? plan.metrics : {},
      recommended: Boolean(plan.recommended),
      ctaLabel: plan.ctaLabel ?? undefined,
    }));
  }, [marketingContent.pricing?.plans]);

  const marketingPricingFeatureMatrix = useMemo(() => {
    const matrix = ensureArray(marketingContent.pricing?.featureMatrix);
    return matrix.length ? matrix : undefined;
  }, [marketingContent.pricing?.featureMatrix]);

  const marketingPricingMetrics = useMemo(() => {
    const metrics = ensureArray(marketingContent.pricing?.metrics);
    return metrics.length ? metrics : undefined;
  }, [marketingContent.pricing?.metrics]);

  const marketingTestimonialsSection = useMemo(() => {
    return marketingContent.testimonials ?? null;
  }, [marketingContent.testimonials]);

  const marketingClosingCta = useMemo(() => {
    return marketingContent.closingCta ?? null;
  }, [marketingContent.closingCta]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/feed', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleJoinAsTalent = useCallback(() => {
    navigate('/register?intent=talent');
  }, [navigate]);

  const handleHireCrew = useCallback(() => {
    navigate('/projects/create');
  }, [navigate]);

  const handleExploreMentorship = useCallback(() => {
    navigate('/mentors');
  }, [navigate]);

  const handleGuidelines = useCallback(() => {
    navigate('/community-guidelines');
  }, [navigate]);

  const handlePersonaSelect = useCallback(
    (persona) => {
      if (!persona) {
        return;
      }

      const personaKey = persona.key ?? persona.id ?? persona.slug ?? null;
      if (personaKey) {
        analytics.track(
          'web_home_persona_card_clicked',
          {
            persona: personaKey,
            route: persona.route,
          },
          { source: 'web_marketing_site' },
        );
        setSelectedPersonaId(personaKey);
      }
    },
    [],
  );

  const handleMarketingPersonaSwitch = useCallback((persona) => {
    const personaKey = persona?.id ?? persona?.key ?? persona;
    if (!personaKey) {
      return;
    }

    setSelectedPersonaId(personaKey);
    analytics.track(
      'web_home_marketing_persona_switched',
      {
        persona: personaKey,
      },
      { source: 'web_marketing_site' },
    );
  }, []);

  const handlePricingPlanSelected = useCallback(
    ({ plan, action }) => {
      if (action === 'primary') {
        if (plan.id === 'enterprise') {
          navigate('/contact?topic=enterprise');
        } else {
          navigate('/register?intent=company');
        }
      } else {
        navigate('/contact?topic=pricing');
      }
    },
    [navigate],
  );

  return (
    <MarketingLayout
      hero={{
        id: 'marketing-home',
        node: (
          <HomeHeroSection
            headline={heroHeadline}
            subheading={heroSubheading}
            keywords={heroKeywords}
            loading={homeLoading}
            error={homeError}
            onClaimWorkspace={() => navigate('/register')}
            onBrowseOpportunities={() => navigate('/gigs')}
            productMedia={heroMedia}
          />
        ),
      }}
      announcement={marketingAnnouncement}
      metrics={communityStats}
      trustBadges={marketingTrustBadges}
      personaSwitcher=
        marketingPersonas.length
          ? {
              personas: marketingPersonas,
              selectedId: selectedPersonaId,
              onSelect: handleMarketingPersonaSwitch,
            }
          : null
      insight="Switch personas to tailor recommended modules, metrics, and case studies across the funnel."
      analyticsMetadata={{ source: 'web_marketing_site' }}
    >
      <ProductTour
        steps={marketingTourSteps}
        personas={marketingPersonas}
        initialPersonaId={selectedPersonaId}
        analyticsMetadata={{ source: 'web_marketing_site' }}
      />
      <div className="flex flex-col">
        <CommunityPulseSection
          loading={homeLoading}
          error={homeError}
          fromCache={fromCache}
          lastUpdated={lastUpdated}
          onRefresh={() => refresh().catch(() => {})}
          statusLabel={isAuthenticated ? 'Redirecting to live experience' : 'Live community snapshot'}
          homeData={homeData}
        />
        <OperationsTrustSection homeData={homeData} loading={homeLoading} error={homeError} />
        <PersonaJourneysSection
          loading={homeLoading}
          error={homeError}
          onSelectPersona={handlePersonaSelect}
          personas={personaJourneys}
          personaMetrics={personaMetrics}
        />
        <CommunitySpotlightsSection loading={homeLoading} error={homeError} />
        <ExplorerShowcaseSection loading={homeLoading} error={homeError} creations={homeData?.creations} />
        <TestimonialsSection
          loading={homeLoading}
          error={homeError}
          testimonials={marketingTestimonialsSection}
        />
        <MarketplaceLaunchesSection
          loading={homeLoading}
          error={homeError}
          communityStats={communityStats}
          trendingCreations={trendingCreations}
        />
        <CollaborationToolkitSection />
        <CreationStudioWorkflowSection />
        <CreationStudioSection loading={homeLoading} error={homeError} />
        <PricingTable
          plans={marketingPricingPlans}
          featureMatrix={marketingPricingFeatureMatrix}
          metrics={marketingPricingMetrics}
          analyticsMetadata={{ source: 'web_marketing_site' }}
          onPlanSelected={handlePricingPlanSelected}
        />
        <FeesShowcaseSection />
        <ClosingConversionSection
          onJoinAsTalentClick={handleJoinAsTalent}
          onHireCrewClick={handleHireCrew}
          onExploreMentorshipClick={handleExploreMentorship}
          onGuidelinesClick={handleGuidelines}
        />
        <JoinCommunitySection cta={marketingClosingCta} />
      </div>
    </MarketingLayout>
  );
}
