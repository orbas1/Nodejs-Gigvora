'use strict';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [users] = await queryInterface.sequelize.query(
        `SELECT id, email, first_name as "firstName"
         FROM users
         ORDER BY created_at ASC
         LIMIT 3`,
        { transaction },
      );

      if (!users || users.length === 0) {
        await transaction.commit();
        return;
      }

      const now = new Date();
      const subscriptionTemplates = [
        {
          name: 'Internal Search Seed – Executive Talent Radar',
          category: 'job',
          query: 'chief of staff',
          filters: {
            employmentTypes: ['full_time'],
            regions: ['north-america'],
            taxonomySlugs: ['leadership', 'operations'],
            isRemote: true,
          },
          frequency: 'daily',
        },
        {
          name: 'Internal Search Seed – Venture Matching',
          category: 'project',
          query: 'venture scouting',
          filters: {
            durationCategories: ['short_term'],
            budgetCurrencies: ['USD'],
            taxonomySlugs: ['venture-advisory'],
          },
          frequency: 'weekly',
        },
        {
          name: 'Internal Search Seed – Mentorship Spotlights',
          category: 'launchpad',
          query: 'growth mentor',
          filters: {
            locations: ['remote'],
            tracks: ['mentorship'],
            taxonomySlugs: ['growth'],
          },
          frequency: 'daily',
        },
      ];

      const subscriptionRows = users.map((user, index) => {
        const template = subscriptionTemplates[index % subscriptionTemplates.length];
        return {
          userId: user.id,
          name: template.name,
          category: template.category,
          query: template.query,
          filters: template.filters,
          sort: 'freshness:desc',
          frequency: template.frequency,
          notifyByEmail: true,
          notifyInApp: true,
          lastTriggeredAt: null,
          nextRunAt: new Date(now.getTime() + (index + 1) * 60 * 60 * 1000),
          mapViewport: null,
          createdAt: now,
          updatedAt: now,
        };
      });

      await queryInterface.bulkInsert('search_subscriptions', subscriptionRows, { transaction });

      const subscriptionNames = subscriptionRows.map((row) => row.name);
      const [insertedSubscriptions] = await queryInterface.sequelize.query(
        `SELECT id, "userId" as "userId", name
         FROM search_subscriptions
         WHERE name IN (:names)`,
        {
          replacements: { names: subscriptionNames },
          transaction,
        },
      );

      if (!insertedSubscriptions || insertedSubscriptions.length === 0) {
        await transaction.commit();
        return;
      }

      const jobRows = insertedSubscriptions.map((subscription, index) => {
        const delayMinutes = (index + 1) * 15;
        return {
          subscriptionId: subscription.id,
          userId: subscription.userId,
          status: 'pending',
          reason: 'seeded_digest',
          priority: Math.min(10, 5 + index),
          payload: {
            seed: 'internal-search-digest-demo',
            note: `Seeded digest job for ${subscription.name}`,
          },
          attempts: 0,
          lastError: null,
          queuedAt: now,
          availableAt: new Date(now.getTime() + delayMinutes * 60 * 1000),
          processingStartedAt: null,
          processingFinishedAt: null,
          durationMs: null,
          resultCount: null,
          createdAt: now,
          updatedAt: now,
        };
      });

      await queryInterface.bulkInsert('search_subscription_jobs', jobRows, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        'DELETE FROM search_subscription_jobs WHERE reason = :reason',
        {
          replacements: { reason: 'seeded_digest' },
          transaction,
        },
      );

      await queryInterface.sequelize.query(
        "DELETE FROM search_subscriptions WHERE name LIKE 'Internal Search Seed – %'",
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
