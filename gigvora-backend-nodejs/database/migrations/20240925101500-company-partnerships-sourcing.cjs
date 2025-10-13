'use strict';

const dropEnum = async (queryInterface, enumName) => {
  try {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}"`);
  } catch (error) {
    console.warn(`Failed to drop enum ${enumName}:`, error);
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = Sequelize.JSONB ?? Sequelize.JSON;

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'headhunter_invites',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          headhunterWorkspaceId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'SET NULL',
          },
          email: { type: Sequelize.STRING(255), allowNull: false },
          status: {
            type: Sequelize.ENUM('pending', 'accepted', 'declined', 'expired', 'revoked'),
            allowNull: false,
            defaultValue: 'pending',
          },
          invitedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          sentAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          respondedAt: { type: Sequelize.DATE, allowNull: true },
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
      await queryInterface.addIndex('headhunter_invites', ['workspaceId'], { transaction });
      await queryInterface.addIndex('headhunter_invites', ['headhunterWorkspaceId'], { transaction });
      await queryInterface.addIndex('headhunter_invites', ['status'], { transaction });

      await queryInterface.createTable(
        'headhunter_briefs',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(255), allowNull: false },
          roleFocus: { type: Sequelize.STRING(180), allowNull: true },
          location: { type: Sequelize.STRING(180), allowNull: true },
          openings: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
          feePercentage: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          status: {
            type: Sequelize.ENUM('draft', 'shared', 'in_progress', 'filled', 'closed'),
            allowNull: false,
            defaultValue: 'draft',
          },
          sharedAt: { type: Sequelize.DATE, allowNull: true },
          dueAt: { type: Sequelize.DATE, allowNull: true },
          filledAt: { type: Sequelize.DATE, allowNull: true },
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
      await queryInterface.addIndex('headhunter_briefs', ['workspaceId'], { transaction });
      await queryInterface.addIndex('headhunter_briefs', ['status'], { transaction });
      await queryInterface.addIndex('headhunter_briefs', ['dueAt'], { transaction });

      await queryInterface.createTable(
        'headhunter_brief_assignments',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          briefId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'headhunter_briefs', key: 'id' },
            onDelete: 'CASCADE',
          },
          headhunterWorkspaceId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'SET NULL',
          },
          status: {
            type: Sequelize.ENUM('invited', 'accepted', 'submitted', 'shortlisted', 'placed', 'closed'),
            allowNull: false,
            defaultValue: 'invited',
          },
          submittedCandidates: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          placements: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          responseTimeHours: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
          submittedAt: { type: Sequelize.DATE, allowNull: true },
          placedAt: { type: Sequelize.DATE, allowNull: true },
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
      await queryInterface.addIndex('headhunter_brief_assignments', ['workspaceId'], { transaction });
      await queryInterface.addIndex('headhunter_brief_assignments', ['briefId'], { transaction });
      await queryInterface.addIndex('headhunter_brief_assignments', ['headhunterWorkspaceId'], { transaction });
      await queryInterface.addIndex('headhunter_brief_assignments', ['status'], { transaction });

      await queryInterface.createTable(
        'headhunter_performance_snapshots',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          headhunterWorkspaceId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'SET NULL',
          },
          headhunterName: { type: Sequelize.STRING(255), allowNull: true },
          responseRate: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          averageTimeToSubmitHours: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
          placements: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          interviews: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          qualityScore: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          activeBriefs: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          pipelineValue: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          pipelineCurrency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
          lastSubmissionAt: { type: Sequelize.DATE, allowNull: true },
          periodStart: { type: Sequelize.DATE, allowNull: true },
          periodEnd: { type: Sequelize.DATE, allowNull: true },
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
      await queryInterface.addIndex('headhunter_performance_snapshots', ['workspaceId'], { transaction });
      await queryInterface.addIndex('headhunter_performance_snapshots', ['headhunterWorkspaceId'], { transaction });
      await queryInterface.addIndex('headhunter_performance_snapshots', ['periodEnd'], { transaction });

      await queryInterface.createTable(
        'headhunter_commissions',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          headhunterWorkspaceId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'SET NULL',
          },
          headhunterName: { type: Sequelize.STRING(255), allowNull: true },
          candidateName: { type: Sequelize.STRING(255), allowNull: true },
          briefId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'headhunter_briefs', key: 'id' },
            onDelete: 'SET NULL',
          },
          invoiceNumber: { type: Sequelize.STRING(120), allowNull: true },
          amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
          currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
          status: {
            type: Sequelize.ENUM('pending', 'invoiced', 'paid', 'overdue', 'cancelled'),
            allowNull: false,
            defaultValue: 'pending',
          },
          dueAt: { type: Sequelize.DATE, allowNull: true },
          paidAt: { type: Sequelize.DATE, allowNull: true },
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
      await queryInterface.addIndex('headhunter_commissions', ['workspaceId'], { transaction });
      await queryInterface.addIndex('headhunter_commissions', ['headhunterWorkspaceId'], { transaction });
      await queryInterface.addIndex('headhunter_commissions', ['status'], { transaction });
      await queryInterface.addIndex('headhunter_commissions', ['dueAt'], { transaction });

      await queryInterface.createTable(
        'talent_pools',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(180), allowNull: false },
          poolType: {
            type: Sequelize.ENUM('silver_medalist', 'alumni', 'referral', 'campus', 'partner', 'internal'),
            allowNull: false,
            defaultValue: 'silver_medalist',
          },
          status: {
            type: Sequelize.ENUM('active', 'paused', 'archived'),
            allowNull: false,
            defaultValue: 'active',
          },
          description: { type: Sequelize.TEXT, allowNull: true },
          ownerId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          candidateCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          activeCandidates: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          hiresCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          lastEngagedAt: { type: Sequelize.DATE, allowNull: true },
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
      await queryInterface.addIndex('talent_pools', ['workspaceId'], { transaction });
      await queryInterface.addIndex('talent_pools', ['poolType'], { transaction });
      await queryInterface.addIndex('talent_pools', ['status'], { transaction });

      await queryInterface.createTable(
        'talent_pool_members',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          poolId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'talent_pools', key: 'id' },
            onDelete: 'CASCADE',
          },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          profileId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'profiles', key: 'id' },
            onDelete: 'SET NULL',
          },
          candidateName: { type: Sequelize.STRING(255), allowNull: true },
          status: {
            type: Sequelize.ENUM('active', 'engaged', 'interview', 'offered', 'hired', 'archived'),
            allowNull: false,
            defaultValue: 'active',
          },
          sourceType: {
            type: Sequelize.ENUM('silver_medalist', 'alumni', 'referral', 'campus', 'partner', 'internal'),
            allowNull: false,
            defaultValue: 'silver_medalist',
          },
          stage: { type: Sequelize.STRING(120), allowNull: true },
          lastInteractionAt: { type: Sequelize.DATE, allowNull: true },
          nextActionAt: { type: Sequelize.DATE, allowNull: true },
          joinedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          tags: { type: jsonType, allowNull: true },
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
      await queryInterface.addIndex('talent_pool_members', ['poolId'], { transaction });
      await queryInterface.addIndex('talent_pool_members', ['workspaceId'], { transaction });
      await queryInterface.addIndex('talent_pool_members', ['status'], { transaction });
      await queryInterface.addIndex('talent_pool_members', ['sourceType'], { transaction });
      await queryInterface.addIndex('talent_pool_members', ['nextActionAt'], { transaction });

      await queryInterface.createTable(
        'talent_pool_engagements',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          poolId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'talent_pools', key: 'id' },
            onDelete: 'CASCADE',
          },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          performedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          interactionType: {
            type: Sequelize.ENUM('email', 'call', 'event', 'meeting', 'note', 'update', 'campaign'),
            allowNull: false,
            defaultValue: 'update',
          },
          occurredAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
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
        },
        { transaction },
      );
      await queryInterface.addIndex('talent_pool_engagements', ['poolId'], { transaction });
      await queryInterface.addIndex('talent_pool_engagements', ['workspaceId'], { transaction });
      await queryInterface.addIndex('talent_pool_engagements', ['occurredAt'], { transaction });

      await queryInterface.createTable(
        'agency_sla_snapshots',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          agencyCollaborationId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'agency_collaborations', key: 'id' },
            onDelete: 'CASCADE',
          },
          periodStart: { type: Sequelize.DATE, allowNull: false },
          periodEnd: { type: Sequelize.DATE, allowNull: false },
          onTimeDeliveryRate: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          responseTimeHoursAvg: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
          breachCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          escalationsCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
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
      await queryInterface.addIndex('agency_sla_snapshots', ['workspaceId'], { transaction });
      await queryInterface.addIndex('agency_sla_snapshots', ['agencyCollaborationId'], { transaction });
      await queryInterface.addIndex('agency_sla_snapshots', ['periodEnd'], { transaction });

      await queryInterface.createTable(
        'agency_billing_events',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          agencyCollaborationId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'agency_collaborations', key: 'id' },
            onDelete: 'SET NULL',
          },
          invoiceNumber: { type: Sequelize.STRING(120), allowNull: true },
          status: {
            type: Sequelize.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled'),
            allowNull: false,
            defaultValue: 'sent',
          },
          amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
          currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
          issuedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          dueAt: { type: Sequelize.DATE, allowNull: true },
          paidAt: { type: Sequelize.DATE, allowNull: true },
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
      await queryInterface.addIndex('agency_billing_events', ['workspaceId'], { transaction });
      await queryInterface.addIndex('agency_billing_events', ['agencyCollaborationId'], { transaction });
      await queryInterface.addIndex('agency_billing_events', ['status'], { transaction });
      await queryInterface.addIndex('agency_billing_events', ['dueAt'], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('agency_billing_events', { transaction });
      await queryInterface.dropTable('agency_sla_snapshots', { transaction });
      await queryInterface.dropTable('talent_pool_engagements', { transaction });
      await queryInterface.dropTable('talent_pool_members', { transaction });
      await queryInterface.dropTable('talent_pools', { transaction });
      await queryInterface.dropTable('headhunter_commissions', { transaction });
      await queryInterface.dropTable('headhunter_performance_snapshots', { transaction });
      await queryInterface.dropTable('headhunter_brief_assignments', { transaction });
      await queryInterface.dropTable('headhunter_briefs', { transaction });
      await queryInterface.dropTable('headhunter_invites', { transaction });
    });

    await dropEnum(queryInterface, 'enum_agency_billing_events_status');
    await dropEnum(queryInterface, 'enum_talent_pool_engagements_interactionType');
    await dropEnum(queryInterface, 'enum_talent_pool_members_sourceType');
    await dropEnum(queryInterface, 'enum_talent_pool_members_status');
    await dropEnum(queryInterface, 'enum_talent_pools_status');
    await dropEnum(queryInterface, 'enum_talent_pools_poolType');
    await dropEnum(queryInterface, 'enum_headhunter_commissions_status');
    await dropEnum(queryInterface, 'enum_headhunter_brief_assignments_status');
    await dropEnum(queryInterface, 'enum_headhunter_briefs_status');
    await dropEnum(queryInterface, 'enum_headhunter_invites_status');
  },
};
