'use strict';

const PERSONAS = [
  {
    slug: 'founder',
    title: 'Founder building a hiring brand',
    subtitle: 'Grow your employer presence, spotlight wins, and keep pipelines warm.',
    headline: 'Designed for founding teams scaling storytelling and inbound talent.',
    heroMedia: {
      poster: 'https://cdn.gigvora.com/onboarding/personas/founder/hero.jpg',
      alt: 'Founding team reviewing brand analytics dashboards',
    },
    metadata: {
      primaryCta: 'Launch hiring brand workspace',
      personaPillar: 'hiring-brand',
    },
    benefits: [
      'Launch a dynamic company profile with testimonials, playlists, and KPI spotlights.',
      'Coordinate hiring sprints with ATS sync, referral hubs, and brand campaigns.',
      'Surface people stories, product drops, and community updates to convert candidates.',
    ],
    metrics: [
      { label: 'Brand impressions', value: '120K / mo', delta: '+38%' },
      { label: 'Referral response time', value: '2.4 hrs', delta: '-41%' },
    ],
    signatureMoments: [
      {
        label: 'Activation sprint',
        description: 'Connect ATS, seed media stories, and launch invite-only showcase events.',
      },
      {
        label: 'Weekly ritual',
        description: 'Publish hiring stories, review warm leads, and action employer brand insights.',
      },
    ],
    recommendedModules: ['Company spotlight', 'Talent marketing studio', 'Referral hub', 'Executive briefings'],
  },
  {
    slug: 'freelancer',
    title: 'Independent specialist',
    subtitle: 'Showcase your craft, activate deal-flow, and nurture premium collaborations.',
    headline: 'Built for consultants, fractional leaders, and boutique studios.',
    heroMedia: {
      poster: 'https://cdn.gigvora.com/onboarding/personas/freelancer/hero.jpg',
      alt: 'Independent consultant presenting a digital workspace to clients',
    },
    metadata: {
      primaryCta: 'Spin up deal-flow cockpit',
      personaPillar: 'independent-talent',
    },
    benefits: [
      'Curate a services portfolio with case studies, pricing, and testimonials in minutes.',
      'Sync availability, proposal templates, and pipeline kanban to stay in command.',
      'Unlock network boosts, warm introductions, and collaboration pods tailored to your craft.',
    ],
    metrics: [
      { label: 'Pipeline win rate', value: '62%', delta: '+19 pts' },
      { label: 'Average project value', value: '£18.4K', delta: '+24%' },
    ],
    signatureMoments: [
      {
        label: 'Credibility burst',
        description: 'Publish hero reel, highlight credentials, and promote packaged offers.',
      },
      {
        label: 'Deal momentum',
        description: 'Automate proposal follow-ups, highlight social proof, and track negotiations.',
      },
    ],
    recommendedModules: ['Service portfolio', 'Gig pipeline', 'Proposal studio', 'Client collaboration hub'],
  },
  {
    slug: 'talent-leader',
    title: 'Talent & people leader',
    subtitle: 'Operationalise hiring, onboarding, and community updates with precision.',
    headline: 'Supports heads of talent orchestrating global hiring and employee journeys.',
    heroMedia: {
      poster: 'https://cdn.gigvora.com/onboarding/personas/talent-leader/hero.jpg',
      alt: 'People leader hosting a global onboarding workshop over video',
    },
    metadata: {
      primaryCta: 'Orchestrate onboarding journeys',
      personaPillar: 'people-ops',
    },
    benefits: [
      'Blend ATS intelligence, hiring health dashboards, and onboarding checklists.',
      'Automate candidate storytelling, nurture talent pools, and activate employee advocates.',
      'Partner with leadership via analytics-ready scorecards and executive briefing packs.',
    ],
    metrics: [
      { label: 'Time-to-hire', value: '22 days', delta: '-9 days' },
      { label: 'Onboarding satisfaction', value: '4.7 / 5', delta: '+0.8' },
    ],
    signatureMoments: [
      {
        label: 'Launch readiness',
        description: 'Publish onboarding journey, calibrate hiring scorecards, and sync orientation assets.',
      },
      {
        label: 'Executive reporting',
        description: 'Review hiring velocity, onboarding health, and pipeline diversity every Monday.',
      },
    ],
    recommendedModules: ['Talent analytics', 'Onboarding programs', 'Employee advocacy', 'Leadership dashboards'],
  },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const slugs = PERSONAS.map((persona) => persona.slug);
    await queryInterface.bulkDelete('onboarding_personas', { slug: slugs });
    await queryInterface.bulkInsert(
      'onboarding_personas',
      PERSONAS.map((persona, index) => ({
        slug: persona.slug,
        title: persona.title,
        subtitle: persona.subtitle,
        headline: persona.headline,
        description: persona.description ?? null,
        benefits: persona.benefits,
        metrics: persona.metrics,
        signatureMoments: persona.signatureMoments,
        recommendedModules: persona.recommendedModules,
        heroMedia: persona.heroMedia ?? {},
        status: 'active',
        sortOrder: index,
        metadata: {
          ...persona.metadata,
          seed: '20250401101500-onboarding-personas-seed',
        },
        createdAt: now,
        updatedAt: now,
      })),
    );
  },

  async down(queryInterface) {
    const slugs = PERSONAS.map((persona) => persona.slug);
    await queryInterface.bulkDelete('onboarding_personas', { slug: slugs });
  },
};
