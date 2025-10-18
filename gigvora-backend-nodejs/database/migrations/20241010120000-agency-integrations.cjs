'use strict';

const dropEnum = async (queryInterface, enumName) => {
  const dialect = queryInterface.sequelize.getDialect();
  if (dialect === 'postgres' || dialect === 'postgresql') {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`);
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())
      ? Sequelize.JSONB
      : Sequelize.JSON;

    await queryInterface.createTable('workspace_integration_secrets', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      integrationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'workspace_integrations', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(160), allowNull: false },
      secretType: {
        type: Sequelize.ENUM('api_key', 'oauth_token', 'webhook_secret', 'custom'),
        allowNull: false,
        defaultValue: 'api_key',
      },
      hashAlgorithm: { type: Sequelize.STRING(80), allowNull: false, defaultValue: 'pbkdf2_sha512' },
      hashedValue: { type: Sequelize.STRING(512), allowNull: false },
      salt: { type: Sequelize.STRING(128), allowNull: false },
      lastFour: { type: Sequelize.STRING(8), allowNull: true },
      version: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      lastRotatedAt: { type: Sequelize.DATE, allowNull: true },
      rotatedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
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
    });

    await queryInterface.addIndex('workspace_integration_secrets', ['integrationId']);
    await queryInterface.addIndex('workspace_integration_secrets', ['secretType']);
    await queryInterface.addIndex('workspace_integration_secrets', ['rotatedById']);

    await queryInterface.createTable('workspace_integration_webhooks', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      integrationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'workspace_integrations', key: 'id' },
        onDelete: 'CASCADE',
      },
      secretId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'workspace_integration_secrets', key: 'id' },
        onDelete: 'SET NULL',
      },
      name: { type: Sequelize.STRING(160), allowNull: false },
      status: {
        type: Sequelize.ENUM('active', 'paused', 'disabled'),
        allowNull: false,
        defaultValue: 'active',
      },
      targetUrl: { type: Sequelize.STRING(500), allowNull: false },
      eventTypes: { type: jsonType, allowNull: false, defaultValue: [] },
      verificationToken: { type: Sequelize.STRING(255), allowNull: true },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      lastTriggeredAt: { type: Sequelize.DATE, allowNull: true },
      lastErrorAt: { type: Sequelize.DATE, allowNull: true },
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
    });

    await queryInterface.addIndex('workspace_integration_webhooks', ['integrationId']);
    await queryInterface.addIndex('workspace_integration_webhooks', ['status']);
    await queryInterface.addIndex('workspace_integration_webhooks', ['createdById']);

    await queryInterface.createTable('workspace_integration_audit_logs', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      integrationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'workspace_integrations', key: 'id' },
        onDelete: 'CASCADE',
      },
      actorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      eventType: {
        type: Sequelize.ENUM(
          'integration_created',
          'integration_updated',
          'secret_created',
          'secret_rotated',
          'webhook_created',
          'webhook_updated',
          'webhook_deleted',
          'connection_tested',
          'sync_triggered'
        ),
        allowNull: false,
        defaultValue: 'integration_created',
      },
      summary: { type: Sequelize.STRING(255), allowNull: false },
      detail: { type: jsonType, allowNull: true },
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

    await queryInterface.addIndex('workspace_integration_audit_logs', ['integrationId']);
    await queryInterface.addIndex('workspace_integration_audit_logs', ['eventType']);
    await queryInterface.addIndex('workspace_integration_audit_logs', ['actorId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('workspace_integration_audit_logs');
    await queryInterface.dropTable('workspace_integration_webhooks');
    await queryInterface.dropTable('workspace_integration_secrets');

    await dropEnum(queryInterface, 'enum_workspace_integration_audit_logs_eventType');
    await dropEnum(queryInterface, 'enum_workspace_integration_webhooks_status');
    await dropEnum(queryInterface, 'enum_workspace_integration_secrets_secretType');
  },
};
