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

    await queryInterface.createTable('agency_creation_items', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      agencyProfileId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'agency_profiles', key: 'id' },
        onDelete: 'CASCADE',
      },
      ownerWorkspaceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'SET NULL',
      },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      updatedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      title: { type: Sequelize.STRING(180), allowNull: false },
      slug: { type: Sequelize.STRING(200), allowNull: true },
      targetType: {
        type: Sequelize.ENUM(
          'project',
          'gig',
          'job',
          'launchpad_job',
          'launchpad_project',
          'volunteer_opportunity',
          'networking_session',
          'blog_post',
          'group',
          'page',
          'ad',
        ),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('draft', 'in_review', 'scheduled', 'published', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
      },
      visibility: {
        type: Sequelize.ENUM('internal', 'restricted', 'public'),
        allowNull: false,
        defaultValue: 'internal',
      },
      summary: { type: Sequelize.TEXT, allowNull: true },
      description: { type: Sequelize.TEXT('long'), allowNull: true },
      callToAction: { type: Sequelize.STRING(160), allowNull: true },
      ctaUrl: { type: Sequelize.STRING(500), allowNull: true },
      applicationInstructions: { type: Sequelize.TEXT, allowNull: true },
      requirements: { type: jsonType, allowNull: true },
      tags: { type: jsonType, allowNull: true },
      location: { type: Sequelize.STRING(255), allowNull: true },
      timezone: { type: Sequelize.STRING(120), allowNull: true },
      launchDate: { type: Sequelize.DATE, allowNull: true },
      closingDate: { type: Sequelize.DATE, allowNull: true },
      budgetAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      budgetCurrency: { type: Sequelize.STRING(6), allowNull: true },
      capacityNeeded: { type: Sequelize.INTEGER, allowNull: true },
      expectedAttendees: { type: Sequelize.INTEGER, allowNull: true },
      experienceLevel: { type: Sequelize.STRING(120), allowNull: true },
      audience: { type: jsonType, allowNull: true },
      autoShareChannels: { type: jsonType, allowNull: true },
      settings: { type: jsonType, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      contactEmail: { type: Sequelize.STRING(180), allowNull: true },
      contactPhone: { type: Sequelize.STRING(60), allowNull: true },
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

    await queryInterface.addIndex('agency_creation_items', ['agencyProfileId']);
    await queryInterface.addIndex('agency_creation_items', ['ownerWorkspaceId']);
    await queryInterface.addIndex('agency_creation_items', ['targetType']);
    await queryInterface.addIndex('agency_creation_items', ['status']);
    await queryInterface.addIndex('agency_creation_items', ['priority']);
    await queryInterface.addIndex('agency_creation_items', ['launchDate']);
    await queryInterface.addIndex('agency_creation_items', ['agencyProfileId', 'slug'], {
      name: 'agency_creation_items_profile_slug_unique',
      unique: true,
    });

    await queryInterface.createTable('agency_creation_item_assets', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      itemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'agency_creation_items', key: 'id' },
        onDelete: 'CASCADE',
      },
      uploadedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      label: { type: Sequelize.STRING(160), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      assetType: {
        type: Sequelize.ENUM('image', 'video', 'document', 'link'),
        allowNull: false,
        defaultValue: 'link',
      },
      url: { type: Sequelize.STRING(500), allowNull: false },
      thumbnailUrl: { type: Sequelize.STRING(500), allowNull: true },
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

    await queryInterface.addIndex('agency_creation_item_assets', ['itemId']);
    await queryInterface.addIndex('agency_creation_item_assets', ['assetType']);

    await queryInterface.createTable('agency_creation_collaborators', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      itemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'agency_creation_items', key: 'id' },
        onDelete: 'CASCADE',
      },
      collaboratorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      collaboratorEmail: { type: Sequelize.STRING(255), allowNull: true },
      collaboratorName: { type: Sequelize.STRING(160), allowNull: true },
      role: { type: Sequelize.STRING(120), allowNull: false, defaultValue: 'Contributor' },
      status: {
        type: Sequelize.ENUM('invited', 'active', 'declined', 'removed'),
        allowNull: false,
        defaultValue: 'invited',
      },
      permissions: { type: jsonType, allowNull: true },
      addedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      invitedAt: { type: Sequelize.DATE, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
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

    await queryInterface.addIndex('agency_creation_collaborators', ['itemId']);
    await queryInterface.addIndex('agency_creation_collaborators', ['collaboratorId']);
    await queryInterface.addIndex('agency_creation_collaborators', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('agency_creation_collaborators');
    await queryInterface.dropTable('agency_creation_item_assets');
    await queryInterface.dropTable('agency_creation_items');

    await dropEnum(queryInterface, 'enum_agency_creation_items_targetType');
    await dropEnum(queryInterface, 'enum_agency_creation_items_status');
    await dropEnum(queryInterface, 'enum_agency_creation_items_priority');
    await dropEnum(queryInterface, 'enum_agency_creation_items_visibility');
    await dropEnum(queryInterface, 'enum_agency_creation_item_assets_assetType');
    await dropEnum(queryInterface, 'enum_agency_creation_collaborators_status');
  },
};
