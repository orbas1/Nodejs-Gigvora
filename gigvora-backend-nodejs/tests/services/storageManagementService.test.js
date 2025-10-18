import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import {
  getStorageOverview,
  createStorageLocation,
  updateStorageLocation,
  deleteStorageLocation,
  createLifecycleRule,
  createUploadPreset,
} from '../../src/services/storageManagementService.js';
import {
  StorageLocation,
  StorageLifecycleRule,
  StorageUploadPreset,
  StorageAuditEvent,
} from '../../src/models/storageManagementModels.js';
import { ValidationError } from '../../src/utils/errors.js';

const adminContext = {
  actor: {
    id: 1,
    email: 'admin@gigvora.test',
    name: 'Admin Tester',
  },
};

describe('storageManagementService', () => {
  beforeAll(async () => {
    await StorageLocation.sync({ force: true });
    await StorageLifecycleRule.sync({ force: true });
    await StorageUploadPreset.sync({ force: true });
    await StorageAuditEvent.sync({ force: true });
  });

  beforeEach(async () => {
    await StorageUploadPreset.destroy({ where: {}, truncate: true, cascade: true, force: true });
    await StorageLifecycleRule.destroy({ where: {}, truncate: true, cascade: true, force: true });
    await StorageAuditEvent.destroy({ where: {}, truncate: true, cascade: true, force: true });
    await StorageLocation.destroy({ where: {}, truncate: true, cascade: true, force: true });
  });

  it('creates storage locations and produces an overview snapshot', async () => {
    const primary = await createStorageLocation(
      {
        locationKey: 'primary-r2',
        name: 'Primary R2',
        provider: 'cloudflare_r2',
        bucket: 'gigvora-primary',
        region: 'auto',
        isPrimary: true,
        accessKeyId: 'AKIA123456',
        secretAccessKey: 'supersecret',
      },
      adminContext,
    );

    expect(primary.isPrimary).toBe(true);
    expect(primary.credentials.accessKeyId).toBe('AKIA123456');
    expect(primary.credentials.hasSecretAccessKey).toBe(true);

    const secondary = await createStorageLocation(
      {
        locationKey: 'archive',
        name: 'Archive S3',
        provider: 'aws_s3',
        bucket: 'gigvora-archive',
        region: 'eu-west-1',
      },
      adminContext,
    );

    expect(secondary.isPrimary).toBe(false);

    const overview = await getStorageOverview();
    expect(overview.locations).toHaveLength(2);
    expect(overview.summary.totalLocations).toBe(2);
    expect(overview.summary.activeLocations).toBe(2);
    expect(overview.auditLog.length).toBeGreaterThan(0);
  });

  it('promotes primary locations and prevents deletion without reassignment', async () => {
    const primary = await createStorageLocation(
      {
        locationKey: 'primary',
        name: 'Primary',
        provider: 'cloudflare_r2',
        bucket: 'gigvora-prod',
        isPrimary: true,
      },
      adminContext,
    );

    const secondary = await createStorageLocation(
      {
        locationKey: 'secondary',
        name: 'Secondary',
        provider: 'aws_s3',
        bucket: 'gigvora-backup',
      },
      adminContext,
    );

    const promoted = await updateStorageLocation(secondary.id, { isPrimary: true }, adminContext);
    expect(promoted.isPrimary).toBe(true);

    const refreshed = await getStorageOverview();
    const original = refreshed.locations.find((entry) => entry.id === primary.id);
    expect(original.isPrimary).toBe(false);

    await expect(deleteStorageLocation(promoted.id, adminContext)).rejects.toBeInstanceOf(ValidationError);

    await expect(deleteStorageLocation(primary.id, adminContext)).resolves.toBe(true);
  });

  it('manages lifecycle rules and upload presets for a location', async () => {
    const location = await createStorageLocation(
      {
        locationKey: 'assets',
        name: 'Asset Storage',
        provider: 'cloudflare_r2',
        bucket: 'gigvora-assets',
      },
      adminContext,
    );

    const lifecycle = await createLifecycleRule(
      {
        locationId: location.id,
        name: 'Archive inactive assets',
        transitionAfterDays: 30,
        transitionStorageClass: 'glacier',
        deleteExpiredObjects: true,
      },
      adminContext,
    );

    expect(lifecycle.locationId).toBe(location.id);
    expect(lifecycle.transitionAfterDays).toBe(30);

    const preset = await createUploadPreset(
      {
        locationId: location.id,
        name: 'Profile uploads',
        pathPrefix: 'profiles/',
        allowedMimeTypes: ['image/png', 'image/jpeg'],
        maxSizeMb: 25,
        allowedRoles: ['admin', 'user'],
        requireModeration: true,
      },
      adminContext,
    );

    expect(preset.locationId).toBe(location.id);
    expect(preset.allowedMimeTypes).toEqual(['image/png', 'image/jpeg']);
    expect(preset.allowedRoles).toContain('admin');

    const overview = await getStorageOverview();
    expect(overview.lifecycleRules).toHaveLength(1);
    expect(overview.uploadPresets).toHaveLength(1);
  });
});
