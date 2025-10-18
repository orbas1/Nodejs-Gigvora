'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('storage_locations', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      locationKey: { type: Sequelize.STRING(120), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      provider: { type: Sequelize.STRING(60), allowNull: false },
      bucket: { type: Sequelize.STRING(255), allowNull: false },
      region: { type: Sequelize.STRING(120), allowNull: true },
      endpoint: { type: Sequelize.STRING(255), allowNull: true },
      publicBaseUrl: { type: Sequelize.STRING(2048), allowNull: true },
      defaultPathPrefix: { type: Sequelize.STRING(255), allowNull: true },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'active' },
      isPrimary: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      versioningEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      replicationEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      kmsKeyArn: { type: Sequelize.STRING(255), allowNull: true },
      credentialAccessKeyId: { type: Sequelize.STRING(255), allowNull: true },
      credentialSecret: { type: Sequelize.STRING(1024), allowNull: true },
      credentialRoleArn: { type: Sequelize.STRING(255), allowNull: true },
      credentialExternalId: { type: Sequelize.STRING(255), allowNull: true },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
      currentUsageMb: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      objectCount: { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 },
      ingestBytes24h: { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 },
      egressBytes24h: { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 },
      errorCount24h: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      lastInventoryAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex('storage_locations', ['provider'], {
      name: 'storage_locations_provider_idx',
    });
    await queryInterface.addIndex('storage_locations', ['status'], {
      name: 'storage_locations_status_idx',
    });
    await queryInterface.addIndex('storage_locations', ['isPrimary'], {
      name: 'storage_locations_primary_idx',
    });

    await queryInterface.createTable('storage_lifecycle_rules', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      locationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'storage_locations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(180), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'active' },
      filterPrefix: { type: Sequelize.STRING(255), allowNull: true },
      transitionAfterDays: { type: Sequelize.INTEGER, allowNull: true },
      transitionStorageClass: { type: Sequelize.STRING(64), allowNull: true },
      expireAfterDays: { type: Sequelize.INTEGER, allowNull: true },
      deleteExpiredObjects: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      compressObjects: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
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

    await queryInterface.addIndex('storage_lifecycle_rules', ['locationId'], {
      name: 'storage_lifecycle_rules_location_idx',
    });
    await queryInterface.addIndex('storage_lifecycle_rules', ['status'], {
      name: 'storage_lifecycle_rules_status_idx',
    });

    await queryInterface.createTable('storage_upload_presets', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      locationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'storage_locations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(160), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      pathPrefix: { type: Sequelize.STRING(255), allowNull: true },
      allowedMimeTypes: { type: jsonType, allowNull: false, defaultValue: [] },
      maxSizeMb: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 50 },
      allowedRoles: { type: jsonType, allowNull: false, defaultValue: [] },
      requireModeration: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      encryption: { type: Sequelize.STRING(60), allowNull: true },
      expiresAfterMinutes: { type: Sequelize.INTEGER, allowNull: true },
      active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
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

    await queryInterface.addIndex('storage_upload_presets', ['locationId'], {
      name: 'storage_upload_presets_location_idx',
    });
    await queryInterface.addIndex('storage_upload_presets', ['active'], {
      name: 'storage_upload_presets_active_idx',
    });

    await queryInterface.createTable('storage_audit_events', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      actorId: { type: Sequelize.INTEGER, allowNull: true },
      actorEmail: { type: Sequelize.STRING(255), allowNull: true },
      actorName: { type: Sequelize.STRING(255), allowNull: true },
      eventType: { type: Sequelize.STRING(60), allowNull: false },
      targetType: { type: Sequelize.STRING(60), allowNull: true },
      targetId: { type: Sequelize.INTEGER, allowNull: true },
      summary: { type: Sequelize.STRING(255), allowNull: true },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
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

    await queryInterface.addIndex('storage_audit_events', ['eventType'], {
      name: 'storage_audit_events_type_idx',
    });
    await queryInterface.addIndex('storage_audit_events', ['createdAt'], {
      name: 'storage_audit_events_created_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('storage_audit_events');
    await queryInterface.dropTable('storage_upload_presets');
    await queryInterface.dropTable('storage_lifecycle_rules');
    await queryInterface.dropTable('storage_locations');
  },
};
