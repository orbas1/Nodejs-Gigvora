'use strict';

function getJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

const GIG_STATUSES = ['draft', 'preview', 'published', 'archived'];
const MEDIA_TYPES = ['image', 'video', 'document'];
const DEVICE_TYPES = ['desktop', 'tablet', 'mobile'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const jsonType = getJsonType(queryInterface, Sequelize);

    try {
      await queryInterface.addColumn(
        'gigs',
        'ownerId',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'SET NULL',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'gigs',
        'slug',
        {
          type: Sequelize.STRING(180),
          allowNull: true,
          unique: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'gigs',
        'summary',
        { type: Sequelize.TEXT, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'gigs',
        'status',
        {
          type: Sequelize.ENUM(...GIG_STATUSES),
          allowNull: false,
          defaultValue: 'draft',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'gigs',
        'heroTitle',
        { type: Sequelize.STRING(255), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'gigs',
        'heroSubtitle',
        { type: Sequelize.STRING(500), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'gigs',
        'heroMediaUrl',
        { type: Sequelize.STRING(500), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'gigs',
        'heroTheme',
        { type: Sequelize.STRING(120), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'gigs',
        'heroBadge',
        { type: Sequelize.STRING(120), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'gigs',
        'sellingPoints',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'gigs',
        'requirements',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'gigs',
        'faqs',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'gigs',
        'conversionCopy',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'gigs',
        'analyticsSettings',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.createTable(
        'gig_packages',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          gigId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'gigs', key: 'id' },
            onDelete: 'CASCADE',
          },
          tierName: { type: Sequelize.STRING(120), allowNull: false },
          tagline: { type: Sequelize.STRING(255), allowNull: true },
          description: { type: Sequelize.TEXT, allowNull: true },
          priceAmount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
          priceCurrency: { type: Sequelize.STRING(6), allowNull: false, defaultValue: 'USD' },
          deliveryDays: { type: Sequelize.INTEGER, allowNull: true },
          revisionCount: { type: Sequelize.INTEGER, allowNull: true },
          features: { type: jsonType, allowNull: true },
          isBestValue: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
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
        'gig_addons',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          gigId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'gigs', key: 'id' },
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(160), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          priceAmount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
          priceCurrency: { type: Sequelize.STRING(6), allowNull: false, defaultValue: 'USD' },
          deliveryDays: { type: Sequelize.INTEGER, allowNull: true },
          isPopular: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
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
        'gig_media_assets',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          gigId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'gigs', key: 'id' },
            onDelete: 'CASCADE',
          },
          assetType: { type: Sequelize.ENUM(...MEDIA_TYPES), allowNull: false, defaultValue: 'image' },
          url: { type: Sequelize.STRING(500), allowNull: false },
          thumbnailUrl: { type: Sequelize.STRING(500), allowNull: true },
          caption: { type: Sequelize.STRING(255), allowNull: true },
          displayOrder: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          processingStatus: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'ready' },
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
        'gig_call_to_actions',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          gigId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'gigs', key: 'id' },
            onDelete: 'CASCADE',
          },
          headline: { type: Sequelize.STRING(255), allowNull: false },
          subheadline: { type: Sequelize.STRING(500), allowNull: true },
          buttonLabel: { type: Sequelize.STRING(120), allowNull: false },
          buttonUrl: { type: Sequelize.STRING(500), allowNull: true },
          stylePreset: { type: Sequelize.STRING(80), allowNull: true },
          audienceSegment: { type: Sequelize.STRING(120), allowNull: true },
          badge: { type: Sequelize.STRING(80), allowNull: true },
          expectedLift: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
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
        'gig_preview_layouts',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          gigId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'gigs', key: 'id' },
            onDelete: 'CASCADE',
          },
          deviceType: { type: Sequelize.ENUM(...DEVICE_TYPES), allowNull: false },
          headline: { type: Sequelize.STRING(255), allowNull: true },
          supportingCopy: { type: Sequelize.STRING(500), allowNull: true },
          previewUrl: { type: Sequelize.STRING(500), allowNull: true },
          layoutSettings: { type: jsonType, allowNull: true },
          conversionRate: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
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
        'gig_performance_snapshots',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          gigId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'gigs', key: 'id' },
            onDelete: 'CASCADE',
          },
          snapshotDate: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          periodLabel: { type: Sequelize.STRING(120), allowNull: true },
          conversionRate: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          averageOrderValue: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
          completionRate: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          upsellTakeRate: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          reviewScore: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
          bookingsLast30Days: { type: Sequelize.INTEGER, allowNull: true },
          experimentNotes: { type: jsonType, allowNull: true },
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

      await queryInterface.addIndex('gigs', ['ownerId'], {
        transaction,
        name: 'gigs_owner_id_idx',
      });
      await queryInterface.addIndex('gigs', ['slug'], {
        transaction,
        unique: true,
        name: 'gigs_slug_unique',
      });
      await queryInterface.addIndex('gig_packages', ['gigId', 'tierName'], {
        transaction,
        name: 'gig_packages_gig_tier_idx',
      });
      await queryInterface.addIndex('gig_addons', ['gigId', 'name'], {
        transaction,
        name: 'gig_addons_gig_name_idx',
      });
      await queryInterface.addIndex('gig_media_assets', ['gigId', 'displayOrder'], {
        transaction,
        name: 'gig_media_display_idx',
      });
      await queryInterface.addIndex('gig_call_to_actions', ['gigId', 'audienceSegment'], {
        transaction,
        name: 'gig_cta_audience_idx',
      });
      await queryInterface.addIndex('gig_preview_layouts', ['gigId', 'deviceType'], {
        transaction,
        unique: true,
        name: 'gig_preview_device_unique',
      });
      await queryInterface.addIndex('gig_performance_snapshots', ['gigId', 'snapshotDate'], {
        transaction,
        name: 'gig_performance_snapshot_idx',
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeIndex('gig_performance_snapshots', 'gig_performance_snapshot_idx', { transaction });
      await queryInterface.removeIndex('gig_preview_layouts', 'gig_preview_device_unique', { transaction });
      await queryInterface.removeIndex('gig_call_to_actions', 'gig_cta_audience_idx', { transaction });
      await queryInterface.removeIndex('gig_media_assets', 'gig_media_display_idx', { transaction });
      await queryInterface.removeIndex('gig_addons', 'gig_addons_gig_name_idx', { transaction });
      await queryInterface.removeIndex('gig_packages', 'gig_packages_gig_tier_idx', { transaction });
      await queryInterface.removeIndex('gigs', 'gigs_slug_unique', { transaction });
      await queryInterface.removeIndex('gigs', 'gigs_owner_id_idx', { transaction });

      await queryInterface.dropTable('gig_performance_snapshots', { transaction });
      await queryInterface.dropTable('gig_preview_layouts', { transaction });
      await queryInterface.dropTable('gig_call_to_actions', { transaction });
      await queryInterface.dropTable('gig_media_assets', { transaction });
      await queryInterface.dropTable('gig_addons', { transaction });
      await queryInterface.dropTable('gig_packages', { transaction });

      await queryInterface.removeColumn('gigs', 'analyticsSettings', { transaction });
      await queryInterface.removeColumn('gigs', 'conversionCopy', { transaction });
      await queryInterface.removeColumn('gigs', 'faqs', { transaction });
      await queryInterface.removeColumn('gigs', 'requirements', { transaction });
      await queryInterface.removeColumn('gigs', 'sellingPoints', { transaction });
      await queryInterface.removeColumn('gigs', 'heroBadge', { transaction });
      await queryInterface.removeColumn('gigs', 'heroTheme', { transaction });
      await queryInterface.removeColumn('gigs', 'heroMediaUrl', { transaction });
      await queryInterface.removeColumn('gigs', 'heroSubtitle', { transaction });
      await queryInterface.removeColumn('gigs', 'heroTitle', { transaction });
      await queryInterface.removeColumn('gigs', 'status', { transaction });
      await queryInterface.removeColumn('gigs', 'summary', { transaction });
      await queryInterface.removeColumn('gigs', 'slug', { transaction });
      await queryInterface.removeColumn('gigs', 'ownerId', { transaction });

      const dialect = queryInterface.sequelize.getDialect();
      if (['postgres', 'postgresql'].includes(dialect)) {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_gig_media_assets_assetType";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_gig_preview_layouts_deviceType";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_gigs_status";', { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
