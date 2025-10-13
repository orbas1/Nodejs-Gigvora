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

    await queryInterface.createTable('hiring_alerts', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
      },
      category: { type: Sequelize.STRING(80), allowNull: false },
      severity: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'medium',
      },
      status: {
        type: Sequelize.ENUM('open', 'acknowledged', 'resolved'),
        allowNull: false,
        defaultValue: 'open',
      },
      message: { type: Sequelize.TEXT, allowNull: false },
      detectedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      resolvedAt: { type: Sequelize.DATE, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('hiring_alerts', ['workspaceId']);
    await queryInterface.addIndex('hiring_alerts', ['severity']);
    await queryInterface.addIndex('hiring_alerts', ['status']);

    await queryInterface.createTable('candidate_demographic_snapshots', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
      },
      applicationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'applications', key: 'id' },
        onDelete: 'CASCADE',
      },
      genderIdentity: { type: Sequelize.STRING(120), allowNull: true },
      ethnicity: { type: Sequelize.STRING(180), allowNull: true },
      veteranStatus: { type: Sequelize.STRING(120), allowNull: true },
      disabilityStatus: { type: Sequelize.STRING(120), allowNull: true },
      seniorityLevel: { type: Sequelize.STRING(120), allowNull: true },
      locationRegion: { type: Sequelize.STRING(180), allowNull: true },
      capturedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      metadata: { type: jsonType, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('candidate_demographic_snapshots', ['workspaceId']);
    await queryInterface.addIndex('candidate_demographic_snapshots', ['applicationId']);
    await queryInterface.addIndex('candidate_demographic_snapshots', ['capturedAt']);

    await queryInterface.createTable('candidate_satisfaction_surveys', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
      },
      applicationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'applications', key: 'id' },
        onDelete: 'SET NULL',
      },
      stage: { type: Sequelize.STRING(80), allowNull: true },
      score: { type: Sequelize.INTEGER, allowNull: true },
      npsRating: { type: Sequelize.INTEGER, allowNull: true },
      sentiment: { type: Sequelize.STRING(40), allowNull: true },
      followUpScheduledAt: { type: Sequelize.DATE, allowNull: true },
      responseAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      notes: { type: Sequelize.TEXT, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('candidate_satisfaction_surveys', ['workspaceId']);
    await queryInterface.addIndex('candidate_satisfaction_surveys', ['applicationId']);
    await queryInterface.addIndex('candidate_satisfaction_surveys', ['responseAt']);

    await queryInterface.createTable('interview_schedules', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
      },
      applicationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'applications', key: 'id' },
        onDelete: 'CASCADE',
      },
      interviewStage: { type: Sequelize.STRING(120), allowNull: false },
      scheduledAt: { type: Sequelize.DATE, allowNull: false },
      completedAt: { type: Sequelize.DATE, allowNull: true },
      durationMinutes: { type: Sequelize.INTEGER, allowNull: true },
      rescheduleCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      interviewerRoster: { type: jsonType, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('interview_schedules', ['workspaceId']);
    await queryInterface.addIndex('interview_schedules', ['applicationId']);
    await queryInterface.addIndex('interview_schedules', ['scheduledAt']);

    await queryInterface.createTable('job_stages', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
      },
      jobId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'jobs', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(120), allowNull: false },
      orderIndex: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      slaHours: { type: Sequelize.INTEGER, allowNull: true },
      averageDurationHours: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      guideUrl: { type: Sequelize.STRING(500), allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('job_stages', ['workspaceId']);
    await queryInterface.addIndex('job_stages', ['jobId']);
    await queryInterface.addIndex('job_stages', ['orderIndex']);

    await queryInterface.createTable('job_approval_workflows', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
      },
      jobId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'jobs', key: 'id' },
        onDelete: 'SET NULL',
      },
      approverRole: { type: Sequelize.STRING(120), allowNull: false },
      status: {
        type: Sequelize.ENUM('pending', 'in_review', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      dueAt: { type: Sequelize.DATE, allowNull: true },
      completedAt: { type: Sequelize.DATE, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('job_approval_workflows', ['workspaceId']);
    await queryInterface.addIndex('job_approval_workflows', ['jobId']);
    await queryInterface.addIndex('job_approval_workflows', ['status']);

    await queryInterface.createTable('job_campaign_performances', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
      },
      jobId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'jobs', key: 'id' },
        onDelete: 'SET NULL',
      },
      channel: { type: Sequelize.STRING(120), allowNull: false },
      impressions: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      clicks: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      applications: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      hires: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      spendAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      currencyCode: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      reportingDate: { type: Sequelize.DATEONLY, allowNull: false },
      metadata: { type: jsonType, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('job_campaign_performances', ['workspaceId']);
    await queryInterface.addIndex('job_campaign_performances', ['jobId']);
    await queryInterface.addIndex('job_campaign_performances', ['channel']);
    await queryInterface.addIndex('job_campaign_performances', ['reportingDate']);

    await queryInterface.createTable('partner_engagements', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
      },
      partnerType: { type: Sequelize.STRING(120), allowNull: false },
      partnerName: { type: Sequelize.STRING(255), allowNull: false },
      touchpoints: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      lastInteractionAt: { type: Sequelize.DATE, allowNull: true },
      activeBriefs: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      conversionRate: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('partner_engagements', ['workspaceId']);
    await queryInterface.addIndex('partner_engagements', ['partnerType']);
    await queryInterface.addIndex('partner_engagements', ['partnerName']);

    await queryInterface.createTable('recruiting_calendar_events', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      eventType: { type: Sequelize.STRING(120), allowNull: false },
      startsAt: { type: Sequelize.DATE, allowNull: false },
      endsAt: { type: Sequelize.DATE, allowNull: true },
      location: { type: Sequelize.STRING(255), allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('recruiting_calendar_events', ['workspaceId']);
    await queryInterface.addIndex('recruiting_calendar_events', ['eventType']);
    await queryInterface.addIndex('recruiting_calendar_events', ['startsAt']);

    await queryInterface.createTable('employer_brand_assets', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
      },
      assetType: { type: Sequelize.STRING(120), allowNull: false },
      title: { type: Sequelize.STRING(255), allowNull: false },
      status: {
        type: Sequelize.ENUM('draft', 'review', 'published', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
      },
      url: { type: Sequelize.STRING(500), allowNull: true },
      publishedAt: { type: Sequelize.DATE, allowNull: true },
      engagementScore: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('employer_brand_assets', ['workspaceId']);
    await queryInterface.addIndex('employer_brand_assets', ['assetType']);
    await queryInterface.addIndex('employer_brand_assets', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('employer_brand_assets');
    await dropEnum(queryInterface, 'enum_employer_brand_assets_status');

    await queryInterface.dropTable('recruiting_calendar_events');

    await queryInterface.dropTable('partner_engagements');

    await queryInterface.dropTable('job_campaign_performances');

    await queryInterface.dropTable('job_approval_workflows');
    await dropEnum(queryInterface, 'enum_job_approval_workflows_status');

    await queryInterface.dropTable('job_stages');

    await queryInterface.dropTable('interview_schedules');

    await queryInterface.dropTable('candidate_satisfaction_surveys');

    await queryInterface.dropTable('candidate_demographic_snapshots');

    await queryInterface.dropTable('hiring_alerts');
    await dropEnum(queryInterface, 'enum_hiring_alerts_severity');
    await dropEnum(queryInterface, 'enum_hiring_alerts_status');
  },
};
