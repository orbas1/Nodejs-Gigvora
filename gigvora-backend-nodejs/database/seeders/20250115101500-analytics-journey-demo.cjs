'use strict';

const { QueryTypes } = require('sequelize');

const SEED_KEY = 'analytics-journey-demo';

function buildContext({
  journeySegment,
  routePersona,
  routeCollection,
  routeId,
  routeTitle,
}) {
  return JSON.stringify({
    journeySegment,
    routePersona,
    routeCollection,
    routeId,
    routeTitle,
    seed: SEED_KEY,
  });
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const routeDefinitions = [
        {
          email: 'ava@gigvora.com',
          journeySegment: 'member.launchpad',
          routePersona: 'member',
          routeCollection: 'launchpad',
          routeId: 'launchpad.dashboard.home',
          routeTitle: 'Launchpad mission control',
          occurredOffsetHours: 1,
        },
        {
          email: 'mia@gigvora.com',
          journeySegment: 'freelancer.dashboard',
          routePersona: 'freelancer',
          routeCollection: 'freelancer',
          routeId: 'dashboard.freelancer.home',
          routeTitle: 'Freelancer mission control',
          occurredOffsetHours: 3,
        },
        {
          email: 'noah@gigvora.com',
          journeySegment: 'company.operations',
          routePersona: 'company',
          routeCollection: 'company',
          routeId: 'dashboard.company.analytics',
          routeTitle: 'Company analytics cockpit',
          occurredOffsetHours: 6,
        },
      ];

      const emails = routeDefinitions.map((definition) => definition.email);
      const users = await queryInterface.sequelize.query(
        'SELECT id, email FROM users WHERE email IN (:emails)',
        {
          type: QueryTypes.SELECT,
          replacements: { emails },
          transaction,
        },
      );

      const userByEmail = new Map(users.map((user) => [user.email, user.id]));
      const now = new Date();
      const eventsToInsert = [];

      for (const definition of routeDefinitions) {
        const userId = userByEmail.get(definition.email);
        if (!userId) {
          continue;
        }

        const occurredAt = new Date(
          now.getTime() - definition.occurredOffsetHours * 60 * 60 * 1000,
        );

        const [existing] = await queryInterface.sequelize.query(
          "SELECT id FROM analytics_events WHERE eventName = 'web_route_viewed' AND \"userId\" = :userId AND context ->> 'seed' = :seed LIMIT 1",
          {
            type: QueryTypes.SELECT,
            replacements: { userId, seed: SEED_KEY },
            transaction,
          },
        );

        if (existing?.id) {
          continue;
        }

        eventsToInsert.push({
          eventName: 'web_route_viewed',
          userId,
          actorType: 'user',
          entityType: 'route',
          entityId: null,
          source: 'web',
          context: buildContext(definition),
          occurredAt,
          ingestedAt: now,
        });
      }

      if (eventsToInsert.length) {
        await queryInterface.bulkInsert('analytics_events', eventsToInsert, { transaction });
      }

      const rollupDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dateValue = rollupDate.toISOString().slice(0, 10);

      const rollups = [
        {
          metricKey: 'web.journey.route_views',
          dimensionHash: `journey:member.launchpad:${SEED_KEY}`,
          value: 28.0,
          journeySegment: 'member.launchpad',
        },
        {
          metricKey: 'web.journey.route_views',
          dimensionHash: `journey:freelancer.dashboard:${SEED_KEY}`,
          value: 42.0,
          journeySegment: 'freelancer.dashboard',
        },
        {
          metricKey: 'web.journey.route_views',
          dimensionHash: `journey:company.operations:${SEED_KEY}`,
          value: 33.0,
          journeySegment: 'company.operations',
        },
      ];

      const rollupsToInsert = [];

      for (const rollup of rollups) {
        const [existingRollup] = await queryInterface.sequelize.query(
          'SELECT id FROM analytics_daily_rollups WHERE metricKey = :metricKey AND date = :date AND dimensionHash = :dimensionHash LIMIT 1',
          {
            type: QueryTypes.SELECT,
            replacements: {
              metricKey: rollup.metricKey,
              date: dateValue,
              dimensionHash: rollup.dimensionHash,
            },
            transaction,
          },
        );

        if (existingRollup?.id) {
          continue;
        }

        rollupsToInsert.push({
          metricKey: rollup.metricKey,
          dimensionHash: rollup.dimensionHash,
          date: dateValue,
          value: rollup.value,
          dimensions: JSON.stringify({
            journeySegment: rollup.journeySegment,
            seed: SEED_KEY,
          }),
          createdAt: now,
          updatedAt: now,
        });
      }

      if (rollupsToInsert.length) {
        await queryInterface.bulkInsert(
          'analytics_daily_rollups',
          rollupsToInsert,
          { transaction },
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        "DELETE FROM analytics_events WHERE context ->> 'seed' = :seed",
        {
          type: QueryTypes.DELETE,
          replacements: { seed: SEED_KEY },
          transaction,
        },
      );

      await queryInterface.sequelize.query(
        'DELETE FROM analytics_daily_rollups WHERE dimensionHash LIKE :pattern',
        {
          type: QueryTypes.DELETE,
          replacements: { pattern: `%:${SEED_KEY}` },
          transaction,
        },
      );
    });
  },
};
