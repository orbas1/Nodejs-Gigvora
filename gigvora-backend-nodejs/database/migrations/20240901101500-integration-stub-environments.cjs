'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('integration_stub_environments', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      slug: { type: Sequelize.STRING(160), allowNull: false, unique: true },
      service: { type: Sequelize.STRING(160), allowNull: false },
      baseUrl: { type: Sequelize.STRING(500), allowNull: false },
      metadataEndpoint: { type: Sequelize.STRING(500), allowNull: false },
      eventsEndpoint: { type: Sequelize.STRING(500), allowNull: true },
      fallbackOrigin: { type: Sequelize.STRING(500), allowNull: true },
      allowedOrigins: { type: jsonType, allowNull: false, defaultValue: [] },
      viewRoles: { type: jsonType, allowNull: false, defaultValue: [] },
      manageRoles: { type: jsonType, allowNull: false, defaultValue: [] },
      workspaceSlug: { type: Sequelize.STRING(160), allowNull: true },
      workspaceId: { type: Sequelize.INTEGER, allowNull: true },
      releaseChannel: { type: Sequelize.STRING(120), allowNull: true },
      region: { type: Sequelize.STRING(120), allowNull: true },
      buildNumber: { type: Sequelize.STRING(160), allowNull: true },
      ownerTeam: { type: Sequelize.STRING(160), allowNull: true },
      version: { type: Sequelize.STRING(120), allowNull: true },
      requiresApiKey: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      apiKeyPreview: { type: Sequelize.STRING(255), allowNull: true },
      lastStatus: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'unknown' },
      lastMessage: { type: Sequelize.TEXT, allowNull: true },
      lastError: { type: Sequelize.TEXT, allowNull: true },
      lastCheckedAt: { type: Sequelize.DATE, allowNull: true },
      lastMetadata: { type: jsonType, allowNull: true },
      lastTelemetry: { type: jsonType, allowNull: true },
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

    await queryInterface.addIndex('integration_stub_environments', ['slug'], {
      name: 'integration_stub_environments_slug_unique',
      unique: true,
    });

    await queryInterface.createTable('integration_stub_environment_checks', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      environmentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'integration_stub_environments', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      status: { type: Sequelize.STRING(60), allowNull: false },
      checkedAt: { type: Sequelize.DATE, allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: true },
      error: { type: Sequelize.TEXT, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      config: { type: jsonType, allowNull: true },
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

    await queryInterface.addIndex(
      'integration_stub_environment_checks',
      ['environmentId', 'checkedAt'],
      { name: 'integration_stub_environment_checks_env_checked_idx' },
    );
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'integration_stub_environment_checks',
      'integration_stub_environment_checks_env_checked_idx',
    );
    await queryInterface.dropTable('integration_stub_environment_checks');
    await queryInterface.removeIndex('integration_stub_environments', 'integration_stub_environments_slug_unique');
    await queryInterface.dropTable('integration_stub_environments');
  },
};
