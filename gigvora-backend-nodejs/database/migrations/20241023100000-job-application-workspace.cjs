'use strict';

const FAVOURITE_PRIORITIES = ['watching', 'warm', 'hot'];
const INTERVIEW_TYPES = ['phone', 'video', 'onsite', 'panel', 'assignment', 'other'];
const INTERVIEW_STATUSES = ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'];
const RESPONSE_DIRECTIONS = ['incoming', 'outgoing', 'system'];
const RESPONSE_CHANNELS = ['email', 'phone', 'portal', 'message', 'sms'];
const RESPONSE_STATUSES = ['pending', 'sent', 'received', 'acknowledged', 'needs_follow_up'];

const dropEnum = async (queryInterface, enumName) => {
  const dialect = queryInterface.sequelize.getDialect();
  if (dialect === 'postgres' || dialect === 'postgresql') {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`);
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      await queryInterface.createTable(
        'job_application_favourites',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          jobId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'jobs', key: 'id' },
            onDelete: 'SET NULL',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          companyName: { type: Sequelize.STRING(180), allowNull: true },
          location: { type: Sequelize.STRING(180), allowNull: true },
          priority: {
            type: Sequelize.ENUM(...FAVOURITE_PRIORITIES),
            allowNull: false,
            defaultValue: 'watching',
          },
          tags: { type: jsonType, allowNull: true },
          salaryMin: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          salaryMax: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          currencyCode: { type: Sequelize.STRING(3), allowNull: true },
          sourceUrl: { type: Sequelize.STRING(500), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          savedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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

      await queryInterface.addIndex('job_application_favourites', ['userId'], {
        transaction,
        name: 'job_application_favourites_user_idx',
      });
      await queryInterface.addIndex('job_application_favourites', ['priority'], {
        transaction,
        name: 'job_application_favourites_priority_idx',
      });

      await queryInterface.createTable(
        'job_application_interviews',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          applicationId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'applications', key: 'id' },
            onDelete: 'CASCADE',
          },
          scheduledAt: { type: Sequelize.DATE, allowNull: false },
          timezone: { type: Sequelize.STRING(120), allowNull: true },
          type: {
            type: Sequelize.ENUM(...INTERVIEW_TYPES),
            allowNull: false,
            defaultValue: 'phone',
          },
          status: {
            type: Sequelize.ENUM(...INTERVIEW_STATUSES),
            allowNull: false,
            defaultValue: 'scheduled',
          },
          interviewerName: { type: Sequelize.STRING(180), allowNull: true },
          interviewerEmail: { type: Sequelize.STRING(255), allowNull: true },
          location: { type: Sequelize.STRING(255), allowNull: true },
          meetingUrl: { type: Sequelize.STRING(500), allowNull: true },
          durationMinutes: { type: Sequelize.INTEGER, allowNull: true },
          feedbackScore: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
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

      await queryInterface.addIndex('job_application_interviews', ['userId'], {
        transaction,
        name: 'job_application_interviews_user_idx',
      });
      await queryInterface.addIndex('job_application_interviews', ['applicationId'], {
        transaction,
        name: 'job_application_interviews_application_idx',
      });
      await queryInterface.addIndex('job_application_interviews', ['scheduledAt'], {
        transaction,
        name: 'job_application_interviews_schedule_idx',
      });

      await queryInterface.createTable(
        'job_application_responses',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          applicationId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'applications', key: 'id' },
            onDelete: 'CASCADE',
          },
          direction: {
            type: Sequelize.ENUM(...RESPONSE_DIRECTIONS),
            allowNull: false,
            defaultValue: 'incoming',
          },
          channel: {
            type: Sequelize.ENUM(...RESPONSE_CHANNELS),
            allowNull: false,
            defaultValue: 'email',
          },
          status: {
            type: Sequelize.ENUM(...RESPONSE_STATUSES),
            allowNull: false,
            defaultValue: 'pending',
          },
          subject: { type: Sequelize.STRING(255), allowNull: true },
          body: { type: Sequelize.TEXT, allowNull: true },
          sentAt: { type: Sequelize.DATE, allowNull: true },
          followUpRequiredAt: { type: Sequelize.DATE, allowNull: true },
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

      await queryInterface.addIndex('job_application_responses', ['userId'], {
        transaction,
        name: 'job_application_responses_user_idx',
      });
      await queryInterface.addIndex('job_application_responses', ['applicationId'], {
        transaction,
        name: 'job_application_responses_application_idx',
      });
      await queryInterface.addIndex('job_application_responses', ['status'], {
        transaction,
        name: 'job_application_responses_status_idx',
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('job_application_responses', { transaction });
      await queryInterface.dropTable('job_application_interviews', { transaction });
      await queryInterface.dropTable('job_application_favourites', { transaction });
    });

    await dropEnum(queryInterface, 'enum_job_application_favourites_priority');
    await dropEnum(queryInterface, 'enum_job_application_interviews_type');
    await dropEnum(queryInterface, 'enum_job_application_interviews_status');
    await dropEnum(queryInterface, 'enum_job_application_responses_direction');
    await dropEnum(queryInterface, 'enum_job_application_responses_channel');
    await dropEnum(queryInterface, 'enum_job_application_responses_status');
  },
};
