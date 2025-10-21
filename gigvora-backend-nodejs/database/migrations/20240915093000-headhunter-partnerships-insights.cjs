'use strict';

const { resolveJsonType, safeRemoveIndex } = require('../utils/migrationHelpers.cjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('client_engagements', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      clientName: { type: Sequelize.STRING(160), allowNull: false },
      clientCode: { type: Sequelize.STRING(60), allowNull: true },
      industry: { type: Sequelize.STRING(120), allowNull: true },
      retainerAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      retainerCurrency: { type: Sequelize.STRING(12), allowNull: false, defaultValue: 'USD' },
      retainerBillingCadence: { type: Sequelize.STRING(60), allowNull: true },
      successFeePercentage: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      successFeeTrigger: { type: Sequelize.STRING(160), allowNull: true },
      contractStatus: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'draft' },
      contractSignedAt: { type: Sequelize.DATE, allowNull: true },
      startDate: { type: Sequelize.DATE, allowNull: true },
      endDate: { type: Sequelize.DATE, allowNull: true },
      renewalDate: { type: Sequelize.DATE, allowNull: true },
      hiringMandates: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      activeMandates: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      accountingIntegration: { type: Sequelize.STRING(120), allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
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

    await queryInterface.createTable('client_engagement_mandates', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      engagementId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'client_engagements', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      title: { type: Sequelize.STRING(200), allowNull: false },
      roleLevel: { type: Sequelize.STRING(120), allowNull: true },
      location: { type: Sequelize.STRING(160), allowNull: true },
      status: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'active' },
      openRoles: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      filledRoles: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      pipelineValue: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      forecastRevenue: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      diversitySlatePct: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      qualityScore: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      avgTimeToSubmitDays: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      interviewToOfferDays: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      revenueRecognized: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      nextMilestoneAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.createTable('client_engagement_milestones', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      engagementId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'client_engagements', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      name: { type: Sequelize.STRING(200), allowNull: false },
      kind: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'milestone' },
      status: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'planned' },
      dueDate: { type: Sequelize.DATE, allowNull: true },
      completedAt: { type: Sequelize.DATE, allowNull: true },
      impactScore: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      summary: { type: Sequelize.TEXT, allowNull: true },
      details: { type: Sequelize.TEXT, allowNull: true },
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

    await queryInterface.createTable('client_engagement_portals', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      engagementId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'client_engagements', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      status: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'draft' },
      inviteCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      activeUsers: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      lastLoginAt: { type: Sequelize.DATE, allowNull: true },
      brandingTheme: { type: Sequelize.STRING(120), allowNull: true },
      primaryColor: { type: Sequelize.STRING(20), allowNull: true },
      secondaryColor: { type: Sequelize.STRING(20), allowNull: true },
      logoUrl: { type: Sequelize.STRING(500), allowNull: true },
      customDomain: { type: Sequelize.STRING(255), allowNull: true },
      autoReportFrequency: { type: Sequelize.STRING(60), allowNull: true },
      features: { type: jsonType, allowNull: true },
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

    await queryInterface.createTable('client_engagement_portal_audit_logs', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      portalId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'client_engagement_portals', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      eventType: { type: Sequelize.STRING(120), allowNull: false },
      actorType: { type: Sequelize.STRING(60), allowNull: true },
      actorName: { type: Sequelize.STRING(160), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      occurredAt: { type: Sequelize.DATE, allowNull: false },
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

    await queryInterface.createTable('engagement_invoices', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      engagementId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'client_engagements', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      invoiceNumber: { type: Sequelize.STRING(120), allowNull: false },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      currency: { type: Sequelize.STRING(12), allowNull: false, defaultValue: 'USD' },
      status: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'draft' },
      dueDate: { type: Sequelize.DATE, allowNull: true },
      issuedDate: { type: Sequelize.DATE, allowNull: true },
      paidDate: { type: Sequelize.DATE, allowNull: true },
      integrationProvider: { type: Sequelize.STRING(120), allowNull: true },
      integrationReference: { type: Sequelize.STRING(160), allowNull: true },
      lineItems: { type: jsonType, allowNull: true },
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

    await queryInterface.createTable('engagement_commission_splits', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      engagementId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'client_engagements', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      partnerName: { type: Sequelize.STRING(160), allowNull: false },
      percentage: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      status: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'pending' },
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

    await queryInterface.createTable('engagement_schedule_events', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      engagementId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'client_engagements', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      scope: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'personal' },
      eventType: { type: Sequelize.STRING(120), allowNull: false },
      title: { type: Sequelize.STRING(200), allowNull: false },
      startAt: { type: Sequelize.DATE, allowNull: false },
      endAt: { type: Sequelize.DATE, allowNull: true },
      location: { type: Sequelize.STRING(160), allowNull: true },
      visibility: { type: Sequelize.STRING(60), allowNull: true },
      hostName: { type: Sequelize.STRING(160), allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      attendees: { type: jsonType, allowNull: true },
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

    await queryInterface.createTable('issue_resolution_cases', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      engagementId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'client_engagements', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      caseType: { type: Sequelize.STRING(160), allowNull: false },
      status: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'open' },
      severity: { type: Sequelize.STRING(40), allowNull: true },
      priority: { type: Sequelize.STRING(40), allowNull: true },
      openedAt: { type: Sequelize.DATE, allowNull: false },
      resolvedAt: { type: Sequelize.DATE, allowNull: true },
      ownerName: { type: Sequelize.STRING(160), allowNull: true },
      playbookUsed: { type: Sequelize.STRING(160), allowNull: true },
      escalatedTo: { type: Sequelize.STRING(160), allowNull: true },
      outcome: { type: Sequelize.STRING(160), allowNull: true },
      summary: { type: Sequelize.TEXT, allowNull: true },
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

    await queryInterface.createTable('issue_resolution_events', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      caseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'issue_resolution_cases', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      eventType: { type: Sequelize.STRING(120), allowNull: false },
      actorName: { type: Sequelize.STRING(160), allowNull: true },
      note: { type: Sequelize.TEXT, allowNull: true },
      outcome: { type: Sequelize.STRING(160), allowNull: true },
      occurredAt: { type: Sequelize.DATE, allowNull: false },
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

    await queryInterface.addIndex('client_engagements', ['workspaceId']);
    await queryInterface.addIndex('client_engagements', ['workspaceId', 'contractStatus']);
    await queryInterface.addIndex('client_engagement_mandates', ['engagementId']);
    await queryInterface.addIndex('client_engagement_portals', ['engagementId', 'status']);
    await queryInterface.addIndex('engagement_invoices', ['engagementId', 'status']);
    await queryInterface.addIndex('engagement_schedule_events', ['workspaceId', 'scope']);
    await queryInterface.addIndex('engagement_schedule_events', ['startAt']);
    await queryInterface.addIndex('issue_resolution_cases', ['workspaceId', 'status']);
    await queryInterface.addIndex('issue_resolution_cases', ['openedAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await safeRemoveIndex(queryInterface, 'issue_resolution_cases', ['openedAt'], { transaction });
      await safeRemoveIndex(queryInterface, 'issue_resolution_cases', ['workspaceId', 'status'], { transaction });
      await safeRemoveIndex(queryInterface, 'engagement_schedule_events', ['startAt'], { transaction });
      await safeRemoveIndex(queryInterface, 'engagement_schedule_events', ['workspaceId', 'scope'], { transaction });
      await safeRemoveIndex(queryInterface, 'engagement_invoices', ['engagementId', 'status'], { transaction });
      await safeRemoveIndex(queryInterface, 'client_engagement_portals', ['engagementId', 'status'], { transaction });
      await safeRemoveIndex(queryInterface, 'client_engagement_mandates', ['engagementId'], { transaction });
      await safeRemoveIndex(queryInterface, 'client_engagements', ['workspaceId', 'contractStatus'], { transaction });
      await safeRemoveIndex(queryInterface, 'client_engagements', ['workspaceId'], { transaction });

      await queryInterface.dropTable('issue_resolution_events', { transaction });
      await queryInterface.dropTable('issue_resolution_cases', { transaction });
      await queryInterface.dropTable('engagement_schedule_events', { transaction });
      await queryInterface.dropTable('engagement_commission_splits', { transaction });
      await queryInterface.dropTable('engagement_invoices', { transaction });
      await queryInterface.dropTable('client_engagement_portal_audit_logs', { transaction });
      await queryInterface.dropTable('client_engagement_portals', { transaction });
      await queryInterface.dropTable('client_engagement_milestones', { transaction });
      await queryInterface.dropTable('client_engagement_mandates', { transaction });
      await queryInterface.dropTable('client_engagements', { transaction });
    });
  },
};
