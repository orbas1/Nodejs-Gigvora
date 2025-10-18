'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('legal_documents', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      slug: {
        type: Sequelize.STRING(120),
        allowNull: false,
        unique: true,
      },
      title: {
        type: Sequelize.STRING(240),
        allowNull: false,
      },
      category: {
        type: Sequelize.ENUM('terms', 'privacy', 'data_processing', 'cookie'),
        allowNull: false,
        defaultValue: 'terms',
      },
      status: {
        type: Sequelize.ENUM('draft', 'active', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
      },
      region: {
        type: Sequelize.STRING(60),
        allowNull: false,
        defaultValue: 'global',
      },
      defaultLocale: {
        type: Sequelize.STRING(12),
        allowNull: false,
        defaultValue: 'en',
      },
      audienceRoles: {
        type: ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())
          ? Sequelize.JSONB
          : Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      editorRoles: {
        type: ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())
          ? Sequelize.JSONB
          : Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      tags: {
        type: ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())
          ? Sequelize.JSONB
          : Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      summary: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      metadata: {
        type: ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())
          ? Sequelize.JSONB
          : Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      activeVersionId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      publishedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      retiredAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdBy: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      updatedBy: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.createTable('legal_document_versions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      documentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'legal_documents',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      locale: {
        type: Sequelize.STRING(12),
        allowNull: false,
        defaultValue: 'en',
      },
      status: {
        type: Sequelize.ENUM('draft', 'in_review', 'approved', 'published', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
      },
      effectiveAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      publishedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      supersededAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      summary: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      changeSummary: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      content: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      externalUrl: {
        type: Sequelize.STRING(1024),
        allowNull: true,
      },
      metadata: {
        type: ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())
          ? Sequelize.JSONB
          : Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      createdBy: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      publishedBy: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('legal_document_versions', ['documentId']);
    await queryInterface.addIndex('legal_document_versions', ['documentId', 'version', 'locale'], {
      unique: true,
      name: 'legal_document_versions_doc_version_locale_idx',
    });
    await queryInterface.addIndex('legal_document_versions', ['status']);

    await queryInterface.createTable('legal_document_audit_events', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      documentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'legal_documents',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      versionId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'legal_document_versions',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      action: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      actorId: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      actorType: {
        type: Sequelize.STRING(60),
        allowNull: false,
        defaultValue: 'admin',
      },
      metadata: {
        type: ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())
          ? Sequelize.JSONB
          : Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('legal_document_audit_events', ['documentId']);
    await queryInterface.addIndex('legal_document_audit_events', ['versionId']);
    await queryInterface.addIndex('legal_document_audit_events', ['action']);

    await queryInterface.addConstraint('legal_documents', {
      fields: ['activeVersionId'],
      type: 'foreign key',
      name: 'legal_documents_active_version_fk',
      references: {
        table: 'legal_document_versions',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('legal_documents', 'legal_documents_active_version_fk');
    await queryInterface.dropTable('legal_document_audit_events');
    await queryInterface.dropTable('legal_document_versions');
    await queryInterface.dropTable('legal_documents');
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_legal_documents_category\"");
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_legal_documents_status\"");
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_legal_document_versions_status\"");
  },
};
