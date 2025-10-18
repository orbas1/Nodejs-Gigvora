'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('database_connection_profiles', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(120), allowNull: false },
      slug: { type: Sequelize.STRING(160), allowNull: false, unique: true },
      environment: { type: Sequelize.STRING(60), allowNull: false },
      role: { type: Sequelize.STRING(60), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      dialect: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'postgres' },
      host: { type: Sequelize.STRING(255), allowNull: false },
      port: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 5432 },
      databaseName: { type: Sequelize.STRING(255), allowNull: false },
      username: { type: Sequelize.STRING(255), allowNull: false },
      passwordCiphertext: { type: Sequelize.TEXT, allowNull: true },
      sslMode: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'require' },
      options: { type: jsonType, allowNull: false, defaultValue: {} },
      allowedRoles: { type: jsonType, allowNull: false, defaultValue: [] },
      isPrimary: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      readOnly: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'unknown' },
      lastTestedAt: { type: Sequelize.DATE, allowNull: true },
      lastTestedBy: { type: Sequelize.STRING(120), allowNull: true },
      lastTestError: { type: Sequelize.TEXT, allowNull: true },
      lastRotatedAt: { type: Sequelize.DATE, allowNull: true },
      lastRotatedBy: { type: Sequelize.STRING(120), allowNull: true },
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

    await queryInterface.addIndex('database_connection_profiles', ['environment', 'role']);
    await queryInterface.addIndex('database_connection_profiles', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('database_connection_profiles');
  },
};
