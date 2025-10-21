'use strict';

const resolveJsonType = (queryInterface, Sequelize) => {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
};

const dropEnum = async (queryInterface, enumName, transaction) => {
  const dialect = queryInterface.sequelize.getDialect();
  if (['postgres', 'postgresql'].includes(dialect)) {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`, transaction ? { transaction } : undefined);
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);
      const timestampDefault = Sequelize.literal('CURRENT_TIMESTAMP');

      await queryInterface.createTable(
        'employer_brand_stories',
        {
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
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'employer_brand_stories',
        ['workspaceId'],
        { name: 'employer_brand_stories_workspace_idx', transaction },
      );
      await queryInterface.addIndex(
        'employer_brand_stories',
        ['status'],
        { name: 'employer_brand_stories_status_idx', transaction },
      );
      await queryInterface.addIndex(
        'employer_brand_stories',
        ['storyType'],
        { name: 'employer_brand_stories_story_type_idx', transaction },
      );

      await queryInterface.createTable(
        'employer_benefits',
        {
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
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'employer_benefits',
        ['workspaceId'],
        { name: 'employer_benefits_workspace_idx', transaction },
      );
      await queryInterface.addIndex(
        'employer_benefits',
        ['category'],
        { name: 'employer_benefits_category_idx', transaction },
      );
      await queryInterface.addIndex(
        'employer_benefits',
        ['isFeatured'],
        { name: 'employer_benefits_featured_idx', transaction },
      );

      await queryInterface.createTable(
        'employee_journey_programs',
        {
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
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addConstraint('employee_journey_programs', {
        fields: ['workspaceId', 'title'],
        type: 'unique',
        name: 'employee_journey_programs_workspace_title_unique',
        transaction,
      });

      await queryInterface.addIndex(
        'employee_journey_programs',
        ['workspaceId'],
        { name: 'employee_journey_programs_workspace_idx', transaction },
      );
      await queryInterface.addIndex(
        'employee_journey_programs',
        ['programType'],
        { name: 'employee_journey_programs_program_type_idx', transaction },
      );
      await queryInterface.addIndex(
        'employee_journey_programs',
        ['healthStatus'],
        { name: 'employee_journey_programs_health_status_idx', transaction },
      );

      await queryInterface.createTable(
        'workspace_integrations',
        {
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
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addConstraint('workspace_integrations', {
        fields: ['workspaceId', 'providerKey'],
        type: 'unique',
        name: 'workspace_integrations_workspace_provider_unique',
        transaction,
      });

      await queryInterface.addIndex(
        'workspace_integrations',
        ['workspaceId'],
        { name: 'workspace_integrations_workspace_idx', transaction },
      );
      await queryInterface.addIndex(
        'workspace_integrations',
        ['providerKey'],
        { name: 'workspace_integrations_provider_key_idx', transaction },
      );
      await queryInterface.addIndex(
        'workspace_integrations',
        ['category'],
        { name: 'workspace_integrations_category_idx', transaction },
      );
      await queryInterface.addIndex(
        'workspace_integrations',
        ['status'],
        { name: 'workspace_integrations_status_idx', transaction },
      );

      await queryInterface.createTable(
        'workspace_calendar_connections',
        {
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
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addConstraint('workspace_calendar_connections', {
        fields: ['workspaceId', 'providerKey'],
        type: 'unique',
        name: 'workspace_calendar_connections_workspace_provider_unique',
        transaction,
      });

      await queryInterface.addIndex(
        'workspace_calendar_connections',
        ['workspaceId'],
        { name: 'workspace_calendar_connections_workspace_idx', transaction },
      );
      await queryInterface.addIndex(
        'workspace_calendar_connections',
        ['providerKey'],
        { name: 'workspace_calendar_connections_provider_key_idx', transaction },
      );
      await queryInterface.addIndex(
        'workspace_calendar_connections',
        ['status'],
        { name: 'workspace_calendar_connections_status_idx', transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint(
        'workspace_calendar_connections',
        'workspace_calendar_connections_workspace_provider_unique',
        { transaction },
      );
      await queryInterface.removeIndex(
        'workspace_calendar_connections',
        'workspace_calendar_connections_status_idx',
        { transaction },
      );
      await queryInterface.removeIndex(
        'workspace_calendar_connections',
        'workspace_calendar_connections_provider_key_idx',
        { transaction },
      );
      await queryInterface.removeIndex(
        'workspace_calendar_connections',
        'workspace_calendar_connections_workspace_idx',
        { transaction },
      );
      await queryInterface.dropTable('workspace_calendar_connections', { transaction });

      await queryInterface.removeConstraint(
        'workspace_integrations',
        'workspace_integrations_workspace_provider_unique',
        { transaction },
      );
      await queryInterface.removeIndex('workspace_integrations', 'workspace_integrations_status_idx', { transaction });
      await queryInterface.removeIndex('workspace_integrations', 'workspace_integrations_category_idx', { transaction });
      await queryInterface.removeIndex('workspace_integrations', 'workspace_integrations_provider_key_idx', { transaction });
      await queryInterface.removeIndex('workspace_integrations', 'workspace_integrations_workspace_idx', { transaction });
      await queryInterface.dropTable('workspace_integrations', { transaction });

      await queryInterface.removeConstraint(
        'employee_journey_programs',
        'employee_journey_programs_workspace_title_unique',
        { transaction },
      );
      await queryInterface.removeIndex('employee_journey_programs', 'employee_journey_programs_health_status_idx', { transaction });
      await queryInterface.removeIndex('employee_journey_programs', 'employee_journey_programs_program_type_idx', { transaction });
      await queryInterface.removeIndex('employee_journey_programs', 'employee_journey_programs_workspace_idx', { transaction });
      await queryInterface.dropTable('employee_journey_programs', { transaction });

      await queryInterface.removeIndex('employer_benefits', 'employer_benefits_featured_idx', { transaction });
      await queryInterface.removeIndex('employer_benefits', 'employer_benefits_category_idx', { transaction });
      await queryInterface.removeIndex('employer_benefits', 'employer_benefits_workspace_idx', { transaction });
      await queryInterface.dropTable('employer_benefits', { transaction });

      await queryInterface.removeIndex('employer_brand_stories', 'employer_brand_stories_story_type_idx', { transaction });
      await queryInterface.removeIndex('employer_brand_stories', 'employer_brand_stories_status_idx', { transaction });
      await queryInterface.removeIndex('employer_brand_stories', 'employer_brand_stories_workspace_idx', { transaction });
      await queryInterface.dropTable('employer_brand_stories', { transaction });

      await dropEnum(queryInterface, 'enum_workspace_calendar_connections_status', transaction);
      await dropEnum(queryInterface, 'enum_workspace_integrations_syncFrequency', transaction);
      await dropEnum(queryInterface, 'enum_workspace_integrations_status', transaction);
      await dropEnum(queryInterface, 'enum_workspace_integrations_category', transaction);
      await dropEnum(queryInterface, 'enum_employee_journey_programs_healthStatus', transaction);
      await dropEnum(queryInterface, 'enum_employee_journey_programs_programType', transaction);
      await dropEnum(queryInterface, 'enum_employer_benefits_category', transaction);
      await dropEnum(queryInterface, 'enum_employer_brand_stories_status', transaction);
      await dropEnum(queryInterface, 'enum_employer_brand_stories_storyType', transaction);
    });
  },
};
