'use strict';

const SPOTLIGHT_TABLE = 'community_spotlights';
const HIGHLIGHTS_TABLE = 'community_spotlight_highlights';
const ASSETS_TABLE = 'community_spotlight_assets';
const NEWSLETTER_TABLE = 'community_spotlight_newsletter_features';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        SPOTLIGHT_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          profileId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'profiles', key: 'id' },
            onDelete: 'CASCADE',
          },
          status: {
            type: Sequelize.ENUM('draft', 'scheduled', 'published', 'archived'),
            allowNull: false,
            defaultValue: 'draft',
          },
          heroTitle: { type: Sequelize.STRING(255), allowNull: false },
          tagline: { type: Sequelize.STRING(255), allowNull: true },
          summary: { type: Sequelize.TEXT, allowNull: true },
          campaignName: { type: Sequelize.STRING(255), allowNull: true },
          bannerImageUrl: { type: Sequelize.STRING(512), allowNull: true },
          brandColor: { type: Sequelize.STRING(64), allowNull: true },
          primaryCtaLabel: { type: Sequelize.STRING(120), allowNull: true },
          primaryCtaUrl: { type: Sequelize.STRING(512), allowNull: true },
          secondaryCtaLabel: { type: Sequelize.STRING(120), allowNull: true },
          secondaryCtaUrl: { type: Sequelize.STRING(512), allowNull: true },
          shareKitUrl: { type: Sequelize.STRING(512), allowNull: true },
          metricsSnapshot: { type: jsonType, allowNull: true },
          newsletterFeatureEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          newsletterAutomationConfig: { type: jsonType, allowNull: true },
          publishedAt: { type: Sequelize.DATE, allowNull: true },
          featuredUntil: { type: Sequelize.DATE, allowNull: true },
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
        SPOTLIGHT_TABLE,
        ['profileId', 'status'],
        {
          transaction,
          name: 'community_spotlights_profile_status_idx',
        },
      );

      await queryInterface.createTable(
        HIGHLIGHTS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          spotlightId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: SPOTLIGHT_TABLE, key: 'id' },
            onDelete: 'CASCADE',
          },
          category: {
            type: Sequelize.ENUM('speaking', 'open_source', 'contribution', 'press', 'mentorship', 'award'),
            allowNull: false,
            defaultValue: 'contribution',
          },
          title: { type: Sequelize.STRING(255), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          impactStatement: { type: Sequelize.TEXT, allowNull: true },
          occurredOn: { type: Sequelize.DATE, allowNull: true },
          ctaLabel: { type: Sequelize.STRING(120), allowNull: true },
          ctaUrl: { type: Sequelize.STRING(512), allowNull: true },
          mediaUrl: { type: Sequelize.STRING(512), allowNull: true },
          ordinal: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
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
        HIGHLIGHTS_TABLE,
        ['spotlightId', 'ordinal'],
        {
          transaction,
          name: 'community_spotlight_highlights_order_idx',
        },
      );

      await queryInterface.createTable(
        ASSETS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          spotlightId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: SPOTLIGHT_TABLE, key: 'id' },
            onDelete: 'CASCADE',
          },
          assetType: {
            type: Sequelize.ENUM('social', 'newsletter', 'press', 'video', 'website', 'other'),
            allowNull: false,
            defaultValue: 'social',
          },
          channel: { type: Sequelize.STRING(120), allowNull: true },
          name: { type: Sequelize.STRING(255), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          format: { type: Sequelize.STRING(80), allowNull: true },
          aspectRatio: { type: Sequelize.STRING(40), allowNull: true },
          downloadUrl: { type: Sequelize.STRING(512), allowNull: true },
          previewUrl: { type: Sequelize.STRING(512), allowNull: true },
          readyForUse: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
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
        ASSETS_TABLE,
        ['spotlightId', 'assetType'],
        {
          transaction,
          name: 'community_spotlight_assets_type_idx',
        },
      );

      await queryInterface.createTable(
        NEWSLETTER_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          spotlightId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: SPOTLIGHT_TABLE, key: 'id' },
            onDelete: 'CASCADE',
          },
          status: {
            type: Sequelize.ENUM('draft', 'scheduled', 'sent'),
            allowNull: false,
            defaultValue: 'draft',
          },
          editionDate: { type: Sequelize.DATE, allowNull: true },
          editionName: { type: Sequelize.STRING(255), allowNull: true },
          subjectLine: { type: Sequelize.STRING(255), allowNull: true },
          heroTitle: { type: Sequelize.STRING(255), allowNull: true },
          heroSubtitle: { type: Sequelize.STRING(255), allowNull: true },
          audienceSegment: { type: Sequelize.STRING(255), allowNull: true },
          performanceMetrics: { type: jsonType, allowNull: true },
          utmParameters: { type: jsonType, allowNull: true },
          shareUrl: { type: Sequelize.STRING(512), allowNull: true },
          callToActionLabel: { type: Sequelize.STRING(120), allowNull: true },
          callToActionUrl: { type: Sequelize.STRING(512), allowNull: true },
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
        NEWSLETTER_TABLE,
        ['spotlightId', 'status', 'editionDate'],
        {
          transaction,
          name: 'community_spotlight_newsletter_schedule_idx',
        },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(NEWSLETTER_TABLE, 'community_spotlight_newsletter_schedule_idx', { transaction }).catch(
        () => {},
      );
      await queryInterface.removeIndex(ASSETS_TABLE, 'community_spotlight_assets_type_idx', { transaction }).catch(() => {});
      await queryInterface.removeIndex(HIGHLIGHTS_TABLE, 'community_spotlight_highlights_order_idx', { transaction }).catch(() 
=> {});
      await queryInterface.removeIndex(SPOTLIGHT_TABLE, 'community_spotlights_profile_status_idx', { transaction }).catch(() =
> {});

      await queryInterface.dropTable(NEWSLETTER_TABLE, { transaction });
      await queryInterface.dropTable(ASSETS_TABLE, { transaction });
      await queryInterface.dropTable(HIGHLIGHTS_TABLE, { transaction });
      await queryInterface.dropTable(SPOTLIGHT_TABLE, { transaction });

      const dropEnum = async (enumName) => {
        const dialect = queryInterface.sequelize.getDialect();
        if (dialect === 'postgres' || dialect === 'postgresql') {
          await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`, { transaction });
        }
      };

      await dropEnum('enum_community_spotlights_status');
      await dropEnum('enum_community_spotlight_highlights_category');
      await dropEnum('enum_community_spotlight_assets_assetType');
      await dropEnum('enum_community_spotlight_newsletter_features_status');
    });
  },
};
