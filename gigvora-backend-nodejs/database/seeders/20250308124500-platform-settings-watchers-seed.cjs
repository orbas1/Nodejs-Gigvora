'use strict';

const WATCHER_EMAILS = [
  'ava@gigvora.com',
  'mia@gigvora.com',
];

function buildWatcherPayload({ email, userId, digestFrequency, deliveryChannel, role, description, metadata }) {
  const now = new Date();
  return {
    userId: userId ?? null,
    email,
    digestFrequency,
    deliveryChannel,
    role,
    description,
    metadata: metadata ?? {},
    enabled: true,
    lastDigestAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [rows] = await queryInterface.sequelize.query(
        `SELECT id, email FROM users WHERE email IN (:emails)`,
        { replacements: { emails: WATCHER_EMAILS }, transaction },
      );
      const map = new Map((rows || []).map((row) => [row.email.toLowerCase(), row.id]));

      const watchers = [
        buildWatcherPayload({
          email: 'ava@gigvora.com',
          userId: map.get('ava@gigvora.com') ?? null,
          digestFrequency: 'immediate',
          deliveryChannel: 'notification',
          role: 'Chief Platform Officer',
          description: 'Owns platform guardrails and requires real-time monetisation alerts.',
          metadata: { escalationChannel: '#platform-guardians' },
        }),
        buildWatcherPayload({
          email: 'mia@gigvora.com',
          userId: map.get('mia@gigvora.com') ?? null,
          digestFrequency: 'daily',
          deliveryChannel: 'notification',
          role: 'Head of Compliance',
          description: 'Runs compliance reviews and receives consolidated platform-setting digests.',
          metadata: { timezone: 'America/New_York' },
        }),
      ].filter((watcher) => watcher.userId);

      if (watchers.length === 0) {
        await transaction.commit();
        return;
      }

      await queryInterface.bulkInsert('platform_settings_watchers', watchers, {
        updateOnDuplicate: [
          'email',
          'deliveryChannel',
          'digestFrequency',
          'role',
          'description',
          'metadata',
          'enabled',
          'updatedAt',
        ],
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete(
        'platform_settings_watchers',
        { email: WATCHER_EMAILS },
        { transaction },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
