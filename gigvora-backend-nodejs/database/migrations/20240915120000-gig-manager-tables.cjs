'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const describeGigs = await queryInterface.describeTable('gigs', { transaction });
      const ensureGigColumn = async (column, definition) => {
        if (!Object.prototype.hasOwnProperty.call(describeGigs, column)) {
          await queryInterface.addColumn('gigs', column, definition, { transaction });
        }
      };

      await ensureGigColumn('freelancerId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });

      await ensureGigColumn('status', {
        type: Sequelize.ENUM('draft', 'in_review', 'active', 'paused', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft',
      });

      await ensureGigColumn('pipelineStage', {
        type: Sequelize.ENUM('discovery', 'qualification', 'proposal', 'negotiation', 'won', 'lost'),
        allowNull: false,
        defaultValue: 'discovery',
      });

      await ensureGigColumn('contractValueCents', {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
      });

      await ensureGigColumn('previousPipelineValueCents', {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
      });

      await ensureGigColumn('currency', {
        type: Sequelize.STRING(12),
        allowNull: false,
        defaultValue: 'USD',
      });

      await ensureGigColumn('upsellEligibleValueCents', {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
      });

      await ensureGigColumn('expectedDeliveryDate', {
        type: Sequelize.DATE,
        allowNull: true,
      });

      await ensureGigColumn('clientName', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });

      await ensureGigColumn('csatScore', {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
      });

      await ensureGigColumn('csatPreviousScore', {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
      });

      await ensureGigColumn('csatResponseCount', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });

      const ensureIndex = async (table, indexName, fields, options = {}) => {
        const indexes = await queryInterface.showIndex(table, { transaction });
        if (!indexes.some((index) => index.name === indexName)) {
          await queryInterface.addIndex(table, fields, { name: indexName, transaction, ...options });
        }
      };

      await ensureIndex('gigs', 'gigs_freelancer_idx', ['freelancerId']);
      await ensureIndex('gigs', 'gigs_status_idx', ['status']);
      await ensureIndex('gigs', 'gigs_pipeline_stage_idx', ['pipelineStage']);

      const timestampDefault = Sequelize.literal('CURRENT_TIMESTAMP');

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
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
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
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
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
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
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
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
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
      const dropIndexIfExists = async (table, indexName) => {
        const indexes = await queryInterface.showIndex(table, { transaction });
        if (indexes.some((index) => index.name === indexName)) {
          await queryInterface.removeIndex(table, indexName, { transaction });
        }
      };

      await dropIndexIfExists('gigs', 'gigs_pipeline_stage_idx');
      await dropIndexIfExists('gigs', 'gigs_status_idx');
      await dropIndexIfExists('gigs', 'gigs_freelancer_idx');

      await dropIndexIfExists('gig_catalog_items', 'gig_catalog_items_freelancer_status_idx');
      await queryInterface.dropTable('gig_catalog_items', { transaction });

      await dropIndexIfExists('gig_upsells', 'gig_upsells_freelancer_status_idx');
      await queryInterface.dropTable('gig_upsells', { transaction });

      await dropIndexIfExists('gig_bundle_items', 'gig_bundle_items_bundle_order_idx');
      await queryInterface.dropTable('gig_bundle_items', { transaction });

      await dropIndexIfExists('gig_bundles', 'gig_bundles_freelancer_status_idx');
      await queryInterface.dropTable('gig_bundles', { transaction });

      await dropIndexIfExists('gig_milestones', 'gig_milestones_gig_sequence_idx');
      await queryInterface.dropTable('gig_milestones', { transaction });

      const gigDefinition = await queryInterface.describeTable('gigs', { transaction });
      const removeGigColumnIfExists = async (columnName) => {
        if (Object.prototype.hasOwnProperty.call(gigDefinition, columnName)) {
          await queryInterface.removeColumn('gigs', columnName, { transaction });
        }
      };

      await removeGigColumnIfExists('csatResponseCount');
      await removeGigColumnIfExists('csatPreviousScore');
      await removeGigColumnIfExists('csatScore');
      await removeGigColumnIfExists('clientName');
      await removeGigColumnIfExists('expectedDeliveryDate');
      await removeGigColumnIfExists('upsellEligibleValueCents');
      await removeGigColumnIfExists('currency');
      await removeGigColumnIfExists('previousPipelineValueCents');
      await removeGigColumnIfExists('contractValueCents');
      await removeGigColumnIfExists('pipelineStage');
      await removeGigColumnIfExists('status');
      await removeGigColumnIfExists('freelancerId');

      const dialect = queryInterface.sequelize.getDialect();
      if (['postgres', 'postgresql'].includes(dialect)) {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_gigs_status";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_gigs_pipelineStage";', { transaction });
      }
    });
  },
};
