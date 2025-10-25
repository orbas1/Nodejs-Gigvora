'use strict';

const { resolveJsonType, dropEnum } = require('../utils/migrationHelpers.cjs');

const EVENT_SYNC_ENUM = 'enum_candidate_calendar_events_syncStatus';
const EVENT_SYNC_STATUSES = ['pending', 'synced', 'failed'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'candidate_calendar_events',
        'timezone',
        { type: Sequelize.STRING(120), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'candidate_calendar_events',
        'recurrenceRule',
        { type: Sequelize.STRING(512), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'candidate_calendar_events',
        'recurrenceEndsAt',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'candidate_calendar_events',
        'recurrenceCount',
        { type: Sequelize.INTEGER, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'candidate_calendar_events',
        'recurrenceParentId',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'candidate_calendar_events', key: 'id' },
          onDelete: 'CASCADE',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'candidate_calendar_events',
        'icsUid',
        { type: Sequelize.STRING(255), allowNull: true, unique: false },
        { transaction },
      );

      await queryInterface.addColumn(
        'candidate_calendar_events',
        'externalProvider',
        { type: Sequelize.STRING(80), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'candidate_calendar_events',
        'externalEventId',
        { type: Sequelize.STRING(255), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'candidate_calendar_events',
        'syncStatus',
        {
          type: Sequelize.ENUM(...EVENT_SYNC_STATUSES),
          allowNull: false,
          defaultValue: 'pending',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'candidate_calendar_events',
        'syncMetadata',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'candidate_calendar_events',
        'syncedRevision',
        { type: Sequelize.INTEGER, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'candidate_calendar_events',
        'lastSyncedAt',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );

      await queryInterface.addIndex(
        'candidate_calendar_events',
        ['recurrenceParentId'],
        {
          name: 'candidate_calendar_events_recurrence_parent_idx',
          transaction,
        },
      );

      await queryInterface.addIndex(
        'candidate_calendar_events',
        ['icsUid'],
        {
          name: 'candidate_calendar_events_ics_uid_idx',
          unique: true,
          transaction,
        },
      );

      await queryInterface.addIndex(
        'candidate_calendar_events',
        ['externalProvider', 'externalEventId'],
        {
          name: 'candidate_calendar_events_external_idx',
          transaction,
        },
      );

      await queryInterface.createTable(
        'calendar_availability_snapshots',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          provider: { type: Sequelize.STRING(80), allowNull: false },
          syncedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          availability: { type: jsonType, allowNull: true },
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
        'calendar_availability_snapshots',
        ['userId', 'provider', 'syncedAt'],
        {
          name: 'calendar_availability_snapshots_user_provider_idx',
          transaction,
        },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('calendar_availability_snapshots', 'calendar_availability_snapshots_user_provider_idx', { transaction }).catch(() => {});
      await queryInterface.dropTable('calendar_availability_snapshots', { transaction });

      await queryInterface.removeIndex('candidate_calendar_events', 'candidate_calendar_events_external_idx', { transaction }).catch(() => {});
      await queryInterface.removeIndex('candidate_calendar_events', 'candidate_calendar_events_ics_uid_idx', { transaction }).catch(() => {});
      await queryInterface.removeIndex('candidate_calendar_events', 'candidate_calendar_events_recurrence_parent_idx', { transaction }).catch(() => {});

      await queryInterface.removeColumn('candidate_calendar_events', 'lastSyncedAt', { transaction });
      await queryInterface.removeColumn('candidate_calendar_events', 'syncedRevision', { transaction });
      await queryInterface.removeColumn('candidate_calendar_events', 'syncMetadata', { transaction });
      await queryInterface.removeColumn('candidate_calendar_events', 'syncStatus', { transaction });
      await queryInterface.removeColumn('candidate_calendar_events', 'externalEventId', { transaction });
      await queryInterface.removeColumn('candidate_calendar_events', 'externalProvider', { transaction });
      await queryInterface.removeColumn('candidate_calendar_events', 'icsUid', { transaction });
      await queryInterface.removeColumn('candidate_calendar_events', 'recurrenceParentId', { transaction });
      await queryInterface.removeColumn('candidate_calendar_events', 'recurrenceCount', { transaction });
      await queryInterface.removeColumn('candidate_calendar_events', 'recurrenceEndsAt', { transaction });
      await queryInterface.removeColumn('candidate_calendar_events', 'recurrenceRule', { transaction });
      await queryInterface.removeColumn('candidate_calendar_events', 'timezone', { transaction });
    });

    await dropEnum(queryInterface, EVENT_SYNC_ENUM);
  },
};
