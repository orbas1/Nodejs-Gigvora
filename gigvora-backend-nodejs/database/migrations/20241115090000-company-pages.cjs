'use strict';

const TABLES = {
  pages: 'company_pages',
  sections: 'company_page_sections',
  revisions: 'company_page_revisions',
  collaborators: 'company_page_collaborators',
  media: 'company_page_media',
};

const ENUMS = {
  pageStatus: 'enum_company_pages_status',
  pageVisibility: 'enum_company_pages_visibility',
  sectionVariant: 'enum_company_page_sections_variant',
  collaboratorRole: 'enum_company_page_collaborators_role',
  collaboratorStatus: 'enum_company_page_collaborators_status',
  mediaType: 'enum_company_page_media_mediaType',
};

async function dropEnum(queryInterface, enumName, transaction) {
  const dialect = queryInterface.sequelize.getDialect();
  if (dialect === 'postgres' || dialect === 'postgresql') {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`, { transaction });
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      await queryInterface.createTable(
        TABLES.pages,
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          slug: { type: Sequelize.STRING(200), allowNull: false },
          headline: { type: Sequelize.STRING(240), allowNull: false },
          summary: { type: Sequelize.TEXT, allowNull: true },
          blueprint: { type: Sequelize.STRING(120), allowNull: false, defaultValue: 'employer_brand' },
          status: {
            type: Sequelize.ENUM('draft', 'in_review', 'scheduled', 'published', 'archived'),
            allowNull: false,
            defaultValue: 'draft',
          },
          visibility: {
            type: Sequelize.ENUM('private', 'internal', 'public'),
            allowNull: false,
            defaultValue: 'private',
          },
          heroImageUrl: { type: Sequelize.STRING(255), allowNull: true },
          socialPreviewUrl: { type: Sequelize.STRING(255), allowNull: true },
          scheduledFor: { type: Sequelize.DATE, allowNull: true },
          publishedAt: { type: Sequelize.DATE, allowNull: true },
          archivedAt: { type: Sequelize.DATE, allowNull: true },
          tags: { type: jsonType, allowNull: false, defaultValue: [] },
          seo: { type: jsonType, allowNull: false, defaultValue: {} },
          analytics: { type: jsonType, allowNull: false, defaultValue: {} },
          settings: { type: jsonType, allowNull: false, defaultValue: {} },
          allowedRoles: { type: jsonType, allowNull: false, defaultValue: [] },
          createdById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          updatedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          lastEditedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          deletedAt: { type: Sequelize.DATE, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addIndex(TABLES.pages, ['workspaceId', 'slug'], {
        unique: true,
        name: 'company_pages_workspace_slug_unique',
        transaction,
      });
      await queryInterface.addIndex(TABLES.pages, ['workspaceId', 'status'], {
        name: 'company_pages_workspace_status_idx',
        transaction,
      });
      await queryInterface.addIndex(TABLES.pages, ['workspaceId', 'visibility'], {
        name: 'company_pages_workspace_visibility_idx',
        transaction,
      });

      await queryInterface.createTable(
        TABLES.sections,
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          pageId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: TABLES.pages, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(180), allowNull: true },
          sectionKey: { type: Sequelize.STRING(120), allowNull: true },
          variant: {
            type: Sequelize.ENUM('hero', 'story_block', 'metrics_grid', 'cta_banner', 'media_gallery', 'team_spotlight', 'faq', 'custom'),
            allowNull: false,
            defaultValue: 'custom',
          },
          orderIndex: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          headline: { type: Sequelize.STRING(240), allowNull: true },
          body: { type: Sequelize.TEXT, allowNull: true },
          content: { type: jsonType, allowNull: false, defaultValue: {} },
          media: { type: jsonType, allowNull: false, defaultValue: [] },
          ctaLabel: { type: Sequelize.STRING(120), allowNull: true },
          ctaUrl: { type: Sequelize.STRING(255), allowNull: true },
          visibility: {
            type: Sequelize.ENUM('private', 'internal', 'public'),
            allowNull: false,
            defaultValue: 'public',
          },
          settings: { type: jsonType, allowNull: false, defaultValue: {} },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addIndex(TABLES.sections, ['pageId', 'orderIndex'], {
        name: 'company_page_sections_page_order_idx',
        transaction,
      });

      await queryInterface.createTable(
        TABLES.revisions,
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          pageId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: TABLES.pages, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          version: { type: Sequelize.INTEGER, allowNull: false },
          snapshot: { type: jsonType, allowNull: false },
          notes: { type: Sequelize.STRING(500), allowNull: true },
          createdById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addConstraint(TABLES.revisions, {
        type: 'unique',
        name: 'company_page_revisions_unique_version',
        fields: ['pageId', 'version'],
        transaction,
      });

      await queryInterface.createTable(
        TABLES.collaborators,
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          pageId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: TABLES.pages, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          collaboratorId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          collaboratorEmail: { type: Sequelize.STRING(180), allowNull: true },
          collaboratorName: { type: Sequelize.STRING(180), allowNull: true },
          role: {
            type: Sequelize.ENUM('owner', 'editor', 'approver', 'viewer'),
            allowNull: false,
            defaultValue: 'editor',
          },
          status: {
            type: Sequelize.ENUM('invited', 'active', 'inactive'),
            allowNull: false,
            defaultValue: 'invited',
          },
          permissions: { type: jsonType, allowNull: false, defaultValue: [] },
          invitedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addIndex(TABLES.collaborators, ['pageId', 'status'], {
        name: 'company_page_collaborators_page_status_idx',
        transaction,
      });
      await queryInterface.addIndex(TABLES.collaborators, ['collaboratorId'], {
        name: 'company_page_collaborators_user_idx',
        transaction,
      });
      await queryInterface.addIndex(TABLES.collaborators, ['collaboratorEmail'], {
        name: 'company_page_collaborators_email_idx',
        transaction,
      });

      await queryInterface.createTable(
        TABLES.media,
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          pageId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: TABLES.pages, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          url: { type: Sequelize.STRING(500), allowNull: false },
          mediaType: {
            type: Sequelize.ENUM('image', 'video', 'document'),
            allowNull: false,
            defaultValue: 'image',
          },
          label: { type: Sequelize.STRING(180), allowNull: true },
          altText: { type: Sequelize.STRING(255), allowNull: true },
          isPrimary: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          metadata: { type: jsonType, allowNull: false, defaultValue: {} },
          uploadedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addIndex(TABLES.media, ['pageId', 'isPrimary'], {
        name: 'company_page_media_primary_idx',
        transaction,
      });

      await queryInterface.addIndex(TABLES.media, ['mediaType'], {
        name: 'company_page_media_type_idx',
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable(TABLES.media, { transaction });
      await queryInterface.dropTable(TABLES.collaborators, { transaction });
      await queryInterface.dropTable(TABLES.revisions, { transaction });
      await queryInterface.dropTable(TABLES.sections, { transaction });
      await queryInterface.dropTable(TABLES.pages, { transaction });

      await dropEnum(queryInterface, ENUMS.mediaType, transaction);
      await dropEnum(queryInterface, ENUMS.collaboratorStatus, transaction);
      await dropEnum(queryInterface, ENUMS.collaboratorRole, transaction);
      await dropEnum(queryInterface, ENUMS.sectionVariant, transaction);
      await dropEnum(queryInterface, ENUMS.pageVisibility, transaction);
      await dropEnum(queryInterface, ENUMS.pageStatus, transaction);
    });
  },
};
