import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSession from '../hooks/useSession.js';
import useHomeExperience from '../hooks/useHomeExperience.js';
import analytics from '../services/analytics.js';
import MarketingLayout from '../components/marketing/MarketingLayout.jsx';
import ProductTour from '../components/marketing/ProductTour.jsx';
import PricingTable from '../components/marketing/PricingTable.jsx';

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

const DEFAULT_PRODUCT_TOUR_PERSONAS = [
  {
    id: 'founder',
    label: 'Founder / Executive',
    description: 'Track investor updates, customer pilots, and hiring rituals without losing momentum.',
  },
  {
    id: 'operations',
    label: 'Operations leader',
    description: 'Automate reviews, compliance, and launch cadences while staying ahead of blockers.',
  },
  {
    id: 'mentor',
    label: 'Mentor & advisor',
    description: 'Coach multiple cohorts with shared agendas, analytics, and follow-up workflows.',
  },
];

const DEFAULT_PRODUCT_TOUR_STEPS = [
  {
    id: 'command-centre',
    label: 'Command',
    title: 'Command centre keeps every initiative accountable',
    summary:
      'Live dashboards blend hiring, mentoring, and marketing rituals into one decision theatre so leaders focus on outcomes instead of alignment.',
    personaHighlights: {
      founder: [
        'Executive-ready pulse combining pipeline, retention, and runway signals.',
        'Boardroom export with narrative context assembled automatically.',
        'Investor updates sync with the same truth operators use daily.',
      ],
      operations: [
        'Program kanbans, OKRs, and risk logs refresh in real time.',
        'Compliance watchlists trigger checklists and guardrail alerts.',
        'Deep links into workstreams, retros, and playbooks without context switching.',
      ],
      mentor: [
        'Mentor scorecards roll up wins, risks, and outstanding actions.',
        'AI summaries capture cohort sentiment for quick triage.',
        'Spotlight nominations surface top mentees for marketing and advocacy.',
      ],
    },
    metrics: {
      timeToValue: 'Under 8 minutes to configure',
      automation: '82% of narrative updates auto-generated',
      collaboration: 'Execs, ops leads, mentor guild',
    },
    media: {
      type: 'video',
      poster:
        'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
      sources: [
        {
          src: 'https://cdn.gigvora.com/marketing/product-tour/command-centre.mp4',
          type: 'video/mp4',
        },
      ],
    },
    cta: {
      label: 'Book a strategy review',
      action: 'book_strategy',
    },
    secondaryCta: {
      label: 'Download executive brief',
      action: 'download_brief',
    },
  },
  {
    id: 'launch-blueprints',
    label: 'Launch',
    title: 'Launch blueprints orchestrate go-to-market in hours',
    summary:
      'Drag-and-drop launch kits bundle marketing pages, ads, nurture flows, and success metrics so campaigns deploy on-brand every time.',
    personaHighlights: {
      founder: [
        'Spin up campaign crews with vetted playbooks and ROI guardrails.',
        'Real-time approvals keep legal, security, and finance in the same thread.',
        'Launch retros feed data into investor updates automatically.',
      ],
      operations: [
        'Automations assign intake forms, QA checklists, and distribution tasks.',
        'Cross-team dependencies surface before blockers land in standups.',
        'Scenario planner forecasts staffing and budget needs instantly.',
      ],
      mentor: [
        'Cohort-ready templates share best practices with each mentee.',
        'Mentors tag teachable moments and spin into micro-learnings.',
        'Spotlight stories export straight to community marketing hubs.',
      ],
    },
    metrics: {
      timeToValue: 'Launch in 48 hours',
      automation: '120+ workflow recipes',
      collaboration: 'Marketing, sales, product squads',
    },
    media: {
      type: 'image',
      src: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=80',
      alt: 'Launch blueprint builder showing tasks and automation timeline.',
    },
    cta: {
      label: 'Start a pilot launch',
      action: 'start_pilot',
    },
  },
  {
    id: 'mentorship',
    label: 'Mentorship',
    title: 'Mentor workflows deliver measurable uplift',
    summary:
      'Mentor lounges combine agendas, recordings, feedback, and growth plans so talent keeps compounding gains while executives see ROI.',
    personaHighlights: {
      founder: [
        'Invite mentors to mission-critical launches with context preloaded.',
        'Track mentee outcomes alongside revenue, hiring, and retention goals.',
      ],
      operations: [
        'Match mentors to mentees using live skills graph and availability.',
        'Automated nudges keep sessions on schedule and logged for compliance.',
      ],
      mentor: [
        'One-click recap pushes highlights to mentees and sponsors.',
        'Resource library suggests next best actions per persona.',
      ],
    },
    metrics: {
      timeToValue: 'First mentorship cohort in 5 days',
      automation: '65% of follow-ups auto-scheduled',
      collaboration: 'Mentors, mentees, sponsors',
    },
    media: {
      type: 'image',
      src: 'https://images.unsplash.com/photo-1521737604893-26c0ef3b4841?auto=format&fit=crop&w=1200&q=80',
      alt: 'Mentor workspace with shared agendas and analytics.',
    },
    cta: {
      label: 'Meet the mentor guild',
      action: 'mentor_directory',
    },
    secondaryCta: {
      label: 'View mentorship outcomes',
      action: 'view_outcomes',
    },
  },
  {
    id: 'insights',
    label: 'Insights',
    title: 'Insights studio broadcasts wins across every channel',
    summary:
      'Automated storytelling packages, social tiles, and stakeholder recaps transform raw telemetry into moments that attract talent and revenue.',
    personaHighlights: {
      founder: ['Investor-ready highlights without writing a single deck.'],
      operations: ['Insights auto-publish to marketing sites, CRM, and Slack hubs.'],
      mentor: ['Celebrate mentee achievements with branded share kits.'],
    },
    metrics: {
      timeToValue: '2 minutes to publish',
      automation: '100% data-synchronised storytelling',
      collaboration: 'Marketing, ops, community',
    },
    media: {
      type: 'video',
      poster:
        'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=1200&q=80',
      sources: [
        { src: 'https://cdn.gigvora.com/marketing/product-tour/insights-reel.mp4', type: 'video/mp4' },
      ],
    },
    cta: {
      label: 'Explore storytelling studio',
      action: 'open_storytelling',
    },
  },
];

const DEFAULT_PRICING_PLANS = [
  {
    id: 'launch',
    name: 'Launch',
    headline: 'Perfect for early teams activating community, marketing, and mentorship.',
    pricing: { monthly: 129, annual: 119 },
    savings: { annual: 'Save 15% with annual billing' },
    features: [
      'Up to 15 concurrent workstreams',
      'Marketing landing page builder and analytics snapshots',
      'Mentor marketplace access with curated intros',
      'Slack and email orchestration with 20 playbooks',
    ],
    metrics: {
      'Seats included': '25',
      'Automation recipes': '40+',
      'Support': 'Guided onboarding & launch concierge',
    },
  },
  {
    id: 'scale',
    name: 'Scale',
    headline: 'Everything high-growth companies need to orchestrate global launches.',
    pricing: { monthly: 349, annual: 319 },
    savings: { annual: 'Save 20% · concierge data migration' },
    features: [
      'Unlimited projects with milestone governance',
      'Advanced analytics studio & ROI forecasting',
      'Integrated consent, security, and audit logging',
      'Dedicated mentor guild with spotlight campaigns',
    ],
    recommended: true,
    metrics: {
      'Seats included': '75',
      'Automation recipes': '120+',
      'Support': 'Dedicated success architect & quarterly roadmap reviews',
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    headline: 'Tailored for global operators with deep compliance and data residency needs.',
    pricing: { monthly: 'Custom', annual: 'Custom' },
    cadenceLabel: 'Enterprise agreement',
    savings: { annual: 'Volume pricing & white-glove launch' },
    features: [
      'Unlimited everything with premium SLAs',
      'Private data lake exports & lakehouse connectors',
      'Air-gapped mentor and contractor pools',
      'Dedicated launch squad with 24/7 war room',
    ],
    metrics: {
      'Seats included': 'Unlimited',
      'Automation recipes': 'Custom',
      'Support': '24/7 global pod & executive briefings',
    },
    ctaLabel: 'Design your enterprise plan',
  },
];

const DEFAULT_PRICING_FEATURE_MATRIX = [
  {
    key: 'command-centre',
    label: 'Command centre & analytics studio',
    description: 'Live dashboards, goal tracking, and multi-org analytics.',
    tiers: { launch: true, scale: true, enterprise: true },
  },
  {
    key: 'mentorship',
    label: 'Mentor guild & cohort rituals',
    description: 'Curated mentors, agenda templates, and impact reporting.',
    tiers: { launch: 'Curated pool', scale: 'Dedicated guild', enterprise: 'Private guild + NDA workflows' },
  },
  {
    key: 'marketing-suite',
    label: 'Marketing experience suite',
    description: 'Landing pages, product tours, marketing automation, and asset CDN.',
    tiers: { launch: true, scale: true, enterprise: 'White-label + custom CDN' },
  },
  {
    key: 'security',
    label: 'Security & compliance controls',
    description: 'Role-based access, audit trails, data residency, and single sign-on.',
    tiers: { launch: true, scale: true, enterprise: 'Advanced controls & private region' },
  },
  {
    key: 'support',
    label: 'Success pod & concierge services',
    description: 'Onboarding, war rooms, and launch partners.',
    tiers: { launch: 'Guided onboarding', scale: 'Success architect', enterprise: 'Dedicated pod 24/7' },
  },
];

const DEFAULT_PRICING_METRICS = [
  { label: 'Customer acquisition lift', value: '38%', helper: 'Marketing funnel lift measured across 120-day pilots.' },
  { label: 'Time-to-launch reduction', value: '2.3x faster', helper: 'Median improvement observed across scale customers.' },
  { label: 'Mentor satisfaction', value: '96%', helper: 'Mentor guild NPS from the past four quarters.' },
];

export default function HomePage() {
  const { isAuthenticated } = useSession();
  const navigate = useNavigate();
  const { data: homeData, loading: homeLoading, error: homeError, refresh, fromCache, lastUpdated } =
    useHomeExperience({ enabled: !isAuthenticated });

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
    const source = homeData?.marketing?.announcement ?? homeData?.pageContent?.marketingAnnouncement;
    if (source && typeof source === 'object') {
      const announcementCta = source.cta;
      const ctaOnClick = announcementCta?.onClick
        ? () => announcementCta.onClick({ navigate })
        : announcementCta?.href || announcementCta?.route
        ? () => navigate(announcementCta.href ?? announcementCta.route)
        : undefined;
      return {
        title: source.title ?? 'Latest release',
        description: source.description ?? source.copy ?? '',
        cta: announcementCta
          ? {
              label: announcementCta.label ?? 'Learn more',
              action: announcementCta.action ?? 'learn_more',
              onClick: ctaOnClick,
            }
          : undefined,
      };
    }

    return {
      title: 'Launch orchestration update',
      description: 'Automation blueprints, mentor analytics, and compliance vaults now ship across the Scale tier.',
      cta: {
        label: 'Read the release notes',
        action: 'release_notes',
        onClick: () => navigate('/trust-center'),
      },
    };
  }, [homeData?.marketing?.announcement, homeData?.pageContent?.marketingAnnouncement, navigate]);

  const marketingTrustBadges = useMemo(() => {
    const badges =
      homeData?.marketing?.trustBadges ?? homeData?.pageContent?.trustBadges ?? homeData?.settings?.trustBadges ?? [];
    return Array.isArray(badges) && badges.length ? badges : undefined;
  }, [homeData?.marketing?.trustBadges, homeData?.pageContent?.trustBadges, homeData?.settings?.trustBadges]);

  const marketingPersonas = useMemo(() => {
    const sources = [
      Array.isArray(homeData?.marketing?.personas) ? homeData.marketing.personas : [],
      Array.isArray(homeData?.pageContent?.marketingPersonas) ? homeData.pageContent.marketingPersonas : [],
    ]
      .flat()
      .filter(Boolean);

    const base = sources.length ? sources : DEFAULT_PRODUCT_TOUR_PERSONAS;
    return base.map((persona, index) => {
      const fallback = DEFAULT_PRODUCT_TOUR_PERSONAS[index % DEFAULT_PRODUCT_TOUR_PERSONAS.length];
      const id = persona.id ?? persona.key ?? persona.slug ?? fallback.id ?? `persona-${index}`;
      return {
        id,
        key: persona.key ?? persona.id ?? persona.slug ?? id,
        label: persona.label ?? persona.name ?? persona.title ?? fallback.label,
        description: persona.description ?? persona.summary ?? persona.copy ?? fallback.description,
        route: persona.route ?? persona.href ?? null,
      };
    });
  }, [homeData?.marketing?.personas, homeData?.pageContent?.marketingPersonas]);

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
    const dataSource = Array.isArray(homeData?.marketing?.productTour?.steps)
      ? homeData.marketing.productTour.steps
      : Array.isArray(homeData?.pageContent?.productTourSteps)
      ? homeData.pageContent.productTourSteps
      : DEFAULT_PRODUCT_TOUR_STEPS;

    return dataSource.map((step, index) => {
      const fallback = DEFAULT_PRODUCT_TOUR_STEPS[index % DEFAULT_PRODUCT_TOUR_STEPS.length];
      return {
        id: step.id ?? step.key ?? fallback.id ?? `tour-${index}`,
        label: step.label ?? step.shortTitle ?? fallback.label ?? `Step ${index + 1}`,
        title: step.title ?? step.headline ?? fallback.title,
        summary: step.summary ?? step.description ?? fallback.summary,
        personaHighlights: step.personaHighlights ?? step.highlightsByPersona ?? fallback.personaHighlights,
        highlights: step.highlights ?? fallback.highlights,
        metrics: step.metrics ?? fallback.metrics,
        media: step.media ?? fallback.media,
        cta: step.cta ?? fallback.cta,
        secondaryCta: step.secondaryCta ?? fallback.secondaryCta,
      };
    });
  }, [homeData?.marketing?.productTour?.steps, homeData?.pageContent?.productTourSteps]);

  const marketingPricingPlans = useMemo(() => {
    const planSource = Array.isArray(homeData?.marketing?.pricing?.plans)
      ? homeData.marketing.pricing.plans
      : Array.isArray(homeData?.pageContent?.pricingPlans)
      ? homeData.pageContent.pricingPlans
      : DEFAULT_PRICING_PLANS;

    return planSource.map((plan, index) => {
      const fallback = DEFAULT_PRICING_PLANS[index % DEFAULT_PRICING_PLANS.length];
      return {
        id: plan.id ?? plan.key ?? plan.slug ?? fallback.id ?? `plan-${index}`,
        name: plan.name ?? plan.title ?? fallback.name,
        headline: plan.headline ?? plan.description ?? fallback.headline,
        pricing: plan.pricing ?? fallback.pricing,
        cadenceLabel: plan.cadenceLabel ?? fallback.cadenceLabel,
        savings: plan.savings ?? fallback.savings,
        features: Array.isArray(plan.features) && plan.features.length ? plan.features : fallback.features,
        metrics: plan.metrics ?? fallback.metrics,
        recommended: plan.recommended ?? fallback.recommended ?? false,
        ctaLabel: plan.ctaLabel ?? fallback.ctaLabel,
      };
    });
  }, [homeData?.marketing?.pricing?.plans, homeData?.pageContent?.pricingPlans]);

  const marketingPricingFeatureMatrix = useMemo(() => {
    const matrixSource = homeData?.marketing?.pricing?.featureMatrix ?? homeData?.pageContent?.pricingFeatureMatrix;
    return Array.isArray(matrixSource) && matrixSource.length ? matrixSource : DEFAULT_PRICING_FEATURE_MATRIX;
  }, [homeData?.marketing?.pricing?.featureMatrix, homeData?.pageContent?.pricingFeatureMatrix]);

  const marketingPricingMetrics = useMemo(() => {
    const metricsSource = homeData?.marketing?.pricing?.metrics ?? homeData?.pageContent?.pricingMetrics;
    return Array.isArray(metricsSource) && metricsSource.length ? metricsSource : DEFAULT_PRICING_METRICS;
  }, [homeData?.marketing?.pricing?.metrics, homeData?.pageContent?.pricingMetrics]);

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
        <TestimonialsSection loading={homeLoading} error={homeError} />
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
        <JoinCommunitySection />
      </div>
    </MarketingLayout>
  );
}
