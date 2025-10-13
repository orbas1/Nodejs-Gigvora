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

    await queryInterface.createTable('career_documents', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      documentType: {
        type: Sequelize.ENUM('cv', 'cover_letter', 'portfolio', 'brand_asset', 'story_block'),
        allowNull: false,
        defaultValue: 'cv',
      },
      title: { type: Sequelize.STRING(180), allowNull: false },
      slug: { type: Sequelize.STRING(200), allowNull: true },
      status: {
        type: Sequelize.ENUM('draft', 'in_review', 'approved', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
      },
      roleTag: { type: Sequelize.STRING(120), allowNull: true },
      geographyTag: { type: Sequelize.STRING(120), allowNull: true },
      aiAssisted: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      baselineVersionId: { type: Sequelize.INTEGER, allowNull: true },
      latestVersionId: { type: Sequelize.INTEGER, allowNull: true },
      tags: { type: jsonType, allowNull: true },
      shareUrl: { type: Sequelize.STRING(500), allowNull: true },
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

    await queryInterface.addIndex('career_documents', ['userId']);
    await queryInterface.addIndex('career_documents', ['documentType']);
    await queryInterface.addIndex('career_documents', ['status']);
    await queryInterface.addIndex('career_documents', ['roleTag']);
    await queryInterface.addIndex('career_documents', ['geographyTag']);

    await queryInterface.createTable('career_document_versions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      documentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'career_documents', key: 'id' },
        onDelete: 'CASCADE',
      },
      versionNumber: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      title: { type: Sequelize.STRING(180), allowNull: true },
      summary: { type: Sequelize.TEXT, allowNull: true },
      content: { type: Sequelize.TEXT('long'), allowNull: true },
      contentPath: { type: Sequelize.STRING(500), allowNull: true },
      aiSummary: { type: Sequelize.TEXT, allowNull: true },
      changeSummary: { type: Sequelize.TEXT, allowNull: true },
      diffHighlights: { type: jsonType, allowNull: true },
      metrics: { type: jsonType, allowNull: true },
      aiSuggestionUsed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      approvalStatus: {
        type: Sequelize.ENUM('draft', 'pending_review', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'draft',
      },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      approvedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      approvedAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex('career_document_versions', ['documentId']);
    await queryInterface.addIndex('career_document_versions', ['approvalStatus']);
    await queryInterface.addConstraint('career_document_versions', {
      fields: ['documentId', 'versionNumber'],
      type: 'unique',
      name: 'career_document_versions_document_version_unique',
    });

    await queryInterface.createTable('career_document_collaborators', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      documentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'career_documents', key: 'id' },
        onDelete: 'CASCADE',
      },
      collaboratorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      role: {
        type: Sequelize.ENUM('owner', 'mentor', 'reviewer', 'viewer'),
        allowNull: false,
        defaultValue: 'viewer',
      },
      permissions: { type: jsonType, allowNull: true },
      lastActiveAt: { type: Sequelize.DATE, allowNull: true },
      addedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
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

    await queryInterface.addIndex('career_document_collaborators', ['documentId']);
    await queryInterface.addIndex('career_document_collaborators', ['collaboratorId']);
    await queryInterface.addConstraint('career_document_collaborators', {
      fields: ['documentId', 'collaboratorId'],
      type: 'unique',
      name: 'career_document_collaborators_document_collaborator_unique',
    });

    await queryInterface.createTable('career_document_exports', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      documentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'career_documents', key: 'id' },
        onDelete: 'CASCADE',
      },
      versionId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'career_document_versions', key: 'id' },
        onDelete: 'SET NULL',
      },
      format: {
        type: Sequelize.ENUM('pdf', 'docx', 'web', 'html'),
        allowNull: false,
        defaultValue: 'pdf',
      },
      exportedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      exportedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deliveryUrl: { type: Sequelize.STRING(500), allowNull: true },
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

    await queryInterface.addIndex('career_document_exports', ['documentId']);
    await queryInterface.addIndex('career_document_exports', ['format']);

    await queryInterface.createTable('career_document_analytics', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      documentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'career_documents', key: 'id' },
        onDelete: 'CASCADE',
      },
      versionId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'career_document_versions', key: 'id' },
        onDelete: 'SET NULL',
      },
      viewerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      viewerType: {
        type: Sequelize.ENUM('recruiter', 'mentor', 'system', 'external'),
        allowNull: false,
        defaultValue: 'recruiter',
      },
      opens: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      downloads: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      shares: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      lastOpenedAt: { type: Sequelize.DATE, allowNull: true },
      lastDownloadedAt: { type: Sequelize.DATE, allowNull: true },
      geographyTag: { type: Sequelize.STRING(120), allowNull: true },
      seniorityTag: { type: Sequelize.STRING(120), allowNull: true },
      outcomes: { type: jsonType, allowNull: true },
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

    await queryInterface.addIndex('career_document_analytics', ['documentId']);
    await queryInterface.addIndex('career_document_analytics', ['viewerType']);
    await queryInterface.addIndex('career_document_analytics', ['geographyTag']);
    await queryInterface.addIndex('career_document_analytics', ['seniorityTag']);

    await queryInterface.createTable('career_story_blocks', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      title: { type: Sequelize.STRING(180), allowNull: false },
      tone: {
        type: Sequelize.ENUM('formal', 'friendly', 'bold', 'warm', 'executive'),
        allowNull: false,
        defaultValue: 'formal',
      },
      content: { type: Sequelize.TEXT('long'), allowNull: false },
      metrics: { type: jsonType, allowNull: true },
      approvalStatus: {
        type: Sequelize.ENUM('draft', 'approved', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
      },
      useCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      lastUsedAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex('career_story_blocks', ['userId']);
    await queryInterface.addIndex('career_story_blocks', ['tone']);

    await queryInterface.createTable('career_brand_assets', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      assetType: {
        type: Sequelize.ENUM('testimonial', 'case_study', 'banner', 'video', 'portfolio', 'press'),
        allowNull: false,
        defaultValue: 'testimonial',
      },
      title: { type: Sequelize.STRING(200), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      mediaUrl: { type: Sequelize.STRING(500), allowNull: true },
      thumbnailUrl: { type: Sequelize.STRING(500), allowNull: true },
      status: {
        type: Sequelize.ENUM('draft', 'published', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
      },
      featured: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      approvalsStatus: {
        type: Sequelize.ENUM('draft', 'in_review', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'draft',
      },
      approvedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      approvedAt: { type: Sequelize.DATE, allowNull: true },
      tags: { type: jsonType, allowNull: true },
      metrics: { type: jsonType, allowNull: true },
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

    await queryInterface.addIndex('career_brand_assets', ['userId']);
    await queryInterface.addIndex('career_brand_assets', ['assetType']);
    await queryInterface.addIndex('career_brand_assets', ['status']);

    await queryInterface.addConstraint('career_documents', {
      fields: ['baselineVersionId'],
      type: 'foreign key',
      name: 'career_documents_baseline_version_fk',
      references: {
        table: 'career_document_versions',
        field: 'id',
      },
      onDelete: 'SET NULL',
    });

    await queryInterface.addConstraint('career_documents', {
      fields: ['latestVersionId'],
      type: 'foreign key',
      name: 'career_documents_latest_version_fk',
      references: {
        table: 'career_document_versions',
        field: 'id',
      },
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('career_documents', 'career_documents_latest_version_fk');
    await queryInterface.removeConstraint('career_documents', 'career_documents_baseline_version_fk');

    await queryInterface.dropTable('career_brand_assets');
    await queryInterface.dropTable('career_story_blocks');
    await queryInterface.dropTable('career_document_analytics');
    await queryInterface.dropTable('career_document_exports');
    await queryInterface.dropTable('career_document_collaborators');
    await queryInterface.dropTable('career_document_versions');
    await queryInterface.dropTable('career_documents');

    await dropEnum(queryInterface, 'enum_career_documents_documentType');
    await dropEnum(queryInterface, 'enum_career_documents_status');
    await dropEnum(queryInterface, 'enum_career_document_versions_approvalStatus');
    await dropEnum(queryInterface, 'enum_career_document_collaborators_role');
    await dropEnum(queryInterface, 'enum_career_document_exports_format');
    await dropEnum(queryInterface, 'enum_career_document_analytics_viewerType');
    await dropEnum(queryInterface, 'enum_career_story_blocks_tone');
    await dropEnum(queryInterface, 'enum_career_story_blocks_approvalStatus');
    await dropEnum(queryInterface, 'enum_career_brand_assets_assetType');
    await dropEnum(queryInterface, 'enum_career_brand_assets_status');
    await dropEnum(queryInterface, 'enum_career_brand_assets_approvalsStatus');
  },
};
