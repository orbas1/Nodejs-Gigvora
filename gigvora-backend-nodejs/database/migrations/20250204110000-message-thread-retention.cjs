'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const { DEFAULT_RETENTION_POLICY, resolveRetentionDefaults } = await import(
      '../../src/constants/messagingRetention.js'
    );

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'message_threads',
        'retentionPolicy',
        {
          type: DataTypes.STRING(60),
          allowNull: false,
          defaultValue: DEFAULT_RETENTION_POLICY.policy,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'message_threads',
        'retentionDays',
        {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: DEFAULT_RETENTION_POLICY.days,
        },
        { transaction },
      );

      const [results] = await queryInterface.sequelize.query(
        'SELECT id, "channelType" FROM message_threads',
        { transaction },
      );

      await Promise.all(
        results.map(async (thread) => {
          const defaults = resolveRetentionDefaults(thread.channelType);
          await queryInterface.bulkUpdate(
            'message_threads',
            {
              retentionPolicy: defaults.policy,
              retentionDays: defaults.days,
            },
            { id: thread.id },
            { transaction },
          );
        }),
      );

      await queryInterface.addIndex(
        'message_threads',
        {
          fields: ['retentionPolicy'],
          name: 'message_threads_retentionPolicy_idx',
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'message_threads',
        {
          fields: ['retentionDays'],
          name: 'message_threads_retentionDays_idx',
        },
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('message_threads', 'message_threads_retentionDays_idx', { transaction });
      await queryInterface.removeIndex('message_threads', 'message_threads_retentionPolicy_idx', { transaction });
      await queryInterface.removeColumn('message_threads', 'retentionDays', { transaction });
      await queryInterface.removeColumn('message_threads', 'retentionPolicy', { transaction });
    });
  },
};
