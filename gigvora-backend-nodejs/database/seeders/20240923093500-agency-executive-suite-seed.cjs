'use strict';

const seedTag = 'agency_executive_suite_demo';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const [workspaceRows] = await queryInterface.sequelize.query(
        'SELECT id, ownerId FROM provider_workspaces ORDER BY id ASC LIMIT 1',
        { transaction },
      );

      if (!workspaceRows.length) {
        await transaction.commit();
        return;
      }

      const workspaceId = workspaceRows[0].id;
      const now = new Date();

      const [existingMetrics] = await queryInterface.sequelize.query(
        'SELECT id FROM executive_intelligence_metrics WHERE workspaceId = :workspaceId LIMIT 1',
        { transaction, replacements: { workspaceId } },
      );

      if (existingMetrics.length) {
        await transaction.commit();
        return;
      }

      const reportingPeriodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const reportingPeriodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));

      await queryInterface.bulkInsert(
        'executive_intelligence_metrics',
        [
          {
            workspaceId,
            category: 'financial',
            name: 'Revenue run-rate',
            description: 'Projected recurring revenue pace for the current quarter.',
            value: 187500,
            unit: 'currency',
            changeValue: 21500,
            changeUnit: 'currency',
            trend: 'up',
            comparisonPeriod: 'vs last quarter',
            reportedAt: now,
            metadata: JSON.stringify({ metricKey: 'revenue_run_rate', currency: 'USD', seed: seedTag }),
            createdAt: now,
            updatedAt: now,
          },
          {
            workspaceId,
            category: 'financial',
            name: 'Gross margin',
            description: 'Blended delivery margin across active retainers and projects.',
            value: 46.2,
            unit: 'percentage',
            changeValue: 4.1,
            changeUnit: 'percentage',
            trend: 'up',
            comparisonPeriod: 'vs 90-day average',
            reportedAt: now,
            metadata: JSON.stringify({ metricKey: 'gross_margin', target: 45, seed: seedTag }),
            createdAt: now,
            updatedAt: now,
          },
          {
            workspaceId,
            category: 'talent',
            name: 'Utilization rate',
            description: 'Average billable utilisation across delivery squads.',
            value: 78.4,
            unit: 'percentage',
            changeValue: -1.2,
            changeUnit: 'percentage',
            trend: 'down',
            comparisonPeriod: 'vs prior month',
            reportedAt: now,
            metadata: JSON.stringify({ metricKey: 'utilization_rate', target: 80, seed: seedTag }),
            createdAt: now,
            updatedAt: now,
          },
          {
            workspaceId,
            category: 'client',
            name: 'Pipeline velocity',
            description: 'Average days from discovery to signed agreement.',
            value: 32.5,
            unit: 'duration',
            changeValue: -6.3,
            changeUnit: 'duration',
            trend: 'up',
            comparisonPeriod: 'vs trailing quarter',
            reportedAt: now,
            metadata: JSON.stringify({ metricKey: 'pipeline_velocity', unitLabel: 'days', seed: seedTag }),
            createdAt: now,
            updatedAt: now,
          },
          {
            workspaceId,
            category: 'client',
            name: 'Client satisfaction (NPS)',
            description: 'Rolling 90-day NPS across strategic accounts.',
            value: 62,
            unit: 'score',
            changeValue: 3,
            changeUnit: 'score',
            trend: 'up',
            comparisonPeriod: 'vs prior survey',
            reportedAt: now,
            metadata: JSON.stringify({ metricKey: 'client_satisfaction', seed: seedTag }),
            createdAt: now,
            updatedAt: now,
          },
          {
            workspaceId,
            category: 'compliance',
            name: 'Policy adherence index',
            description: 'Weighted score of policy attestations and control evidence.',
            value: 93.4,
            unit: 'score',
            changeValue: 1.8,
            changeUnit: 'score',
            trend: 'up',
            comparisonPeriod: 'vs prior audit window',
            reportedAt: now,
            metadata: JSON.stringify({ metricKey: 'policy_adherence', seed: seedTag }),
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'executive_scenario_plans',
        [
          {
            workspaceId,
            scenarioType: 'base',
            label: 'Base case Q4 forecast',
            timeframeStart: reportingPeriodStart,
            timeframeEnd: reportingPeriodEnd,
            revenue: 720000,
            grossMargin: 44.5,
            utilization: 79.2,
            pipelineVelocity: 31.5,
            clientSatisfaction: 61,
            netRetention: 109.2,
            notes: 'Grounded in weighted pipeline probability and known renewals.',
            assumptions: JSON.stringify({
              drivers: ['Retainer renewals', 'Upsell of analytics pod'],
              seed: seedTag,
            }),
            createdAt: now,
            updatedAt: now,
          },
          {
            workspaceId,
            scenarioType: 'best',
            label: 'Best case Q4 forecast',
            timeframeStart: reportingPeriodStart,
            timeframeEnd: reportingPeriodEnd,
            revenue: 845000,
            grossMargin: 48.2,
            utilization: 83.5,
            pipelineVelocity: 28.4,
            clientSatisfaction: 66,
            netRetention: 116.8,
            notes: 'Assumes accelerated close of enterprise design transformation program.',
            assumptions: JSON.stringify({ drivers: ['Enterprise design win', 'Reduced churn'], seed: seedTag }),
            createdAt: now,
            updatedAt: now,
          },
          {
            workspaceId,
            scenarioType: 'worst',
            label: 'Downside Q4 scenario',
            timeframeStart: reportingPeriodStart,
            timeframeEnd: reportingPeriodEnd,
            revenue: 598000,
            grossMargin: 39.6,
            utilization: 72.1,
            pipelineVelocity: 36.8,
            clientSatisfaction: 55,
            netRetention: 97.4,
            notes: 'Stress scenario if two SaaS retainer renewals slip into next year.',
            assumptions: JSON.stringify({ drivers: ['Delayed renewals', 'Bench expansion'], seed: seedTag }),
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      const [scenarioPlans] = await queryInterface.sequelize.query(
        'SELECT id, scenarioType FROM executive_scenario_plans WHERE workspaceId = :workspaceId',
        { transaction, replacements: { workspaceId } },
      );

      const scenarioIdByType = Object.fromEntries(
        scenarioPlans.map((plan) => [plan.scenarioType, plan.id]),
      );

      await queryInterface.bulkInsert(
        'executive_scenario_breakdowns',
        [
          {
            scenarioId: scenarioIdByType.base,
            dimensionType: 'client',
            dimensionKey: 'acme-financial',
            dimensionLabel: 'Acme Financial',
            revenue: 210000,
            grossMargin: 47.8,
            utilization: 81.1,
            pipelineVelocity: 29.5,
            clientSatisfaction: 64,
            owner: 'Account: Priya Patel',
            highlight: 'Renewal expansion approved by CFO',
            metadata: JSON.stringify({ seed: seedTag }),
            createdAt: now,
            updatedAt: now,
          },
          {
            scenarioId: scenarioIdByType.base,
            dimensionType: 'service_line',
            dimensionKey: 'brand-strategy',
            dimensionLabel: 'Brand Strategy',
            revenue: 156000,
            grossMargin: 51.3,
            utilization: 76.5,
            pipelineVelocity: 33.1,
            clientSatisfaction: 68,
            owner: 'Practice: Maya Rivera',
            highlight: 'New hospitality retainer onboarding in week 3',
            metadata: JSON.stringify({ seed: seedTag }),
            createdAt: now,
            updatedAt: now,
          },
          {
            scenarioId: scenarioIdByType.base,
            dimensionType: 'squad',
            dimensionKey: 'growth-pod-alpha',
            dimensionLabel: 'Growth Pod Alpha',
            revenue: 94000,
            grossMargin: 43.2,
            utilization: 82.4,
            pipelineVelocity: 27.9,
            clientSatisfaction: 60,
            owner: 'Squad lead: James Lee',
            highlight: 'Launching predictive insights dashboard sprint 2',
            metadata: JSON.stringify({ seed: seedTag }),
            createdAt: now,
            updatedAt: now,
          },
          {
            scenarioId: scenarioIdByType.base,
            dimensionType: 'individual',
            dimensionKey: 'freelancer-ana',
            dimensionLabel: 'Ana Gomez',
            revenue: 42000,
            grossMargin: 58.1,
            utilization: 88.5,
            pipelineVelocity: 24.2,
            clientSatisfaction: 71,
            owner: 'Capability: Lifecycle marketing',
            highlight: 'Leading GTM playbook for fintech launch',
            metadata: JSON.stringify({ seed: seedTag }),
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'governance_risk_registers',
        [
          {
            workspaceId,
            referenceCode: 'R-021',
            title: 'SOC 2 evidence gap for analytics pipeline',
            category: 'compliance',
            status: 'monitoring',
            impactScore: 4.4,
            likelihoodScore: 2.8,
            mitigationPlan: 'Complete redacted log export and partner attestation review.',
            mitigationOwner: 'Security & Compliance',
            mitigationStatus: 'Evidence in progress',
            targetResolutionDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
            nextReviewAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            metadata: JSON.stringify({ seed: seedTag, severity: 'medium' }),
            createdAt: now,
            updatedAt: now,
          },
          {
            workspaceId,
            referenceCode: 'R-037',
            title: 'High dependency on single delivery pod',
            category: 'talent',
            status: 'open',
            impactScore: 3.8,
            likelihoodScore: 3.6,
            mitigationPlan: 'Cross-train growth pod beta and add reserve contractor bench.',
            mitigationOwner: 'Operations',
            mitigationStatus: 'Mitigation underway',
            targetResolutionDate: new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000),
            nextReviewAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
            metadata: JSON.stringify({ seed: seedTag, heatmap: 'amber' }),
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'governance_audit_exports',
        [
          {
            workspaceId,
            exportType: 'client_audit_pack',
            status: 'available',
            requestedBy: 'Atlas Ventures',
            generatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
            fileUrl: 'https://files.gigvora.test/audit/client-pack-q3.pdf',
            recipients: JSON.stringify(['cfo@atlasventures.com', 'program-lead@gigvora.com']),
            scope: JSON.stringify({
              documents: ['MSA', 'NDA', 'Insurance'],
              evidenceWindow: 'Q3 2024',
              seed: seedTag,
            }),
            notes: 'Includes SOC 2 bridge letter and updated incident response plan.',
            createdAt: now,
            updatedAt: now,
          },
          {
            workspaceId,
            exportType: 'regulator_compliance',
            status: 'available',
            requestedBy: 'EU Digital Services Oversight',
            generatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
            fileUrl: 'https://files.gigvora.test/audit/regulator-pack.zip',
            recipients: JSON.stringify(['audits@gigvora.com']),
            scope: JSON.stringify({
              frameworks: ['GDPR', 'AI Act readiness'],
              seed: seedTag,
            }),
            notes: 'Prepared for proactive quarterly disclosure.',
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'leadership_rituals',
        [
          {
            workspaceId,
            name: 'Executive Monday huddle',
            cadence: 'weekly',
            facilitator: 'Ava Founder',
            channel: 'Zoom',
            nextSessionAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
            summary: '90-minute kickoff focused on metrics pulse, risk review, and bets.',
            attendees: JSON.stringify(['CEO', 'COO', 'Head of Delivery', 'Head of Talent']),
            lastSummaryUrl: 'https://docs.gigvora.test/briefings/executive-huddle',
            createdAt: now,
            updatedAt: now,
          },
          {
            workspaceId,
            name: 'Compliance control desk',
            cadence: 'biweekly',
            facilitator: 'Noah Compliance',
            channel: 'Async in Notion',
            nextSessionAt: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
            summary: 'Asynchronous checkpoint for policy attestations and vendor evidence.',
            attendees: JSON.stringify(['Compliance', 'Finance', 'Delivery Ops']),
            lastSummaryUrl: 'https://docs.gigvora.test/briefings/compliance-control',
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'leadership_okrs',
        [
          {
            workspaceId,
            objective: 'Lift strategic retainers to $1M ARR by Q4',
            owner: 'COO',
            status: 'on_track',
            progress: 64.5,
            confidence: 78.2,
            targetDate: reportingPeriodEnd,
            alignment: 'Revenue & GTM',
            keyResults: JSON.stringify([
              'Close 3 enterprise renewals with expansion',
              'Launch innovation lab upsell offers',
              'Stabilise delivery margin above 45%',
            ]),
            createdAt: now,
            updatedAt: now,
          },
          {
            workspaceId,
            objective: 'Achieve 95% compliance attestations on critical controls',
            owner: 'Head of Compliance',
            status: 'at_risk',
            progress: 52.3,
            confidence: 61.4,
            targetDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
            alignment: 'Trust & Safety',
            keyResults: JSON.stringify([
              'Automate SOC 2 evidence uploads',
              'Complete vendor risk backlog',
              'Deliver security tabletop with leadership',
            ]),
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'leadership_decisions',
        [
          {
            workspaceId,
            title: 'Approve dedicated analytics guild',
            status: 'implemented',
            decidedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
            owner: 'COO',
            impactArea: 'Delivery',
            followUpAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
            summary: 'Spin up cross-functional analytics guild to reduce onboarding time.',
            links: JSON.stringify([
              'https://docs.gigvora.test/decisions/analytics-guild',
              'https://app.gigvora.test/projects/analytics-guild',
            ]),
            createdAt: now,
            updatedAt: now,
          },
          {
            workspaceId,
            title: 'Pause low-margin paid media engagements',
            status: 'approved',
            decidedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
            owner: 'Head of Delivery',
            impactArea: 'Margin',
            followUpAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
            summary: 'Shift team capacity to high-growth lifecycle programs.',
            links: JSON.stringify(['https://docs.gigvora.test/decisions/paid-media-shift']),
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'leadership_briefing_packs',
        [
          {
            workspaceId,
            title: 'Executive Monday digest',
            focus: 'Revenue, retention, compliance',
            status: 'circulating',
            distributionDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
            preparedBy: 'Chief of Staff',
            summary: 'Highlights net new ARR, risk mitigation progress, and innovation portfolio.',
            resourceUrl: 'https://docs.gigvora.test/briefings/monday-digest',
            highlights: JSON.stringify([
              'Revenue beat plan by 6%',
              'SOC 2 evidence gap narrowed to 3 controls',
              'Innovation lab shortlisted 4 pilot initiatives',
            ]),
            createdAt: now,
            updatedAt: now,
          },
          {
            workspaceId,
            title: 'Leadership async decision pack',
            focus: 'Strategic bets',
            status: 'draft',
            distributionDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
            preparedBy: 'Strategy Lead',
            summary: 'Pre-reads covering productised services roadmap and funding runway.',
            resourceUrl: 'https://docs.gigvora.test/briefings/decision-pack',
            highlights: JSON.stringify([
              'Market analysis on AI enablement offers',
              'Proposed ROI of incubator program expansion',
            ]),
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      const [projectRows] = await queryInterface.sequelize.query(
        'SELECT id, title FROM projects ORDER BY updatedAt DESC LIMIT 2',
        { transaction },
      );
      const associatedProjectId = projectRows.length ? projectRows[0].id : null;

      await queryInterface.bulkInsert(
        'leadership_strategic_bets',
        [
          {
            workspaceId,
            projectId: associatedProjectId,
            name: 'AI enablement playbooks',
            thesis: 'Package AI strategy and governance advisory into repeatable modules.',
            owner: 'Head of Innovation',
            status: 'active',
            progress: 48.5,
            impactScore: 8.2,
            successMetric: 'Attach rate on enterprise proposals',
            lastReviewedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
            metadata: JSON.stringify({
              seed: seedTag,
              linkedProjectTitle: projectRows.length ? projectRows[0].title : null,
            }),
            createdAt: now,
            updatedAt: now,
          },
          {
            workspaceId,
            projectId: projectRows.length > 1 ? projectRows[1].id : associatedProjectId,
            name: 'Managed analytics command centre',
            thesis: 'Launch dedicated analytics war room for subscription clients.',
            owner: 'COO',
            status: 'planning',
            progress: 32.0,
            impactScore: 7.4,
            successMetric: 'Net retention uplift',
            lastReviewedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
            metadata: JSON.stringify({ seed: seedTag }),
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'innovation_initiatives',
        [
          {
            workspaceId,
            name: 'Innovation lab – Data storytelling pod',
            category: 'service_line',
            stage: 'validation',
            priority: 'high',
            priorityScore: 82.5,
            sponsor: 'Chief Strategy Officer',
            summary: 'Incubator pod pairing creatives and analysts to prototype executive dashboards.',
            eta: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
            confidence: 71.2,
            projectedRoi: 142.0,
            roiCurrency: 'USD',
            tags: JSON.stringify(['dashboarding', 'executive', 'pilot', seedTag]),
            createdAt: now,
            updatedAt: now,
          },
          {
            workspaceId,
            name: 'Automation toolbox for compliance',
            category: 'process',
            stage: 'pilot',
            priority: 'medium',
            priorityScore: 68.0,
            sponsor: 'Head of Compliance',
            summary: 'Automation suite to collect attestations and schedule audit exports.',
            eta: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
            confidence: 64.5,
            projectedRoi: 88.0,
            roiCurrency: 'USD',
            tags: JSON.stringify(['automation', 'compliance', seedTag]),
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      const [initiativeRows] = await queryInterface.sequelize.query(
        'SELECT id, name FROM innovation_initiatives WHERE workspaceId = :workspaceId',
        { transaction, replacements: { workspaceId } },
      );

      const storytellingInitiativeId = initiativeRows.find((row) => row.name.includes('Data storytelling'))?.id;
      const automationInitiativeId = initiativeRows.find((row) => row.name.includes('Automation toolbox'))?.id;

      await queryInterface.bulkInsert(
        'innovation_funding_events',
        [
          {
            initiativeId: storytellingInitiativeId,
            workspaceId,
            eventType: 'allocation',
            amount: 120000,
            currency: 'USD',
            recordedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
            owner: 'Finance',
            description: 'Allocated annual innovation budget to storytelling pod.',
            roiSnapshot: 135.0,
            metadata: JSON.stringify({ seed: seedTag }),
            createdAt: now,
            updatedAt: now,
          },
          {
            initiativeId: storytellingInitiativeId,
            workspaceId,
            eventType: 'burn',
            amount: 42000,
            currency: 'USD',
            recordedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
            owner: 'Innovation PMO',
            description: 'Sprint two contractor fees and tooling costs.',
            roiSnapshot: 128.0,
            metadata: JSON.stringify({ seed: seedTag }),
            createdAt: now,
            updatedAt: now,
          },
          {
            initiativeId: automationInitiativeId,
            workspaceId,
            eventType: 'allocation',
            amount: 65000,
            currency: 'USD',
            recordedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
            owner: 'Finance',
            description: 'Seed funding for compliance automation tooling.',
            roiSnapshot: 92.0,
            metadata: JSON.stringify({ seed: seedTag }),
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'collaboration_spaces',
        [
          {
            ownerId: workspaceRows[0].ownerId,
            profileId: null,
            name: 'Leadership command centre',
            clientName: null,
            summary: 'Dedicated room for executive rituals, decision logs, and async packs.',
            status: 'active',
            defaultPermission: 'edit',
            meetingCadence: 'Weekly sync',
            metadata: JSON.stringify({
              useCase: 'leadership_governance',
              seed: seedTag,
              linkedWorkspaceId: workspaceId,
            }),
            createdAt: now,
            updatedAt: now,
          },
          {
            ownerId: workspaceRows[0].ownerId,
            profileId: null,
            name: 'Compliance review room',
            clientName: null,
            summary: 'Collaboration room for policy refresh, risk mitigation, and evidence.',
            status: 'active',
            defaultPermission: 'comment',
            meetingCadence: 'Biweekly async',
            metadata: JSON.stringify({ useCase: 'leadership_governance', seed: seedTag, linkedWorkspaceId: workspaceId }),
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'compliance_documents',
        [
          {
            ownerId: workspaceRows[0].ownerId,
            workspaceId,
            title: 'Master services agreement – Atlas Ventures',
            documentType: 'contract',
            status: 'active',
            storageProvider: 's3',
            storagePath: 'compliance/docs/msa-atlas.pdf',
            storageRegion: 'us-east-1',
            latestVersionId: null,
            counterpartyName: 'Atlas Ventures',
            counterpartyEmail: 'legal@atlasventures.com',
            counterpartyCompany: 'Atlas Ventures',
            jurisdiction: 'USA',
            governingLaw: 'Delaware',
            effectiveDate: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000),
            expiryDate: new Date(now.getTime() + 240 * 24 * 60 * 60 * 1000),
            renewalTerms: 'Auto-renews annually',
            tags: JSON.stringify(['msa', 'strategic', seedTag]),
            metadata: JSON.stringify({ seed: seedTag }),
            obligationSummary: 'Quarterly reporting obligations and security posture attestations.',
            createdAt: now,
            updatedAt: now,
          },
          {
            ownerId: workspaceRows[0].ownerId,
            workspaceId,
            title: 'Professional liability insurance certificate',
            documentType: 'insurance',
            status: 'active',
            storageProvider: 's3',
            storagePath: 'compliance/docs/insurance-2024.pdf',
            storageRegion: 'us-east-1',
            latestVersionId: null,
            counterpartyName: 'Global Shield',
            counterpartyEmail: 'broker@globalshield.com',
            counterpartyCompany: 'Global Shield',
            jurisdiction: 'USA',
            governingLaw: null,
            effectiveDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
            expiryDate: new Date(now.getTime() + 305 * 24 * 60 * 60 * 1000),
            renewalTerms: 'Annual renewal with automatic reminders',
            tags: JSON.stringify(['insurance', seedTag]),
            metadata: JSON.stringify({ seed: seedTag }),
            obligationSummary: 'Coverage confirmation for clients and partners.',
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      const [documentRows] = await queryInterface.sequelize.query(
        'SELECT id, title FROM compliance_documents WHERE workspaceId = :workspaceId AND metadata::text LIKE :seed',
        {
          transaction,
          replacements: { workspaceId, seed: `%${seedTag}%` },
        },
      );

      const msaDocumentId = documentRows.find((row) => row.title.includes('Master services'))?.id;
      const insuranceDocumentId = documentRows.find((row) => row.title.includes('insurance'))?.id;

      await queryInterface.bulkInsert(
        'compliance_obligations',
        [
          {
            documentId: msaDocumentId,
            clauseReference: 'Section 7.2',
            description: 'Provide quarterly performance and security report to Atlas Ventures.',
            status: 'in_progress',
            dueAt: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
            completedAt: null,
            assigneeId: null,
            priority: 'high',
            escalations: JSON.stringify([{
              when: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
              to: 'Head of Delivery',
            }]),
            metadata: JSON.stringify({ seed: seedTag }),
            lastNotifiedAt: null,
            createdAt: now,
            updatedAt: now,
          },
          {
            documentId: insuranceDocumentId,
            clauseReference: 'Renewal notice',
            description: 'Send insurance certificate renewal confirmation to enterprise clients.',
            status: 'open',
            dueAt: new Date(now.getTime() + 150 * 24 * 60 * 60 * 1000),
            completedAt: null,
            assigneeId: null,
            priority: 'medium',
            escalations: JSON.stringify([]),
            metadata: JSON.stringify({ seed: seedTag }),
            lastNotifiedAt: null,
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'compliance_reminders',
        [
          {
            documentId: msaDocumentId,
            reminderType: 'email',
            status: 'scheduled',
            sendAt: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
            payload: JSON.stringify({ recipient: 'legal@atlasventures.com', seed: seedTag }),
            metadata: JSON.stringify({ seed: seedTag }),
            createdAt: now,
            updatedAt: now,
          },
          {
            documentId: insuranceDocumentId,
            reminderType: 'email',
            status: 'scheduled',
            sendAt: new Date(now.getTime() + 300 * 24 * 60 * 60 * 1000),
            payload: JSON.stringify({ recipient: 'finance@gigvora.com', seed: seedTag }),
            metadata: JSON.stringify({ seed: seedTag }),
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const { Op } = Sequelize;

    try {
      const [workspaceRows] = await queryInterface.sequelize.query(
        'SELECT id, ownerId FROM provider_workspaces ORDER BY id ASC LIMIT 1',
        { transaction },
      );

      if (workspaceRows.length) {
        const workspaceId = workspaceRows[0].id;

        const documentTitles = [
          'Master services agreement – Atlas Ventures',
          'Professional liability insurance certificate',
        ];
        const [documentRows] = await queryInterface.sequelize.query(
          'SELECT id FROM compliance_documents WHERE workspaceId = :workspaceId AND title = ANY(:titles)',
          {
            transaction,
            replacements: { workspaceId, titles: documentTitles },
          },
        );
        const documentIds = documentRows.map((row) => row.id);

        if (documentIds.length) {
          await queryInterface.bulkDelete(
            'compliance_reminders',
            { documentId: { [Op.in]: documentIds }, sendAt: { [Op.ne]: null } },
            { transaction },
          );

          await queryInterface.bulkDelete(
            'compliance_obligations',
            { documentId: { [Op.in]: documentIds }, clauseReference: { [Op.in]: ['Section 7.2', 'Renewal notice'] } },
            { transaction },
          );
        }

        await queryInterface.bulkDelete(
          'compliance_documents',
          { workspaceId, title: { [Op.in]: documentTitles } },
          { transaction },
        );

        await queryInterface.bulkDelete(
          'collaboration_spaces',
          { ownerId: workspaceRows[0].ownerId, name: { [Op.in]: ['Leadership command centre', 'Compliance review room'] } },
          { transaction },
        );

        const initiativeNames = [
          'Innovation lab – Data storytelling pod',
          'Automation toolbox for compliance',
        ];
        const [initiativeRows] = await queryInterface.sequelize.query(
          'SELECT id FROM innovation_initiatives WHERE workspaceId = :workspaceId AND name = ANY(:names)',
          { transaction, replacements: { workspaceId, names: initiativeNames } },
        );
        const initiativeIds = initiativeRows.map((row) => row.id);

        if (initiativeIds.length) {
          await queryInterface.bulkDelete(
            'innovation_funding_events',
            { initiativeId: { [Op.in]: initiativeIds } },
            { transaction },
          );
        }

        await queryInterface.bulkDelete(
          'innovation_initiatives',
          { workspaceId, name: { [Op.in]: initiativeNames } },
          { transaction },
        );

        await queryInterface.bulkDelete(
          'leadership_strategic_bets',
          {
            workspaceId,
            name: { [Op.in]: ['AI enablement playbooks', 'Managed analytics command centre'] },
          },
          { transaction },
        );

        await queryInterface.bulkDelete(
          'leadership_briefing_packs',
          {
            workspaceId,
            title: { [Op.in]: ['Executive Monday digest', 'Leadership async decision pack'] },
          },
          { transaction },
        );

        await queryInterface.bulkDelete(
          'leadership_decisions',
          {
            workspaceId,
            title: { [Op.in]: ['Approve dedicated analytics guild', 'Pause low-margin paid media engagements'] },
          },
          { transaction },
        );

        await queryInterface.bulkDelete(
          'leadership_okrs',
          {
            workspaceId,
            objective: {
              [Op.in]: [
                'Lift strategic retainers to $1M ARR by Q4',
                'Achieve 95% compliance attestations on critical controls',
              ],
            },
          },
          { transaction },
        );

        await queryInterface.bulkDelete(
          'leadership_rituals',
          {
            workspaceId,
            name: { [Op.in]: ['Executive Monday huddle', 'Compliance control desk'] },
          },
          { transaction },
        );

        await queryInterface.bulkDelete(
          'governance_audit_exports',
          {
            workspaceId,
            exportType: { [Op.in]: ['client_audit_pack', 'regulator_compliance'] },
          },
          { transaction },
        );

        await queryInterface.bulkDelete(
          'governance_risk_registers',
          {
            workspaceId,
            referenceCode: { [Op.in]: ['R-021', 'R-037'] },
          },
          { transaction },
        );

        const scenarioLabels = [
          'Base case Q4 forecast',
          'Best case Q4 forecast',
          'Downside Q4 scenario',
        ];

        const [scenarioRows] = await queryInterface.sequelize.query(
          'SELECT id FROM executive_scenario_plans WHERE workspaceId = :workspaceId AND label = ANY(:labels)',
          { transaction, replacements: { workspaceId, labels: scenarioLabels } },
        );
        const scenarioIds = scenarioRows.map((row) => row.id);

        if (scenarioIds.length) {
          await queryInterface.bulkDelete(
            'executive_scenario_breakdowns',
            { scenarioId: { [Op.in]: scenarioIds } },
            { transaction },
          );
        }

        await queryInterface.bulkDelete(
          'executive_scenario_plans',
          { workspaceId, label: { [Op.in]: scenarioLabels } },
          { transaction },
        );

        await queryInterface.bulkDelete(
          'executive_intelligence_metrics',
          {
            workspaceId,
            name: {
              [Op.in]: [
                'Revenue run-rate',
                'Gross margin',
                'Utilization rate',
                'Pipeline velocity',
                'Client satisfaction (NPS)',
                'Policy adherence index',
              ],
            },
          },
          { transaction },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
