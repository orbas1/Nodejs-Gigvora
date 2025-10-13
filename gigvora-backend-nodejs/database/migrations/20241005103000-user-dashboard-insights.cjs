'use strict';

const TABLES = {
  careerAnalyticsSnapshots: 'career_analytics_snapshots',
  careerPeerBenchmarks: 'career_peer_benchmarks',
  weeklyDigestSubscriptions: 'weekly_digest_subscriptions',
  calendarIntegrations: 'calendar_integrations',
  candidateCalendarEvents: 'candidate_calendar_events',
  focusSessions: 'focus_sessions',
  advisorCollaborations: 'advisor_collaborations',
  advisorCollaborationMembers: 'advisor_collaboration_members',
  advisorCollaborationAuditLogs: 'advisor_collaboration_audit_logs',
  advisorDocumentRooms: 'advisor_document_rooms',
  supportAutomationLogs: 'support_automation_logs',
};

const ENUMS = {
  salaryTrend: 'enum_career_analytics_snapshots_salaryTrend',
  digestFrequency: 'enum_weekly_digest_subscriptions_frequency',
  calendarIntegrationStatus: 'enum_calendar_integrations_status',
  calendarEventType: 'enum_candidate_calendar_events_eventType',
  calendarEventSource: 'enum_candidate_calendar_events_source',
  focusSessionType: 'enum_focus_sessions_focusType',
  advisorCollaborationStatus: 'enum_advisor_collaborations_status',
  advisorMemberRole: 'enum_advisor_collaboration_members_role',
  advisorMemberStatus: 'enum_advisor_collaboration_members_status',
  documentRoomStatus: 'enum_advisor_document_rooms_status',
  supportAutomationStatus: 'enum_support_automation_logs_status',
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        TABLES.careerAnalyticsSnapshots,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          timeframeStart: { type: Sequelize.DATEONLY, allowNull: false },
          timeframeEnd: { type: Sequelize.DATEONLY, allowNull: false },
          outreachConversionRate: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          interviewMomentum: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          offerWinRate: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          salaryMedian: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          salaryCurrency: { type: Sequelize.STRING(3), allowNull: true },
          salaryTrend: {
            type: Sequelize.ENUM('up', 'down', 'flat'),
            allowNull: false,
            defaultValue: 'flat',
          },
          diversityRepresentation: { type: jsonType, allowNull: true },
          funnelBreakdown: { type: jsonType, allowNull: true },
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
        },
        { transaction },
      );

      await queryInterface.addIndex(TABLES.careerAnalyticsSnapshots, ['userId'], { transaction });
      await queryInterface.addIndex(TABLES.careerAnalyticsSnapshots, ['timeframeEnd'], { transaction });

      await queryInterface.createTable(
        TABLES.careerPeerBenchmarks,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          cohortKey: { type: Sequelize.STRING(120), allowNull: false },
          metric: { type: Sequelize.STRING(120), allowNull: false },
          value: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
          percentile: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          sampleSize: { type: Sequelize.INTEGER, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          capturedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
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
        },
        { transaction },
      );

      await queryInterface.addIndex(TABLES.careerPeerBenchmarks, ['userId', 'metric'], { transaction });
      await queryInterface.addIndex(TABLES.careerPeerBenchmarks, ['cohortKey'], { transaction });

      await queryInterface.createTable(
        TABLES.weeklyDigestSubscriptions,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          frequency: {
            type: Sequelize.ENUM('immediate', 'daily', 'weekly'),
            allowNull: false,
            defaultValue: 'weekly',
          },
          channels: { type: jsonType, allowNull: true },
          isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          lastSentAt: { type: Sequelize.DATE, allowNull: true },
          nextScheduledAt: { type: Sequelize.DATE, allowNull: true },
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
        },
        { transaction },
      );

      await queryInterface.createTable(
        TABLES.calendarIntegrations,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          provider: { type: Sequelize.STRING(80), allowNull: false },
          externalAccount: { type: Sequelize.STRING(255), allowNull: true },
          status: {
            type: Sequelize.ENUM('connected', 'syncing', 'error', 'disconnected'),
            allowNull: false,
            defaultValue: 'connected',
          },
          lastSyncedAt: { type: Sequelize.DATE, allowNull: true },
          syncError: { type: Sequelize.TEXT, allowNull: true },
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
        },
        { transaction },
      );

      await queryInterface.addIndex(TABLES.calendarIntegrations, ['userId'], { transaction });
      await queryInterface.addIndex(TABLES.calendarIntegrations, ['provider'], { transaction });

      await queryInterface.createTable(
        TABLES.candidateCalendarEvents,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(255), allowNull: false },
          eventType: {
            type: Sequelize.ENUM('interview', 'networking', 'project', 'wellbeing', 'deadline', 'ritual'),
            allowNull: false,
            defaultValue: 'interview',
          },
          source: {
            type: Sequelize.ENUM('manual', 'google', 'outlook', 'gigvora'),
            allowNull: false,
            defaultValue: 'manual',
          },
          startsAt: { type: Sequelize.DATE, allowNull: false },
          endsAt: { type: Sequelize.DATE, allowNull: true },
          location: { type: Sequelize.STRING(255), allowNull: true },
          isFocusBlock: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          focusMode: { type: Sequelize.STRING(120), allowNull: true },
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
        },
        { transaction },
      );

      await queryInterface.addIndex(TABLES.candidateCalendarEvents, ['userId', 'startsAt'], { transaction });
      await queryInterface.addIndex(TABLES.candidateCalendarEvents, ['eventType'], { transaction });

      await queryInterface.createTable(
        TABLES.focusSessions,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          focusType: {
            type: Sequelize.ENUM('interview_prep', 'networking', 'application', 'deep_work', 'wellbeing'),
            allowNull: false,
            defaultValue: 'deep_work',
          },
          startedAt: { type: Sequelize.DATE, allowNull: false },
          endedAt: { type: Sequelize.DATE, allowNull: true },
          durationMinutes: { type: Sequelize.INTEGER, allowNull: true },
          completed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
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
        },
        { transaction },
      );

      await queryInterface.addIndex(TABLES.focusSessions, ['userId', 'startedAt'], { transaction });

      await queryInterface.createTable(
        TABLES.advisorCollaborations,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          ownerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(255), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          status: {
            type: Sequelize.ENUM('draft', 'active', 'paused', 'archived'),
            allowNull: false,
            defaultValue: 'active',
          },
          defaultPermissions: { type: jsonType, allowNull: true },
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
        },
        { transaction },
      );

      await queryInterface.addIndex(TABLES.advisorCollaborations, ['ownerId'], { transaction });
      await queryInterface.addIndex(TABLES.advisorCollaborations, ['status'], { transaction });

      await queryInterface.createTable(
        TABLES.advisorCollaborationMembers,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          collaborationId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: TABLES.advisorCollaborations, key: 'id' },
            onDelete: 'CASCADE',
          },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          email: { type: Sequelize.STRING(255), allowNull: true },
          role: {
            type: Sequelize.ENUM('mentor', 'agency', 'coach', 'observer', 'teammate'),
            allowNull: false,
            defaultValue: 'mentor',
          },
          permissions: { type: jsonType, allowNull: true },
          status: {
            type: Sequelize.ENUM('invited', 'active', 'revoked'),
            allowNull: false,
            defaultValue: 'invited',
          },
          invitedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          joinedAt: { type: Sequelize.DATE, allowNull: true },
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
        },
        { transaction },
      );

      await queryInterface.addIndex(TABLES.advisorCollaborationMembers, ['collaborationId'], { transaction });
      await queryInterface.addIndex(TABLES.advisorCollaborationMembers, ['userId'], { transaction });
      await queryInterface.addIndex(TABLES.advisorCollaborationMembers, ['status'], { transaction });

      await queryInterface.createTable(
        TABLES.advisorCollaborationAuditLogs,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          collaborationId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: TABLES.advisorCollaborations, key: 'id' },
            onDelete: 'CASCADE',
          },
          actorId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          action: { type: Sequelize.STRING(255), allowNull: false },
          scope: { type: Sequelize.STRING(120), allowNull: true },
          details: { type: jsonType, allowNull: true },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex(TABLES.advisorCollaborationAuditLogs, ['collaborationId'], { transaction });
      await queryInterface.addIndex(TABLES.advisorCollaborationAuditLogs, ['createdAt'], { transaction });

      await queryInterface.createTable(
        TABLES.advisorDocumentRooms,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          ownerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          collaborationId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: TABLES.advisorCollaborations, key: 'id' },
            onDelete: 'SET NULL',
          },
          name: { type: Sequelize.STRING(255), allowNull: false },
          status: {
            type: Sequelize.ENUM('active', 'expired', 'archived'),
            allowNull: false,
            defaultValue: 'active',
          },
          expiresAt: { type: Sequelize.DATE, allowNull: true },
          sharedWith: { type: jsonType, allowNull: true },
          storageUsedMb: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
          lastAccessedAt: { type: Sequelize.DATE, allowNull: true },
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
        },
        { transaction },
      );

      await queryInterface.addIndex(TABLES.advisorDocumentRooms, ['ownerId'], { transaction });
      await queryInterface.addIndex(TABLES.advisorDocumentRooms, ['collaborationId'], { transaction });
      await queryInterface.addIndex(TABLES.advisorDocumentRooms, ['status'], { transaction });

      await queryInterface.createTable(
        TABLES.supportAutomationLogs,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          source: { type: Sequelize.STRING(120), allowNull: false },
          action: { type: Sequelize.STRING(255), allowNull: false },
          status: {
            type: Sequelize.ENUM('queued', 'running', 'success', 'failed'),
            allowNull: false,
            defaultValue: 'queued',
          },
          triggeredAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          completedAt: { type: Sequelize.DATE, allowNull: true },
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
        },
        { transaction },
      );

      await queryInterface.addIndex(TABLES.supportAutomationLogs, ['userId'], { transaction });
      await queryInterface.addIndex(TABLES.supportAutomationLogs, ['status'], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable(TABLES.supportAutomationLogs, { transaction });
      await queryInterface.dropTable(TABLES.advisorDocumentRooms, { transaction });
      await queryInterface.dropTable(TABLES.advisorCollaborationAuditLogs, { transaction });
      await queryInterface.dropTable(TABLES.advisorCollaborationMembers, { transaction });
      await queryInterface.dropTable(TABLES.advisorCollaborations, { transaction });
      await queryInterface.dropTable(TABLES.focusSessions, { transaction });
      await queryInterface.dropTable(TABLES.candidateCalendarEvents, { transaction });
      await queryInterface.dropTable(TABLES.calendarIntegrations, { transaction });
      await queryInterface.dropTable(TABLES.weeklyDigestSubscriptions, { transaction });
      await queryInterface.dropTable(TABLES.careerPeerBenchmarks, { transaction });
      await queryInterface.dropTable(TABLES.careerAnalyticsSnapshots, { transaction });

      await queryInterface.sequelize
        .query(`DROP TYPE IF EXISTS "${ENUMS.supportAutomationStatus}";`, { transaction })
        .catch(() => {});
      await queryInterface.sequelize
        .query(`DROP TYPE IF EXISTS "${ENUMS.documentRoomStatus}";`, { transaction })
        .catch(() => {});
      await queryInterface.sequelize
        .query(`DROP TYPE IF EXISTS "${ENUMS.advisorMemberStatus}";`, { transaction })
        .catch(() => {});
      await queryInterface.sequelize
        .query(`DROP TYPE IF EXISTS "${ENUMS.advisorMemberRole}";`, { transaction })
        .catch(() => {});
      await queryInterface.sequelize
        .query(`DROP TYPE IF EXISTS "${ENUMS.advisorCollaborationStatus}";`, { transaction })
        .catch(() => {});
      await queryInterface.sequelize
        .query(`DROP TYPE IF EXISTS "${ENUMS.focusSessionType}";`, { transaction })
        .catch(() => {});
      await queryInterface.sequelize
        .query(`DROP TYPE IF EXISTS "${ENUMS.calendarEventSource}";`, { transaction })
        .catch(() => {});
      await queryInterface.sequelize
        .query(`DROP TYPE IF EXISTS "${ENUMS.calendarEventType}";`, { transaction })
        .catch(() => {});
      await queryInterface.sequelize
        .query(`DROP TYPE IF EXISTS "${ENUMS.calendarIntegrationStatus}";`, { transaction })
        .catch(() => {});
      await queryInterface.sequelize
        .query(`DROP TYPE IF EXISTS "${ENUMS.digestFrequency}";`, { transaction })
        .catch(() => {});
      await queryInterface.sequelize
        .query(`DROP TYPE IF EXISTS "${ENUMS.salaryTrend}";`, { transaction })
        .catch(() => {});
    });
  },
};
