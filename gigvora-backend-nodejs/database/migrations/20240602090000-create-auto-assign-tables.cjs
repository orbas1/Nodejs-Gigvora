'use strict';

const AUTO_ASSIGN_STATUSES = [
  'pending',
  'notified',
  'accepted',
  'declined',
  'expired',
  'reassigned',
  'completed',
];

const TARGET_TYPES = ['job', 'gig', 'project', 'launchpad', 'volunteer'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'freelancer_assignment_metrics',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          rating: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
          completionRate: { type: Sequelize.DECIMAL(5, 4), allowNull: true },
          avgAssignedValue: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          lifetimeAssignedValue: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
          lifetimeCompletedValue: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
          lastAssignedAt: { type: Sequelize.DATE, allowNull: true },
          lastCompletedAt: { type: Sequelize.DATE, allowNull: true },
          totalAssigned: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          totalCompleted: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'auto_assign_queue_entries',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          targetType: { type: Sequelize.ENUM(...TARGET_TYPES), allowNull: false },
          targetId: { type: Sequelize.INTEGER, allowNull: false },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          score: { type: Sequelize.DECIMAL(10, 4), allowNull: false },
          priorityBucket: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 2 },
          status: { type: Sequelize.ENUM(...AUTO_ASSIGN_STATUSES), allowNull: false, defaultValue: 'pending' },
          expiresAt: { type: Sequelize.DATE, allowNull: true },
          notifiedAt: { type: Sequelize.DATE, allowNull: true },
          resolvedAt: { type: Sequelize.DATE, allowNull: true },
          projectValue: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          metadata: {
            type: ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())
              ? Sequelize.JSONB
              : Sequelize.JSON,
            allowNull: true,
          },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'auto_assign_queue_entries',
        ['targetType', 'targetId', 'status'],
        { name: 'auto_assign_queue_target_status_idx', transaction },
      );

      await queryInterface.addIndex(
        'auto_assign_queue_entries',
        ['freelancerId', 'status', 'expiresAt'],
        { name: 'auto_assign_queue_freelancer_status_idx', transaction },
      );

      await queryInterface.addConstraint('auto_assign_queue_entries', {
        type: 'unique',
        fields: ['targetType', 'targetId', 'freelancerId', 'status'],
        name: 'auto_assign_queue_unique_active',
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeConstraint('auto_assign_queue_entries', 'auto_assign_queue_unique_active', { transaction });
      await queryInterface.removeIndex('auto_assign_queue_entries', 'auto_assign_queue_target_status_idx', { transaction });
      await queryInterface.removeIndex('auto_assign_queue_entries', 'auto_assign_queue_freelancer_status_idx', { transaction });
      await queryInterface.dropTable('auto_assign_queue_entries', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_auto_assign_queue_entries_targetType"', {
        transaction,
      });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_auto_assign_queue_entries_status"', {
        transaction,
      });
      await queryInterface.dropTable('freelancer_assignment_metrics', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
