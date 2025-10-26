'use strict';

const { QueryTypes } = require('sequelize');

const FREELANCER_EMAIL = 'leo@gigvora.com';
const ADMIN_EMAIL = 'ava@gigvora.com';
const SEED_SOURCE = 'seed:reputation-security-demo';

async function resolveUserId(queryInterface, transaction, email, fallbackUser) {
  const [existing] = await queryInterface.sequelize.query(
    'SELECT id FROM users WHERE email = :email LIMIT 1',
    { type: QueryTypes.SELECT, transaction, replacements: { email } },
  );

  if (existing?.id) {
    return existing.id;
  }

  if (!fallbackUser) {
    return null;
  }

  const now = new Date();
  await queryInterface.bulkInsert(
    'users',
    [
      {
        ...fallbackUser,
        email,
        createdAt: now,
        updatedAt: now,
      },
    ],
    { transaction },
  );

  const [created] = await queryInterface.sequelize.query(
    'SELECT id FROM users WHERE email = :email LIMIT 1',
    { type: QueryTypes.SELECT, transaction, replacements: { email } },
  );

  return created?.id ?? null;
}

async function ensureProfile(queryInterface, transaction, userId) {
  if (!userId) {
    return null;
  }

  const [profile] = await queryInterface.sequelize.query(
    'SELECT id FROM profiles WHERE userId = :userId LIMIT 1',
    { type: QueryTypes.SELECT, transaction, replacements: { userId } },
  );

  if (profile?.id) {
    return profile.id;
  }

  const now = new Date();
  await queryInterface.bulkInsert(
    'profiles',
    [
      {
        userId,
        headline: 'Fractional Staff Engineer',
        bio: 'Delivers enterprise-grade marketplace platforms with telemetry-first craftsmanship.',
        skills: 'Node.js, React, GraphQL, AWS',
        experience: '7 years delivering cross-functional product squads.',
        education: 'BSc Computer Science',
        location: 'Remote • GMT+1',
        timezone: 'Europe/Lisbon',
        availabilityStatus: 'limited',
        openToRemote: true,
        profileVisibility: 'members',
        networkVisibility: 'connections',
        followersVisibility: 'connections',
        createdAt: now,
        updatedAt: now,
      },
    ],
    { transaction },
  );

  const [created] = await queryInterface.sequelize.query(
    'SELECT id FROM profiles WHERE userId = :userId LIMIT 1',
    { type: QueryTypes.SELECT, transaction, replacements: { userId } },
  );
  return created?.id ?? null;
}

async function ensureFreelancerProfile(queryInterface, transaction, userId) {
  if (!userId) {
    return;
  }
  const [freelancerProfile] = await queryInterface.sequelize.query(
    'SELECT id FROM freelancer_profiles WHERE userId = :userId LIMIT 1',
    { type: QueryTypes.SELECT, transaction, replacements: { userId } },
  );
  if (freelancerProfile?.id) {
    return;
  }

  const now = new Date();
  await queryInterface.bulkInsert(
    'freelancer_profiles',
    [
      {
        userId,
        title: 'Principal Full Stack Developer',
        hourlyRate: 145.5,
        availability: '20 hrs/week • Remote within UTC±3',
        location: 'Lisbon, Portugal',
        createdAt: now,
        updatedAt: now,
      },
    ],
    { transaction },
  );
}

async function insertIdentityVerification(queryInterface, transaction, { userId, profileId, reviewerId }) {
  if (!userId || !profileId) {
    return;
  }

  const existing = await queryInterface.sequelize.query(
    'SELECT id FROM identity_verifications WHERE userId = :userId ORDER BY createdAt DESC LIMIT 1',
    { type: QueryTypes.SELECT, transaction, replacements: { userId } },
  );

  if (existing.length) {
    return;
  }

  const submittedAt = new Date();
  const reviewedAt = new Date(submittedAt.getTime() + 3 * 60 * 60 * 1000);

  await queryInterface.bulkInsert(
    'identity_verifications',
    [
      {
        userId,
        profileId,
        status: 'verified',
        verificationProvider: 'persona',
        typeOfId: 'passport',
        idNumberLast4: '8274',
        issuingCountry: 'PT',
        issuedAt: new Date('2019-04-12T00:00:00Z'),
        expiresAt: new Date('2029-04-11T00:00:00Z'),
        documentFrontKey: 'identity/leo/passport-front.jpg',
        documentBackKey: 'identity/leo/passport-back.jpg',
        selfieKey: 'identity/leo/selfie.jpg',
        fullName: 'Leo Freelancer',
        dateOfBirth: new Date('1997-03-24T00:00:00Z'),
        addressLine1: '45 Innovation Quay',
        addressLine2: 'Unit 5',
        city: 'Lisbon',
        state: 'Lisbon',
        postalCode: '1000-001',
        country: 'PT',
        reviewNotes: SEED_SOURCE,
        declinedReason: null,
        reviewerId: reviewerId ?? null,
        submittedAt,
        reviewedAt,
        metadata: { seed: SEED_SOURCE, reviewChecklist: ['document_quality', 'address_verified'] },
        createdAt: submittedAt,
        updatedAt: reviewedAt,
      },
    ],
    { transaction },
  );

  const [verification] = await queryInterface.sequelize.query(
    'SELECT id FROM identity_verifications WHERE userId = :userId AND reviewNotes = :seed ORDER BY createdAt DESC LIMIT 1',
    { type: QueryTypes.SELECT, transaction, replacements: { userId, seed: SEED_SOURCE } },
  );

  if (verification?.id) {
    await queryInterface.bulkInsert(
      'identity_verification_events',
      [
        {
          identityVerificationId: verification.id,
          eventType: 'status_change',
          actorId: reviewerId ?? null,
          actorRole: 'trust',
          fromStatus: 'pending',
          toStatus: 'verified',
          note: 'Identity verification approved for enterprise payouts.',
          metadata: { seed: SEED_SOURCE },
          createdAt: reviewedAt,
          updatedAt: reviewedAt,
        },
      ],
      { transaction },
    );
  }
}

async function seedReputationAssets(queryInterface, transaction, freelancerId) {
  if (!freelancerId) {
    return;
  }

  const now = new Date();

  const testimonials = [
    {
      freelancerId,
      clientName: 'Amelia Chen',
      clientRole: 'CTO',
      company: 'Nebula Analytics',
      clientEmail: 'amelia.chen@nebulaanalytics.example',
      projectName: 'Realtime data fabric migration',
      sourceUrl: 'https://nebulaanalytics.example/case-study',
      rating: 4.9,
      comment:
        'Leo helped us refactor a fragile monolith into a resilient service mesh with zero downtime for our enterprise customers.',
      capturedAt: new Date('2024-07-18T10:30:00Z'),
      deliveredAt: new Date('2024-06-28T18:45:00Z'),
      source: 'portal',
      status: 'approved',
      moderationStatus: 'approved',
      moderationScore: 0.82,
      moderationSummary: 'clean',
      moderationLabels: ['high_quality_text'],
      moderatedAt: now,
      verifiedClient: true,
      verificationMetadata: { seed: SEED_SOURCE, companyDomainMatch: true },
      isFeatured: true,
      shareUrl: 'https://profiles.gigvora.test/leo/testimonials/amelia-chen',
      media: null,
      metadata: { seed: SEED_SOURCE },
      createdAt: now,
      updatedAt: now,
    },
    {
      freelancerId,
      clientName: 'Rahul Singh',
      clientRole: 'Head of Product',
      company: 'FluxWave',
      clientEmail: 'rahul.singh@fluxwave.example',
      projectName: 'Marketplace fulfillment automation',
      sourceUrl: 'https://fluxwave.example/blog/gigvora-success',
      rating: 5,
      comment:
        'We accelerated hiring pipelines and rolled out a multi-sided marketplace faster than our executive council expected.',
      capturedAt: new Date('2024-09-05T13:10:00Z'),
      deliveredAt: new Date('2024-08-22T19:15:00Z'),
      source: 'manual',
      status: 'approved',
      moderationStatus: 'approved',
      moderationScore: 0.9,
      moderationSummary: 'clean',
      moderationLabels: ['high_quality_text'],
      moderatedAt: now,
      verifiedClient: true,
      verificationMetadata: { seed: SEED_SOURCE, verifiedBy: 'operations' },
      isFeatured: false,
      shareUrl: 'https://profiles.gigvora.test/leo/testimonials/rahul-singh',
      media: null,
      metadata: { seed: SEED_SOURCE },
      createdAt: now,
      updatedAt: now,
    },
  ];

  const existingTestimonials = await queryInterface.sequelize.query(
    'SELECT id FROM reputation_testimonials WHERE freelancerId = :freelancerId LIMIT 1',
    { type: QueryTypes.SELECT, transaction, replacements: { freelancerId } },
  );
  if (!existingTestimonials.length) {
    await queryInterface.bulkInsert('reputation_testimonials', testimonials, { transaction });
  }

  const successStories = [
    {
      freelancerId,
      title: 'Scaling Mentorship Pods for Enterprise Launch',
      slug: 'mentorship-pods-enterprise-launch',
      summary:
        'Transformed a mentorship collective into an enterprise-ready program with verified experts and telemetry-backed outcomes.',
      content:
        'By orchestrating async collaboration rituals, Leo introduced mentorship pods with weekly retros, proactive trust scoring, and compliance reporting.',
      heroImageUrl: 'https://cdn.gigvora.test/case-studies/leo-mentorship.jpg',
      status: 'published',
      moderationStatus: 'approved',
      moderationScore: 0.88,
      moderationSummary: 'clean',
      moderationLabels: ['high_quality_text'],
      moderatedAt: now,
      publishedAt: new Date('2024-08-15T08:00:00Z'),
      featured: true,
      impactMetrics: {
        revenue_increase: '38% uplift in enterprise mentor subscriptions',
        retention: '92% mentor retention after 6 months',
      },
      ctaUrl: 'https://profiles.gigvora.test/leo/success/mentorship-pods-enterprise-launch',
      metadata: { seed: SEED_SOURCE },
      createdAt: now,
      updatedAt: now,
    },
  ];

  const existingStories = await queryInterface.sequelize.query(
    'SELECT id FROM reputation_success_stories WHERE freelancerId = :freelancerId LIMIT 1',
    { type: QueryTypes.SELECT, transaction, replacements: { freelancerId } },
  );
  if (!existingStories.length) {
    await queryInterface.bulkInsert('reputation_success_stories', successStories, { transaction });
  }

  const metrics = [
    {
      freelancerId,
      metricType: 'on_time_delivery_rate',
      label: 'On-time delivery rate',
      value: 98.4,
      unit: 'percentage',
      period: 'rolling_12_months',
      source: SEED_SOURCE,
      trendDirection: 'up',
      trendValue: 2.1,
      verifiedBy: 'operations_lead',
      verifiedAt: new Date('2024-09-01T12:00:00Z'),
      metadata: { seed: SEED_SOURCE },
      createdAt: now,
      updatedAt: now,
    },
    {
      freelancerId,
      metricType: 'average_csat',
      label: 'Average CSAT',
      value: 4.87,
      unit: 'csat',
      period: 'rolling_6_months',
      source: SEED_SOURCE,
      trendDirection: 'flat',
      trendValue: 0.0,
      verifiedBy: 'marketing_ops',
      verifiedAt: new Date('2024-09-10T09:00:00Z'),
      metadata: { seed: SEED_SOURCE },
      createdAt: now,
      updatedAt: now,
    },
    {
      freelancerId,
      metricType: 'referral_ready_clients',
      label: 'Referral-ready clients',
      value: 14,
      unit: 'count',
      period: 'rolling_3_months',
      source: SEED_SOURCE,
      trendDirection: 'up',
      trendValue: 3,
      verifiedBy: 'success_team',
      verifiedAt: new Date('2024-09-12T15:00:00Z'),
      metadata: { seed: SEED_SOURCE },
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const metric of metrics) {
    await queryInterface.bulkInsert('reputation_metrics', [metric], {
      transaction,
      ignoreDuplicates: true,
    }).catch(async () => {
      await queryInterface.sequelize.query(
        `UPDATE reputation_metrics
         SET label = :label,
             value = :value,
             unit = :unit,
             source = :source,
             trendDirection = :trendDirection,
             trendValue = :trendValue,
             verifiedBy = :verifiedBy,
             verifiedAt = :verifiedAt,
             metadata = :metadata,
             updatedAt = :updatedAt
         WHERE freelancerId = :freelancerId AND metricType = :metricType AND period = :period`,
        {
          transaction,
          replacements: { ...metric },
        },
      );
    });
  }

  const badges = [
    {
      freelancerId,
      name: 'Enterprise Launch Architect',
      slug: 'enterprise-launch-architect',
      description: 'Awarded for orchestrating multi-region product launches with zero Sev1 incidents.',
      issuedBy: 'Gigvora Operations Council',
      issuedAt: new Date('2024-05-02T12:00:00Z'),
      expiresAt: null,
      badgeType: 'achievement',
      level: 'platinum',
      assetUrl: 'https://cdn.gigvora.test/badges/enterprise-launch-architect.svg',
      isPromoted: true,
      metadata: { seed: SEED_SOURCE },
      createdAt: now,
      updatedAt: now,
    },
    {
      freelancerId,
      name: 'Client Trust Champion',
      slug: 'client-trust-champion',
      description: 'Recognises consistent five-star testimonials across executive engagements.',
      issuedBy: 'Client Advisory Board',
      issuedAt: new Date('2024-07-10T09:00:00Z'),
      expiresAt: null,
      badgeType: 'reputation',
      level: 'gold',
      assetUrl: 'https://cdn.gigvora.test/badges/client-trust-champion.svg',
      isPromoted: false,
      metadata: { seed: SEED_SOURCE },
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const badge of badges) {
    await queryInterface.bulkInsert('reputation_badges', [badge], {
      transaction,
      ignoreDuplicates: true,
    }).catch(() => {});
  }

  const widgets = [
    {
      freelancerId,
      name: 'Executive Trust Reel',
      slug: 'executive-trust-reel',
      widgetType: 'carousel',
      status: 'active',
      theme: 'glass',
      themeTokens: {
        background: '#ffffff',
        border: '#d4d4d8',
        text: '#0f172a',
        accent: '#7c3aed',
        muted: '#64748b',
      },
      embedScript: null,
      config: { layout: 'grid', testimonials: 6 },
      impressions: 1385,
      ctaClicks: 214,
      lastSyncedAt: now,
      lastPublishedAt: now,
      lastRenderedAt: now,
      metadata: { seed: SEED_SOURCE },
      createdAt: now,
      updatedAt: now,
    },
  ];

  const existingWidgets = await queryInterface.sequelize.query(
    'SELECT id FROM reputation_review_widgets WHERE freelancerId = :freelancerId LIMIT 1',
    { type: QueryTypes.SELECT, transaction, replacements: { freelancerId } },
  );
  if (!existingWidgets.length) {
    await queryInterface.bulkInsert('reputation_review_widgets', widgets, { transaction });
  }
}

async function seedSecurityPreferences(queryInterface, transaction, userId) {
  if (!userId) {
    return;
  }

  const existing = await queryInterface.sequelize.query(
    'SELECT id FROM user_security_preferences WHERE userId = :userId LIMIT 1',
    { type: QueryTypes.SELECT, transaction, replacements: { userId } },
  );

  if (existing.length) {
    await queryInterface.sequelize.query(
      `UPDATE user_security_preferences
       SET sessionTimeoutMinutes = :timeout,
           biometricApprovalsEnabled = :biometric,
           deviceApprovalsEnabled = :device,
           updatedAt = :updatedAt
       WHERE userId = :userId`,
      {
        transaction,
        replacements: {
          userId,
          timeout: 20,
          biometric: true,
          device: true,
          updatedAt: new Date(),
        },
      },
    );
    return;
  }

  const now = new Date();
  await queryInterface.bulkInsert(
    'user_security_preferences',
    [
      {
        userId,
        sessionTimeoutMinutes: 20,
        biometricApprovalsEnabled: true,
        deviceApprovalsEnabled: true,
        createdAt: now,
        updatedAt: now,
      },
    ],
    { transaction },
  );
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const freelancerId = await resolveUserId(queryInterface, transaction, FREELANCER_EMAIL, {
        firstName: 'Leo',
        lastName: 'Freelancer',
        password: '$2b$10$n6MPrXwN6kPymBi/GsMBCecal.lOEWTWmr25RR80Gn3mtiq3IztUG',
        address: '456 Remote Ave, Digital Nomad',
        age: 27,
        userType: 'freelancer',
      });

      const reviewerId = await resolveUserId(queryInterface, transaction, ADMIN_EMAIL, {
        firstName: 'Ava',
        lastName: 'Founder',
        password: '$2b$10$URrfHgz0s1xu1vByrRl/h.STE7Z0O.STDnpCiMTGy66idi2EDmzJm',
        address: '123 Innovation Way, Remote City',
        age: 32,
        userType: 'admin',
      });

      const profileId = await ensureProfile(queryInterface, transaction, freelancerId);
      await ensureFreelancerProfile(queryInterface, transaction, freelancerId);
      await insertIdentityVerification(queryInterface, transaction, { userId: freelancerId, profileId, reviewerId });
      await seedReputationAssets(queryInterface, transaction, freelancerId);
      await seedSecurityPreferences(queryInterface, transaction, freelancerId);
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
        'reputation_review_widgets',
        { freelancerId, slug: 'executive-trust-reel' },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'reputation_badges',
        { freelancerId, slug: 'enterprise-launch-architect' },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'reputation_badges',
        { freelancerId, slug: 'client-trust-champion' },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'reputation_success_stories',
        { freelancerId, slug: 'mentorship-pods-enterprise-launch' },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'reputation_testimonials',
        { freelancerId, clientEmail: 'amelia.chen@nebulaanalytics.example' },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'reputation_testimonials',
        { freelancerId, clientEmail: 'rahul.singh@fluxwave.example' },
        { transaction },
      );
      await queryInterface.sequelize.query(
        'DELETE FROM reputation_metrics WHERE freelancerId = :freelancerId AND source = :source',
        { transaction, replacements: { freelancerId, source: SEED_SOURCE } },
      );
      await queryInterface.sequelize.query(
        'DELETE FROM identity_verification_events WHERE metadata::text LIKE :marker',
        { transaction, replacements: { marker: `%${SEED_SOURCE}%` } },
      ).catch(async () => {
        await queryInterface.sequelize.query(
          'DELETE FROM identity_verification_events WHERE note = :note',
          { transaction, replacements: { note: 'Identity verification approved for enterprise payouts.' } },
        );
      });
      await queryInterface.sequelize.query(
        'DELETE FROM identity_verifications WHERE userId = :userId AND reviewNotes = :seed',
        { transaction, replacements: { userId: freelancerId, seed: SEED_SOURCE } },
      );
      await queryInterface.sequelize.query(
        'DELETE FROM user_security_preferences WHERE userId = :userId AND sessionTimeoutMinutes = :timeout',
        { transaction, replacements: { userId: freelancerId, timeout: 20 } },
      );
    });
  },
};
