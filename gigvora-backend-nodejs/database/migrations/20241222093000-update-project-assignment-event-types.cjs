'use strict';

const EVENT_TYPES = [
  'created',
  'auto_assign_enabled',
  'auto_assign_disabled',
  'auto_assign_queue_generated',
  'auto_assign_queue_regenerated',
  'auto_assign_queue_exhausted',
  'auto_assign_queue_failed',
];

const LEGACY_EVENT_TYPES = [
  'created',
  'auto_assign_enabled',
  'auto_assign_disabled',
  'auto_assign_queue_generated',
  'auto_assign_queue_exhausted',
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    await queryInterface.sequelize.transaction(async (transaction) => {
      if (['postgres', 'postgresql'].includes(dialect)) {
        await queryInterface.sequelize.query(
          'ALTER TYPE "enum_project_assignment_events_eventType" ADD VALUE IF NOT EXISTS \'auto_assign_queue_regenerated\';',
          { transaction },
        );
        await queryInterface.sequelize.query(
          'ALTER TYPE "enum_project_assignment_events_eventType" ADD VALUE IF NOT EXISTS \'auto_assign_queue_failed\';',
          { transaction },
        );
      } else {
        await queryInterface.changeColumn(
          'project_assignment_events',
          'eventType',
          {
            type: Sequelize.ENUM(...EVENT_TYPES),
            allowNull: false,
            defaultValue: 'created',
          },
          { transaction },
        );
      }
    });
  },

  async down(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    await queryInterface.sequelize.transaction(async (transaction) => {
      if (['postgres', 'postgresql'].includes(dialect)) {
        await queryInterface.sequelize.query(
          'ALTER TABLE "project_assignment_events" ALTER COLUMN "eventType" TYPE text USING "eventType"::text;',
          { transaction },
        );
        await queryInterface.sequelize.query(
          'DROP TYPE IF EXISTS "enum_project_assignment_events_eventType";',
          { transaction },
        );
        await queryInterface.sequelize.query(
          'CREATE TYPE "enum_project_assignment_events_eventType" AS ENUM (\'created\', \'auto_assign_enabled\', \'auto_assign_disabled\', \'auto_assign_queue_generated\', \'auto_assign_queue_exhausted\');',
          { transaction },
        );
        await queryInterface.sequelize.query(
          'ALTER TABLE "project_assignment_events" ALTER COLUMN "eventType" TYPE "enum_project_assignment_events_eventType" USING "eventType"::"enum_project_assignment_events_eventType";',
          { transaction },
        );
      } else {
        await queryInterface.changeColumn(
          'project_assignment_events',
          'eventType',
          {
            type: Sequelize.ENUM(...LEGACY_EVENT_TYPES),
            allowNull: false,
            defaultValue: 'created',
          },
          { transaction },
        );
      }
    });
  },
};
