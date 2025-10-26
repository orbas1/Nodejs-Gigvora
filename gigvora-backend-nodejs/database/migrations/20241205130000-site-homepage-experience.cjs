'use strict';

const SITE_SETTINGS_KEY = 'site:global';

const DEFAULT_FRAGMENT = {
  heroHeadline: 'Freelancers, agencies, and companies build unstoppable momentum together.',
  heroSubheading:
    'Gigvora orchestrates hiring, payments, and trust so every initiative ships without friction.',
  heroKeywords: [
    'Launchpad demo streaming · Creation Studio',
    'Mentorship session going live · Design ops',
    'Product squad aligning roadmap · Remote',
    'Trust operations clearing escrow · Finance',
    'Agency pods sharing wins · Atlas Collective',
    'Volunteer mission kicking off · Impact hub',
  ],
  heroMedia: {
    imageUrl: 'https://cdn.gigvora.com/marketing/home/hero-still.jpg',
    posterUrl: 'https://cdn.gigvora.com/marketing/home/hero-poster.jpg',
    alt: 'Gigvora workspace with cross-functional collaborators reviewing milestones.',
    caption: 'Operations, finance, and delivery stay in lockstep with Gigvora.',
    autoPlay: true,
    muted: true,
    loop: true,
    controls: false,
    videoSources: [
      { src: 'https://cdn.gigvora.com/marketing/home/hero-preview.mp4', type: 'video/mp4' },
      { src: 'https://cdn.gigvora.com/marketing/home/hero-preview.webm', type: 'video/webm' },
    ],
  },
  communityStats: [
    { label: 'Global specialists', value: '12,400+' },
    { label: 'Average NPS', value: '68' },
    { label: 'Completion rate', value: '97%' },
  ],
  personaJourneys: [
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
  ],
  personaMetrics: [
    { persona: 'freelancer', label: 'Avg. satisfaction', value: '4.8/5' },
    { persona: 'freelancer', label: 'Opportunities matched', value: '22 per member' },
    { persona: 'agency', label: 'Pods launched last quarter', value: '320' },
    { persona: 'company', label: 'Time-to-invite', value: '48 hrs' },
    { persona: 'mentor', label: 'Office hours booked', value: '3.4k' },
    { persona: 'launchpad', label: 'Launch velocity lift', value: '+34%' },
    { persona: 'volunteer', label: 'Impact rating', value: '4.9/5' },
  ],
  operationsSummary: {
    escrowHealth: { label: 'Escrow health', value: '99.2% uptime', change: '+1.4%', trend: [74, 82, 88, 91, 95, 98, 99] },
    disputeVelocity: { label: 'Dispute velocity', value: '3.2 hrs median', change: '-22%', trend: [18, 16, 14, 12, 9, 7, 6] },
    evidencePipelines: { label: 'Evidence pipelines', value: '87% automated', change: '+9%', trend: [45, 48, 56, 62, 70, 78, 84] },
  },
  recentPosts: [
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
  ],
  marketing: {
    announcement: {
      title: 'Launch orchestration update',
      description: 'Automation blueprints, mentor analytics, and compliance vaults now ship across the Scale tier.',
      cta: { label: 'Read the release notes', action: 'release_notes', href: '/trust-center' },
    },
    trustBadges: [
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
    ],
    personas: [
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
    ],
    testimonials: {
      hero: {
        eyebrow: 'Social proof',
        heading: 'Trusted by operators shipping the future',
        description:
          'From venture studios to enterprise programmes, the teams building on Gigvora speak to velocity, trust, and polish that rivals the largest professional networks.',
        stats: [
          { value: '68', label: 'NPS', helper: 'Rolling 90-day sentiment' },
          { value: '4,200+', label: 'Crews', helper: 'Programmes delivered globally' },
          { value: '92%', label: 'Renewals', helper: 'Expansions inside 60 days' },
        ],
      },
      items: [
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
          quote: 'Our accelerator pairs mentors and founders instantly. The shared telemetry keeps every stakeholder aligned.',
          authorName: 'Diego Martínez',
          authorRole: 'Programme Director',
          authorCompany: 'Aurora Collective',
          avatarUrl: 'https://cdn.gigvora.com/assets/avatars/diego-martinez.png',
          avatarAlt: 'Portrait of Diego Martínez laughing',
          highlight: 'Raised cohort satisfaction to 96% in two seasons.',
          badge: 'Global accelerator',
        },
      ],
    },
    productTour: {
      steps: [
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
      ],
    },
    pricing: {
      plans: [
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
      ],
      featureMatrix: [
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
      ],
      metrics: [
        { label: 'Customer acquisition lift', value: '38%', helper: 'Marketing funnel lift measured across 120-day pilots.' },
        { label: 'Time-to-launch reduction', value: '2.3x faster', helper: 'Median improvement observed across scale customers.' },
        { label: 'Mentor satisfaction', value: '96%', helper: 'Mentor guild NPS from the past four quarters.' },
      ],
    },
  },
  closingCta: {
    eyebrow: 'Membership',
    title: 'Join the community where elite crews, mentors, and operators ship together',
    description:
      'Onboard in minutes, align collaborators, and access vetted specialists who move at the pace of your programme.',
    primaryAction: { label: 'Claim your seat', route: '/register' },
    secondaryAction: { label: 'Talk with our team', href: 'mailto:hello@gigvora.com' },
    supportingPoints: [
      'Curated crews that stay in sync with your roadmap',
      'Mentorship from seasoned operators and advisors',
      'Enterprise compliance, payments, and onboarding built-in',
      {
        title: 'Global reach with local nuance',
        description: '42 countries represented across product, growth, and impact missions.',
      },
    ],
    stats: [
      { label: 'Teams onboarded', value: '3,800+', helper: 'Accelerating launches worldwide' },
      { label: 'Average go-live', value: '6 weeks', helper: 'From kickoff to first delivery' },
      { label: 'Mentor network', value: '420+', helper: 'Operators coaching every cohort' },
    ],
    logos: ['Northwind Digital', 'Forma Studio', 'Atlas Labs', 'Redbird Ventures'],
    guarantees: ['SOC2 Type II', { label: 'Global compliance' }, { label: 'Escrow protected' }],
    testimonial: {
      quote: 'Gigvora aligned our mentors and operators within days—we shipped our launch playbook 3x faster.',
      name: 'Leah Patel',
      role: 'Programme Director',
      company: 'Northwind Digital',
      avatar: {
        src: 'https://cdn.gigvora.com/assets/avatars/leah-patel.png',
        alt: 'Portrait of Leah Patel smiling',
      },
    },
    footnote: 'Backed by production telemetry across venture, enterprise, and social impact programmes.',
  },
};

const safeString = (value, fallback = '') => {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return fallback;
};

const safeBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(lowered)) return true;
    if (['false', '0', 'no', 'n'].includes(lowered)) return false;
  }
  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      return value !== 0;
    }
  }
  return fallback;
};

const safeNumberArray = (values, fallback = []) => {
  if (!Array.isArray(values)) {
    return [...fallback];
  }
  const cleaned = values
    .map((value) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : null;
    })
    .filter((value) => value !== null)
    .slice(0, 14);
  return cleaned.length ? cleaned : [...fallback];
};

const safeStringArray = (values, fallback = [], { limit = 12 } = {}) => {
  if (!Array.isArray(values)) {
    return [...fallback];
  }
  const cleaned = values
    .map((value) => safeString(value))
    .filter((value) => value.length > 0)
    .slice(0, limit);
  return cleaned.length ? cleaned : [...fallback];
};

const normalizeKey = (value, fallback) => {
  const source = safeString(value, fallback || '');
  return source
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
};

const sanitizeVideoSources = (sources, fallback = []) => {
  const list = Array.isArray(sources) ? sources : fallback;
  const cleaned = list
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const src = safeString(entry.src ?? entry.url, '');
      if (!src) {
        return null;
      }
      return {
        src,
        type: safeString(entry.type, 'video/mp4'),
      };
    })
    .filter(Boolean)
    .slice(0, 4);
  return cleaned.length ? cleaned : [...fallback];
};

const sanitizeHeroMedia = (media) => {
  const base = DEFAULT_FRAGMENT.heroMedia;
  const source = media && typeof media === 'object' ? media : {};
  const merged = {
    imageUrl: safeString(source.imageUrl, base.imageUrl),
    posterUrl: safeString(source.posterUrl, base.posterUrl),
    alt: safeString(source.alt, base.alt),
    caption: safeString(source.caption, base.caption),
    autoPlay: safeBoolean(source.autoPlay, base.autoPlay),
    muted: safeBoolean(source.muted, base.muted),
    loop: safeBoolean(source.loop, base.loop),
    controls: safeBoolean(source.controls, base.controls),
    videoSources: sanitizeVideoSources(source.videoSources, base.videoSources),
  };
  const primaryVideoUrl = safeString(source.videoUrl, base.videoUrl || '');
  if (primaryVideoUrl) {
    merged.videoUrl = primaryVideoUrl;
    merged.videoType = safeString(source.videoType, 'video/mp4');
  } else if (base.videoUrl) {
    merged.videoUrl = base.videoUrl;
    merged.videoType = safeString(base.videoType, 'video/mp4');
  }
  return merged;
};

const sanitizeCommunityStats = (stats) => {
  const source = Array.isArray(stats) ? stats : [];
  const cleaned = source
    .map((entry) => ({
      label: safeString(entry?.label ?? entry?.name, ''),
      value: safeString(entry?.value ?? entry?.metric, ''),
    }))
    .filter((entry) => entry.label && entry.value)
    .slice(0, DEFAULT_FRAGMENT.communityStats.length);
  return cleaned.length ? cleaned : DEFAULT_FRAGMENT.communityStats;
};

const sanitizePersonaSteps = (steps, fallback = []) => {
  const list = Array.isArray(steps) ? steps : fallback;
  return list
    .map((step, index) => {
      const base = fallback[index] ?? fallback[0] ?? {};
      const label = safeString(step?.label ?? step?.title ?? step?.name, base.label || '');
      if (!label) {
        return null;
      }
      return {
        label,
        icon: safeString(step?.icon ?? base.icon ?? 'SparklesIcon'),
      };
    })
    .filter(Boolean)
    .slice(0, 6);
};

const sanitizePersonaMetrics = (metrics, fallback = []) => {
  if (!metrics) {
    return [...fallback];
  }
  const list = Array.isArray(metrics)
    ? metrics
    : Object.entries(metrics).flatMap(([key, value]) => {
        const entries = Array.isArray(value) ? value : [value];
        return entries.map((entry) => ({ ...entry, persona: entry?.persona ?? key }));
      });
  const cleaned = list
    .map((entry) => {
      const persona = normalizeKey(entry?.persona ?? entry?.key ?? entry?.id, '');
      const label = safeString(entry?.label ?? entry?.title ?? entry?.name, '');
      const value = safeString(entry?.value ?? entry?.metric ?? entry?.copy, '');
      const change = safeString(entry?.change ?? entry?.delta, '');
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
  return cleaned.length ? cleaned : [...fallback];
};

const sanitizePersonaJourneys = (journeys) => {
  const fallback = DEFAULT_FRAGMENT.personaJourneys;
  const map = new Map();
  fallback.forEach((entry) => {
    map.set(entry.key, { ...entry });
  });
  const list = Array.isArray(journeys) ? journeys : [];
  list.forEach((entry, index) => {
    const key = normalizeKey(entry?.key ?? entry?.id ?? entry?.persona ?? entry?.name, fallback[index]?.key);
    if (!key) {
      return;
    }
    const baseline = map.get(key) ?? fallback[index] ?? fallback[0];
    map.set(key, {
      key,
      title: safeString(entry?.title ?? entry?.name, baseline.title),
      description: safeString(entry?.description ?? entry?.copy, baseline.description),
      icon: safeString(entry?.icon ?? baseline.icon, 'SparklesIcon'),
      route: safeString(entry?.route ?? entry?.href ?? entry?.url, baseline.route),
      ctaLabel: safeString(entry?.ctaLabel ?? entry?.cta ?? entry?.ctaText, baseline.ctaLabel),
      tone: safeString(entry?.tone ?? entry?.theme, baseline.tone),
      steps: sanitizePersonaSteps(entry?.steps, baseline.steps),
      metrics: sanitizePersonaMetrics(entry?.metrics, baseline.metrics),
      source: safeString(entry?.source, baseline.source || 'settings'),
    });
  });
  return Array.from(map.values()).slice(0, fallback.length);
};

const sanitizeOperationsSummary = (summary) => {
  const fallback = DEFAULT_FRAGMENT.operationsSummary;
  const source = summary && typeof summary === 'object' ? summary : {};
  const sanitizeMetric = (metric, key) => {
    const base = fallback[key] ?? {};
    return {
      label: safeString(metric?.label ?? base.label, base.label),
      value: safeString(metric?.value ?? metric?.metric, base.value),
      change: safeString(metric?.change ?? metric?.delta, base.change),
      trend: safeNumberArray(metric?.trend, base.trend || []),
    };
  };
  return {
    escrowHealth: sanitizeMetric(source.escrowHealth, 'escrowHealth'),
    disputeVelocity: sanitizeMetric(source.disputeVelocity, 'disputeVelocity'),
    evidencePipelines: sanitizeMetric(source.evidencePipelines, 'evidencePipelines'),
  };
};

const sanitizeRecentPosts = (posts) => {
  const fallback = DEFAULT_FRAGMENT.recentPosts;
  const list = Array.isArray(posts) ? posts : [];
  const cleaned = list
    .map((entry, index) => {
      const base = fallback[index] ?? {};
      const title = safeString(entry?.title ?? entry?.headline, base.title || '');
      const summary = safeString(entry?.summary ?? entry?.content ?? entry?.body, base.summary || '');
      if (!title || !summary) {
        return null;
      }
      return {
        id: safeString(entry?.id, base.id || `post-${index + 1}`),
        title,
        summary,
        type: normalizeKey(entry?.type ?? entry?.category, base.type || 'update') || 'update',
        authorName: safeString(entry?.authorName ?? entry?.author?.name, base.authorName || 'Gigvora community'),
        authorHeadline: safeString(
          entry?.authorHeadline ?? entry?.author?.headline ?? entry?.author?.title,
          base.authorHeadline || 'Marketplace community update',
        ),
        avatarUrl: safeString(entry?.avatarUrl ?? entry?.author?.avatarUrl, base.avatarUrl || ''),
        avatarSeed: safeString(entry?.avatarSeed ?? entry?.author?.id, base.avatarSeed || base.id || `post-${index + 1}`),
        createdAt: safeString(entry?.createdAt ?? entry?.publishedAt, base.createdAt || ''),
      };
    })
    .filter(Boolean)
    .slice(0, fallback.length);
  return cleaned.length ? cleaned : fallback;
};

const sanitizeCta = (cta, fallback = {}) => {
  const base = fallback ?? {};
  const label = safeString(cta?.label ?? cta?.title, base.label ?? '');
  if (!label) {
    return base.label ? { label: base.label, action: base.action, href: base.href, route: base.route } : null;
  }
  const payload = { label };
  const action = safeString(cta?.action, base.action ?? '').trim();
  if (action) {
    payload.action = action;
  }
  const href = safeString(cta?.href ?? cta?.url, base.href ?? base.url ?? '').trim();
  if (href) {
    payload.href = href;
  }
  const route = !href ? safeString(cta?.route ?? cta?.path, base.route ?? '').trim() : '';
  if (route) {
    payload.route = route;
  }
  const target = safeString(cta?.target, base.target ?? '').trim();
  if (target) {
    payload.target = target;
  }
  return payload;
};

const sanitizePersonaHighlightsList = (highlights, fallback = []) => {
  const list = Array.isArray(highlights) ? highlights : fallback;
  const cleaned = list
    .map((item) => safeString(item))
    .filter((item) => item.length > 0)
    .slice(0, 6);
  return cleaned.length ? cleaned : [...fallback];
};

const sanitizePersonaHighlightsMap = (highlights, fallback = {}) => {
  const source = highlights && typeof highlights === 'object' ? highlights : {};
  const result = {};
  Object.entries(source).forEach(([key, value]) => {
    const personaKey = normalizeKey(key, key);
    if (!personaKey) {
      return;
    }
    result[personaKey] = sanitizePersonaHighlightsList(value, fallback[personaKey] ?? []);
  });
  if (fallback.default && !result.default) {
    result.default = sanitizePersonaHighlightsList(fallback.default, fallback.default);
  }
  return Object.keys(result).length ? result : { ...fallback };
};

const sanitizeTrustBadges = (badges, fallback = []) => {
  const baseList = Array.isArray(fallback) && fallback.length ? fallback : DEFAULT_FRAGMENT.marketing.trustBadges;
  const list = Array.isArray(badges) ? badges : [];
  const cleaned = list
    .map((badge, index) => {
      const base = baseList[index] ?? baseList[0];
      const label = safeString(badge?.label ?? badge?.name ?? badge?.title, base?.label ?? '');
      if (!label) {
        return null;
      }
      return {
        id: safeString(
          badge?.id ?? badge?.key ?? badge?.slug,
          base?.id ?? (normalizeKey(label, label) || `badge-${index + 1}`),
        ),
        label,
        description: safeString(badge?.description ?? badge?.copy, base?.description ?? ''),
      };
    })
    .filter(Boolean)
    .slice(0, 6);
  return cleaned.length ? cleaned : baseList.map((item) => ({ ...item }));
};

const sanitizeMarketingAnnouncement = (announcement, fallback = {}) => {
  const base = fallback ?? {};
  const title = safeString(announcement?.title ?? announcement?.headline, base.title ?? '');
  const description = safeString(announcement?.description ?? announcement?.copy, base.description ?? '');
  const cta = sanitizeCta(announcement?.cta, base.cta);
  const payload = {
    title: title || base.title || DEFAULT_FRAGMENT.marketing.announcement.title,
    description: description || base.description || DEFAULT_FRAGMENT.marketing.announcement.description,
  };
  if (cta) {
    payload.cta = cta;
  } else if (base.cta) {
    payload.cta = base.cta;
  }
  return payload;
};

const sanitizeHeroStats = (stats, fallback = []) => {
  const baseList = Array.isArray(fallback) && fallback.length ? fallback : DEFAULT_FRAGMENT.marketing.testimonials.hero.stats;
  const list = Array.isArray(stats) ? stats : [];
  const cleaned = list
    .map((stat, index) => {
      const base = baseList[index] ?? baseList[0];
      const value = safeString(stat?.value, base?.value ?? '');
      const label = safeString(stat?.label, base?.label ?? '');
      if (!value || !label) {
        return null;
      }
      return {
        value,
        label,
        helper: safeString(stat?.helper ?? stat?.description ?? stat?.copy, base?.helper ?? ''),
      };
    })
    .filter(Boolean)
    .slice(0, 6);
  return cleaned.length ? cleaned : baseList.map((item) => ({ ...item }));
};

const sanitizeTestimonialsHero = (hero, fallback = {}) => {
  const base = fallback && typeof fallback === 'object' ? fallback : DEFAULT_FRAGMENT.marketing.testimonials.hero;
  const source = hero && typeof hero === 'object' ? hero : {};
  const heading = safeString(source.heading ?? source.title, base.heading ?? '');
  return {
    eyebrow: safeString(source.eyebrow ?? source.label, base.eyebrow ?? ''),
    heading: heading || base.heading || DEFAULT_FRAGMENT.marketing.testimonials.hero.heading,
    description: safeString(source.description ?? source.summary, base.description ?? ''),
    stats: sanitizeHeroStats(source.stats ?? source.metrics, base.stats ?? []),
  };
};

const sanitizeTestimonialItems = (items, fallback = []) => {
  const baseList = Array.isArray(fallback) && fallback.length ? fallback : DEFAULT_FRAGMENT.marketing.testimonials.items;
  const list = Array.isArray(items) ? items : [];
  const cleaned = list
    .map((testimonial, index) => {
      const base = baseList[index] ?? baseList[0];
      const quote = safeString(testimonial?.quote, base?.quote ?? '');
      const authorName = safeString(testimonial?.authorName ?? testimonial?.name, base?.authorName ?? '');
      if (!quote || !authorName) {
        return null;
      }
      const id = safeString(
        testimonial?.id ?? testimonial?.key ?? testimonial?.slug,
        base?.id ?? (normalizeKey(authorName, authorName) || `testimonial-${index + 1}`),
      );
      const authorRole = safeString(testimonial?.authorRole ?? testimonial?.role, base?.authorRole ?? '');
      const authorCompany = safeString(
        testimonial?.authorCompany ?? testimonial?.company ?? testimonial?.organisation ?? testimonial?.organization,
        base?.authorCompany ?? '',
      );
      const avatarUrl = safeString(
        testimonial?.avatarUrl ?? testimonial?.avatar?.src ?? testimonial?.avatar,
        base?.avatarUrl ?? '',
      );
      const avatarAlt = safeString(
        testimonial?.avatarAlt ?? testimonial?.avatar?.alt ?? testimonial?.avatarAltText,
        base?.avatarAlt ?? (authorName ? `${authorName} portrait` : ''),
      );
      const highlight = safeString(
        testimonial?.highlight ?? testimonial?.highlightSummary ?? testimonial?.result,
        base?.highlight ?? '',
      );
      const badge = safeString(testimonial?.badge ?? testimonial?.tag ?? testimonial?.segment, base?.badge ?? '');

      return {
        id,
        quote,
        authorName,
        authorRole,
        authorCompany,
        avatarUrl,
        avatarAlt,
        highlight,
        badge,
      };
    })
    .filter(Boolean)
    .slice(0, 6);
  return cleaned.length ? cleaned : baseList.map((item) => ({ ...item }));
};

const sanitizeMarketingTestimonials = (testimonials, fallback = {}) => {
  const baseSection = fallback && typeof fallback === 'object' && !Array.isArray(fallback)
    ? fallback
    : DEFAULT_FRAGMENT.marketing.testimonials;
  if (Array.isArray(testimonials)) {
    return {
      hero: sanitizeTestimonialsHero({}, baseSection.hero ?? {}),
      items: sanitizeTestimonialItems(testimonials, baseSection.items ?? []),
    };
  }

  const source = testimonials && typeof testimonials === 'object' ? testimonials : {};
  const itemsSource = Array.isArray(source.items)
    ? source.items
    : Array.isArray(source.testimonials)
    ? source.testimonials
    : Array.isArray(source.quotes)
    ? source.quotes
    : [];

  return {
    hero: sanitizeTestimonialsHero(source.hero ?? source, baseSection.hero ?? {}),
    items: sanitizeTestimonialItems(itemsSource, baseSection.items ?? []),
  };
};

const sanitizeSupportingPoints = (points, fallback = []) => {
  const baseList = Array.isArray(fallback) && fallback.length ? fallback : DEFAULT_FRAGMENT.closingCta.supportingPoints;
  const list = Array.isArray(points) ? points : [];
  const cleaned = list
    .map((point, index) => {
      if (typeof point === 'string') {
        const label = safeString(point, '');
        return label ? label : null;
      }
      const base = baseList[index] ?? baseList[0];
      const title = safeString(point?.title ?? point?.heading, base?.title ?? '');
      const description = safeString(point?.description ?? point?.copy, base?.description ?? '');
      if (!title && !description) {
        return null;
      }
      return {
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
      };
    })
    .filter(Boolean)
    .slice(0, 6);
  return cleaned.length ? cleaned : baseList.map((item) => (typeof item === 'string' ? item : { ...item }));
};

const sanitizeLogos = (logos, fallback = []) => {
  const baseList = Array.isArray(fallback) && fallback.length ? fallback : DEFAULT_FRAGMENT.closingCta.logos;
  const list = Array.isArray(logos) ? logos : [];
  const cleaned = list
    .map((logo, index) => {
      if (typeof logo === 'string') {
        const label = safeString(logo, '');
        return label ? label : null;
      }
      const base = baseList[index] ?? baseList[0];
      const label = safeString(logo?.label ?? logo?.name, base ?? '');
      return label ? label : null;
    })
    .filter(Boolean)
    .slice(0, 8);
  return cleaned.length ? cleaned : baseList.map((item) => (typeof item === 'string' ? item : safeString(item, '')));
};

const sanitizeGuarantees = (guarantees, fallback = []) => {
  const baseList = Array.isArray(fallback) && fallback.length ? fallback : DEFAULT_FRAGMENT.closingCta.guarantees;
  const list = Array.isArray(guarantees) ? guarantees : [];
  const cleaned = list
    .map((guarantee, index) => {
      if (typeof guarantee === 'string') {
        const label = safeString(guarantee, '');
        return label ? label : null;
      }
      const base = baseList[index] ?? baseList[0];
      const label = safeString(guarantee?.label ?? guarantee?.title, base?.label ?? '');
      if (!label) {
        return null;
      }
      return { label };
    })
    .filter(Boolean)
    .slice(0, 6);
  return cleaned.length ? cleaned : baseList.map((item) => (typeof item === 'string' ? item : { ...item }));
};

const sanitizeTestimonialSpotlight = (testimonial, fallback = {}) => {
  const base = fallback && typeof fallback === 'object' ? fallback : DEFAULT_FRAGMENT.closingCta.testimonial;
  const source = testimonial && typeof testimonial === 'object' ? testimonial : {};
  const quote = safeString(source.quote, base.quote ?? '');
  const name = safeString(source.name ?? source.author, base.name ?? base.author ?? '');
  if (!quote || !name) {
    return base;
  }
  const role = safeString(source.role ?? source.authorRole, base.role ?? base.authorRole ?? '');
  const company = safeString(source.company ?? source.authorCompany, base.company ?? base.authorCompany ?? '');
  const avatarSource = source.avatar && typeof source.avatar === 'object' ? source.avatar : {};
  const avatar = source.avatar
    ? {
        src: safeString(avatarSource.src ?? source.avatar, base.avatar?.src ?? ''),
        alt: safeString(avatarSource.alt ?? source.avatarAlt, base.avatar?.alt ?? ''),
      }
    : base.avatar
    ? { ...base.avatar }
    : undefined;

  return {
    quote,
    name,
    ...(role ? { role } : {}),
    ...(company ? { company } : {}),
    ...(avatar?.src ? { avatar } : {}),
  };
};

const sanitizeCtaAction = (action, fallback = {}) => {
  const base = fallback && typeof fallback === 'object' ? fallback : {};
  const source = action && typeof action === 'object' ? action : {};
  const label = safeString(source.label ?? source.title, base.label ?? '');
  if (!label) {
    return base.label ? { ...base } : null;
  }
  const payload = { label };
  const href = safeString(source.href ?? source.url, base.href ?? '');
  if (href) {
    payload.href = href;
  }
  const route = !href ? safeString(source.route ?? source.path, base.route ?? '') : '';
  if (route) {
    payload.route = route;
  }
  const target = safeString(source.target, base.target ?? '');
  if (target) {
    payload.target = target;
  }
  return payload;
};

const sanitizeClosingCta = (closingCta, fallback = {}) => {
  const base = fallback && typeof fallback === 'object' ? fallback : DEFAULT_FRAGMENT.closingCta;
  const source = closingCta && typeof closingCta === 'object' ? closingCta : {};
  const ensureAction = (action, baseAction) => {
    if (action) {
      return action;
    }
    if (baseAction && typeof baseAction === 'object') {
      return sanitizeCtaAction(baseAction, {}) ?? { ...baseAction };
    }
    return null;
  };
  const eyebrow = safeString(source.eyebrow ?? source.label, base.eyebrow ?? DEFAULT_FRAGMENT.closingCta.eyebrow ?? '');
  const title = safeString(source.title ?? source.heading, base.title ?? DEFAULT_FRAGMENT.closingCta.title ?? '');
  const description = safeString(
    source.description ?? source.summary,
    base.description ?? DEFAULT_FRAGMENT.closingCta.description ?? '',
  );
  const footnote = safeString(
    source.footnote ?? source.footerNote ?? source.caption,
    base.footnote ?? DEFAULT_FRAGMENT.closingCta.footnote ?? '',
  );
  const primary = sanitizeCtaAction(source.primaryAction ?? source.primary, base.primaryAction ?? {});
  const secondary = sanitizeCtaAction(source.secondaryAction ?? source.secondary, base.secondaryAction ?? {});
  const supportingPointsFallback = base.supportingPoints ?? DEFAULT_FRAGMENT.closingCta.supportingPoints ?? [];
  const statsFallback = base.stats ?? DEFAULT_FRAGMENT.closingCta.stats ?? [];
  const logosFallback = base.logos ?? DEFAULT_FRAGMENT.closingCta.logos ?? [];
  const guaranteesFallback = base.guarantees ?? DEFAULT_FRAGMENT.closingCta.guarantees ?? [];
  const testimonialFallback = base.testimonial ?? DEFAULT_FRAGMENT.closingCta.testimonial ?? {};

  return {
    eyebrow: eyebrow || DEFAULT_FRAGMENT.closingCta.eyebrow,
    title: title || DEFAULT_FRAGMENT.closingCta.title,
    description: description || DEFAULT_FRAGMENT.closingCta.description,
    primaryAction: ensureAction(primary, base.primaryAction ?? DEFAULT_FRAGMENT.closingCta.primaryAction),
    secondaryAction: ensureAction(secondary, base.secondaryAction ?? DEFAULT_FRAGMENT.closingCta.secondaryAction),
    supportingPoints: sanitizeSupportingPoints(source.supportingPoints, supportingPointsFallback),
    stats: sanitizeHeroStats(source.stats ?? source.metrics, statsFallback),
    logos: sanitizeLogos(source.logos, logosFallback),
    guarantees: sanitizeGuarantees(source.guarantees, guaranteesFallback),
    testimonial: sanitizeTestimonialSpotlight(source.testimonial, testimonialFallback),
    footnote: footnote || DEFAULT_FRAGMENT.closingCta.footnote,
  };
};

const sanitizeTourMedia = (media, fallback = {}) => {
  const source = media && typeof media === 'object' ? media : {};
  const base = fallback ?? {};
  const type = ['video', 'image'].includes(source.type) ? source.type : base.type ?? 'image';
  const sanitized = { type };
  if (type === 'video') {
    const sources = Array.isArray(source.sources) ? source.sources : base.sources ?? [];
    sanitized.sources = sources
      .map((entry) => {
        const src = safeString(entry?.src ?? entry?.url, '');
        if (!src) {
          return null;
        }
        return {
          src,
          type: safeString(entry?.type ?? base?.sources?.[0]?.type ?? 'video/mp4', 'video/mp4'),
        };
      })
      .filter(Boolean)
      .slice(0, 4);
    if (!sanitized.sources.length && Array.isArray(base.sources)) {
      sanitized.sources = base.sources.map((item) => ({ ...item }));
    }
    const poster = safeString(source.posterUrl ?? source.poster, base.posterUrl ?? base.poster ?? '');
    if (poster) {
      sanitized.posterUrl = poster;
    }
  } else {
    sanitized.src = safeString(source.src ?? base.src ?? '', '');
    const alt = safeString(source.alt ?? source.altText ?? base.alt ?? base.altText ?? '', '');
    if (alt) {
      sanitized.alt = alt;
    }
  }
  return sanitized;
};

const sanitizeProductTourSteps = (steps, fallback = []) => {
  const baseList = Array.isArray(fallback) && fallback.length ? fallback : DEFAULT_FRAGMENT.marketing.productTour.steps;
  const list = Array.isArray(steps) ? steps : [];
  const cleaned = list
    .map((step, index) => {
      const base = baseList[index] ?? baseList[0];
      const title = safeString(step?.title ?? step?.headline, base?.title ?? '');
      if (!title) {
        return null;
      }
      const id = safeString(
        step?.id ?? step?.key ?? step?.slug,
        base?.id ?? (normalizeKey(title, title) || `step-${index + 1}`),
      );
      const cta = sanitizeCta(step?.cta, base?.cta);
      const secondaryCta = sanitizeCta(step?.secondaryCta, base?.secondaryCta);
      return {
        id,
        label: safeString(step?.label ?? step?.shortTitle, base?.label ?? `Step ${index + 1}`),
        title,
        summary: safeString(step?.summary ?? step?.description, base?.summary ?? ''),
        personaHighlights: sanitizePersonaHighlightsMap(step?.personaHighlights ?? step?.highlightsByPersona, base?.personaHighlights ?? {}),
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
};

const sanitizeMarketingPersonas = (personas, fallback = []) => {
  const baseList = Array.isArray(fallback) && fallback.length ? fallback : DEFAULT_FRAGMENT.marketing.personas;
  const list = Array.isArray(personas) ? personas : [];
  const cleaned = list
    .map((persona, index) => {
      const base = baseList[index] ?? baseList[0];
      const label = safeString(persona?.label ?? persona?.name ?? persona?.title, base?.label ?? '');
      if (!label) {
        return null;
      }
      return {
        id: safeString(
          persona?.id ?? persona?.key ?? persona?.slug,
          base?.id ?? (normalizeKey(label, label) || `persona-${index + 1}`),
        ),
        label,
        description: safeString(persona?.description ?? persona?.summary ?? persona?.copy, base?.description ?? ''),
        route: safeString(persona?.route ?? persona?.href ?? persona?.url ?? base?.route ?? '', ''),
      };
    })
    .filter(Boolean)
    .slice(0, 6);
  return cleaned.length ? cleaned : baseList.map((item) => ({ ...item }));
};

const sanitizePricingPlans = (plans, fallback = []) => {
  const baseList = Array.isArray(fallback) && fallback.length ? fallback : DEFAULT_FRAGMENT.marketing.pricing.plans;
  const list = Array.isArray(plans) ? plans : [];
  const cleaned = list
    .map((plan, index) => {
      const base = baseList[index] ?? baseList[0];
      const name = safeString(plan?.name ?? plan?.title, base?.name ?? '');
      if (!name) {
        return null;
      }
      const features = Array.isArray(plan?.features)
        ? plan.features.map((item) => safeString(item)).filter((item) => item.length > 0)
        : Array.isArray(base?.features)
        ? base.features
        : [];
      const metrics = Object.entries({ ...base?.metrics, ...(plan?.metrics ?? {}) }).reduce((acc, [label, value]) => {
        const safeLabel = safeString(label, '');
        const safeValue = safeString(value, base?.metrics?.[label] ?? '');
        if (safeLabel && safeValue) {
          acc[safeLabel] = safeValue;
        }
        return acc;
      }, {});
      return {
        id: safeString(
          plan?.id ?? plan?.key ?? plan?.slug,
          base?.id ?? (normalizeKey(name, name) || `plan-${index + 1}`),
        ),
        name,
        headline: safeString(plan?.headline ?? plan?.description, base?.headline ?? ''),
        pricing: plan?.pricing && typeof plan.pricing === 'object' ? { ...base?.pricing, ...plan.pricing } : base?.pricing ?? {},
        cadenceLabel: safeString(plan?.cadenceLabel, base?.cadenceLabel ?? ''),
        savings: plan?.savings && typeof plan.savings === 'object' ? { ...base?.savings, ...plan.savings } : base?.savings ?? {},
        features,
        metrics,
        recommended: plan?.recommended ?? base?.recommended ?? false,
        ctaLabel: safeString(plan?.ctaLabel ?? plan?.ctaText, base?.ctaLabel ?? ''),
      };
    })
    .filter(Boolean)
    .slice(0, 6);
  return cleaned.length ? cleaned : baseList.map((item) => ({ ...item }));
};

const sanitizePricingFeatureMatrix = (matrix, fallback = []) => {
  const baseList = Array.isArray(fallback) && fallback.length ? fallback : DEFAULT_FRAGMENT.marketing.pricing.featureMatrix;
  const list = Array.isArray(matrix) ? matrix : [];
  const cleaned = list
    .map((entry, index) => {
      const base = baseList[index] ?? baseList[0];
      const label = safeString(entry?.label ?? entry?.title, base?.label ?? '');
      if (!label) {
        return null;
      }
      const tiers = Object.entries({ ...base?.tiers, ...(entry?.tiers ?? {}) }).reduce((acc, [tierKey, tierValue]) => {
        const key = normalizeKey(tierKey, tierKey);
        if (!key) {
          return acc;
        }
        if (typeof tierValue === 'boolean') {
          acc[key] = tierValue;
        } else {
          const value = safeString(tierValue, base?.tiers?.[key] ?? '');
          if (value) {
            acc[key] = value;
          }
        }
        return acc;
      }, {});
      return {
        key: safeString(
          entry?.key ?? entry?.id ?? entry?.slug,
          base?.key ?? (normalizeKey(label, label) || `feature-${index + 1}`),
        ),
        label,
        description: safeString(entry?.description ?? entry?.summary, base?.description ?? ''),
        tiers,
      };
    })
    .filter(Boolean)
    .slice(0, 10);
  return cleaned.length ? cleaned : baseList.map((item) => ({ ...item }));
};

const sanitizePricingMetrics = (metrics, fallback = []) => {
  const baseList = Array.isArray(fallback) && fallback.length ? fallback : DEFAULT_FRAGMENT.marketing.pricing.metrics;
  const list = Array.isArray(metrics) ? metrics : [];
  const cleaned = list
    .map((entry, index) => {
      const base = baseList[index] ?? baseList[0];
      const label = safeString(entry?.label ?? entry?.title, base?.label ?? '');
      const value = safeString(entry?.value ?? entry?.metric, base?.value ?? '');
      if (!label || !value) {
        return null;
      }
      return {
        label,
        value,
        helper: safeString(entry?.helper ?? entry?.description ?? entry?.copy, base?.helper ?? ''),
      };
    })
    .filter(Boolean)
    .slice(0, 8);
  return cleaned.length ? cleaned : baseList.map((item) => ({ ...item }));
};

const sanitizePricing = (pricing, fallback = DEFAULT_FRAGMENT.marketing.pricing) => {
  const base = fallback && typeof fallback === 'object' ? fallback : DEFAULT_FRAGMENT.marketing.pricing;
  const source = pricing && typeof pricing === 'object' ? pricing : {};
  return {
    plans: sanitizePricingPlans(source.plans, base.plans),
    featureMatrix: sanitizePricingFeatureMatrix(source.featureMatrix, base.featureMatrix),
    metrics: sanitizePricingMetrics(source.metrics, base.metrics),
  };
};

const sanitizeMarketing = (marketing) => {
  const fallback = DEFAULT_FRAGMENT.marketing;
  const source = marketing && typeof marketing === 'object' ? marketing : {};
  return {
    announcement: sanitizeMarketingAnnouncement(source.announcement, fallback.announcement),
    trustBadges: sanitizeTrustBadges(source.trustBadges, fallback.trustBadges),
    personas: sanitizeMarketingPersonas(source.personas, fallback.personas),
    productTour: {
      steps: sanitizeProductTourSteps(source?.productTour?.steps ?? source.productTourSteps, fallback.productTour.steps),
    },
    testimonials: sanitizeMarketingTestimonials(source.testimonials, fallback.testimonials),
    pricing: sanitizePricing(source.pricing, fallback.pricing),
    closingCta: sanitizeClosingCta(source.closingCta ?? source.ctaBand ?? source.joinCommunity, fallback.closingCta),
  };
};

const mergeSettings = (current = {}) => {
  const merged = { ...current };
  merged.heroHeadline = safeString(current.heroHeadline, DEFAULT_FRAGMENT.heroHeadline);
  merged.heroSubheading = safeString(current.heroSubheading, DEFAULT_FRAGMENT.heroSubheading);
  merged.heroKeywords = safeStringArray(current.heroKeywords, DEFAULT_FRAGMENT.heroKeywords, { limit: 12 });
  merged.heroMedia = sanitizeHeroMedia(current.heroMedia);
  merged.communityStats = sanitizeCommunityStats(current.communityStats);
  merged.personaJourneys = sanitizePersonaJourneys(current.personaJourneys);
  merged.personaMetrics = sanitizePersonaMetrics(current.personaMetrics, DEFAULT_FRAGMENT.personaMetrics);
  merged.operationsSummary = sanitizeOperationsSummary(current.operationsSummary);
  merged.recentPosts = sanitizeRecentPosts(current.recentPosts);
  merged.marketing = sanitizeMarketing(current.marketing);
  return merged;
};

const stripFragment = (current = {}) => {
  const clone = { ...current };
  delete clone.heroHeadline;
  delete clone.heroSubheading;
  delete clone.heroKeywords;
  delete clone.heroMedia;
  delete clone.communityStats;
  delete clone.personaJourneys;
  delete clone.personaMetrics;
  delete clone.operationsSummary;
  delete clone.recentPosts;
  delete clone.marketing;
  return clone;
};

const parseSettings = (value) => {
  if (value == null) {
    return {};
  }
  if (typeof value === 'object') {
    return { ...value };
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    return {};
  }
};

const serializeSettings = (value) => JSON.stringify(value);

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [record] = await queryInterface.sequelize.query(
        'SELECT id, value FROM site_settings WHERE key = :key LIMIT 1',
        {
          type: Sequelize.QueryTypes.SELECT,
          transaction,
          replacements: { key: SITE_SETTINGS_KEY },
        },
      );

      if (record) {
        const parsed = parseSettings(record.value);
        const merged = mergeSettings(parsed);
        await queryInterface.sequelize.query(
          'UPDATE site_settings SET value = :value, updatedAt = CURRENT_TIMESTAMP WHERE id = :id',
          {
            transaction,
            replacements: { value: serializeSettings(merged), id: record.id },
          },
        );
      } else {
        const merged = mergeSettings({});
        await queryInterface.bulkInsert(
          'site_settings',
          [
            {
              key: SITE_SETTINGS_KEY,
              value: serializeSettings(merged),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          { transaction },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [record] = await queryInterface.sequelize.query(
        'SELECT id, value FROM site_settings WHERE key = :key LIMIT 1',
        {
          type: Sequelize.QueryTypes.SELECT,
          transaction,
          replacements: { key: SITE_SETTINGS_KEY },
        },
      );

      if (record) {
        const parsed = parseSettings(record.value);
        const stripped = stripFragment(parsed);
        await queryInterface.sequelize.query(
          'UPDATE site_settings SET value = :value, updatedAt = CURRENT_TIMESTAMP WHERE id = :id',
          {
            transaction,
            replacements: { value: serializeSettings(stripped), id: record.id },
          },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
