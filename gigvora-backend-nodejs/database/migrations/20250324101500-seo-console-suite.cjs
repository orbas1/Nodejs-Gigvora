'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'seo_page_overrides',
        'focusKeyword',
        {
          type: Sequelize.STRING(120),
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'seo_page_overrides',
        'robots',
        {
          type: Sequelize.STRING(160),
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'seo_schema_templates',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          slug: { type: Sequelize.STRING(120), allowNull: false, unique: true },
          label: { type: Sequelize.STRING(180), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          schemaType: { type: Sequelize.STRING(120), allowNull: false },
          jsonTemplate: { type: jsonType, allowNull: false, defaultValue: {} },
          sampleData: { type: jsonType, allowNull: true },
          recommendedFields: { type: jsonType, allowNull: true },
          richResultPreview: { type: jsonType, allowNull: true },
          documentationUrl: { type: Sequelize.STRING(2048), allowNull: true },
          isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          lastReviewedAt: { type: Sequelize.DATE, allowNull: true },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'seo_schema_templates',
        ['slug'],
        { unique: true, name: 'seo_schema_templates_slug_unique', transaction },
      );

      await queryInterface.createTable(
        'seo_meta_templates',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          slug: { type: Sequelize.STRING(120), allowNull: false, unique: true },
          label: { type: Sequelize.STRING(180), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          persona: { type: Sequelize.STRING(80), allowNull: true },
          fields: { type: jsonType, allowNull: false, defaultValue: {} },
          recommendedUseCases: { type: jsonType, allowNull: true },
          isDefault: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'seo_meta_templates',
        ['slug'],
        { unique: true, name: 'seo_meta_templates_slug_unique', transaction },
      );

      await queryInterface.createTable(
        'seo_sitemap_jobs',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          seoSettingId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'seo_settings', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          baseUrl: { type: Sequelize.STRING(2048), allowNull: false },
          includeImages: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          includeLastModified: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          totalUrls: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          indexedUrls: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          warnings: { type: jsonType, allowNull: true },
          xml: { type: Sequelize.TEXT('long'), allowNull: false },
          status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'generated' },
          message: { type: Sequelize.TEXT, allowNull: true },
          triggeredBy: { type: jsonType, allowNull: true },
          generatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          submittedAt: { allowNull: true, type: Sequelize.DATE },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'seo_sitemap_jobs',
        ['seoSettingId', 'generatedAt'],
        { name: 'seo_sitemap_jobs_setting_generated_idx', transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('seo_sitemap_jobs', 'seo_sitemap_jobs_setting_generated_idx', { transaction }).catch(() => {});
      await queryInterface.dropTable('seo_sitemap_jobs', { transaction }).catch(() => {});
      await queryInterface.removeIndex('seo_meta_templates', 'seo_meta_templates_slug_unique', { transaction }).catch(() => {});
      await queryInterface.dropTable('seo_meta_templates', { transaction }).catch(() => {});
      await queryInterface.removeIndex('seo_schema_templates', 'seo_schema_templates_slug_unique', { transaction }).catch(() => {});
      await queryInterface.dropTable('seo_schema_templates', { transaction }).catch(() => {});
      await queryInterface.removeColumn('seo_page_overrides', 'robots', { transaction }).catch(() => {});
      await queryInterface.removeColumn('seo_page_overrides', 'focusKeyword', { transaction }).catch(() => {});
    });
  },
};
