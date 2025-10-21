'use strict';

const TABLES = {
  secrets: 'workspace_integration_secrets',
  webhooks: 'workspace_integration_webhooks',
  auditLogs: 'workspace_integration_audit_logs',
};

const dropEnum = async (queryInterface, enumName, transaction) => {
  const dialect = queryInterface.sequelize.getDialect();
  if (dialect === 'postgres' || dialect === 'postgresql') {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`, { transaction });
  }
};

const resolveJsonType = (queryInterface, Sequelize) => {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
};

const addIndex = (queryInterface, table, fields, options = {}) =>
  queryInterface.addIndex(table, fields, options).catch((error) => {
    if (!/already exists/i.test(error.message)) {
      throw error;
    }
  });

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        TABLES.secrets,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          integrationId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'workspace_integrations', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
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
            onUpdate: 'CASCADE',
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
        },
        { transaction },
      );

      await addIndex(queryInterface, TABLES.secrets, ['integrationId'], {
        name: 'workspace_integration_secrets_integration_idx',
        transaction,
      });
      await addIndex(queryInterface, TABLES.secrets, ['secretType'], {
        name: 'workspace_integration_secrets_type_idx',
        transaction,
      });
      await addIndex(queryInterface, TABLES.secrets, ['rotatedById'], {
        name: 'workspace_integration_secrets_rotated_by_idx',
        transaction,
      });
      await queryInterface.addConstraint(TABLES.secrets, {
        type: 'unique',
        fields: ['integrationId', 'name'],
        name: 'workspace_integration_secrets_integration_name_unique',
        transaction,
      });

      await queryInterface.createTable(
        TABLES.webhooks,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          integrationId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'workspace_integrations', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          secretId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: TABLES.secrets, key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
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
            onUpdate: 'CASCADE',
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
        },
        { transaction },
      );

      await addIndex(queryInterface, TABLES.webhooks, ['integrationId'], {
        name: 'workspace_integration_webhooks_integration_idx',
        transaction,
      });
      await addIndex(queryInterface, TABLES.webhooks, ['status'], {
        name: 'workspace_integration_webhooks_status_idx',
        transaction,
      });
      await addIndex(queryInterface, TABLES.webhooks, ['createdById'], {
        name: 'workspace_integration_webhooks_created_by_idx',
        transaction,
      });
      await queryInterface.addConstraint(TABLES.webhooks, {
        type: 'unique',
        fields: ['integrationId', 'name'],
        name: 'workspace_integration_webhooks_integration_name_unique',
        transaction,
      });

      await queryInterface.createTable(
        TABLES.auditLogs,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          integrationId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'workspace_integrations', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          actorId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
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
          requestId: { type: Sequelize.STRING(120), allowNull: true },
          ipAddress: { type: Sequelize.STRING(64), allowNull: true },
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

      await addIndex(queryInterface, TABLES.auditLogs, ['integrationId'], {
        name: 'workspace_integration_audit_logs_integration_idx',
        transaction,
      });
      await addIndex(queryInterface, TABLES.auditLogs, ['eventType'], {
        name: 'workspace_integration_audit_logs_event_type_idx',
        transaction,
      });
      await addIndex(queryInterface, TABLES.auditLogs, ['actorId'], {
        name: 'workspace_integration_audit_logs_actor_idx',
        transaction,
      });
      await addIndex(queryInterface, TABLES.auditLogs, ['createdAt'], {
        name: 'workspace_integration_audit_logs_created_at_idx',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable(TABLES.auditLogs, { transaction });
      await queryInterface.dropTable(TABLES.webhooks, { transaction });
      await queryInterface.dropTable(TABLES.secrets, { transaction });

      await dropEnum(queryInterface, 'enum_workspace_integration_audit_logs_eventType', transaction);
      await dropEnum(queryInterface, 'enum_workspace_integration_webhooks_status', transaction);
      await dropEnum(queryInterface, 'enum_workspace_integration_secrets_secretType', transaction);
    });
  },
};
