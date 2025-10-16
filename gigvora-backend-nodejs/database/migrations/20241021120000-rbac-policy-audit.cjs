'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('rbac_policy_audit_events', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      policyKey: { type: Sequelize.STRING(80), allowNull: false },
      persona: { type: Sequelize.STRING(60), allowNull: false },
      action: { type: Sequelize.STRING(60), allowNull: false },
      resource: { type: Sequelize.STRING(120), allowNull: false },
      decision: { type: Sequelize.STRING(16), allowNull: false },
      reason: { type: Sequelize.STRING(255), allowNull: true },
      actorId: { type: Sequelize.STRING(60), allowNull: true },
      actorType: { type: Sequelize.STRING(40), allowNull: true },
      actorEmail: { type: Sequelize.STRING(160), allowNull: true },
      requestId: { type: Sequelize.STRING(64), allowNull: true },
      ipAddress: { type: Sequelize.STRING(64), allowNull: true },
      userAgent: { type: Sequelize.STRING(255), allowNull: true },
      responseStatus: { type: Sequelize.INTEGER, allowNull: true },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
      occurredAt: {
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
    });

    await queryInterface.addIndex('rbac_policy_audit_events', ['policyKey']);
    await queryInterface.addIndex('rbac_policy_audit_events', ['persona']);
    await queryInterface.addIndex('rbac_policy_audit_events', ['decision']);
    await queryInterface.addIndex('rbac_policy_audit_events', ['occurredAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('rbac_policy_audit_events');
  },
};
