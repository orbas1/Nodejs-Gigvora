'use strict';

const EVENT_TYPE_ENUM = 'enum_candidate_calendar_events_eventType';
const FOCUS_TYPE_ENUM = 'enum_focus_sessions_focusType';
const EVENT_VISIBILITY_ENUM = 'enum_candidate_calendar_events_visibility';
const SETTINGS_VIEW_ENUM = 'enum_user_calendar_settings_defaultView';

const NEW_EVENT_TYPES = [
  'job_interview',
  'gig',
  'mentorship',
  'volunteering',
  'event',
  'project_milestone',
];

const NEW_FOCUS_TYPES = ['mentorship', 'volunteering'];

const resolveJsonType = (queryInterface, Sequelize) => {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const calendarTable = 'candidate_calendar_events';
      const jsonType = resolveJsonType(queryInterface, Sequelize);
      const isPostgres = ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect());

      await queryInterface.addColumn(
        calendarTable,
        'description',
        { type: Sequelize.TEXT, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        calendarTable,
        'videoConferenceLink',
        { type: Sequelize.STRING(500), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        calendarTable,
        'isAllDay',
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        { transaction },
      );

      await queryInterface.addColumn(
        calendarTable,
        'reminderMinutes',
        { type: Sequelize.INTEGER, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        calendarTable,
        'visibility',
        {
          type: Sequelize.ENUM('private', 'shared', 'public'),
          allowNull: false,
          defaultValue: 'private',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        calendarTable,
        'relatedEntityType',
        { type: Sequelize.STRING(80), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        calendarTable,
        'relatedEntityId',
        { type: Sequelize.INTEGER, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        calendarTable,
        'colorHex',
        { type: Sequelize.STRING(9), allowNull: true },
        { transaction },
      );

      if (isPostgres) {
        for (const value of NEW_EVENT_TYPES) {
          await queryInterface.sequelize
            .query(`ALTER TYPE "${EVENT_TYPE_ENUM}" ADD VALUE IF NOT EXISTS '${value}'`, {
              transaction,
            })
            .catch(() => {});
        }

        for (const value of NEW_FOCUS_TYPES) {
          await queryInterface.sequelize
            .query(`ALTER TYPE "${FOCUS_TYPE_ENUM}" ADD VALUE IF NOT EXISTS '${value}'`, {
              transaction,
            })
            .catch(() => {});
        }
      }

      await queryInterface.createTable(
        'user_calendar_settings',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          timezone: { type: Sequelize.STRING(120), allowNull: false, defaultValue: 'UTC' },
          weekStart: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
          workStartMinutes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 480 },
          workEndMinutes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1020 },
          defaultView: {
            type: Sequelize.ENUM('agenda', 'week', 'month'),
            allowNull: false,
            defaultValue: 'agenda',
          },
          defaultReminderMinutes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 30 },
          autoFocusBlocks: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          shareAvailability: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          colorHex: { type: Sequelize.STRING(9), allowNull: true },
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

      await queryInterface.addConstraint('user_calendar_settings', {
        type: 'unique',
        fields: ['userId'],
        name: 'user_calendar_settings_user_unique',
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint('user_calendar_settings', 'user_calendar_settings_user_unique', {
        transaction,
      });
      await queryInterface.dropTable('user_calendar_settings', { transaction });

      const calendarTable = 'candidate_calendar_events';

      await queryInterface.removeColumn(calendarTable, 'colorHex', { transaction });
      await queryInterface.removeColumn(calendarTable, 'relatedEntityId', { transaction });
      await queryInterface.removeColumn(calendarTable, 'relatedEntityType', { transaction });
      await queryInterface.removeColumn(calendarTable, 'visibility', { transaction });
      await queryInterface.removeColumn(calendarTable, 'reminderMinutes', { transaction });
      await queryInterface.removeColumn(calendarTable, 'isAllDay', { transaction });
      await queryInterface.removeColumn(calendarTable, 'videoConferenceLink', { transaction });
      await queryInterface.removeColumn(calendarTable, 'description', { transaction });

      const isPostgres = ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect());

      if (isPostgres) {
        await queryInterface.sequelize.query(
          `UPDATE "${calendarTable}" SET "eventType" = CASE
            WHEN "eventType" = 'job_interview' THEN 'interview'
            WHEN "eventType" = 'gig' THEN 'project'
            WHEN "eventType" = 'mentorship' THEN 'networking'
            WHEN "eventType" = 'volunteering' THEN 'networking'
            WHEN "eventType" = 'event' THEN 'networking'
            WHEN "eventType" = 'project_milestone' THEN 'project'
            ELSE "eventType"
          END`,
          { transaction },
        );

        await queryInterface.sequelize.query(
          `UPDATE "focus_sessions" SET "focusType" = CASE
            WHEN "focusType" = 'mentorship' THEN 'networking'
            WHEN "focusType" = 'volunteering' THEN 'networking'
            ELSE "focusType"
          END`,
          { transaction },
        );

        const originalEventTypes = [
          'interview',
          'networking',
          'project',
          'wellbeing',
          'deadline',
          'ritual',
        ];

        const originalFocusTypes = ['interview_prep', 'networking', 'application', 'deep_work', 'wellbeing'];

        await queryInterface.sequelize.query(
          `CREATE TYPE "${EVENT_TYPE_ENUM}_tmp" AS ENUM (${originalEventTypes.map((v) => `'${v}'`).join(', ')})`,
          { transaction },
        );

        await queryInterface.sequelize.query(
          `ALTER TABLE "${calendarTable}" ALTER COLUMN "eventType" TYPE "${EVENT_TYPE_ENUM}_tmp" USING "eventType"::text::"${EVENT_TYPE_ENUM}_tmp"`,
          { transaction },
        );

        await queryInterface.sequelize.query(`DROP TYPE "${EVENT_TYPE_ENUM}"`, { transaction });

        await queryInterface.sequelize.query(
          `ALTER TYPE "${EVENT_TYPE_ENUM}_tmp" RENAME TO "${EVENT_TYPE_ENUM}"`,
          { transaction },
        );

        await queryInterface.sequelize.query(
          `CREATE TYPE "${FOCUS_TYPE_ENUM}_tmp" AS ENUM (${originalFocusTypes.map((v) => `'${v}'`).join(', ')})`,
          { transaction },
        );

        await queryInterface.sequelize.query(
          `ALTER TABLE "focus_sessions" ALTER COLUMN "focusType" TYPE "${FOCUS_TYPE_ENUM}_tmp" USING "focusType"::text::"${FOCUS_TYPE_ENUM}_tmp"`,
          { transaction },
        );

        await queryInterface.sequelize.query(`DROP TYPE "${FOCUS_TYPE_ENUM}"`, { transaction });

        await queryInterface.sequelize.query(
          `ALTER TYPE "${FOCUS_TYPE_ENUM}_tmp" RENAME TO "${FOCUS_TYPE_ENUM}"`,
          { transaction },
        );

        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${EVENT_VISIBILITY_ENUM}"`, { transaction });
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${SETTINGS_VIEW_ENUM}"`, { transaction });
      }
    });
  },
};
