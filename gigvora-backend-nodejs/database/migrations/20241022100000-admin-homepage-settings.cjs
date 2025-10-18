'use strict';

const HOMEPAGE_DEFAULT = {
  announcementBar: {
    enabled: true,
    message: 'Gigvora deploys vetted product teams with finance, compliance, and delivery safeguards.',
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
  valueProps: [
    {
      id: 'compliance',
      title: 'Compliance handled',
      description: 'NDAs, KYC, and region-specific controls live inside every engagement.',
      icon: 'ShieldCheckIcon',
      ctaLabel: 'Review trust center',
      ctaHref: '/trust-center',
    },
    {
      id: 'payments',
      title: 'Unified payouts',
      description: 'Escrow, subscriptions, and milestone releases flow through one treasury.',
      icon: 'CurrencyDollarIcon',
      ctaLabel: 'View payment options',
      ctaHref: '/finance',
    },
    {
      id: 'insights',
      title: 'Operational telemetry',
      description: 'Live scorecards keep delivery, spend, and sentiment transparent.',
      icon: 'ChartBarIcon',
      ctaLabel: 'See analytics',
      ctaHref: '/dashboard/company/analytics',
    },
  ],
  featureSections: [
    {
      id: 'project-launch',
      title: 'Launch projects without friction',
      description: 'Spin up scopes, approvals, and budgets with prebuilt compliance guardrails.',
      mediaType: 'image',
      mediaUrl: 'https://cdn.gigvora.com/assets/features/project-launch.png',
      mediaAlt: 'Gigvora project launch workflow',
      bullets: [
        { id: 'templates', text: 'Reusable scope templates with approval routing' },
        { id: 'governance', text: 'Automatic vendor risk and policy checks' },
      ],
    },
    {
      id: 'workspace',
      title: 'Collaborate in one workspace',
      description: 'Docs, deliverables, feedback, and finance sync across teams and partners.',
      mediaType: 'image',
      mediaUrl: 'https://cdn.gigvora.com/assets/features/workspace.png',
      mediaAlt: 'Cross-functional workspace collaboration',
      bullets: [
        { id: 'vault', text: 'Role-based deliverable vault with versioning' },
        { id: 'status', text: 'Automated status digests for stakeholders' },
      ],
    },
  ],
  testimonials: [
    {
      id: 'northwind',
      quote:
        'Gigvora unlocked a vetted product pod in 48 hours—finance, compliance, and delivery were already aligned.',
      authorName: 'Leah Patel',
      authorRole: 'VP Operations, Northwind Labs',
      avatarUrl: 'https://cdn.gigvora.com/assets/avatars/leah-patel.png',
      highlight: true,
    },
    {
      id: 'acme',
      quote: 'Compliance workflows and milestone escrow meant we focused on shipping, not paperwork.',
      authorName: 'Marcus Chen',
      authorRole: 'Head of Product, Acme Robotics',
      avatarUrl: 'https://cdn.gigvora.com/assets/avatars/marcus-chen.png',
      highlight: false,
    },
  ],
  faqs: [
    {
      id: 'getting-started',
      question: 'How quickly can teams onboard?',
      answer: 'Submit a brief and receive a vetted shortlist with compliance approval inside 48 hours.',
    },
    {
      id: 'pricing-models',
      question: 'What pricing models are supported?',
      answer: 'Choose milestone-based projects, subscription pods, or hourly retainers based on the workstream.',
    },
  ],
  quickLinks: [
    { id: 'demo', label: 'Book a live demo', href: '/contact/sales', target: '_self' },
    { id: 'login', label: 'Sign in to workspace', href: '/login', target: '_self' },
    { id: 'updates', label: 'Read product updates', href: '/blog', target: '_self' },
  ],
  seo: {
    title: 'Gigvora | Product-ready teams on demand',
    description:
      'Gigvora delivers vetted product talent with treasury, compliance, and delivery automation so teams can launch faster.',
    keywords: ['gigvora', 'product talent', 'freelancer marketplace', 'managed marketplace'],
    ogImageUrl: 'https://cdn.gigvora.com/assets/og/homepage.png',
  },
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [record] = await queryInterface.sequelize.query(
        "SELECT id, value FROM platform_settings WHERE key = 'platform' LIMIT 1",
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );

      if (record) {
        const payload = typeof record.value === 'string' ? JSON.parse(record.value) : record.value || {};
        if (!payload.homepage) {
          payload.homepage = HOMEPAGE_DEFAULT;
          await queryInterface.sequelize.query(
            "UPDATE platform_settings SET value = :value, updatedAt = CURRENT_TIMESTAMP WHERE id = :id",
            {
              replacements: { value: JSON.stringify(payload), id: record.id },
              transaction,
            },
          );
        }
      } else {
        await queryInterface.bulkInsert(
          'platform_settings',
          [
            {
              key: 'platform',
              value: JSON.stringify({ homepage: HOMEPAGE_DEFAULT }),
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
        "SELECT id, value FROM platform_settings WHERE key = 'platform' LIMIT 1",
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );

      if (record) {
        const payload = typeof record.value === 'string' ? JSON.parse(record.value) : record.value || {};
        if (payload.homepage) {
          delete payload.homepage;
          await queryInterface.sequelize.query(
            "UPDATE platform_settings SET value = :value, updatedAt = CURRENT_TIMESTAMP WHERE id = :id",
            {
              replacements: { value: JSON.stringify(payload), id: record.id },
              transaction,
            },
          );
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
