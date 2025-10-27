'use strict';

const { QueryTypes } = require('sequelize');

const SEED_ORIGIN = 'seed:backup-recovery-foundation';
const SNAPSHOT_TABLE = 'backup_snapshots';
const DRILL_TABLE = 'disaster_recovery_drills';
const SNAPSHOT_KEYS = ['prod-full-weekly', 'prod-incremental-daily'];
const DRILL_KEYS = ['prod-ransomware-q3', 'prod-regional-failover'];

function now() {
  return new Date();
}

function withOrigin(metadata = {}) {
  return JSON.stringify({ ...metadata, origin: SEED_ORIGIN });
}

async function upsertSnapshot(queryInterface, transaction, snapshot) {
  const [existing] = await queryInterface.sequelize.query(
    `SELECT id FROM ${SNAPSHOT_TABLE} WHERE snapshotKey = :snapshotKey LIMIT 1`,
    { transaction, type: QueryTypes.SELECT, replacements: { snapshotKey: snapshot.snapshotKey } },
  );

  const payload = {
    ...snapshot,
    datasetScope: JSON.stringify(snapshot.datasetScope ?? {}),
    metadata: withOrigin(snapshot.metadata ?? {}),
    createdAt: now(),
    updatedAt: now(),
  };

  if (existing) {
    await queryInterface.bulkUpdate(SNAPSHOT_TABLE, payload, { id: existing.id }, { transaction });
    return existing.id;
  }

  await queryInterface.bulkInsert(SNAPSHOT_TABLE, [payload], { transaction });
  const [created] = await queryInterface.sequelize.query(
    `SELECT id FROM ${SNAPSHOT_TABLE} WHERE snapshotKey = :snapshotKey LIMIT 1`,
    { transaction, type: QueryTypes.SELECT, replacements: { snapshotKey: snapshot.snapshotKey } },
  );
  return created ? created.id : null;
}

async function upsertDrill(queryInterface, transaction, drill) {
  const [existing] = await queryInterface.sequelize.query(
    `SELECT id FROM ${DRILL_TABLE} WHERE drillKey = :drillKey LIMIT 1`,
    { transaction, type: QueryTypes.SELECT, replacements: { drillKey: drill.drillKey } },
  );

  const payload = {
    ...drill,
    issuesFound: JSON.stringify(drill.issuesFound ?? []),
    metadata: withOrigin(drill.metadata ?? {}),
    createdAt: now(),
    updatedAt: now(),
  };

  if (existing) {
    await queryInterface.bulkUpdate(DRILL_TABLE, payload, { id: existing.id }, { transaction });
    return existing.id;
  }

  await queryInterface.bulkInsert(DRILL_TABLE, [payload], { transaction });
  const [created] = await queryInterface.sequelize.query(
    `SELECT id FROM ${DRILL_TABLE} WHERE drillKey = :drillKey LIMIT 1`,
    { transaction, type: QueryTypes.SELECT, replacements: { drillKey: drill.drillKey } },
  );
  return created ? created.id : null;
}

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const snapshots = [
        {
          snapshotKey: 'prod-full-weekly',
          backupType: 'full',
          source: 'primary-db',
          environment: 'production',
          region: 'eu-west-1',
          status: 'success',
          storageLocationKey: 'primary-r2',
          storageClass: 'STANDARD_IA',
          storageUri: 's3://gigvora-backups/prod/full/weekly',
          checksum: '3ef0cb86f885a4d5',
          checksumAlgorithm: 'xxhash64',
          sizeBytes: 2_457_600_000,
          retentionDays: 45,
          initiatedBy: 'ops@gigvora.test',
          initiatedFrom: 'console',
          verificationStatus: 'verified',
          verifiedAt: now(),
          startedAt: new Date(Date.now() - 45 * 60 * 1000),
          completedAt: new Date(Date.now() - 30 * 60 * 1000),
          expiresAt: new Date(Date.now() + 44 * 24 * 60 * 60 * 1000),
          failureReason: null,
          notes: 'Weekly production full snapshot replicated to cold storage.',
          datasetScope: { tables: ['users', 'projects', 'transactions'] },
          metadata: { cadence: 'weekly', slaMinutes: 60 },
        },
        {
          snapshotKey: 'prod-incremental-daily',
          backupType: 'incremental',
          source: 'primary-db',
          environment: 'production',
          region: 'eu-west-1',
          status: 'running',
          storageLocationKey: 'primary-r2',
          storageClass: 'STANDARD',
          storageUri: null,
          checksum: null,
          checksumAlgorithm: null,
          sizeBytes: null,
          retentionDays: 14,
          initiatedBy: 'automation@gigvora.test',
          initiatedFrom: 'scheduler',
          verificationStatus: 'in_progress',
          verifiedAt: null,
          startedAt: new Date(Date.now() - 10 * 60 * 1000),
          completedAt: null,
          expiresAt: null,
          failureReason: null,
          notes: 'Incremental daily snapshot currently running.',
          datasetScope: { tables: ['transactions'], window: '24h' },
          metadata: { cadence: 'daily', retryPolicy: '3x exponential' },
        },
      ];

      const drills = [
        {
          drillKey: 'prod-ransomware-q3',
          name: 'Q3 Ransomware Simulation',
          scenario: 'ransomware_response',
          status: 'passed',
          environment: 'production',
          region: 'eu-west-1',
          rtoMinutes: 60,
          rpoMinutes: 15,
          restoreDurationMs: 2_700_000,
          dataLossSeconds: 90,
          initiatedBy: 'ops@gigvora.test',
          initiatedFrom: 'playbook-runner',
          startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          restoreStartedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000),
          restoreCompletedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 65 * 60 * 1000),
          verifiedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 70 * 60 * 1000),
          summary: 'Restored production replica within RTO and validated access logs.',
          issuesFound: ['Improve bastion automation for incident handover'],
          evidenceUri: 'https://status.gigvora.test/playbooks/ransomware-q3',
          metadata: { cadence: 'quarterly', owners: ['platform_ops'] },
        },
        {
          drillKey: 'prod-regional-failover',
          name: 'Regional failover rehearsal',
          scenario: 'regional_outage',
          status: 'failed',
          environment: 'production',
          region: 'us-east-1',
          rtoMinutes: 90,
          rpoMinutes: 30,
          restoreDurationMs: 5_400_000,
          dataLossSeconds: 420,
          initiatedBy: 'ops@gigvora.test',
          initiatedFrom: 'playbook-runner',
          startedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          restoreStartedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
          restoreCompletedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
          verifiedAt: null,
          summary: 'Failed to meet failover objective due to replication lag.',
          issuesFound: ['Tune replica promotion workflow', 'Expand network capacity in failover region'],
          evidenceUri: 'https://status.gigvora.test/playbooks/regional-failover',
          metadata: { cadence: 'semiannual', owners: ['infrastructure', 'platform_ops'] },
        },
      ];

      for (const snapshot of snapshots) {
        // eslint-disable-next-line no-await-in-loop
        await upsertSnapshot(queryInterface, transaction, snapshot);
      }

      for (const drill of drills) {
        // eslint-disable-next-line no-await-in-loop
        await upsertDrill(queryInterface, transaction, drill);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete(SNAPSHOT_TABLE, { snapshotKey: SNAPSHOT_KEYS }, { transaction });
      await queryInterface.bulkDelete(DRILL_TABLE, { drillKey: DRILL_KEYS }, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
