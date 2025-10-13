'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = Sequelize.JSONB ?? Sequelize.JSON;

      await queryInterface.createTable(
        'agency_collaborations',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          agencyWorkspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          status: {
            type: Sequelize.ENUM('invited', 'active', 'paused', 'ended'),
            allowNull: false,
            defaultValue: 'invited',
          },
          collaborationType: {
            type: Sequelize.ENUM('project', 'retainer', 'on_call', 'embedded'),
            allowNull: false,
            defaultValue: 'retainer',
          },
          retainerAmountMonthly: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
          renewalDate: { type: Sequelize.DATE, allowNull: true },
          healthScore: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          satisfactionScore: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          sharedDeliverySnapshot: { type: jsonType, allowNull: true },
          sharedResourcePlan: { type: jsonType, allowNull: true },
          sharedDeliverablesDue: { type: jsonType, allowNull: true },
          activeBriefsCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          atRiskDeliverablesCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          forecastedUpsellValue: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          forecastedUpsellCurrency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
          lastActivityAt: { type: Sequelize.DATE, allowNull: true },
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

      await queryInterface.addIndex(
        'agency_collaborations',
        ['freelancerId', 'status'],
        { transaction, name: 'agency_collaborations_freelancer_status_idx' },
      );

      await queryInterface.addIndex(
        'agency_collaborations',
        ['agencyWorkspaceId', 'status'],
        { transaction, name: 'agency_collaborations_workspace_status_idx' },
      );

      await queryInterface.createTable(
        'agency_collaboration_invitations',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          collaborationId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'agency_collaborations', key: 'id' },
            onDelete: 'SET NULL',
          },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          agencyWorkspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          sentById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          status: {
            type: Sequelize.ENUM('pending', 'accepted', 'declined', 'expired', 'withdrawn'),
            allowNull: false,
            defaultValue: 'pending',
          },
          roleTitle: { type: Sequelize.STRING(255), allowNull: true },
          engagementType: {
            type: Sequelize.ENUM('project', 'retainer', 'on_call', 'embedded'),
            allowNull: false,
            defaultValue: 'retainer',
          },
          proposedRetainer: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
          responseDueAt: { type: Sequelize.DATE, allowNull: true },
          message: { type: Sequelize.TEXT, allowNull: true },
          attachments: { type: jsonType, allowNull: true },
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

      await queryInterface.addIndex(
        'agency_collaboration_invitations',
        ['freelancerId', 'status'],
        { transaction, name: 'agency_collaboration_invitations_freelancer_status_idx' },
      );

      await queryInterface.createTable(
        'agency_rate_cards',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          agencyWorkspaceId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'SET NULL',
          },
          title: { type: Sequelize.STRING(255), allowNull: false },
          status: {
            type: Sequelize.ENUM('draft', 'shared', 'archived'),
            allowNull: false,
            defaultValue: 'draft',
          },
          effectiveFrom: { type: Sequelize.DATE, allowNull: true },
          effectiveTo: { type: Sequelize.DATE, allowNull: true },
          currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
          defaultTerms: { type: jsonType, allowNull: true },
          shareHistory: { type: jsonType, allowNull: true },
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

      await queryInterface.addIndex(
        'agency_rate_cards',
        ['freelancerId', 'status'],
        { transaction, name: 'agency_rate_cards_freelancer_status_idx' },
      );

      await queryInterface.createTable(
        'agency_rate_card_items',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          rateCardId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'agency_rate_cards', key: 'id' },
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(255), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          unitType: {
            type: Sequelize.ENUM('hour', 'day', 'sprint', 'project', 'retainer', 'deliverable'),
            allowNull: false,
            defaultValue: 'hour',
          },
          unitAmount: { type: Sequelize.INTEGER, allowNull: true },
          unitPrice: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
          currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
          leadTimeDays: { type: Sequelize.INTEGER, allowNull: true },
          minCommitment: { type: Sequelize.INTEGER, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          sortOrder: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
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

      await queryInterface.addIndex(
        'agency_rate_card_items',
        ['rateCardId', 'sortOrder'],
        { transaction, name: 'agency_rate_card_items_rate_card_sort_idx' },
      );

      await queryInterface.createTable(
        'agency_retainer_negotiations',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          collaborationId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'agency_collaborations', key: 'id' },
            onDelete: 'SET NULL',
          },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          agencyWorkspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(255), allowNull: false },
          status: {
            type: Sequelize.ENUM('draft', 'in_discussion', 'awaiting_signature', 'signed', 'lost'),
            allowNull: false,
            defaultValue: 'draft',
          },
          stage: {
            type: Sequelize.ENUM('qualification', 'scoping', 'commercials', 'legal', 'kickoff'),
            allowNull: false,
            defaultValue: 'qualification',
          },
          confidence: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          proposedAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
          targetStartDate: { type: Sequelize.DATE, allowNull: true },
          nextStep: { type: Sequelize.STRING(255), allowNull: true },
          nextStepDueAt: { type: Sequelize.DATE, allowNull: true },
          lastAgencyMessageAt: { type: Sequelize.DATE, allowNull: true },
          lastFreelancerMessageAt: { type: Sequelize.DATE, allowNull: true },
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
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'agency_retainer_negotiations',
        ['freelancerId', 'status'],
        { transaction, name: 'agency_retainer_negotiations_freelancer_status_idx' },
      );

      await queryInterface.createTable(
        'agency_retainer_events',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          negotiationId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'agency_retainer_negotiations', key: 'id' },
            onDelete: 'CASCADE',
          },
          actorType: {
            type: Sequelize.ENUM('freelancer', 'agency', 'system'),
            allowNull: false,
            defaultValue: 'freelancer',
          },
          actorId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          eventType: {
            type: Sequelize.ENUM('note', 'term_update', 'document_shared', 'meeting', 'status_change'),
            allowNull: false,
            defaultValue: 'note',
          },
          summary: { type: Sequelize.STRING(255), allowNull: false },
          payload: { type: jsonType, allowNull: true },
          occurredAt: { type: Sequelize.DATE, allowNull: false },
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

      await queryInterface.addIndex(
        'agency_retainer_events',
        ['negotiationId', 'occurredAt'],
        { transaction, name: 'agency_retainer_events_negotiation_occurred_idx' },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('agency_retainer_events', { transaction });
      await queryInterface.dropTable('agency_retainer_negotiations', { transaction });
      await queryInterface.dropTable('agency_rate_card_items', { transaction });
      await queryInterface.dropTable('agency_rate_cards', { transaction });
      await queryInterface.dropTable('agency_collaboration_invitations', { transaction });
      await queryInterface.dropTable('agency_collaborations', { transaction });

      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_agency_collaborations_status\"", { transaction });
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_agency_collaborations_collaborationType\"", { transaction });
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_agency_collaboration_invitations_status\"", { transaction });
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_agency_collaboration_invitations_engagementType\"", { transaction });
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_agency_rate_cards_status\"", { transaction });
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_agency_rate_card_items_unitType\"", { transaction });
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_agency_retainer_negotiations_status\"", { transaction });
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_agency_retainer_negotiations_stage\"", { transaction });
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_agency_retainer_events_actorType\"", { transaction });
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_agency_retainer_events_eventType\"", { transaction });
    });
  },
};

