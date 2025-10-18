'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('seo_settings', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      key: { type: Sequelize.STRING(120), allowNull: false, unique: true },
      siteName: { type: Sequelize.STRING(180), allowNull: false, defaultValue: 'Gigvora' },
      defaultTitle: { type: Sequelize.STRING(180), allowNull: false, defaultValue: 'Gigvora' },
      defaultDescription: { type: Sequelize.TEXT('long'), allowNull: false, defaultValue: '' },
      defaultKeywords: { type: jsonType, allowNull: false, defaultValue: [] },
      canonicalBaseUrl: { type: Sequelize.STRING(2048), allowNull: true },
      sitemapUrl: { type: Sequelize.STRING(2048), allowNull: true },
      allowIndexing: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      robotsPolicy: { type: Sequelize.TEXT('long'), allowNull: true },
      noindexPaths: { type: jsonType, allowNull: false, defaultValue: [] },
      verificationCodes: { type: jsonType, allowNull: false, defaultValue: {} },
      socialDefaults: { type: jsonType, allowNull: false, defaultValue: {} },
      structuredData: { type: jsonType, allowNull: false, defaultValue: {} },
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
    });

    await queryInterface.createTable('seo_page_overrides', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      seoSettingId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'seo_settings', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      path: { type: Sequelize.STRING(255), allowNull: false },
      title: { type: Sequelize.STRING(180), allowNull: true },
      description: { type: Sequelize.TEXT('long'), allowNull: true },
      keywords: { type: jsonType, allowNull: false, defaultValue: [] },
      canonicalUrl: { type: Sequelize.STRING(2048), allowNull: true },
      social: { type: jsonType, allowNull: false, defaultValue: {} },
      twitter: { type: jsonType, allowNull: false, defaultValue: {} },
      structuredData: { type: jsonType, allowNull: false, defaultValue: {} },
      metaTags: { type: jsonType, allowNull: false, defaultValue: [] },
      noindex: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
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
    });

    await queryInterface.addIndex('seo_settings', ['key'], {
      unique: true,
      name: 'seo_settings_key_unique',
    });

    await queryInterface.addIndex('seo_page_overrides', ['seoSettingId', 'path'], {
      unique: true,
      name: 'seo_page_overrides_setting_path_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('seo_page_overrides', 'seo_page_overrides_setting_path_unique').catch(() => {});
    await queryInterface.dropTable('seo_page_overrides');
    await queryInterface.removeIndex('seo_settings', 'seo_settings_key_unique').catch(() => {});
    await queryInterface.dropTable('seo_settings');
  },
};
