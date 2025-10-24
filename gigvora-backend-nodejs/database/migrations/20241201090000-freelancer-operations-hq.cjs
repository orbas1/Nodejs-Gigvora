'use strict';

const resolveJsonType = (queryInterface, Sequelize) => {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);

      await queryInterface.createTable(
        'freelancer_operations_memberships',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          slug: { type: Sequelize.STRING(120), allowNull: false },
          name: { type: Sequelize.STRING(180), allowNull: false },
          status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'active' },
          role: { type: Sequelize.STRING(120), allowNull: true },
          description: { type: Sequelize.TEXT, allowNull: true },
          requestedAt: { type: Sequelize.DATE, allowNull: true },
          activatedAt: { type: Sequelize.DATE, allowNull: true },
          lastReviewedAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'freelancer_operations_memberships',
        ['freelancerId', 'slug'],
        {
          unique: true,
          name: 'freelancer_operations_memberships_freelancer_slug_unique',
          transaction,
        },
      );

      await queryInterface.createTable(
        'freelancer_operations_workflows',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          slug: { type: Sequelize.STRING(120), allowNull: false },
          title: { type: Sequelize.STRING(255), allowNull: false },
          status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'tracking' },
          completion: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          dueAt: { type: Sequelize.DATE, allowNull: true },
          blockers: { type: jsonType, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'freelancer_operations_workflows',
        ['freelancerId', 'slug'],
        {
          unique: true,
          name: 'freelancer_operations_workflows_freelancer_slug_unique',
          transaction,
        },
      );

      await queryInterface.addIndex(
        'freelancer_operations_workflows',
        ['freelancerId', 'status'],
        {
          name: 'freelancer_operations_workflows_status_idx',
          transaction,
        },
      );

      await queryInterface.createTable(
        'freelancer_operations_notices',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          slug: { type: Sequelize.STRING(120), allowNull: false },
          tone: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'info' },
          title: { type: Sequelize.STRING(255), allowNull: false },
          message: { type: Sequelize.TEXT, allowNull: false },
          acknowledged: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          acknowledgedAt: { type: Sequelize.DATE, allowNull: true },
          expiresAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'freelancer_operations_notices',
        ['freelancerId', 'slug'],
        {
          unique: true,
          name: 'freelancer_operations_notices_freelancer_slug_unique',
          transaction,
        },
      );

      await queryInterface.addIndex(
        'freelancer_operations_notices',
        ['freelancerId', 'acknowledged'],
        {
          name: 'freelancer_operations_notices_ack_idx',
          transaction,
        },
      );

      await queryInterface.createTable(
        'freelancer_operations_snapshots',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          activeWorkflows: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          escalations: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          automationCoverage: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          complianceScore: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          outstandingTasks: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          recentApprovals: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          nextReviewAt: { type: Sequelize.DATE, allowNull: true },
          lastSyncedAt: { type: Sequelize.DATE, allowNull: true },
          currency: { type: Sequelize.STRING(6), allowNull: false, defaultValue: 'USD' },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addConstraint('freelancer_operations_snapshots', {
        type: 'unique',
        fields: ['freelancerId'],
        name: 'freelancer_operations_snapshots_freelancer_unique',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('freelancer_operations_snapshots', { transaction });
      await queryInterface.dropTable('freelancer_operations_notices', { transaction });
      await queryInterface.dropTable('freelancer_operations_workflows', { transaction });
      await queryInterface.dropTable('freelancer_operations_memberships', { transaction });
    });
  },
};
