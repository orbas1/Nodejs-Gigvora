'use strict';

const { QueryTypes, Op } = require('sequelize');

const metricNames = ['Demo revenue run-rate', 'Demo gross margin', 'Demo utilization rate'];
const scenarioLabel = 'Demo Q4 base case';
const riskTitle = 'Demo: Escrow audit trail';
const auditLabel = 'demo-audit-export';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const [workspaceRow] = await queryInterface.sequelize.query(
        'SELECT id FROM provider_workspaces WHERE slug = :slug LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { slug: 'alliance-studio-hq' },
        },
      );

      const workspaceId = workspaceRow?.id ?? null;
      if (!workspaceId) {
        // Workspace seed may not have run; exit gracefully.
        return;
      }

      const metrics = [
        {
          category: 'financial',
          name: metricNames[0],
          description: 'Projected recurring revenue pace for the current quarter.',
          value: 187500,
          unit: 'currency',
          changeValue: 21500,
          changeUnit: 'currency',
          trend: 'up',
          comparisonPeriod: 'vs last quarter',
        },
        {
          category: 'financial',
          name: metricNames[1],
          description: 'Blended delivery margin across active retainers and projects.',
          value: 46.2,
          unit: 'percentage',
          changeValue: 4.1,
          changeUnit: 'percentage',
          trend: 'up',
          comparisonPeriod: 'vs 90-day average',
        },
        {
          category: 'talent',
          name: metricNames[2],
          description: 'Average billable utilisation across delivery squads.',
          value: 78.4,
          unit: 'percentage',
          changeValue: -1.2,
          changeUnit: 'percentage',
          trend: 'down',
          comparisonPeriod: 'vs prior month',
        },
      ];

      for (const metric of metrics) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM executive_intelligence_metrics WHERE workspaceId = :workspaceId AND name = :name LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { workspaceId, name: metric.name },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert(
          'executive_intelligence_metrics',
          [
            {
              workspaceId,
              ...metric,
              reportedAt: now,
              metadata: { seed: 'executive-suite-demo' },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const [existingScenario] = await queryInterface.sequelize.query(
        'SELECT id FROM executive_scenario_plans WHERE workspaceId = :workspaceId AND label = :label LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { workspaceId, label: scenarioLabel },
        },
      );

      let scenarioId = existingScenario?.id ?? null;
      if (!scenarioId) {
        const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
        await queryInterface.bulkInsert(
          'executive_scenario_plans',
          [
            {
              workspaceId,
              scenarioType: 'base',
              label: scenarioLabel,
              timeframeStart: start,
              timeframeEnd: end,
              revenue: 720000,
              grossMargin: 44.5,
              utilization: 79.2,
              pipelineVelocity: 31.5,
              clientSatisfaction: 61,
              netRetention: 109.2,
              notes: 'Grounded in weighted pipeline probability and known renewals.',
              assumptions: { drivers: ['Retainer renewals', 'Upsell of analytics pod'], seed: 'executive-suite-demo' },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
        const [insertedScenario] = await queryInterface.sequelize.query(
          'SELECT id FROM executive_scenario_plans WHERE workspaceId = :workspaceId AND label = :label LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { workspaceId, label: scenarioLabel },
          },
        );
        scenarioId = insertedScenario?.id ?? null;
      }

      if (scenarioId) {
        const breakdowns = [
          {
            dimensionType: 'client',
            dimensionKey: 'atlas-labs',
            dimensionLabel: 'Atlas Labs',
            revenue: 320000,
            grossMargin: 48.5,
            utilization: 82.5,
            pipelineVelocity: 29.5,
            clientSatisfaction: 64,
            owner: 'Account lead',
            highlight: 'Renewal signed with expansion.',
          },
          {
            dimensionType: 'service_line',
            dimensionKey: 'analytics',
            dimensionLabel: 'Analytics pod',
            revenue: 185000,
            grossMargin: 42.1,
            utilization: 75.4,
            pipelineVelocity: 33.1,
            clientSatisfaction: 59,
            owner: 'Operations lead',
            highlight: 'Monitoring bench to avoid utilisation drift.',
          },
        ];

        for (const breakdown of breakdowns) {
          const [existingBreakdown] = await queryInterface.sequelize.query(
            'SELECT id FROM executive_scenario_breakdowns WHERE scenarioId = :scenarioId AND dimensionKey = :dimensionKey LIMIT 1',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: { scenarioId, dimensionKey: breakdown.dimensionKey },
            },
          );
          if (existingBreakdown?.id) continue;
          await queryInterface.bulkInsert(
            'executive_scenario_breakdowns',
            [
              {
                scenarioId,
                ...breakdown,
                metadata: { seed: 'executive-suite-demo' },
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }
      }

      const [existingRisk] = await queryInterface.sequelize.query(
        'SELECT id FROM governance_risk_registers WHERE workspaceId = :workspaceId AND title = :title LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { workspaceId, title: riskTitle },
        },
      );
      if (!existingRisk?.id) {
        await queryInterface.bulkInsert(
          'governance_risk_registers',
          [
            {
              workspaceId,
              referenceCode: 'DEMO-RISK-001',
              title: riskTitle,
              category: 'compliance',
              status: 'monitoring',
              impactScore: 4.2,
              likelihoodScore: 2.8,
              mitigationPlan: 'Implement immutable audit log for escrow releases.',
              mitigationOwner: 'Finance Ops',
              mitigationStatus: 'In progress',
              targetResolutionDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
              nextReviewAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
              metadata: { seed: 'executive-suite-demo' },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const [existingAudit] = await queryInterface.sequelize.query(
        'SELECT id FROM governance_audit_exports WHERE workspaceId = :workspaceId AND downloadUrl LIKE :label LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { workspaceId, label: `%${auditLabel}%` },
        },
      );
      if (!existingAudit?.id) {
        await queryInterface.bulkInsert(
          'governance_audit_exports',
          [
            {
              workspaceId,
              exportType: 'controls_snapshot',
              status: 'available',
              notes: 'Demo export summarising controls and mitigations.',
              downloadUrl: `https://files.gigvora.example.com/exports/${auditLabel}.zip`,
              generatedAt: now,
              expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
              metadata: { seed: 'executive-suite-demo' },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [workspaceRow] = await queryInterface.sequelize.query(
        'SELECT id FROM provider_workspaces WHERE slug = :slug LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { slug: 'alliance-studio-hq' },
        },
      );
      const workspaceId = workspaceRow?.id ?? null;
      if (!workspaceId) return;

      await queryInterface.bulkDelete(
        'governance_audit_exports',
        { workspaceId, downloadUrl: { [Op.like]: `%${auditLabel}%` } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'governance_risk_registers',
        { workspaceId, title: riskTitle },
        { transaction },
      );

      const [scenarioRow] = await queryInterface.sequelize.query(
        'SELECT id FROM executive_scenario_plans WHERE workspaceId = :workspaceId AND label = :label LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { workspaceId, label: scenarioLabel },
        },
      );
      const scenarioId = scenarioRow?.id ?? null;
      if (scenarioId) {
        await queryInterface.bulkDelete(
          'executive_scenario_breakdowns',
          { scenarioId },
          { transaction },
        );
        await queryInterface.bulkDelete('executive_scenario_plans', { id: scenarioId }, { transaction });
      }

      await queryInterface.bulkDelete(
        'executive_intelligence_metrics',
        { workspaceId, name: { [Op.in]: metricNames } },
        { transaction },
      );
    });
  },
};
