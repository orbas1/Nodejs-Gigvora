'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('runtime_security_audit_events', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      eventType: { type: Sequelize.STRING(64), allowNull: false },
      level: { type: Sequelize.STRING(16), allowNull: false, defaultValue: 'info' },
      message: { type: Sequelize.STRING(512), allowNull: false },
      requestId: { type: Sequelize.STRING(64), allowNull: true },
      triggeredBy: { type: Sequelize.STRING(120), allowNull: true },
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

    await queryInterface.addIndex('runtime_security_audit_events', ['eventType']);
    await queryInterface.addIndex('runtime_security_audit_events', ['level']);
    await queryInterface.addIndex('runtime_security_audit_events', ['createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('runtime_security_audit_events');
  },
};
