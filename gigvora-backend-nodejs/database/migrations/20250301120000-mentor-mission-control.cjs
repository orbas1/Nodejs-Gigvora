'use strict';

const { resolveJsonType } = require('../utils/migrationHelpers.cjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const jsonType = resolveJsonType(queryInterface, Sequelize);

      await queryInterface.createTable(
        'mentor_hub_updates',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(200), allowNull: false },
          summary: { type: Sequelize.TEXT, allowNull: false },
          category: { type: Sequelize.STRING(80), allowNull: false },
          link: { type: Sequelize.STRING(1024), allowNull: true },
          status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'Draft' },
          publishedAt: { type: Sequelize.DATE, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await Promise.all([
        queryInterface.addIndex('mentor_hub_updates', ['mentorId'], {
          name: 'mentor_hub_updates_mentor_idx',
          transaction,
        }),
        queryInterface.addIndex('mentor_hub_updates', ['mentorId', 'status'], {
          name: 'mentor_hub_updates_status_idx',
          transaction,
        }),
      ]);

      await queryInterface.createTable(
        'mentor_hub_actions',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          label: { type: Sequelize.STRING(240), allowNull: false },
          owner: { type: Sequelize.STRING(120), allowNull: true },
          dueAt: { type: Sequelize.DATE, allowNull: true },
          status: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'Not started' },
          priority: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'Medium' },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('mentor_hub_actions', ['mentorId', 'status'], {
        name: 'mentor_hub_actions_status_idx',
        transaction,
      });

      await queryInterface.createTable(
        'mentor_hub_resources',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(200), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          type: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'Resource' },
          link: { type: Sequelize.STRING(1024), allowNull: false },
          thumbnail: { type: Sequelize.STRING(1024), allowNull: true },
          tags: { type: jsonType, allowNull: true },
          updatedAtExternal: { type: Sequelize.DATE, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('mentor_hub_resources', ['mentorId'], {
        name: 'mentor_hub_resources_mentor_idx',
        transaction,
      });

      await queryInterface.createTable(
        'mentor_hub_spotlights',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(200), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: false },
          videoUrl: { type: Sequelize.STRING(1024), allowNull: true },
          ctaLabel: { type: Sequelize.STRING(120), allowNull: true },
          ctaLink: { type: Sequelize.STRING(1024), allowNull: true },
          thumbnailUrl: { type: Sequelize.STRING(1024), allowNull: true },
          backgroundGradient: { type: Sequelize.STRING(180), allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'mentor_orders',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          reference: { type: Sequelize.STRING(120), allowNull: false },
          mentee: { type: Sequelize.STRING(191), allowNull: false },
          package: { type: Sequelize.STRING(191), allowNull: true },
          amount: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
          currency: { type: Sequelize.STRING(6), allowNull: false, defaultValue: 'GBP' },
          status: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'Pending payment' },
          channel: { type: Sequelize.STRING(80), allowNull: true },
          orderedAt: { type: Sequelize.DATE, allowNull: true },
          fulfillmentStatus: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'In progress' },
          notes: { type: Sequelize.TEXT, allowNull: true },
          invoiceId: { type: Sequelize.STRING(120), allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('mentor_orders', ['mentorId', 'status'], {
        name: 'mentor_orders_status_idx',
        transaction,
      });

      await queryInterface.createTable(
        'mentor_ad_campaigns',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(191), allowNull: false },
          objective: { type: Sequelize.STRING(120), allowNull: false, defaultValue: 'Lead generation' },
          status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'Draft' },
          budget: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          spend: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          impressions: { type: Sequelize.INTEGER, allowNull: true },
          clicks: { type: Sequelize.INTEGER, allowNull: true },
          conversions: { type: Sequelize.INTEGER, allowNull: true },
          startDate: { type: Sequelize.DATE, allowNull: true },
          endDate: { type: Sequelize.DATE, allowNull: true },
          placements: { type: jsonType, allowNull: true },
          cta: { type: Sequelize.STRING(160), allowNull: true },
          creativeUrl: { type: Sequelize.STRING(1024), allowNull: true },
          thumbnail: { type: Sequelize.STRING(1024), allowNull: true },
          audience: { type: Sequelize.STRING(255), allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await Promise.all([
        queryInterface.addIndex('mentor_ad_campaigns', ['mentorId'], {
          name: 'mentor_ad_campaigns_mentor_idx',
          transaction,
        }),
        queryInterface.addIndex('mentor_ad_campaigns', ['mentorId', 'status'], {
          name: 'mentor_ad_campaigns_status_idx',
          transaction,
        }),
      ]);

      await queryInterface.createTable(
        'mentor_metric_widgets',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(191), allowNull: false },
          value: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          goal: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          unit: { type: Sequelize.STRING(16), allowNull: true },
          timeframe: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'Last 30 days' },
          insight: { type: Sequelize.TEXT, allowNull: true },
          trend: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
          variance: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
          samples: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('mentor_metric_widgets', ['mentorId'], {
        name: 'mentor_metric_widgets_mentor_idx',
        transaction,
      });

      await queryInterface.createTable(
        'mentor_metric_reporting_settings',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          cadence: { type: Sequelize.STRING(80), allowNull: false, defaultValue: 'Weekly' },
          delivery: { type: Sequelize.STRING(120), allowNull: false, defaultValue: 'Email & Slack' },
          recipients: { type: jsonType, allowNull: true },
          nextDispatchAt: { type: Sequelize.DATE, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'mentor_settings',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          settings: { type: jsonType, allowNull: false, defaultValue: {} },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'mentor_system_preferences',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          preferences: { type: jsonType, allowNull: false, defaultValue: {} },
          apiKeyCiphertext: { type: Sequelize.TEXT, allowNull: true },
          apiKeyFingerprint: { type: Sequelize.STRING(120), allowNull: true },
          apiKeyLastRotatedAt: { type: Sequelize.DATE, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tables = [
        'mentor_system_preferences',
        'mentor_settings',
        'mentor_metric_reporting_settings',
        'mentor_metric_widgets',
        'mentor_ad_campaigns',
        'mentor_orders',
        'mentor_hub_spotlights',
        'mentor_hub_resources',
        'mentor_hub_actions',
        'mentor_hub_updates',
      ];

      for (const table of tables) {
        await queryInterface.dropTable(table, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
