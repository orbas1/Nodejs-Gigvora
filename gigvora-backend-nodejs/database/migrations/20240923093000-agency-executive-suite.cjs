'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'executive_intelligence_metrics',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          category: {
            type: Sequelize.ENUM(
              'financial',
              'delivery',
              'talent',
              'client',
              'compliance',
              'innovation',
            ),
            allowNull: false,
            defaultValue: 'financial',
          },
          name: { type: Sequelize.STRING(180), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          value: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
          unit: {
            type: Sequelize.ENUM('currency', 'percentage', 'count', 'ratio', 'score', 'duration'),
            allowNull: false,
            defaultValue: 'count',
          },
          changeValue: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          changeUnit: {
            type: Sequelize.ENUM('currency', 'percentage', 'count', 'ratio', 'score', 'duration'),
            allowNull: true,
          },
          trend: {
            type: Sequelize.ENUM('up', 'down', 'steady'),
            allowNull: false,
            defaultValue: 'steady',
          },
          comparisonPeriod: { type: Sequelize.STRING(120), allowNull: true },
          reportedAt: { type: Sequelize.DATE, allowNull: false },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'executive_scenario_plans',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          scenarioType: {
            type: Sequelize.ENUM('best', 'base', 'worst'),
            allowNull: false,
            defaultValue: 'base',
          },
          label: { type: Sequelize.STRING(120), allowNull: false },
          timeframeStart: { type: Sequelize.DATE, allowNull: false },
          timeframeEnd: { type: Sequelize.DATE, allowNull: false },
          revenue: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
          grossMargin: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          utilization: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          pipelineVelocity: { type: Sequelize.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
          clientSatisfaction: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          netRetention: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          assumptions: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'executive_scenario_breakdowns',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          scenarioId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'executive_scenario_plans', key: 'id' },
            onDelete: 'CASCADE',
          },
          dimensionType: {
            type: Sequelize.ENUM('client', 'service_line', 'squad', 'individual'),
            allowNull: false,
          },
          dimensionKey: { type: Sequelize.STRING(180), allowNull: false },
          dimensionLabel: { type: Sequelize.STRING(255), allowNull: false },
          revenue: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
          grossMargin: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          utilization: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          pipelineVelocity: { type: Sequelize.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
          clientSatisfaction: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          owner: { type: Sequelize.STRING(180), allowNull: true },
          highlight: { type: Sequelize.STRING(255), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'governance_risk_registers',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          referenceCode: { type: Sequelize.STRING(60), allowNull: true },
          title: { type: Sequelize.STRING(255), allowNull: false },
          category: {
            type: Sequelize.ENUM('compliance', 'delivery', 'finance', 'talent', 'technology', 'client'),
            allowNull: false,
            defaultValue: 'compliance',
          },
          status: {
            type: Sequelize.ENUM('open', 'monitoring', 'mitigated', 'closed'),
            allowNull: false,
            defaultValue: 'open',
          },
          impactScore: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          likelihoodScore: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          mitigationPlan: { type: Sequelize.TEXT, allowNull: true },
          mitigationOwner: { type: Sequelize.STRING(160), allowNull: true },
          mitigationStatus: { type: Sequelize.STRING(120), allowNull: true },
          targetResolutionDate: { type: Sequelize.DATE, allowNull: true },
          nextReviewAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'governance_audit_exports',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          exportType: { type: Sequelize.STRING(120), allowNull: false },
          status: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'available' },
          requestedBy: { type: Sequelize.STRING(160), allowNull: true },
          generatedAt: { type: Sequelize.DATE, allowNull: false },
          fileUrl: { type: Sequelize.STRING(1000), allowNull: true },
          recipients: { type: jsonType, allowNull: true },
          scope: { type: jsonType, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'leadership_rituals',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(160), allowNull: false },
          cadence: {
            type: Sequelize.ENUM('daily', 'weekly', 'biweekly', 'monthly', 'quarterly'),
            allowNull: false,
            defaultValue: 'weekly',
          },
          facilitator: { type: Sequelize.STRING(160), allowNull: true },
          channel: { type: Sequelize.STRING(120), allowNull: true },
          nextSessionAt: { type: Sequelize.DATE, allowNull: true },
          summary: { type: Sequelize.TEXT, allowNull: true },
          attendees: { type: jsonType, allowNull: true },
          lastSummaryUrl: { type: Sequelize.STRING(1000), allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'leadership_okrs',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          objective: { type: Sequelize.STRING(255), allowNull: false },
          owner: { type: Sequelize.STRING(160), allowNull: true },
          status: {
            type: Sequelize.ENUM('on_track', 'at_risk', 'off_track', 'achieved'),
            allowNull: false,
            defaultValue: 'on_track',
          },
          progress: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          confidence: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          targetDate: { type: Sequelize.DATE, allowNull: true },
          alignment: { type: Sequelize.STRING(160), allowNull: true },
          keyResults: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'leadership_decisions',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(255), allowNull: false },
          status: {
            type: Sequelize.ENUM('proposed', 'in_review', 'approved', 'implemented', 'deferred'),
            allowNull: false,
            defaultValue: 'proposed',
          },
          decidedAt: { type: Sequelize.DATE, allowNull: true },
          owner: { type: Sequelize.STRING(160), allowNull: true },
          impactArea: { type: Sequelize.STRING(160), allowNull: true },
          followUpAt: { type: Sequelize.DATE, allowNull: true },
          summary: { type: Sequelize.TEXT, allowNull: true },
          links: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'leadership_briefing_packs',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(255), allowNull: false },
          focus: { type: Sequelize.STRING(160), allowNull: true },
          status: {
            type: Sequelize.ENUM('draft', 'circulating', 'archived'),
            allowNull: false,
            defaultValue: 'draft',
          },
          distributionDate: { type: Sequelize.DATE, allowNull: true },
          preparedBy: { type: Sequelize.STRING(160), allowNull: true },
          summary: { type: Sequelize.TEXT, allowNull: true },
          resourceUrl: { type: Sequelize.STRING(1000), allowNull: true },
          highlights: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'leadership_strategic_bets',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          projectId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'projects', key: 'id' },
            onDelete: 'SET NULL',
          },
          name: { type: Sequelize.STRING(255), allowNull: false },
          thesis: { type: Sequelize.TEXT, allowNull: true },
          owner: { type: Sequelize.STRING(160), allowNull: true },
          status: { type: Sequelize.STRING(80), allowNull: true },
          progress: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          impactScore: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          successMetric: { type: Sequelize.STRING(160), allowNull: true },
          lastReviewedAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'innovation_initiatives',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(255), allowNull: false },
          category: {
            type: Sequelize.ENUM('service_line', 'r_and_d', 'product', 'process', 'automation'),
            allowNull: false,
            defaultValue: 'service_line',
          },
          stage: {
            type: Sequelize.ENUM('ideation', 'validation', 'pilot', 'scale', 'retired'),
            allowNull: false,
            defaultValue: 'ideation',
          },
          priority: {
            type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
            allowNull: false,
            defaultValue: 'medium',
          },
          priorityScore: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 50 },
          sponsor: { type: Sequelize.STRING(160), allowNull: true },
          summary: { type: Sequelize.TEXT, allowNull: true },
          eta: { type: Sequelize.DATE, allowNull: true },
          confidence: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          projectedRoi: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
          roiCurrency: { type: Sequelize.STRING(3), allowNull: true },
          tags: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'innovation_funding_events',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          initiativeId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'innovation_initiatives', key: 'id' },
            onDelete: 'CASCADE',
          },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          eventType: {
            type: Sequelize.ENUM('allocation', 'burn', 'return'),
            allowNull: false,
            defaultValue: 'allocation',
          },
          amount: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
          currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
          recordedAt: { type: Sequelize.DATE, allowNull: false },
          owner: { type: Sequelize.STRING(160), allowNull: true },
          description: { type: Sequelize.TEXT, allowNull: true },
          roiSnapshot: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await Promise.all([
        queryInterface.addIndex('executive_intelligence_metrics', ['workspaceId'], { transaction }),
        queryInterface.addIndex('executive_intelligence_metrics', ['category'], { transaction }),
        queryInterface.addIndex('executive_scenario_plans', ['workspaceId'], { transaction }),
        queryInterface.addIndex('executive_scenario_plans', ['scenarioType'], { transaction }),
        queryInterface.addIndex('executive_scenario_breakdowns', ['scenarioId'], { transaction }),
        queryInterface.addIndex('executive_scenario_breakdowns', ['dimensionType'], { transaction }),
        queryInterface.addIndex('governance_risk_registers', ['workspaceId'], { transaction }),
        queryInterface.addIndex('governance_risk_registers', ['status'], { transaction }),
        queryInterface.addIndex('governance_audit_exports', ['workspaceId'], { transaction }),
        queryInterface.addIndex('leadership_rituals', ['workspaceId'], { transaction }),
        queryInterface.addIndex('leadership_okrs', ['workspaceId'], { transaction }),
        queryInterface.addIndex('leadership_decisions', ['workspaceId'], { transaction }),
        queryInterface.addIndex('leadership_briefing_packs', ['workspaceId'], { transaction }),
        queryInterface.addIndex('leadership_strategic_bets', ['workspaceId'], { transaction }),
        queryInterface.addIndex('leadership_strategic_bets', ['projectId'], { transaction }),
        queryInterface.addIndex('innovation_initiatives', ['workspaceId'], { transaction }),
        queryInterface.addIndex('innovation_initiatives', ['stage'], { transaction }),
        queryInterface.addIndex('innovation_funding_events', ['workspaceId'], { transaction }),
        queryInterface.addIndex('innovation_funding_events', ['initiativeId'], { transaction }),
      ]);
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const dropTable = (name) => queryInterface.dropTable(name, { transaction });

      await dropTable('innovation_funding_events');
      await dropTable('innovation_initiatives');
      await dropTable('leadership_strategic_bets');
      await dropTable('leadership_briefing_packs');
      await dropTable('leadership_decisions');
      await dropTable('leadership_okrs');
      await dropTable('leadership_rituals');
      await dropTable('governance_audit_exports');
      await dropTable('governance_risk_registers');
      await dropTable('executive_scenario_breakdowns');
      await dropTable('executive_scenario_plans');
      await dropTable('executive_intelligence_metrics');

      const enumNames = [
        'enum_executive_intelligence_metrics_category',
        'enum_executive_intelligence_metrics_unit',
        'enum_executive_intelligence_metrics_changeUnit',
        'enum_executive_intelligence_metrics_trend',
        'enum_executive_scenario_plans_scenarioType',
        'enum_executive_scenario_breakdowns_dimensionType',
        'enum_governance_risk_registers_category',
        'enum_governance_risk_registers_status',
        'enum_leadership_rituals_cadence',
        'enum_leadership_okrs_status',
        'enum_leadership_decisions_status',
        'enum_leadership_briefing_packs_status',
        'enum_innovation_initiatives_category',
        'enum_innovation_initiatives_stage',
        'enum_innovation_initiatives_priority',
        'enum_innovation_funding_events_eventType',
      ];

      for (const enumName of enumNames) {
        await queryInterface.sequelize
          .query(`DROP TYPE IF EXISTS "${enumName}" CASCADE;`, { transaction })
          .catch(() => {});
      }
    });
  },
};
