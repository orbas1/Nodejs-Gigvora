import { jest } from '@jest/globals';

import sequelize from '../models/sequelizeClient.js';
import PlatformSetting from '../models/platformSetting.js';
import {
  POLICY_DECISIONS,
  RbacPolicyAuditEvent,
} from '../models/rbacPolicyAuditEvent.js';
import {
  SECURITY_LEVELS,
  RuntimeSecurityAuditEvent,
} from '../models/runtimeSecurityAuditEvent.js';
import {
  VolunteeringPost,
  VolunteeringApplication,
  VolunteeringApplicationResponse,
  VolunteeringInterview,
  VolunteeringContract,
  VolunteeringContractSpend,
  VOLUNTEERING_RESPONSE_TYPES,
} from '../models/volunteeringModels.js';
import SeoSetting, { SeoPageOverride } from '../models/seoSetting.js';
import SiteModels from '../models/siteManagementModels.js';
import StorageModels from '../models/storageManagementModels.js';
import SystemSetting from '../models/systemSetting.js';
import dependencyHealth from '../observability/dependencyHealth.js';
import {
  resetPerimeterMetrics,
  recordBlockedOrigin,
} from '../observability/perimeterMetrics.js';
import {
  resetRateLimitMetrics,
  recordRateLimitAttempt,
  recordRateLimitSuccess,
  recordRateLimitBlocked,
} from '../observability/rateLimitMetrics.js';
import {
  resetMetricsForTesting,
  collectMetrics,
  getMetricsStatus,
  getMetricsContentType,
} from '../observability/metricsRegistry.js';
import {
  configureWebApplicationFirewall,
  registerBlock,
  resetWebApplicationFirewallMetrics,
} from '../security/webApplicationFirewall.js';
import { getDatabasePoolSnapshot } from '../services/databaseLifecycleService.js';
import {
  canAccessChannel,
  listChannelsForActor,
  resolveChannelFeatureFlags,
  differenceBetweenAllowedRoles,
  overlappingRoles,
} from '../realtime/channelRegistry.js';
import createConnectionRegistry from '../realtime/connectionRegistry.js';

const { SiteNavigationLink } = SiteModels;
const { StorageLocation, StorageLifecycleRule, StorageUploadPreset } = StorageModels;

beforeAll(async () => {
  await sequelize.authenticate();
  await PlatformSetting.sync({ force: true });
  await SystemSetting.sync({ force: true });
  await RbacPolicyAuditEvent.sync({ force: true });
  await RuntimeSecurityAuditEvent.sync({ force: true });
  await SeoSetting.sync({ force: true });
  await SeoPageOverride.sync({ force: true });
  await SiteNavigationLink.sync({ force: true });
  await StorageLocation.sync({ force: true });
  await StorageLifecycleRule.sync({ force: true });
  await StorageUploadPreset.sync({ force: true });
  await VolunteeringPost.sync({ force: true });
  await VolunteeringApplication.sync({ force: true });
  await VolunteeringApplicationResponse.sync({ force: true });
  await VolunteeringInterview.sync({ force: true });
  await VolunteeringContract.sync({ force: true });
  await VolunteeringContractSpend.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Platform and system settings models', () => {
  test('persist and format platform settings safely', async () => {
    const setting = await PlatformSetting.create({ key: 'theme', value: { color: 'blue' } });
    const publicShape = setting.toPublicObject();

    expect(publicShape).toEqual(
      expect.objectContaining({
        key: 'theme',
        value: { color: 'blue' },
      }),
    );
  });

  test('system setting enforces unique keys and exposes category', async () => {
    const record = await SystemSetting.create({ key: 'auth.session', category: 'security', value: { ttl: 3600 } });
    const view = record.toPublicObject();

    expect(view).toMatchObject({ key: 'auth.session', category: 'security' });
    await expect(
      SystemSetting.create({ key: 'auth.session', category: 'security', value: { ttl: 1200 } }),
    ).rejects.toThrow();
  });
});

describe('RBAC and runtime audit models', () => {
  test('enforces decision enum and normalises metadata', async () => {
    const event = await RbacPolicyAuditEvent.create({
      policyKey: 'workspace:invite',
      persona: 'admin',
      action: 'invite',
      resource: 'workspace:42',
      decision: POLICY_DECISIONS[0],
      metadata: { risk: 'low' },
    });

    expect(event.toPublicObject()).toMatchObject({
      decision: 'allow',
      metadata: { risk: 'low' },
    });

    await expect(
      RbacPolicyAuditEvent.create({
        policyKey: 'workspace:invite',
        persona: 'admin',
        action: 'invite',
        resource: 'workspace:42',
        decision: 'invalid',
      }),
    ).rejects.toThrow();
  });

  test('runtime security audit events default metadata and timestamps', async () => {
    const event = await RuntimeSecurityAuditEvent.create({
      eventType: 'waf.blocked',
      level: SECURITY_LEVELS[1],
      message: 'WAF blocked suspicious traffic',
    });

    const view = event.toPublicObject();
    expect(view.level).toBe('warning');
    expect(view.metadata).toEqual({});
    expect(view.occurredAt).toBeInstanceOf(Date);
  });
});

describe('SEO and site management models', () => {
  test('page override inherits from seo setting', async () => {
    const setting = await SeoSetting.create({ key: 'default' });
    const override = await SeoPageOverride.create({
      seoSettingId: setting.id,
      path: '/pricing',
      title: 'Pricing',
      keywords: ['pricing'],
    });

    await setting.reload({ include: [{ model: SeoPageOverride, as: 'overrides' }] });
    const view = setting.toPublicObject();
    expect(view.overrides).toHaveLength(1);
    expect(override.toPublicObject()).toMatchObject({ path: '/pricing', keywords: ['pricing'] });
  });

  test('site navigation serialises safe arrays', async () => {
    const link = await SiteNavigationLink.create({ menuKey: 'primary', label: 'Docs', url: '/docs' });
    expect(link.toPublicObject()).toMatchObject({ label: 'Docs', allowedRoles: [] });
  });
});

describe('Storage management models', () => {
  test('exposes metrics without leaking secrets', async () => {
    const location = await StorageLocation.create({
      locationKey: 'primary',
      name: 'Primary Bucket',
      provider: 'aws',
      bucket: 'gigvora-primary',
      credentialSecret: 'super-secret',
    });

    const lifecycle = await StorageLifecycleRule.create({
      locationId: location.id,
      name: 'Archive after 90 days',
    });

    await location.reload({ include: ['lifecycleRules'] });
    const view = location.toPublicObject();

    expect(view.credentials.hasSecretAccessKey).toBe(true);
    expect(lifecycle.toPublicObject()).toMatchObject({ locationId: location.id, status: 'active' });
  });

  test('upload presets provide safe defaults', async () => {
    const location = await StorageLocation.findOne({ where: { locationKey: 'primary' } });
    const preset = await StorageUploadPreset.create({ locationId: location.id, name: 'images' });

    expect(preset.toPublicObject()).toMatchObject({ name: 'images', allowedMimeTypes: [] });
  });
});

describe('Volunteering workflow models', () => {
  test('creates linked records across the volunteering lifecycle', async () => {
    const post = await VolunteeringPost.create({
      workspaceId: 1,
      title: 'Community Mentor',
      status: 'open',
      skills: ['mentoring'],
    });

    const application = await VolunteeringApplication.create({
      workspaceId: 1,
      postId: post.id,
      candidateName: 'Jamie Doe',
    });

    const response = await VolunteeringApplicationResponse.create({
      workspaceId: 1,
      applicationId: application.id,
      responseType: VOLUNTEERING_RESPONSE_TYPES[1],
      visibility: 'internal',
      message: 'We would love to chat more.',
    });

    const interview = await VolunteeringInterview.create({
      workspaceId: 1,
      applicationId: application.id,
      scheduledAt: new Date(),
    });

    const contract = await VolunteeringContract.create({
      workspaceId: 1,
      applicationId: application.id,
      title: 'Mentorship Agreement',
    });

    const spend = await VolunteeringContractSpend.create({
      workspaceId: 1,
      contractId: contract.id,
      amount: 125.5,
    });

    expect(response.toPublicObject()).toMatchObject({ responseType: 'note', attachments: [] });
    expect(interview.toPublicObject()).toMatchObject({ status: 'scheduled' });
    expect(contract.toPublicObject()).toMatchObject({ deliverables: [] });
    expect(spend.toPublicObject()).toMatchObject({ amount: '125.50' });

    const populated = await VolunteeringApplication.findByPk(application.id, {
      include: ['responses', 'interviews', 'contracts'],
    });
    expect(populated.responses).toHaveLength(1);
    expect(populated.interviews).toHaveLength(1);
    expect(populated.contracts).toHaveLength(1);
  });
});

describe('Dependency health orchestration', () => {
  test('reports degraded state when escrow disabled', () => {
    const result = dependencyHealth.syncCriticalDependencies(
      { payments: { provider: 'stripe', stripe: { secretKey: 'sk', publishableKey: 'pk' } }, featureToggles: { escrow: false } },
      { logger: { warn: jest.fn(), error: jest.fn() } },
    );

    expect(result.complianceStatus.status).toBe('degraded');
    expect(result.paymentsStatus.status).toBe('ok');
  });
});

describe('Observability metrics', () => {
  test('aggregates rate limit, perimeter, and infrastructure metrics', async () => {
    resetRateLimitMetrics();
    resetPerimeterMetrics();
    resetMetricsForTesting();
    resetWebApplicationFirewallMetrics();
    configureWebApplicationFirewall({ env: { WAF_AUTO_BLOCK_DISABLED: 'true' } });

    recordRateLimitAttempt({ key: 'user-1', method: 'GET', path: '/api/test' });
    recordRateLimitSuccess({ key: 'user-1' });
    recordRateLimitBlocked({ key: 'user-1', method: 'POST', path: '/api/secure' });
    recordBlockedOrigin('https://spam.example', { method: 'GET', path: '/api/secure' });
    registerBlock({
      ip: '203.0.113.1',
      userAgent: 'jest-agent',
      path: '/api/secure',
      method: 'POST',
      origin: 'https://spam.example',
      detectedAt: new Date().toISOString(),
      matchedRules: [{ id: 'manual-test' }],
    });

    const dbSnapshot = getDatabasePoolSnapshot();
    expect(dbSnapshot).toHaveProperty('vendor');

    const metrics = await collectMetrics();
    expect(metrics).toContain('gigvora_metrics_scrapes_total');

    const status = getMetricsStatus();
    expect(status.rateLimit.hits).toBeGreaterThan(0);
    expect(status.perimeter.totalBlocked).toBeGreaterThan(0);
    expect(getMetricsContentType()).toMatch(/text\/plain/);
  });
});

describe('Realtime registries', () => {
  test('channel registry enforces roles and exposes features', () => {
    const freelancerChannels = listChannelsForActor({ roles: ['freelancer'] });
    expect(freelancerChannels.some((channel) => channel.slug === 'global-lobby')).toBe(true);
    expect(canAccessChannel('moderation-hq', { roles: ['freelancer'] })).toBe(false);

    const diff = differenceBetweenAllowedRoles('moderation-hq', ['freelancer', 'moderator']);
    expect(diff).toContain('freelancer');
    expect(overlappingRoles('moderation-hq', ['admin', 'moderator'])).toEqual(['moderator']);
    expect(resolveChannelFeatureFlags('talent-opportunities')).toMatchObject({ attachments: true, voice: false });
  });

  test('connection registry enforces maximum sessions per user', async () => {
    const presenceStore = {
      setUserPresence: jest.fn().mockResolvedValue(),
      trackJoin: jest.fn().mockResolvedValue(),
      trackLeave: jest.fn().mockResolvedValue(),
    };
    const logger = { warn: jest.fn() };
    const registry = createConnectionRegistry({ maxConnectionsPerUser: 2, presenceStore, logger });

    const socketFactory = (id) => ({
      id,
      handshake: { address: '127.0.0.1', headers: { 'user-agent': 'jest' } },
      data: { actor: { id: 'user-1' } },
      emit: jest.fn(),
      disconnect: jest.fn(),
    });

    const socketA = socketFactory('A');
    const socketB = socketFactory('B');
    const socketC = socketFactory('C');

    await registry.register(socketA);
    await registry.register(socketB);
    await registry.register(socketC);

    expect(socketA.disconnect).toHaveBeenCalled();
    expect(presenceStore.trackJoin).toHaveBeenCalledTimes(3);
    expect(registry.getActiveConnections('user-1')).toHaveLength(2);
    expect(registry.getConnectedUserCount()).toBe(1);

    await registry.unregister(socketB, 'manual');
    expect(presenceStore.trackLeave).toHaveBeenCalledWith('user-1', expect.any(Object), 'manual');
  });
});

