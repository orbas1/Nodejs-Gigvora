'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('deliverable_vaults', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      freelancerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      title: { type: Sequelize.STRING(160), allowNull: false, defaultValue: 'Client deliverables' },
      description: { type: Sequelize.TEXT, allowNull: true },
      watermarkMode: {
        type: Sequelize.ENUM('none', 'basic', 'dynamic'),
        allowNull: false,
        defaultValue: 'dynamic',
      },
      retentionPolicy: {
        type: Sequelize.ENUM('standard_7_year', 'client_defined', 'indefinite', 'short_term'),
        allowNull: false,
        defaultValue: 'standard_7_year',
      },
      ndaTemplateUrl: { type: Sequelize.STRING(500), allowNull: true },
      settings: { type: Sequelize.JSON, allowNull: true },
      isArchived: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('deliverable_vault_items', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      vaultId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'deliverable_vaults', key: 'id' },
        onDelete: 'CASCADE',
      },
      projectId: { type: Sequelize.INTEGER, allowNull: true },
      clientName: { type: Sequelize.STRING(255), allowNull: true },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM('draft', 'in_review', 'approved', 'delivered', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
      },
      ndaRequired: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      ndaStatus: {
        type: Sequelize.ENUM('not_required', 'pending', 'signed', 'waived'),
        allowNull: false,
        defaultValue: 'not_required',
      },
      ndaSignedAt: { type: Sequelize.DATE, allowNull: true },
      ndaReferenceId: { type: Sequelize.STRING(120), allowNull: true },
      watermarkMode: {
        type: Sequelize.ENUM('inherit', 'none', 'basic', 'dynamic'),
        allowNull: false,
        defaultValue: 'inherit',
      },
      retentionPolicy: {
        type: Sequelize.ENUM('standard_7_year', 'client_defined', 'indefinite', 'short_term'),
        allowNull: false,
        defaultValue: 'standard_7_year',
      },
      retentionUntil: { type: Sequelize.DATE, allowNull: true },
      deliveredAt: { type: Sequelize.DATE, allowNull: true },
      currentVersionId: { type: Sequelize.INTEGER, allowNull: true },
      latestPackageId: { type: Sequelize.INTEGER, allowNull: true },
      tags: { type: Sequelize.JSON, allowNull: true },
      successSummary: { type: Sequelize.TEXT, allowNull: true },
      successMetrics: { type: Sequelize.JSON, allowNull: true },
      metadata: { type: Sequelize.JSON, allowNull: true },
      isArchived: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      lastTouchedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('deliverable_versions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      itemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'deliverable_vault_items', key: 'id' },
        onDelete: 'CASCADE',
      },
      versionNumber: { type: Sequelize.INTEGER, allowNull: false },
      storageKey: { type: Sequelize.STRING(255), allowNull: false },
      fileUrl: { type: Sequelize.STRING(500), allowNull: false },
      fileName: { type: Sequelize.STRING(255), allowNull: false },
      fileExt: { type: Sequelize.STRING(16), allowNull: true },
      fileSize: { type: Sequelize.BIGINT, allowNull: true },
      checksum: { type: Sequelize.STRING(128), allowNull: true },
      uploadedById: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      uploadedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      watermarkApplied: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      notes: { type: Sequelize.TEXT, allowNull: true },
      storageRegion: { type: Sequelize.STRING(60), allowNull: true },
      metadata: { type: Sequelize.JSON, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('deliverable_delivery_packages', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      itemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'deliverable_vault_items', key: 'id' },
        onDelete: 'CASCADE',
      },
      packageKey: { type: Sequelize.STRING(255), allowNull: false },
      packageUrl: { type: Sequelize.STRING(500), allowNull: false },
      checksum: { type: Sequelize.STRING(128), allowNull: true },
      generatedById: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      generatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      expiresAt: { type: Sequelize.DATE, allowNull: true },
      includesWatermark: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      deliverySummary: { type: Sequelize.TEXT, allowNull: true },
      deliveryMetrics: { type: Sequelize.JSON, allowNull: true },
      ndaSnapshot: { type: Sequelize.JSON, allowNull: true },
      status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'active' },
      metadata: { type: Sequelize.JSON, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('deliverable_vaults', ['freelancerId']);
    await queryInterface.addIndex('deliverable_vault_items', ['vaultId']);
    await queryInterface.addIndex('deliverable_vault_items', ['status']);
    await queryInterface.addIndex('deliverable_vault_items', ['ndaStatus']);
    await queryInterface.addIndex('deliverable_vault_items', ['retentionPolicy']);
    await queryInterface.addIndex('deliverable_versions', ['itemId', 'versionNumber'], { unique: true });
    await queryInterface.addIndex('deliverable_versions', ['uploadedById']);
    await queryInterface.addIndex('deliverable_delivery_packages', ['itemId']);
    await queryInterface.addIndex('deliverable_delivery_packages', ['generatedAt']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('deliverable_delivery_packages', ['generatedAt']).catch(() => {});
    await queryInterface.removeIndex('deliverable_delivery_packages', ['itemId']).catch(() => {});
    await queryInterface.removeIndex('deliverable_versions', ['uploadedById']).catch(() => {});
    await queryInterface.removeIndex('deliverable_versions', ['itemId', 'versionNumber']).catch(() => {});
    await queryInterface.removeIndex('deliverable_vault_items', ['retentionPolicy']).catch(() => {});
    await queryInterface.removeIndex('deliverable_vault_items', ['ndaStatus']).catch(() => {});
    await queryInterface.removeIndex('deliverable_vault_items', ['status']).catch(() => {});
    await queryInterface.removeIndex('deliverable_vault_items', ['vaultId']).catch(() => {});
    await queryInterface.removeIndex('deliverable_vaults', ['freelancerId']).catch(() => {});

    await queryInterface.dropTable('deliverable_delivery_packages');
    await queryInterface.dropTable('deliverable_versions');
    await queryInterface.dropTable('deliverable_vault_items');
    await queryInterface.dropTable('deliverable_vaults');

    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_deliverable_vaults_watermarkMode";`).catch(() => {});
    await queryInterface.sequelize
      .query(`DROP TYPE IF EXISTS "enum_deliverable_vaults_retentionPolicy";`)
      .catch(() => {});
    await queryInterface.sequelize
      .query(`DROP TYPE IF EXISTS "enum_deliverable_vault_items_status";`)
      .catch(() => {});
    await queryInterface.sequelize
      .query(`DROP TYPE IF EXISTS "enum_deliverable_vault_items_ndaStatus";`)
      .catch(() => {});
    await queryInterface.sequelize
      .query(`DROP TYPE IF EXISTS "enum_deliverable_vault_items_watermarkMode";`)
      .catch(() => {});
    await queryInterface.sequelize
      .query(`DROP TYPE IF EXISTS "enum_deliverable_vault_items_retentionPolicy";`)
      .catch(() => {});
  },
};
