'use strict';

const THEME_STATUSES = ['draft', 'active', 'archived'];
const ASSET_TYPES = ['logo_light', 'logo_dark', 'favicon', 'hero', 'illustration', 'background', 'icon', 'pattern', 'other'];
const ASSET_STATUSES = ['active', 'inactive', 'archived'];
const LAYOUT_STATUSES = ['draft', 'published', 'archived'];
const LAYOUT_PAGES = ['marketing', 'dashboard', 'auth', 'admin', 'support'];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      await queryInterface.createTable(
        'appearance_themes',
        {
          id: { type: Sequelize.UUID, primaryKey: true, allowNull: false, defaultValue: Sequelize.UUIDV4 },
          slug: { type: Sequelize.STRING(120), allowNull: false, unique: true },
          name: { type: Sequelize.STRING(120), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          status: { type: Sequelize.ENUM(...THEME_STATUSES), allowNull: false, defaultValue: 'draft' },
          isDefault: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          tokens: { type: jsonType, allowNull: false, defaultValue: {} },
          accessibility: { type: jsonType, allowNull: false, defaultValue: {} },
          createdBy: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          updatedBy: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'appearance_assets',
        {
          id: { type: Sequelize.UUID, primaryKey: true, allowNull: false, defaultValue: Sequelize.UUIDV4 },
          themeId: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: 'appearance_themes', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          type: { type: Sequelize.ENUM(...ASSET_TYPES), allowNull: false, defaultValue: 'other' },
          label: { type: Sequelize.STRING(120), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          url: { type: Sequelize.STRING(2048), allowNull: false },
          altText: { type: Sequelize.STRING(255), allowNull: true },
          metadata: { type: jsonType, allowNull: false, defaultValue: {} },
          allowedRoles: { type: jsonType, allowNull: false, defaultValue: [] },
          status: { type: Sequelize.ENUM(...ASSET_STATUSES), allowNull: false, defaultValue: 'active' },
          isPrimary: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          sortOrder: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          createdBy: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          updatedBy: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'appearance_layouts',
        {
          id: { type: Sequelize.UUID, primaryKey: true, allowNull: false, defaultValue: Sequelize.UUIDV4 },
          themeId: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: 'appearance_themes', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          name: { type: Sequelize.STRING(160), allowNull: false },
          slug: { type: Sequelize.STRING(160), allowNull: false },
          page: { type: Sequelize.ENUM(...LAYOUT_PAGES), allowNull: false, defaultValue: 'marketing' },
          status: { type: Sequelize.ENUM(...LAYOUT_STATUSES), allowNull: false, defaultValue: 'draft' },
          version: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
          config: { type: jsonType, allowNull: false, defaultValue: {} },
          allowedRoles: { type: jsonType, allowNull: false, defaultValue: [] },
          metadata: { type: jsonType, allowNull: false, defaultValue: {} },
          releaseNotes: { type: Sequelize.TEXT, allowNull: true },
          publishedAt: { type: Sequelize.DATE, allowNull: true },
          createdBy: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          updatedBy: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('appearance_themes', ['status'], { transaction });
      await queryInterface.addIndex('appearance_themes', ['isDefault'], { transaction });
      await queryInterface.addIndex('appearance_assets', ['themeId'], { transaction });
      await queryInterface.addIndex('appearance_assets', ['type'], { transaction });
      await queryInterface.addIndex('appearance_assets', ['status'], { transaction });
      await queryInterface.addIndex('appearance_layouts', ['themeId'], { transaction });
      await queryInterface.addIndex('appearance_layouts', ['page'], { transaction });
      await queryInterface.addIndex('appearance_layouts', ['status'], { transaction });
      await queryInterface.addConstraint('appearance_layouts', {
        fields: ['page', 'slug'],
        type: 'unique',
        name: 'appearance_layouts_page_slug_unique',
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint('appearance_layouts', 'appearance_layouts_page_slug_unique', { transaction }).catch(
        () => {},
      );
      await queryInterface.dropTable('appearance_layouts', { transaction });
      await queryInterface.dropTable('appearance_assets', { transaction });
      await queryInterface.dropTable('appearance_themes', { transaction });

      const dialect = queryInterface.sequelize.getDialect();
      if (dialect === 'postgres' || dialect === 'postgresql') {
        await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_appearance_themes_status\"", { transaction });
        await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_appearance_assets_type\"", { transaction });
        await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_appearance_assets_status\"", { transaction });
        await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_appearance_layouts_page\"", { transaction });
        await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_appearance_layouts_status\"", { transaction });
      }
    });
  },
};
