process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.ADMIN_MANAGEMENT_MINIMAL_BOOTSTRAP = 'true';

import '../setupTestEnv.js';

import {
  ApiProvider,
  ApiClient,
  ApiClientKey,
  ApiClientAuditEvent,
  ApiClientUsageMetric,
} from '../../src/models/apiIntegrationModels.js';

function createDate(value) {
  return new Date(value);
}

describe('api integration models', () => {
  it('hydrates provider hierarchies with clients, keys, audit events, and usage metrics', async () => {
    const provider = await ApiProvider.create({
      name: 'Stripe',
      slug: 'stripe',
      status: 'active',
      baseUrl: 'https://api.stripe.com',
      sandboxBaseUrl: 'https://sandbox.stripe.com',
      docsUrl: 'https://docs.stripe.com',
      iconUrl: 'https://cdn.gigvora.test/providers/stripe.png',
      description: 'Payments infrastructure',
      contactEmail: 'devrel@stripe.com',
      callPriceCents: 12,
      metadata: { category: 'payments' },
    });

    const client = await ApiClient.create({
      providerId: provider.id,
      name: 'Gigvora Platform',
      slug: 'gigvora-platform',
      description: 'Primary production integration',
      contactEmail: 'platform-ops@gigvora.test',
      status: 'active',
      accessLevel: 'admin',
      rateLimitPerMinute: 1800,
      ipAllowList: ['10.10.0.1', '10.10.0.2'],
      scopes: ['charges:write', 'customers:read'],
      webhookUrl: 'https://webhooks.gigvora.test/stripe',
      webhookSecretHash: 'hashed-secret',
      webhookSecretLastFour: '9b4f',
      walletAccountId: 501,
      callPriceCents: 9,
      metadata: { region: 'us' },
      createdBy: 'system',
      lastUsedAt: createDate('2024-05-18T12:00:00Z'),
    });

    await ApiClientKey.create({
      clientId: client.id,
      label: 'Primary',
      secretHash: 'hashed-secret-value',
      secretLastFour: 'c1d2',
      createdBy: 'system',
      expiresAt: createDate('2024-12-31T00:00:00Z'),
      lastRotatedAt: createDate('2024-04-01T00:00:00Z'),
    });

    await ApiClientAuditEvent.create({
      clientId: client.id,
      eventType: 'key.rotated',
      description: 'Primary key rotated',
      actor: 'system',
      ipAddress: '192.168.1.10',
      metadata: { reason: 'security_policy' },
    });

    await ApiClientUsageMetric.create({
      clientId: client.id,
      metricDate: '2024-05-17',
      requestCount: 18250,
      errorCount: 12,
      avgLatencyMs: 320,
      peakLatencyMs: 780,
      lastRequestAt: createDate('2024-05-17T23:59:00Z'),
      billableRequestCount: 17800,
      billedAmountCents: 5340,
    });

    const hydratedProvider = await ApiProvider.findByPk(provider.id, {
      include: [
        {
          model: ApiClient,
          as: 'clients',
          include: [
            { model: ApiClientKey, as: 'keys' },
            { model: ApiClientAuditEvent, as: 'auditEvents' },
            { model: ApiClientUsageMetric, as: 'usageMetrics' },
          ],
        },
      ],
    });

    const publicProvider = hydratedProvider.toPublicObject();
    expect(publicProvider.callPriceCents).toBe(12);
    expect(publicProvider.metadata).toEqual({ category: 'payments' });
    expect(publicProvider.clients).toHaveLength(1);

    const publicClient = hydratedProvider.clients[0].toPublicObject();
    expect(publicClient.keys).toHaveLength(1);
    expect(publicClient.keys[0]).toMatchObject({ secretLastFour: 'c1d2' });
    expect(publicClient.keys[0]).not.toHaveProperty('secretHash');
    expect(publicClient.usage).toHaveLength(1);
    expect(publicClient.usage[0].billableRequestCount).toBe(17800);

    const hydratedClient = await ApiClient.findByPk(client.id, {
      include: [
        { model: ApiProvider, as: 'provider' },
        { model: ApiClientKey, as: 'keys' },
        { model: ApiClientAuditEvent, as: 'auditEvents' },
        { model: ApiClientUsageMetric, as: 'usageMetrics' },
      ],
    });
    const clientWithProvider = hydratedClient.toPublicObject({ includeProvider: true });
    expect(clientWithProvider.provider).toMatchObject({ id: provider.id, slug: 'stripe' });

    const sanitizedProvider = hydratedProvider.toPublicObject({ includeClients: false });
    expect(sanitizedProvider.clients).toBeUndefined();

    const keyPublic = hydratedProvider.clients[0].keys[0].toPublicObject();
    expect(keyPublic.secretLastFour).toBe('c1d2');
    expect(keyPublic).not.toHaveProperty('secretHash');

    const auditPublic = hydratedProvider.clients[0].auditEvents[0].toPublicObject();
    expect(auditPublic.metadata).toEqual({ reason: 'security_policy' });

    const usagePublic = hydratedProvider.clients[0].usageMetrics[0].toPublicObject();
    expect(usagePublic.billedAmountCents).toBe(5340);
  });
});
