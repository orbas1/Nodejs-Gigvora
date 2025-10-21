'use strict';

const { resolveJsonType, dropEnum, safeRemoveIndex } = require('../utils/migrationHelpers.cjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);

      await queryInterface.createTable(
        'project_blueprints',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          projectId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: 'projects', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          summary: { type: Sequelize.TEXT, allowNull: true },
          methodology: { type: Sequelize.STRING(120), allowNull: true },
          governanceModel: { type: Sequelize.STRING(120), allowNull: true },
          sprintCadence: { type: Sequelize.STRING(80), allowNull: true },
          programManager: { type: Sequelize.STRING(120), allowNull: true },
          healthStatus: {
            type: Sequelize.ENUM('on_track', 'at_risk', 'critical'),
            allowNull: false,
            defaultValue: 'on_track',
          },
          startDate: { type: Sequelize.DATE, allowNull: true },
          endDate: { type: Sequelize.DATE, allowNull: true },
          lastReviewedAt: { type: Sequelize.DATE, allowNull: true },
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
        },
        { transaction },
      );

      await queryInterface.createTable(
        'project_blueprint_sprints',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          blueprintId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'project_blueprints', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          sequence: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
          name: { type: Sequelize.STRING(120), allowNull: false },
          objective: { type: Sequelize.TEXT, allowNull: true },
          startDate: { type: Sequelize.DATE, allowNull: true },
          endDate: { type: Sequelize.DATE, allowNull: true },
          status: {
            type: Sequelize.ENUM('planned', 'in_progress', 'blocked', 'completed'),
            allowNull: false,
            defaultValue: 'planned',
          },
          owner: { type: Sequelize.STRING(120), allowNull: true },
          velocityCommitment: { type: Sequelize.INTEGER, allowNull: true },
          progress: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          deliverables: { type: jsonType, allowNull: true },
          acceptanceCriteria: { type: Sequelize.TEXT, allowNull: true },
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
        },
        { transaction },
      );

      await queryInterface.createTable(
        'project_blueprint_dependencies',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          blueprintId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'project_blueprints', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          impactedSprintId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'project_blueprint_sprints', key: 'id' },
            onUpdate: 'SET NULL',
            onDelete: 'SET NULL',
          },
          name: { type: Sequelize.STRING(160), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          dependencyType: {
            type: Sequelize.ENUM('client', 'internal', 'external', 'third_party'),
            allowNull: false,
            defaultValue: 'internal',
          },
          owner: { type: Sequelize.STRING(120), allowNull: true },
          status: {
            type: Sequelize.ENUM('pending', 'in_progress', 'blocked', 'done'),
            allowNull: false,
            defaultValue: 'pending',
          },
          dueDate: { type: Sequelize.DATE, allowNull: true },
          riskLevel: {
            type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
            allowNull: false,
            defaultValue: 'medium',
          },
          impact: { type: Sequelize.STRING(255), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
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
        },
        { transaction },
      );

      await queryInterface.createTable(
        'project_blueprint_risks',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          blueprintId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'project_blueprints', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(160), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          probability: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 30 },
          impact: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 30 },
          severityScore: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 9.0 },
          status: {
            type: Sequelize.ENUM('open', 'monitoring', 'mitigated', 'closed'),
            allowNull: false,
            defaultValue: 'open',
          },
          owner: { type: Sequelize.STRING(120), allowNull: true },
          mitigationPlan: { type: Sequelize.TEXT, allowNull: true },
          contingencyPlan: { type: Sequelize.TEXT, allowNull: true },
          nextReviewAt: { type: Sequelize.DATE, allowNull: true },
          tags: { type: jsonType, allowNull: true },
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
        },
        { transaction },
      );

      await queryInterface.createTable(
        'project_billing_checkpoints',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          blueprintId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'project_blueprints', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          relatedSprintId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'project_blueprint_sprints', key: 'id' },
            onUpdate: 'SET NULL',
            onDelete: 'SET NULL',
          },
          name: { type: Sequelize.STRING(160), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          billingType: {
            type: Sequelize.ENUM('milestone', 'retainer', 'expense'),
            allowNull: false,
            defaultValue: 'milestone',
          },
          amount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          currency: { type: Sequelize.STRING(6), allowNull: true },
          dueDate: { type: Sequelize.DATE, allowNull: true },
          status: {
            type: Sequelize.ENUM('upcoming', 'invoiced', 'paid', 'overdue'),
            allowNull: false,
            defaultValue: 'upcoming',
          },
          approvalRequired: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          invoiceUrl: { type: Sequelize.STRING(255), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
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
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'project_blueprint_sprints',
        ['blueprintId', 'sequence'],
        { name: 'project_blueprint_sprints_sequence_idx', unique: true, transaction },
      );

      await queryInterface.addIndex(
        'project_blueprint_dependencies',
        ['blueprintId', 'status'],
        { name: 'project_blueprint_dependencies_status_idx', transaction },
      );

      await queryInterface.addIndex(
        'project_blueprint_risks',
        ['blueprintId', 'status'],
        { name: 'project_blueprint_risks_status_idx', transaction },
      );

      await queryInterface.addIndex(
        'project_billing_checkpoints',
        ['blueprintId', 'status', 'dueDate'],
        { name: 'project_billing_checkpoints_due_idx', transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await safeRemoveIndex(queryInterface, 'project_billing_checkpoints', 'project_billing_checkpoints_due_idx', {
        transaction,
      });
      await safeRemoveIndex(queryInterface, 'project_blueprint_risks', 'project_blueprint_risks_status_idx', {
        transaction,
      });
      await safeRemoveIndex(
        queryInterface,
        'project_blueprint_dependencies',
        'project_blueprint_dependencies_status_idx',
        { transaction },
      );
      await safeRemoveIndex(queryInterface, 'project_blueprint_sprints', 'project_blueprint_sprints_sequence_idx', {
        transaction,
      });

      await queryInterface.dropTable('project_billing_checkpoints', { transaction });
      await queryInterface.dropTable('project_blueprint_risks', { transaction });
      await queryInterface.dropTable('project_blueprint_dependencies', { transaction });
      await queryInterface.dropTable('project_blueprint_sprints', { transaction });
      await queryInterface.dropTable('project_blueprints', { transaction });

      const enumNames = [
        'enum_project_blueprints_healthStatus',
        'enum_project_blueprint_sprints_status',
        'enum_project_blueprint_dependencies_dependencyType',
        'enum_project_blueprint_dependencies_status',
        'enum_project_blueprint_dependencies_riskLevel',
        'enum_project_blueprint_risks_status',
        'enum_project_billing_checkpoints_billingType',
        'enum_project_billing_checkpoints_status',
      ];

      await Promise.all(enumNames.map((enumName) => dropEnum(queryInterface, enumName, transaction)));
    });
  },
};
