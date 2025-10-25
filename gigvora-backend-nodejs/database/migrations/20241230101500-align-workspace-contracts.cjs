'use strict';

const { resolveJsonType, dropEnum, safeRemoveIndex } = require('../utils/migrationHelpers.cjs');

const TABLE = 'pgm_project_workspaces';
const STATUS_INDEX = 'pgm_project_workspaces_status_idx';
const OLD_STATUS_ENUM = 'enum_pgm_project_workspaces_status';
const OLD_STATUS_VALUES = ['planning', 'in_progress', 'at_risk', 'completed', 'on_hold'];
const NEW_STATUS_VALUES = ['briefing', 'active', 'blocked', 'completed'];

function buildStatusMigration(queryInterface, transaction, column, mappingSql) {
  return queryInterface.sequelize.query(
    `UPDATE ${TABLE} SET ${column} = ${mappingSql}`,
    { transaction },
  );
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);

      const tableDefinition = await queryInterface.describeTable(TABLE);
      if (tableDefinition.metrics) {
        await queryInterface.renameColumn(TABLE, 'metrics', 'metrics_snapshot', { transaction });
      }

      await queryInterface.addColumn(
        TABLE,
        'status_new',
        { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'briefing' },
        { transaction },
      );

      await buildStatusMigration(
        queryInterface,
        transaction,
        'status_new',
        `CASE
            WHEN status IN ('planning') THEN 'briefing'
            WHEN status IN ('in_progress') THEN 'active'
            WHEN status IN ('at_risk', 'on_hold') THEN 'blocked'
            WHEN status = 'completed' THEN 'completed'
            ELSE 'active'
          END`,
      );

      await safeRemoveIndex(queryInterface, TABLE, STATUS_INDEX, { transaction });
      await queryInterface.removeColumn(TABLE, 'status', { transaction });
      await dropEnum(queryInterface, OLD_STATUS_ENUM, transaction);

      await queryInterface.addColumn(
        TABLE,
        'status',
        { type: Sequelize.ENUM(...NEW_STATUS_VALUES), allowNull: false, defaultValue: 'briefing' },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE ${TABLE} SET status = status_new`,
        { transaction },
      );

      await queryInterface.removeColumn(TABLE, 'status_new', { transaction });
      await queryInterface.addIndex(TABLE, ['status'], { name: STATUS_INDEX, transaction });

      await queryInterface.addColumn(
        TABLE,
        'health_score',
        { type: Sequelize.DECIMAL(5, 2), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        TABLE,
        'velocity_score',
        { type: Sequelize.DECIMAL(5, 2), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        TABLE,
        'client_satisfaction',
        { type: Sequelize.DECIMAL(3, 2), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        TABLE,
        'automation_coverage',
        { type: Sequelize.DECIMAL(5, 2), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        TABLE,
        'billing_status',
        { type: Sequelize.STRING(80), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        TABLE,
        'last_activity_at',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        TABLE,
        'updated_by_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction },
      );
      if (!tableDefinition.metrics_snapshot) {
        await queryInterface.changeColumn(
          TABLE,
          'metrics_snapshot',
          { type: jsonType, allowNull: true },
          { transaction },
        );
      }

      await queryInterface.sequelize.query(
        `UPDATE ${TABLE}
           SET last_activity_at = COALESCE(last_activity_at, updated_at)
         WHERE last_activity_at IS NULL`,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tableDefinition = await queryInterface.describeTable(TABLE);

      await queryInterface.addColumn(
        TABLE,
        'status_new',
        { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'planning' },
        { transaction },
      );

      await buildStatusMigration(
        queryInterface,
        transaction,
        'status_new',
        `CASE
            WHEN status = 'briefing' THEN 'planning'
            WHEN status = 'active' THEN 'in_progress'
            WHEN status = 'blocked' THEN 'on_hold'
            WHEN status = 'completed' THEN 'completed'
            ELSE 'planning'
          END`,
      );

      await safeRemoveIndex(queryInterface, TABLE, STATUS_INDEX, { transaction });
      await queryInterface.removeColumn(TABLE, 'status', { transaction });
      await dropEnum(queryInterface, OLD_STATUS_ENUM, transaction);

      await queryInterface.addColumn(
        TABLE,
        'status',
        { type: Sequelize.ENUM(...OLD_STATUS_VALUES), allowNull: false, defaultValue: 'planning' },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE ${TABLE} SET status = status_new`,
        { transaction },
      );

      await queryInterface.removeColumn(TABLE, 'status_new', { transaction });
      await queryInterface.addIndex(TABLE, ['status'], { name: STATUS_INDEX, transaction });

      if (tableDefinition.metrics_snapshot) {
        await queryInterface.renameColumn(TABLE, 'metrics_snapshot', 'metrics', { transaction });
      }

      await queryInterface.removeColumn(TABLE, 'updated_by_id', { transaction });
      await queryInterface.removeColumn(TABLE, 'last_activity_at', { transaction });
      await queryInterface.removeColumn(TABLE, 'billing_status', { transaction });
      await queryInterface.removeColumn(TABLE, 'automation_coverage', { transaction });
      await queryInterface.removeColumn(TABLE, 'client_satisfaction', { transaction });
      await queryInterface.removeColumn(TABLE, 'velocity_score', { transaction });
      await queryInterface.removeColumn(TABLE, 'health_score', { transaction });
    });
  },
};
