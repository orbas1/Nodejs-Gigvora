import { describe, expect, it } from 'vitest';
import { buildLifecycleRulePayload } from '../LifecycleRuleDrawer.jsx';
import { buildStorageLocationPayload } from '../StorageLocationDrawer.jsx';

describe('Storage drawer helpers', () => {
  it('normalises lifecycle rule payloads', () => {
    const payload = buildLifecycleRulePayload({
      locationId: '5',
      name: 'Archive',
      description: 'Archive completed tasks',
      status: 'active',
      filterPrefix: 'deliverables/',
      transitionAfterDays: '30',
      transitionStorageClass: 'glacier',
      expireAfterDays: '',
      deleteExpiredObjects: true,
      compressObjects: false,
    });

    expect(payload.locationId).toBe(5);
    expect(payload.transitionAfterDays).toBe(30);
    expect(payload.expireAfterDays).toBeUndefined();
    expect(payload.transitionStorageClass).toBe('glacier');
    expect(payload.deleteExpiredObjects).toBe(true);
    expect(payload.compressObjects).toBe(false);
  });

  it('normalises storage location payloads', () => {
    const payload = buildStorageLocationPayload({
      locationKey: 'primary',
      name: 'Primary site',
      provider: 'cloudflare_r2',
      bucket: 'gigvora-primary',
      region: 'eu-west-1',
      endpoint: 'https://r2.example.com',
      publicBaseUrl: 'https://cdn.example.com',
      defaultPathPrefix: 'media/',
      status: 'active',
      isPrimary: true,
      versioningEnabled: true,
      replicationEnabled: false,
      kmsKeyArn: '',
      accessKeyId: 'AKIA',
      roleArn: '',
      externalId: '',
      currentUsageMb: '512',
      objectCount: '120',
      ingestBytes24h: '1024',
      egressBytes24h: '',
      errorCount24h: '0',
      lastInventoryAt: '2024-03-22T09:00',
      secretAction: 'clear',
      secretAccessKey: '',
    });

    expect(payload.locationKey).toBe('primary');
    expect(payload.currentUsageMb).toBe(512);
    expect(payload.objectCount).toBe(120);
    expect(payload.egressBytes24h).toBeUndefined();
    expect(payload.lastInventoryAt).toBe('2024-03-22T09:00:00.000Z');
    expect(payload.secretAccessKey).toBeNull();
  });
});
