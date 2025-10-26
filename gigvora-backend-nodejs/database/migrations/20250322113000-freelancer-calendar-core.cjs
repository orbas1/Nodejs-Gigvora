'use strict';

const { resolveJsonType, dropEnum } = require('../utils/migrationHelpers.cjs');

const EVENT_TYPES = [
  'project',
  'gig',
  'job_interview',
  'mentorship',
  'volunteering',
  'client_meeting',
  'other',
];

const EVENT_STATUSES = ['tentative', 'confirmed', 'in_progress', 'completed', 'cancelled'];

const RELATED_ENTITY_TYPES = ['project', 'gig', 'job', 'mentorship', 'volunteering', 'client', 'community', 'other'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'freelancer_calendar_events',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(255), allowNull: false },
          eventType: {
            type: Sequelize.ENUM(...EVENT_TYPES),
            allowNull: false,
            defaultValue: 'project',
          },
          status: {
            type: Sequelize.ENUM(...EVENT_STATUSES),
            allowNull: false,
            defaultValue: 'confirmed',
          },
          startsAt: { type: Sequelize.DATE, allowNull: false },
          endsAt: { type: Sequelize.DATE, allowNull: true },
          isAllDay: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          location: { type: Sequelize.STRING(255), allowNull: true },
          meetingUrl: { type: Sequelize.STRING(500), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          relatedEntityType: {
            type: Sequelize.ENUM(...RELATED_ENTITY_TYPES),
            allowNull: true,
          },
          relatedEntityId: { type: Sequelize.STRING(120), allowNull: true },
          relatedEntityName: { type: Sequelize.STRING(255), allowNull: true },
          reminderMinutesBefore: { type: Sequelize.INTEGER, allowNull: true },
          source: { type: Sequelize.STRING(80), allowNull: false, defaultValue: 'manual' },
          color: { type: Sequelize.STRING(32), allowNull: true },
          createdById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          updatedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
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

      await queryInterface.addIndex('freelancer_calendar_events', ['freelancerId'], { transaction });
      await queryInterface.addIndex('freelancer_calendar_events', ['startsAt'], { transaction });
      await queryInterface.addIndex('freelancer_calendar_events', ['eventType'], { transaction });
      await queryInterface.addIndex('freelancer_calendar_events', ['status'], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('freelancer_calendar_events', { transaction });
    });

    await dropEnum(queryInterface, 'enum_freelancer_calendar_events_eventType');
    await dropEnum(queryInterface, 'enum_freelancer_calendar_events_status');
    await dropEnum(queryInterface, 'enum_freelancer_calendar_events_relatedEntityType');
  },
};
