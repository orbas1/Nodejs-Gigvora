'use strict';

const ORDER_PIPELINE_STATUSES = [
  'inquiry',
  'qualification',
  'kickoff_scheduled',
  'production',
  'delivery',
  'completed',
  'cancelled',
  'on_hold',
];

const REQUIREMENT_FORM_STATUSES = [
  'draft',
  'pending_client',
  'in_progress',
  'submitted',
  'approved',
  'needs_revision',
  'archived',
];

const REVISION_STATUSES = [
  'open',
  'in_progress',
  'submitted',
  'approved',
  'declined',
  'cancelled',
];

const ESCROW_CHECKPOINT_STATUSES = [
  'funded',
  'pending_release',
  'released',
  'held',
  'refunded',
  'disputed',
  'cancelled',
];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('gig_orders', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      orderNumber: { type: Sequelize.STRING(36), allowNull: false, unique: true },
      freelancerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      clientId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      clientName: { type: Sequelize.STRING(180), allowNull: false },
      clientEmail: { type: Sequelize.STRING(180), allowNull: true },
      clientOrganization: { type: Sequelize.STRING(180), allowNull: true },
      gigTitle: { type: Sequelize.STRING(180), allowNull: false },
      pipelineStage: {
        type: Sequelize.ENUM(...ORDER_PIPELINE_STATUSES),
        allowNull: false,
        defaultValue: 'inquiry',
      },
      status: {
        type: Sequelize.ENUM('open', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'open',
      },
      intakeStatus: {
        type: Sequelize.ENUM('not_started', 'in_progress', 'completed'),
        allowNull: false,
        defaultValue: 'not_started',
      },
      kickoffScheduledAt: { type: Sequelize.DATE, allowNull: true },
      kickoffStatus: {
        type: Sequelize.ENUM('not_scheduled', 'scheduled', 'completed', 'needs_reschedule'),
        allowNull: false,
        defaultValue: 'not_scheduled',
      },
      productionStartedAt: { type: Sequelize.DATE, allowNull: true },
      deliveryDueAt: { type: Sequelize.DATE, allowNull: true },
      deliveredAt: { type: Sequelize.DATE, allowNull: true },
      csatScore: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
      valueAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      valueCurrency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      escrowTotalAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      escrowCurrency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      notes: { type: Sequelize.TEXT, allowNull: true },
      tags: { type: Sequelize.JSON, allowNull: true },
      lastClientContactAt: { type: Sequelize.DATE, allowNull: true },
      nextClientTouchpointAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('gig_orders', ['freelancerId', 'pipelineStage']);
    await queryInterface.addIndex('gig_orders', ['orderNumber']);

    await queryInterface.createTable('gig_order_requirement_forms', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'gig_orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM(...REQUIREMENT_FORM_STATUSES),
        allowNull: false,
        defaultValue: 'pending_client',
      },
      schemaVersion: { type: Sequelize.STRING(36), allowNull: true },
      questions: { type: Sequelize.JSON, allowNull: true },
      responses: { type: Sequelize.JSON, allowNull: true },
      requestedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      submittedAt: { type: Sequelize.DATE, allowNull: true },
      approvedAt: { type: Sequelize.DATE, allowNull: true },
      reviewerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      lastReminderAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('gig_order_requirement_forms', ['orderId', 'status']);

    await queryInterface.createTable('gig_order_revisions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'gig_orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      revisionNumber: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      status: {
        type: Sequelize.ENUM(...REVISION_STATUSES),
        allowNull: false,
        defaultValue: 'open',
      },
      summary: { type: Sequelize.STRING(255), allowNull: true },
      details: { type: Sequelize.JSON, allowNull: true },
      requestedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      requestedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      dueAt: { type: Sequelize.DATE, allowNull: true },
      completedAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('gig_order_revisions', ['orderId', 'status']);

    await queryInterface.createTable('gig_order_escrow_checkpoints', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'gig_orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      label: { type: Sequelize.STRING(120), allowNull: false },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      status: {
        type: Sequelize.ENUM(...ESCROW_CHECKPOINT_STATUSES),
        allowNull: false,
        defaultValue: 'funded',
      },
      approvalRequirement: { type: Sequelize.STRING(120), allowNull: true },
      csatThreshold: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
      releasedAt: { type: Sequelize.DATE, allowNull: true },
      releasedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      payoutReference: { type: Sequelize.STRING(120), allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('gig_order_escrow_checkpoints', ['orderId', 'status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('gig_order_escrow_checkpoints');
    await queryInterface.dropTable('gig_order_revisions');
    await queryInterface.dropTable('gig_order_requirement_forms');
    await queryInterface.dropTable('gig_orders');

    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS `enum_gig_orders_pipelineStage`;",
    ).catch(() => {});
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS `enum_gig_orders_status`;",
    ).catch(() => {});
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS `enum_gig_orders_intakeStatus`;",
    ).catch(() => {});
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS `enum_gig_orders_kickoffStatus`;",
    ).catch(() => {});
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS `enum_gig_order_requirement_forms_status`;",
    ).catch(() => {});
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS `enum_gig_order_revisions_status`;",
    ).catch(() => {});
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS `enum_gig_order_escrow_checkpoints_status`;",
    ).catch(() => {});
  },
};
