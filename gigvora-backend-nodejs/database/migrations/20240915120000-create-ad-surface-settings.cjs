'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('ad_surface_settings', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      surface: { type: Sequelize.STRING(80), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(120), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      heroImageUrl: { type: Sequelize.STRING(1024), allowNull: true },
      layoutMode: {
        type: Sequelize.ENUM('inline', 'hero', 'carousel', 'grid'),
        allowNull: false,
        defaultValue: 'inline',
      },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      supportsCoupons: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      placementLimit: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 3 },
      defaultPosition: {
        type: Sequelize.ENUM('hero', 'sidebar', 'inline', 'footer'),
        allowNull: false,
        defaultValue: 'inline',
      },
      metadata: { type: jsonType, allowNull: true },
      createdById: { type: Sequelize.INTEGER, allowNull: true },
      updatedById: { type: Sequelize.INTEGER, allowNull: true },
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

    await queryInterface.addConstraint('ad_surface_settings', {
      fields: ['surface'],
      type: 'unique',
      name: 'ad_surface_settings_surface_unique',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ad_surface_settings');

    const dialect = queryInterface.sequelize.getDialect();
    if (['postgres', 'postgresql'].includes(dialect)) {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ad_surface_settings_layoutMode";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ad_surface_settings_defaultPosition";');
    }
  },
};
