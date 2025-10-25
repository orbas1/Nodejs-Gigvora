'use strict';

const { resolveJsonType, dropEnum } = require('../utils/migrationHelpers.cjs');

const RETENTION_POLICY_ENUM = 'enum_message_threads_retentionPolicy';
const RETENTION_POLICIES = [
  'inherit',
  'thirty_days',
  'ninety_days',
  'one_year',
  'eighteen_months',
  'custom',
  'indefinite',
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'message_threads',
        'retentionPolicy',
        {
          type: Sequelize.ENUM(...RETENTION_POLICIES),
          allowNull: false,
          defaultValue: 'inherit',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'message_threads',
        'retentionDays',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'message_threads',
        'retentionExpiresAt',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'message_threads',
        'retentionLocked',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'message_transcripts',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          threadId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'message_threads', key: 'id' },
            onDelete: 'CASCADE',
          },
          generatedBy: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          generatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          retentionPolicy: {
            type: Sequelize.ENUM(...RETENTION_POLICIES),
            allowNull: false,
            defaultValue: 'inherit',
          },
          retentionUntil: { type: Sequelize.DATE, allowNull: true },
          ciphertext: { type: Sequelize.TEXT('long'), allowNull: false },
          fingerprint: { type: Sequelize.STRING(120), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
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
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'message_transcripts',
        ['threadId', 'generatedAt'],
        {
          name: 'message_transcripts_thread_generated_idx',
          transaction,
        },
      );

      await queryInterface.addIndex(
        'message_transcripts',
        ['retentionUntil'],
        {
          name: 'message_transcripts_retention_until_idx',
          transaction,
        },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('message_transcripts', 'message_transcripts_thread_generated_idx', { transaction }).catch(() => {});
      await queryInterface.removeIndex('message_transcripts', 'message_transcripts_retention_until_idx', { transaction }).catch(() => {});
      await queryInterface.dropTable('message_transcripts', { transaction });

      await queryInterface.removeColumn('message_threads', 'retentionLocked', { transaction });
      await queryInterface.removeColumn('message_threads', 'retentionExpiresAt', { transaction });
      await queryInterface.removeColumn('message_threads', 'retentionDays', { transaction });
      await queryInterface.removeColumn('message_threads', 'retentionPolicy', { transaction });
    });

    await dropEnum(queryInterface, RETENTION_POLICY_ENUM);
  },
};
