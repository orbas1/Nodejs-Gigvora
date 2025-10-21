'use strict';

const resolveJsonType = (queryInterface, Sequelize) => {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);
      const timestampDefault = Sequelize.literal('CURRENT_TIMESTAMP');

      await queryInterface.createTable(
        'api_providers',
        {
          id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
          name: { type: Sequelize.STRING(160), allowNull: false },
          slug: { type: Sequelize.STRING(160), allowNull: false, unique: true },
          status: {
            type: Sequelize.ENUM('active', 'degraded', 'deprecated', 'planned'),
            allowNull: false,
            defaultValue: 'active',
          },
          baseUrl: { type: Sequelize.STRING(512), allowNull: true },
          sandboxBaseUrl: { type: Sequelize.STRING(512), allowNull: true },
          docsUrl: { type: Sequelize.STRING(512), allowNull: true },
          iconUrl: { type: Sequelize.STRING(512), allowNull: true },
          description: { type: Sequelize.TEXT, allowNull: true },
          contactEmail: { type: Sequelize.STRING(255), allowNull: true },
          callPriceCents: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addConstraint('api_providers', {
        type: 'unique',
        fields: ['slug'],
        name: 'api_providers_slug_unique',
        transaction,
      });

      await queryInterface.createTable(
        'api_clients',
        {
          id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
          providerId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'api_providers', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
          },
          name: { type: Sequelize.STRING(160), allowNull: false },
          slug: { type: Sequelize.STRING(160), allowNull: false, unique: true },
          description: { type: Sequelize.TEXT, allowNull: true },
          contactEmail: { type: Sequelize.STRING(255), allowNull: true },
          status: {
            type: Sequelize.ENUM('active', 'suspended', 'revoked'),
            allowNull: false,
            defaultValue: 'active',
          },
          accessLevel: {
            type: Sequelize.ENUM('read', 'write', 'admin'),
            allowNull: false,
            defaultValue: 'read',
          },
          rateLimitPerMinute: { type: Sequelize.INTEGER, allowNull: true },
          ipAllowList: { type: jsonType, allowNull: true },
          scopes: { type: jsonType, allowNull: true },
          webhookUrl: { type: Sequelize.STRING(512), allowNull: true },
          webhookSecretHash: { type: Sequelize.STRING(255), allowNull: true },
          webhookSecretLastFour: { type: Sequelize.STRING(8), allowNull: true },
          walletAccountId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'wallet_accounts', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          callPriceCents: { type: Sequelize.INTEGER, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdBy: { type: Sequelize.STRING(160), allowNull: true },
          lastUsedAt: { type: Sequelize.DATE, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addConstraint('api_clients', {
        type: 'unique',
        fields: ['slug'],
        name: 'api_clients_slug_unique',
        transaction,
      });

      await queryInterface.addIndex(
        'api_clients',
        ['providerId'],
        { transaction, name: 'api_clients_provider_idx' },
      );
      await queryInterface.addIndex('api_clients', ['status'], { transaction, name: 'api_clients_status_idx' });

      await queryInterface.createTable(
        'api_client_keys',
        {
          id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
          clientId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'api_clients', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          label: { type: Sequelize.STRING(160), allowNull: true },
          secretHash: { type: Sequelize.STRING(255), allowNull: false },
          secretLastFour: { type: Sequelize.STRING(8), allowNull: false },
          createdBy: { type: Sequelize.STRING(160), allowNull: true },
          expiresAt: { type: Sequelize.DATE, allowNull: true },
          lastRotatedAt: { type: Sequelize.DATE, allowNull: true },
          revokedAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addIndex('api_client_keys', ['clientId'], { transaction, name: 'api_client_keys_client_idx' });
      await queryInterface.addIndex('api_client_keys', ['revokedAt'], { transaction, name: 'api_client_keys_revoked_idx' });

      await queryInterface.createTable(
        'api_client_audit_events',
        {
          id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
          clientId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'api_clients', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          eventType: { type: Sequelize.STRING(80), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          actor: { type: Sequelize.STRING(160), allowNull: true },
          ipAddress: { type: Sequelize.STRING(64), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addIndex('api_client_audit_events', ['clientId'], {
        transaction,
        name: 'api_client_audit_events_client_idx',
      });
      await queryInterface.addIndex('api_client_audit_events', ['createdAt'], {
        transaction,
        name: 'api_client_audit_events_created_idx',
      });

      await queryInterface.createTable(
        'api_client_usage_metrics',
        {
          id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
          clientId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'api_clients', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          metricDate: { type: Sequelize.DATEONLY, allowNull: false },
          requestCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          errorCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          avgLatencyMs: { type: Sequelize.INTEGER, allowNull: true },
          peakLatencyMs: { type: Sequelize.INTEGER, allowNull: true },
          lastRequestAt: { type: Sequelize.DATE, allowNull: true },
          billableRequestCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          billedAmountCents: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'api_client_usage_metrics',
        ['clientId', 'metricDate'],
        { transaction, unique: true, name: 'api_client_usage_metrics_client_date_unique' },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('api_client_usage_metrics', 'api_client_usage_metrics_client_date_unique', { transaction });
      await queryInterface.removeIndex('api_client_audit_events', 'api_client_audit_events_created_idx', { transaction });
      await queryInterface.removeIndex('api_client_audit_events', 'api_client_audit_events_client_idx', { transaction });
      await queryInterface.removeIndex('api_client_keys', 'api_client_keys_revoked_idx', { transaction });
      await queryInterface.removeIndex('api_client_keys', 'api_client_keys_client_idx', { transaction });
      await queryInterface.removeIndex('api_clients', 'api_clients_status_idx', { transaction });
      await queryInterface.removeIndex('api_clients', 'api_clients_provider_idx', { transaction });
      await queryInterface.removeConstraint('api_clients', 'api_clients_slug_unique', { transaction });
      await queryInterface.dropTable('api_client_usage_metrics', { transaction });
      await queryInterface.dropTable('api_client_audit_events', { transaction });
      await queryInterface.dropTable('api_client_keys', { transaction });
      await queryInterface.removeConstraint('api_providers', 'api_providers_slug_unique', { transaction });
      await queryInterface.dropTable('api_clients', { transaction });
      await queryInterface.dropTable('api_providers', { transaction });

      const dialect = queryInterface.sequelize.getDialect();
      if (dialect === 'postgres' || dialect === 'postgresql') {
        await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_api_clients_status\"", { transaction });
        await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_api_clients_accessLevel\"", { transaction });
        await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_api_providers_status\"", { transaction });
      }
    });
  },
};
