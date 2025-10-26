'use strict';

const { QueryTypes } = require('sequelize');

const FREELANCER_EMAIL = 'leo@gigvora.com';

const TESTIMONIALS = [
  {
    clientName: 'Nora Patel',
    clientRole: 'VP Product',
    company: 'FlowPilot Labs',
    projectName: 'Marketplace relaunch',
    rating: 5,
    comment:
      'Leo orchestrated the relaunch like a seasoned COO—aligning engineering, go-to-market, and customer ops so every milestone landed without a scramble.',
    capturedAt: new Date('2024-02-22T10:00:00.000Z'),
    deliveredAt: new Date('2024-02-20T00:00:00.000Z'),
    source: 'portal',
    status: 'approved',
    moderationStatus: 'approved',
    isFeatured: true,
    shareUrl: 'https://cdn.gigvora.test/testimonials/flowpilot-executive-review',
    metadata: { personas: ['founders', 'investors'] },
  },
  {
    clientName: 'Hannah Ortiz',
    clientRole: 'Head of Community',
    company: 'Atlas Mentorship Circle',
    projectName: 'Mentor alliance scale-up',
    rating: 4.8,
    comment:
      'The mentor alliance would not have scaled without Leo’s operating system. We now have analytics, sponsor-ready programming, and 93% satisfaction.',
    capturedAt: new Date('2024-03-12T15:00:00.000Z'),
    deliveredAt: new Date('2024-03-05T00:00:00.000Z'),
    source: 'portal',
    status: 'approved',
    moderationStatus: 'approved',
    isFeatured: false,
    shareUrl: 'https://cdn.gigvora.test/testimonials/mentor-alliance',
    metadata: { personas: ['mentors', 'community'] },
  },
];

const SUCCESS_STORIES = [
  {
    title: 'FlowPilot marketplace relaunch',
    slug: 'flowpilot-marketplace-relaunch',
    summary:
      'Rebuilt the FlowPilot experimentation stack, unlocking a 27% conversion lift and $1.2M ARR influence in 16 weeks.',
    status: 'published',
    moderationStatus: 'approved',
    content:
      'FlowPilot partnered with Leo to replace a brittle monolith with event-driven services, accelerate launch velocity, and deliver live telemetry for executives.',
    heroImageUrl: 'https://cdn.gigvora.test/portfolio/flowpilot/hero.jpg',
    featured: true,
    impactMetrics: {
      arrInfluence: '$1.2M',
      conversionLift: '27%',
      latencyReduction: '-47% checkout latency',
    },
    ctaUrl: 'https://cdn.gigvora.test/case-studies/flowpilot.pdf',
    metadata: { vertical: 'SaaS marketplace' },
    publishedAt: new Date('2024-02-25T00:00:00.000Z'),
  },
  {
    title: 'Mentor alliance operating system',
    slug: 'mentor-alliance-operating-system',
    summary:
      'Codified a mentorship programme with async AMAs, sponsor-ready analytics, and 186 waitlist signups in two months.',
    status: 'published',
    moderationStatus: 'approved',
    content:
      'Designed async programming, instrumented satisfaction loops, and packaged sponsor-ready reporting for Atlas Mentorship Circle.',
    featured: false,
    impactMetrics: {
      waitlistSignups: '186',
      mentorNps: '93 NPS',
    },
    ctaUrl: 'https://cdn.gigvora.test/case-studies/mentor-alliance.pdf',
    metadata: { vertical: 'Community & mentorship' },
    publishedAt: new Date('2024-03-04T00:00:00.000Z'),
  },
];

const METRICS = [
  {
    metricType: 'on_time_delivery_rate',
    label: 'On-time delivery rate',
    value: 97.2,
    unit: 'percentage',
    period: 'rolling_12_months',
    source: 'Gigvora delivery telemetry',
    trendDirection: 'up',
    trendValue: 2.1,
    verifiedBy: 'Gigvora Trust Team',
    verifiedAt: new Date('2024-03-18T09:30:00.000Z'),
    metadata: { sla: '24h milestone handoff' },
  },
  {
    metricType: 'average_csat',
    label: 'Average CSAT',
    value: 4.86,
    unit: 'csat',
    period: 'rolling_6_months',
    source: 'Client success surveys',
    trendDirection: 'up',
    trendValue: 0.08,
    verifiedBy: 'Client success ops',
    verifiedAt: new Date('2024-03-16T08:00:00.000Z'),
    metadata: { sampleSize: 52 },
  },
  {
    metricType: 'referral_ready_clients',
    label: 'Referral-ready clients',
    value: 18,
    unit: 'count',
    period: 'rolling_12_months',
    source: 'Advocacy programme',
    trendDirection: 'up',
    trendValue: 3,
    verifiedBy: 'Marketing operations',
    verifiedAt: new Date('2024-03-14T12:15:00.000Z'),
    metadata: { nurtureTrack: 'Executive advocates' },
  },
];

const BADGES = [
  {
    name: 'Verified Enterprise Specialist',
    slug: 'verified-enterprise-specialist',
    description: 'Awarded for consistently delivering enterprise-grade launches across product, engineering, and operations.',
    issuedBy: 'Gigvora Trust Council',
    issuedAt: new Date('2024-01-12T00:00:00.000Z'),
    badgeType: 'trust',
    level: 'gold',
    assetUrl: 'https://cdn.gigvora.test/badges/enterprise-specialist.svg',
    isPromoted: true,
    metadata: { cohort: '2024Q1' },
  },
  {
    name: 'Community Impact Builder',
    slug: 'community-impact-builder',
    description: 'Recognises outsized impact in community and mentorship programmes with measurable satisfaction.',
    issuedBy: 'Atlas Mentorship Circle',
    issuedAt: new Date('2024-03-08T00:00:00.000Z'),
    badgeType: 'community',
    level: 'silver',
    assetUrl: 'https://cdn.gigvora.test/badges/community-impact.svg',
    isPromoted: false,
    metadata: { spotlight: true },
  },
];

const WIDGETS = [
  {
    name: 'Executive testimonial carousel',
    slug: 'executive-testimonial-carousel',
    widgetType: 'carousel',
    status: 'active',
    theme: 'midnight',
    themeTokens: {
      background: '#020617',
      border: '#1e293b',
      text: '#e2e8f0',
      accent: '#38bdf8',
    },
    impressions: 1840,
    ctaClicks: 112,
    lastPublishedAt: new Date('2024-03-10T00:00:00.000Z'),
    metadata: { placement: 'Proposals & deal rooms' },
  },
];

const REVIEWS = [
  {
    title: 'Transformed our launch velocity',
    reviewerName: 'Lucas Meyer',
    reviewerRole: 'Chief Product Officer',
    reviewerCompany: 'FlowPilot Labs',
    rating: 4.9,
    status: 'published',
    highlighted: true,
    reviewSource: 'client_portal',
    body:
      'Leo mapped our entire GTM surface, codified decision playbooks, and kept engineering, product, and marketing perfectly in sync. The board noticed the difference in weeks.',
    capturedAt: new Date('2024-02-21T09:00:00.000Z'),
    publishedAt: new Date('2024-02-23T12:30:00.000Z'),
    previewUrl: 'https://cdn.gigvora.test/reviews/flowpilot-preview.png',
    tags: ['marketplace', 'go-to-market', 'delivery'],
    attachments: [
      { label: 'Launch metrics deck', url: 'https://cdn.gigvora.test/reviews/flowpilot-metrics.pdf', type: 'document' },
    ],
    persona: 'founders',
    visibility: 'public',
    reviewerAvatarUrl: 'https://cdn.gigvora.test/avatars/lucas-meyer.png',
    endorsementHighlights: [
      '27% conversion lift within one quarter',
      'Executive-ready telemetry dashboards delivered',
    ],
    endorsementHeadline: 'Enterprise launch partner you can trust',
    endorsementChannel: 'Deal room spotlight',
    requestFollowUp: false,
    shareToProfile: true,
    metadata: { verifiedBy: 'Gigvora Trust Team' },
  },
  {
    title: 'Community operating system delivered',
    reviewerName: 'Ari Rivera',
    reviewerRole: 'Programme Director',
    reviewerCompany: 'Atlas Mentorship Circle',
    rating: 5,
    status: 'published',
    highlighted: false,
    reviewSource: 'client_portal',
    body:
      'Our mentorship alliance finally has structure—async AMAs, analytics, sponsor-ready reporting. Leo turned vague aspirations into a repeatable programme.',
    capturedAt: new Date('2024-03-09T14:00:00.000Z'),
    publishedAt: new Date('2024-03-12T09:45:00.000Z'),
    tags: ['mentorship', 'community', 'operations'],
    attachments: [],
    persona: 'community',
    visibility: 'public',
    reviewerAvatarUrl: 'https://cdn.gigvora.test/avatars/ari-rivera.png',
    endorsementHighlights: [
      '93% satisfaction across mentors',
      '186 founders joined the waitlist in eight weeks',
    ],
    endorsementHeadline: 'Mentorship programme architect',
    endorsementChannel: 'Community spotlight newsletter',
    requestFollowUp: true,
    shareToProfile: true,
    metadata: { verifiedBy: 'Atlas Success Ops' },
  },
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [freelancer] = await queryInterface.sequelize.query(
        'SELECT id FROM users WHERE email = :email LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { email: FREELANCER_EMAIL } },
      );

      if (!freelancer?.id) {
        throw new Error('Reputation experience demo seed requires leo@gigvora.com to exist.');
      }

      const freelancerId = freelancer.id;
      const now = new Date();

      await queryInterface.bulkDelete(
        'reputation_testimonials',
        { freelancerId, projectName: TESTIMONIALS.map((item) => item.projectName) },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'reputation_success_stories',
        { freelancerId, slug: SUCCESS_STORIES.map((item) => item.slug) },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'reputation_metrics',
        { freelancerId, metricType: METRICS.map((item) => item.metricType) },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'reputation_badges',
        { freelancerId, slug: BADGES.map((item) => item.slug) },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'reputation_review_widgets',
        { freelancerId, slug: WIDGETS.map((item) => item.slug) },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'freelancer_reviews',
        { freelancerId, title: REVIEWS.map((item) => item.title) },
        { transaction },
      );

      await queryInterface.bulkInsert(
        'reputation_testimonials',
        TESTIMONIALS.map((item) => ({
          freelancerId,
          clientName: item.clientName,
          clientRole: item.clientRole,
          company: item.company,
          projectName: item.projectName,
          rating: item.rating,
          comment: item.comment,
          capturedAt: item.capturedAt,
          deliveredAt: item.deliveredAt,
          source: item.source,
          status: item.status,
          moderationStatus: item.moderationStatus,
          isFeatured: item.isFeatured,
          shareUrl: item.shareUrl,
          media: null,
          metadata: item.metadata,
          createdAt: now,
          updatedAt: now,
        })),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'reputation_success_stories',
        SUCCESS_STORIES.map((item) => ({
          freelancerId,
          title: item.title,
          slug: item.slug,
          summary: item.summary,
          content: item.content,
          heroImageUrl: item.heroImageUrl ?? null,
          status: item.status,
          moderationStatus: item.moderationStatus,
          moderationScore: null,
          moderationSummary: null,
          moderationLabels: null,
          moderatedAt: item.publishedAt,
          publishedAt: item.publishedAt,
          featured: item.featured,
          impactMetrics: item.impactMetrics,
          ctaUrl: item.ctaUrl,
          metadata: item.metadata,
          createdAt: now,
          updatedAt: now,
        })),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'reputation_metrics',
        METRICS.map((item) => ({
          freelancerId,
          metricType: item.metricType,
          label: item.label,
          value: item.value,
          unit: item.unit,
          period: item.period,
          source: item.source,
          trendDirection: item.trendDirection,
          trendValue: item.trendValue,
          verifiedBy: item.verifiedBy,
          verifiedAt: item.verifiedAt,
          metadata: item.metadata,
          createdAt: now,
          updatedAt: now,
        })),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'reputation_badges',
        BADGES.map((item) => ({
          freelancerId,
          name: item.name,
          slug: item.slug,
          description: item.description,
          issuedBy: item.issuedBy,
          issuedAt: item.issuedAt,
          expiresAt: null,
          badgeType: item.badgeType,
          level: item.level,
          assetUrl: item.assetUrl,
          isPromoted: item.isPromoted,
          metadata: item.metadata,
          createdAt: now,
          updatedAt: now,
        })),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'reputation_review_widgets',
        WIDGETS.map((item) => ({
          freelancerId,
          name: item.name,
          slug: item.slug,
          widgetType: item.widgetType,
          status: item.status,
          theme: item.theme,
          themeTokens: item.themeTokens,
          embedScript: null,
          config: { placement: item.metadata.placement },
          impressions: item.impressions,
          ctaClicks: item.ctaClicks,
          lastPublishedAt: item.lastPublishedAt,
          lastRenderedAt: item.lastPublishedAt,
          lastSyncedAt: item.lastPublishedAt,
          metadata: item.metadata,
          createdAt: now,
          updatedAt: now,
        })),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'freelancer_reviews',
        REVIEWS.map((item) => ({
          freelancerId,
          title: item.title,
          reviewerName: item.reviewerName,
          reviewerRole: item.reviewerRole,
          reviewerCompany: item.reviewerCompany,
          rating: item.rating,
          status: item.status,
          highlighted: item.highlighted,
          reviewSource: item.reviewSource,
          body: item.body,
          capturedAt: item.capturedAt,
          publishedAt: item.publishedAt,
          previewUrl: item.previewUrl ?? null,
          heroImageUrl: item.heroImageUrl ?? null,
          tags: item.tags,
          attachments: item.attachments,
          responses: null,
          privateNotes: null,
          persona: item.persona,
          visibility: item.visibility,
          reviewerAvatarUrl: item.reviewerAvatarUrl ?? null,
          endorsementHighlights: item.endorsementHighlights,
          endorsementHeadline: item.endorsementHeadline,
          endorsementChannel: item.endorsementChannel,
          requestFollowUp: item.requestFollowUp,
          shareToProfile: item.shareToProfile,
          metadata: item.metadata,
          createdAt: now,
          updatedAt: now,
        })),
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [freelancer] = await queryInterface.sequelize.query(
        'SELECT id FROM users WHERE email = :email LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { email: FREELANCER_EMAIL } },
      );

      if (!freelancer?.id) {
        return;
      }

      const freelancerId = freelancer.id;

      await queryInterface.bulkDelete(
        'freelancer_reviews',
        { freelancerId, title: REVIEWS.map((item) => item.title) },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'reputation_review_widgets',
        { freelancerId, slug: WIDGETS.map((item) => item.slug) },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'reputation_badges',
        { freelancerId, slug: BADGES.map((item) => item.slug) },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'reputation_metrics',
        { freelancerId, metricType: METRICS.map((item) => item.metricType) },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'reputation_success_stories',
        { freelancerId, slug: SUCCESS_STORIES.map((item) => item.slug) },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'reputation_testimonials',
        { freelancerId, projectName: TESTIMONIALS.map((item) => item.projectName) },
        { transaction },
      );
    });
  },
};
