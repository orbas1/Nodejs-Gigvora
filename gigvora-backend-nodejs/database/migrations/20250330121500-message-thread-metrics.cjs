'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const jsonType = ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())
        ? Sequelize.JSONB
        : Sequelize.JSON;

      await queryInterface.createTable(
        'message_thread_metrics',
        {
          threadId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: { model: 'message_threads', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          messageCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          participantCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          collaboratorCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          avgResponseMinutes: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
          medianResponseMinutes: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
          awaitingResponse: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          awaitingResponseUserId: { type: Sequelize.INTEGER, allowNull: true },
          awaitingResponseSince: { type: Sequelize.DATE, allowNull: true },
          lastInboundAt: { type: Sequelize.DATE, allowNull: true },
          lastOutboundAt: { type: Sequelize.DATE, allowNull: true },
          lastTouchedBy: { type: Sequelize.INTEGER, allowNull: true },
          engagementScore: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
          previousEngagementScore: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
          engagementTrend: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
          momentumDirection: { type: Sequelize.STRING(20), allowNull: true },
          momentumDelta: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
          dormantSince: { type: Sequelize.DATE, allowNull: true },
          nextResponseDueAt: { type: Sequelize.DATE, allowNull: true },
          progressPercent: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('message_thread_metrics', ['awaitingResponse'], { transaction });
      await queryInterface.addIndex('message_thread_metrics', ['dormantSince'], { transaction });
      await queryInterface.addIndex('message_thread_metrics', ['nextResponseDueAt'], { transaction });
      await queryInterface.addIndex('message_thread_metrics', ['momentumDirection'], { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('message_thread_metrics', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
