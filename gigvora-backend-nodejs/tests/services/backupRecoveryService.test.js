import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import {
  scheduleBackupSnapshot,
  markBackupSnapshotRunning,
  completeBackupSnapshot,
  failBackupSnapshot,
  verifyBackupSnapshot,
  listBackupSnapshots,
  getBackupRecoveryOverview,
  scheduleRecoveryDrill,
  startRecoveryDrill,
  completeRecoveryDrill,
  failRecoveryDrill,
  listRecoveryDrills,
} from '../../src/services/backupRecoveryService.js';
import {
  BackupSnapshot,
  DisasterRecoveryDrill,
  summarizeBackupHealth,
  summarizeDrillReadiness,
} from '../../src/models/backupRecoveryModels.js';

const adminContext = {
  actor: {
    id: 42,
    email: 'ops@gigvora.test',
    name: 'Operations Lead',
    role: 'platform_ops',
  },
  source: 'jest-tests',
};

describe('backupRecoveryService', () => {
  beforeAll(async () => {
    await BackupSnapshot.sync({ force: true });
    await DisasterRecoveryDrill.sync({ force: true });
  });

  beforeEach(async () => {
    await BackupSnapshot.destroy({ where: {}, truncate: true, cascade: true, force: true });
    await DisasterRecoveryDrill.destroy({ where: {}, truncate: true, cascade: true, force: true });
  });

  it('schedules, executes, and verifies backup snapshots', async () => {
    const scheduled = await scheduleBackupSnapshot(
      {
        snapshotKey: 'prod-full-2024-10-01',
        source: 'primary-db',
        environment: 'production',
        backupType: 'full',
        retentionDays: 45,
        datasetScope: { tables: ['users', 'projects'] },
      },
      adminContext,
    );

    expect(scheduled.status).toBe('pending');
    expect(scheduled.retentionDays).toBe(45);
    expect(scheduled.datasetScope.tables).toContain('users');

    const running = await markBackupSnapshotRunning('prod-full-2024-10-01', adminContext);
    expect(running.status).toBe('running');
    expect(running.startedAt).toBeTruthy();

    const completed = await completeBackupSnapshot(
      'prod-full-2024-10-01',
      {
        sizeBytes: 1_572_864,
        checksum: 'abc123',
        checksumAlgorithm: 'sha256',
        storageUri: 's3://gigvora-backups/prod/full/2024-10-01',
        storageClass: 'STANDARD_IA',
        verificationStatus: 'verified',
      },
      adminContext,
    );

    expect(completed.status).toBe('success');
    expect(completed.verification.status).toBe('verified');
    expect(completed.sizeBytes).toBe(1_572_864);
    expect(completed.expiresAt).toBeTruthy();
    expect(completed.failureReason).toBeNull();

    const listed = await listBackupSnapshots({ environment: 'production' });
    expect(listed).toHaveLength(1);
    expect(listed[0].key).toBe('prod-full-2024-10-01');

    const overview = await getBackupRecoveryOverview();
    expect(overview.backups.summary.total).toBe(1);
    expect(overview.backups.summary.byStatus.success).toBe(1);
    expect(overview.backups.summary.verified).toBe(1);
  });

  it('records failed backups and verification updates', async () => {
    const scheduled = await scheduleBackupSnapshot(
      {
        snapshotKey: 'prod-incremental-2024-10-02',
        source: 'primary-db',
        environment: 'production',
        backupType: 'incremental',
      },
      adminContext,
    );

    expect(scheduled.status).toBe('pending');

    const failed = await failBackupSnapshot(
      'prod-incremental-2024-10-02',
      { failureReason: 'Network disruption detected.' },
      adminContext,
    );

    expect(failed.status).toBe('failed');
    expect(failed.failureReason).toMatch(/Network disruption/);
    expect(failed.verification.status).toBe('failed');
    expect(failed.expiresAt).toBeNull();

    const completed = await completeBackupSnapshot(
      'prod-incremental-2024-10-02',
      { verificationStatus: 'failed' },
      adminContext,
    );

    expect(completed.status).toBe('failed');
    expect(completed.verification.status).toBe('failed');
    expect(completed.failureReason).toMatch(/Network disruption/);

    const verified = await verifyBackupSnapshot(
      'prod-incremental-2024-10-02',
      { status: 'verified' },
      adminContext,
    );

    expect(verified.verification.status).toBe('verified');
    expect(verified.status).toBe('success');
    expect(verified.failureReason).toBeNull();
    expect(verified.expiresAt).toBeTruthy();

    const degraded = await verifyBackupSnapshot(
      'prod-incremental-2024-10-02',
      { verificationStatus: 'failed', failureReason: 'Checksum mismatch', retentionDays: 10 },
      adminContext,
    );

    expect(degraded.verification.status).toBe('failed');
    expect(degraded.status).toBe('failed');
    expect(degraded.failureReason).toContain('Checksum mismatch');
    expect(degraded.expiresAt).toBeNull();

    const snapshotHealth = await listBackupSnapshots({ environment: 'production' });
    const health = summarizeBackupHealth(
      snapshotHealth.map((entry) => ({
        status: entry.status,
        verificationStatus: entry.verification.status,
        completedAt: entry.completedAt ? new Date(entry.completedAt) : null,
        startedAt: entry.startedAt ? new Date(entry.startedAt) : null,
      })),
    );

    expect(health.total).toBe(1);
    expect(health.unhealthy).toBeGreaterThanOrEqual(1);
  });

  it('tracks recovery drills from scheduling to completion', async () => {
    const restoreStart = new Date('2024-01-02T10:00:00Z');
    const restoreFinish = new Date('2024-01-02T10:20:00Z');
    const scheduled = await scheduleRecoveryDrill(
      {
        drillKey: 'prod-ransomware-q4',
        name: 'Q4 Ransomware Response',
        scenario: 'ransomware_response',
        environment: 'production',
        rtoMinutes: 45,
        rpoMinutes: 15,
      },
      adminContext,
    );

    expect(scheduled.status).toBe('scheduled');
    expect(scheduled.objectives.rtoMinutes).toBe(45);

    const running = await startRecoveryDrill(
      'prod-ransomware-q4',
      { restoreStartedAt: restoreStart.toISOString() },
      adminContext,
    );
    expect(running.status).toBe('running');

    const completed = await completeRecoveryDrill(
      'prod-ransomware-q4',
      {
        restoreCompletedAt: restoreFinish.toISOString(),
        dataLossSeconds: 120,
        issuesFound: [],
        summary: 'Met RTO/RPO targets with minor tooling cleanup.',
      },
      adminContext,
    );

    expect(completed.status).toBe('passed');
    expect(completed.restore.durationMs).toBe(1_200_000);
    expect(completed.summary).toMatch(/Met RTO/);
    expect(completed.objectives.rtoMinutes).toBe(20);

    await scheduleRecoveryDrill(
      {
        drillKey: 'prod-data-center-loss',
        name: 'Data center evacuation',
        scenario: 'data_center_loss',
        environment: 'production',
      },
      adminContext,
    );

    const failed = await failRecoveryDrill(
      'prod-data-center-loss',
      {
        restoreCompletedAt: new Date('2024-02-16T09:15:00Z').toISOString(),
        restoreStartedAt: new Date('2024-02-16T08:00:00Z').toISOString(),
        rpoMinutes: 12,
        issuesFound: ['Failover networking misconfiguration'],
        summary: 'Regional failover exceeded RTO.',
      },
      adminContext,
    );

    expect(failed.status).toBe('failed');
    expect(failed.issuesFound).toContain('Failover networking misconfiguration');
    expect(failed.restore.durationMs).toBe(4_500_000);
    expect(failed.restore.dataLossSeconds).toBe(720);
    expect(failed.objectives.rtoMinutes).toBe(75);

    const drills = await listRecoveryDrills({ environment: 'production' });
    expect(drills.length).toBeGreaterThanOrEqual(2);

    const readiness = summarizeDrillReadiness(
      drills.map((drill) => ({
        status: drill.status,
        verifiedAt: drill.verifiedAt ? new Date(drill.verifiedAt) : null,
        issuesFound: drill.issuesFound,
      })),
    );

    expect(readiness.total).toBeGreaterThanOrEqual(2);
    expect(readiness.byStatus.failed).toBeGreaterThanOrEqual(1);

    const overview = await getBackupRecoveryOverview();
    expect(overview.drills.summary.total).toBeGreaterThanOrEqual(2);
    expect(overview.drills.recent[0].key).toBeTruthy();
  });
});
