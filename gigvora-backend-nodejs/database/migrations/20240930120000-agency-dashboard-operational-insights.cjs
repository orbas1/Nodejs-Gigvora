'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      await queryInterface.createTable(
        'project_operational_snapshots',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'provider_workspaces', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          projectId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'projects', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          reportingDate: { type: Sequelize.DATEONLY, allowNull: false },
          scopeHealth: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'on_track' },
          staffingStatus: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'right_sized' },
          staffingRatio: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
          profitabilityStatus: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'healthy' },
          marginPercent: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
          qualityScore: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          qaStatus: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'in_control' },
          automationCoverage: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          riskLevel: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'low' },
          issuesOpen: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'project_operational_snapshots',
        ['projectId', 'reportingDate'],
        { name: 'project_operational_snapshots_project_date_idx', transaction },
      );

      await queryInterface.addIndex(
        'project_operational_snapshots',
        ['workspaceId', 'reportingDate'],
        { name: 'project_operational_snapshots_workspace_date_idx', transaction },
      );

      await queryInterface.createTable(
        'project_dependency_links',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'provider_workspaces', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          projectId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'projects', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          dependentProjectId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'projects', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          dependencyType: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'internal' },
          status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'in_progress' },
          riskLevel: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'medium' },
          leadTimeDays: { type: Sequelize.INTEGER, allowNull: true },
          isCritical: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'project_dependency_links',
        ['projectId', 'dependencyType'],
        { name: 'project_dependency_links_project_type_idx', transaction },
      );

      await queryInterface.createTable(
        'workspace_operating_blueprints',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          blueprintName: { type: Sequelize.STRING(160), allowNull: false },
          blueprintSlug: { type: Sequelize.STRING(160), allowNull: false, unique: true },
          clientName: { type: Sequelize.STRING(160), allowNull: true },
          status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'active' },
          sowUrl: { type: Sequelize.STRING(255), allowNull: true },
          deliveryCadence: { type: Sequelize.STRING(120), allowNull: true },
          cadenceCycleDays: { type: Sequelize.INTEGER, allowNull: true },
          automationGuardrails: { type: jsonType, allowNull: true },
          kickoffChecklist: { type: jsonType, allowNull: true },
          lastRunAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'workspace_operating_blueprints',
        ['workspaceId', 'status'],
        { name: 'workspace_operating_blueprints_workspace_status_idx', transaction },
      );

      await queryInterface.createTable(
        'resource_capacity_snapshots',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          reportingDate: { type: Sequelize.DATEONLY, allowNull: false },
          skillGroup: { type: Sequelize.STRING(120), allowNull: false },
          availableHours: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
          assignedHours: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
          billableRate: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
          utilizationRate: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          burnoutRisk: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'low' },
          benchHours: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
          costRate: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'resource_capacity_snapshots',
        ['workspaceId', 'reportingDate'],
        { name: 'resource_capacity_snapshots_workspace_date_idx', transaction },
      );

      await queryInterface.createTable(
        'resource_scenario_plans',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(160), allowNull: false },
          scenarioType: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'baseline' },
          status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'draft' },
          startDate: { type: Sequelize.DATEONLY, allowNull: true },
          endDate: { type: Sequelize.DATEONLY, allowNull: true },
          projectedRevenue: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          projectedCost: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          projectedMargin: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
          staffingPlan: { type: jsonType, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'resource_scenario_plans',
        ['workspaceId', 'status'],
        { name: 'resource_scenario_plans_workspace_status_idx', transaction },
      );

      await queryInterface.createTable(
        'quality_review_runs',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'provider_workspaces', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          projectId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'projects', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          reviewerId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'SET NULL',
            onDelete: 'SET NULL',
          },
          reviewType: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'pre_delivery' },
          status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'scheduled' },
          qaScore: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          clientSatisfaction: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          automationCoverage: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          reviewDate: { type: Sequelize.DATE, allowNull: true },
          lessonsLearned: { type: jsonType, allowNull: true },
          followUpActions: { type: jsonType, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'quality_review_runs',
        ['projectId', 'reviewType'],
        { name: 'quality_review_runs_project_type_idx', transaction },
      );

      await queryInterface.addIndex(
        'quality_review_runs',
        ['workspaceId', 'reviewDate'],
        { name: 'quality_review_runs_workspace_date_idx', transaction },
      );

      await queryInterface.createTable(
        'financial_engagement_summaries',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'provider_workspaces', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          projectId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'projects', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          clientName: { type: Sequelize.STRING(160), allowNull: true },
          policyName: { type: Sequelize.STRING(160), allowNull: true },
          billingCurrency: { type: Sequelize.STRING(6), allowNull: false, defaultValue: 'USD' },
          budgetAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          actualSpend: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          invoicedAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          outstandingAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          changeOrdersCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          profitabilityScore: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          marginPercent: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
          lastInvoiceDate: { type: Sequelize.DATE, allowNull: true },
          nextInvoiceDate: { type: Sequelize.DATE, allowNull: true },
          complianceStatus: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'on_track' },
          lastComplianceExportAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'financial_engagement_summaries',
        ['workspaceId', 'complianceStatus'],
        { name: 'financial_engagement_summaries_workspace_status_idx', transaction },
      );

      await queryInterface.addIndex(
        'financial_engagement_summaries',
        ['projectId'],
        { name: 'financial_engagement_summaries_project_idx', transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeIndex(
        'financial_engagement_summaries',
        'financial_engagement_summaries_project_idx',
        { transaction },
      );
      await queryInterface.removeIndex(
        'financial_engagement_summaries',
        'financial_engagement_summaries_workspace_status_idx',
        { transaction },
      );
      await queryInterface.dropTable('financial_engagement_summaries', { transaction });

      await queryInterface.removeIndex(
        'quality_review_runs',
        'quality_review_runs_workspace_date_idx',
        { transaction },
      );
      await queryInterface.removeIndex(
        'quality_review_runs',
        'quality_review_runs_project_type_idx',
        { transaction },
      );
      await queryInterface.dropTable('quality_review_runs', { transaction });

      await queryInterface.removeIndex(
        'resource_scenario_plans',
        'resource_scenario_plans_workspace_status_idx',
        { transaction },
      );
      await queryInterface.dropTable('resource_scenario_plans', { transaction });

      await queryInterface.removeIndex(
        'resource_capacity_snapshots',
        'resource_capacity_snapshots_workspace_date_idx',
        { transaction },
      );
      await queryInterface.dropTable('resource_capacity_snapshots', { transaction });

      await queryInterface.removeIndex(
        'workspace_operating_blueprints',
        'workspace_operating_blueprints_workspace_status_idx',
        { transaction },
      );
      await queryInterface.dropTable('workspace_operating_blueprints', { transaction });

      await queryInterface.removeIndex(
        'project_dependency_links',
        'project_dependency_links_project_type_idx',
        { transaction },
      );
      await queryInterface.dropTable('project_dependency_links', { transaction });

      await queryInterface.removeIndex(
        'project_operational_snapshots',
        'project_operational_snapshots_workspace_date_idx',
        { transaction },
      );
      await queryInterface.removeIndex(
        'project_operational_snapshots',
        'project_operational_snapshots_project_date_idx',
        { transaction },
      );
      await queryInterface.dropTable('project_operational_snapshots', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
