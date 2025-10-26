'use strict';

const JOB_STATUSES = ['pending', 'processing', 'completed', 'failed', 'cancelled'];

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('search_subscription_jobs', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      subscriptionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'search_subscriptions', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM(...JOB_STATUSES),
        allowNull: false,
        defaultValue: 'pending',
      },
      reason: { type: Sequelize.STRING(120), allowNull: false, defaultValue: 'manual' },
      priority: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 5 },
      payload: { type: jsonType, allowNull: true },
      attempts: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      lastError: { type: Sequelize.TEXT, allowNull: true },
      queuedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      availableAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      processingStartedAt: { type: Sequelize.DATE, allowNull: true },
      processingFinishedAt: { type: Sequelize.DATE, allowNull: true },
      durationMs: { type: Sequelize.INTEGER, allowNull: true },
      resultCount: { type: Sequelize.INTEGER, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('search_subscription_jobs', ['status', 'availableAt']);
    await queryInterface.addIndex('search_subscription_jobs', ['subscriptionId']);
    await queryInterface.addIndex('search_subscription_jobs', ['userId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('search_subscription_jobs', ['status', 'availableAt']).catch(() => {});
    await queryInterface.removeIndex('search_subscription_jobs', ['subscriptionId']).catch(() => {});
    await queryInterface.removeIndex('search_subscription_jobs', ['userId']).catch(() => {});
    await queryInterface.dropTable('search_subscription_jobs');

    const dialect = queryInterface.sequelize.getDialect();
    if (['postgres', 'postgresql'].includes(dialect)) {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_search_subscription_jobs_status";');
    }
  },
};
