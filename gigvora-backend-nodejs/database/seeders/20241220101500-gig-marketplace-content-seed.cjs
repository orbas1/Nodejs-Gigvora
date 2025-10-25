'use strict';

const { QueryTypes } = require('sequelize');

const pageSlug = 'gigs-marketplace';
const pageVersion = 'marketplace-seed-20241220';

const savedSearchSeeds = [
  {
    email: 'leo@gigvora.com',
    name: 'Remote product analytics missions',
    category: 'gig',
    query: 'analytics',
    filters: { isRemote: true, durationCategories: ['2-4 weeks'] },
    frequency: 'daily',
    notifyByEmail: false,
    notifyInApp: true,
    sort: 'newest',
    lastTriggeredHoursAgo: 6,
  },
  {
    email: 'leo@gigvora.com',
    name: 'Budgeted growth experiments',
    category: 'gig',
    query: 'growth',
    filters: { budgetCurrencies: ['USD'], updatedWithin: '7d' },
    frequency: 'immediate',
    notifyByEmail: true,
    notifyInApp: true,
    sort: 'budget',
    lastTriggeredHoursAgo: 2,
  },
  {
    email: 'mia@gigvora.com',
    name: 'Agency collaboration briefs',
    category: 'gig',
    query: 'collaboration',
    filters: { locations: ['London'], durationCategories: ['4-6 weeks'] },
    frequency: 'weekly',
    notifyByEmail: true,
    notifyInApp: true,
    sort: 'default',
    mapViewport: { boundingBox: { north: 52.12, south: 50.98, east: 0.21, west: -1.75 } },
    lastTriggeredHoursAgo: 48,
  },
];

function computeNextRunAt(frequency, reference = new Date()) {
  const base = reference.getTime();
  switch ((frequency ?? 'daily').toLowerCase()) {
    case 'immediate':
      return new Date(base);
    case 'weekly':
      return new Date(base + 7 * 24 * 60 * 60 * 1000);
    case 'daily':
    default:
      return new Date(base + 24 * 60 * 60 * 1000);
  }
}

async function resolveUserId(queryInterface, transaction, email) {
  const [row] = await queryInterface.sequelize.query(
    'SELECT id FROM users WHERE email = :email LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { email },
    },
  );

  if (!row?.id) {
    throw new Error(`Required seed user ${email} is missing. Run base demo seeds first.`);
  }

  return Number(row.id);
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();

      const pagePayload = {
        slug: pageSlug,
        title: 'Freelancer gigs marketplace',
        summary: 'Curated missions from agencies, founders, and companies with transparent budgets and scope.',
        heroTitle: 'Unlock curated gigs aligned to your portfolio',
        heroSubtitle: 'Pitch faster with telemetry on freshness, budgets, and remote readiness across every brief.',
        heroEyebrow: 'Gigs',
        heroMeta: 'Signals refresh hourly as agencies and founders publish new briefs to the Gigvora network.',
        heroImageUrl: 'https://assets.gigvora.test/marketplace/gigs/hero.png',
        heroImageAlt: 'Freelancer reviewing marketplace gig signals dashboard',
        ctaLabel: 'View saved gig alerts',
        ctaUrl: '/dashboard/gigs/saved-searches',
        layout: 'landing',
        body:
          'Gig discovery surfaces vetted briefs alongside telemetry so independents can prioritise the highest-signal missions. '
          + 'Saved searches trigger alerts across web and mobile, while marketplace analytics summarise freshness, remote '
          + 'availability, and budget confidence for every cohort.',
        featureHighlights: [
          'Signals for freshness, remote readiness, and budget transparency update continuously.',
          'Saved searches sync across web and mobile with in-app and email digests.',
          'Pitch guidance leans on proof of execution, timeline clarity, and proactive communication.',
        ],
        seoTitle: 'Gigvora Marketplace — Curated Freelance Gigs & Mission Briefs',
        seoDescription:
          'Discover vetted freelance gigs with transparent budgets, remote availability, and telemetry-driven alerts from the '
          + 'Gigvora marketplace.',
        seoKeywords: ['freelance gigs', 'gig marketplace', 'remote missions', 'agency briefs'],
        contactEmail: 'hello@gigvora.com',
        jurisdiction: 'global',
        version: pageVersion,
        lastReviewedAt: now,
        status: 'published',
        publishedAt: now,
        allowedRoles: ['freelancer'],
        createdAt: now,
        updatedAt: now,
      };

      const [existingPage] = await queryInterface.sequelize.query(
        'SELECT id FROM site_pages WHERE slug = :slug LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { slug: pageSlug },
        },
      );

      if (existingPage?.id) {
        const updatePayload = { ...pagePayload };
        delete updatePayload.createdAt;
        await queryInterface.bulkUpdate('site_pages', updatePayload, { id: existingPage.id }, { transaction });
      } else {
        await queryInterface.bulkInsert('site_pages', [pagePayload], { transaction });
      }

      for (const seed of savedSearchSeeds) {
        const userId = await resolveUserId(queryInterface, transaction, seed.email);
        const [existingSubscription] = await queryInterface.sequelize.query(
          'SELECT id FROM search_subscriptions WHERE userId = :userId AND name = :name LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId, name: seed.name },
          },
        );

        if (existingSubscription?.id) {
          continue;
        }

        const lastTriggeredAt = seed.lastTriggeredHoursAgo
          ? new Date(now.getTime() - seed.lastTriggeredHoursAgo * 60 * 60 * 1000)
          : null;

        await queryInterface.bulkInsert(
          'search_subscriptions',
          [
            {
              userId,
              name: seed.name,
              category: seed.category,
              query: seed.query ?? null,
              filters: seed.filters ?? null,
              sort: seed.sort ?? null,
              frequency: seed.frequency,
              notifyByEmail: seed.notifyByEmail,
              notifyInApp: seed.notifyInApp,
              mapViewport: seed.mapViewport ?? null,
              lastTriggeredAt,
              nextRunAt: computeNextRunAt(seed.frequency, now),
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const subscriptionNames = savedSearchSeeds.map((seed) => seed.name);
      await queryInterface.bulkDelete(
        'search_subscriptions',
        { name: subscriptionNames },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'site_pages',
        { slug: pageSlug, version: pageVersion },
        { transaction },
      );
    });
  },
};
