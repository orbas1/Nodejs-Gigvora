'use strict';

const TABLE = 'platform_settings';
const PLATFORM_KEY = 'platform';

const defaultSettings = {
  commissions: {
    enabled: true,
    rate: 2.5,
    currency: 'USD',
    minimumFee: 0,
    providerControlsServicemanPay: true,
    servicemanMinimumRate: 0,
    servicemanPayoutNotes:
      'Providers remain responsible for compensating their servicemen directly. Gigvora captures a 2.5% platform service fee.',
  },
  subscriptions: {
    enabled: true,
    restrictedFeatures: [],
    plans: [],
  },
  payments: {
    provider: 'stripe',
    stripe: {
      publishableKey: null,
      secretKey: null,
      webhookSecret: null,
      accountId: null,
    },
    escrow_com: {
      apiKey: null,
      apiSecret: null,
      sandbox: true,
    },
    escrowControls: {
      defaultHoldPeriodHours: 72,
      autoReleaseHours: 48,
      requireManualApproval: false,
      manualApprovalThreshold: 25000,
      notificationEmails: [],
      statementDescriptor: null,
    },
  },
  smtp: {
    host: null,
    port: 587,
    secure: false,
    username: null,
    password: null,
    fromAddress: null,
    fromName: 'GigVora',
  },
  storage: {
    provider: 'cloudflare_r2',
    cloudflare_r2: {
      accountId: null,
      accessKeyId: null,
      secretAccessKey: null,
      bucket: null,
      endpoint: null,
      publicBaseUrl: null,
    },
  },
  app: {
    name: 'GigVora',
    environment: 'production',
    clientUrl: null,
    apiUrl: null,
  },
  database: {
    url: null,
    host: null,
    port: 3306,
    name: null,
    username: null,
    password: null,
  },
  featureToggles: {
    commissions: true,
    subscriptions: true,
    escrow: true,
    audits: true,
    marketingHomepage: true,
  },
  maintenance: {
    lockPaymentsDuringDeployments: true,
    lockSubscriptionsDuringDeployments: false,
    lockHomepageContentDuringDeployments: false,
  },
  notifications: {
    watchers: [],
    escalationPolicies: [],
  },
  homepage: {
    announcementBar: {
      enabled: true,
      message: 'Gigvora deploys vetted product teams with finance, compliance, and delivery safeguards built-in.',
      ctaLabel: 'Book a demo',
      ctaHref: '/contact/sales',
    },
    hero: {
      title: 'Build resilient product squads without the guesswork',
      subtitle:
        'Spin up verified designers, engineers, and operators with treasury, compliance, and delivery guardrails baked in.',
      primaryCtaLabel: 'Book enterprise demo',
      primaryCtaHref: '/contact/sales',
      secondaryCtaLabel: 'Explore marketplace',
      secondaryCtaHref: '/gigs',
      backgroundImageUrl: 'https://cdn.gigvora.com/assets/hero/command-center.jpg',
      backgroundImageAlt: 'Gigvora admin control tower dashboard',
      overlayOpacity: 0.55,
      stats: [
        { id: 'specialists', label: 'Verified specialists', value: 12800, suffix: '+' },
        { id: 'satisfaction', label: 'Client satisfaction', value: 97, suffix: '%' },
        { id: 'regions', label: 'Countries served', value: 32, suffix: '' },
        { id: 'sla', label: 'Matching SLA (hrs)', value: 48, suffix: '' },
      ],
    },
    valueProps: [],
    featureSections: [],
    testimonials: [],
    faqs: [],
    quickLinks: [],
    seo: {
      title: 'Gigvora | Platform Control Tower',
      description:
        'Gigvora aligns monetisation, compliance, and delivery telemetry so operators can launch resilient programmes.',
      keywords: ['gigvora', 'platform', 'compliance', 'monetisation'],
    },
  },
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const existing = await queryInterface.sequelize.query(
        `SELECT id FROM "${TABLE}" WHERE key = :key LIMIT 1`,
        {
          type: Sequelize.QueryTypes.SELECT,
          transaction,
          replacements: { key: PLATFORM_KEY },
          raw: true,
        },
      );

      if (!existing || existing.length === 0) {
        const now = new Date();
        await queryInterface.bulkInsert(
          TABLE,
          [
            {
              key: PLATFORM_KEY,
              environmentScope: 'global',
              category: 'general',
              description: 'Platform-wide monetisation, compliance, and homepage configuration.',
              valueType: 'json',
              value: defaultSettings,
              isEditable: true,
              isSensitive: false,
              tags: ['core', 'admin', 'platform'],
              metadata: { seeded: true, source: '20240915106000-platform-settings-bootstrap' },
              updatedBy: 'system:seed',
              version: 1,
              createdAt: now,
              updatedAt: now,
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

  async down(queryInterface) {
    await queryInterface.bulkDelete(
      TABLE,
      {
        key: PLATFORM_KEY,
        updatedBy: 'system:seed',
      },
    );
  },
};
