'use strict';

const EVENT_NAMES = [
  'web_account_registration_completed',
  'web_account_registration_social_completed',
  'web_creation_studio_quick_launch',
  'web_project_auto_match_regenerated',
  'web_journey_checkpoint_completed',
  'web_route_not_found',
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const [users] = await queryInterface.sequelize.query(
      "SELECT id, email FROM users WHERE email IN ('leo@gigvora.com','mia@gigvora.com','ava@gigvora.com')",
    );

    const userIdByEmail = users.reduce((acc, row) => {
      acc[row.email] = row.id;
      return acc;
    }, {});

    const events = [
      {
        eventName: 'web_account_registration_completed',
        actorType: 'anonymous',
        userId: null,
        entityType: 'account',
        entityId: null,
        source: 'web_app',
        context: { method: 'email', locale: 'en-US' },
        occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5),
        ingestedAt: now,
      },
      {
        eventName: 'web_account_registration_social_completed',
        actorType: 'anonymous',
        userId: null,
        entityType: 'account',
        entityId: null,
        source: 'web_app',
        context: { provider: 'google', locale: 'en-US' },
        occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 4),
        ingestedAt: now,
      },
      {
        eventName: 'web_creation_studio_quick_launch',
        actorType: 'user',
        userId: userIdByEmail['leo@gigvora.com'] || null,
        entityType: 'creation_workspace',
        entityId: null,
        source: 'web_app',
        context: { type: 'gig', autoPublish: false },
        occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3),
        ingestedAt: now,
      },
      {
        eventName: 'web_project_auto_match_regenerated',
        actorType: 'user',
        userId: userIdByEmail['mia@gigvora.com'] || null,
        entityType: 'project',
        entityId: 101,
        source: 'web_app',
        context: { ensureNewcomer: true, limit: 6 },
        occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
        ingestedAt: now,
      },
      {
        eventName: 'web_journey_checkpoint_completed',
        actorType: userIdByEmail['mia@gigvora.com'] ? 'user' : 'system',
        userId: userIdByEmail['mia@gigvora.com'] || null,
        entityType: 'journey_checkpoint',
        entityId: 1,
        source: 'web_app',
        context: { checkpointId: 'auto_match_queue_regenerated', persona: 'company' },
        occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 12),
        ingestedAt: now,
      },
      {
        eventName: 'web_route_not_found',
        actorType: 'anonymous',
        userId: null,
        entityType: 'route',
        entityId: null,
        source: 'web_app',
        context: { pathname: '/does-not-exist', referrer: 'https://app.gigvora.com/dashboard' },
        occurredAt: new Date(now.getTime() - 1000 * 60 * 30),
        ingestedAt: now,
      },
    ];

    await queryInterface.bulkInsert('analytics_events', events);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('analytics_events', {
      eventName: EVENT_NAMES,
    });
  },
};
