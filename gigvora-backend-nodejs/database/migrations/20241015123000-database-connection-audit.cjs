'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('database_audit_events', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      eventType: { type: Sequelize.STRING(60), allowNull: false },
      reason: { type: Sequelize.STRING(255), allowNull: true },
      initiatedBy: { type: Sequelize.STRING(120), allowNull: true },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
      recordedAt: {
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

    await queryInterface.addIndex('database_audit_events', ['eventType'], {
      name: 'database_audit_events_type_idx',
    });

    await queryInterface.addIndex('database_audit_events', ['recordedAt'], {
      name: 'database_audit_events_recorded_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('database_audit_events');
  },
};
