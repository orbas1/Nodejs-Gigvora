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

    await queryInterface.createTable('dispute_workflow_settings', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
      },
      defaultAssigneeId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      responseSlaHours: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 24 },
      resolutionSlaHours: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 120 },
      autoEscalateHours: { type: Sequelize.INTEGER, allowNull: true },
      autoCloseHours: { type: Sequelize.INTEGER, allowNull: true },
      evidenceRequirements: { type: jsonType, allowNull: true },
      notificationEmails: { type: jsonType, allowNull: true },
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

    await queryInterface.addIndex('dispute_workflow_settings', ['workspaceId']);

    await queryInterface.createTable('dispute_templates', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(120), allowNull: false },
      reasonCode: { type: Sequelize.STRING(80), allowNull: true },
      defaultStage: {
        type: Sequelize.ENUM('intake', 'mediation', 'arbitration', 'resolved'),
        allowNull: false,
        defaultValue: 'intake',
      },
      defaultPriority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
      },
      guidance: { type: Sequelize.TEXT, allowNull: true },
      checklist: { type: jsonType, allowNull: true },
      active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      updatedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
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

    await queryInterface.addIndex('dispute_templates', ['workspaceId']);
    await queryInterface.addIndex('dispute_templates', ['active']);
    await queryInterface.addIndex('dispute_templates', ['reasonCode']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('dispute_templates');
    await dropEnum(queryInterface, 'enum_dispute_templates_defaultStage');
    await dropEnum(queryInterface, 'enum_dispute_templates_defaultPriority');
    await queryInterface.dropTable('dispute_workflow_settings');
  },
};
