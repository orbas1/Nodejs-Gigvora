'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const alliancesTable = 'agency_alliances';
      const membersTable = 'agency_alliance_members';
      const podsTable = 'agency_alliance_pods';
      const podMembersTable = 'agency_alliance_pod_members';
      const resourceSlotsTable = 'agency_alliance_resource_slots';
      const rateCardsTable = 'agency_alliance_rate_cards';
      const rateCardApprovalsTable = 'agency_alliance_rate_card_approvals';
      const revenueSplitsTable = 'agency_alliance_revenue_splits';

      await queryInterface.createTable(
        alliancesTable,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          name: { type: Sequelize.STRING(200), allowNull: false },
          slug: { type: Sequelize.STRING(200), allowNull: false, unique: true },
          status: {
            type: Sequelize.ENUM('planned', 'active', 'paused', 'closed'),
            allowNull: false,
            defaultValue: 'planned',
          },
          allianceType: {
            type: Sequelize.ENUM('delivery_pod', 'channel_partner', 'co_sell', 'managed_service'),
            allowNull: false,
            defaultValue: 'delivery_pod',
          },
          description: { type: Sequelize.TEXT, allowNull: true },
          focusAreas: { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
          defaultRevenueSplit: { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
          startDate: { type: Sequelize.DATE, allowNull: true },
          endDate: { type: Sequelize.DATE, allowNull: true },
          nextReviewAt: { type: Sequelize.DATE, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.createTable(
        membersTable,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          allianceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: alliancesTable, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          workspaceMemberId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'provider_workspace_members', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          role: {
            type: Sequelize.ENUM('lead', 'contributor', 'specialist', 'contractor'),
            allowNull: false,
            defaultValue: 'contributor',
          },
          status: {
            type: Sequelize.ENUM('invited', 'active', 'paused', 'exited'),
            allowNull: false,
            defaultValue: 'invited',
          },
          joinDate: { type: Sequelize.DATE, allowNull: true },
          exitDate: { type: Sequelize.DATE, allowNull: true },
          commitmentHours: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
          revenueSharePercent: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          objectives: { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.createTable(
        podsTable,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          allianceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: alliancesTable, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          leadMemberId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: membersTable, key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          name: { type: Sequelize.STRING(200), allowNull: false },
          focusArea: { type: Sequelize.STRING(255), allowNull: true },
          podType: { type: Sequelize.ENUM('delivery', 'strategy', 'growth', 'specialist'), allowNull: false, defaultValue: 'delivery' },
          status: { type: Sequelize.ENUM('forming', 'active', 'scaling', 'sunset'), allowNull: false, defaultValue: 'forming' },
          backlogValue: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
          capacityTarget: { type: Sequelize.INTEGER, allowNull: true },
          externalNotes: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.createTable(
        podMembersTable,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          podId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: podsTable, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          allianceMemberId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: membersTable, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          role: { type: Sequelize.STRING(120), allowNull: false },
          weeklyCommitmentHours: { type: Sequelize.INTEGER, allowNull: true },
          utilizationTarget: { type: Sequelize.INTEGER, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.createTable(
        resourceSlotsTable,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          allianceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: alliancesTable, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          allianceMemberId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: membersTable, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          weekStartDate: { type: Sequelize.DATEONLY, allowNull: false },
          plannedHours: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
          bookedHours: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
          engagementType: { type: Sequelize.STRING(120), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.createTable(
        rateCardsTable,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          allianceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: alliancesTable, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          version: { type: Sequelize.INTEGER, allowNull: false },
          serviceLine: { type: Sequelize.STRING(200), allowNull: false },
          deliveryModel: { type: Sequelize.STRING(120), allowNull: true },
          currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
          unit: { type: Sequelize.STRING(120), allowNull: false, defaultValue: 'hour' },
          rate: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
          status: {
            type: Sequelize.ENUM('draft', 'in_review', 'active', 'superseded', 'rejected'),
            allowNull: false,
            defaultValue: 'draft',
          },
          effectiveFrom: { type: Sequelize.DATE, allowNull: true },
          effectiveTo: { type: Sequelize.DATE, allowNull: true },
          changeSummary: { type: Sequelize.TEXT, allowNull: true },
          createdById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.createTable(
        rateCardApprovalsTable,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          rateCardId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: rateCardsTable, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          approverId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          status: {
            type: Sequelize.ENUM('pending', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'pending',
          },
          comment: { type: Sequelize.TEXT, allowNull: true },
          decidedAt: { type: Sequelize.DATE, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.createTable(
        revenueSplitsTable,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          allianceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: alliancesTable, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          splitType: {
            type: Sequelize.ENUM('fixed', 'tiered', 'performance'),
            allowNull: false,
            defaultValue: 'fixed',
          },
          terms: { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: false },
          status: {
            type: Sequelize.ENUM('draft', 'pending_approval', 'active', 'expired'),
            allowNull: false,
            defaultValue: 'draft',
          },
          effectiveFrom: { type: Sequelize.DATE, allowNull: false },
          effectiveTo: { type: Sequelize.DATE, allowNull: true },
          createdById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          approvedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          approvedAt: { type: Sequelize.DATE, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        membersTable,
        ['allianceId', 'status'],
        {
          name: 'agency_alliance_members_alliance_status_idx',
          transaction,
        },
      );

      await queryInterface.addIndex(
        membersTable,
        ['userId'],
        {
          name: 'agency_alliance_members_user_idx',
          transaction,
        },
      );

      await queryInterface.addIndex(
        resourceSlotsTable,
        ['allianceId', 'weekStartDate'],
        {
          name: 'agency_alliance_resource_slots_week_idx',
          transaction,
        },
      );

      await queryInterface.addIndex(
        rateCardsTable,
        ['allianceId', 'serviceLine', 'version'],
        {
          unique: true,
          name: 'agency_alliance_rate_cards_unique_version',
          transaction,
        },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tables = [
        'agency_alliance_rate_card_approvals',
        'agency_alliance_resource_slots',
        'agency_alliance_pod_members',
        'agency_alliance_pods',
        'agency_alliance_revenue_splits',
        'agency_alliance_rate_cards',
        'agency_alliance_members',
        'agency_alliances',
      ];

      await queryInterface.removeIndex('agency_alliance_members', 'agency_alliance_members_alliance_status_idx', { transaction }).catch(() => {});
      await queryInterface.removeIndex('agency_alliance_members', 'agency_alliance_members_user_idx', { transaction }).catch(() => {});
      await queryInterface.removeIndex('agency_alliance_resource_slots', 'agency_alliance_resource_slots_week_idx', { transaction }).catch(() => {});
      await queryInterface.removeIndex('agency_alliance_rate_cards', 'agency_alliance_rate_cards_unique_version', { transaction }).catch(() => {});

      for (const table of tables) {
        await queryInterface.dropTable(table, { transaction }).catch(() => {});
      }

      const dialect = queryInterface.sequelize.getDialect();
      if (dialect === 'postgres' || dialect === 'postgresql') {
        await queryInterface.sequelize.query(
          "DROP TYPE IF EXISTS \"enum_agency_alliance_members_role\";"
            + "DROP TYPE IF EXISTS \"enum_agency_alliance_members_status\";"
            + "DROP TYPE IF EXISTS \"enum_agency_alliance_pods_podType\";"
            + "DROP TYPE IF EXISTS \"enum_agency_alliance_pods_status\";"
            + "DROP TYPE IF EXISTS \"enum_agency_alliances_status\";"
            + "DROP TYPE IF EXISTS \"enum_agency_alliances_allianceType\";"
            + "DROP TYPE IF EXISTS \"enum_agency_alliance_rate_cards_status\";"
            + "DROP TYPE IF EXISTS \"enum_agency_alliance_rate_card_approvals_status\";"
            + "DROP TYPE IF EXISTS \"enum_agency_alliance_revenue_splits_splitType\";"
            + "DROP TYPE IF EXISTS \"enum_agency_alliance_revenue_splits_status\";",
          { transaction },
        );
      }
    });
  },
};
