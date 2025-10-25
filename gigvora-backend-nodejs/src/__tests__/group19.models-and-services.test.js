import { afterEach, beforeAll, describe, expect, jest, test } from '@jest/globals';

import { UserEvent } from '../models/eventManagement.js';
import { PlatformSetting } from '../models/platformSetting.js';
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
import {
  POLICY_DECISIONS,
  RbacPolicyAuditEvent,
} from '../models/rbacPolicyAuditEvent.js';
import {
  RuntimeAnnouncement,
  RUNTIME_ANNOUNCEMENT_SEVERITIES,
  RUNTIME_ANNOUNCEMENT_STATUSES,
} from '../models/runtimeAnnouncement.js';
import {
  RuntimeSecurityAuditEvent,
  SECURITY_LEVELS,
} from '../models/runtimeSecurityAuditEvent.js';
import { SeoPageOverride, SeoSetting } from '../models/seoSetting.js';
import { sequelize } from '../models/sequelizeClient.js';
import {
  SiteNavigationLink,
  SitePage,
  SiteSetting,
} from '../models/siteManagementModels.js';
import {
  StorageLifecycleRule,
  StorageLocation,
  StorageUploadPreset,
} from '../models/storageManagementModels.js';
import { SystemSetting } from '../models/systemSetting.js';
import {
  VolunteeringApplication,
  VolunteeringApplicationResponse,
  VolunteeringContract,
  VolunteeringContractSpend,
  VolunteeringInterview,
  VolunteeringPost,
  VOLUNTEERING_RESPONSE_TYPES,
} from '../models/volunteeringModels.js';
import { syncCriticalDependencies } from '../observability/dependencyHealth.js';
import {
  collectMetrics,
  getMetricsContentType,
  getMetricsStatus,
  resetMetricsForTesting,
} from '../observability/metricsRegistry.js';
import {
  recordBlockedOrigin,
  resetPerimeterMetrics,
} from '../observability/perimeterMetrics.js';
import {
  recordRateLimitAttempt,
  recordRateLimitBlocked,
  recordRateLimitSuccess,
  resetRateLimitMetrics,
} from '../observability/rateLimitMetrics.js';
import {
  canAccessChannel,
  differenceBetweenAllowedRoles,
  listChannelsForActor,
  overlappingRoles,
  resolveChannelFeatureFlags,
} from '../realtime/channelRegistry.js';
import {
  registerCommunityNamespace,
  __resetCommunityService as resetCommunityServiceForTest,
  __setCommunityService as setCommunityServiceForTest,
} from '../realtime/communityNamespace.js';
import { createConnectionRegistry } from '../realtime/connectionRegistry.js';
import { registerEventsNamespace } from '../realtime/eventsNamespace.js';
import {
  configureWebApplicationFirewall,
  registerBlock,
  resetWebApplicationFirewallMetrics,
} from '../security/webApplicationFirewall.js';
import { getDatabasePoolSnapshot } from '../services/databaseLifecycleService.js';
import { getSiteSettings, saveSiteSettings } from '../services/siteManagementService.js';
import { AuthorizationError } from '../utils/errors.js';

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
  await UserEvent.sync({ force: true });
});

function createTestLogger() {
  const logger = {
    child: jest.fn(() => logger),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  };
  return logger;
}

function createFakeNamespace() {
  const middlewares = [];
  const connectionHandlers = [];
  const emissions = [];
  return {
    use(fn) {
      middlewares.push(fn);
    },
    on(event, handler) {
      if (event === 'connection') {
        connectionHandlers.push(handler);
      }
    },
    to(room) {
      return {
        emit(event, payload) {
          emissions.push({ room, event, payload });
        },
      };
    },
    emit(event, payload) {
      emissions.push({ room: null, event, payload });
    },
    async connect(socket) {
      for (const middleware of middlewares) {
        await new Promise((resolve, reject) => {
          try {
            middleware(socket, (error) => {
              if (error) {
                reject(error);
              } else {
                resolve();
              }
            });
          } catch (error) {
            reject(error);
          }
        });
      }
      connectionHandlers.forEach((handler) => handler(socket));
      return socket;
    },
    getEmitted() {
      return emissions;
    },
  };
}

function createFakeIo() {
  const namespaces = new Map();
  return {
    of(namespace) {
      if (!namespaces.has(namespace)) {
        namespaces.set(namespace, createFakeNamespace());
      }
      return namespaces.get(namespace);
    },
    getNamespace(namespace) {
      return namespaces.get(namespace);
    },
  };
}

function createFakeSocket({ actor } = {}) {
  const handlers = new Map();
  const emitted = [];
  const joins = [];
  const leaves = [];
  const data = {};
  if (actor !== undefined) {
    data.actor = actor;
  }
  return {
    id: `socket-${Math.random().toString(36).slice(2)}`,
    data,
    rooms: new Set(),
    emit(event, payload) {
      emitted.push({ event, payload });
    },
    on(event, handler) {
      handlers.set(event, handler);
    },
    async trigger(event, payload) {
      const handler = handlers.get(event);
      if (!handler) {
        throw new Error(`No handler registered for ${event}`);
      }
      return handler(payload);
    },
    async join(room) {
      this.rooms.add(room);
      joins.push(room);
    },
    async leave(room) {
      this.rooms.delete(room);
      leaves.push(room);
    },
    getEmitted() {
      return emitted;
    },
    getJoins() {
      return joins;
    },
    getLeaves() {
      return leaves;
    },
  };
}

function findEmission(emissions, event) {
  return emissions.find((entry) => entry.event === event);
}

function stubCommunityService(overrides = {}) {
  const service = {
    joinCommunityChannel: jest.fn().mockResolvedValue({ messages: [] }),
    leaveCommunityChannel: jest.fn().mockResolvedValue(),
    publishMessage: jest.fn().mockResolvedValue({}),
    acknowledgeMessages: jest.fn().mockResolvedValue(),
    fetchRecentMessages: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
  setCommunityServiceForTest(service);
  return service;
}

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

  test('getSiteSettings hydrates homepage defaults with hero media and persona journeys', async () => {
    await SiteSetting.destroy({ where: {} });
    const settings = await getSiteSettings();

    expect(settings.heroHeadline).toContain('Freelancers');
    expect(settings.heroMedia).toMatchObject({ imageUrl: expect.stringContaining('https://') });
    expect(Array.isArray(settings.heroKeywords)).toBe(true);
    expect(settings.heroKeywords.length).toBeGreaterThan(0);
    expect(Array.isArray(settings.communityStats)).toBe(true);
    expect(settings.communityStats.length).toBeGreaterThanOrEqual(3);
    expect(Array.isArray(settings.personaJourneys)).toBe(true);
    expect(settings.personaJourneys.length).toBeGreaterThanOrEqual(6);
    expect(settings.operationsSummary.escrowHealth.value).toBeTruthy();
    expect(Array.isArray(settings.recentPosts)).toBe(true);
    expect(settings.recentPosts.length).toBeGreaterThan(0);
  });

  test('saveSiteSettings sanitizes hero media, persona metrics, and operations summary overrides', async () => {
    await SiteSetting.destroy({ where: {} });
    await saveSiteSettings({
      heroKeywords: ['  Demo stream  ', null, ''],
      heroMedia: {
        imageUrl: '   ',
        posterUrl: 'https://cdn.gigvora.com/marketing/home/poster-new.jpg',
        videoSources: [
          { src: 'https://cdn.gigvora.com/video/preview.mp4', type: 'video/mp4' },
          { src: 'javascript:alert(1)' },
        ],
      },
      personaJourneys: [
        {
          key: 'Freelancer ',
          title: '   Freelancers unite ',
          metrics: [
            { persona: 'Freelancer', label: 'Conversion', value: '78%', change: '+12%' },
            { label: '', value: '' },
          ],
          steps: [
            { label: '  Polish portfolio ', icon: 'SparklesIcon' },
            { label: '', icon: '' },
          ],
        },
      ],
      operationsSummary: {
        escrowHealth: { label: 'Escrow uptime', value: '98%', trend: ['10', 'oops', '30'] },
      },
      recentPosts: [
        {
          id: 'feed',
          title: '  Title  ',
          summary: '  Summary  ',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
    });

    const settings = await getSiteSettings();

    expect(settings.heroKeywords).toContain('Demo stream');
    expect(settings.heroMedia.videoSources).toEqual(
      expect.arrayContaining([expect.objectContaining({ src: 'https://cdn.gigvora.com/video/preview.mp4' })]),
    );
    const freelancer = settings.personaJourneys.find((persona) => persona.key === 'freelancer');
    expect(freelancer.metrics.some((metric) => metric.label.includes('Conversion'))).toBe(true);
    expect(settings.operationsSummary.escrowHealth.trend.every((value) => typeof value === 'number')).toBe(true);
    expect(settings.recentPosts[0].title).toBe('Title');
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
    const result = syncCriticalDependencies(
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

    const status = await getMetricsStatus();
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

describe('Realtime namespaces', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    resetCommunityServiceForTest();
  });

  afterEach(async () => {
    await UserEvent.destroy({ where: {}, truncate: true, cascade: true });
  });

  test('rejects unauthenticated sockets for community namespace', async () => {
    const io = createFakeIo();
    const logger = createTestLogger();
    const namespace = registerCommunityNamespace(io, { logger, runtimeConfig: {} });
    const socket = createFakeSocket();

    await expect(namespace.connect(socket)).rejects.toBeInstanceOf(AuthorizationError);
  });

  test('community namespace handles membership, messaging, and history fetches', async () => {
    const io = createFakeIo();
    const logger = createTestLogger();
    const namespace = registerCommunityNamespace(io, {
      logger,
      runtimeConfig: { realtime: { namespaces: { community: { rateLimitPerMinute: 20 } } } },
    });
    const actor = { id: 21, roles: ['user'], permissions: [] };
    const socket = createFakeSocket({ actor });

    const serviceMocks = stubCommunityService({
      joinCommunityChannel: jest.fn().mockResolvedValue({
        messages: [{ id: 'm-1', body: 'Welcome' }],
      }),
      leaveCommunityChannel: jest.fn().mockResolvedValue(),
      publishMessage: jest.fn().mockResolvedValue({ id: 'm-2', body: 'Hello world' }),
      acknowledgeMessages: jest.fn().mockResolvedValue(),
      fetchRecentMessages: jest.fn().mockResolvedValue([{ id: 'm-3', body: 'Recent update' }]),
    });

    await namespace.connect(socket);

    await socket.trigger('community:join', { channel: 'global-lobby' });
    const joinAck = findEmission(socket.getEmitted(), 'community:joined');
    expect(joinAck?.payload.features).toMatchObject({ attachments: true });

    const joinPresence = namespace
      .getEmitted()
      .find((entry) => entry.event === 'community:presence' && entry.payload?.status === 'joined');
    expect(joinPresence).toEqual(
      expect.objectContaining({
        room: 'community:global-lobby',
        payload: expect.objectContaining({ userId: actor.id }),
      }),
    );

    await socket.trigger('community:message', {
      channel: 'global-lobby',
      body: 'Hi team!',
      metadata: { importance: 'high' },
    });

    expect(serviceMocks.publishMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        channelSlug: 'global-lobby',
        userId: actor.id,
        messageType: 'text',
        metadata: expect.objectContaining({ importance: 'high' }),
      }),
    );

    const broadcast = findEmission(namespace.getEmitted(), 'community:message');
    expect(broadcast?.payload.message.sender.id).toBe(actor.id);

    await socket.trigger('community:history', { channel: 'global-lobby', limit: 5 });
    const history = findEmission(socket.getEmitted(), 'community:history:list');
    expect(history?.payload.messages).toHaveLength(1);

    await socket.trigger('community:ack', { channel: 'global-lobby' });
    expect(serviceMocks.acknowledgeMessages).toHaveBeenCalledWith({
      channelSlug: 'global-lobby',
      userId: actor.id,
    });

    await socket.trigger('community:leave', { channel: 'global-lobby' });
    const leavePresence = namespace
      .getEmitted()
      .find((entry) => entry.event === 'community:presence' && entry.payload?.status === 'left');
    expect(leavePresence).toBeDefined();
  });

  test('community namespace enforces membership and rate limiting', async () => {
    const io = createFakeIo();
    const logger = createTestLogger();
    const namespace = registerCommunityNamespace(io, {
      logger,
      runtimeConfig: { realtime: { namespaces: { community: { rateLimitPerMinute: 1 } } } },
    });
    const actor = { id: 55, roles: ['user'], permissions: [] };
    const socket = createFakeSocket({ actor });

    const serviceMocks = stubCommunityService({
      joinCommunityChannel: jest.fn().mockResolvedValue({ messages: [] }),
      publishMessage: jest.fn().mockResolvedValue({ id: 'm-10', body: 'payload' }),
    });

    await namespace.connect(socket);

    await socket.trigger('community:message', { channel: 'global-lobby', body: 'First attempt' });
    const membershipError = socket.getEmitted().find((entry) => entry.event === 'community:error');
    expect(membershipError?.payload.message).toMatch(/join this channel/i);

    await socket.trigger('community:join', { channel: 'global-lobby' });
    await socket.trigger('community:message', { channel: 'global-lobby', body: 'First message' });
    await socket.trigger('community:message', { channel: 'global-lobby', body: 'Second message' });

    const rateLimitError = socket
      .getEmitted()
      .filter((entry) => entry.event === 'community:error')
      .pop();
    expect(rateLimitError?.payload.message).toMatch(/rate limit/i);
    expect(serviceMocks.publishMessage).toHaveBeenCalledTimes(1);
  });

  test('events namespace schedules events and broadcasts announcements', async () => {
    const io = createFakeIo();
    const logger = createTestLogger();
    const namespace = registerEventsNamespace(io, { logger });
    const actor = { id: 77, roles: ['user'], permissions: [] };
    const socket = createFakeSocket({ actor });

    await namespace.connect(socket);

    await socket.trigger('events:subscribe', { stream: 'product-launches' });
    expect(socket.getJoins()).toContain('events:product-launches');

    const startAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const endAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    await socket.trigger('events:schedule', {
      stream: 'product-launches',
      title: 'Launch Briefing',
      startAt,
      endAt,
      visibility: 'public',
    });

    const ack = findEmission(socket.getEmitted(), 'events:scheduled:ack');
    expect(ack?.payload.stream).toBe('product-launches');

    const scheduledBroadcast = findEmission(namespace.getEmitted(), 'events:scheduled');
    expect(scheduledBroadcast?.payload.event.title).toBe('Launch Briefing');

    const storedEvent = await UserEvent.findByPk(ack?.payload.id);
    expect(storedEvent?.metadata).toMatchObject({ stream: 'product-launches', scheduledBy: actor.id });

    await socket.trigger('events:announce', {
      stream: 'product-launches',
      message: '  Launch starting soon!  ',
      metadata: { priority: 'high' },
    });

    const announcement = findEmission(namespace.getEmitted(), 'events:announcement');
    expect(announcement?.payload.message).toBe('Launch starting soon!');
    expect(announcement?.payload.metadata).toMatchObject({ priority: 'high' });
  });

  test('events namespace returns upcoming history and surfaces validation errors', async () => {
    const io = createFakeIo();
    const logger = createTestLogger();
    const namespace = registerEventsNamespace(io, { logger });
    const actor = { id: 88, roles: ['user'], permissions: [] };
    const socket = createFakeSocket({ actor });

    await namespace.connect(socket);

    await UserEvent.create({
      ownerId: actor.id,
      title: 'Town Hall',
      status: 'planned',
      format: 'virtual',
      visibility: 'invite_only',
      startAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
      metadata: { stream: 'product-launches' },
    });

    await socket.trigger('events:history', { stream: 'product-launches', limit: 5 });

    const history = findEmission(socket.getEmitted(), 'events:history:list');
    expect(history?.payload.events).toHaveLength(1);
    expect(history?.payload.events[0].title).toBe('Town Hall');

    await socket.trigger('events:schedule', {
      stream: 'product-launches',
      title: 'Retro',
      startAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    });

    const errorEmission = socket
      .getEmitted()
      .filter((entry) => entry.event === 'events:error')
      .pop();
    expect(errorEmission?.payload.details).toBeDefined();
  });
});

