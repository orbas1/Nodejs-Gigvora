'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = Sequelize.JSONB ?? Sequelize.JSON;

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'career_pipeline_boards',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          name: { type: Sequelize.STRING(160), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          isPrimary: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          timezone: { type: Sequelize.STRING(120), allowNull: true },
          settings: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'career_pipeline_stages',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
          boardId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'career_pipeline_boards', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          key: { type: Sequelize.STRING(80), allowNull: false },
          name: { type: Sequelize.STRING(160), allowNull: false },
          position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          stageType: {
            type: Sequelize.ENUM('sourcing', 'applied', 'interview', 'offer', 'decision'),
            allowNull: false,
            defaultValue: 'applied',
          },
          outcomeCategory: {
            type: Sequelize.ENUM('open', 'won', 'lost', 'on_hold'),
            allowNull: false,
            defaultValue: 'open',
          },
          slaHours: { type: Sequelize.INTEGER, allowNull: true },
          exitCriteria: { type: jsonType, allowNull: true },
          checklistTemplate: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addConstraint('career_pipeline_stages', {
        type: 'unique',
        fields: ['boardId', 'key'],
        name: 'career_pipeline_stages_board_key_unique',
        transaction,
      });

      await queryInterface.createTable(
        'career_opportunities',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
          boardId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'career_pipeline_boards', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          stageId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'career_pipeline_stages', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          applicationId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'applications', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          companyName: { type: Sequelize.STRING(180), allowNull: false },
          location: { type: Sequelize.STRING(180), allowNull: true },
          salaryMin: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          salaryMax: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          salaryCurrency: { type: Sequelize.STRING(3), allowNull: true },
          stageEnteredAt: { type: Sequelize.DATE, allowNull: true },
          lastActivityAt: { type: Sequelize.DATE, allowNull: true },
          nextActionDueAt: { type: Sequelize.DATE, allowNull: true },
          followUpStatus: {
            type: Sequelize.ENUM('on_track', 'attention', 'overdue'),
            allowNull: false,
            defaultValue: 'on_track',
          },
          researchSummary: { type: Sequelize.TEXT, allowNull: true },
          researchLinks: { type: jsonType, allowNull: true },
          attachments: { type: jsonType, allowNull: true },
          collaboratorNotes: { type: Sequelize.TEXT, allowNull: true },
          complianceStatus: {
            type: Sequelize.ENUM('not_required', 'pending', 'complete', 'flagged'),
            allowNull: false,
            defaultValue: 'not_required',
          },
          equalOpportunityReport: { type: jsonType, allowNull: true },
          automationMetadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'career_opportunity_collaborators',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
          opportunityId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'career_opportunities', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          collaboratorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          collaboratorEmail: { type: Sequelize.STRING(180), allowNull: true },
          role: { type: Sequelize.STRING(120), allowNull: true },
          permissions: { type: jsonType, allowNull: true },
          invitedAt: { type: Sequelize.DATE, allowNull: true },
          joinedAt: { type: Sequelize.DATE, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'career_opportunity_nudges',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
          opportunityId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'career_opportunities', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          stageId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'career_pipeline_stages', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          severity: {
            type: Sequelize.ENUM('info', 'warning', 'critical'),
            allowNull: false,
            defaultValue: 'info',
          },
          channel: {
            type: Sequelize.ENUM('email', 'sms', 'slack', 'in_app'),
            allowNull: false,
            defaultValue: 'in_app',
          },
          message: { type: Sequelize.TEXT, allowNull: false },
          triggeredAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          dueAt: { type: Sequelize.DATE, allowNull: true },
          resolvedAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'career_candidate_briefs',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
          opportunityId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'career_opportunities', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          shareCode: { type: Sequelize.STRING(64), allowNull: false, unique: true },
          status: {
            type: Sequelize.ENUM('draft', 'shareable', 'archived'),
            allowNull: false,
            defaultValue: 'draft',
          },
          summary: { type: Sequelize.TEXT, allowNull: true },
          strengths: { type: jsonType, allowNull: true },
          collaborationNotes: { type: Sequelize.TEXT, allowNull: true },
          recipients: { type: jsonType, allowNull: true },
          attachments: { type: jsonType, allowNull: true },
          lastSharedAt: { type: Sequelize.DATE, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'career_interview_workspaces',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          opportunityId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'career_opportunities', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          interviewScheduleId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'interview_schedules', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          calendarEventId: { type: Sequelize.STRING(120), allowNull: true },
          status: {
            type: Sequelize.ENUM('planning', 'scheduled', 'in_progress', 'completed', 'archived'),
            allowNull: false,
            defaultValue: 'planning',
          },
          roomUrl: { type: Sequelize.STRING(255), allowNull: true },
          prepChecklist: { type: jsonType, allowNull: true },
          aiPrompts: { type: jsonType, allowNull: true },
          resources: { type: jsonType, allowNull: true },
          lastSyncedAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'career_interview_tasks',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'career_interview_workspaces', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          ownerId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(160), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          status: {
            type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'blocked'),
            allowNull: false,
            defaultValue: 'pending',
          },
          priority: {
            type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
            allowNull: false,
            defaultValue: 'medium',
          },
          dueAt: { type: Sequelize.DATE, allowNull: true },
          completedAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'career_interview_scorecards',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'career_interview_workspaces', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          interviewerId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          submittedAt: { type: Sequelize.DATE, allowNull: true },
          overallScore: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          competencies: { type: jsonType, allowNull: true },
          strengths: { type: jsonType, allowNull: true },
          concerns: { type: jsonType, allowNull: true },
          recommendation: {
            type: Sequelize.ENUM('advance', 'hold', 'reject', 'hire'),
            allowNull: false,
            defaultValue: 'hold',
          },
          notes: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'career_offer_packages',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          opportunityId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'career_opportunities', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          applicationId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'applications', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          status: {
            type: Sequelize.ENUM('draft', 'review', 'negotiating', 'accepted', 'declined', 'expired'),
            allowNull: false,
            defaultValue: 'draft',
          },
          decisionStatus: {
            type: Sequelize.ENUM('pending', 'accepted', 'declined', 'counter'),
            allowNull: false,
            defaultValue: 'pending',
          },
          totalCompValue: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
          baseSalary: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
          bonusTarget: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
          equityValue: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
          benefitsValue: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
          currencyCode: { type: Sequelize.STRING(3), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          scenarioModel: { type: jsonType, allowNull: true },
          legalArchiveUrl: { type: Sequelize.STRING(255), allowNull: true },
          documentsSummary: { type: jsonType, allowNull: true },
          decisionDeadline: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'career_offer_scenarios',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
          packageId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'career_offer_packages', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          label: { type: Sequelize.STRING(160), allowNull: false },
          baseSalary: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
          equityValue: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
          bonusValue: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
          benefitsValue: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
          totalValue: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
          assumptions: { type: jsonType, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'career_offer_documents',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
          packageId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'career_offer_packages', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          fileName: { type: Sequelize.STRING(200), allowNull: false },
          fileUrl: { type: Sequelize.STRING(500), allowNull: false },
          version: { type: Sequelize.STRING(40), allowNull: true },
          isSigned: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          signedAt: { type: Sequelize.DATE, allowNull: true },
          storedAt: { type: Sequelize.STRING(120), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'career_auto_apply_rules',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          name: { type: Sequelize.STRING(160), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          status: {
            type: Sequelize.ENUM('draft', 'sandbox', 'active', 'paused', 'retired'),
            allowNull: false,
            defaultValue: 'draft',
          },
          criteria: { type: jsonType, allowNull: true },
          guardrailConfig: { type: jsonType, allowNull: true },
          requiresManualReview: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          autoSendEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          sandboxMode: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          premiumRoleGuardrail: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          lastExecutedAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'career_auto_apply_test_runs',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
          ruleId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'career_auto_apply_rules', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          status: {
            type: Sequelize.ENUM('pending', 'running', 'passed', 'failed'),
            allowNull: false,
            defaultValue: 'pending',
          },
          executedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          evaluatedCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          matchesCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          autoSentCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          rejectionReasons: { type: jsonType, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          sampleSubmission: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'career_auto_apply_analytics',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
          ruleId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'career_auto_apply_rules', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          windowStart: { type: Sequelize.DATE, allowNull: false },
          windowEnd: { type: Sequelize.DATE, allowNull: false },
          submissions: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          conversions: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          rejections: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          manualReviews: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          rejectionReasons: { type: jsonType, allowNull: true },
          conversionSignals: { type: jsonType, allowNull: true },
          lastUpdatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const dropTable = (table) => queryInterface.dropTable(table, { transaction });

      await dropTable('career_auto_apply_analytics');
      await dropTable('career_auto_apply_test_runs');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_career_auto_apply_test_runs_status"', { transaction });
      await dropTable('career_auto_apply_rules');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_career_auto_apply_rules_status"', { transaction });

      await dropTable('career_offer_documents');
      await dropTable('career_offer_scenarios');
      await dropTable('career_offer_packages');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_career_offer_packages_status"', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_career_offer_packages_decisionStatus"', { transaction });

      await dropTable('career_interview_scorecards');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_career_interview_scorecards_recommendation"', { transaction });
      await dropTable('career_interview_tasks');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_career_interview_tasks_status"', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_career_interview_tasks_priority"', { transaction });
      await dropTable('career_interview_workspaces');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_career_interview_workspaces_status"', { transaction });

      await dropTable('career_candidate_briefs');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_career_candidate_briefs_status"', { transaction });

      await dropTable('career_opportunity_nudges');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_career_opportunity_nudges_severity"', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_career_opportunity_nudges_channel"', { transaction });

      await dropTable('career_opportunity_collaborators');
      await dropTable('career_opportunities');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_career_opportunities_followUpStatus"', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_career_opportunities_complianceStatus"', { transaction });

      await dropTable('career_pipeline_stages');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_career_pipeline_stages_stageType"', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_career_pipeline_stages_outcomeCategory"', { transaction });

      await dropTable('career_pipeline_boards');
    });
  },
};
