'use strict';

const { QueryTypes } = require('sequelize');

const SEED_ORIGIN = 'seed:storage-management-foundation';

function buildLocationPayload(overrides = {}) {
  const now = new Date();
  return {
    bucket: 'gigvora-assets-primary',
    region: 'auto',
    endpoint: 'https://cfd.r2.cloudflarestorage.com',
    publicBaseUrl: 'https://cdn.gigvora.test',
    defaultPathPrefix: 'uploads/',
    status: 'active',
    isPrimary: false,
    versioningEnabled: true,
    replicationEnabled: false,
    metadata: JSON.stringify({ origin: SEED_ORIGIN, classification: 'primary' }),
    currentUsageMb: 0,
    objectCount: 0,
    ingestBytes24h: 0,
    egressBytes24h: 0,
    errorCount24h: 0,
    lastInventoryAt: new Date('2025-03-01T08:00:00Z'),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const locations = [
        {
          locationKey: 'primary-assets',
          name: 'Primary Assets R2',
          provider: 'cloudflare_r2',
          isPrimary: true,
          replicationEnabled: true,
          metadata: JSON.stringify({ origin: SEED_ORIGIN, classification: 'primary', crossRegion: ['iad', 'fra'] }),
          currentUsageMb: 1280.5,
          objectCount: 48210,
          ingestBytes24h: 734003200,
          egressBytes24h: 524288000,
          errorCount24h: 2,
          lastInventoryAt: new Date('2025-03-01T08:00:00Z'),
        },
        {
          locationKey: 'compliance-vault',
          name: 'Compliance Vault S3',
          provider: 'aws_s3',
          bucket: 'gigvora-compliance-vault',
          defaultPathPrefix: 'compliance/',
          metadata: JSON.stringify({ origin: SEED_ORIGIN, classification: 'compliance', kmsKeyAlias: 'alias/gigvora/compliance' }),
          region: 'eu-central-1',
          endpoint: 'https://s3.eu-central-1.amazonaws.com',
          publicBaseUrl: null,
          versioningEnabled: true,
          replicationEnabled: false,
          currentUsageMb: 642.75,
          objectCount: 18210,
          ingestBytes24h: 126877696,
          egressBytes24h: 95630131,
          errorCount24h: 0,
        },
      ];

      const insertedLocations = [];

      for (const location of locations) {
        const basePayload = buildLocationPayload(location);
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM storage_locations WHERE locationKey = :key LIMIT 1',
          { transaction, type: QueryTypes.SELECT, replacements: { key: location.locationKey } },
        );

        if (existing) {
          await queryInterface.bulkUpdate(
            'storage_locations',
            basePayload,
            { id: existing.id },
            { transaction },
          );
          insertedLocations.push({ id: existing.id, key: location.locationKey });
        } else {
          await queryInterface.bulkInsert('storage_locations', [basePayload], { transaction });
          const [created] = await queryInterface.sequelize.query(
            'SELECT id FROM storage_locations WHERE locationKey = :key LIMIT 1',
            { transaction, type: QueryTypes.SELECT, replacements: { key: location.locationKey } },
          );
          if (created) {
            insertedLocations.push({ id: created.id, key: location.locationKey });
          }
        }
      }

      const primaryLocation = insertedLocations.find((entry) => entry.key === 'primary-assets');
      const complianceLocation = insertedLocations.find((entry) => entry.key === 'compliance-vault');

      if (primaryLocation) {
        await queryInterface.bulkDelete(
          'storage_lifecycle_rules',
          { name: 'Primary Hot Tier Lifecycle' },
          { transaction },
        );
        await queryInterface.bulkInsert(
          'storage_lifecycle_rules',
          [
            {
              locationId: primaryLocation.id,
              name: 'Primary Hot Tier Lifecycle',
              description: 'Keep uploads in hot tier for 45 days before moving to intelligent tiering.',
              status: 'active',
              filterPrefix: 'uploads/',
              transitionAfterDays: 45,
              transitionStorageClass: 'intelligent_tiering',
              expireAfterDays: null,
              deleteExpiredObjects: false,
              compressObjects: true,
              metadata: JSON.stringify({ origin: SEED_ORIGIN, retention: '45d-hot' }),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          { transaction },
        );

        await queryInterface.bulkDelete(
          'storage_upload_presets',
          { name: 'Executive Profile Uploads' },
          { transaction },
        );
        await queryInterface.bulkInsert(
          'storage_upload_presets',
          [
            {
              locationId: primaryLocation.id,
              name: 'Executive Profile Uploads',
              description: 'Secure upload preset for avatars, cover images, and brand assets.',
              pathPrefix: 'uploads/avatars/',
              allowedMimeTypes: JSON.stringify(['image/png', 'image/jpeg', 'image/webp']),
              maxSizeMb: 25,
              allowedRoles: JSON.stringify(['mentor', 'founder', 'recruiter']),
              requireModeration: true,
              encryption: 'managed',
              expiresAfterMinutes: 30,
              active: true,
              metadata: JSON.stringify({ origin: SEED_ORIGIN, productSurface: 'profiles' }),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          { transaction },
        );
      }

      if (complianceLocation) {
        await queryInterface.bulkDelete(
          'storage_lifecycle_rules',
          { name: 'Compliance Archive Policy' },
          { transaction },
        );
        await queryInterface.bulkInsert(
          'storage_lifecycle_rules',
          [
            {
              locationId: complianceLocation.id,
              name: 'Compliance Archive Policy',
              description: 'Archive compliance documents to Glacier after 180 days and purge after 7 years.',
              status: 'active',
              filterPrefix: 'compliance/',
              transitionAfterDays: 180,
              transitionStorageClass: 'glacier',
              expireAfterDays: 2555,
              deleteExpiredObjects: true,
              compressObjects: true,
              metadata: JSON.stringify({ origin: SEED_ORIGIN, retention: '7y' }),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          { transaction },
        );

        await queryInterface.bulkDelete(
          'storage_upload_presets',
          { name: 'Legal Agreements Intake' },
          { transaction },
        );
        await queryInterface.bulkInsert(
          'storage_upload_presets',
          [
            {
              locationId: complianceLocation.id,
              name: 'Legal Agreements Intake',
              description: 'Restricted preset for NDAs, MSAs, and compliance attestations.',
              pathPrefix: 'compliance/intake/',
              allowedMimeTypes: JSON.stringify(['application/pdf']),
              maxSizeMb: 50,
              allowedRoles: JSON.stringify(['admin', 'legal', 'compliance']),
              requireModeration: false,
              encryption: 'sse-kms',
              expiresAfterMinutes: 15,
              active: true,
              metadata: JSON.stringify({ origin: SEED_ORIGIN, productSurface: 'compliance' }),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          { transaction },
        );
      }

      await queryInterface.bulkInsert(
        'storage_audit_events',
        [
          {
            actorId: 1,
            actorEmail: 'admin@gigvora.com',
            actorName: 'Gigvora Platform',
            eventType: 'location.seeded',
            targetType: 'storage_locations',
            targetId: primaryLocation ? primaryLocation.id : null,
            summary: 'Seeded enterprise storage baseline',
            metadata: JSON.stringify({ origin: SEED_ORIGIN, action: 'seed' }),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            actorId: 1,
            actorEmail: 'admin@gigvora.com',
            actorName: 'Gigvora Platform',
            eventType: 'location.seeded',
            targetType: 'storage_locations',
            targetId: complianceLocation ? complianceLocation.id : null,
            summary: 'Seeded compliance archive location',
            metadata: JSON.stringify({ origin: SEED_ORIGIN, action: 'seed' }),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { transaction },
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
      await queryInterface.bulkDelete(
        'storage_audit_events',
        { summary: ['Seeded enterprise storage baseline', 'Seeded compliance archive location'] },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'storage_upload_presets',
        { name: ['Executive Profile Uploads', 'Legal Agreements Intake'] },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'storage_lifecycle_rules',
        { name: ['Primary Hot Tier Lifecycle', 'Compliance Archive Policy'] },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'storage_locations',
        { locationKey: ['primary-assets', 'compliance-vault'] },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
