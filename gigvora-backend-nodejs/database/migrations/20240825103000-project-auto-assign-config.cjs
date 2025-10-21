'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      await queryInterface.addColumn(
        'projects',
        'budgetAmount',
        { type: Sequelize.DECIMAL(12, 2), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'projects',
        'budgetCurrency',
        { type: Sequelize.STRING(6), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'projects',
        'autoAssignEnabled',
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        { transaction },
      );

      await queryInterface.addColumn(
        'projects',
        'autoAssignStatus',
        { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'inactive' },
        { transaction },
      );

      await queryInterface.addColumn(
        'projects',
        'autoAssignSettings',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'projects',
        'autoAssignLastRunAt',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'projects',
        'autoAssignLastQueueSize',
        { type: Sequelize.INTEGER, allowNull: true },
        { transaction },
      );

      await queryInterface.createTable(
        'project_assignment_events',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          projectId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'projects', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          actorId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'SET NULL',
            onDelete: 'SET NULL',
          },
          eventType: {
            type: Sequelize.ENUM(
              'created',
              'auto_assign_enabled',
              'auto_assign_disabled',
              'auto_assign_queue_generated',
              'auto_assign_queue_exhausted',
            ),
            allowNull: false,
          },
          payload: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false },
          updatedAt: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'project_assignment_events',
        ['projectId', 'eventType', 'createdAt'],
        { name: 'project_assignment_events_project_event_idx', transaction },
      );

      await queryInterface.addIndex(
        'auto_assign_queue_entries',
        ['targetType', 'targetId', 'status', 'createdAt'],
        { name: 'auto_assign_queue_target_status_time_idx', transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeIndex(
        'auto_assign_queue_entries',
        'auto_assign_queue_target_status_time_idx',
        { transaction },
      );
      await queryInterface.dropTable('project_assignment_events', { transaction });
      await queryInterface.removeColumn('projects', 'autoAssignLastQueueSize', { transaction });
      await queryInterface.removeColumn('projects', 'autoAssignLastRunAt', { transaction });
      await queryInterface.removeColumn('projects', 'autoAssignSettings', { transaction });
      await queryInterface.removeColumn('projects', 'autoAssignStatus', { transaction });
      await queryInterface.removeColumn('projects', 'autoAssignEnabled', { transaction });
      await queryInterface.removeColumn('projects', 'budgetCurrency', { transaction });
      await queryInterface.removeColumn('projects', 'budgetAmount', { transaction });
      const dialect = queryInterface.sequelize.getDialect();
      if (dialect === 'postgres' || dialect === 'postgresql') {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_project_assignment_events_eventType"', {
          transaction,
        });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
