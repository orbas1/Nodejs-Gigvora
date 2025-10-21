'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = Sequelize.JSONB ?? Sequelize.JSON;

      await queryInterface.createTable(
        'freelancer_portfolio_items',
        {
          id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
          },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          profileId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'profiles', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          slug: {
            type: Sequelize.STRING(160),
            allowNull: false,
            unique: true,
          },
          title: {
            type: Sequelize.STRING(180),
            allowNull: false,
          },
          tagline: {
            type: Sequelize.STRING(240),
            allowNull: true,
          },
          clientName: {
            type: Sequelize.STRING(180),
            allowNull: true,
          },
          clientIndustry: {
            type: Sequelize.STRING(180),
            allowNull: true,
          },
          role: {
            type: Sequelize.STRING(180),
            allowNull: true,
          },
          summary: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          problemStatement: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          approachSummary: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          outcomeSummary: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          impactMetrics: {
            type: jsonType,
            allowNull: true,
          },
          tags: {
            type: jsonType,
            allowNull: true,
          },
          industries: {
            type: jsonType,
            allowNull: true,
          },
          services: {
            type: jsonType,
            allowNull: true,
          },
          technologies: {
            type: jsonType,
            allowNull: true,
          },
          heroImageUrl: {
            type: Sequelize.STRING(1024),
            allowNull: true,
          },
          heroVideoUrl: {
            type: Sequelize.STRING(1024),
            allowNull: true,
          },
          callToActionLabel: {
            type: Sequelize.STRING(160),
            allowNull: true,
          },
          callToActionUrl: {
            type: Sequelize.STRING(1024),
            allowNull: true,
          },
          repositoryUrl: {
            type: Sequelize.STRING(1024),
            allowNull: true,
          },
          liveUrl: {
            type: Sequelize.STRING(1024),
            allowNull: true,
          },
          visibility: {
            type: Sequelize.ENUM('private', 'network', 'public'),
            allowNull: false,
            defaultValue: 'public',
          },
          status: {
            type: Sequelize.ENUM('draft', 'published', 'archived'),
            allowNull: false,
            defaultValue: 'draft',
          },
          isFeatured: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          featuredOrder: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          startDate: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          endDate: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          publishedAt: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          archivedAt: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          lastSharedAt: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          lastReviewedAt: {
            type: Sequelize.DATE,
            allowNull: true,
          },
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

      await queryInterface.addIndex('freelancer_portfolio_items', ['userId'], { transaction });
      await queryInterface.addIndex('freelancer_portfolio_items', ['status'], { transaction });
      await queryInterface.addIndex('freelancer_portfolio_items', ['visibility'], { transaction });
      await queryInterface.addIndex('freelancer_portfolio_items', ['isFeatured'], { transaction });

      await queryInterface.createTable(
        'freelancer_portfolio_assets',
        {
          id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
          },
          portfolioItemId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'freelancer_portfolio_items', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          label: {
            type: Sequelize.STRING(180),
            allowNull: false,
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          url: {
            type: Sequelize.STRING(1024),
            allowNull: false,
          },
          thumbnailUrl: {
            type: Sequelize.STRING(1024),
            allowNull: true,
          },
          assetType: {
            type: Sequelize.ENUM('image', 'video', 'document', 'link', 'embed'),
            allowNull: false,
            defaultValue: 'image',
          },
          sortOrder: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          isPrimary: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          metadata: {
            type: jsonType,
            allowNull: true,
          },
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

      await queryInterface.addIndex('freelancer_portfolio_assets', ['portfolioItemId'], { transaction });
      await queryInterface.addIndex('freelancer_portfolio_assets', ['assetType'], { transaction });

      await queryInterface.createTable(
        'freelancer_portfolio_settings',
        {
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          profileId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'profiles', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          heroHeadline: {
            type: Sequelize.STRING(180),
            allowNull: true,
          },
          heroSubheadline: {
            type: Sequelize.STRING(255),
            allowNull: true,
          },
          coverImageUrl: {
            type: Sequelize.STRING(1024),
            allowNull: true,
          },
          coverVideoUrl: {
            type: Sequelize.STRING(1024),
            allowNull: true,
          },
          brandAccentColor: {
            type: Sequelize.STRING(32),
            allowNull: true,
          },
          defaultVisibility: {
            type: Sequelize.ENUM('private', 'network', 'public'),
            allowNull: false,
            defaultValue: 'public',
          },
          allowPublicDownload: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          autoShareToFeed: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
          },
          showMetrics: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
          },
          showTestimonials: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
          },
          showContactButton: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
          },
          contactEmail: {
            type: Sequelize.STRING(255),
            allowNull: true,
          },
          schedulingLink: {
            type: Sequelize.STRING(1024),
            allowNull: true,
          },
          customDomain: {
            type: Sequelize.STRING(255),
            allowNull: true,
          },
          previewBasePath: {
            type: Sequelize.STRING(255),
            allowNull: true,
          },
          lastPublishedAt: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          lastSyncedAt: {
            type: Sequelize.DATE,
            allowNull: true,
          },
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

      await queryInterface.addIndex('freelancer_portfolio_settings', ['defaultVisibility'], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('freelancer_portfolio_assets', { transaction });
      await queryInterface.dropTable('freelancer_portfolio_items', { transaction });
      await queryInterface.dropTable('freelancer_portfolio_settings', { transaction });

      const dialect = queryInterface.sequelize.getDialect();
      if (dialect === 'postgres' || dialect === 'postgresql') {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_freelancer_portfolio_items_visibility";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_freelancer_portfolio_items_status";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_freelancer_portfolio_assets_assetType";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_freelancer_portfolio_settings_defaultVisibility";', {
          transaction,
        });
      }
    });
  },
};
