'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('finance_revenue_entries', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      revenueType: { type: Sequelize.STRING(32), allowNull: false },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'recognized' },
      source: { type: Sequelize.STRING(64), allowNull: true },
      clientName: { type: Sequelize.STRING(255), allowNull: true },
      invoiceNumber: { type: Sequelize.STRING(64), allowNull: true },
      amount: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      currencyCode: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      taxWithholdingAmount: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      taxCategory: { type: Sequelize.STRING(64), allowNull: true },
      recognizedAt: { type: Sequelize.DATE, allowNull: false },
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

    await queryInterface.addIndex('finance_revenue_entries', ['userId', 'recognizedAt']);
    await queryInterface.addIndex('finance_revenue_entries', ['userId', 'revenueType']);

    await queryInterface.createTable('finance_expense_entries', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      category: { type: Sequelize.STRING(64), allowNull: false },
      vendorName: { type: Sequelize.STRING(255), allowNull: true },
      cadence: { type: Sequelize.STRING(32), allowNull: true },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'posted' },
      amount: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      currencyCode: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      occurredAt: { type: Sequelize.DATE, allowNull: false },
      isTaxDeductible: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      receiptUrl: { type: Sequelize.STRING(1000), allowNull: true },
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

    await queryInterface.addIndex('finance_expense_entries', ['userId', 'occurredAt']);
    await queryInterface.addIndex('finance_expense_entries', ['userId', 'category']);

    await queryInterface.createTable('finance_savings_goals', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      name: { type: Sequelize.STRING(255), allowNull: false },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'active' },
      targetAmount: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      currentAmount: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      currencyCode: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      automationType: { type: Sequelize.STRING(32), allowNull: true },
      automationAmount: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
      automationCadence: { type: Sequelize.STRING(32), allowNull: true },
      isRunwayReserve: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      lastContributionAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex('finance_savings_goals', ['userId', 'status']);

    await queryInterface.createTable('finance_payout_batches', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      name: { type: Sequelize.STRING(255), allowNull: false },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'completed' },
      totalAmount: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      currencyCode: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      scheduledAt: { type: Sequelize.DATE, allowNull: true },
      executedAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex('finance_payout_batches', ['userId', 'executedAt']);

    await queryInterface.createTable('finance_payout_splits', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      batchId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'finance_payout_batches', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      teammateName: { type: Sequelize.STRING(255), allowNull: false },
      teammateRole: { type: Sequelize.STRING(120), allowNull: true },
      recipientEmail: { type: Sequelize.STRING(255), allowNull: true },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'completed' },
      sharePercentage: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      amount: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      currencyCode: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
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

    await queryInterface.addIndex('finance_payout_splits', ['batchId']);

    await queryInterface.createTable('finance_forecast_scenarios', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      label: { type: Sequelize.STRING(255), allowNull: false },
      scenarioType: { type: Sequelize.STRING(32), allowNull: false },
      timeframe: { type: Sequelize.STRING(64), allowNull: true },
      confidence: { type: Sequelize.DECIMAL(5, 4), allowNull: true },
      projectedAmount: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      currencyCode: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      notes: { type: Sequelize.TEXT, allowNull: true },
      generatedAt: { type: Sequelize.DATE, allowNull: false },
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

    await queryInterface.addIndex('finance_forecast_scenarios', ['userId', 'generatedAt']);
    await queryInterface.addIndex('finance_forecast_scenarios', ['userId', 'scenarioType']);

    await queryInterface.createTable('finance_tax_exports', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      exportType: { type: Sequelize.STRING(32), allowNull: false },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'available' },
      periodStart: { type: Sequelize.DATE, allowNull: false },
      periodEnd: { type: Sequelize.DATE, allowNull: false },
      amount: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      currencyCode: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      downloadUrl: { type: Sequelize.STRING(1000), allowNull: true },
      generatedAt: { type: Sequelize.DATE, allowNull: false },
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

    await queryInterface.addIndex('finance_tax_exports', ['userId', 'periodEnd']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('finance_tax_exports');
    await queryInterface.dropTable('finance_forecast_scenarios');
    await queryInterface.dropTable('finance_payout_splits');
    await queryInterface.dropTable('finance_payout_batches');
    await queryInterface.dropTable('finance_savings_goals');
    await queryInterface.dropTable('finance_expense_entries');
    await queryInterface.dropTable('finance_revenue_entries');
  },
};
