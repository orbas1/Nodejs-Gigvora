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
import RuntimeAnnouncement, {
  RUNTIME_ANNOUNCEMENT_SEVERITIES,
  RUNTIME_ANNOUNCEMENT_STATUSES,
} from '../models/runtimeAnnouncement.js';
import {
  Project,
  ProjectWorkspace,
} from '../models/projectGigManagementModels.js';
import {
  ProjectBudgetLine,
  ProjectTask,
  ProjectTaskAssignment,
  syncProjectWorkspaceModels,
} from '../models/projectWorkspaceModels.js';
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

const { SiteSetting, SitePage, SiteNavigationLink } = SiteModels;
const { StorageLocation, StorageLifecycleRule, StorageUploadPreset } = StorageModels;

beforeAll(async () => {
  await sequelize.authenticate();
  await PlatformSetting.sync({ force: true });
  await SystemSetting.sync({ force: true });
  await RbacPolicyAuditEvent.sync({ force: true });
  await RuntimeSecurityAuditEvent.sync({ force: true });
  await RuntimeAnnouncement.sync({ force: true });
  await SeoSetting.sync({ force: true });
  await SeoPageOverride.sync({ force: true });
  await SiteSetting.sync({ force: true });
  await SitePage.sync({ force: true });
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
  await syncProjectWorkspaceModels({ force: true });
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

  test('system settings normalise keys, track environments, and hide sensitive values', async () => {
    const base = await SystemSetting.ensureSetting('Auth.Session', {
      category: 'security',
      description: 'Session lifetime',
      value: { ttl: 3600 },
      updatedBy: 'ops',
    });

    expect(base.key).toBe('auth.session');
    expect(base.environmentScope).toBe('global');
    expect(base.version).toBe(1);

    await base.updateValue({ ttl: 7200 }, { updatedBy: 'ops', metadata: { reason: 'launch prep' } });
    expect(base.version).toBe(2);
    expect(base.metadata.reason).toBe('launch prep');

    const staging = await SystemSetting.ensureSetting('auth.session', {
      environmentScope: 'Staging',
      valueType: 'number',
      value: 1800,
      updatedBy: 'qa',
    });

    expect(staging.environmentScope).toBe('staging');
    expect(staging.getTypedValue()).toBe(1800);

    const resolvedStaging = await SystemSetting.resolveValue('auth.session', { environmentScope: 'staging' });
    expect(resolvedStaging).toBe(1800);

    const resolvedGlobal = await SystemSetting.resolveValue('auth.session');
    expect(resolvedGlobal).toEqual({ ttl: 7200 });

    const secret = await SystemSetting.ensureSetting('ops.secret', {
      valueType: 'string',
      value: 'shh',
      isSensitive: true,
    });

    expect(secret.toPublicObject().value).toBeNull();
    expect(secret.toPublicObject({ revealSensitive: true }).value).toBe('shh');
  });

  test('typed platform settings hide sensitive values until revealed', async () => {
    const featureFlag = await PlatformSetting.create({
      key: 'features.new-dashboard',
      valueType: 'boolean',
      value: true,
      isSensitive: true,
    });

    expect(featureFlag.getTypedValue()).toBe(true);
    expect(featureFlag.toPublicObject().value).toBeNull();

    await featureFlag.updateValue('false', { updatedBy: 'tester' });
    expect(featureFlag.version).toBe(2);
    expect(featureFlag.getTypedValue()).toBe(false);

    const revealed = featureFlag.toPublicObject({ revealSensitive: true });
    expect(revealed.value).toBe(false);

    const ensured = await PlatformSetting.ensureSetting('features.new-dashboard', {
      valueType: 'boolean',
      value: true,
      updatedBy: 'tester',
    });
    expect(ensured.getTypedValue()).toBe(true);
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

  test('resolveForPath merges overrides safely', async () => {
    const seo = await SeoSetting.create({
      key: 'marketing',
      defaultTitle: 'Gigvora',
      defaultKeywords: ['gigvora', 'platform'],
    });

    await SeoPageOverride.create({
      seoSettingId: seo.id,
      path: '/launch',
      title: 'Launch Event',
      description: 'Join our launch',
      keywords: ['launch', 'event'],
      canonicalUrl: 'https://gigvora.com/launch',
    });

    const resolved = await SeoSetting.resolveForPath('/launch', { key: 'marketing' });
    expect(resolved.activeOverride).toMatchObject({ path: '/launch', title: 'Launch Event' });
    expect(resolved.defaultTitle).toBe('Launch Event');
    expect(resolved.defaultKeywords).toContain('launch');
  });

  test('site settings normalise keys and version updates', async () => {
    const setting = await SiteSetting.ensureSetting('Header CTA', {
      value: { label: 'Join', url: '/signup' },
      updatedBy: 'designer',
      metadata: { theme: 'light' },
    });

    expect(setting.key).toBe('header-cta');
    expect(setting.version).toBe(1);

    await setting.updateValue({ label: 'Get Started', url: '/start' }, { updatedBy: 'designer' });
    expect(setting.version).toBe(2);
    expect(setting.toPublicObject()).toMatchObject({
      category: 'content',
      metadata: { theme: 'light' },
    });
  });

  test('site pages sanitise slugs, enforce visibility, and support publishing', async () => {
    const draft = await SitePage.create({
      slug: 'Landing Page ',
      title: 'Landing Page',
      allowedRoles: ['member'],
      status: 'draft',
    });

    expect(draft.slug).toBe('landing-page');
    expect(draft.canActorView(['member'])).toBe(true);
    expect(draft.canActorView(['guest'])).toBe(false);

    await draft.publish({ publishedAt: new Date('2024-01-01T00:00:00Z') });
    expect(draft.status).toBe('published');
    expect(draft.publishedAt.toISOString()).toBe('2024-01-01T00:00:00.000Z');

    const visible = await SitePage.filterVisibleToRoles(['member']);
    expect(visible.map((page) => page.slug)).toContain('landing-page');

    await draft.archive();
    expect(draft.status).toBe('archived');
  });

  test('site navigation serialises safe arrays', async () => {
    const link = await SiteNavigationLink.create({ menuKey: 'primary', label: 'Docs', url: '/docs' });
    expect(link.toPublicObject()).toMatchObject({ label: 'Docs', allowedRoles: ['guest'] });
  });

  test('site navigation supports role filtered menu trees and reordering', async () => {
    const parent = await SiteNavigationLink.create({
      menuKey: 'secondary',
      label: 'Dashboard',
      url: '/dashboard',
      allowedRoles: ['member', 'admin'],
      orderIndex: 1,
    });
    const child = await SiteNavigationLink.create({
      menuKey: 'secondary',
      label: 'Admin',
      url: '/dashboard/admin',
      allowedRoles: ['admin'],
      parentId: parent.id,
      orderIndex: 2,
    });

    await SiteNavigationLink.reorderMenu('secondary', [child.id, parent.id]);
    await parent.reload();
    expect(parent.orderIndex).toBe(1); // unaffected because child reorder doesn't override parent

    const tree = await SiteNavigationLink.loadMenuTree('secondary', { actorRoles: ['admin'] });
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].label).toBe('Admin');

    const guestTree = await SiteNavigationLink.loadMenuTree('secondary', { actorRoles: ['guest'] });
    expect(guestTree.find((item) => item.label === 'Admin')).toBeUndefined();
  });
});

describe('Runtime announcements', () => {
  test('fetchActiveAnnouncements honours audience and lifecycle', async () => {
    const announcement = await RuntimeAnnouncement.create({
      slug: 'maintenance-window',
      title: 'Maintenance',
      message: 'Planned maintenance window',
      severity: RUNTIME_ANNOUNCEMENT_SEVERITIES[1],
      status: RUNTIME_ANNOUNCEMENT_STATUSES[1],
      startsAt: new Date(Date.now() - 5 * 60 * 1000),
      endsAt: new Date(Date.now() + 10 * 60 * 1000),
      audiences: ['admins'],
      channels: ['status'],
    });

    const matches = await RuntimeAnnouncement.fetchActiveAnnouncements({ audience: 'admins', channel: 'status' });
    expect(matches.map((item) => item.slug)).toContain('maintenance-window');

    await announcement.markResolved({ summary: 'Completed', updatedBy: 'ops' });
    expect(announcement.status).toBe('resolved');
    expect(announcement.metadata.resolutionSummary).toBe('Completed');
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
    const location = await StorageLocation.create({
      locationKey: 'uploads',
      name: 'Uploads Bucket',
      provider: 'aws',
      bucket: 'gigvora-uploads',
      credentialSecret: 'upload-secret',
    });
    const preset = await StorageUploadPreset.create({ locationId: location.id, name: 'images' });

    expect(preset.toPublicObject()).toMatchObject({ name: 'images', allowedMimeTypes: [] });
  });

  test('records usage deltas and evaluates upload permissions', async () => {
    const location = await StorageLocation.create({
      locationKey: 'delta-bucket',
      name: 'Delta Bucket',
      provider: 'aws',
      bucket: 'gigvora-delta',
      status: 'active',
    });

    await StorageLocation.recordUsageDelta('delta-bucket', {
      mbDelta: 50.5,
      objectDelta: 5,
      ingestDelta: 2000,
      egressDelta: 1000,
      errorDelta: 2,
    });

    await location.reload();
    expect(location.getUsageSummary()).toMatchObject({
      currentUsageMb: 50.5,
      objectCount: 5,
      ingestBytes24h: 2000,
      egressBytes24h: 1000,
      errorCount24h: 2,
    });
    expect(location.isHealthy()).toBe(true);

    const preset = await StorageUploadPreset.create({
      locationId: location.id,
      name: 'restricted',
      allowedMimeTypes: ['image/*'],
      allowedRoles: ['member', 'admin'],
    });

    expect(preset.isMimeTypeAllowed('image/png')).toBe(true);
    expect(preset.isMimeTypeAllowed('video/mp4')).toBe(false);
    expect(preset.isRoleAllowed(['guest'])).toBe(false);
    expect(preset.isRoleAllowed(['member'])).toBe(true);
  });
});

describe('Project workspace models', () => {
  test('task lifecycle updates workspace progress', async () => {
    const project = await Project.create({ ownerId: 1, title: 'Alpha rollout', description: 'Launch project' });
    const workspace = await ProjectWorkspace.create({ projectId: project.id });
    const budgetLine = await ProjectBudgetLine.create({ projectId: project.id, label: 'Design', category: 'design' });

    await budgetLine.reconcileActuals(2500, { updatedBy: 'finance' });
    expect(budgetLine.metadata.reconciledBy).toBe('finance');

    const task = await ProjectTask.create({ projectId: project.id, title: 'Kickoff deck' });
    const assignment = await ProjectTaskAssignment.create({ taskId: task.id, assigneeName: 'Alice' });

    await workspace.recalculateProgressFromTasks();
    expect(Number(workspace.progressPercent)).toBe(0);

    await assignment.accept({ acceptedBy: 'alice' });
    expect(assignment.metadata.acceptedBy).toBe('alice');

    await task.markComplete({ completedBy: 'alice' });
    await workspace.recalculateProgressFromTasks();
    expect(Number(workspace.progressPercent)).toBeCloseTo(100);

    const taskPublic = task.toPublicObject();
    expect(taskPublic.status).toBe('completed');
    expect(taskPublic.metadata.completedBy).toBe('alice');
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
    expect(spend.toPublicObject()).toMatchObject({ amount: 125.5 });

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
    expect(overlappingRoles('moderation-hq', ['admin', 'moderator'])).toEqual(
      expect.arrayContaining(['moderator']),
    );
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
    await registry.unregister(socketA, 'limit');
    expect(registry.getActiveConnections('user-1')).toHaveLength(2);
    expect(registry.getConnectedUserCount()).toBe(1);

    await registry.unregister(socketB, 'manual');
    expect(presenceStore.trackLeave).toHaveBeenCalledWith('user-1', expect.any(Object), 'manual');
  });
});

