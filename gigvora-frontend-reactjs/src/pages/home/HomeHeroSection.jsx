import PropTypes from 'prop-types';
import PublicHero from '../../components/marketing/PublicHero.jsx';
import { HOME_GRADIENTS } from './homeThemeTokens.js';

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

const FALLBACK_PERSONA_CHIPS = [
  'Founders accelerating go-to-market',
  'Agencies scaling delivery pods',
  'Mentors and operators guiding cohorts',
  'Recruiters hiring across global hubs',
];

const FALLBACK_VALUE_PILLARS = [
  {
    id: 'command-centre',
    title: 'One command centre for every crew',
    description:
      'Roadmaps, launchpads, and async updates stay in sync so founders, agencies, and talent leaders never lose context.',
    highlights: [
      'Launch timelines and blockers surface instantly for every persona',
      'Shared rituals and AI nudges keep cohorts accountable across timezones',
    ],
    metric: { label: 'Operational clarity', value: '8.6/10 team confidence score' },
  },
  {
    id: 'compliance-trust',
    title: 'Enterprise trust without slowing momentum',
    description:
      'Integrated compliance, payments, and approvals let finance and legal sleep well while the work keeps moving.',
    highlights: [
      'Role-aware access, SOC2 controls, and audit-ready histories in one view',
      'Escrow, payouts, and renewals governed by the same telemetry',
    ],
    metric: { label: 'Trust signals', value: 'SOC2 monitored · 99.95% uptime' },
  },
  {
    id: 'talent-network',
    title: 'Curated network that moves at your speed',
    description:
      'Mentor guilds, community launches, and AI-matched specialists plug into your roadmap with measurable impact.',
    highlights: [
      '9-day average time-to-hire across global missions',
      'Mentor and pod insights reveal engagement, NPS, and readiness',
    ],
    metric: { label: 'Network activation', value: '7,800+ mentors & specialists' },
  },
];

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

export function HomeHeroSection({
  headline,
  subheading,
  keywords,
  loading = false,
  error = null,
  onClaimWorkspace,
  onBrowseOpportunities,
  productMedia,
  personaChips,
  valuePillars,
}) {
  const resolvedKeywords = normaliseKeywords(keywords);
  const hasCustomKeywords = resolvedKeywords.length > 0;
  const tickerItems = hasCustomKeywords ? resolvedKeywords : undefined;
  const fallbackTickerItems = hasCustomKeywords ? resolvedKeywords : FALLBACK_KEYWORDS;

  const heroMedia = { ...FALLBACK_MEDIA, ...(productMedia ?? {}) };

  const heroPersonaChips = Array.isArray(personaChips) && personaChips.length ? personaChips : FALLBACK_PERSONA_CHIPS;
  const heroValuePillars = Array.isArray(valuePillars) && valuePillars.length ? valuePillars : FALLBACK_VALUE_PILLARS;

  const primaryAction = {
    id: 'claim_workspace',
    label: 'Claim your workspace',
    onClick: () => {
      if (typeof onClaimWorkspace === 'function') {
        onClaimWorkspace();
      }
    },
  };

  const secondaryAction = {
    id: 'browse_opportunities',
    label: 'Browse live opportunities',
    onClick: () => {
      if (typeof onBrowseOpportunities === 'function') {
        onBrowseOpportunities();
      }
    },
  };

  return (
    <PublicHero
      componentId="home-hero"
      gradient={HOME_GRADIENTS.hero}
      eyebrow="Community OS"
      headline={headline}
      subheading={subheading}
      fallbackHeadline={DEFAULT_HEADLINE}
      fallbackSubheading={DEFAULT_SUBHEADING}
      highlightBadge="Freelancers, founders, mentors, agencies, and hiring teams win together."
      tickerItems={tickerItems}
      fallbackTickerItems={fallbackTickerItems}
      loading={loading}
      error={error}
      primaryAction={primaryAction}
      secondaryAction={secondaryAction}
      personaChips={heroPersonaChips}
      valuePillars={heroValuePillars}
      media={heroMedia}
      mediaCaption={productMedia?.caption}
      analyticsMetadata={{
        source: 'web_marketing_site',
        viewEventName: 'web_home_hero_viewed',
        ctaEventName: 'web_home_hero_cta',
        pillarEventName: 'web_home_value_pillar_action',
      }}
    />
  );
}

HomeHeroSection.propTypes = {
  headline: PropTypes.string,
  subheading: PropTypes.string,
  keywords: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        label: PropTypes.string,
        title: PropTypes.string,
        keyword: PropTypes.string,
        name: PropTypes.string,
      }),
    ]),
  ),
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  onClaimWorkspace: PropTypes.func,
  onBrowseOpportunities: PropTypes.func,
  productMedia: PropTypes.shape({
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
    caption: PropTypes.string,
  }),
  personaChips: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        label: PropTypes.string,
      }),
    ]),
  ),
  valuePillars: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string,
      highlights: PropTypes.arrayOf(PropTypes.string),
      metric: PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.string,
      }),
      icon: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
      action: PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
        href: PropTypes.string,
        to: PropTypes.string,
      }),
    }),
  ),
};

HomeHeroSection.defaultProps = {
  headline: undefined,
  subheading: undefined,
  keywords: undefined,
  loading: false,
  error: null,
  onClaimWorkspace: undefined,
  onBrowseOpportunities: undefined,
  productMedia: undefined,
  personaChips: undefined,
  valuePillars: undefined,
};

export default HomeHeroSection;
