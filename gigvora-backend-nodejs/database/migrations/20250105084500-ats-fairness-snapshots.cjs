'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

    await queryInterface.createTable('ats_fairness_snapshots', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      workspaceId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'provider_workspaces',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      recordedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
      fairnessScore: {
        allowNull: false,
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
      },
      automationCoverage: {
        allowNull: false,
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
      },
      newcomerShare: {
        allowNull: false,
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
      },
      rotationHealthScore: {
        allowNull: true,
        type: Sequelize.DECIMAL(5, 2),
      },
      biasAlertCount: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      flaggedStagesCount: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      departmentBreakdown: {
        allowNull: true,
        type: jsonType,
      },
      recruiterBreakdown: {
        allowNull: true,
        type: jsonType,
      },
      notes: {
        allowNull: true,
        type: jsonType,
      },
      metadata: {
        allowNull: true,
        type: jsonType,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('ats_fairness_snapshots', ['workspaceId']);
    await queryInterface.addIndex('ats_fairness_snapshots', ['recordedAt']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('ats_fairness_snapshots', ['workspaceId']);
    await queryInterface.removeIndex('ats_fairness_snapshots', ['recordedAt']);
    await queryInterface.dropTable('ats_fairness_snapshots');
  },
};
