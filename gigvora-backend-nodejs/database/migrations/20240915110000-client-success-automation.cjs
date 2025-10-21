'use strict';

const { resolveJsonType, dropEnum } = require('../utils/migrationHelpers.cjs');

const ENUMS = {
  playbookTrigger: 'enum_client_success_playbooks_triggerType',
  stepType: 'enum_client_success_steps_stepType',
  stepChannel: 'enum_client_success_steps_channel',
  enrollmentStatus: 'enum_client_success_enrollments_status',
  eventStatus: 'enum_client_success_events_status',
  referralStatus: 'enum_client_success_referrals_status',
  nudgeStatus: 'enum_client_success_review_nudges_status',
  affiliateStatus: 'enum_client_success_affiliate_links_status',
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);
      const dialect = queryInterface.sequelize.getDialect();
      const isPostgres = ['postgres', 'postgresql'].includes(dialect);
      const tagsType = isPostgres ? Sequelize.ARRAY(Sequelize.STRING) : jsonType;

      const enumsToReset = [
        ENUMS.playbookTrigger,
        ENUMS.stepType,
        ENUMS.stepChannel,
        ENUMS.enrollmentStatus,
        ENUMS.eventStatus,
        ENUMS.referralStatus,
        ENUMS.nudgeStatus,
        ENUMS.affiliateStatus,
      ];

      await Promise.all(enumsToReset.map((enumName) => dropEnum(queryInterface, enumName, transaction)));

      await queryInterface.createTable(
        'client_success_playbooks',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(160), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          triggerType: {
            type: Sequelize.ENUM(
              'gig_purchase',
              'kickoff_complete',
              'milestone_reached',
              'delivery_submitted',
              'delivery_accepted',
              'renewal_window',
              'manual',
            ),
            allowNull: false,
            defaultValue: 'gig_purchase',
          },
          isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          tags: { type: tagsType, allowNull: true },
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

      await queryInterface.createTable(
        'client_success_steps',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          playbookId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'client_success_playbooks', key: 'id' },
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(160), allowNull: false },
          stepType: {
            type: Sequelize.ENUM(
              'email',
              'checklist',
              'testimonial_request',
              'referral_invite',
              'review_nudge',
              'reward',
              'webhook',
            ),
            allowNull: false,
            defaultValue: 'email',
          },
          channel: {
            type: Sequelize.ENUM('email', 'in_app', 'sms', 'task', 'webhook'),
            allowNull: false,
            defaultValue: 'email',
          },
          orderIndex: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          offsetHours: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          waitForCompletion: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          templateSubject: { type: Sequelize.STRING(200), allowNull: true },
          templateBody: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
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

      await queryInterface.createTable(
        'client_success_enrollments',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          playbookId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'client_success_playbooks', key: 'id' },
            onDelete: 'CASCADE',
          },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          clientId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          gigId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'gigs', key: 'id' },
            onDelete: 'SET NULL',
          },
          status: {
            type: Sequelize.ENUM('pending', 'active', 'completed', 'paused', 'cancelled'),
            allowNull: false,
            defaultValue: 'pending',
          },
          startedAt: { type: Sequelize.DATE, allowNull: true },
          completedAt: { type: Sequelize.DATE, allowNull: true },
          cancelledAt: { type: Sequelize.DATE, allowNull: true },
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

      await queryInterface.createTable(
        'client_success_events',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          enrollmentId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'client_success_enrollments', key: 'id' },
            onDelete: 'CASCADE',
          },
          stepId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'client_success_steps', key: 'id' },
            onDelete: 'CASCADE',
          },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          status: {
            type: Sequelize.ENUM('queued', 'processing', 'completed', 'skipped', 'failed'),
            allowNull: false,
            defaultValue: 'queued',
          },
          channel: { type: Sequelize.STRING(40), allowNull: true },
          scheduledAt: { type: Sequelize.DATE, allowNull: true },
          executedAt: { type: Sequelize.DATE, allowNull: true },
          resultSummary: { type: Sequelize.STRING(255), allowNull: true },
          payload: { type: jsonType, allowNull: true },
          errorDetails: { type: Sequelize.TEXT, allowNull: true },
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

      await queryInterface.createTable(
        'client_success_referrals',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          gigId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'gigs', key: 'id' },
            onDelete: 'SET NULL',
          },
          referrerId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          referredEmail: { type: Sequelize.STRING(255), allowNull: true },
          referralCode: { type: Sequelize.STRING(80), allowNull: false },
          status: {
            type: Sequelize.ENUM('invited', 'clicked', 'converted', 'rewarded', 'expired'),
            allowNull: false,
            defaultValue: 'invited',
          },
          rewardValueCents: { type: Sequelize.INTEGER, allowNull: true },
          rewardCurrency: { type: Sequelize.STRING(8), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          occurredAt: { type: Sequelize.DATE, allowNull: true },
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

      await queryInterface.createTable(
        'client_success_review_nudges',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          gigId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'gigs', key: 'id' },
            onDelete: 'SET NULL',
          },
          clientId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          orderId: { type: Sequelize.STRING(120), allowNull: true },
          status: {
            type: Sequelize.ENUM('scheduled', 'sent', 'responded', 'dismissed', 'cancelled'),
            allowNull: false,
            defaultValue: 'scheduled',
          },
          channel: { type: Sequelize.STRING(40), allowNull: true },
          scheduledAt: { type: Sequelize.DATE, allowNull: true },
          sentAt: { type: Sequelize.DATE, allowNull: true },
          responseAt: { type: Sequelize.DATE, allowNull: true },
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

      await queryInterface.createTable(
        'client_success_affiliate_links',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          gigId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'gigs', key: 'id' },
            onDelete: 'SET NULL',
          },
          label: { type: Sequelize.STRING(160), allowNull: true },
          code: { type: Sequelize.STRING(80), allowNull: false },
          status: {
            type: Sequelize.ENUM('active', 'paused', 'archived'),
            allowNull: false,
            defaultValue: 'active',
          },
          destinationUrl: { type: Sequelize.STRING(512), allowNull: true },
          commissionRate: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          totalClicks: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          totalConversions: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          totalRevenueCents: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          revenueCurrency: { type: Sequelize.STRING(8), allowNull: true },
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
        'client_success_playbooks',
        ['freelancerId', 'isActive'],
        { transaction, name: 'client_success_playbooks_freelancer_active_idx' },
      );
      await queryInterface.addIndex(
        'client_success_enrollments',
        ['freelancerId', 'status'],
        { transaction, name: 'client_success_enrollments_status_idx' },
      );
      await queryInterface.addIndex(
        'client_success_events',
        ['freelancerId', 'status', 'scheduledAt'],
        { transaction, name: 'client_success_events_schedule_idx' },
      );
      await queryInterface.addIndex(
        'client_success_referrals',
        ['freelancerId', 'status'],
        { transaction, name: 'client_success_referrals_status_idx' },
      );
      await queryInterface.addIndex(
        'client_success_affiliate_links',
        ['freelancerId', 'code'],
        { unique: true, transaction, name: 'client_success_affiliate_links_code_unique' },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('client_success_affiliate_links', 'client_success_affiliate_links_code_unique', {
        transaction,
      });
      await queryInterface.removeIndex('client_success_referrals', 'client_success_referrals_status_idx', { transaction });
      await queryInterface.removeIndex('client_success_events', 'client_success_events_schedule_idx', { transaction });
      await queryInterface.removeIndex('client_success_enrollments', 'client_success_enrollments_status_idx', { transaction });
      await queryInterface.removeIndex(
        'client_success_playbooks',
        'client_success_playbooks_freelancer_active_idx',
        { transaction },
      );

      await queryInterface.dropTable('client_success_affiliate_links', { transaction });
      await queryInterface.dropTable('client_success_review_nudges', { transaction });
      await queryInterface.dropTable('client_success_referrals', { transaction });
      await queryInterface.dropTable('client_success_events', { transaction });
      await queryInterface.dropTable('client_success_enrollments', { transaction });
      await queryInterface.dropTable('client_success_steps', { transaction });
      await queryInterface.dropTable('client_success_playbooks', { transaction });

      const enumsToDrop = [
        ENUMS.affiliateStatus,
        ENUMS.nudgeStatus,
        ENUMS.referralStatus,
        ENUMS.eventStatus,
        ENUMS.enrollmentStatus,
        ENUMS.stepChannel,
        ENUMS.stepType,
        ENUMS.playbookTrigger,
      ];

      await Promise.all(enumsToDrop.map((enumName) => dropEnum(queryInterface, enumName, transaction)));
    });
  },
};
