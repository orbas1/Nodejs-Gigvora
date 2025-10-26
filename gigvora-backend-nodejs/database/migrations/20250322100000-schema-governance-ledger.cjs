'use strict';

const { resolveJsonType } = require('../utils/migrationHelpers.cjs');

const MIGRATION_AUDITS_TABLE = 'schema_migration_audits';
const SEED_AUDITS_TABLE = 'seed_execution_audits';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const jsonType = resolveJsonType(queryInterface, Sequelize);

      await queryInterface.createTable(
        MIGRATION_AUDITS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          migrationName: { type: Sequelize.STRING(255), allowNull: false },
          checksum: { type: Sequelize.STRING(128), allowNull: true },
          direction: { type: Sequelize.STRING(12), allowNull: false },
          status: { type: Sequelize.STRING(24), allowNull: false },
          executedBy: { type: Sequelize.STRING(120), allowNull: true },
          executedFrom: { type: Sequelize.STRING(120), allowNull: true },
          environment: { type: Sequelize.STRING(40), allowNull: true },
          durationMs: { type: Sequelize.DECIMAL(12, 3), allowNull: true },
          executedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await Promise.all([
        queryInterface.addIndex(
          MIGRATION_AUDITS_TABLE,
          ['migrationName'],
          { name: 'schema_migration_audits_name_idx', transaction },
        ),
        queryInterface.addIndex(
          MIGRATION_AUDITS_TABLE,
          ['status'],
          { name: 'schema_migration_audits_status_idx', transaction },
        ),
        queryInterface.addIndex(
          MIGRATION_AUDITS_TABLE,
          ['executedAt'],
          { name: 'schema_migration_audits_executed_at_idx', transaction },
        ),
      ]);

      await queryInterface.createTable(
        SEED_AUDITS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          seederName: { type: Sequelize.STRING(255), allowNull: false },
          checksum: { type: Sequelize.STRING(128), allowNull: true },
          direction: { type: Sequelize.STRING(12), allowNull: false },
          status: { type: Sequelize.STRING(24), allowNull: false },
          executedBy: { type: Sequelize.STRING(120), allowNull: true },
          executedFrom: { type: Sequelize.STRING(120), allowNull: true },
          environment: { type: Sequelize.STRING(40), allowNull: true },
          durationMs: { type: Sequelize.DECIMAL(12, 3), allowNull: true },
          executedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          datasetTags: { type: jsonType, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await Promise.all([
        queryInterface.addIndex(
          SEED_AUDITS_TABLE,
          ['seederName'],
          { name: 'seed_execution_audits_name_idx', transaction },
        ),
        queryInterface.addIndex(
          SEED_AUDITS_TABLE,
          ['status'],
          { name: 'seed_execution_audits_status_idx', transaction },
        ),
        queryInterface.addIndex(
          SEED_AUDITS_TABLE,
          ['executedAt'],
          { name: 'seed_execution_audits_executed_at_idx', transaction },
        ),
      ]);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable(SEED_AUDITS_TABLE, { transaction });
      await queryInterface.dropTable(MIGRATION_AUDITS_TABLE, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
