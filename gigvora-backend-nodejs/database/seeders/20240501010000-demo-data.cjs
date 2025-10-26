'use strict';

const { QueryTypes, Op } = require('sequelize');

const MINUTE = 60 * 1000;
const DEFAULT_NOTIFICATION_PREFS = { digest: true, newThread: true, upcomingEvent: true };
const DEFAULT_ALLOWED_USER_TYPES = ['user', 'freelancer', 'agency', 'company', 'mentor', 'headhunter', 'admin'];

function minutesFromNow(minutes) {
  return new Date(Date.now() + minutes * MINUTE).toISOString();
}

function slugify(value, fallback = 'item') {
  if (!value) {
    return fallback;
  }
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-')
    .slice(0, 80) || fallback;
}

function normalizeJoinPolicy(value) {
  if (!value) {
    return 'moderated';
  }
  const candidate = String(value).toLowerCase();
  if (['open', 'public'].includes(candidate)) {
    return 'open';
  }
  if (['invite', 'invite_only', 'invitation', 'restricted'].includes(candidate)) {
    return 'invite_only';
  }
  return 'moderated';
}

function mapJoinPolicyToMemberPolicy(joinPolicy) {
  const normalized = normalizeJoinPolicy(joinPolicy);
  if (normalized === 'open') {
    return 'open';
  }
  if (normalized === 'invite_only') {
    return 'invite';
  }
  return 'request';
}

const baseUsers = [
  {
    firstName: 'Ava',
    lastName: 'Founder',
    email: 'ava@gigvora.com',
    password: '$2b$10$URrfHgz0s1xu1vByrRl/h.STE7Z0O.STDnpCiMTGy66idi2EDmzJm',
    address: '123 Innovation Way, Remote City',
    age: 32,
    userType: 'admin',
    googleId: 'demo-google-ava-founder',
  },
  {
    firstName: 'Leo',
    lastName: 'Freelancer',
    email: 'leo@gigvora.com',
    password: '$2b$10$n6MPrXwN6kPymBi/GsMBCecal.lOEWTWmr25RR80Gn3mtiq3IztUG',
    address: '456 Remote Ave, Digital Nomad',
    age: 27,
    userType: 'freelancer',
    linkedinId: 'demo-linkedin-leo-freelancer',
  },
  {
    firstName: 'Mia',
    lastName: 'Operations',
    email: 'mia@gigvora.com',
    password: '$2b$10$16DRKd2uYS0frdHpDq.5gOQWKmrW.OqYk8ytxzPm/w76dRvrxH6zi',
    address: '789 Strategy Blvd, Growth City',
    age: 35,
    userType: 'company',
    appleId: 'demo-apple-mia-operations',
  },
  {
    firstName: 'Noah',
    lastName: 'Agency',
    email: 'noah@gigvora.com',
    password: '$2b$10$2Fz95ZCARlX/2Pw1zQfztOC8XC7VW9wrXxlih/FYO1QPwI7EVP3p.',
    address: '25 Collaboration Square, Agency City',
    age: 38,
    userType: 'agency',
  },
  {
    firstName: 'Avery',
    lastName: 'Mentor',
    email: 'mentor@gigvora.com',
    password: '$2b$10$URrfHgz0s1xu1vByrRl/h.STE7Z0O.STDnpCiMTGy66idi2EDmzJm',
    address: '101 Coaching Lane, Lisbon',
    age: 41,
    userType: 'user',
  },
  {
    firstName: 'Riley',
    lastName: 'Recruiter',
    email: 'recruiter@gigvora.com',
    password: '$2b$10$URrfHgz0s1xu1vByrRl/h.STE7Z0O.STDnpCiMTGy66idi2EDmzJm',
    address: '88 Hiring Avenue, Austin',
    age: 36,
    userType: 'user',
  },
];

const profileSeeds = [
  {
    email: 'leo@gigvora.com',
    headline: 'Principal Full Stack Developer',
    bio: 'Specialises in high-growth marketplace platforms with a focus on reliability, observability, and coaching.',
    skills: 'Node.js, React, PostgreSQL, AWS, Terraform',
    experience: '7 years delivering venture-backed SaaS platforms with globally distributed teams.',
    education: 'BSc Computer Science, Remote Tech University',
  },
  {
    email: 'mia@gigvora.com',
    headline: 'Director of Operations',
    bio: 'Transforms customer feedback into product roadmaps and ensures compliance guardrails across client workspaces.',
    skills: 'Customer Success, Analytics, Process Automation',
    experience: '10 years scaling operations teams across SaaS scale-ups.',
    education: 'MBA, Strategic Operations',
  },
];

const companyProfileSeeds = [
  {
    email: 'mia@gigvora.com',
    companyName: 'Lumen Analytics',
    description: 'Growth advisory collective partnering with SaaS companies on lifecycle experiments.',
    website: 'https://lumen-analytics.example.com',
  },
];

const agencyProfileSeeds = [
  {
    email: 'noah@gigvora.com',
    agencyName: 'Alliance Studio',
    focusArea: 'Product, growth, and analytics pods for marketplace companies.',
    website: 'https://alliancestudio.example.com',
  },
];

const freelancerProfileSeeds = [
  {
    email: 'leo@gigvora.com',
    title: 'Fractional Staff Engineer',
    hourlyRate: 145.5,
    availability: '20 hrs/week · Remote within UTC±3',
  },
];

const feedPosts = [
  {
    email: 'ava@gigvora.com',
    title: 'Release candidate 1.50 rolling out',
    summary: 'Runtime security enhancements and analytics exports now live for enterprise workspaces.',
    content:
      '[demo] Platform release candidate 1.50 ships runtime security enhancements, hardened runtime policies, and workspace analytics exports. Early adopters get the rollout notes in their inbox today.',
    visibility: 'public',
    type: 'update',
    link: 'https://updates.gigvora.test/releases/1-50',
    imageUrl: 'https://assets.gigvora.test/releases/1-50/cover.jpg',
    mediaAttachments: [
      {
        id: 'release-1-50',
        url: 'https://assets.gigvora.test/releases/1-50/dashboard.png',
        type: 'image',
        alt: 'Analytics dashboard preview for release 1.50',
      },
    ],
    authorHeadline: 'Co-founder & CEO · Gigvora',
  },
  {
    email: 'leo@gigvora.com',
    title: 'Automation onboarding template available',
    summary: 'Async playbooks ready for teams onboarding to workflow automation templates.',
    content:
      '[demo] Shipping an onboarding automation template — DM if you need async walkthroughs or want help mapping your workspace automations to the new playbooks.',
    visibility: 'public',
    type: 'project',
    link: 'https://workspace.gigvora.test/automation-template',
    mediaAttachments: [
      {
        id: 'automation-preview',
        url: 'https://assets.gigvora.test/templates/automation-preview.png',
        type: 'image',
        alt: 'Automation template cards and workflow preview',
      },
    ],
    authorHeadline: 'Fractional Staff Engineer · Gigvora Network',
  },
];

const jobSeeds = [
  {
    title: '[demo] Founding Product Operations Lead',
    description:
      'Partner with founders to orchestrate product rituals, analytics instrumentation, and compliance checklists.',
    location: 'Remote · North America',
    employmentType: 'Full-time',
  },
  {
    title: '[demo] Freelance Growth Analyst',
    description: 'Build dashboards, experiments, and monthly insights for marketplace operators.',
    location: 'Remote · Europe',
    employmentType: 'Contract',
  },
];

const gigSeeds = [
  {
    slug: 'demo-launch-landing-page-optimisation',
    ownerEmail: 'leo@gigvora.com',
    title: '[demo] Launch landing page optimisation sprint',
    summary: 'Accelerate conversion performance with signal-backed hypotheses, structured experiments, and live telemetry.',
    description:
      'Partner with a fractional growth pod to audit analytics, prioritise hypotheses, and run disciplined experiments over a focused two-week sprint. Deliverables include prioritised backlog, high-fidelity experiment briefs, and a reporting toolkit for ongoing iteration.',
    category: 'growth',
    niche: 'Conversion rate optimisation',
    deliveryModel: 'Sprint engagement',
    outcomePromise: 'Lift launch funnel conversion by 12% with validated experiments and enable ongoing CRO rituals.',
    budgetLabel: 'USD 4,800',
    budgetAmount: 4800,
    budgetCurrency: 'USD',
    duration: '2 weeks',
    durationCategory: 'short_term',
    location: 'Remote (UK/EU overlap)',
    geoLocation: { lat: 51.509865, lng: -0.118092, city: 'London', country: 'GB' },
    heroAccent: 'emerald',
    heroTitle: 'Optimise your launch funnel in two weeks',
    heroSubtitle: 'Blend experiment design, research, and instrumentation without derailing your roadmap.',
    heroMediaUrl: 'https://assets.gigvora.test/marketplace/gigs/launch-optimisation.png',
    heroTheme: 'aurora',
    heroBadge: 'Conversion acceleration',
    sellingPoints: [
      'Prioritised backlog tied to revenue and activation metrics.',
      'Live telemetry dashboard with win-rate tracking and experiment QA.',
      'Enablement session to embed CRO rituals with your in-house team.',
    ],
    requirements: [
      'Access to analytics and experimentation platforms (GA4, Mixpanel, or equivalent).',
      'Product analytics contact to align on guardrails and shipping cadence.',
      'Availability for two async stand-ups and a mid-sprint checkpoint.',
    ],
    faqs: [
      'What if we have no prior experiments? → We bootstrap baselines, instrumentation, and prioritisation in week one.',
      'Can we extend beyond two weeks? → Yes, retainers are available with velocity-based pricing.',
    ],
    conversionCopy: {
      primaryCtaLabel: 'Pitch this sprint',
      secondaryCtaLabel: 'Download sample audit',
      successMessage: 'Thanks! We will confirm instrumentation access and share the discovery intake shortly.',
    },
    analyticsSettings: {
      eventNamespace: 'gig_demo_landing_optimisation',
      trackLeadCapture: true,
      attributionChannels: ['web', 'email'],
    },
    availabilityTimezone: 'Europe/London',
    availabilityLeadTimeDays: 3,
    targetMetric: 12,
    status: 'published',
    visibility: 'public',
    publishedAtDaysAgo: 4,
    aiSignals: { trustScore: 74, taxonomyConfidence: 0.66, remotePreference: 0.82 },
  },
  {
    slug: 'demo-marketplace-trust-safety-audit',
    ownerEmail: 'mia@gigvora.com',
    title: '[demo] Marketplace trust and safety audit',
    summary: 'Calibrate moderation queues, policy guardrails, and automation coverage for high-signal marketplaces.',
    description:
      'Full-stack audit across policies, enforcement workflows, and automation coverage. We benchmark queue latency, investigate false-positive trends, and deliver a prioritised roadmap with ROI modelling and sequencing guidance.',
    category: 'operations',
    niche: 'Trust & safety',
    deliveryModel: 'Assessment + roadmap',
    outcomePromise: 'Reduce moderation latency by 35% while sustaining compliance coverage across high-risk cohorts.',
    budgetLabel: 'USD 6,200',
    budgetAmount: 6200,
    budgetCurrency: 'USD',
    duration: '3 weeks',
    durationCategory: 'medium_term',
    location: 'Hybrid — London & Remote',
    geoLocation: { lat: 51.507351, lng: -0.127758, city: 'London', country: 'GB' },
    heroAccent: 'indigo',
    heroTitle: 'Strengthen trust and safety with actionable telemetry',
    heroSubtitle: 'Uncover blind spots across workflows, automations, and policy coverage in three weeks.',
    heroMediaUrl: 'https://assets.gigvora.test/marketplace/gigs/trust-safety-audit.png',
    heroTheme: 'midnight',
    heroBadge: 'Compliance readiness',
    sellingPoints: [
      'Quantified queue latency, reviewer utilisation, and automation coverage.',
      'Scenario-based tabletop exercising with policy recommendations.',
      'Roadmap sequenced by risk, effort, and stakeholder dependencies.',
    ],
    requirements: [
      'Export of anonymised moderation queue metrics for the trailing six weeks.',
      'Policy and enforcement documentation for review.',
      'Stakeholder workshop with policy, product, and operations leads.',
    ],
    faqs: [
      'Will we receive implementation support? → Yes, a 30-day follow-on support window is included.',
      'Do you review legal frameworks? → We partner with your counsel to align on jurisdictional requirements.',
    ],
    conversionCopy: {
      primaryCtaLabel: 'Request audit kick-off',
      secondaryCtaLabel: 'View sample roadmap',
    },
    analyticsSettings: {
      eventNamespace: 'gig_demo_trust_safety',
      trackLeadCapture: true,
      syncOpsDashboard: true,
    },
    availabilityTimezone: 'Europe/London',
    availabilityLeadTimeDays: 5,
    targetMetric: 35,
    status: 'published',
    visibility: 'public',
    publishedAtDaysAgo: 9,
    aiSignals: { trustScore: 78, taxonomyConfidence: 0.7, remotePreference: 0.54 },
  },
  {
    slug: 'demo-member-onboarding-automation',
    ownerEmail: 'noah@gigvora.com',
    title: '[demo] Member onboarding automation accelerator',
    summary: 'Automate onboarding comms, lifecycle nudges, and playbook distribution across your member funnel.',
    description:
      'Design and implement an automated onboarding journey spanning welcome, activation, and retention workflows. Includes CRM mapping, copy optimisation, experiment design, and enablement for your operations team.',
    category: 'operations',
    niche: 'Lifecycle automation',
    deliveryModel: 'Implementation sprint',
    outcomePromise: 'Activate 25% more members within 14 days by orchestrating personalised automations.',
    budgetLabel: 'USD 5,400',
    budgetAmount: 5400,
    budgetCurrency: 'USD',
    duration: '4 weeks',
    durationCategory: 'medium_term',
    location: 'Remote (North America focus)',
    heroAccent: 'purple',
    heroTitle: 'Automate onboarding without losing the human touch',
    heroSubtitle: 'Operational playbooks, CRM integration, and copy frameworks packaged in a four-week accelerator.',
    heroMediaUrl: 'https://assets.gigvora.test/marketplace/gigs/onboarding-automation.png',
    heroTheme: 'nebula',
    heroBadge: 'Lifecycle automation',
    sellingPoints: [
      'Segmented journey maps with KPI instrumentation and safeguard alerts.',
      'Copy optimisation and creative guidelines aligned to your brand voice.',
      'Enablement for ops teams, including handover docs and QA checklists.',
    ],
    requirements: [
      'Access to CRM/marketing automation tooling (HubSpot, Customer.io, Braze, etc.).',
      'Lifecycle performance data for the trailing 90 days.',
      'Point of contact for approvals and sign-off on creative assets.',
    ],
    faqs: [
      'Can we integrate with custom tooling? → Yes, we include technical scoping and light integration support.',
      'Is copywriting included? → Core flows and experimentation scaffolding are included; additional variants can be scoped.',
    ],
    conversionCopy: {
      primaryCtaLabel: 'Start automation accelerator',
      secondaryCtaLabel: 'Review sample journey map',
    },
    analyticsSettings: {
      eventNamespace: 'gig_demo_onboarding_automation',
      syncOpsDashboard: true,
      shareInsightsWithMentors: true,
    },
    availabilityTimezone: 'America/New_York',
    availabilityLeadTimeDays: 7,
    targetMetric: 25,
    status: 'published',
    visibility: 'public',
    publishedAtDaysAgo: 2,
    aiSignals: { trustScore: 72, taxonomyConfidence: 0.64, remotePreference: 0.77 },
  },
];

const projectSeeds = [
  {
    title: '[demo] Workspace instrumentation rollout',
    description: 'Enable product squads with standardised dashboards and alerting across all environments.',
    status: 'in_progress',
  },
];

const launchpadSeeds = [
  {
    title: '[demo] Career accelerator — product cohort',
    description: 'Four-week intensive pairing mentors with talent on storytelling, demos, and networking.',
    track: 'product',
  },
];

const volunteeringSeeds = [
  {
    title: '[demo] Climate tech strategy sprint mentor',
    organization: 'Remote Impact Alliance',
    description: 'Guide fellows through discovery workshops and narrative development for climate tech ventures.',
  },
];

const groupSeeds = [
  (() => {
    const metadata = {
      summary:
        'Weekly salons on marketplaces, distributed teams, and community building with operators from 40+ countries.',
      focusAreas: ['Future of work', 'Product strategy', 'Marketplace design'],
      accentColor: '#2563EB',
      metrics: {
        weeklyActiveMembers: 427,
        opportunitiesSharedThisWeek: 38,
        retentionRate: 0.93,
        conversationVelocity: 0.82,
      },
      insights: {
        signalStrength: 'surging',
        trendingTopics: [
          'Compensation systems for global-first teams',
          'AI copilots for discovery sprints',
          'Community-to-commerce case studies',
        ],
      },
      baselineMembers: 2140,
      upcomingEvents: [
        {
          id: 'fowc-ops-guild',
          title: 'Ops Guild: Autonomous pods in enterprise marketplaces',
          startAt: minutesFromNow(3 * 24 * 60),
          timezone: 'UTC',
          format: 'Roundtable',
          host: {
            name: 'Sophie Mayer',
            title: 'Chief Storyteller · Momentum Collective',
          },
          registrationRequired: true,
        },
        {
          id: 'fowc-office-hours',
          title: 'Office hours: Launching async-first onboarding',
          startAt: minutesFromNow(7 * 24 * 60 + 180),
          timezone: 'UTC',
          format: 'Office hours',
          host: {
            name: 'Dario Fernández',
            title: 'Head of Product · Signal Eight',
          },
          registrationRequired: false,
        },
      ],
      leadership: [
        {
          name: 'Leila Odum',
          title: 'Talent Partner · Northwind Ventures',
          role: 'Community Chair',
          avatarSeed: 'Leila Odum',
        },
        {
          name: 'Mateo Ruiz',
          title: 'Innovation Lead · Aurora Labs',
          role: 'Program Curator',
          avatarSeed: 'Mateo Ruiz',
        },
      ],
      resources: [
        {
          id: 'fowc-playbook',
          title: 'Distributed Team Activation Playbook',
          type: 'Playbook',
          url: 'https://guides.gigvora.com/future-of-work-playbook',
        },
        {
          id: 'fowc-signal-digest',
          title: 'Signal digest · Week 42',
          type: 'Digest',
          url: 'https://signals.gigvora.com/fowc-weekly',
        },
        {
          id: 'fowc-template',
          title: 'Async Stand-up Template (Notion)',
          type: 'Template',
          url: 'https://templates.gigvora.com/fowc-async-standup',
        },
      ],
      guidelines: [
        'Confidential pilots require consent before sharing outside the circle.',
        'Bring a case study or open question to every salon.',
        'Peer coaching happens in public threads before DMs.',
      ],
      timeline: [
        {
          label: 'Launch pilot cohorts',
          occursAt: minutesFromNow(-30 * 24 * 60),
          description: 'First cohort of 50 members shaped the governance model and cadence.',
        },
        {
          label: 'Marketplace benchmark release',
          occursAt: minutesFromNow(-12 * 24 * 60),
          description: 'Annual report shared with 18 partner companies and agencies.',
        },
        {
          label: 'Circle expansion vote',
          occursAt: minutesFromNow(14 * 24 * 60),
          description: 'Community vote on opening two sub-circles for talent leads and product ops.',
        },
      ],
      discussionBoard: {
        stats: { activeContributors: 182, unresolvedCount: 6, newThreads: 14 },
        tags: ['Announcements', 'Product ops', 'Marketplace design', 'AI'],
        pinned: [
          {
            id: 'fowc-manifesto',
            title: 'Community manifesto refresh',
            category: 'Announcement',
            excerpt:
              'We are revisiting our collaboration principles ahead of the upcoming cohort expansion.',
            author: { name: 'Leila Odum' },
            replies: 42,
            participants: 31,
            upvotes: 88,
            tags: ['Announcement', 'Governance'],
            lastActivityAt: minutesFromNow(-6 * 60),
            isAnswered: true,
            url: 'https://community.gigvora.com/future-of-work-collective/manifesto',
          },
          {
            id: 'fowc-trend-report',
            title: 'Signal digest · Week 42',
            category: 'Digest',
            excerpt:
              'Highlights from the latest market intelligence drop covering new monetisation experiments.',
            author: { name: 'Mateo Ruiz' },
            replies: 18,
            participants: 14,
            upvotes: 57,
            tags: ['Digest', 'Monetisation'],
            lastActivityAt: minutesFromNow(-12 * 60),
            isAnswered: true,
            url: 'https://signals.gigvora.com/fowc-weekly',
          },
        ],
        threads: [
          {
            id: 'fowc-growth-loops',
            title: 'Growth loops for B2B marketplaces',
            category: 'Growth',
            excerpt: 'Exploring experiments that expanded supply + demand without paid spend.',
            author: { name: 'Leila Odum' },
            replies: 23,
            participants: 19,
            upvotes: 61,
            tags: ['Growth', 'Product ops'],
            lastActivityAt: minutesFromNow(-90),
            lastReplyAt: minutesFromNow(-40),
            isAnswered: false,
            url: 'https://community.gigvora.com/future-of-work-collective/growth-loops',
          },
          {
            id: 'fowc-ai-cohorts',
            title: 'AI copilots for member onboarding',
            category: 'AI',
            excerpt: 'Share prompts and workflows that helped new members contribute within their first week.',
            author: { name: 'Mateo Ruiz' },
            replies: 17,
            participants: 16,
            upvotes: 54,
            tags: ['AI', 'Onboarding'],
            lastActivityAt: minutesFromNow(-4 * 60),
            lastReplyAt: minutesFromNow(-2 * 60),
            isAnswered: true,
            url: 'https://community.gigvora.com/future-of-work-collective/ai-onboarding',
          },
        ],
        moderators: [
          { name: 'Leila Odum', title: 'Talent Partner · Northwind Ventures', focus: 'Governance' },
          { name: 'Mateo Ruiz', title: 'Innovation Lead · Aurora Labs', focus: 'Product ops' },
        ],
        health: { responseTime: '4h', participation: '72%' },
      },
      resourceLibrary: {
        stats: { totalItems: 36, downloads24h: 82, savedCount: 712 },
        filters: {
          tags: ['Marketplace design', 'Product ops', 'AI', 'Community'],
          formats: ['Playbook', 'Template', 'Digest', 'Toolkit'],
        },
        featured: [
          {
            id: 'fowc-desk-briefing',
            title: 'Marketplace metrics deep dive',
            summary: 'Recording + worksheet from the latest roundtable on liquidity instrumentation.',
            type: 'Playbook',
            format: 'Playbook',
            tags: ['Analytics', 'Marketplace'],
            url: 'https://guides.gigvora.com/fowc-metrics-deep-dive',
            updatedAt: minutesFromNow(-11 * 60),
            duration: '35 min masterclass',
            metrics: { saves: 264, downloads24h: 41, durationMinutes: 35 },
          },
          {
            id: 'fowc-ops-kit',
            title: 'Marketplace Ops Metrics Toolkit',
            summary: 'Dashboards and spreadsheet templates for tracking liquidity and retention.',
            type: 'Toolkit',
            format: 'Toolkit',
            tags: ['Marketplace design', 'Analytics'],
            url: 'https://guides.gigvora.com/fowc-ops-metrics',
            updatedAt: minutesFromNow(-2 * 24 * 60 - 120),
            duration: '20 min implementation',
            metrics: { saves: 189, downloads24h: 28, durationMinutes: 20 },
          },
        ],
        items: [
          {
            id: 'fowc-salon-recap',
            title: 'Salon recap: Designing async leadership rituals',
            summary: 'Key takeaways + implementation checklist from the latest leadership salon.',
            type: 'Recap',
            format: 'Recap',
            tags: ['Leadership', 'Async'],
            url: 'https://community.gigvora.com/future-of-work-collective/salon-recap',
            updatedAt: minutesFromNow(-3 * 24 * 60),
            readingTime: '12 min read',
            metrics: { saves: 176, downloads24h: 24, durationMinutes: 12 },
          },
          {
            id: 'fowc-template',
            title: 'Async Stand-up Template (Notion)',
            summary: 'Ready-to-use template for global-first teams keeping rituals lightweight.',
            type: 'Template',
            format: 'Template',
            tags: ['Async', 'Templates'],
            url: 'https://templates.gigvora.com/fowc-async-standup',
            updatedAt: minutesFromNow(-7 * 24 * 60),
            readingTime: '5 min setup',
            metrics: { saves: 221, downloads24h: 39, durationMinutes: 5 },
          },
          {
            id: 'fowc-ops-kit',
            title: 'Marketplace Ops Metrics Toolkit',
            summary: 'Dashboards and spreadsheet templates for tracking liquidity and retention.',
            type: 'Toolkit',
            format: 'Toolkit',
            tags: ['Marketplace design', 'Analytics'],
            url: 'https://guides.gigvora.com/fowc-ops-metrics',
            updatedAt: minutesFromNow(-2 * 24 * 60 - 120),
            readingTime: '20 min implementation',
            metrics: { saves: 189, downloads24h: 28, durationMinutes: 20 },
          },
        ],
      },
    };

    return {
      name: 'Future of Work Collective',
      slug: slugify('future-of-work-collective'),
      description: metadata.summary,
      avatarColor: '#2563EB',
      visibility: 'public',
      memberPolicy: mapJoinPolicyToMemberPolicy('moderated'),
      settings: {
        allowedUserTypes: ['freelancer', 'agency', 'company', 'user'],
        joinPolicy: 'moderated',
      },
      metadata,
    };
  })(),
  (() => {
    const metadata = {
      summary:
        'Alumni-only working groups sharing frameworks, retros, and partner leads to accelerate Launchpad missions.',
      focusAreas: ['Experience launchpad', 'Community', 'Career acceleration'],
      accentColor: '#7C3AED',
      metrics: {
        weeklyActiveMembers: 268,
        opportunitiesSharedThisWeek: 24,
        retentionRate: 0.97,
        conversationVelocity: 0.88,
      },
      insights: {
        signalStrength: 'steady',
        trendingTopics: [
          'Fellowship hiring pods',
          'Mentor sprint retrospectives',
          'Partner readiness scorecards',
        ],
      },
      baselineMembers: 860,
      upcomingEvents: [
        {
          id: 'launchpad-mastermind',
          title: 'Mastermind: Post-cohort monetisation systems',
          startAt: minutesFromNow(5 * 24 * 60 + 90),
          timezone: 'UTC',
          format: 'Workshop',
          host: {
            name: 'Ava Chen',
            title: 'Product Marketing Lead · Nova Labs',
          },
          registrationRequired: true,
        },
      ],
      leadership: [
        {
          name: 'Nikhil Shah',
          title: 'Director of Ecosystem · Atlas Studio',
          role: 'Guild Host',
          avatarSeed: 'Nikhil Shah',
        },
      ],
      resources: [
        {
          id: 'launchpad-checklist',
          title: 'Post-cohort transition checklist',
          type: 'Checklist',
          url: 'https://guides.gigvora.com/launchpad-transition',
        },
        {
          id: 'launchpad-intros',
          title: 'Partner intro tracker',
          type: 'Tracker',
          url: 'https://workspace.gigvora.com/launchpad-intros',
        },
      ],
      guidelines: [
        'Confidential partner data must stay inside guild workspaces.',
        'Celebrate wins weekly to unlock referral boosts.',
        'Mentor office hours are recorded and archived for 30 days.',
      ],
      timeline: [
        {
          label: 'Guild launch',
          occursAt: minutesFromNow(-45 * 24 * 60),
          description: 'Formed after the inaugural Launchpad cohort to keep mission velocity.',
        },
        {
          label: 'Mentor pairing programme',
          occursAt: minutesFromNow(-10 * 24 * 60),
          description: 'Rolled out structured mentor loops with 92% satisfaction.',
        },
      ],
      discussionBoard: {
        stats: { activeContributors: 128, unresolvedCount: 4, newThreads: 9 },
        tags: ['Mentorship', 'Growth loops', 'Referrals', 'Playbooks'],
        pinned: [
          {
            id: 'launchpad-mastermind',
            title: 'Mastermind replay + action plan',
            category: 'Replay',
            excerpt:
              'Catch the highlights from our monetisation mastermind and download the companion worksheets.',
            author: { name: 'Ava Chen' },
            replies: 19,
            participants: 17,
            upvotes: 48,
            tags: ['Monetisation', 'Replay'],
            lastActivityAt: minutesFromNow(-5 * 60),
            isAnswered: true,
            url: 'https://community.gigvora.com/launchpad/mastermind-replay',
          },
        ],
        threads: [
          {
            id: 'launchpad-referrals',
            title: 'Structuring partner referral loops post-cohort',
            category: 'Growth',
            excerpt: 'Looking for templates to keep referral loops alive after the programme wraps.',
            author: { name: 'Nikhil Shah' },
            replies: 15,
            participants: 12,
            upvotes: 41,
            tags: ['Referrals', 'Growth loops'],
            lastActivityAt: minutesFromNow(-7 * 60),
            lastReplyAt: minutesFromNow(-3 * 60),
            isUnresolved: true,
            unread: true,
            url: 'https://community.gigvora.com/launchpad/referral-loops',
          },
          {
            id: 'launchpad-coaching',
            title: 'Mentor office hours expectations',
            category: 'Mentorship',
            excerpt: 'How do you prepare founders for the first office hour so sessions stay actionable?',
            author: { name: 'Ava Chen' },
            replies: 9,
            participants: 10,
            upvotes: 28,
            tags: ['Mentorship', 'Office hours'],
            lastActivityAt: minutesFromNow(-180),
            lastReplyAt: minutesFromNow(-140),
            isAnswered: true,
            url: 'https://community.gigvora.com/launchpad/mentor-office-hours',
          },
        ],
        moderators: [
          { name: 'Ava Chen', title: 'Product Marketing Lead · Nova Labs', focus: 'Monetisation & positioning' },
          { name: 'Nikhil Shah', title: 'Director of Ecosystem · Atlas Studio', focus: 'Partnerships & growth' },
        ],
        health: { responseTime: '5h', participation: '68%' },
      },
      resourceLibrary: {
        stats: { totalItems: 24, downloads24h: 76, savedCount: 604 },
        filters: {
          tags: ['Mentorship', 'Referrals', 'Product marketing', 'Templates'],
          formats: ['Checklist', 'Tracker', 'Recording', 'Worksheet'],
        },
        featured: [
          {
            id: 'launchpad-monetisation',
            title: 'Monetisation sprint retro pack',
            summary: 'Slides, templates, and scoring models from the monetisation masterclass.',
            type: 'Worksheet',
            format: 'Worksheet',
            tags: ['Monetisation', 'Templates'],
            url: 'https://guides.gigvora.com/launchpad-monetisation-retro',
            updatedAt: minutesFromNow(-18 * 60),
            duration: '45 min workshop',
            metrics: { saves: 174, downloads24h: 34, durationMinutes: 45 },
          },
        ],
        items: [
          {
            id: 'launchpad-checklist',
            title: 'Post-cohort transition checklist',
            summary: 'Ensure alumni graduate with clarity on monetisation, partner handovers, and goal setting.',
            type: 'Checklist',
            format: 'Checklist',
            tags: ['Operations', 'Alumni'],
            url: 'https://guides.gigvora.com/launchpad-transition',
            updatedAt: minutesFromNow(-9 * 24 * 60),
            readingTime: '10 min read',
            metrics: { saves: 142, downloads24h: 18, durationMinutes: 10 },
          },
          {
            id: 'launchpad-intros',
            title: 'Partner intro tracker',
            summary: 'Shared tracker for logging partner intros, feedback loops, and follow-up cadences.',
            type: 'Tracker',
            format: 'Tracker',
            tags: ['Referrals', 'Operations'],
            url: 'https://workspace.gigvora.com/launchpad-intros',
            updatedAt: minutesFromNow(-4 * 24 * 60),
            readingTime: '7 min setup',
            metrics: { saves: 133, downloads24h: 22, durationMinutes: 7 },
          },
          {
            id: 'launchpad-office-hours',
            title: 'Mentor office hour agenda template',
            summary: 'Agenda and prep checklist mentors use to keep sessions focused and accountable.',
            type: 'Template',
            format: 'Template',
            tags: ['Mentorship', 'Templates'],
            url: 'https://templates.gigvora.com/launchpad-office-hours',
            updatedAt: minutesFromNow(-6 * 24 * 60),
            readingTime: '5 min setup',
            metrics: { saves: 121, downloads24h: 16, durationMinutes: 5 },
          },
        ],
      },
    };

    return {
      name: 'Launchpad Alumni Guild',
      slug: slugify('launchpad-alumni-guild'),
      description: metadata.summary,
      avatarColor: '#7C3AED',
      visibility: 'public',
      memberPolicy: mapJoinPolicyToMemberPolicy('invite_only'),
      settings: {
        allowedUserTypes: ['freelancer', 'user', 'mentor'],
        joinPolicy: 'invite_only',
      },
      metadata,
    };
  })(),
  (() => {
    const metadata = {
      summary:
        'Cross-functional volunteers mobilising for climate-positive missions with enterprise partners.',
      focusAreas: ['Sustainability', 'Volunteering', 'Social impact'],
      accentColor: '#10B981',
      metrics: {
        weeklyActiveMembers: 189,
        opportunitiesSharedThisWeek: 17,
        retentionRate: 0.9,
        conversationVelocity: 0.71,
      },
      insights: {
        signalStrength: 'emerging',
        trendingTopics: [
          'Climate hackathons',
          'Pro-bono discovery sprints',
          'Impact measurement frameworks',
        ],
      },
      baselineMembers: 530,
      upcomingEvents: [
        {
          id: 'purpose-lab-briefing',
          title: 'Briefing: Circular retail pilots Q1',
          startAt: minutesFromNow(2 * 24 * 60 + 120),
          timezone: 'UTC',
          format: 'Briefing',
          host: {
            name: 'Leila Odum',
            title: 'Talent Partner · Northwind Ventures',
          },
          registrationRequired: true,
        },
        {
          id: 'purpose-lab-demo-day',
          title: 'Demo day: Impact sprint outcomes',
          startAt: minutesFromNow(12 * 24 * 60),
          timezone: 'UTC',
          format: 'Showcase',
          host: {
            name: 'Gigvora Impact Office',
            title: 'Impact Programmes Team',
          },
          registrationRequired: false,
        },
      ],
      leadership: [
        {
          name: 'Gigvora Impact Office',
          title: 'Programme Managers',
          role: 'Coordinators',
          avatarSeed: 'Purpose Lab',
        },
      ],
      resources: [
        {
          id: 'purpose-sprint-kit',
          title: 'Impact sprint facilitation kit',
          type: 'Kit',
          url: 'https://impact.gigvora.com/sprint-kit',
        },
        {
          id: 'purpose-insights',
          title: 'Climate venture partner map',
          type: 'Intelligence',
          url: 'https://impact.gigvora.com/partner-map',
        },
      ],
      guidelines: [
        'Volunteer commitments require weekly stand-ups during active sprints.',
        'Share field photos only with consent from on-site partners.',
        'Escalate safety concerns within 24 hours using the trust desk.',
      ],
      timeline: [
        {
          label: 'Enterprise cohort onboarding',
          occursAt: minutesFromNow(-20 * 24 * 60),
          description: 'Three enterprise partners onboarded with 120 volunteers activated.',
        },
        {
          label: 'Impact measurement release',
          occursAt: minutesFromNow(20 * 24 * 60),
          description: 'Publishing the first shared impact measurement dashboard.',
        },
      ],
      discussionBoard: {
        stats: { activeContributors: 94, unresolvedCount: 5, newThreads: 11 },
        tags: ['Volunteer ops', 'Impact measurement', 'Field updates', 'Partnerships'],
        pinned: [
          {
            id: 'purpose-briefing',
            title: 'Circular retail pilots briefing pack',
            category: 'Briefing',
            excerpt:
              'Download the partner briefing, asset checklist, and safety protocols before the next sprint.',
            author: { name: 'Gigvora Impact Office' },
            replies: 14,
            participants: 21,
            upvotes: 39,
            tags: ['Briefing', 'Safety'],
            lastActivityAt: minutesFromNow(-3 * 60),
            isAnswered: true,
            url: 'https://impact.gigvora.com/sprint-kit',
          },
        ],
        threads: [
          {
            id: 'purpose-safety',
            title: 'On-site safety escalation flow',
            category: 'Operations',
            excerpt: 'Clarifying who to contact for rapid escalation during field deployments.',
            author: { name: 'Leila Odum' },
            replies: 12,
            participants: 15,
            upvotes: 33,
            tags: ['Safety', 'Volunteer ops'],
            lastActivityAt: minutesFromNow(-160),
            lastReplyAt: minutesFromNow(-120),
            isUnresolved: false,
            url: 'https://community.gigvora.com/purpose-lab/safety-escalation',
          },
          {
            id: 'purpose-impact-metrics',
            title: 'Capturing impact metrics in low-connectivity areas',
            category: 'Impact measurement',
            excerpt: 'Seeking lightweight data capture ideas when teams operate offline.',
            author: { name: 'Impact Programmes Team' },
            replies: 17,
            participants: 14,
            upvotes: 41,
            tags: ['Impact measurement', 'Field ops'],
            lastActivityAt: minutesFromNow(-9 * 60),
            lastReplyAt: minutesFromNow(-4 * 60),
            isUnresolved: true,
            unread: true,
            url: 'https://community.gigvora.com/purpose-lab/impact-metrics',
          },
        ],
        moderators: [
          { name: 'Gigvora Impact Office', title: 'Programme Managers', focus: 'Volunteer enablement' },
        ],
        health: { responseTime: '6h', participation: '61%' },
      },
      resourceLibrary: {
        stats: { totalItems: 28, downloads24h: 54, savedCount: 478 },
        filters: {
          tags: ['Sustainability', 'Volunteer ops', 'Safety', 'Impact measurement'],
          formats: ['Kit', 'Intelligence', 'Checklist', 'Report'],
        },
        featured: [
          {
            id: 'purpose-activation-pack',
            title: 'Volunteer activation starter pack',
            summary: 'Training deck, onboarding scripts, and follow-up checklist for new missions.',
            type: 'Kit',
            format: 'Kit',
            tags: ['Volunteer ops', 'Training'],
            url: 'https://impact.gigvora.com/activation-pack',
            updatedAt: minutesFromNow(-15 * 60),
            duration: '30 min orientation',
            metrics: { saves: 166, downloads24h: 29, durationMinutes: 30 },
          },
        ],
        items: [
          {
            id: 'purpose-sprint-kit',
            title: 'Impact sprint facilitation kit',
            summary: 'Templates, safety protocols, and reporting frameworks for volunteer sprints.',
            type: 'Kit',
            format: 'Kit',
            tags: ['Volunteer ops', 'Safety'],
            url: 'https://impact.gigvora.com/sprint-kit',
            updatedAt: minutesFromNow(-8 * 24 * 60),
            readingTime: '25 min setup',
            metrics: { saves: 138, downloads24h: 21, durationMinutes: 25 },
          },
          {
            id: 'purpose-insights',
            title: 'Climate venture partner map',
            summary: 'Directory of partners, readiness signals, and collaboration history.',
            type: 'Intelligence',
            format: 'Report',
            tags: ['Partnerships', 'Research'],
            url: 'https://impact.gigvora.com/partner-map',
            updatedAt: minutesFromNow(-6 * 24 * 60),
            readingTime: '15 min review',
            metrics: { saves: 128, downloads24h: 19, durationMinutes: 15 },
          },
        ],
      },
    };

    return {
      name: 'Purpose Lab',
      slug: slugify('purpose-lab'),
      description: metadata.summary,
      avatarColor: '#10B981',
      visibility: 'public',
      memberPolicy: mapJoinPolicyToMemberPolicy('open'),
      settings: {
        allowedUserTypes: ['user', 'freelancer', 'agency', 'company'],
        joinPolicy: 'open',
      },
      metadata,
    };
  })(),
  (() => {
    const metadata = {
      summary:
        'Weekly async briefings for founders sharing acquisition, retention, and compliance playbooks.',
      focusAreas: ['Marketplace growth', 'Founder community'],
      accentColor: '#2563EB',
      metrics: {
        weeklyActiveMembers: 48,
        opportunitiesSharedThisWeek: 6,
        retentionRate: 0.85,
        conversationVelocity: 0.52,
      },
      insights: {
        signalStrength: 'steady',
        trendingTopics: ['Founder pipelines', 'Go-to-market experiments'],
      },
      baselineMembers: 120,
      guidelines: [
        'Keep growth experiments anonymised unless founders opt-in to share attribution.',
        'Flag compliance questions to Gigvora support within 12 hours.',
      ],
      discussionBoard: {
        stats: { activeContributors: 22, unresolvedCount: 1, newThreads: 2 },
        tags: ['Growth', 'Retention'],
        threads: [
          {
            id: 'demo-growth',
            title: 'Sequencing marketplace liquidity bets',
            category: 'Growth',
            excerpt: 'How are you prioritising supply vs demand activation this quarter?',
            author: { name: 'Ava Founder' },
            replies: 4,
            participants: 5,
            upvotes: 9,
            tags: ['Growth'],
            lastActivityAt: minutesFromNow(-180),
            isUnresolved: true,
          },
        ],
        moderators: [
          { name: 'Ava Founder', title: 'Founder · Demo Marketplace', focus: 'Growth ops' },
        ],
        health: { responseTime: '8h', participation: '45%' },
      },
      resourceLibrary: {
        stats: { totalItems: 6, downloads24h: 9, savedCount: 54 },
        filters: { tags: ['Growth', 'Retention'], formats: ['Playbook', 'Template'] },
        items: [
          {
            id: 'demo-growth-briefing',
            title: 'Marketplace growth dashboard starter',
            summary: 'Notion dashboard template aligning acquisition, activation, and retention metrics.',
            type: 'Template',
            format: 'Template',
            tags: ['Growth'],
            url: 'https://demo.gigvora.com/growth-dashboard',
            updatedAt: minutesFromNow(-5 * 24 * 60),
            readingTime: '10 min setup',
            metrics: { saves: 32, downloads24h: 5, durationMinutes: 10 },
          },
        ],
      },
    };

    return {
      name: '[demo] Marketplace founders circle',
      slug: slugify('marketplace-founders-circle-demo'),
      description: metadata.summary,
      avatarColor: '#2563EB',
      visibility: 'public',
      memberPolicy: mapJoinPolicyToMemberPolicy('moderated'),
      settings: {
        allowedUserTypes: DEFAULT_ALLOWED_USER_TYPES,
        joinPolicy: 'moderated',
      },
      metadata,
    };
  })(),
];

const connectionSeeds = [
  {
    requesterEmail: 'leo@gigvora.com',
    addresseeEmail: 'noah@gigvora.com',
    status: 'accepted',
  },
];

const groupPostSeeds = [
  {
    groupName: 'Future of Work Collective',
    slug: 'future-of-work-manifesto-refresh',
    title: 'Community manifesto refresh',
    summary:
      "Opening comments on the proposed manifesto updates ahead of next month's membership expansion vote.",
    content:
      'Leila recapped the core chapters we plan to refresh, focusing on how we frame experimentation ethics, data sharing boundaries, and the mentoring pledge. Please review the inline comments before next Wednesday so we can finalise the vote package.',
    authorEmail: 'ava@gigvora.com',
    publishedAt: minutesFromNow(-6 * 60),
    metadata: {
      category: 'Announcement',
      tags: ['Announcement', 'Governance'],
      replyCount: 42,
      participantCount: 31,
      appreciations: 88,
      pinned: true,
      isAnswered: true,
      lastActivityAt: minutesFromNow(-6 * 60),
      lastReplyAt: minutesFromNow(-40),
      url: 'https://community.gigvora.com/future-of-work-collective/manifesto',
    },
  },
  {
    groupName: 'Future of Work Collective',
    slug: 'future-of-work-growth-loops',
    title: 'Growth loops for B2B marketplaces',
    summary: 'Thread collecting benchmarks for self-serve and assisted supply acquisition experiments.',
    content:
      'Sharing our latest numbers on the talent pods experiment, plus a few prompts to unpack how others are balancing SEO, outbound, and paid referrals. Drop your dashboards and leading indicators—especially if you are tracking net activation inside the first two weeks.',
    authorEmail: 'leo@gigvora.com',
    publishedAt: minutesFromNow(-90),
    metadata: {
      category: 'Growth',
      tags: ['Growth', 'Product ops'],
      replyCount: 23,
      participantCount: 19,
      appreciations: 61,
      isUnresolved: true,
      lastActivityAt: minutesFromNow(-90),
      lastReplyAt: minutesFromNow(-40),
      url: 'https://community.gigvora.com/future-of-work-collective/growth-loops',
    },
  },
  {
    groupName: 'Future of Work Collective',
    slug: 'future-of-work-ai-onboarding',
    title: 'AI copilots for member onboarding',
    summary: 'Collecting prompts, workflows, and retention metrics for AI-assisted onboarding flows.',
    content:
      'Mateo outlined the three experiments currently running with AI copilots guiding members through their first week. We have baseline data on completion rates and sentiment—curious to hear how others are operationalising follow-up when the copilot flags a risk.',
    authorEmail: 'ava@gigvora.com',
    publishedAt: minutesFromNow(-4 * 60),
    metadata: {
      category: 'AI',
      tags: ['AI', 'Onboarding'],
      replyCount: 17,
      participantCount: 16,
      appreciations: 54,
      isAnswered: true,
      lastActivityAt: minutesFromNow(-4 * 60),
      lastReplyAt: minutesFromNow(-2 * 60),
      url: 'https://community.gigvora.com/future-of-work-collective/ai-onboarding',
    },
  },
  {
    groupName: 'Launchpad Alumni Guild',
    slug: 'launchpad-mastermind-replay',
    title: 'Mastermind replay + action plan',
    summary:
      'Replay link and workbook for the monetisation mastermind—add your experiments so we can track deltas next sprint.',
    content:
      'Ava bundled the replay, transcript, and editable action worksheet so every pod can commit to a monetisation experiment before Friday. Please duplicate the sheet, note your baselines, and add blockers so we can coordinate mentor support.',
    authorEmail: 'mia@gigvora.com',
    publishedAt: minutesFromNow(-5 * 60),
    metadata: {
      category: 'Replay',
      tags: ['Monetisation', 'Replay'],
      replyCount: 19,
      participantCount: 17,
      appreciations: 48,
      pinned: true,
      isAnswered: true,
      lastActivityAt: minutesFromNow(-5 * 60),
      url: 'https://community.gigvora.com/launchpad/mastermind-replay',
    },
  },
  {
    groupName: 'Launchpad Alumni Guild',
    slug: 'launchpad-referral-loops',
    title: 'Structuring partner referral loops post-cohort',
    summary: 'Gathering templates and CRM automations to keep referrals compounding after graduation.',
    content:
      'Nikhil described their “graduation pipeline” and how they are scoring partner readiness. Looking for examples of weekly rituals that keep alumni accountable once the programme ends—especially tactics for handoffs between mentors and partner managers.',
    authorEmail: 'noah@gigvora.com',
    publishedAt: minutesFromNow(-7 * 60),
    metadata: {
      category: 'Growth',
      tags: ['Referrals', 'Growth loops'],
      replyCount: 15,
      participantCount: 12,
      appreciations: 41,
      isUnresolved: true,
      unread: true,
      lastActivityAt: minutesFromNow(-7 * 60),
      lastReplyAt: minutesFromNow(-3 * 60),
      url: 'https://community.gigvora.com/launchpad/referral-loops',
    },
  },
  {
    groupName: 'Launchpad Alumni Guild',
    slug: 'launchpad-office-hours-expectations',
    title: 'Mentor office hours expectations',
    summary: 'Helping mentors and founders prep so sessions stay actionable and concise.',
    content:
      "Shared our latest run of agendas, plus a quick checklist mentors are using before each call. Would love your scripts for keeping founders accountable and for logging follow-ups—especially if you're using automation to nudge teams afterward.",
    authorEmail: 'mia@gigvora.com',
    publishedAt: minutesFromNow(-180),
    metadata: {
      category: 'Mentorship',
      tags: ['Mentorship', 'Office hours'],
      replyCount: 9,
      participantCount: 10,
      appreciations: 28,
      isAnswered: true,
      lastActivityAt: minutesFromNow(-180),
      lastReplyAt: minutesFromNow(-140),
      url: 'https://community.gigvora.com/launchpad/mentor-office-hours',
    },
  },
  {
    groupName: 'Purpose Lab',
    slug: 'purpose-lab-briefing-pack',
    title: 'Circular retail pilots briefing pack',
    summary:
      'Safety protocols, asset checklist, and partner briefing doc for volunteers joining the new circular retail pilot.',
    content:
      'Impact Office centralised all assets for the Q1 pilots, including updated field safety notes. Please confirm you have completed the compliance acknowledgement before registering for on-site rotations next week.',
    authorEmail: 'mentor@gigvora.com',
    publishedAt: minutesFromNow(-3 * 60),
    metadata: {
      category: 'Briefing',
      tags: ['Briefing', 'Safety'],
      replyCount: 14,
      participantCount: 21,
      appreciations: 39,
      pinned: true,
      isAnswered: true,
      lastActivityAt: minutesFromNow(-3 * 60),
      url: 'https://impact.gigvora.com/sprint-kit',
    },
  },
  {
    groupName: 'Purpose Lab',
    slug: 'purpose-impact-metrics-thread',
    title: 'Capturing impact metrics in low-connectivity areas',
    summary:
      'Looking for lightweight offline data capture flows to quantify outcomes before syncing back to headquarters.',
    content:
      'We are testing paper-to-mobile workflows and voice notes but need more ideas. How are you batching uploads, and who on your team reviews data quality before it hits the dashboard? Any tooling recommendations welcome.',
    authorEmail: 'mentor@gigvora.com',
    publishedAt: minutesFromNow(-9 * 60),
    metadata: {
      category: 'Impact measurement',
      tags: ['Impact measurement', 'Field ops'],
      replyCount: 17,
      participantCount: 14,
      appreciations: 41,
      isUnresolved: true,
      unread: true,
      lastActivityAt: minutesFromNow(-9 * 60),
      lastReplyAt: minutesFromNow(-4 * 60),
      url: 'https://community.gigvora.com/purpose-lab/impact-metrics',
    },
  },
  {
    groupName: '[demo] Marketplace founders circle',
    slug: 'demo-marketplace-growth-dashboard',
    title: 'Marketplace growth dashboard starter',
    summary:
      'Sharing screenshots of the dashboard template and a quick loom walking through each metric block.',
    content:
      "Posting the latest revision of the dashboard we mentioned during last Friday's sync. It now includes a cohort view for buyer retention and a lightweight pipeline tracker. Drop questions or snippets if you adapt it to your own stack.",
    authorEmail: 'ava@gigvora.com',
    publishedAt: minutesFromNow(-5 * 24 * 60),
    metadata: {
      category: 'Growth',
      tags: ['Growth', 'Analytics'],
      replyCount: 4,
      participantCount: 5,
      appreciations: 12,
      lastActivityAt: minutesFromNow(-5 * 24 * 60),
    },
  },
];

const DAY = 24 * 60 * 60 * 1000;

function determineGigDurationCategory(duration) {
  if (!duration || typeof duration !== 'string') {
    return null;
  }
  const text = duration.toLowerCase();
  if (/week|sprint/.test(text)) {
    return 'short_term';
  }
  if (/month|quarter/.test(text)) {
    return 'medium_term';
  }
  if (/year|long/.test(text)) {
    return 'long_term';
  }
  return null;
}

function parseGigBudgetAmount(value) {
  if (value == null) {
    return null;
  }
  const numeric = Number.parseFloat(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
}

async function ensureUsers(queryInterface, transaction) {
  const now = new Date();
  const emails = baseUsers.map((user) => user.email);
  const existingUsers = await queryInterface.sequelize.query(
    'SELECT id, email FROM users WHERE email IN (:emails)',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { emails },
    },
  );
  const existingByEmail = new Map(existingUsers.map((row) => [row.email, row.id]));
  const toInsert = baseUsers
    .filter((user) => !existingByEmail.has(user.email))
    .map((user) => ({
      ...user,
      createdAt: now,
      updatedAt: now,
    }));

  if (toInsert.length) {
    await queryInterface.bulkInsert('users', toInsert, { transaction });
  }

  const allUsers = await queryInterface.sequelize.query(
    'SELECT id, email FROM users WHERE email IN (:emails)',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { emails },
    },
  );

  return new Map(allUsers.map((row) => [row.email, row.id]));
}

async function insertProfiles(queryInterface, transaction, table, records, userIds, now) {
  if (!records.length) return;
  const rows = records
    .map((record) => {
      const userId = userIds.get(record.email);
      if (!userId) {
        return null;
      }
      const { email, ...rest } = record;
      return { ...rest, userId, createdAt: now, updatedAt: now };
    })
    .filter(Boolean);

  if (!rows.length) return;

  const userIdList = rows.map((row) => row.userId);
  const existing = await queryInterface.sequelize.query(
    `SELECT userId FROM ${table} WHERE userId IN (:userIds)`,
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { userIds: userIdList },
    },
  );
  const existingSet = new Set(existing.map((row) => row.userId));
  const toInsert = rows.filter((row) => !existingSet.has(row.userId));
  if (toInsert.length) {
    await queryInterface.bulkInsert(table, toInsert, { transaction });
  }
}

async function insertIfMissing(queryInterface, transaction, table, uniqueWhereSql, buildRow) {
  const existing = await queryInterface.sequelize.query(uniqueWhereSql.query, {
    type: QueryTypes.SELECT,
    transaction,
    replacements: uniqueWhereSql.replacements,
  });

  if (existing.length) {
    return existing[0];
  }

  const row = buildRow();
  await queryInterface.bulkInsert(table, [row], { transaction });
  const [inserted] = await queryInterface.sequelize.query(uniqueWhereSql.query, {
    type: QueryTypes.SELECT,
    transaction,
    replacements: uniqueWhereSql.replacements,
  });
  return inserted?.[0] ?? null;
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const userIds = await ensureUsers(queryInterface, transaction);

      await insertProfiles(queryInterface, transaction, 'profiles', profileSeeds, userIds, now);
      await insertProfiles(queryInterface, transaction, 'company_profiles', companyProfileSeeds, userIds, now);
      await insertProfiles(queryInterface, transaction, 'agency_profiles', agencyProfileSeeds, userIds, now);
      await insertProfiles(queryInterface, transaction, 'freelancer_profiles', freelancerProfileSeeds, userIds, now);

      for (const post of feedPosts) {
        const userId = userIds.get(post.email);
        if (!userId) continue;
        const userSeed = baseUsers.find((seed) => seed.email === post.email) ?? {};
        const profileSeed = profileSeeds.find((seed) => seed.email === post.email);
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM feed_posts WHERE userId = :userId AND content = :content LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId, content: post.content },
          },
        );
        if (existing?.id) continue;
        const authorName =
          post.authorName ||
          [userSeed.firstName, userSeed.lastName].filter(Boolean).join(' ').trim() ||
          userSeed.email ||
          'Gigvora member';
        const authorHeadline =
          post.authorHeadline || profileSeed?.headline || profileSeed?.bio || 'Marketplace community update';
        const authorAvatarSeed = post.authorAvatarSeed || userSeed.firstName || authorName;
        await queryInterface.bulkInsert(
          'feed_posts',
          [
            {
              userId,
              content: post.content,
              summary: post.summary ?? null,
              title: post.title ?? null,
              visibility: post.visibility ?? 'public',
              type: post.type ?? 'update',
              link: post.link ?? null,
              imageUrl: post.imageUrl ?? null,
              source: post.source ?? null,
              mediaAttachments: post.mediaAttachments ?? null,
              authorName,
              authorHeadline,
              authorAvatarSeed,
              publishedAt: now,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      for (const job of jobSeeds) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM jobs WHERE title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { title: job.title },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert('jobs', [{ ...job, createdAt: now, updatedAt: now }], { transaction });
      }

      for (const gig of gigSeeds) {
        const ownerId = userIds.get(gig.ownerEmail);
        if (!ownerId) {
          throw new Error(`Missing required user ${gig.ownerEmail} for gig seed ${gig.slug}`);
        }

        const publishedAt = gig.publishedAtDaysAgo
          ? new Date(now.getTime() - gig.publishedAtDaysAgo * DAY)
          : now;

        const row = {
          ownerId,
          slug: gig.slug,
          title: gig.title,
          tagline: gig.tagline ?? null,
          summary: gig.summary ?? null,
          description: gig.description,
          category: gig.category ?? null,
          niche: gig.niche ?? null,
          deliveryModel: gig.deliveryModel ?? null,
          outcomePromise: gig.outcomePromise ?? null,
          budget: gig.budgetLabel ?? gig.budget ?? null,
          budgetCurrency: gig.budgetCurrency ?? null,
          budgetAmount:
            gig.budgetAmount != null ? Number(gig.budgetAmount) : parseGigBudgetAmount(gig.budgetLabel ?? gig.budget),
          duration: gig.duration ?? null,
          durationCategory: gig.durationCategory ?? determineGigDurationCategory(gig.duration),
          location: gig.location ?? null,
          geoLocation: gig.geoLocation ?? null,
          heroAccent: gig.heroAccent ?? null,
          heroTitle: gig.heroTitle ?? null,
          heroSubtitle: gig.heroSubtitle ?? null,
          heroMediaUrl: gig.heroMediaUrl ?? null,
          heroTheme: gig.heroTheme ?? null,
          heroBadge: gig.heroBadge ?? null,
          sellingPoints: gig.sellingPoints ?? [],
          requirements: gig.requirements ?? [],
          faqs: gig.faqs ?? [],
          conversionCopy: gig.conversionCopy ?? {},
          analyticsSettings: gig.analyticsSettings ?? {},
          availabilityTimezone: gig.availabilityTimezone ?? null,
          availabilityLeadTimeDays: gig.availabilityLeadTimeDays ?? 2,
          targetMetric: gig.targetMetric ?? null,
          status: gig.status ?? 'published',
          visibility: gig.visibility ?? 'public',
          publishedAt,
          aiSignals: gig.aiSignals ?? { trustScore: 68, taxonomyConfidence: 0.6, remotePreference: 0.52 },
          metadata: { ...(gig.metadata ?? {}), seed: 'demo-gigs-marketplace' },
          createdAt: now,
          updatedAt: now,
        };

        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM gigs WHERE slug = :slug LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { slug: gig.slug },
          },
        );

        if (existing?.id) {
          const { createdAt, ...updatePayload } = row;
          updatePayload.updatedAt = now;
          await queryInterface.bulkUpdate('gigs', updatePayload, { id: existing.id }, { transaction });
        } else {
          await queryInterface.bulkInsert('gigs', [row], { transaction });
        }
      }

      for (const project of projectSeeds) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM projects WHERE title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { title: project.title },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert('projects', [{ ...project, createdAt: now, updatedAt: now }], { transaction });
      }

      for (const launchpad of launchpadSeeds) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM experience_launchpads WHERE title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { title: launchpad.title },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert(
          'experience_launchpads',
          [{ ...launchpad, createdAt: now, updatedAt: now }],
          { transaction },
        );
      }

      for (const volunteering of volunteeringSeeds) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM volunteering_roles WHERE title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { title: volunteering.title },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert(
          'volunteering_roles',
          [{ ...volunteering, createdAt: now, updatedAt: now }],
          { transaction },
        );
      }

      const groupIdByName = new Map();
      for (const group of groupSeeds) {
        const [groupRow] = await queryInterface.sequelize.query(
          'SELECT id FROM groups WHERE name = :name LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { name: group.name },
          },
        );
        if (groupRow?.id) {
          groupIdByName.set(group.name, groupRow.id);
          continue;
        }
        await queryInterface.bulkInsert('groups', [{ ...group, createdAt: now, updatedAt: now }], { transaction });
        const [insertedGroup] = await queryInterface.sequelize.query(
          'SELECT id FROM groups WHERE name = :name LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { name: group.name },
          },
        );
        if (insertedGroup?.id) {
          groupIdByName.set(group.name, insertedGroup.id);
        }
      }

      if (groupIdByName.size) {
        for (const group of groupSeeds) {
          const groupId = groupIdByName.get(group.name);
          if (!groupId) continue;
          for (const email of ['ava@gigvora.com', 'leo@gigvora.com']) {
            const userId = userIds.get(email);
            if (!userId) continue;
            const role = email === 'ava@gigvora.com' ? 'owner' : 'member';
            const [membership] = await queryInterface.sequelize.query(
              'SELECT id FROM group_memberships WHERE groupId = :groupId AND userId = :userId LIMIT 1',
              {
                type: QueryTypes.SELECT,
                transaction,
                replacements: { groupId, userId },
              },
            );
            if (membership?.id) continue;
            await queryInterface.bulkInsert(
              'group_memberships',
              [
                {
                  groupId,
                  userId,
                  role,
                  status: 'active',
                  joinedAt: now,
                  metadata: { notifications: DEFAULT_NOTIFICATION_PREFS },
                  createdAt: now,
                  updatedAt: now,
                },
              ],
              { transaction },
            );
          }
        }
      }

      if (groupIdByName.size && groupPostSeeds.length) {
        for (const post of groupPostSeeds) {
          const groupId = groupIdByName.get(post.groupName);
          const authorId = userIds.get(post.authorEmail);
          if (!groupId || !authorId) continue;
          const slug = slugify(post.slug || post.title, `group-post-${groupId}`);
          const [existingPost] = await queryInterface.sequelize.query(
            'SELECT id FROM group_posts WHERE slug = :slug LIMIT 1',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: { slug },
            },
          );
          if (existingPost?.id) continue;

          const publishedAt = post.publishedAt ? new Date(post.publishedAt) : now;
          const createdAt = post.createdAt ? new Date(post.createdAt) : publishedAt;
          const updatedAt = post.updatedAt ? new Date(post.updatedAt) : publishedAt;

          await queryInterface.bulkInsert(
            'group_posts',
            [
              {
                groupId,
                title: post.title,
                slug,
                summary: post.summary ?? null,
                content: post.content,
                status: post.status ?? 'published',
                visibility: post.visibility ?? 'members',
                attachments: post.attachments ?? null,
                scheduledAt: post.scheduledAt ?? null,
                publishedAt,
                createdById: authorId,
                updatedById: authorId,
                metadata: post.metadata ?? {},
                createdAt,
                updatedAt,
              },
            ],
            { transaction },
          );
        }
      }

      for (const connection of connectionSeeds) {
        const requesterId = userIds.get(connection.requesterEmail);
        const addresseeId = userIds.get(connection.addresseeEmail);
        if (!requesterId || !addresseeId) continue;
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM connections WHERE requesterId = :requesterId AND addresseeId = :addresseeId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { requesterId, addresseeId },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert(
          'connections',
          [
            {
              requesterId,
              addresseeId,
              status: connection.status,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const userEmails = baseUsers.map((user) => user.email);
      const users = await queryInterface.sequelize.query(
        'SELECT id, email FROM users WHERE email IN (:emails)',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { emails: userEmails },
        },
      );
      const userIds = users.map((user) => user.id);

      if (userIds.length) {
        await queryInterface.bulkDelete(
          'connections',
          {
            requesterId: { [Op.in]: userIds },
            addresseeId: { [Op.in]: userIds },
          },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'group_memberships',
          { userId: { [Op.in]: userIds } },
          { transaction },
        );
        await queryInterface.bulkDelete('freelancer_profiles', { userId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('agency_profiles', { userId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('company_profiles', { userId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('profiles', { userId: { [Op.in]: userIds } }, { transaction });
      }

      await queryInterface.bulkDelete(
        'feed_posts',
        { content: feedPosts.map((post) => post.content) },
        { transaction },
      );
      await queryInterface.bulkDelete('jobs', { title: jobSeeds.map((job) => job.title) }, { transaction });
      await queryInterface.bulkDelete('gigs', { slug: gigSeeds.map((gig) => gig.slug) }, { transaction });
      await queryInterface.bulkDelete('projects', { title: projectSeeds.map((project) => project.title) }, { transaction });
      await queryInterface.bulkDelete(
        'experience_launchpads',
        { title: launchpadSeeds.map((launchpad) => launchpad.title) },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'volunteering_roles',
        { title: volunteeringSeeds.map((volunteering) => volunteering.title) },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'group_posts',
        { slug: groupPostSeeds.map((post) => slugify(post.slug || post.title)) },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'groups',
        { name: groupSeeds.map((group) => group.name) },
        { transaction },
      );
      await queryInterface.bulkDelete('users', { email: userEmails }, { transaction });
    });
  },
};
