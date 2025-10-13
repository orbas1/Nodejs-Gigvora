'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'gigs',
        'freelancerId',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'gigs',
        'status',
        {
          type: Sequelize.STRING(40),
          allowNull: false,
          defaultValue: 'draft',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'gigs',
        'pipelineStage',
        {
          type: Sequelize.STRING(40),
          allowNull: false,
          defaultValue: 'discovery',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'gigs',
        'contractValueCents',
        {
          type: Sequelize.BIGINT,
          allowNull: false,
          defaultValue: 0,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'gigs',
        'previousPipelineValueCents',
        {
          type: Sequelize.BIGINT,
          allowNull: false,
          defaultValue: 0,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'gigs',
        'currency',
        {
          type: Sequelize.STRING(12),
          allowNull: false,
          defaultValue: 'USD',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'gigs',
        'upsellEligibleValueCents',
        {
          type: Sequelize.BIGINT,
          allowNull: false,
          defaultValue: 0,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'gigs',
        'expectedDeliveryDate',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'gigs',
        'clientName',
        {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'gigs',
        'csatScore',
        {
          type: Sequelize.DECIMAL(3, 2),
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'gigs',
        'csatPreviousScore',
        {
          type: Sequelize.DECIMAL(3, 2),
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'gigs',
        'csatResponseCount',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'gig_milestones',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          gigId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'gigs', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(255), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          dueDate: { type: Sequelize.DATE, allowNull: true },
          status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'planned' },
          ownerName: { type: Sequelize.STRING(120), allowNull: true },
          sequenceIndex: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          progressPercent: { type: Sequelize.INTEGER, allowNull: true },
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
        'gig_milestones',
        ['gigId', 'sequenceIndex'],
        {
          name: 'gig_milestones_gig_sequence_idx',
          transaction,
        },
      );

      await queryInterface.createTable(
        'gig_bundles',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          name: { type: Sequelize.STRING(255), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          priceCents: { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 },
          currency: { type: Sequelize.STRING(12), allowNull: false, defaultValue: 'USD' },
          status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'draft' },
          attachRate: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          attachRateChange: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          isFeatured: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          conversionWindowDays: { type: Sequelize.INTEGER, allowNull: true },
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
        'gig_bundles',
        ['freelancerId', 'status'],
        {
          name: 'gig_bundles_freelancer_status_idx',
          transaction,
        },
      );

      await queryInterface.createTable(
        'gig_bundle_items',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          bundleId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'gig_bundles', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          label: { type: Sequelize.STRING(255), allowNull: false },
          orderIndex: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
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
        'gig_bundle_items',
        ['bundleId', 'orderIndex'],
        {
          name: 'gig_bundle_items_bundle_order_idx',
          transaction,
        },
      );

      await queryInterface.createTable(
        'gig_upsells',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          name: { type: Sequelize.STRING(255), allowNull: false },
          triggerEvent: { type: Sequelize.STRING(255), allowNull: true },
          deliveryAction: { type: Sequelize.STRING(255), allowNull: true },
          status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'draft' },
          automationChannel: { type: Sequelize.STRING(80), allowNull: true },
          estimatedValueCents: { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 },
          currency: { type: Sequelize.STRING(12), allowNull: false, defaultValue: 'USD' },
          conversionRate: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          conversionChange: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
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
        'gig_upsells',
        ['freelancerId', 'status'],
        {
          name: 'gig_upsells_freelancer_status_idx',
          transaction,
        },
      );

      await queryInterface.createTable(
        'gig_catalog_items',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          code: { type: Sequelize.STRING(40), allowNull: false },
          title: { type: Sequelize.STRING(255), allowNull: false },
          tier: { type: Sequelize.STRING(80), allowNull: true },
          durationDays: { type: Sequelize.INTEGER, allowNull: true },
          rating: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
          ratingCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          priceCents: { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 },
          currency: { type: Sequelize.STRING(12), allowNull: false, defaultValue: 'USD' },
          status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'draft' },
          shortDescription: { type: Sequelize.TEXT, allowNull: true },
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
        'gig_catalog_items',
        ['freelancerId', 'status'],
        {
          name: 'gig_catalog_items_freelancer_status_idx',
          transaction,
        },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('gig_catalog_items', 'gig_catalog_items_freelancer_status_idx', { transaction });
      await queryInterface.dropTable('gig_catalog_items', { transaction });

      await queryInterface.removeIndex('gig_upsells', 'gig_upsells_freelancer_status_idx', { transaction });
      await queryInterface.dropTable('gig_upsells', { transaction });

      await queryInterface.removeIndex('gig_bundle_items', 'gig_bundle_items_bundle_order_idx', { transaction });
      await queryInterface.dropTable('gig_bundle_items', { transaction });

      await queryInterface.removeIndex('gig_bundles', 'gig_bundles_freelancer_status_idx', { transaction });
      await queryInterface.dropTable('gig_bundles', { transaction });

      await queryInterface.removeIndex('gig_milestones', 'gig_milestones_gig_sequence_idx', { transaction });
      await queryInterface.dropTable('gig_milestones', { transaction });

      await queryInterface.removeColumn('gigs', 'csatResponseCount', { transaction });
      await queryInterface.removeColumn('gigs', 'csatPreviousScore', { transaction });
      await queryInterface.removeColumn('gigs', 'csatScore', { transaction });
      await queryInterface.removeColumn('gigs', 'clientName', { transaction });
      await queryInterface.removeColumn('gigs', 'expectedDeliveryDate', { transaction });
      await queryInterface.removeColumn('gigs', 'upsellEligibleValueCents', { transaction });
      await queryInterface.removeColumn('gigs', 'currency', { transaction });
      await queryInterface.removeColumn('gigs', 'previousPipelineValueCents', { transaction });
      await queryInterface.removeColumn('gigs', 'contractValueCents', { transaction });
      await queryInterface.removeColumn('gigs', 'pipelineStage', { transaction });
      await queryInterface.removeColumn('gigs', 'status', { transaction });
      await queryInterface.removeColumn('gigs', 'freelancerId', { transaction });
    });
  },
};
