'use strict';

const { resolveJsonType } = require('../utils/migrationHelpers.cjs');

const SNAPSHOTS_TABLE = 'backup_snapshots';
const DRILLS_TABLE = 'disaster_recovery_drills';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const jsonType = resolveJsonType(queryInterface, Sequelize);

      await queryInterface.createTable(
        SNAPSHOTS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          snapshotKey: { type: Sequelize.STRING(160), allowNull: false, unique: true },
          backupType: { type: Sequelize.STRING(32), allowNull: false },
          source: { type: Sequelize.STRING(80), allowNull: false },
          environment: { type: Sequelize.STRING(40), allowNull: false },
          region: { type: Sequelize.STRING(60), allowNull: true },
          status: { type: Sequelize.STRING(24), allowNull: false },
          storageLocationKey: { type: Sequelize.STRING(160), allowNull: true },
          storageClass: { type: Sequelize.STRING(64), allowNull: true },
          storageUri: { type: Sequelize.STRING(2048), allowNull: true },
          checksum: { type: Sequelize.STRING(128), allowNull: true },
          checksumAlgorithm: { type: Sequelize.STRING(32), allowNull: true },
          sizeBytes: { type: Sequelize.BIGINT, allowNull: true },
          retentionDays: { type: Sequelize.INTEGER, allowNull: true },
          initiatedBy: { type: Sequelize.STRING(160), allowNull: true },
          initiatedFrom: { type: Sequelize.STRING(160), allowNull: true },
          verificationStatus: { type: Sequelize.STRING(24), allowNull: true },
          verifiedAt: { type: Sequelize.DATE, allowNull: true },
          startedAt: { type: Sequelize.DATE, allowNull: true },
          completedAt: { type: Sequelize.DATE, allowNull: true },
          expiresAt: { type: Sequelize.DATE, allowNull: true },
          failureReason: { type: Sequelize.TEXT, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          datasetScope: { type: jsonType, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await Promise.all([
        queryInterface.addIndex(
          SNAPSHOTS_TABLE,
          ['snapshotKey'],
          { name: 'backup_snapshots_key_idx', unique: true, transaction },
        ),
        queryInterface.addIndex(
          SNAPSHOTS_TABLE,
          ['status'],
          { name: 'backup_snapshots_status_idx', transaction },
        ),
        queryInterface.addIndex(
          SNAPSHOTS_TABLE,
          ['environment'],
          { name: 'backup_snapshots_environment_idx', transaction },
        ),
        queryInterface.addIndex(
          SNAPSHOTS_TABLE,
          ['startedAt'],
          { name: 'backup_snapshots_started_at_idx', transaction },
        ),
      ]);

      await queryInterface.createTable(
        DRILLS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          drillKey: { type: Sequelize.STRING(160), allowNull: false, unique: true },
          name: { type: Sequelize.STRING(255), allowNull: false },
          scenario: { type: Sequelize.STRING(80), allowNull: false },
          status: { type: Sequelize.STRING(24), allowNull: false },
          environment: { type: Sequelize.STRING(40), allowNull: false },
          region: { type: Sequelize.STRING(60), allowNull: true },
          rtoMinutes: { type: Sequelize.INTEGER, allowNull: true },
          rpoMinutes: { type: Sequelize.INTEGER, allowNull: true },
          restoreDurationMs: { type: Sequelize.DECIMAL(14, 3), allowNull: true },
          dataLossSeconds: { type: Sequelize.INTEGER, allowNull: true },
          initiatedBy: { type: Sequelize.STRING(160), allowNull: true },
          initiatedFrom: { type: Sequelize.STRING(160), allowNull: true },
          startedAt: { type: Sequelize.DATE, allowNull: true },
          restoreStartedAt: { type: Sequelize.DATE, allowNull: true },
          restoreCompletedAt: { type: Sequelize.DATE, allowNull: true },
          completedAt: { type: Sequelize.DATE, allowNull: true },
          verifiedAt: { type: Sequelize.DATE, allowNull: true },
          summary: { type: Sequelize.TEXT, allowNull: true },
          issuesFound: { type: jsonType, allowNull: true },
          evidenceUri: { type: Sequelize.STRING(1024), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await Promise.all([
        queryInterface.addIndex(
          DRILLS_TABLE,
          ['drillKey'],
          { name: 'disaster_recovery_drills_key_idx', unique: true, transaction },
        ),
        queryInterface.addIndex(
          DRILLS_TABLE,
          ['status'],
          { name: 'disaster_recovery_drills_status_idx', transaction },
        ),
        queryInterface.addIndex(
          DRILLS_TABLE,
          ['environment'],
          { name: 'disaster_recovery_drills_environment_idx', transaction },
        ),
        queryInterface.addIndex(
          DRILLS_TABLE,
          ['startedAt'],
          { name: 'disaster_recovery_drills_started_at_idx', transaction },
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
      await queryInterface.dropTable(DRILLS_TABLE, { transaction });
      await queryInterface.dropTable(SNAPSHOTS_TABLE, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
