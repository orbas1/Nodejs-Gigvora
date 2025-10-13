'use strict';

const dropEnum = async (queryInterface, enumName) => {
  const dialect = queryInterface.sequelize.getDialect();
  if (dialect === 'postgres' || dialect === 'postgresql') {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`);
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())
      ? Sequelize.JSONB
      : Sequelize.JSON;

    await queryInterface.createTable('employer_brand_stories', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
      },
      authorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      summary: { type: Sequelize.TEXT, allowNull: true },
      storyType: {
        type: Sequelize.ENUM('culture', 'employee_spotlight', 'event', 'award', 'initiative'),
        allowNull: false,
        defaultValue: 'culture',
      },
      status: {
        type: Sequelize.ENUM('draft', 'scheduled', 'published', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
      },
      publishedAt: { type: Sequelize.DATE, allowNull: true },
      heroImageUrl: { type: Sequelize.STRING(500), allowNull: true },
      engagementScore: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
      tags: { type: jsonType, allowNull: true },
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

    await queryInterface.addIndex('employer_brand_stories', ['workspaceId']);
    await queryInterface.addIndex('employer_brand_stories', ['status']);
    await queryInterface.addIndex('employer_brand_stories', ['storyType']);

    await queryInterface.createTable('employer_benefits', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      category: {
        type: Sequelize.ENUM('health', 'wellness', 'compensation', 'flexibility', 'development', 'culture'),
        allowNull: false,
        defaultValue: 'culture',
      },
      description: { type: Sequelize.TEXT, allowNull: true },
      isFeatured: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      effectiveDate: { type: Sequelize.DATEONLY, allowNull: true },
      lastReviewedAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex('employer_benefits', ['workspaceId']);
    await queryInterface.addIndex('employer_benefits', ['category']);
    await queryInterface.addIndex('employer_benefits', ['isFeatured']);

    await queryInterface.createTable('employee_journey_programs', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
      },
      programType: {
        type: Sequelize.ENUM('onboarding', 'mobility', 'performance'),
        allowNull: false,
        defaultValue: 'onboarding',
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      ownerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      stageCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      activeEmployees: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      completionRate: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      averageDurationDays: { type: Sequelize.INTEGER, allowNull: true },
      healthStatus: {
        type: Sequelize.ENUM('on_track', 'at_risk', 'off_track', 'needs_attention'),
        allowNull: false,
        defaultValue: 'on_track',
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
    });

    await queryInterface.addIndex('employee_journey_programs', ['workspaceId']);
    await queryInterface.addIndex('employee_journey_programs', ['programType']);
    await queryInterface.addIndex('employee_journey_programs', ['healthStatus']);

    await queryInterface.createTable('workspace_integrations', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
      },
      providerKey: { type: Sequelize.STRING(120), allowNull: false },
      displayName: { type: Sequelize.STRING(255), allowNull: false },
      category: {
        type: Sequelize.ENUM('calendar', 'hris', 'communication', 'ats', 'productivity', 'other'),
        allowNull: false,
        defaultValue: 'other',
      },
      status: {
        type: Sequelize.ENUM('connected', 'disconnected', 'error', 'pending'),
        allowNull: false,
        defaultValue: 'pending',
      },
      lastSyncedAt: { type: Sequelize.DATE, allowNull: true },
      syncFrequency: {
        type: Sequelize.ENUM('manual', 'hourly', 'daily', 'weekly'),
        allowNull: false,
        defaultValue: 'daily',
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
    });

    await queryInterface.addIndex('workspace_integrations', ['workspaceId']);
    await queryInterface.addIndex('workspace_integrations', ['providerKey']);
    await queryInterface.addIndex('workspace_integrations', ['category']);
    await queryInterface.addIndex('workspace_integrations', ['status']);

    await queryInterface.createTable('workspace_calendar_connections', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
      },
      providerKey: { type: Sequelize.STRING(120), allowNull: false },
      status: {
        type: Sequelize.ENUM('connected', 'sync_error', 'disconnected', 'pending'),
        allowNull: false,
        defaultValue: 'pending',
      },
      lastSyncedAt: { type: Sequelize.DATE, allowNull: true },
      calendarCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      primaryCalendar: { type: Sequelize.STRING(255), allowNull: true },
      settings: { type: jsonType, allowNull: true },
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

    await queryInterface.addIndex('workspace_calendar_connections', ['workspaceId']);
    await queryInterface.addIndex('workspace_calendar_connections', ['providerKey']);
    await queryInterface.addIndex('workspace_calendar_connections', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('workspace_calendar_connections');
    await queryInterface.dropTable('workspace_integrations');
    await queryInterface.dropTable('employee_journey_programs');
    await queryInterface.dropTable('employer_benefits');
    await queryInterface.dropTable('employer_brand_stories');

    await dropEnum(queryInterface, 'enum_workspace_calendar_connections_status');
    await dropEnum(queryInterface, 'enum_workspace_integrations_category');
    await dropEnum(queryInterface, 'enum_workspace_integrations_status');
    await dropEnum(queryInterface, 'enum_workspace_integrations_syncFrequency');
    await dropEnum(queryInterface, 'enum_employee_journey_programs_programType');
    await dropEnum(queryInterface, 'enum_employee_journey_programs_healthStatus');
    await dropEnum(queryInterface, 'enum_employer_benefits_category');
    await dropEnum(queryInterface, 'enum_employer_brand_stories_storyType');
    await dropEnum(queryInterface, 'enum_employer_brand_stories_status');
  },
};
