'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.addColumn('wallet_accounts', 'displayName', {
      type: Sequelize.STRING(120),
      allowNull: true,
    });

    await queryInterface.addColumn('wallet_accounts', 'workspaceId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'provider_workspaces', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addIndex('wallet_accounts', ['workspaceId'], {
      name: 'wallet_accounts_workspace_idx',
    });

    await queryInterface.createTable('wallet_funding_sources', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      label: { type: Sequelize.STRING(160), allowNull: false },
      type: { type: Sequelize.STRING(40), allowNull: false },
      provider: { type: Sequelize.STRING(120), allowNull: true },
      accountNumberLast4: { type: Sequelize.STRING(12), allowNull: true },
      currencyCode: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'active' },
      isPrimary: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      updatedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
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
    });

    await queryInterface.addIndex('wallet_funding_sources', ['workspaceId'], {
      name: 'wallet_funding_sources_workspace_idx',
    });

    await queryInterface.addIndex('wallet_funding_sources', ['status'], {
      name: 'wallet_funding_sources_status_idx',
    });

    await queryInterface.createTable('wallet_operational_settings', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      lowBalanceAlertThreshold: { type: Sequelize.DECIMAL(18, 2), allowNull: true },
      autoSweepEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      autoSweepThreshold: { type: Sequelize.DECIMAL(18, 2), allowNull: true },
      reconciliationCadence: { type: Sequelize.STRING(20), allowNull: true },
      dualControlEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      complianceContactEmail: { type: Sequelize.STRING(160), allowNull: true },
      payoutWindow: { type: Sequelize.STRING(40), allowNull: true },
      riskTier: { type: Sequelize.STRING(40), allowNull: true },
      complianceNotes: { type: Sequelize.STRING(500), allowNull: true },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      updatedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
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
    });

    await queryInterface.createTable('wallet_transfer_rules', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      name: { type: Sequelize.STRING(160), allowNull: false },
      triggerType: { type: Sequelize.STRING(40), allowNull: false },
      thresholdAmount: { type: Sequelize.DECIMAL(18, 2), allowNull: true },
      scheduleCron: { type: Sequelize.STRING(120), allowNull: true },
      destinationFundingSourceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'wallet_funding_sources', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      updatedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
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
    });

    await queryInterface.addIndex('wallet_transfer_rules', ['workspaceId'], {
      name: 'wallet_transfer_rules_workspace_idx',
    });

    await queryInterface.addIndex('wallet_transfer_rules', ['isActive'], {
      name: 'wallet_transfer_rules_active_idx',
    });

    await queryInterface.addIndex('wallet_transfer_rules', ['destinationFundingSourceId'], {
      name: 'wallet_transfer_rules_destination_idx',
    });

    await queryInterface.createTable('wallet_payout_requests', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      walletAccountId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'wallet_accounts', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      fundingSourceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'wallet_funding_sources', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      currencyCode: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'pending_review' },
      requestedById: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      reviewedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      processedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      requestedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      approvedAt: { type: Sequelize.DATE, allowNull: true },
      processedAt: { type: Sequelize.DATE, allowNull: true },
      notes: { type: Sequelize.STRING(500), allowNull: true },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
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

    await queryInterface.addIndex('wallet_payout_requests', ['workspaceId'], {
      name: 'wallet_payout_requests_workspace_idx',
    });

    await queryInterface.addIndex('wallet_payout_requests', ['status'], {
      name: 'wallet_payout_requests_status_idx',
    });

    await queryInterface.addIndex('wallet_payout_requests', ['walletAccountId'], {
      name: 'wallet_payout_requests_account_idx',
    });

    await queryInterface.addIndex('wallet_payout_requests', ['fundingSourceId'], {
      name: 'wallet_payout_requests_funding_idx',
    });

    await queryInterface.addIndex('wallet_payout_requests', ['requestedById'], {
      name: 'wallet_payout_requests_requested_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('wallet_payout_requests', 'wallet_payout_requests_requested_idx');
    await queryInterface.removeIndex('wallet_payout_requests', 'wallet_payout_requests_funding_idx');
    await queryInterface.removeIndex('wallet_payout_requests', 'wallet_payout_requests_account_idx');
    await queryInterface.removeIndex('wallet_payout_requests', 'wallet_payout_requests_status_idx');
    await queryInterface.removeIndex('wallet_payout_requests', 'wallet_payout_requests_workspace_idx');
    await queryInterface.dropTable('wallet_payout_requests');

    await queryInterface.removeIndex('wallet_transfer_rules', 'wallet_transfer_rules_destination_idx');
    await queryInterface.removeIndex('wallet_transfer_rules', 'wallet_transfer_rules_active_idx');
    await queryInterface.removeIndex('wallet_transfer_rules', 'wallet_transfer_rules_workspace_idx');
    await queryInterface.dropTable('wallet_transfer_rules');

    await queryInterface.dropTable('wallet_operational_settings');

    await queryInterface.removeIndex('wallet_funding_sources', 'wallet_funding_sources_status_idx');
    await queryInterface.removeIndex('wallet_funding_sources', 'wallet_funding_sources_workspace_idx');
    await queryInterface.dropTable('wallet_funding_sources');

    await queryInterface.removeIndex('wallet_accounts', 'wallet_accounts_workspace_idx');
    await queryInterface.removeColumn('wallet_accounts', 'workspaceId');
    await queryInterface.removeColumn('wallet_accounts', 'displayName');
  },
};
