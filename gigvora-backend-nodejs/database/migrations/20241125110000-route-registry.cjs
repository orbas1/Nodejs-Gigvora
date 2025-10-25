'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('route_registry_entries', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      routeId: { type: Sequelize.STRING(180), allowNull: false, unique: true },
      collection: { type: Sequelize.STRING(80), allowNull: false },
      path: { type: Sequelize.STRING(255), allowNull: false },
      absolutePath: { type: Sequelize.STRING(255), allowNull: false },
      modulePath: { type: Sequelize.STRING(255), allowNull: true },
      title: { type: Sequelize.STRING(160), allowNull: false },
      icon: { type: Sequelize.STRING(120), allowNull: true },
      persona: { type: Sequelize.STRING(60), allowNull: true },
      featureFlag: { type: Sequelize.STRING(120), allowNull: true },
      shellTheme: { type: Sequelize.STRING(60), allowNull: true },
      allowedRoles: { type: jsonType, allowNull: true, defaultValue: [] },
      allowedMemberships: { type: jsonType, allowNull: true, defaultValue: [] },
      metadata: { type: jsonType, allowNull: true },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      deprecatedAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex('route_registry_entries', ['collection', 'isActive']);
    await queryInterface.addIndex('route_registry_entries', ['absolutePath']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('route_registry_entries');
  },
};
