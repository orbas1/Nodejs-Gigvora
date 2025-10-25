'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'message_retention_audits',
        {
          id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
          runId: { type: DataTypes.UUID, allowNull: false },
          threadId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'message_threads', key: 'id' },
            onDelete: 'CASCADE',
          },
          channelType: { type: DataTypes.STRING(40), allowNull: false },
          retentionPolicy: { type: DataTypes.STRING(60), allowNull: false },
          retentionDays: { type: DataTypes.INTEGER, allowNull: false },
          deletedCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
          participantCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
          cutoffAt: { type: DataTypes.DATE, allowNull: false },
          isOverride: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
          metadata: { type: jsonType, allowNull: true },
          retainedUntil: { type: DataTypes.DATE, allowNull: false },
          archivedAt: { type: DataTypes.DATE, allowNull: true },
          createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
          updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'message_retention_audits',
        { name: 'message_retention_audits_run_idx', fields: ['runId'] },
        { transaction },
      );
      await queryInterface.addIndex(
        'message_retention_audits',
        { name: 'message_retention_audits_thread_idx', fields: ['threadId', 'cutoffAt'] },
        { transaction },
      );
      await queryInterface.addIndex(
        'message_retention_audits',
        { name: 'message_retention_audits_override_idx', fields: ['isOverride'] },
        { transaction },
      );
      await queryInterface.addIndex(
        'message_retention_audits',
        { name: 'message_retention_audits_retained_until_idx', fields: ['retainedUntil'] },
        { transaction },
      );
      await queryInterface.addIndex(
        'message_retention_audits',
        { name: 'message_retention_audits_archived_idx', fields: ['archivedAt'] },
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(
        'message_retention_audits',
        'message_retention_audits_archived_idx',
        { transaction },
      );
      await queryInterface.removeIndex(
        'message_retention_audits',
        'message_retention_audits_retained_until_idx',
        { transaction },
      );
      await queryInterface.removeIndex(
        'message_retention_audits',
        'message_retention_audits_override_idx',
        { transaction },
      );
      await queryInterface.removeIndex(
        'message_retention_audits',
        'message_retention_audits_thread_idx',
        { transaction },
      );
      await queryInterface.removeIndex(
        'message_retention_audits',
        'message_retention_audits_run_idx',
        { transaction },
      );
      await queryInterface.dropTable('message_retention_audits', { transaction });
    });
  },
};
