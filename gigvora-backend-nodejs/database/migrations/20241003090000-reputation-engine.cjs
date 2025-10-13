'use strict';

const TESTIMONIALS_TABLE = 'reputation_testimonials';
const SUCCESS_STORIES_TABLE = 'reputation_success_stories';
const METRICS_TABLE = 'reputation_metrics';
const BADGES_TABLE = 'reputation_badges';
const WIDGETS_TABLE = 'reputation_review_widgets';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        TESTIMONIALS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          clientName: { type: Sequelize.STRING(255), allowNull: false },
          clientRole: { type: Sequelize.STRING(255), allowNull: true },
          company: { type: Sequelize.STRING(255), allowNull: true },
          projectName: { type: Sequelize.STRING(255), allowNull: true },
          rating: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
          comment: { type: Sequelize.TEXT, allowNull: false },
          capturedAt: { type: Sequelize.DATE, allowNull: true },
          deliveredAt: { type: Sequelize.DATE, allowNull: true },
          source: {
            type: Sequelize.ENUM('portal', 'manual', 'import', 'video', 'audio'),
            allowNull: false,
            defaultValue: 'portal',
          },
          status: {
            type: Sequelize.ENUM('pending', 'approved', 'rejected', 'archived'),
            allowNull: false,
            defaultValue: 'pending',
          },
          isFeatured: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          shareUrl: { type: Sequelize.STRING(500), allowNull: true },
          media: { type: jsonType, allowNull: true },
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

      await queryInterface.addIndex(TESTIMONIALS_TABLE, ['freelancerId', 'status'], { transaction });
      await queryInterface.addIndex(TESTIMONIALS_TABLE, ['freelancerId', 'isFeatured'], { transaction });

      await queryInterface.createTable(
        SUCCESS_STORIES_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(255), allowNull: false },
          slug: { type: Sequelize.STRING(255), allowNull: false },
          summary: { type: Sequelize.TEXT, allowNull: false },
          content: { type: Sequelize.TEXT, allowNull: true },
          heroImageUrl: { type: Sequelize.STRING(500), allowNull: true },
          status: {
            type: Sequelize.ENUM('draft', 'in_review', 'published', 'archived'),
            allowNull: false,
            defaultValue: 'draft',
          },
          publishedAt: { type: Sequelize.DATE, allowNull: true },
          featured: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          impactMetrics: { type: jsonType, allowNull: true },
          ctaUrl: { type: Sequelize.STRING(500), allowNull: true },
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

      await queryInterface.addIndex(SUCCESS_STORIES_TABLE, ['freelancerId', 'status'], { transaction });
      await queryInterface.addConstraint(SUCCESS_STORIES_TABLE, {
        type: 'unique',
        fields: ['freelancerId', 'slug'],
        name: 'reputation_success_stories_unique_slug',
        transaction,
      });

      await queryInterface.createTable(
        METRICS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          metricType: { type: Sequelize.STRING(120), allowNull: false },
          label: { type: Sequelize.STRING(255), allowNull: false },
          value: { type: Sequelize.DECIMAL(12, 4), allowNull: false },
          unit: { type: Sequelize.STRING(60), allowNull: true },
          period: { type: Sequelize.STRING(120), allowNull: false, defaultValue: 'rolling_12_months' },
          source: { type: Sequelize.STRING(255), allowNull: true },
          trendDirection: {
            type: Sequelize.ENUM('up', 'down', 'flat'),
            allowNull: false,
            defaultValue: 'flat',
          },
          trendValue: { type: Sequelize.DECIMAL(10, 4), allowNull: true },
          verifiedBy: { type: Sequelize.STRING(255), allowNull: true },
          verifiedAt: { type: Sequelize.DATE, allowNull: true },
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

      await queryInterface.addConstraint(METRICS_TABLE, {
        type: 'unique',
        fields: ['freelancerId', 'metricType', 'period'],
        name: 'reputation_metrics_unique_metric_period',
        transaction,
      });

      await queryInterface.createTable(
        BADGES_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(255), allowNull: false },
          slug: { type: Sequelize.STRING(255), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          issuedBy: { type: Sequelize.STRING(255), allowNull: true },
          issuedAt: { type: Sequelize.DATE, allowNull: true },
          expiresAt: { type: Sequelize.DATE, allowNull: true },
          badgeType: { type: Sequelize.STRING(120), allowNull: true },
          level: { type: Sequelize.STRING(60), allowNull: true },
          assetUrl: { type: Sequelize.STRING(500), allowNull: true },
          isPromoted: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
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

      await queryInterface.addConstraint(BADGES_TABLE, {
        type: 'unique',
        fields: ['freelancerId', 'slug'],
        name: 'reputation_badges_unique_slug',
        transaction,
      });

      await queryInterface.addIndex(BADGES_TABLE, ['freelancerId', 'isPromoted'], { transaction });

      await queryInterface.createTable(
        WIDGETS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(255), allowNull: false },
          slug: { type: Sequelize.STRING(255), allowNull: false },
          widgetType: { type: Sequelize.STRING(120), allowNull: false },
          status: {
            type: Sequelize.ENUM('draft', 'active', 'paused'),
            allowNull: false,
            defaultValue: 'draft',
          },
          embedScript: { type: Sequelize.TEXT, allowNull: true },
          config: { type: jsonType, allowNull: true },
          impressions: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          ctaClicks: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          lastSyncedAt: { type: Sequelize.DATE, allowNull: true },
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

      await queryInterface.addConstraint(WIDGETS_TABLE, {
        type: 'unique',
        fields: ['freelancerId', 'slug'],
        name: 'reputation_review_widgets_unique_slug',
        transaction,
      });

      await queryInterface.addIndex(WIDGETS_TABLE, ['freelancerId', 'status'], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(WIDGETS_TABLE, ['freelancerId', 'status'], { transaction }).catch(() => {});
      await queryInterface.removeIndex(BADGES_TABLE, ['freelancerId', 'isPromoted'], { transaction }).catch(() => {});
      await queryInterface.removeIndex(SUCCESS_STORIES_TABLE, ['freelancerId', 'status'], { transaction }).catch(() => {});
      await queryInterface.removeIndex(TESTIMONIALS_TABLE, ['freelancerId', 'status'], { transaction }).catch(() => {});
      await queryInterface.removeIndex(TESTIMONIALS_TABLE, ['freelancerId', 'isFeatured'], { transaction }).catch(() => {});

      await queryInterface.dropTable(WIDGETS_TABLE, { transaction });
      await queryInterface.dropTable(BADGES_TABLE, { transaction });
      await queryInterface.dropTable(METRICS_TABLE, { transaction });
      await queryInterface.dropTable(SUCCESS_STORIES_TABLE, { transaction });
      await queryInterface.dropTable(TESTIMONIALS_TABLE, { transaction });

      const dropEnum = async (enumName) => {
        const dialect = queryInterface.sequelize.getDialect();
        if (dialect === 'postgres' || dialect === 'postgresql') {
          await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`, { transaction });
        }
      };

      await dropEnum('enum_reputation_testimonials_source');
      await dropEnum('enum_reputation_testimonials_status');
      await dropEnum('enum_reputation_success_stories_status');
      await dropEnum('enum_reputation_metrics_trendDirection');
      await dropEnum('enum_reputation_review_widgets_status');
    });
  },
};

