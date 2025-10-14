'use strict';

const dropEnum = async (queryInterface, enumName) => {
  const dialect = queryInterface.sequelize.getDialect();
  if (dialect === 'postgres' || dialect === 'postgresql') {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`);
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

    await queryInterface.createTable('compliance_documents', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      ownerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'SET NULL',
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      documentType: {
        type: Sequelize.ENUM(
          'msa',
          'nda',
          'ip_assignment',
          'contract',
          'tax',
          'insurance',
          'policy_acknowledgment',
          'security_addendum',
          'custom',
        ),
        allowNull: false,
        defaultValue: 'contract',
      },
      status: {
        type: Sequelize.ENUM('draft', 'awaiting_signature', 'active', 'expired', 'archived', 'superseded'),
        allowNull: false,
        defaultValue: 'awaiting_signature',
      },
      storageProvider: {
        type: Sequelize.ENUM('s3', 'r2', 'gcs', 'azure', 'filesystem', 'external'),
        allowNull: false,
        defaultValue: 'r2',
      },
      storagePath: { type: Sequelize.STRING(500), allowNull: false },
      storageRegion: { type: Sequelize.STRING(120), allowNull: true },
      latestVersionId: { type: Sequelize.INTEGER, allowNull: true },
      counterpartyName: { type: Sequelize.STRING(255), allowNull: true },
      counterpartyEmail: { type: Sequelize.STRING(255), allowNull: true },
      counterpartyCompany: { type: Sequelize.STRING(255), allowNull: true },
      jurisdiction: { type: Sequelize.STRING(120), allowNull: true },
      governingLaw: { type: Sequelize.STRING(120), allowNull: true },
      effectiveDate: { type: Sequelize.DATE, allowNull: true },
      expiryDate: { type: Sequelize.DATE, allowNull: true },
      renewalTerms: { type: Sequelize.STRING(255), allowNull: true },
      tags: { type: jsonType, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      obligationSummary: { type: Sequelize.TEXT, allowNull: true },
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

    await queryInterface.createTable('compliance_document_versions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      documentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'compliance_documents', key: 'id' },
        onDelete: 'CASCADE',
      },
      versionNumber: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      fileKey: { type: Sequelize.STRING(500), allowNull: false },
      fileName: { type: Sequelize.STRING(255), allowNull: false },
      mimeType: { type: Sequelize.STRING(120), allowNull: true },
      fileSize: { type: Sequelize.BIGINT, allowNull: true },
      sha256: { type: Sequelize.STRING(128), allowNull: true },
      uploadedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      signedAt: { type: Sequelize.DATE, allowNull: true },
      signedByName: { type: Sequelize.STRING(255), allowNull: true },
      signedByEmail: { type: Sequelize.STRING(255), allowNull: true },
      signedByIp: { type: Sequelize.STRING(64), allowNull: true },
      auditTrail: { type: jsonType, allowNull: true },
      changeSummary: { type: Sequelize.TEXT, allowNull: true },
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

    await queryInterface.createTable('compliance_obligations', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      documentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'compliance_documents', key: 'id' },
        onDelete: 'CASCADE',
      },
      clauseReference: { type: Sequelize.STRING(120), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: false },
      status: {
        type: Sequelize.ENUM('open', 'in_progress', 'satisfied', 'waived', 'overdue'),
        allowNull: false,
        defaultValue: 'open',
      },
      dueAt: { type: Sequelize.DATE, allowNull: true },
      completedAt: { type: Sequelize.DATE, allowNull: true },
      assigneeId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      priority: { type: Sequelize.STRING(60), allowNull: true },
      escalations: { type: jsonType, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      lastNotifiedAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.createTable('compliance_reminders', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      documentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'compliance_documents', key: 'id' },
        onDelete: 'CASCADE',
      },
      obligationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'compliance_obligations', key: 'id' },
        onDelete: 'SET NULL',
      },
      reminderType: { type: Sequelize.STRING(120), allowNull: false },
      dueAt: { type: Sequelize.DATE, allowNull: false },
      status: {
        type: Sequelize.ENUM('scheduled', 'sent', 'acknowledged', 'dismissed', 'cancelled'),
        allowNull: false,
        defaultValue: 'scheduled',
      },
      channel: { type: Sequelize.STRING(60), allowNull: true },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      sentAt: { type: Sequelize.DATE, allowNull: true },
      acknowledgedAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.createTable('compliance_localizations', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      framework: { type: Sequelize.STRING(120), allowNull: false },
      region: { type: Sequelize.STRING(60), allowNull: false },
      requirement: { type: Sequelize.TEXT, allowNull: false },
      guidance: { type: Sequelize.TEXT, allowNull: true },
      recommendedDocumentTypes: { type: jsonType, allowNull: true },
      questionnaireUrl: { type: Sequelize.STRING(500), allowNull: true },
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

    await queryInterface.addIndex('compliance_documents', ['ownerId']);
    await queryInterface.addIndex('compliance_documents', ['workspaceId']);
    await queryInterface.addIndex('compliance_documents', ['documentType']);
    await queryInterface.addIndex('compliance_documents', ['status']);
    await queryInterface.addIndex('compliance_documents', ['expiryDate']);

    await queryInterface.addIndex('compliance_document_versions', ['documentId']);
    await queryInterface.addIndex('compliance_document_versions', ['versionNumber']);
    await queryInterface.addIndex('compliance_document_versions', ['uploadedById']);
    await queryInterface.addConstraint('compliance_document_versions', {
      fields: ['documentId', 'versionNumber'],
      type: 'unique',
      name: 'compliance_document_versions_document_version_unique',
    });

    await queryInterface.addIndex('compliance_obligations', ['documentId']);
    await queryInterface.addIndex('compliance_obligations', ['status']);
    await queryInterface.addIndex('compliance_obligations', ['dueAt']);
    await queryInterface.addIndex('compliance_obligations', ['assigneeId']);

    await queryInterface.addIndex('compliance_reminders', ['documentId']);
    await queryInterface.addIndex('compliance_reminders', ['status']);
    await queryInterface.addIndex('compliance_reminders', ['dueAt']);
    await queryInterface.addIndex('compliance_reminders', ['obligationId']);

    await queryInterface.addConstraint('compliance_documents', {
      fields: ['latestVersionId'],
      type: 'foreign key',
      references: {
        table: 'compliance_document_versions',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      name: 'compliance_documents_latest_version_fk',
    });

    await queryInterface.addConstraint('compliance_localizations', {
      fields: ['framework', 'region'],
      type: 'unique',
      name: 'compliance_localizations_framework_region_unique',
    });

    await queryInterface.addIndex('compliance_localizations', ['region']);
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('compliance_documents', 'compliance_documents_latest_version_fk');
    await queryInterface.removeConstraint(
      'compliance_localizations',
      'compliance_localizations_framework_region_unique',
    );

    await queryInterface.dropTable('compliance_localizations');
    await queryInterface.dropTable('compliance_reminders');
    await queryInterface.dropTable('compliance_obligations');
    await queryInterface.dropTable('compliance_document_versions');
    await queryInterface.dropTable('compliance_documents');

    await dropEnum(queryInterface, 'enum_compliance_documents_documentType');
    await dropEnum(queryInterface, 'enum_compliance_documents_status');
    await dropEnum(queryInterface, 'enum_compliance_documents_storageProvider');
    await dropEnum(queryInterface, 'enum_compliance_obligations_status');
    await dropEnum(queryInterface, 'enum_compliance_reminders_status');
  },
};
