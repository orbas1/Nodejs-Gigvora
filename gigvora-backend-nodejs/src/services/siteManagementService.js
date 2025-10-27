import { Op } from 'sequelize';
import {
  SiteSetting,
  SitePage,
  SiteNavigationLink,
  SITE_PAGE_STATUSES,
  sequelize,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const SITE_SETTINGS_KEY = 'site:global';

const DEFAULT_HERO_KEYWORDS = [
  'Launchpad demo streaming · Creation Studio',
  'Mentorship session going live · Design ops',
  'Product squad aligning roadmap · Remote',
  'Trust operations clearing escrow · Finance',
  'Agency pods sharing wins · Atlas Collective',
  'Volunteer mission kicking off · Impact hub',
];

const DEFAULT_HERO_MEDIA = {
  imageUrl: 'https://cdn.gigvora.com/marketing/home/hero-still.jpg',
  posterUrl: 'https://cdn.gigvora.com/marketing/home/hero-poster.jpg',
  alt: 'Gigvora workspace with cross-functional collaborators reviewing milestones.',
  caption: 'Operations, finance, and delivery stay in lockstep with Gigvora.',
  autoPlay: true,
  muted: true,
  loop: true,
  videoSources: [
    {
      src: 'https://cdn.gigvora.com/marketing/home/hero-preview.mp4',
      type: 'video/mp4',
    },
    {
      src: 'https://cdn.gigvora.com/marketing/home/hero-preview.webm',
      type: 'video/webm',
    },
  ],
};

const DEFAULT_HERO_PERSONA_CHIPS = [
  'Founders orchestrating cross-functional squads',
  'Agencies scaling delivery pods with trust guardrails',
  'Mentors, operators, and advisors guiding cohorts',
  'Recruiters and talent leads hiring with real-time telemetry',
];

const DEFAULT_HERO_INSIGHT_STATS = [
  {
    id: 'global-network',
    label: 'Global network',
    value: '7,800+ mentors & specialists',
    helper: 'Curated pods across 60+ countries keep every launch moving.',
  },
  {
    id: 'cycle-time',
    label: 'Cycle-time gains',
    value: '38% faster programme launches',
    helper: 'Unified rituals and playbooks streamline every mission.',
  },
  {
    id: 'trust-score',
    label: 'Enterprise trust',
    value: '99.95% uptime · SOC2 monitored',
    helper: 'Treasury, legal, and risk automation built into every workflow.',
  },
];

const DEFAULT_HERO_VALUE_PILLARS = [
  {
    id: 'command-centre',
    title: 'One command centre for every mission',
    description:
      'Run launches, mentoring, and operations from a single glassmorphic HQ with telemetry every stakeholder trusts.',
    highlights: [
      'Real-time launchpad, finance, and compliance visibility for every persona',
      'Async rituals, pulse digests, and AI nudges keep crews accountable across timezones',
    ],
    metric: { label: 'Operational clarity', value: '8.6/10 team confidence score' },
    icon: 'SparklesIcon',
    action: { id: 'command-centre', label: 'Explore HQ playbook', href: '/platform/command-centre' },
  },
  {
    id: 'compliance-trust',
    title: 'Enterprise trust without slowdowns',
    description:
      'Treasury, legal, and risk automation wire into every engagement so finance and compliance teams ship with confidence.',
    highlights: [
      'Role-aware access, SOC 2 audits, and escrow guardrails in one shared ledger',
      'Regulated payouts, renewals, and invoicing run through a verified treasury spine',
    ],
    metric: { label: 'Trust signals', value: '99.95% uptime · SOC 2 monitored' },
    icon: 'ShieldCheckIcon',
    action: { id: 'trust-centre', label: 'Review trust centre', href: '/trust-center' },
  },
  {
    id: 'talent-network',
    title: 'Curated network activated in days',
    description:
      'Mentor guilds, specialists, and community pods assemble instantly with readiness scores and engagement insights.',
    highlights: [
      'AI matching, guild programming, and readiness scoring surface the right crew instantly',
      'Live NPS, utilisation, and sentiment analytics keep teams tuned to outcomes',
    ],
    metric: { label: 'Network activation', value: '7,800+ mentors & specialists' },
    icon: 'ChartBarIcon',
    action: { id: 'talent-network', label: 'Meet the network', href: '/network' },
  },
];

const DEFAULT_COMMUNITY_STATS = [
  { label: 'Global specialists', value: '12,400+' },
  { label: 'Average NPS', value: '68' },
  { label: 'Completion rate', value: '97%' },
];

const DEFAULT_PERSONA_JOURNEYS = [
  {
    key: 'freelancer',
    title: 'Freelancers',
    description: 'Package your skills, auto-match to gigs, and get paid without the chase.',
    icon: 'SparklesIcon',
    route: '/dashboard/freelancer',
    ctaLabel: 'Enter freelancer HQ',
    tone: 'daylight',
    steps: [
      { label: 'Glow up your portfolio', icon: 'SparklesIcon' },
      { label: 'Auto-match to gigs', icon: 'CursorArrowRaysIcon' },
      { label: 'Celebrate payouts fast', icon: 'BanknotesIcon' },
    ],
    metrics: [
      { label: 'Active missions', value: '1.8k' },
      { label: 'Avg. payout speed', value: '48 hrs' },
    ],
  },
  {
    key: 'agency',
    title: 'Agencies',
    description: 'Run squads like clockwork with pods, CRM views, and predictable cash flow.',
    icon: 'GlobeAltIcon',
    route: '/dashboard/agency',
    ctaLabel: 'Scale your agency ops',
    tone: 'midnight',
    steps: [
      { label: 'Publish your service pods', icon: 'Squares2X2Icon' },
      { label: 'Spin up collab rooms', icon: 'UserGroupIcon' },
      { label: 'Track revenue pulses', icon: 'ChartBarIcon' },
    ],
    metrics: [
      { label: 'Pods launched', value: '320' },
      { label: 'Avg. cycle time', value: '6.5 days' },
    ],
  },
  {
    key: 'company',
    title: 'Companies',
    description: 'Brief the network, assemble dream teams, and follow delivery from hello to handoff.',
    icon: 'BuildingOffice2Icon',
    route: '/dashboard/company',
    ctaLabel: 'Build your dream team',
    tone: 'daylight',
    steps: [
      { label: 'Publish a playful brief', icon: 'MegaphoneIcon' },
      { label: 'Auto-match experts', icon: 'BoltIcon' },
      { label: 'Track delivery signals', icon: 'ClipboardDocumentCheckIcon' },
    ],
    metrics: [
      { label: 'Teams assembled', value: '540' },
      { label: 'Launch success rate', value: '96%' },
    ],
  },
  {
    key: 'mentor',
    title: 'Mentors',
    description: 'Host office hours, drop feedback, and keep mentees levelling up.',
    icon: 'AcademicCapIcon',
    route: '/dashboard/mentor',
    ctaLabel: 'Host mentor magic',
    tone: 'daylight',
    steps: [
      { label: 'Set your office hours', icon: 'CalendarDaysIcon' },
      { label: 'Match with seekers', icon: 'LightBulbIcon' },
      { label: 'Share feedback loops', icon: 'ChatBubbleBottomCenterTextIcon' },
    ],
    metrics: [
      { label: 'Sessions hosted', value: '4.3k' },
      { label: 'Avg. rating', value: '4.8/5' },
    ],
  },
  {
    key: 'launchpad',
    title: 'Launchpad leads',
    description: 'Kickstart cohorts, rally builders, and keep every sprint energised.',
    icon: 'RocketLaunchIcon',
    route: '/dashboard/launchpad',
    ctaLabel: 'Launch a cohort',
    tone: 'daylight',
    steps: [
      { label: 'Craft your cohort space', icon: 'SparklesIcon' },
      { label: 'Invite your crew', icon: 'UserGroupIcon' },
      { label: 'Track momentum arcs', icon: 'ChartBarSquareIcon' },
    ],
    metrics: [
      { label: 'Cohorts active', value: '112' },
      { label: 'Avg. completion', value: '89%' },
    ],
  },
  {
    key: 'volunteer',
    title: 'Volunteers',
    description: 'Find causes, join missions, and leave every community brighter.',
    icon: 'HeartIcon',
    route: '/search?category=volunteering',
    ctaLabel: 'Find a mission',
    tone: 'daylight',
    steps: [
      { label: 'Spot causes you love', icon: 'HeartIcon' },
      { label: 'Join micro-sprints', icon: 'HandRaisedIcon' },
      { label: 'Share ripple stories', icon: 'SparklesIcon' },
    ],
    metrics: [
      { label: 'Missions joined', value: '780' },
      { label: 'Impact hours', value: '26k' },
    ],
  },
];

const DEFAULT_PERSONA_METRICS = [
  { persona: 'freelancer', label: 'Avg. satisfaction', value: '4.8/5' },
  { persona: 'freelancer', label: 'Opportunities matched', value: '22 per member' },
  { persona: 'agency', label: 'Pods launched last quarter', value: '320' },
  { persona: 'company', label: 'Time-to-invite', value: '48 hrs' },
  { persona: 'mentor', label: 'Office hours booked', value: '3.4k' },
  { persona: 'launchpad', label: 'Launch velocity lift', value: '+34%' },
  { persona: 'volunteer', label: 'Impact rating', value: '4.9/5' },
];

const DEFAULT_OPERATIONS_SUMMARY = {
  escrowHealth: {
    label: 'Escrow health',
    value: '99.2% uptime',
    change: '+1.4%',
    trend: [74, 82, 88, 91, 95, 98, 99],
  },
  disputeVelocity: {
    label: 'Dispute velocity',
    value: '3.2 hrs median',
    change: '-22%',
    trend: [18, 16, 14, 12, 9, 7, 6],
  },
  evidencePipelines: {
    label: 'Evidence pipelines',
    value: '87% automated',
    change: '+9%',
    trend: [45, 48, 56, 62, 70, 78, 84],
  },
};

const DEFAULT_RECENT_POSTS = [
  {
    id: 'ops-heartbeat',
    title: 'Ops heartbeat: escrow clear and launches tracking green',
    summary: 'Finance, trust, and delivery signals are trending up after this week’s velocity push.',
    type: 'update',
    authorName: 'Ops desk',
    authorHeadline: 'Operations control tower',
    createdAt: '2024-10-01T09:00:00.000Z',
  },
  {
    id: 'mentor-lounge',
    title: 'Mentor lounge: design ops AMA starting',
    summary: 'Join the live design ops session—slots are filling fast with agency partners and mentees.',
    type: 'launchpad',
    authorName: 'Mentor guild',
    authorHeadline: 'Community mentoring hub',
    createdAt: '2024-10-02T11:00:00.000Z',
  },
  {
    id: 'launchpad-demo',
    title: 'Launchpad demo: product squad forming for robotics rollout',
    summary: 'Case study cohort invites specialists in robotics, compliance, and data storytelling.',
    type: 'project',
    authorName: 'Launchpad studio',
    authorHeadline: 'Creation studio spotlight',
    createdAt: '2024-10-03T14:00:00.000Z',
  },
];

const DEFAULT_MARKETING_ANNOUNCEMENT = {
  title: 'Launch orchestration update',
  description: 'Automation blueprints, mentor analytics, and compliance vaults now ship across the Scale tier.',
  cta: { label: 'Read the release notes', action: 'release_notes', href: '/trust-center' },
};

const DEFAULT_MARKETING_TRUST_BADGES = [
  {
    id: 'badge-soc2',
    label: 'SOC 2 Type II',
    description: 'Independent auditors verify Gigvora trust and compliance every quarter.',
  },
  {
    id: 'badge-global-mentors',
    label: 'Mentor guild',
    description: '7,800+ vetted mentors spanning growth, product, and revenue disciplines.',
  },
  {
    id: 'badge-sla',
    label: 'Enterprise SLA',
    description: '99.95% uptime with 24/7 launch response pods across three regions.',
  },
];

const DEFAULT_MARKETING_PERSONAS = [
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
      posterUrl: 'https://cdn.gigvora.com/marketing/product-tour/command-centre-poster.jpg',
      sources: [{ src: 'https://cdn.gigvora.com/marketing/product-tour/command-centre.mp4', type: 'video/mp4' }],
    },
    cta: { label: 'Book a strategy review', action: 'book_strategy' },
    secondaryCta: { label: 'Download executive brief', action: 'download_brief' },
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
      src: 'https://cdn.gigvora.com/marketing/product-tour/launch-blueprints.jpg',
      alt: 'Launch blueprint builder showing tasks and automation timeline.',
    },
    cta: { label: 'Start a pilot launch', action: 'start_pilot' },
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
      src: 'https://cdn.gigvora.com/marketing/product-tour/mentorship-workflows.jpg',
      alt: 'Mentor workspace with shared agendas and analytics.',
    },
    cta: { label: 'Meet the mentor guild', action: 'mentor_directory' },
    secondaryCta: { label: 'View mentorship outcomes', action: 'view_outcomes' },
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
      posterUrl: 'https://cdn.gigvora.com/marketing/product-tour/insights-studio-poster.jpg',
      sources: [{ src: 'https://cdn.gigvora.com/marketing/product-tour/insights-reel.mp4', type: 'video/mp4' }],
    },
    cta: { label: 'Explore storytelling studio', action: 'open_storytelling' },
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
      Support: 'Guided onboarding & launch concierge',
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
      Support: 'Dedicated success architect & quarterly roadmap reviews',
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
      Support: '24/7 global pod & executive briefings',
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

const DEFAULT_MARKETING_TESTIMONIALS = [
  {
    id: 'northwind',
    quote:
      'Gigvora unlocked a vetted product pod in 48 hours—finance, compliance, and delivery were already aligned.',
    authorName: 'Leah Patel',
    authorRole: 'VP Operations',
    authorCompany: 'Northwind Labs',
    avatarUrl: 'https://cdn.gigvora.com/assets/avatars/leah-patel.png',
    avatarAlt: 'Portrait of Leah Patel smiling',
    highlight: 'Scaled seven markets without adding ops headcount.',
    badge: 'Enterprise rollout',
  },
  {
    id: 'forma-studio',
    quote: 'We replaced scattered contractors with a dedicated Gigvora crew—quality soared while admin vanished.',
    authorName: 'Ivy Chen',
    authorRole: 'Founder',
    authorCompany: 'Forma Studio',
    avatarUrl: 'https://cdn.gigvora.com/assets/avatars/ivy-chen.png',
    avatarAlt: 'Portrait of Ivy Chen wearing a blazer',
    highlight: 'Closed enterprise launches with on-demand specialists.',
    badge: 'Venture studio',
  },
  {
    id: 'aurora',
    quote:
      'Our accelerator pairs mentors and founders instantly. The shared telemetry keeps every stakeholder aligned.',
    authorName: 'Diego Martínez',
    authorRole: 'Programme Director',
    authorCompany: 'Aurora Collective',
    avatarUrl: 'https://cdn.gigvora.com/assets/avatars/diego-martinez.png',
    avatarAlt: 'Portrait of Diego Martínez laughing',
    highlight: 'Raised cohort satisfaction to 96% in two seasons.',
    badge: 'Global accelerator',
  },
];

const DEFAULT_MARKETING_FRAGMENT = {
  announcement: { ...DEFAULT_MARKETING_ANNOUNCEMENT },
  trustBadges: [...DEFAULT_MARKETING_TRUST_BADGES],
  personas: [...DEFAULT_MARKETING_PERSONAS],
  productTour: { steps: [...DEFAULT_PRODUCT_TOUR_STEPS] },
  pricing: {
    plans: [...DEFAULT_PRICING_PLANS],
    featureMatrix: [...DEFAULT_PRICING_FEATURE_MATRIX],
    metrics: [...DEFAULT_PRICING_METRICS],
  },
  testimonials: [...DEFAULT_MARKETING_TESTIMONIALS],
};

function coerceString(value, fallback = '') {
  if (value == null) {
    return fallback;
  }
  const text = `${value}`.trim();
  return text.length ? text : fallback;
}

function coerceBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(lowered)) {
      return true;
    }
    if (['false', '0', 'no', 'n'].includes(lowered)) {
      return false;
    }
  }
  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      return value !== 0;
    }
  }
  return fallback;
}

function coerceInteger(value, fallback = 0) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number.parseInt(value, 10);
  return Number.isNaN(numeric) ? fallback : numeric;
}

function coerceOptionalString(value, fallback = '') {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return `${value}`;
  }
  return fallback;
}

function normalizeSlug(value) {
  return coerceOptionalString(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function sanitizeStringArray(list, fallback = []) {
  if (!Array.isArray(list)) {
    return [...fallback];
  }
  const cleaned = list
    .map((item) => coerceOptionalString(item))
    .filter((item) => item.length > 0)
    .slice(0, 12);
  return cleaned.length ? cleaned : [...fallback];
}

function sanitizeHeroPersonaChips(chips, fallback = DEFAULT_HERO_PERSONA_CHIPS) {
  const cleaned = sanitizeStringArray(chips, fallback).slice(0, 8);
  return cleaned.length ? cleaned : [...DEFAULT_HERO_PERSONA_CHIPS];
}

function sanitizeHeroInsightStats(stats, fallback = DEFAULT_HERO_INSIGHT_STATS) {
  const source = Array.isArray(stats) ? stats : [];
  const base = Array.isArray(fallback) && fallback.length ? fallback : DEFAULT_HERO_INSIGHT_STATS;

  const sanitized = source
    .map((stat, index) => {
      if (!stat) {
        return null;
      }

      if (typeof stat === 'string') {
        const label = coerceOptionalString(stat);
        if (!label) {
          return null;
        }
        return {
          id: normalizeSlug(label) || `stat-${index + 1}`,
          label,
        };
      }

      if (typeof stat === 'object') {
        const label = coerceOptionalString(stat.label ?? stat.title ?? stat.name);
        const value = coerceOptionalString(stat.value ?? stat.metric ?? stat.copy ?? stat.stat);
        const helper = coerceOptionalString(stat.helper ?? stat.description ?? stat.summary);

        if (!label && !value && !helper) {
          return null;
        }

        const id = normalizeSlug(stat.id ?? stat.key ?? stat.slug ?? label ?? value ?? helper) || `stat-${index + 1}`;
        const result = { id, label: label || value || helper || 'Insight stat' };
        if (value) {
          result.value = value;
        }
        if (helper) {
          result.helper = helper;
        }
        return result;
      }

      return null;
    })
    .filter(Boolean)
    .slice(0, 6)
    .map((stat) => ({
      id: stat.id,
      label: stat.label,
      ...(stat.value ? { value: stat.value } : {}),
      ...(stat.helper ? { helper: stat.helper } : {}),
    }));

  if (sanitized.length) {
    return sanitized;
  }

  return base.map((stat) => ({ ...stat }));
}

const ALLOWED_HERO_PILLAR_ICONS = new Set([
  'SparklesIcon',
  'ShieldCheckIcon',
  'ChartBarIcon',
  'CurrencyDollarIcon',
  'BoltIcon',
  'GlobeAltIcon',
  'BuildingOffice2Icon',
]);

function sanitizeHeroPillarMetric(metric, fallback = null) {
  const base = fallback && typeof fallback === 'object' ? { ...fallback } : null;
  if (!metric || typeof metric !== 'object') {
    return base;
  }
  const label = coerceOptionalString(metric.label ?? metric.title, base?.label ?? 'Key metric');
  const value = coerceOptionalString(metric.value ?? metric.copy ?? metric.stat, base?.value ?? null);
  if (!label && !value) {
    return base;
  }
  return {
    label: label || base?.label || 'Key metric',
    value: value || base?.value || null,
  };
}

function sanitizeHeroPillarAction(action, fallback = null) {
  const candidate = action && typeof action === 'object' ? action : null;
  const base = fallback && typeof fallback === 'object' ? fallback : null;
  if (!candidate && !base) {
    return null;
  }

  const label = coerceOptionalString(candidate?.label ?? candidate?.title, base?.label ?? 'Explore pillar');
  const href = coerceOptionalString(candidate?.href ?? candidate?.url ?? base?.href ?? base?.url);
  const to = coerceOptionalString(candidate?.to ?? base?.to);
  const actionId = normalizeSlug(candidate?.id ?? base?.id ?? label);

  if (!label) {
    return base ? { ...base } : null;
  }

  const result = { id: actionId || 'cta', label };
  if (href) {
    result.href = href;
  }
  if (to) {
    result.to = to;
  }
  return result;
}

function clonePillar(pillar) {
  return {
    ...pillar,
    highlights: Array.isArray(pillar?.highlights) ? [...pillar.highlights] : [],
    metric: pillar?.metric ? { ...pillar.metric } : null,
    action: pillar?.action ? { ...pillar.action } : null,
  };
}

function sanitizeHeroValuePillars(pillars, fallback = DEFAULT_HERO_VALUE_PILLARS) {
  const source = Array.isArray(pillars) ? pillars : [];
  const base = Array.isArray(fallback) && fallback.length ? fallback : DEFAULT_HERO_VALUE_PILLARS;
  const sanitized = source
    .map((pillar, index) => {
      const ref = base[index] ?? base[0];
      const title = coerceOptionalString(pillar?.title ?? pillar?.name ?? pillar?.label, ref?.title ?? null);
      if (!title) {
        return null;
      }

      const description = coerceOptionalString(pillar?.description ?? pillar?.copy ?? pillar?.summary, ref?.description ?? '');
      const id = normalizeSlug(pillar?.id ?? title) || normalizeSlug(ref?.id ?? title) || `pillar-${index + 1}`;
      const highlightsSource = Array.isArray(pillar?.highlights)
        ? pillar.highlights
        : pillar?.bullets && Array.isArray(pillar.bullets)
        ? pillar.bullets.map((item) => (typeof item === 'string' ? item : item?.text))
        : [];
      const highlights = highlightsSource
        .map((value) => coerceOptionalString(value))
        .filter((value) => value && value.length > 0)
        .slice(0, 4);

      const metric = sanitizeHeroPillarMetric(pillar?.metric, ref?.metric);
      const iconCandidate = coerceOptionalString(pillar?.icon ?? pillar?.Icon ?? pillar?.iconName, ref?.icon);
      const icon = iconCandidate && ALLOWED_HERO_PILLAR_ICONS.has(iconCandidate) ? iconCandidate : ref?.icon ?? 'SparklesIcon';
      const action = sanitizeHeroPillarAction(pillar?.action ?? pillar?.cta, ref?.action);

      return {
        id,
        title,
        description,
        highlights: highlights.length ? highlights : Array.isArray(ref?.highlights) ? [...ref.highlights] : [],
        metric,
        icon,
        action,
      };
    })
    .filter(Boolean)
    .slice(0, 6);

  if (sanitized.length) {
    return sanitized;
  }

  return base.map((pillar) => clonePillar(pillar));
}

function sanitizeHeroMedia(media = {}, fallback = {}) {
  const source = media && typeof media === 'object' ? media : {};
  const base = fallback && typeof fallback === 'object' ? fallback : {};
  const merged = {
    imageUrl: coerceOptionalString(source.imageUrl, base.imageUrl ?? ''),
    posterUrl: coerceOptionalString(source.posterUrl, base.posterUrl ?? ''),
    alt: coerceOptionalString(source.alt, base.alt ?? ''),
    caption: coerceOptionalString(source.caption, base.caption ?? ''),
    autoPlay: coerceBoolean(source.autoPlay, base.autoPlay ?? true),
    muted: coerceBoolean(source.muted, base.muted ?? true),
    loop: coerceBoolean(source.loop, base.loop ?? true),
    controls: coerceBoolean(source.controls, base.controls ?? false),
  };

  const primaryVideoUrl = coerceOptionalString(source.videoUrl, base.videoUrl ?? '');
  const primaryVideoType = coerceOptionalString(source.videoType, base.videoType ?? 'video/mp4');
  if (primaryVideoUrl) {
    merged.videoUrl = primaryVideoUrl;
    merged.videoType = primaryVideoType || 'video/mp4';
  }

  const sources = Array.isArray(source.videoSources) ? source.videoSources : Array.isArray(base.videoSources) ? base.videoSources : [];
  merged.videoSources = sources
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const src = coerceOptionalString(entry.src ?? entry.url);
      if (!src) {
        return null;
      }
      const type = coerceOptionalString(entry.type, 'video/mp4');
      return { src, type };
    })
    .filter(Boolean)
    .slice(0, 4);

  return merged;
}

function sanitizeCommunityStats(stats, fallback = []) {
  const baseline = Array.isArray(fallback) ? fallback : [];
  const incoming = Array.isArray(stats) ? stats : [];
  const cleaned = incoming
    .map((entry) => ({
      label: coerceOptionalString(entry?.label ?? entry?.name, ''),
      value: coerceOptionalString(entry?.value ?? entry?.metric, ''),
    }))
    .filter((entry) => entry.label && entry.value)
    .slice(0, 6);
  return cleaned.length ? cleaned : baseline;
}

function sanitizePersonaSteps(steps, fallback = []) {
  const base = Array.isArray(fallback) ? fallback : [];
  const source = Array.isArray(steps) ? steps : [];
  if (!source.length) {
    return base.map((step) => ({ label: step.label, icon: coerceOptionalString(step.icon) }));
  }
  return source
    .map((step, index) => {
      const fallbackStep = base[index] ?? base[0] ?? {};
      const label = coerceOptionalString(step?.label ?? step?.title ?? step?.name, fallbackStep.label ?? '');
      if (!label) {
        return null;
      }
      const icon = coerceOptionalString(step?.icon ?? fallbackStep.icon ?? 'SparklesIcon');
      return { label, icon };
    })
    .filter(Boolean)
    .slice(0, 6);
}

function sanitizePersonaMetrics(metrics, fallback = []) {
  if (!metrics) {
    return Array.isArray(fallback) ? fallback : [];
  }

  const toArray = Array.isArray(metrics)
    ? metrics
    : Object.entries(metrics).flatMap(([key, value]) => {
        const list = Array.isArray(value) ? value : [value];
        return list.map((entry) => ({ ...entry, persona: entry?.persona ?? key }));
      });

  const cleaned = toArray
    .map((entry) => {
      const persona = normalizeSlug(entry?.persona ?? entry?.key ?? entry?.id);
      const label = coerceOptionalString(entry?.label ?? entry?.title ?? entry?.name, '');
      const value = coerceOptionalString(entry?.value ?? entry?.metric ?? entry?.copy, '');
      const change = coerceOptionalString(entry?.change ?? entry?.delta, '');
      if (!persona || !label || !value) {
        return null;
      }
      const metric = { persona, label, value };
      if (change) {
        metric.change = change;
      }
      return metric;
    })
    .filter(Boolean)
    .slice(0, 20);

  return cleaned.length ? cleaned : Array.isArray(fallback) ? fallback : [];
}

function sanitizePersonaJourneys(journeys, fallback = []) {
  const base = Array.isArray(fallback) ? fallback : [];
  const source = Array.isArray(journeys) ? journeys : base;

  const byKey = new Map();
  base.forEach((entry) => {
    const key = normalizeSlug(entry.key);
    if (key) {
      byKey.set(key, { ...entry });
    }
  });

  source.forEach((entry, index) => {
    const candidateKey = normalizeSlug(entry?.key ?? entry?.id ?? entry?.slug ?? entry?.persona ?? entry?.name);
    if (!candidateKey) {
      return;
    }
    const fallbackEntry = byKey.get(candidateKey) ?? base[index] ?? {};
    const resolved = {
      key: candidateKey,
      title: coerceOptionalString(entry?.title ?? entry?.name, fallbackEntry?.title ?? ''),
      description: coerceOptionalString(entry?.description ?? entry?.copy, fallbackEntry?.description ?? ''),
      icon: coerceOptionalString(entry?.icon ?? fallbackEntry?.icon ?? 'SparklesIcon'),
      route: coerceOptionalString(entry?.route ?? entry?.href ?? entry?.url, fallbackEntry?.route ?? `/dashboard/${candidateKey}`),
      ctaLabel: coerceOptionalString(entry?.ctaLabel ?? entry?.cta ?? entry?.ctaText, fallbackEntry?.ctaLabel ?? ''),
      tone: coerceOptionalString(entry?.tone ?? entry?.theme, fallbackEntry?.tone ?? 'daylight'),
      steps: sanitizePersonaSteps(entry?.steps, fallbackEntry?.steps ?? []),
      metrics: sanitizePersonaMetrics(entry?.metrics, fallbackEntry?.metrics ?? []),
      source: coerceOptionalString(entry?.source, fallbackEntry?.source ?? 'settings'),
    };
    byKey.set(candidateKey, resolved);
  });

  return Array.from(byKey.values()).slice(0, base.length || 6);
}

function sanitizeOperationsSummary(summary, fallback = {}) {
  const base = fallback && typeof fallback === 'object' ? fallback : {};
  const source = summary && typeof summary === 'object' ? summary : {};

  const sanitizeMetric = (metric, key) => {
    const defaultMetric = base[key] ?? {};
    const label = coerceOptionalString(metric?.label ?? defaultMetric.label, defaultMetric.label ?? '');
    const value = coerceOptionalString(metric?.value ?? metric?.metric, defaultMetric.value ?? '');
    const change = coerceOptionalString(metric?.change ?? metric?.delta, defaultMetric.change ?? '');
    const trendSource = Array.isArray(metric?.trend) ? metric.trend : defaultMetric.trend;
    const trend = Array.isArray(trendSource)
      ? trendSource
          .map((item) => {
            const numeric = Number(item);
            return Number.isFinite(numeric) ? numeric : null;
          })
          .filter((value) => value !== null)
          .slice(0, 14)
      : undefined;
    return {
      label,
      value,
      change,
      trend: trend && trend.length ? trend : defaultMetric.trend ?? [],
    };
  };

  return {
    escrowHealth: sanitizeMetric(source.escrowHealth, 'escrowHealth'),
    disputeVelocity: sanitizeMetric(source.disputeVelocity, 'disputeVelocity'),
    evidencePipelines: sanitizeMetric(source.evidencePipelines, 'evidencePipelines'),
  };
}

function sanitizeRecentPosts(posts, fallback = []) {
  const base = Array.isArray(fallback) ? fallback : [];
  const incoming = Array.isArray(posts) ? posts : [];
  const cleaned = incoming
    .map((post, index) => {
      const fallbackPost = base[index] ?? {};
      const id = coerceOptionalString(post?.id ?? fallbackPost.id ?? `post-${index + 1}`);
      const title = coerceOptionalString(post?.title ?? post?.headline, fallbackPost.title ?? '');
      const summary = coerceOptionalString(post?.summary ?? post?.content ?? post?.body, fallbackPost.summary ?? '');
      const type = normalizeSlug(post?.type ?? post?.category ?? fallbackPost.type ?? 'update') || 'update';
      const authorName = coerceOptionalString(post?.authorName ?? post?.author?.name, fallbackPost.authorName ?? '');
      const authorHeadline = coerceOptionalString(
        post?.authorHeadline ?? post?.author?.headline ?? post?.author?.title,
        fallbackPost.authorHeadline ?? '',
      );
      const createdAt = coerceOptionalString(post?.createdAt ?? post?.publishedAt ?? fallbackPost.createdAt ?? '');
      if (!title || !summary) {
        return null;
      }
      return {
        id,
        title,
        summary,
        type,
        authorName: authorName || 'Gigvora community',
        authorHeadline: authorHeadline || 'Marketplace community update',
        avatarUrl: coerceOptionalString(post?.avatarUrl ?? post?.author?.avatarUrl ?? fallbackPost.avatarUrl),
        avatarSeed: coerceOptionalString(post?.avatarSeed ?? post?.author?.id ?? fallbackPost.avatarSeed ?? id),
        createdAt: createdAt || fallbackPost.createdAt || null,
      };
    })
    .filter(Boolean)
    .slice(0, 6);
  return cleaned.length ? cleaned : base;
}

function sanitizeCta(cta, fallback = {}) {
  const base = fallback ?? {};
  const label = coerceString(cta?.label ?? cta?.title, base.label ?? '');
  if (!label) {
    return base.label ? { label: base.label, action: base.action, href: base.href, route: base.route } : null;
  }
  const payload = { label };
  const action = coerceOptionalString(cta?.action ?? base.action);
  if (action) {
    payload.action = action;
  }
  const href = coerceOptionalString(cta?.href ?? cta?.url ?? base.href ?? base.url);
  if (href) {
    payload.href = href;
  }
  const route = !href ? coerceOptionalString(cta?.route ?? cta?.path ?? base.route) : '';
  if (route) {
    payload.route = route;
  }
  return payload;
}

function sanitizeMarketingAnnouncement(announcement, fallback = {}) {
  const base = fallback ?? {};
  const title = coerceOptionalString(announcement?.title ?? announcement?.headline, base.title ?? '');
  const description = coerceOptionalString(announcement?.description ?? announcement?.copy, base.description ?? '');
  const cta = sanitizeCta(announcement?.cta, base.cta);
  return {
    title: title || base.title || DEFAULT_MARKETING_ANNOUNCEMENT.title,
    description: description || base.description || DEFAULT_MARKETING_ANNOUNCEMENT.description,
    ...(cta ? { cta } : base.cta ? { cta: base.cta } : {}),
  };
}

function sanitizePersonaHighlightsList(highlights, fallback = []) {
  const list = Array.isArray(highlights) ? highlights : fallback;
  const cleaned = list
    .map((item) => coerceString(item))
    .filter((item) => item.length > 0)
    .slice(0, 6);
  return cleaned.length ? cleaned : [...fallback];
}

function sanitizePersonaHighlightsMap(highlights, fallback = {}) {
  const source = highlights && typeof highlights === 'object' ? highlights : {};
  const result = {};
  Object.entries(source).forEach(([key, value]) => {
    const personaKey = normalizeSlug(key, key);
    if (!personaKey) {
      return;
    }
    result[personaKey] = sanitizePersonaHighlightsList(value, fallback[personaKey] ?? []);
  });
  if (fallback.default && !result.default) {
    result.default = sanitizePersonaHighlightsList(fallback.default, fallback.default);
  }
  return Object.keys(result).length ? result : { ...fallback };
}

function sanitizeTrustBadges(badges, fallback = []) {
  const source = Array.isArray(badges) ? badges : [];
  const baseList = Array.isArray(fallback) && fallback.length ? fallback : DEFAULT_MARKETING_TRUST_BADGES;
  const cleaned = source
    .map((badge, index) => {
      const base = baseList[index] ?? baseList[0];
      const label = coerceString(badge?.label ?? badge?.name ?? badge?.title, base?.label ?? '');
      if (!label) {
        return null;
      }
      return {
        id: coerceOptionalString(
          badge?.id ?? badge?.key ?? badge?.slug,
          base?.id ?? normalizeSlug(label) || `badge-${index + 1}`,
        ),
        label,
        description: coerceOptionalString(badge?.description ?? badge?.copy, base?.description ?? ''),
      };
    })
    .filter(Boolean)
    .slice(0, 6);
  return cleaned.length ? cleaned : baseList.map((item) => ({ ...item }));
}

function sanitizeTourMedia(media, fallback = {}) {
  const source = media && typeof media === 'object' ? media : {};
  const base = fallback ?? {};
  const type = ['video', 'image'].includes(source.type) ? source.type : base.type ?? 'image';
  const sanitized = { type };
  if (type === 'video') {
    const sources = Array.isArray(source.sources) ? source.sources : base.sources ?? [];
    sanitized.sources = sources
      .map((item) => {
        const src = coerceString(item?.src ?? item?.url);
        if (!src) return null;
        return {
          src,
          type: coerceString(item?.type ?? base?.sources?.[0]?.type ?? 'video/mp4', 'video/mp4'),
        };
      })
      .filter(Boolean)
      .slice(0, 4);
    if (!sanitized.sources.length && Array.isArray(base.sources)) {
      sanitized.sources = base.sources.map((item) => ({ ...item }));
    }
    const poster = coerceOptionalString(source.posterUrl ?? source.poster ?? base.posterUrl ?? base.poster);
    if (poster) {
      sanitized.posterUrl = poster;
    }
  } else {
    sanitized.src = coerceOptionalString(source.src ?? base.src ?? '');
    const alt = coerceOptionalString(source.alt ?? source.altText ?? base.alt ?? base.altText);
    if (alt) {
      sanitized.alt = alt;
    }
  }
  return sanitized;
}

function sanitizeProductTourSteps(steps, fallback = []) {
  const list = Array.isArray(steps) ? steps : [];
  const baseList = Array.isArray(fallback) && fallback.length ? fallback : DEFAULT_PRODUCT_TOUR_STEPS;
  const cleaned = list
    .map((step, index) => {
      const base = baseList[index] ?? baseList[0];
      const title = coerceString(step?.title ?? step?.headline, base?.title ?? '');
      if (!title) {
        return null;
      }
      const id = coerceOptionalString(step?.id ?? step?.key ?? step?.slug, base?.id ?? normalizeSlug(title) || `step-${index + 1}`);
      const cta = sanitizeCta(step?.cta, base?.cta);
      const secondaryCta = sanitizeCta(step?.secondaryCta, base?.secondaryCta);
      return {
        id,
        label: coerceString(step?.label ?? step?.shortTitle, base?.label ?? `Step ${index + 1}`),
        title,
        summary: coerceOptionalString(step?.summary ?? step?.description, base?.summary ?? ''),
        personaHighlights: sanitizePersonaHighlightsMap(
          step?.personaHighlights ?? step?.highlightsByPersona,
          base?.personaHighlights ?? {},
        ),
        highlights: sanitizePersonaHighlightsList(step?.highlights, base?.highlights ?? []),
        metrics: step?.metrics && typeof step.metrics === 'object' ? { ...base?.metrics, ...step.metrics } : base?.metrics ?? {},
        media: sanitizeTourMedia(step?.media, base?.media),
        ...(cta ? { cta } : {}),
        ...(secondaryCta ? { secondaryCta } : {}),
      };
    })
    .filter(Boolean)
    .slice(0, 6);
  return cleaned.length ? cleaned : baseList.map((item) => ({ ...item }));
}

function sanitizeMarketingPersonas(personas, fallback = []) {
  const list = Array.isArray(personas) ? personas : [];
  const baseList = Array.isArray(fallback) && fallback.length ? fallback : DEFAULT_MARKETING_PERSONAS;
  const cleaned = list
    .map((persona, index) => {
      const base = baseList[index] ?? baseList[0];
      const label = coerceString(persona?.label ?? persona?.name ?? persona?.title, base?.label ?? '');
      if (!label) {
        return null;
      }
      return {
        id: coerceOptionalString(
          persona?.id ?? persona?.key ?? persona?.slug,
          base?.id ?? normalizeSlug(label) || `persona-${index + 1}`,
        ),
        label,
        description: coerceOptionalString(persona?.description ?? persona?.summary ?? persona?.copy, base?.description ?? ''),
        route: coerceOptionalString(persona?.route ?? persona?.href ?? persona?.url ?? base?.route, base?.route ?? ''),
      };
    })
    .filter(Boolean)
    .slice(0, 6);
  return cleaned.length ? cleaned : baseList.map((item) => ({ ...item }));
}

function sanitizeMarketingTestimonials(testimonials, fallback = []) {
  const list = Array.isArray(testimonials) ? testimonials : [];
  const baseList = Array.isArray(fallback) && fallback.length ? fallback : DEFAULT_MARKETING_TESTIMONIALS;
  const cleaned = list
    .map((testimonial, index) => {
      const base = baseList[index] ?? baseList[0];
      const quote = coerceString(testimonial?.quote, base?.quote ?? '');
      const authorName = coerceString(testimonial?.authorName ?? testimonial?.name, base?.authorName ?? '');
      if (!quote || !authorName) {
        return null;
      }
      const highlightSource =
        testimonial?.highlight ?? testimonial?.highlightSummary ?? testimonial?.result ?? base?.highlight ?? '';
      return {
        id: coerceOptionalString(
          testimonial?.id ?? testimonial?.key ?? testimonial?.slug,
          base?.id ?? normalizeSlug(authorName) || `testimonial-${index + 1}`,
        ),
        quote,
        authorName,
        authorRole: coerceOptionalString(testimonial?.authorRole ?? testimonial?.role, base?.authorRole ?? ''),
        authorCompany: coerceOptionalString(
          testimonial?.authorCompany ?? testimonial?.company ?? testimonial?.organisation ?? testimonial?.organization,
          base?.authorCompany ?? '',
        ),
        avatarUrl: coerceOptionalString(testimonial?.avatarUrl ?? testimonial?.avatar, base?.avatarUrl ?? ''),
        avatarAlt: coerceOptionalString(
          testimonial?.avatarAlt ?? testimonial?.avatarAltText,
          base?.avatarAlt ?? (authorName ? `${authorName} portrait` : ''),
        ),
        highlight: coerceOptionalString(highlightSource, base?.highlight ?? ''),
        badge: coerceOptionalString(testimonial?.badge ?? testimonial?.tag ?? testimonial?.segment, base?.badge ?? ''),
      };
    })
    .filter(Boolean)
    .slice(0, 6);
  return cleaned.length ? cleaned : baseList.map((item) => ({ ...item }));
}

function sanitizePricingPlans(plans, fallback = []) {
  const list = Array.isArray(plans) ? plans : [];
  const baseList = Array.isArray(fallback) && fallback.length ? fallback : DEFAULT_PRICING_PLANS;
  const cleaned = list
    .map((plan, index) => {
      const base = baseList[index] ?? baseList[0];
      const name = coerceString(plan?.name ?? plan?.title, base?.name ?? '');
      if (!name) {
        return null;
      }
      const metricsSource = plan?.metrics && typeof plan.metrics === 'object' ? plan.metrics : {};
      const metrics = Object.entries({ ...base?.metrics, ...metricsSource }).reduce((acc, [metricLabel, metricValue]) => {
        const label = coerceString(metricLabel);
        const value = coerceOptionalString(metricValue, base?.metrics?.[metricLabel]);
        if (label && value) {
          acc[label] = value;
        }
        return acc;
      }, {});
      const features = Array.isArray(plan?.features)
        ? plan.features.map((item) => coerceString(item)).filter(Boolean)
        : Array.isArray(base?.features)
        ? base.features
        : [];
      return {
        id: coerceOptionalString(plan?.id ?? plan?.key ?? plan?.slug, base?.id ?? normalizeSlug(name) || `plan-${index + 1}`),
        name,
        headline: coerceOptionalString(plan?.headline ?? plan?.description, base?.headline ?? ''),
        pricing: plan?.pricing && typeof plan.pricing === 'object' ? { ...base?.pricing, ...plan.pricing } : base?.pricing ?? {},
        cadenceLabel: coerceOptionalString(plan?.cadenceLabel, base?.cadenceLabel ?? ''),
        savings: plan?.savings && typeof plan.savings === 'object' ? { ...base?.savings, ...plan.savings } : base?.savings ?? {},
        features,
        metrics,
        recommended: plan?.recommended ?? base?.recommended ?? false,
        ctaLabel: coerceOptionalString(plan?.ctaLabel ?? plan?.ctaText, base?.ctaLabel ?? ''),
      };
    })
    .filter(Boolean)
    .slice(0, 6);
  return cleaned.length ? cleaned : baseList.map((item) => ({ ...item }));
}

function sanitizePricingFeatureMatrix(matrix, fallback = []) {
  const list = Array.isArray(matrix) ? matrix : [];
  const baseList = Array.isArray(fallback) && fallback.length ? fallback : DEFAULT_PRICING_FEATURE_MATRIX;
  const cleaned = list
    .map((entry, index) => {
      const base = baseList[index] ?? baseList[0];
      const label = coerceString(entry?.label ?? entry?.title, base?.label ?? '');
      if (!label) {
        return null;
      }
      const tiers = entry?.tiers && typeof entry.tiers === 'object' ? entry.tiers : {};
      const sanitizedTiers = Object.entries({ ...base?.tiers, ...tiers }).reduce((acc, [tierKey, tierValue]) => {
        const key = normalizeSlug(tierKey, tierKey);
        if (!key) {
          return acc;
        }
        if (typeof tierValue === 'boolean') {
          acc[key] = tierValue;
        } else {
          const value = coerceOptionalString(tierValue, base?.tiers?.[key]);
          if (value) {
            acc[key] = value;
          }
        }
        return acc;
      }, {});
      return {
        key: coerceOptionalString(entry?.key ?? entry?.id ?? entry?.slug, base?.key ?? normalizeSlug(label) || `feature-${index + 1}`),
        label,
        description: coerceOptionalString(entry?.description ?? entry?.summary, base?.description ?? ''),
        tiers: sanitizedTiers,
      };
    })
    .filter(Boolean)
    .slice(0, 10);
  return cleaned.length ? cleaned : baseList.map((item) => ({ ...item }));
}

function sanitizePricingMetrics(metrics, fallback = []) {
  const list = Array.isArray(metrics) ? metrics : [];
  const baseList = Array.isArray(fallback) && fallback.length ? fallback : DEFAULT_PRICING_METRICS;
  const cleaned = list
    .map((entry, index) => {
      const base = baseList[index] ?? baseList[0];
      const label = coerceString(entry?.label ?? entry?.title, base?.label ?? '');
      const value = coerceOptionalString(entry?.value ?? entry?.metric, base?.value ?? '');
      if (!label || !value) {
        return null;
      }
      return {
        label,
        value,
        helper: coerceOptionalString(entry?.helper ?? entry?.description ?? entry?.copy, base?.helper ?? ''),
      };
    })
    .filter(Boolean)
    .slice(0, 8);
  return cleaned.length ? cleaned : baseList.map((item) => ({ ...item }));
}

function sanitizePricing(pricing, fallback = {}) {
  const base = fallback ?? {};
  const source = pricing && typeof pricing === 'object' ? pricing : {};
  return {
    plans: sanitizePricingPlans(source.plans, base.plans ?? DEFAULT_PRICING_PLANS),
    featureMatrix: sanitizePricingFeatureMatrix(source.featureMatrix, base.featureMatrix ?? DEFAULT_PRICING_FEATURE_MATRIX),
    metrics: sanitizePricingMetrics(source.metrics, base.metrics ?? DEFAULT_PRICING_METRICS),
  };
}

function sanitizeMarketing(marketing, fallback = DEFAULT_MARKETING_FRAGMENT) {
  const base = fallback ?? DEFAULT_MARKETING_FRAGMENT;
  const source = marketing && typeof marketing === 'object' ? marketing : {};
  return {
    announcement: sanitizeMarketingAnnouncement(source.announcement, base.announcement),
    trustBadges: sanitizeTrustBadges(source.trustBadges, base.trustBadges),
    personas: sanitizeMarketingPersonas(source.personas, base.personas),
    productTour: { steps: sanitizeProductTourSteps(source?.productTour?.steps ?? source.productTourSteps, base.productTour?.steps) },
    pricing: sanitizePricing(source.pricing, base.pricing),
    testimonials: sanitizeMarketingTestimonials(source.testimonials, base.testimonials),
  };
}

function normalizeRoles(value) {
  if (!value) {
    return [];
  }
  const source = Array.isArray(value) ? value : `${value}`.split(',');
  const unique = new Set();
  source.forEach((item) => {
    if (typeof item !== 'string') {
      return;
    }
    const trimmed = item.trim();
    if (!trimmed) {
      return;
    }
    unique.add(trimmed.toLowerCase());
  });
  return Array.from(unique);
}

function coerceDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function slugify(value) {
  return coerceString(value, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 150);
}

function buildDefaultSiteSettings() {
  return {
    siteName: coerceString(process.env.SITE_NAME, 'Gigvora'),
    tagline: coerceString(process.env.SITE_TAGLINE, 'Where global operators build together'),
    domain: coerceString(process.env.SITE_DOMAIN, 'gigvora.com'),
    primaryColor: coerceString(process.env.SITE_PRIMARY_COLOR, '#2563eb'),
    accentColor: coerceString(process.env.SITE_ACCENT_COLOR, '#f97316'),
    supportEmail: coerceString(process.env.SITE_SUPPORT_EMAIL, 'support@gigvora.com'),
    supportPhone: coerceString(process.env.SITE_SUPPORT_PHONE),
    hero: {
      title: coerceString(process.env.SITE_HERO_TITLE, 'Launch high-trust squads in days'),
      subtitle: coerceString(
        process.env.SITE_HERO_SUBTITLE,
        'Gigvora orchestrates hiring, payments, and trust so your operators can ship outcomes.',
      ),
      backgroundImageUrl: coerceString(process.env.SITE_HERO_IMAGE_URL),
      backgroundImageAlt: coerceString(process.env.SITE_HERO_IMAGE_ALT),
      ctaLabel: coerceString(process.env.SITE_HERO_CTA_LABEL, 'Book a demo'),
      ctaUrl: coerceString(process.env.SITE_HERO_CTA_URL, 'https://gigvora.com/demo'),
    },
    assets: {
      logoUrl: coerceString(process.env.SITE_LOGO_URL),
      faviconUrl: coerceString(process.env.SITE_FAVICON_URL),
    },
    seo: {
      defaultTitle: coerceString(process.env.SITE_SEO_TITLE, 'Gigvora — Enterprise talent network'),
      defaultDescription: coerceString(
        process.env.SITE_SEO_DESCRIPTION,
        'Gigvora connects mission-aligned builders with ready-to-ship operators backed by trust infrastructure.',
      ),
      socialImageUrl: coerceString(process.env.SITE_SOCIAL_IMAGE_URL),
    },
    social: {
      twitter: coerceString(process.env.SITE_TWITTER_URL),
      linkedin: coerceString(process.env.SITE_LINKEDIN_URL),
      youtube: coerceString(process.env.SITE_YOUTUBE_URL),
      instagram: coerceString(process.env.SITE_INSTAGRAM_URL),
    },
    announcement: {
      enabled: coerceBoolean(process.env.SITE_ANNOUNCEMENT_ENABLED, false),
      message: coerceString(process.env.SITE_ANNOUNCEMENT_MESSAGE),
      linkLabel: coerceString(process.env.SITE_ANNOUNCEMENT_LINK_LABEL),
      linkUrl: coerceString(process.env.SITE_ANNOUNCEMENT_LINK_URL),
    },
    footer: {
      links: [],
      copyright: coerceString(process.env.SITE_FOOTER_COPYRIGHT, '© {year} Gigvora. All rights reserved.'),
    },
    heroHeadline: coerceString(
      process.env.SITE_HERO_HEADLINE,
      'Freelancers, agencies, and companies build unstoppable momentum together.',
    ),
    heroSubheading: coerceString(
      process.env.SITE_HERO_SUBHEADING,
      'Gigvora orchestrates hiring, payments, and trust so every initiative ships without friction.',
    ),
    heroKeywords: [...DEFAULT_HERO_KEYWORDS],
    heroMedia: { ...DEFAULT_HERO_MEDIA },
    heroPersonaChips: [...DEFAULT_HERO_PERSONA_CHIPS],
    heroInsightStats: DEFAULT_HERO_INSIGHT_STATS.map((stat) => ({ ...stat })),
    heroValuePillars: DEFAULT_HERO_VALUE_PILLARS.map((pillar) => clonePillar(pillar)),
    communityStats: [...DEFAULT_COMMUNITY_STATS],
    personaJourneys: [...DEFAULT_PERSONA_JOURNEYS],
    personaMetrics: [...DEFAULT_PERSONA_METRICS],
    operationsSummary: { ...DEFAULT_OPERATIONS_SUMMARY },
    recentPosts: [...DEFAULT_RECENT_POSTS],
    marketing: { ...DEFAULT_MARKETING_FRAGMENT },
  };
}

function sanitizeFooterLinks(links) {
  if (!Array.isArray(links)) {
    return [];
  }
  const sanitized = [];
  links.forEach((link) => {
    const label = coerceString(link?.label);
    const url = coerceString(link?.url);
    if (!label || !url) {
      return;
    }
    sanitized.push({
      id: link?.id ?? null,
      label,
      url,
      description: coerceString(link?.description),
      icon: coerceString(link?.icon),
      orderIndex: coerceInteger(link?.orderIndex, sanitized.length),
    });
  });
  return sanitized;
}

function sanitizeSettingsCandidate(candidate = {}) {
  const baseline = buildDefaultSiteSettings();
  const settings = { ...baseline, ...candidate };
  settings.hero = { ...baseline.hero, ...(candidate.hero ?? {}) };
  settings.assets = { ...baseline.assets, ...(candidate.assets ?? {}) };
  settings.seo = { ...baseline.seo, ...(candidate.seo ?? {}) };
  settings.social = { ...baseline.social, ...(candidate.social ?? {}) };
  settings.announcement = { ...baseline.announcement, ...(candidate.announcement ?? {}) };
  settings.footer = { ...baseline.footer, ...(candidate.footer ?? {}) };
  settings.footer.links = sanitizeFooterLinks(settings.footer.links);
  settings.heroHeadline = coerceString(candidate.heroHeadline, baseline.heroHeadline);
  settings.heroSubheading = coerceString(candidate.heroSubheading, baseline.heroSubheading);
  settings.heroKeywords = sanitizeStringArray(candidate.heroKeywords ?? candidate.hero?.keywords, baseline.heroKeywords);
  settings.heroMedia = sanitizeHeroMedia(candidate.heroMedia ?? candidate.hero?.media, baseline.heroMedia);
  settings.heroPersonaChips = sanitizeHeroPersonaChips(
    candidate.heroPersonaChips ?? candidate.hero?.personaChips,
    baseline.heroPersonaChips,
  );
  settings.heroInsightStats = sanitizeHeroInsightStats(
    candidate.heroInsightStats ?? candidate.hero?.insightStats ?? candidate.hero?.stats,
    baseline.heroInsightStats,
  );
  settings.heroValuePillars = sanitizeHeroValuePillars(
    candidate.heroValuePillars ?? candidate.hero?.valuePillars ?? candidate.hero?.valueProps,
    baseline.heroValuePillars,
  );
  settings.communityStats = sanitizeCommunityStats(candidate.communityStats, baseline.communityStats);
  settings.personaJourneys = sanitizePersonaJourneys(candidate.personaJourneys, baseline.personaJourneys);
  settings.personaMetrics = sanitizePersonaMetrics(candidate.personaMetrics, baseline.personaMetrics);
  settings.operationsSummary = sanitizeOperationsSummary(candidate.operationsSummary, baseline.operationsSummary);
  settings.recentPosts = sanitizeRecentPosts(candidate.recentPosts, baseline.recentPosts);
  settings.marketing = sanitizeMarketing(candidate.marketing ?? candidate.marketingExperience, baseline.marketing);
  return settings;
}

async function ensureSiteSetting({ transaction } = {}) {
  const existing = await SiteSetting.findOne({ where: { key: SITE_SETTINGS_KEY }, transaction });
  if (existing) {
    return existing;
  }
  const defaults = buildDefaultSiteSettings();
  return SiteSetting.create(
    {
      key: SITE_SETTINGS_KEY,
      value: defaults,
    },
    { transaction },
  );
}

function normalizeNavigationPayload(payload = {}, { forUpdate = false } = {}) {
  const label = coerceString(payload.label);
  const url = coerceString(payload.url);
  if (!label) {
    throw new ValidationError('Navigation label is required.');
  }
  if (!url) {
    throw new ValidationError('Navigation URL is required.');
  }
  const menuKey = coerceString(payload.menuKey, 'primary').toLowerCase();
  const orderIndex = coerceInteger(payload.orderIndex, 0);
  const allowedRoles = normalizeRoles(payload.allowedRoles);
  return {
    ...(forUpdate ? {} : { menuKey }),
    menuKey,
    label,
    url,
    description: coerceString(payload.description),
    icon: coerceString(payload.icon),
    orderIndex,
    isExternal: coerceBoolean(payload.isExternal, false),
    openInNewTab: coerceBoolean(payload.openInNewTab, false),
    allowedRoles,
    parentId: payload.parentId ?? null,
  };
}

function normalizePagePayload(payload = {}) {
  const title = coerceString(payload.title);
  if (!title) {
    throw new ValidationError('Page title is required.');
  }
  const slug = slugify(payload.slug || title);
  if (!slug) {
    throw new ValidationError('A slug is required to publish the page.');
  }
  const status = coerceString(payload.status, 'draft');
  if (!SITE_PAGE_STATUSES.includes(status)) {
    throw new ValidationError(`Status must be one of ${SITE_PAGE_STATUSES.join(', ')}.`);
  }
  const featureHighlights = Array.isArray(payload.featureHighlights)
    ? payload.featureHighlights.map((item) => coerceString(item)).filter(Boolean)
    : [];
  const seoKeywords = Array.isArray(payload.seoKeywords)
    ? payload.seoKeywords.map((item) => coerceString(item)).filter(Boolean)
    : [];
  const lastReviewedAt = coerceDate(payload.lastReviewedAt);
  return {
    slug,
    title,
    summary: coerceString(payload.summary),
    heroTitle: coerceString(payload.heroTitle),
    heroSubtitle: coerceString(payload.heroSubtitle),
    heroEyebrow: coerceString(payload.heroEyebrow),
    heroMeta: coerceString(payload.heroMeta),
    heroImageUrl: coerceString(payload.heroImageUrl),
    heroImageAlt: coerceString(payload.heroImageAlt),
    ctaLabel: coerceString(payload.ctaLabel),
    ctaUrl: coerceString(payload.ctaUrl),
    layout: coerceString(payload.layout, 'standard'),
    body: payload.body ?? null,
    featureHighlights,
    seoTitle: coerceString(payload.seoTitle),
    seoDescription: coerceString(payload.seoDescription),
    seoKeywords,
    thumbnailUrl: coerceString(payload.thumbnailUrl),
    contactEmail: coerceString(payload.contactEmail),
    contactPhone: coerceString(payload.contactPhone),
    jurisdiction: coerceString(payload.jurisdiction),
    version: coerceString(payload.version),
    lastReviewedAt,
    status,
    allowedRoles: normalizeRoles(payload.allowedRoles),
  };
}

export async function getSiteManagementOverview() {
  const [settingsModel, navigationLinks, pages] = await Promise.all([
    ensureSiteSetting(),
    SiteNavigationLink.findAll({ order: [['menuKey', 'ASC'], ['orderIndex', 'ASC'], ['id', 'ASC']] }),
    SitePage.findAll({ order: [['updatedAt', 'DESC']] }),
  ]);

  const navigation = navigationLinks.reduce((acc, link) => {
    const bucket = link.menuKey ?? 'primary';
    if (!acc[bucket]) {
      acc[bucket] = [];
    }
    acc[bucket].push(link.toPublicObject());
    return acc;
  }, {});

  const pageObjects = pages.map((page) => page.toPublicObject());
  const stats = {
    published: pageObjects.filter((page) => page.status === 'published').length,
    draft: pageObjects.filter((page) => page.status !== 'published').length,
  };

  return {
    settings: settingsModel.value ?? buildDefaultSiteSettings(),
    navigation,
    pages: pageObjects,
    stats,
    updatedAt: new Date().toISOString(),
  };
}

export async function getSiteSettings() {
  const model = await ensureSiteSetting();
  return sanitizeSettingsCandidate(model.value ?? {});
}

export async function getSiteNavigation({ menuKey } = {}) {
  const where = {};
  if (menuKey) {
    where.menuKey = `${menuKey}`.trim();
  }

  const links = await SiteNavigationLink.findAll({
    where,
    order: [
      ['menuKey', 'ASC'],
      ['orderIndex', 'ASC'],
      ['id', 'ASC'],
    ],
  });

  return links.map((link) => link.toPublicObject());
}

export async function saveSiteSettings(patch = {}) {
  const sanitized = sanitizeSettingsCandidate(patch);
  const result = await sequelize.transaction(async (transaction) => {
    const setting = await ensureSiteSetting({ transaction });
    setting.value = sanitized;
    await setting.save({ transaction });
    return setting;
  });
  return { settings: result.toPublicObject().value, updatedAt: result.updatedAt };
}

export async function createNavigation(payload = {}) {
  const normalized = normalizeNavigationPayload(payload);
  const link = await SiteNavigationLink.create(normalized);
  return link.toPublicObject();
}

export async function updateNavigation(linkId, patch = {}) {
  const link = await SiteNavigationLink.findByPk(linkId);
  if (!link) {
    throw new NotFoundError('Navigation link not found.');
  }
  const normalized = normalizeNavigationPayload({ ...link.get({ plain: true }), ...patch }, { forUpdate: true });
  Object.assign(link, normalized);
  await link.save();
  return link.toPublicObject();
}

export async function deleteNavigation(linkId) {
  const deleted = await SiteNavigationLink.destroy({ where: { id: linkId } });
  if (!deleted) {
    throw new NotFoundError('Navigation link not found.');
  }
  return { success: true };
}

export async function createSitePage(payload = {}) {
  const normalized = normalizePagePayload(payload);
  const page = await sequelize.transaction(async (transaction) => {
    const existing = await SitePage.findOne({ where: { slug: normalized.slug }, transaction });
    if (existing) {
      throw new ValidationError('A page with this slug already exists.');
    }
    const created = await SitePage.create(
      {
        ...normalized,
        publishedAt: normalized.status === 'published' ? new Date() : null,
      },
      { transaction },
    );
    return created;
  });
  return page.toPublicObject();
}

export async function updateSitePageById(pageId, patch = {}) {
  if (!pageId) {
    throw new ValidationError('pageId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const page = await SitePage.findByPk(pageId, { transaction });
    if (!page) {
      throw new NotFoundError('Page not found.');
    }
    const mergedPayload = { ...page.toPublicObject(), ...patch };
    const normalized = normalizePagePayload(mergedPayload);
    if (normalized.slug !== page.slug) {
      const clash = await SitePage.findOne({
        where: { slug: normalized.slug, id: { [Op.ne]: pageId } },
        transaction,
      });
      if (clash) {
        throw new ValidationError('Another page already uses this slug.');
      }
    }
    const wasPublished = page.status === 'published';
    const willBePublished = normalized.status === 'published';
    Object.assign(page, normalized);
    if (willBePublished && !wasPublished) {
      page.publishedAt = new Date();
    }
    if (!willBePublished && wasPublished && normalized.status !== 'published') {
      page.publishedAt = page.publishedAt ?? null;
    }
    await page.save({ transaction });
    return page.toPublicObject();
  });
}

export async function deleteSitePageById(pageId) {
  if (!pageId) {
    throw new ValidationError('pageId is required.');
  }
  const deleted = await SitePage.destroy({ where: { id: pageId } });
  if (!deleted) {
    throw new NotFoundError('Page not found.');
  }
  return { success: true };
}

export async function listSitePages({
  status = 'published',
  includeDrafts = false,
  limit = 50,
  offset = 0,
  order = [['publishedAt', 'DESC'], ['updatedAt', 'DESC']],
} = {}) {
  const where = {};
  if (!includeDrafts) {
    const statuses = Array.isArray(status) ? status : [status];
    const sanitised = statuses.map((value) => coerceString(value)).filter((value) => value && value !== 'all');
    where.status = sanitised.length ? sanitised : ['published'];
  } else if (status && status !== 'all') {
    where.status = Array.isArray(status)
      ? status.map((value) => coerceString(value)).filter(Boolean)
      : [coerceString(status)].filter(Boolean);
  }

  const pages = await SitePage.findAll({
    where,
    limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
    offset: Number.isFinite(offset) && offset > 0 ? offset : undefined,
    order,
  });

  return pages.map((page) => page.toPublicObject());
}

export async function getPublishedSitePage(slug, { allowDraft = false } = {}) {
  const normalisedSlug = coerceString(slug);
  if (!normalisedSlug) {
    throw new ValidationError('A slug is required.');
  }

  const where = { slug: normalisedSlug };
  if (!allowDraft) {
    where.status = 'published';
  }

  const page = await SitePage.findOne({ where });
  if (!page) {
    throw new NotFoundError('Page not found.');
  }
  return page.toPublicObject();
}

export default {
  getSiteManagementOverview,
  getSiteSettings,
  getSiteNavigation,
  saveSiteSettings,
  createNavigation,
  updateNavigation,
  deleteNavigation,
  createSitePage,
  updateSitePageById,
  deleteSitePageById,
  listSitePages,
  getPublishedSitePage,
};
