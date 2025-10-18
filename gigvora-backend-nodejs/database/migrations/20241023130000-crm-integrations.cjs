'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

async function dropEnum(queryInterface, enumName) {
  const dialect = queryInterface.sequelize.getDialect();
  if (!['postgres', 'postgresql'].includes(dialect)) {
    return;
  }
  await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`);
}

const INTEGRATION_AUTH_TYPES = ['oauth', 'api_key', 'service_account'];
const INTEGRATION_ENVIRONMENTS = ['production', 'sandbox', 'staging'];
const INTEGRATION_SYNC_STATUSES = ['pending', 'success', 'warning', 'error'];
const INTEGRATION_CREDENTIAL_TYPES = ['oauth_refresh_token', 'api_key', 'service_account'];
const INTEGRATION_INCIDENT_SEVERITIES = ['low', 'medium', 'high', 'critical'];
const INTEGRATION_INCIDENT_STATUSES = ['open', 'monitoring', 'resolved'];
const SYNC_RUN_STATUSES = ['queued', 'running', 'success', 'warning', 'error'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.addColumn('workspace_integrations', 'authType', {
      type: Sequelize.ENUM(...INTEGRATION_AUTH_TYPES),
      allowNull: false,
      defaultValue: 'oauth',
    });

    await queryInterface.addColumn('workspace_integrations', 'environment', {
      type: Sequelize.ENUM(...INTEGRATION_ENVIRONMENTS),
      allowNull: false,
      defaultValue: 'production',
    });

    await queryInterface.addColumn('workspace_integrations', 'connectedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('workspace_integrations', 'nextSyncAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('workspace_integrations', 'lastSyncStatus', {
      type: Sequelize.ENUM(...INTEGRATION_SYNC_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    });

    await queryInterface.addColumn('workspace_integrations', 'settings', {
      type: jsonType,
      allowNull: true,
    });

    await queryInterface.createTable('workspace_integration_credentials', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      integrationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'workspace_integrations', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      credentialType: {
        type: Sequelize.ENUM(...INTEGRATION_CREDENTIAL_TYPES),
        allowNull: false,
        defaultValue: 'api_key',
      },
      secretDigest: { type: Sequelize.STRING(128), allowNull: false },
      fingerprint: { type: Sequelize.STRING(64), allowNull: true },
      expiresAt: { type: Sequelize.DATE, allowNull: true },
      lastRotatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      createdById: { type: Sequelize.INTEGER, allowNull: true },
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

    await queryInterface.addIndex('workspace_integration_credentials', ['integrationId']);
    await queryInterface.addIndex('workspace_integration_credentials', ['credentialType']);
    await queryInterface.addIndex('workspace_integration_credentials', ['fingerprint']);

    await queryInterface.createTable('workspace_integration_field_mappings', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      integrationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'workspace_integrations', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      externalObject: { type: Sequelize.STRING(80), allowNull: false },
      localObject: { type: Sequelize.STRING(80), allowNull: false },
      mapping: { type: jsonType, allowNull: false, defaultValue: {} },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
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

    await queryInterface.addIndex('workspace_integration_field_mappings', ['integrationId']);
    await queryInterface.addIndex('workspace_integration_field_mappings', ['externalObject']);

    await queryInterface.createTable('workspace_integration_role_assignments', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      integrationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'workspace_integrations', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      roleKey: { type: Sequelize.STRING(60), allowNull: false },
      roleLabel: { type: Sequelize.STRING(120), allowNull: false },
      assigneeName: { type: Sequelize.STRING(120), allowNull: true },
      assigneeEmail: { type: Sequelize.STRING(160), allowNull: true },
      userId: { type: Sequelize.INTEGER, allowNull: true },
      permissions: { type: jsonType, allowNull: true },
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

    await queryInterface.addIndex('workspace_integration_role_assignments', ['integrationId']);
    await queryInterface.addIndex('workspace_integration_role_assignments', ['roleKey']);
    await queryInterface.addIndex('workspace_integration_role_assignments', ['assigneeEmail']);

    await queryInterface.createTable('workspace_integration_sync_runs', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      integrationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'workspace_integrations', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM(...SYNC_RUN_STATUSES),
        allowNull: false,
        defaultValue: 'queued',
      },
      trigger: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'manual' },
      triggeredById: { type: Sequelize.INTEGER, allowNull: true },
      startedAt: { type: Sequelize.DATE, allowNull: true },
      finishedAt: { type: Sequelize.DATE, allowNull: true },
      recordsProcessed: { type: Sequelize.INTEGER, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
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

    await queryInterface.addIndex('workspace_integration_sync_runs', ['integrationId']);
    await queryInterface.addIndex('workspace_integration_sync_runs', ['status']);
    await queryInterface.addIndex('workspace_integration_sync_runs', ['triggeredById']);

    await queryInterface.createTable('workspace_integration_incidents', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      integrationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'workspace_integrations', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      severity: {
        type: Sequelize.ENUM(...INTEGRATION_INCIDENT_SEVERITIES),
        allowNull: false,
        defaultValue: 'low',
      },
      status: {
        type: Sequelize.ENUM(...INTEGRATION_INCIDENT_STATUSES),
        allowNull: false,
        defaultValue: 'open',
      },
      summary: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      openedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      resolvedAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex('workspace_integration_incidents', ['integrationId']);
    await queryInterface.addIndex('workspace_integration_incidents', ['status']);
    await queryInterface.addIndex('workspace_integration_incidents', ['severity']);

    await queryInterface.createTable('workspace_integration_audit_events', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      integrationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'workspace_integrations', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      action: { type: Sequelize.STRING(120), allowNull: false },
      actorId: { type: Sequelize.INTEGER, allowNull: true },
      actorName: { type: Sequelize.STRING(180), allowNull: true },
      details: { type: jsonType, allowNull: true },
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

    await queryInterface.addIndex('workspace_integration_audit_events', ['integrationId']);
    await queryInterface.addIndex('workspace_integration_audit_events', ['action']);
    await queryInterface.addIndex('workspace_integration_audit_events', ['createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('workspace_integration_audit_events');
    await queryInterface.dropTable('workspace_integration_incidents');
    await queryInterface.dropTable('workspace_integration_sync_runs');
    await queryInterface.dropTable('workspace_integration_role_assignments');
    await queryInterface.dropTable('workspace_integration_field_mappings');
    await queryInterface.dropTable('workspace_integration_credentials');

    await queryInterface.removeColumn('workspace_integrations', 'settings');
    await queryInterface.removeColumn('workspace_integrations', 'lastSyncStatus');
    await queryInterface.removeColumn('workspace_integrations', 'nextSyncAt');
    await queryInterface.removeColumn('workspace_integrations', 'connectedAt');
    await queryInterface.removeColumn('workspace_integrations', 'environment');
    await queryInterface.removeColumn('workspace_integrations', 'authType');

    await dropEnum(queryInterface, 'enum_workspace_integrations_authType');
    await dropEnum(queryInterface, 'enum_workspace_integrations_environment');
    await dropEnum(queryInterface, 'enum_workspace_integrations_lastSyncStatus');
    await dropEnum(queryInterface, 'enum_workspace_integration_credentials_credentialType');
    await dropEnum(queryInterface, 'enum_workspace_integration_sync_runs_status');
    await dropEnum(queryInterface, 'enum_workspace_integration_incidents_severity');
    await dropEnum(queryInterface, 'enum_workspace_integration_incidents_status');
  },
};
