'use strict';

const { resolveJsonType, safeRemoveIndex } = require('../utils/migrationHelpers.cjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'interview_panel_templates',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: { type: Sequelize.INTEGER, allowNull: false },
          roleName: { type: Sequelize.STRING(180), allowNull: false },
          stage: { type: Sequelize.STRING(120), allowNull: false },
          durationMinutes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 45 },
          competencies: { type: jsonType, allowNull: false, defaultValue: [] },
          rubric: { type: jsonType, allowNull: false, defaultValue: [] },
          instructions: { type: Sequelize.TEXT, allowNull: true },
          version: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
          lastUpdatedBy: { type: Sequelize.INTEGER, allowNull: true },
          lastUsedAt: { type: Sequelize.DATE, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          metadata: { type: jsonType, allowNull: true },
        },
        { transaction },
      );
      await queryInterface.addIndex('interview_panel_templates', ['workspaceId', 'roleName'], { transaction });
      await queryInterface.addIndex('interview_panel_templates', ['workspaceId', 'stage'], { transaction });

      await queryInterface.createTable(
        'interviewer_availabilities',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: { type: Sequelize.INTEGER, allowNull: false },
          interviewerId: { type: Sequelize.INTEGER, allowNull: true },
          interviewerName: { type: Sequelize.STRING(255), allowNull: true },
          timezone: { type: Sequelize.STRING(120), allowNull: true },
          availableFrom: { type: Sequelize.DATE, allowNull: false },
          availableTo: { type: Sequelize.DATE, allowNull: false },
          status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'available' },
          capacityHours: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );
      await queryInterface.addIndex('interviewer_availabilities', ['workspaceId', 'availableFrom'], { transaction });

      await queryInterface.createTable(
        'interview_reminders',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: { type: Sequelize.INTEGER, allowNull: false },
          interviewScheduleId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'interview_schedules', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          reminderType: { type: Sequelize.STRING(60), allowNull: false },
          sentAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          deliveryStatus: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'sent' },
          channel: { type: Sequelize.STRING(60), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );
      await queryInterface.addIndex('interview_reminders', ['workspaceId', 'sentAt'], { transaction });

      await queryInterface.createTable(
        'candidate_prep_portals',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: { type: Sequelize.INTEGER, allowNull: false },
          applicationId: { type: Sequelize.INTEGER, allowNull: true },
          candidateName: { type: Sequelize.STRING(255), allowNull: false },
          candidateEmail: { type: Sequelize.STRING(255), allowNull: true },
          stage: { type: Sequelize.STRING(120), allowNull: true },
          status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'active' },
          accessCode: { type: Sequelize.STRING(120), allowNull: true },
          resources: { type: jsonType, allowNull: true },
          forms: { type: jsonType, allowNull: true },
          visitCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          resourceViews: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          resourceTotal: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          formsCompleted: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          formsRequired: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          ndaRequired: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          ndaStatus: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'not_sent' },
          ndaSignedAt: { type: Sequelize.DATE, allowNull: true },
          lastAccessedAt: { type: Sequelize.DATE, allowNull: true },
          expiresAt: { type: Sequelize.DATE, allowNull: true },
          nextActionAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );
      await queryInterface.addIndex('candidate_prep_portals', ['workspaceId', 'status'], { transaction });

      await queryInterface.createTable(
        'interview_evaluations',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: { type: Sequelize.INTEGER, allowNull: false },
          applicationId: { type: Sequelize.INTEGER, allowNull: false },
          interviewScheduleId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'interview_schedules', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          templateId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'interview_panel_templates', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          interviewerId: { type: Sequelize.INTEGER, allowNull: true },
          interviewerName: { type: Sequelize.STRING(255), allowNull: true },
          stage: { type: Sequelize.STRING(120), allowNull: false },
          overallRecommendation: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'pending' },
          overallScore: { type: Sequelize.DECIMAL(4, 2), allowNull: true },
          rubricScores: { type: jsonType, allowNull: true },
          strengths: { type: Sequelize.TEXT, allowNull: true },
          risks: { type: Sequelize.TEXT, allowNull: true },
          anonymized: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          biasFlags: { type: jsonType, allowNull: true },
          submittedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );
      await queryInterface.addIndex('interview_evaluations', ['workspaceId', 'stage'], { transaction });
      await queryInterface.addIndex('interview_evaluations', ['workspaceId', 'submittedAt'], { transaction });

      await queryInterface.createTable(
        'evaluation_calibration_sessions',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: { type: Sequelize.INTEGER, allowNull: false },
          roleName: { type: Sequelize.STRING(180), allowNull: false },
          scheduledAt: { type: Sequelize.DATE, allowNull: false },
          completedAt: { type: Sequelize.DATE, allowNull: true },
          alignmentScore: { type: Sequelize.DECIMAL(4, 2), allowNull: true },
          participants: { type: jsonType, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );
      await queryInterface.addIndex('evaluation_calibration_sessions', ['workspaceId', 'scheduledAt'], { transaction });

      await queryInterface.createTable(
        'decision_trackers',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: { type: Sequelize.INTEGER, allowNull: false },
          applicationId: { type: Sequelize.INTEGER, allowNull: false },
          candidateName: { type: Sequelize.STRING(255), allowNull: true },
          status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'in_review' },
          decision: { type: Sequelize.STRING(40), allowNull: true },
          rationale: { type: Sequelize.TEXT, allowNull: true },
          packageDetails: { type: jsonType, allowNull: true },
          approvals: { type: jsonType, allowNull: true },
          openedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          decidedAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );
      await queryInterface.addIndex('decision_trackers', ['workspaceId', 'status'], { transaction });

      await queryInterface.createTable(
        'offer_packages',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: { type: Sequelize.INTEGER, allowNull: false },
          applicationId: { type: Sequelize.INTEGER, allowNull: true },
          candidateName: { type: Sequelize.STRING(255), allowNull: true },
          roleName: { type: Sequelize.STRING(180), allowNull: true },
          status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'draft' },
          approvalStatus: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'pending' },
          digitalSignatureStatus: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'not_sent' },
          backgroundCheckStatus: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'not_started' },
          packageValue: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          currency: { type: Sequelize.STRING(12), allowNull: false, defaultValue: 'USD' },
          startDate: { type: Sequelize.DATE, allowNull: true },
          expiresAt: { type: Sequelize.DATE, allowNull: true },
          version: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );
      await queryInterface.addIndex('offer_packages', ['workspaceId', 'status'], { transaction });

      await queryInterface.createTable(
        'onboarding_tasks',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: { type: Sequelize.INTEGER, allowNull: false },
          applicationId: { type: Sequelize.INTEGER, allowNull: true },
          category: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'general' },
          title: { type: Sequelize.STRING(255), allowNull: false },
          ownerId: { type: Sequelize.INTEGER, allowNull: true },
          ownerName: { type: Sequelize.STRING(255), allowNull: true },
          status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'not_started' },
          dueAt: { type: Sequelize.DATE, allowNull: true },
          completedAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );
      await queryInterface.addIndex('onboarding_tasks', ['workspaceId', 'status'], { transaction });

      await queryInterface.createTable(
        'candidate_care_tickets',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspaceId: { type: Sequelize.INTEGER, allowNull: false },
          applicationId: { type: Sequelize.INTEGER, allowNull: true },
          candidateName: { type: Sequelize.STRING(255), allowNull: true },
          type: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'support' },
          status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'open' },
          priority: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'medium' },
          inclusionCategory: { type: Sequelize.STRING(120), allowNull: true },
          openedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          firstRespondedAt: { type: Sequelize.DATE, allowNull: true },
          resolvedAt: { type: Sequelize.DATE, allowNull: true },
          escalatedAt: { type: Sequelize.DATE, allowNull: true },
          npsImpact: { type: Sequelize.INTEGER, allowNull: true },
          followUpDueAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );
      await queryInterface.addIndex('candidate_care_tickets', ['workspaceId', 'status'], { transaction });
      await queryInterface.addIndex('candidate_care_tickets', ['workspaceId', 'openedAt'], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await safeRemoveIndex(queryInterface, 'candidate_care_tickets', ['workspaceId', 'openedAt'], { transaction });
      await safeRemoveIndex(queryInterface, 'candidate_care_tickets', ['workspaceId', 'status'], { transaction });
      await safeRemoveIndex(queryInterface, 'onboarding_tasks', ['workspaceId', 'status'], { transaction });
      await safeRemoveIndex(queryInterface, 'offer_packages', ['workspaceId', 'status'], { transaction });
      await safeRemoveIndex(queryInterface, 'decision_trackers', ['workspaceId', 'status'], { transaction });
      await safeRemoveIndex(
        queryInterface,
        'evaluation_calibration_sessions',
        ['workspaceId', 'scheduledAt'],
        { transaction },
      );
      await safeRemoveIndex(queryInterface, 'interview_evaluations', ['workspaceId', 'submittedAt'], { transaction });
      await safeRemoveIndex(queryInterface, 'interview_evaluations', ['workspaceId', 'stage'], { transaction });
      await safeRemoveIndex(queryInterface, 'candidate_prep_portals', ['workspaceId', 'status'], { transaction });
      await safeRemoveIndex(queryInterface, 'interview_reminders', ['workspaceId', 'sentAt'], { transaction });
      await safeRemoveIndex(
        queryInterface,
        'interviewer_availabilities',
        ['workspaceId', 'availableFrom'],
        { transaction },
      );
      await safeRemoveIndex(queryInterface, 'interview_panel_templates', ['workspaceId', 'stage'], { transaction });
      await safeRemoveIndex(queryInterface, 'interview_panel_templates', ['workspaceId', 'roleName'], { transaction });

      await queryInterface.dropTable('candidate_care_tickets', { transaction });
      await queryInterface.dropTable('onboarding_tasks', { transaction });
      await queryInterface.dropTable('offer_packages', { transaction });
      await queryInterface.dropTable('decision_trackers', { transaction });
      await queryInterface.dropTable('evaluation_calibration_sessions', { transaction });
      await queryInterface.dropTable('interview_evaluations', { transaction });
      await queryInterface.dropTable('candidate_prep_portals', { transaction });
      await queryInterface.dropTable('interview_reminders', { transaction });
      await queryInterface.dropTable('interviewer_availabilities', { transaction });
      await queryInterface.dropTable('interview_panel_templates', { transaction });
    });
  },
};
