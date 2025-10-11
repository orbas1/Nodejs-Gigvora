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

    await queryInterface.createTable('escrow_accounts', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      provider: { type: Sequelize.STRING(80), allowNull: false },
      externalId: { type: Sequelize.STRING(120), allowNull: true },
      status: {
        type: Sequelize.ENUM('pending', 'active', 'suspended', 'closed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      currencyCode: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      currentBalance: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      pendingReleaseTotal: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      metadata: { type: jsonType, allowNull: true },
      lastReconciledAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex('escrow_accounts', ['userId']);
    await queryInterface.addIndex('escrow_accounts', ['provider']);
    await queryInterface.addIndex('escrow_accounts', ['status']);

    await queryInterface.createTable('escrow_transactions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      accountId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'escrow_accounts', key: 'id' },
        onDelete: 'CASCADE',
      },
      reference: { type: Sequelize.STRING(120), allowNull: false, unique: true },
      externalId: { type: Sequelize.STRING(120), allowNull: true },
      type: {
        type: Sequelize.ENUM('project', 'gig', 'milestone', 'retainer'),
        allowNull: false,
        defaultValue: 'project',
      },
      status: {
        type: Sequelize.ENUM('initiated', 'funded', 'in_escrow', 'released', 'refunded', 'cancelled', 'disputed'),
        allowNull: false,
        defaultValue: 'initiated',
      },
      amount: { type: Sequelize.DECIMAL(18, 4), allowNull: false },
      currencyCode: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      feeAmount: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      netAmount: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      initiatedById: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      counterpartyId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      projectId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'projects', key: 'id' },
        onDelete: 'SET NULL',
      },
      gigId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'gigs', key: 'id' },
        onDelete: 'SET NULL',
      },
      milestoneLabel: { type: Sequelize.STRING(180), allowNull: true },
      scheduledReleaseAt: { type: Sequelize.DATE, allowNull: true },
      releasedAt: { type: Sequelize.DATE, allowNull: true },
      refundedAt: { type: Sequelize.DATE, allowNull: true },
      cancelledAt: { type: Sequelize.DATE, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      auditTrail: { type: jsonType, allowNull: true },
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

    await queryInterface.addIndex('escrow_transactions', ['accountId']);
    await queryInterface.addIndex('escrow_transactions', ['status']);
    await queryInterface.addIndex('escrow_transactions', ['projectId']);
    await queryInterface.addIndex('escrow_transactions', ['gigId']);
    await queryInterface.addIndex('escrow_transactions', ['scheduledReleaseAt']);

    await queryInterface.createTable('dispute_cases', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      escrowTransactionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'escrow_transactions', key: 'id' },
        onDelete: 'CASCADE',
      },
      openedById: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      assignedToId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      stage: {
        type: Sequelize.ENUM('intake', 'mediation', 'arbitration', 'resolved'),
        allowNull: false,
        defaultValue: 'intake',
      },
      status: {
        type: Sequelize.ENUM('open', 'awaiting_customer', 'under_review', 'settled', 'closed'),
        allowNull: false,
        defaultValue: 'open',
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
      },
      reasonCode: { type: Sequelize.STRING(80), allowNull: false },
      summary: { type: Sequelize.TEXT, allowNull: false },
      customerDeadlineAt: { type: Sequelize.DATE, allowNull: true },
      providerDeadlineAt: { type: Sequelize.DATE, allowNull: true },
      resolutionNotes: { type: Sequelize.TEXT, allowNull: true },
      openedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      resolvedAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex('dispute_cases', ['escrowTransactionId']);
    await queryInterface.addIndex('dispute_cases', ['stage']);
    await queryInterface.addIndex('dispute_cases', ['status']);
    await queryInterface.addIndex('dispute_cases', ['priority']);
    await queryInterface.addIndex('dispute_cases', ['openedById']);

    await queryInterface.createTable('dispute_events', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      disputeCaseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'dispute_cases', key: 'id' },
        onDelete: 'CASCADE',
      },
      actorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      actorType: {
        type: Sequelize.ENUM('customer', 'provider', 'mediator', 'admin', 'system'),
        allowNull: false,
        defaultValue: 'system',
      },
      actionType: {
        type: Sequelize.ENUM('comment', 'evidence_upload', 'deadline_adjusted', 'stage_advanced', 'status_change', 'system_notice'),
        allowNull: false,
        defaultValue: 'comment',
      },
      notes: { type: Sequelize.TEXT, allowNull: true },
      evidenceKey: { type: Sequelize.STRING(255), allowNull: true },
      evidenceUrl: { type: Sequelize.TEXT, allowNull: true },
      evidenceFileName: { type: Sequelize.STRING(180), allowNull: true },
      evidenceContentType: { type: Sequelize.STRING(80), allowNull: true },
      eventAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
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

    await queryInterface.addIndex('dispute_events', ['disputeCaseId']);
    await queryInterface.addIndex('dispute_events', ['actorType']);
    await queryInterface.addIndex('dispute_events', ['actionType']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('dispute_events');
    await queryInterface.dropTable('dispute_cases');
    await queryInterface.dropTable('escrow_transactions');
    await queryInterface.dropTable('escrow_accounts');

    await dropEnum(queryInterface, 'enum_dispute_events_actorType');
    await dropEnum(queryInterface, 'enum_dispute_events_actionType');
    await dropEnum(queryInterface, 'enum_dispute_cases_stage');
    await dropEnum(queryInterface, 'enum_dispute_cases_status');
    await dropEnum(queryInterface, 'enum_dispute_cases_priority');
    await dropEnum(queryInterface, 'enum_escrow_transactions_type');
    await dropEnum(queryInterface, 'enum_escrow_transactions_status');
    await dropEnum(queryInterface, 'enum_escrow_accounts_status');
  },
};
