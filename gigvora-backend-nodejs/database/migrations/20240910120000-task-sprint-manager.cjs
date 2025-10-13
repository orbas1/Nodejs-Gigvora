'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('sprint_cycles', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      projectId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      name: { type: Sequelize.STRING(180), allowNull: false },
      goal: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM('planning', 'active', 'completed', 'archived'),
        allowNull: false,
        defaultValue: 'planning',
      },
      startDate: { type: Sequelize.DATE, allowNull: true },
      endDate: { type: Sequelize.DATE, allowNull: true },
      velocityTarget: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
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

    await queryInterface.addIndex('sprint_cycles', ['projectId']);
    await queryInterface.addIndex('sprint_cycles', ['status']);

    await queryInterface.createTable('sprint_tasks', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      projectId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      sprintId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'sprint_cycles', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM('backlog', 'ready', 'in_progress', 'review', 'blocked', 'done'),
        allowNull: false,
        defaultValue: 'backlog',
      },
      type: { type: Sequelize.STRING(60), allowNull: true },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'medium',
      },
      storyPoints: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      sequence: { type: Sequelize.INTEGER, allowNull: true },
      assigneeId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      reporterId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      dueDate: { type: Sequelize.DATE, allowNull: true },
      startedAt: { type: Sequelize.DATE, allowNull: true },
      completedAt: { type: Sequelize.DATE, allowNull: true },
      blockedReason: { type: Sequelize.TEXT, allowNull: true },
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

    await queryInterface.addIndex('sprint_tasks', ['projectId']);
    await queryInterface.addIndex('sprint_tasks', ['sprintId']);
    await queryInterface.addIndex('sprint_tasks', ['status']);
    await queryInterface.addIndex('sprint_tasks', ['assigneeId']);

    await queryInterface.createTable('sprint_task_dependencies', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      taskId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'sprint_tasks', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      dependsOnTaskId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'sprint_tasks', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      dependencyType: { type: Sequelize.STRING(60), allowNull: true },
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

    await queryInterface.addConstraint('sprint_task_dependencies', {
      type: 'unique',
      fields: ['taskId', 'dependsOnTaskId'],
      name: 'uniq_sprint_task_dependencies_pair',
    });

    await queryInterface.createTable('sprint_task_time_entries', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      taskId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'sprint_tasks', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      startedAt: { type: Sequelize.DATE, allowNull: true },
      endedAt: { type: Sequelize.DATE, allowNull: true },
      minutesSpent: { type: Sequelize.INTEGER, allowNull: false },
      billable: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      hourlyRate: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      approvedAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex('sprint_task_time_entries', ['taskId']);
    await queryInterface.addIndex('sprint_task_time_entries', ['userId']);
    await queryInterface.addIndex('sprint_task_time_entries', ['billable']);

    await queryInterface.createTable('sprint_risks', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      projectId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      sprintId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'sprint_cycles', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      taskId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'sprint_tasks', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      probability: { type: Sequelize.DECIMAL(4, 2), allowNull: true },
      impact: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'medium',
      },
      severityScore: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      mitigationPlan: { type: Sequelize.TEXT, allowNull: true },
      ownerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('open', 'mitigating', 'resolved', 'closed'),
        allowNull: false,
        defaultValue: 'open',
      },
      loggedAt: { type: Sequelize.DATE, allowNull: true },
      reviewAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex('sprint_risks', ['projectId']);
    await queryInterface.addIndex('sprint_risks', ['sprintId']);
    await queryInterface.addIndex('sprint_risks', ['status']);

    await queryInterface.createTable('change_requests', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      projectId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      sprintId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'sprint_cycles', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM('draft', 'pending_approval', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending_approval',
      },
      requestedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      approvedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      approvedAt: { type: Sequelize.DATE, allowNull: true },
      approvalMetadata: { type: jsonType, allowNull: true },
      eSignDocumentUrl: { type: Sequelize.STRING(500), allowNull: true },
      eSignAuditTrail: { type: jsonType, allowNull: true },
      changeImpact: { type: jsonType, allowNull: true },
      decisionNotes: { type: Sequelize.TEXT, allowNull: true },
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

    await queryInterface.addIndex('change_requests', ['projectId']);
    await queryInterface.addIndex('change_requests', ['sprintId']);
    await queryInterface.addIndex('change_requests', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('change_requests');
    await queryInterface.dropTable('sprint_risks');
    await queryInterface.dropTable('sprint_task_time_entries');
    await queryInterface.dropTable('sprint_task_dependencies');
    await queryInterface.dropTable('sprint_tasks');
    await queryInterface.dropTable('sprint_cycles');
  },
};
