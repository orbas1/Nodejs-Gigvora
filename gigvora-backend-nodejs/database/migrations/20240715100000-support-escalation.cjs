'use strict';

const dropEnum = async (queryInterface, enumName) => {
  const dialect = queryInterface.sequelize.getDialect();
  if (dialect === 'postgres' || dialect === 'postgresql') {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`);
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())
      ? Sequelize.JSONB
      : Sequelize.JSON;

    await queryInterface.createTable('support_cases', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      threadId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'message_threads', key: 'id' },
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('triage', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'),
        allowNull: false,
        defaultValue: 'triage',
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
      },
      reason: { type: Sequelize.TEXT, allowNull: false },
      metadata: { type: jsonType, allowNull: true },
      escalatedBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      escalatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      assignedTo: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      assignedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      assignedAt: { type: Sequelize.DATE, allowNull: true },
      firstResponseAt: { type: Sequelize.DATE, allowNull: true },
      resolvedAt: { type: Sequelize.DATE, allowNull: true },
      resolvedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      resolutionSummary: { type: Sequelize.TEXT, allowNull: true },
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

    await queryInterface.addConstraint('support_cases', {
      fields: ['threadId'],
      type: 'unique',
      name: 'support_cases_thread_unique',
    });

    await queryInterface.addIndex('support_cases', ['status']);
    await queryInterface.addIndex('support_cases', ['priority']);
    await queryInterface.addIndex('support_cases', ['assignedTo']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('support_cases');
    await dropEnum(queryInterface, 'enum_support_cases_status');
    await dropEnum(queryInterface, 'enum_support_cases_priority');
  },
};
