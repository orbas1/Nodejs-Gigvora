'use strict';

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { QueryTypes } = require('sequelize');

const SEED_ORIGIN = 'seed:api-management-foundation';

function now() {
  return new Date();
}

async function upsertProvider(queryInterface, transaction, provider) {
  const [existing] = await queryInterface.sequelize.query(
    'SELECT id FROM api_providers WHERE slug = :slug LIMIT 1',
    { transaction, type: QueryTypes.SELECT, replacements: { slug: provider.slug } },
  );

  const payload = {
    ...provider,
    metadata: JSON.stringify({ ...provider.metadata, origin: SEED_ORIGIN }),
    createdAt: now(),
    updatedAt: now(),
  };

  if (existing) {
    await queryInterface.bulkUpdate('api_providers', payload, { id: existing.id }, { transaction });
    return existing.id;
  }

  await queryInterface.bulkInsert('api_providers', [payload], { transaction });
  const [created] = await queryInterface.sequelize.query(
    'SELECT id FROM api_providers WHERE slug = :slug LIMIT 1',
    { transaction, type: QueryTypes.SELECT, replacements: { slug: provider.slug } },
  );
  return created ? created.id : null;
}

async function upsertClient(queryInterface, transaction, client) {
  const [existing] = await queryInterface.sequelize.query(
    'SELECT id FROM api_clients WHERE slug = :slug LIMIT 1',
    { transaction, type: QueryTypes.SELECT, replacements: { slug: client.slug } },
  );

  const payload = {
    ...client,
    ipAllowList: JSON.stringify(client.ipAllowList ?? []),
    scopes: JSON.stringify(client.scopes ?? []),
    metadata: JSON.stringify({ ...client.metadata, origin: SEED_ORIGIN }),
    createdAt: now(),
    updatedAt: now(),
  };

  if (existing) {
    await queryInterface.bulkUpdate('api_clients', payload, { id: existing.id }, { transaction });
    return existing.id;
  }

  await queryInterface.bulkInsert('api_clients', [payload], { transaction });
  const [created] = await queryInterface.sequelize.query(
    'SELECT id FROM api_clients WHERE slug = :slug LIMIT 1',
    { transaction, type: QueryTypes.SELECT, replacements: { slug: client.slug } },
  );
  return created ? created.id : null;
}

async function seedClientKey(queryInterface, transaction, clientId, keyConfig) {
  const [existing] = await queryInterface.sequelize.query(
    'SELECT id FROM api_client_keys WHERE clientId = :clientId AND label = :label LIMIT 1',
    {
      transaction,
      type: QueryTypes.SELECT,
      replacements: { clientId, label: keyConfig.label },
    },
  );

  const hashedSecret = await bcrypt.hash(keyConfig.secret, 10);

  const payload = {
    clientId,
    label: keyConfig.label,
    secretHash: hashedSecret,
    secretLastFour: keyConfig.secret.slice(-4),
    createdBy: keyConfig.createdBy,
    expiresAt: keyConfig.expiresAt,
    lastRotatedAt: keyConfig.lastRotatedAt,
    revokedAt: null,
    metadata: JSON.stringify({ origin: SEED_ORIGIN, permissions: keyConfig.permissions }),
    createdAt: now(),
    updatedAt: now(),
  };

  if (existing) {
    await queryInterface.bulkUpdate('api_client_keys', payload, { id: existing.id }, { transaction });
    return existing.id;
  }

  await queryInterface.bulkInsert('api_client_keys', [payload], { transaction });
  const [created] = await queryInterface.sequelize.query(
    'SELECT id FROM api_client_keys WHERE clientId = :clientId AND label = :label LIMIT 1',
    {
      transaction,
      type: QueryTypes.SELECT,
      replacements: { clientId, label: keyConfig.label },
    },
  );
  return created ? created.id : null;
}

async function seedAuditEvents(queryInterface, transaction, clientId, events) {
  if (!clientId) return;

  await queryInterface.bulkInsert(
    'api_client_audit_events',
    events.map((event) => ({
      ...event,
      clientId,
      metadata: JSON.stringify({ ...event.metadata, origin: SEED_ORIGIN }),
      createdAt: now(),
      updatedAt: now(),
    })),
    { transaction },
  );
}

async function seedUsageMetrics(queryInterface, transaction, clientId, metrics) {
  if (!clientId || !metrics.length) return;

  await queryInterface.bulkInsert(
    'api_client_usage_metrics',
    metrics.map((metric) => ({
      ...metric,
      clientId,
      createdAt: now(),
      updatedAt: now(),
    })),
    { transaction },
  );
}

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const providers = [
        {
          name: 'Linked Sync',
          slug: 'linked-sync',
          status: 'active',
          baseUrl: 'https://api.linkedsync.com/v1',
          sandboxBaseUrl: 'https://sandbox.linkedsync.com/v1',
          docsUrl: 'https://docs.linkedsync.com',
          iconUrl: 'https://cdn.gigvora.test/integrations/linked-sync.svg',
          description: 'Enriched CRM timeline stream tailored for executive mentorship programs.',
          contactEmail: 'partners@linkedsync.com',
          callPriceCents: 35,
          metadata: { category: 'crm', slaHours: 2 },
        },
        {
          name: 'Chronicle ATS',
          slug: 'chronicle-ats',
          status: 'active',
          baseUrl: 'https://api.chronicleats.com/v2',
          sandboxBaseUrl: 'https://sandbox.chronicleats.com/v2',
          docsUrl: 'https://developer.chronicleats.com',
          iconUrl: 'https://cdn.gigvora.test/integrations/chronicle.svg',
          description: 'Enterprise-grade applicant tracking with webhook-first automation.',
          contactEmail: 'alliances@chronicleats.com',
          callPriceCents: 55,
          metadata: { category: 'ats', slaHours: 1 },
        },
      ];

      const providerIds = {};
      for (const provider of providers) {
        const id = await upsertProvider(queryInterface, transaction, provider);
        if (id) {
          providerIds[provider.slug] = id;
        }
      }

      const clients = [
        {
          providerSlug: 'linked-sync',
          name: 'Mentorship Insights Sync',
          slug: 'mentorship-insights-sync',
          description: 'Streams CRM engagements into mentor dashboards with deduplicated narratives.',
          contactEmail: 'platform-ops@gigvora.com',
          status: 'active',
          accessLevel: 'write',
          rateLimitPerMinute: 1200,
          ipAllowList: ['52.12.10.21/32', '52.12.10.22/32'],
          scopes: ['crm.timeline.read', 'crm.timeline.write'],
          webhookUrl: 'https://integrations.gigvora.com/hooks/linked-sync',
          metadata: { surface: 'mentorship', escalation: 'runtime-ops' },
          createdBy: 'api-seed',
          walletAccountId: null,
          callPriceCents: 45,
        },
        {
          providerSlug: 'chronicle-ats',
          name: 'Talent Pipeline Importer',
          slug: 'talent-pipeline-importer',
          description: 'Ingests shortlisted executive candidates into hiring pods with compliance logs.',
          contactEmail: 'talent-ops@gigvora.com',
          status: 'active',
          accessLevel: 'admin',
          rateLimitPerMinute: 600,
          ipAllowList: ['34.120.10.0/28'],
          scopes: ['ats.candidates.read', 'ats.jobs.sync'],
          webhookUrl: 'https://integrations.gigvora.com/hooks/chronicle-ats',
          metadata: { surface: 'recruiting', escalation: 'talent-ops' },
          createdBy: 'api-seed',
          walletAccountId: null,
          callPriceCents: 65,
        },
      ];

      const clientIds = {};
      for (const client of clients) {
        const providerId = providerIds[client.providerSlug];
        if (!providerId) {
          continue;
        }
        const id = await upsertClient(queryInterface, transaction, {
          ...client,
          providerId,
        });
        if (id) {
          clientIds[client.slug] = id;
        }
      }

      if (clientIds['mentorship-insights-sync']) {
        await seedClientKey(queryInterface, transaction, clientIds['mentorship-insights-sync'], {
          label: 'Mentorship Sync Production Key',
          secret: `gv_live_${crypto.randomBytes(16).toString('hex')}`,
          createdBy: 'api-seed',
          permissions: ['sync.timeline'],
          expiresAt: null,
          lastRotatedAt: new Date('2025-02-01T00:00:00Z'),
        });

        await seedAuditEvents(queryInterface, transaction, clientIds['mentorship-insights-sync'], [
          {
            eventType: 'key.created',
            description: 'Seeded production key for mentorship sync.',
            actor: 'api-seed',
            ipAddress: '52.12.10.21',
            metadata: { action: 'seed' },
          },
          {
            eventType: 'webhook.updated',
            description: 'Configured webhook for CRM payload ingestion.',
            actor: 'api-seed',
            ipAddress: '52.12.10.22',
            metadata: { action: 'seed' },
          },
        ]);

        await seedUsageMetrics(queryInterface, transaction, clientIds['mentorship-insights-sync'], [
          {
            metricDate: new Date('2025-03-01T00:00:00Z'),
            requestCount: 18240,
            errorCount: 24,
            avgLatencyMs: 420,
            peakLatencyMs: 880,
            lastRequestAt: new Date('2025-03-01T07:32:00Z'),
            billableRequestCount: 18110,
            billedAmountCents: 6338,
          },
        ]);
      }

      if (clientIds['talent-pipeline-importer']) {
        await seedClientKey(queryInterface, transaction, clientIds['talent-pipeline-importer'], {
          label: 'Talent Importer Production Key',
          secret: `gv_live_${crypto.randomBytes(16).toString('hex')}`,
          createdBy: 'api-seed',
          permissions: ['sync.candidates', 'sync.jobs'],
          expiresAt: null,
          lastRotatedAt: new Date('2025-02-10T00:00:00Z'),
        });

        await seedAuditEvents(queryInterface, transaction, clientIds['talent-pipeline-importer'], [
          {
            eventType: 'client.created',
            description: 'Seeded ATS integration client.',
            actor: 'api-seed',
            ipAddress: '34.120.10.2',
            metadata: { action: 'seed' },
          },
          {
            eventType: 'rate-limit.updated',
            description: 'Configured concurrency guard at 600 RPM.',
            actor: 'api-seed',
            ipAddress: '34.120.10.3',
            metadata: { action: 'seed' },
          },
        ]);

        await seedUsageMetrics(queryInterface, transaction, clientIds['talent-pipeline-importer'], [
          {
            metricDate: new Date('2025-03-01T00:00:00Z'),
            requestCount: 9640,
            errorCount: 6,
            avgLatencyMs: 310,
            peakLatencyMs: 640,
            lastRequestAt: new Date('2025-03-01T06:15:00Z'),
            billableRequestCount: 9620,
            billedAmountCents: 5295,
          },
        ]);
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
      const clientSlugs = ['mentorship-insights-sync', 'talent-pipeline-importer'];
      const providerSlugs = ['linked-sync', 'chronicle-ats'];

      await queryInterface.sequelize.query(
        'DELETE FROM api_client_usage_metrics WHERE clientId IN (SELECT id FROM api_clients WHERE slug IN (:slugs)) AND metricDate = :metricDate',
        {
          transaction,
          replacements: { slugs: clientSlugs, metricDate: new Date('2025-03-01T00:00:00Z') },
        },
      );

      await queryInterface.sequelize.query(
        'DELETE FROM api_client_audit_events WHERE clientId IN (SELECT id FROM api_clients WHERE slug IN (:slugs)) AND actor = :actor',
        {
          transaction,
          replacements: { slugs: clientSlugs, actor: 'api-seed' },
        },
      );

      await queryInterface.sequelize.query(
        'DELETE FROM api_client_keys WHERE clientId IN (SELECT id FROM api_clients WHERE slug IN (:slugs)) AND createdBy = :createdBy',
        {
          transaction,
          replacements: { slugs: clientSlugs, createdBy: 'api-seed' },
        },
      );

      await queryInterface.bulkDelete('api_clients', { slug: clientSlugs }, { transaction });
      await queryInterface.bulkDelete('api_providers', { slug: providerSlugs }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
