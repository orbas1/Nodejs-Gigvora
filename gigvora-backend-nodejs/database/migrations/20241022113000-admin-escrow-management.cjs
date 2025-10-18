'use strict';

const RELEASE_POLICY_TYPES = [
  'auto_release_after_hours',
  'client_confirmation',
  'milestone_approval',
  'manual_review',
];

const RELEASE_POLICY_STATUSES = ['draft', 'active', 'disabled'];
const FEE_TIER_STATUSES = ['active', 'inactive'];

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

async function dropEnumType(queryInterface, enumName) {
  const dialect = queryInterface.sequelize.getDialect();
  if (!['postgres', 'postgresql'].includes(dialect)) {
    return;
  }
  await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('escrow_release_policies', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(160), allowNull: false },
      policyType: {
        type: Sequelize.ENUM(...RELEASE_POLICY_TYPES),
        allowNull: false,
        defaultValue: 'auto_release_after_hours',
      },
      status: {
        type: Sequelize.ENUM(...RELEASE_POLICY_STATUSES),
        allowNull: false,
        defaultValue: 'draft',
      },
      thresholdAmount: { type: Sequelize.DECIMAL(18, 4), allowNull: true },
      thresholdHours: { type: Sequelize.INTEGER, allowNull: true },
      requiresComplianceHold: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      requiresManualApproval: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      notifyEmails: { type: jsonType, allowNull: false, defaultValue: [] },
      description: { type: Sequelize.STRING(500), allowNull: true },
      orderIndex: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
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

    await queryInterface.addIndex('escrow_release_policies', ['policyType']);
    await queryInterface.addIndex('escrow_release_policies', ['status']);
    await queryInterface.addIndex('escrow_release_policies', ['orderIndex']);

    await queryInterface.createTable('escrow_fee_tiers', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      provider: { type: Sequelize.STRING(80), allowNull: false, defaultValue: 'stripe' },
      currencyCode: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      minimumAmount: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      maximumAmount: { type: Sequelize.DECIMAL(18, 4), allowNull: true },
      percentFee: { type: Sequelize.DECIMAL(6, 3), allowNull: false, defaultValue: 0 },
      flatFee: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      status: {
        type: Sequelize.ENUM(...FEE_TIER_STATUSES),
        allowNull: false,
        defaultValue: 'active',
      },
      label: { type: Sequelize.STRING(160), allowNull: true },
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

    await queryInterface.addIndex('escrow_fee_tiers', ['provider']);
    await queryInterface.addIndex('escrow_fee_tiers', ['currencyCode']);
    await queryInterface.addIndex('escrow_fee_tiers', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('escrow_fee_tiers');
    await queryInterface.dropTable('escrow_release_policies');

    await dropEnumType(queryInterface, 'enum_escrow_fee_tiers_status');
    await dropEnumType(queryInterface, 'enum_escrow_release_policies_policyType');
    await dropEnumType(queryInterface, 'enum_escrow_release_policies_status');
  },
};
