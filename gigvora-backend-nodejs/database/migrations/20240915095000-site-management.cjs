'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = Sequelize.JSONB ?? Sequelize.JSON;

      await queryInterface.createTable(
        'site_settings',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          key: {
            type: Sequelize.STRING(120),
            allowNull: false,
            unique: true,
          },
          value: {
            type: jsonType,
            allowNull: false,
            defaultValue: {},
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

      await queryInterface.createTable(
        'site_pages',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          slug: {
            type: Sequelize.STRING(160),
            allowNull: false,
            unique: true,
          },
          title: {
            type: Sequelize.STRING(200),
            allowNull: false,
          },
          summary: {
            type: Sequelize.STRING(500),
            allowNull: true,
          },
          heroTitle: {
            type: Sequelize.STRING(200),
            allowNull: true,
          },
          heroSubtitle: {
            type: Sequelize.STRING(400),
            allowNull: true,
          },
          heroImageUrl: {
            type: Sequelize.STRING(2048),
            allowNull: true,
          },
          heroImageAlt: {
            type: Sequelize.STRING(255),
            allowNull: true,
          },
          ctaLabel: {
            type: Sequelize.STRING(120),
            allowNull: true,
          },
          ctaUrl: {
            type: Sequelize.STRING(2048),
            allowNull: true,
          },
          layout: {
            type: Sequelize.STRING(80),
            allowNull: false,
            defaultValue: 'standard',
          },
          body: {
            type: Sequelize.TEXT('long'),
            allowNull: true,
          },
          featureHighlights: {
            type: jsonType,
            allowNull: true,
            defaultValue: [],
          },
          seoTitle: {
            type: Sequelize.STRING(200),
            allowNull: true,
          },
          seoDescription: {
            type: Sequelize.STRING(500),
            allowNull: true,
          },
          seoKeywords: {
            type: jsonType,
            allowNull: true,
            defaultValue: [],
          },
          thumbnailUrl: {
            type: Sequelize.STRING(2048),
            allowNull: true,
          },
          status: {
            type: Sequelize.ENUM('draft', 'review', 'published', 'archived'),
            allowNull: false,
            defaultValue: 'draft',
          },
          publishedAt: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          allowedRoles: {
            type: jsonType,
            allowNull: true,
            defaultValue: [],
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

      await queryInterface.addIndex('site_pages', ['status'], { transaction });

      await queryInterface.createTable(
        'site_navigation_links',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          menuKey: {
            type: Sequelize.STRING(80),
            allowNull: false,
            defaultValue: 'primary',
          },
          label: {
            type: Sequelize.STRING(160),
            allowNull: false,
          },
          url: {
            type: Sequelize.STRING(2048),
            allowNull: false,
          },
          description: {
            type: Sequelize.STRING(255),
            allowNull: true,
          },
          icon: {
            type: Sequelize.STRING(120),
            allowNull: true,
          },
          orderIndex: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          isExternal: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          openInNewTab: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          allowedRoles: {
            type: jsonType,
            allowNull: true,
            defaultValue: [],
          },
          parentId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'site_navigation_links', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
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

      await queryInterface.addIndex('site_navigation_links', ['menuKey', 'orderIndex'], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('site_navigation_links', ['menuKey', 'orderIndex'], { transaction }).catch(() => null);
      await queryInterface.dropTable('site_navigation_links', { transaction });
      await queryInterface.removeIndex('site_pages', ['status'], { transaction }).catch(() => null);
      await queryInterface.dropTable('site_pages', { transaction });
      await queryInterface.dropTable('site_settings', { transaction });
    });

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_site_pages_status";');
    }
  },
};
