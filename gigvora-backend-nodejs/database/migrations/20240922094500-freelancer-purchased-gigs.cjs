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

    await queryInterface.createTable('gig_orders', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      orderNumber: { type: Sequelize.STRING(24), allowNull: false, unique: true },
      gigId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'gigs', key: 'id' },
        onDelete: 'CASCADE',
      },
      clientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      freelancerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      clientCompanyName: { type: Sequelize.STRING(180), allowNull: false },
      clientContactName: { type: Sequelize.STRING(180), allowNull: true },
      clientContactEmail: { type: Sequelize.STRING(180), allowNull: true },
      clientContactPhone: { type: Sequelize.STRING(60), allowNull: true },
      status: {
        type: Sequelize.ENUM(
          'awaiting_requirements',
          'in_progress',
          'revision_requested',
          'ready_for_payout',
          'completed',
          'paused',
          'cancelled'
        ),
        allowNull: false,
        defaultValue: 'awaiting_requirements',
      },
      currencyCode: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      progressPercent: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      submittedAt: { type: Sequelize.DATE, allowNull: false },
      kickoffDueAt: { type: Sequelize.DATE, allowNull: true },
      dueAt: { type: Sequelize.DATE, allowNull: true },
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
    });

    await queryInterface.addIndex('gig_orders', ['gigId']);
    await queryInterface.addIndex('gig_orders', ['clientId']);
    await queryInterface.addIndex('gig_orders', ['freelancerId']);
    await queryInterface.addIndex('gig_orders', ['status']);
    await queryInterface.addIndex('gig_orders', ['dueAt']);

    await queryInterface.createTable('gig_order_requirements', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'gig_orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      status: {
        type: Sequelize.ENUM('pending', 'received', 'waived'),
        allowNull: false,
        defaultValue: 'pending',
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        allowNull: false,
        defaultValue: 'medium',
      },
      requestedAt: { type: Sequelize.DATE, allowNull: true },
      dueAt: { type: Sequelize.DATE, allowNull: true },
      receivedAt: { type: Sequelize.DATE, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      items: { type: jsonType, allowNull: true },
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

    await queryInterface.addIndex('gig_order_requirements', ['orderId']);
    await queryInterface.addIndex('gig_order_requirements', ['status']);
    await queryInterface.addIndex('gig_order_requirements', ['priority']);

    await queryInterface.createTable('gig_order_revisions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'gig_orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      roundNumber: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      status: {
        type: Sequelize.ENUM('requested', 'in_progress', 'submitted', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'requested',
      },
      severity: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        allowNull: false,
        defaultValue: 'medium',
      },
      focusAreas: { type: jsonType, allowNull: true },
      summary: { type: Sequelize.TEXT, allowNull: true },
      requestedAt: { type: Sequelize.DATE, allowNull: false },
      dueAt: { type: Sequelize.DATE, allowNull: true },
      submittedAt: { type: Sequelize.DATE, allowNull: true },
      approvedAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex('gig_order_revisions', ['orderId']);
    await queryInterface.addIndex('gig_order_revisions', ['status']);

    await queryInterface.createTable('gig_order_payouts', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'gig_orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      milestoneLabel: { type: Sequelize.STRING(255), allowNull: false },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      currencyCode: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      status: {
        type: Sequelize.ENUM('pending', 'scheduled', 'released', 'at_risk', 'on_hold'),
        allowNull: false,
        defaultValue: 'pending',
      },
      expectedAt: { type: Sequelize.DATE, allowNull: true },
      releasedAt: { type: Sequelize.DATE, allowNull: true },
      riskNote: { type: Sequelize.TEXT, allowNull: true },
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

    await queryInterface.addIndex('gig_order_payouts', ['orderId']);
    await queryInterface.addIndex('gig_order_payouts', ['status']);
    await queryInterface.addIndex('gig_order_payouts', ['expectedAt']);

    await queryInterface.createTable('gig_order_activities', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'gig_orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      freelancerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      actorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      activityType: {
        type: Sequelize.ENUM('order', 'requirement', 'revision', 'payout', 'communication', 'note', 'system'),
        allowNull: false,
        defaultValue: 'system',
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      occurredAt: {
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

    await queryInterface.addIndex('gig_order_activities', ['orderId']);
    await queryInterface.addIndex('gig_order_activities', ['freelancerId']);
    await queryInterface.addIndex('gig_order_activities', ['activityType']);
    await queryInterface.addIndex('gig_order_activities', ['occurredAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('gig_order_activities');
    await queryInterface.dropTable('gig_order_payouts');
    await queryInterface.dropTable('gig_order_revisions');
    await queryInterface.dropTable('gig_order_requirements');
    await queryInterface.dropTable('gig_orders');

    await dropEnum(queryInterface, 'enum_gig_orders_status');
    await dropEnum(queryInterface, 'enum_gig_order_requirements_status');
    await dropEnum(queryInterface, 'enum_gig_order_requirements_priority');
    await dropEnum(queryInterface, 'enum_gig_order_revisions_status');
    await dropEnum(queryInterface, 'enum_gig_order_revisions_severity');
    await dropEnum(queryInterface, 'enum_gig_order_payouts_status');
    await dropEnum(queryInterface, 'enum_gig_order_activities_activityType');
  },
};
