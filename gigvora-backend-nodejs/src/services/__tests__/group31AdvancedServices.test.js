import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const ORIGINAL_FETCH = global.fetch;

function resetAll() {
  jest.resetModules();
  jest.clearAllMocks();
  global.fetch = ORIGINAL_FETCH;
}


describe('interviewOrchestrationService', () => {
  beforeEach(() => {
    resetAll();
  });

  afterEach(() => {
    resetAll();
  });

  it('allows creating rooms, managing participants, and tracking workflows', async () => {
    const service = await import('../interviewOrchestrationService.js');

    const created = service.createInterviewRoom({
      workspaceId: 'workspace_enterprise_recruiting',
      stage: 'Product loop',
      participants: [
        { name: 'Candidate One', participantType: 'candidate', email: 'candidate@example.com' },
      ],
    });

    expect(created.workspaceId).toBe('workspace_enterprise_recruiting');
    expect(created.participants).toHaveLength(1);
    expect(created.status).toBe('scheduled');

    const participant = service.addInterviewParticipant(created.id, {
      participantType: 'company_member',
      name: 'Hiring Manager',
      email: 'hm@example.com',
      role: 'Hiring manager',
      isModerator: true,
    });

    expect(participant.name).toBe('Hiring Manager');
    const fetched = service.getInterviewRoom(created.id);
    expect(fetched.participants).toHaveLength(2);

    const checklist = service.createChecklistItem(created.id, {
      label: 'Send prep materials',
      status: 'pending',
    });
    service.updateChecklistItem(created.id, checklist.id, { status: 'completed' });
    const checklistItem = service.getInterviewRoom(created.id).checklist.find((item) => item.id === checklist.id);
    expect(checklistItem.status).toBe('completed');

    const card = service.createInterviewCard(created.workspaceId, 'lane_panel', {
      candidateId: 9001,
      candidateName: 'Candidate One',
      status: 'scheduled',
    });
    expect(card.status).toBe('scheduled');

    const workflow = service.getInterviewWorkflow(created.workspaceId);
    expect(workflow.lanes.some((lane) => lane.cards.some((entry) => entry.candidateId === 9001))).toBe(true);

    service.removeInterviewParticipant(created.id, participant.id);
    expect(service.getInterviewRoom(created.id).participants).toHaveLength(1);

    service.deleteInterviewCard(created.workspaceId, 'lane_panel', card.id);
    const updatedWorkflow = service.getInterviewWorkflow(created.workspaceId);
    const panelLane = updatedWorkflow.lanes.find((lane) => lane.id === 'lane_panel');
    expect(panelLane.cards.some((entry) => entry.id === card.id)).toBe(false);
  });
});

describe('newsAggregationService', () => {
  afterEach(() => {
    resetAll();
  });

  it('normalises guardian articles and persists new feed posts', async () => {
    const createdRecords = [];
    const existingRecords = new Map();

    const feedPostStub = {
      findOne: jest.fn(async ({ where }) => {
        if (where?.externalId) {
          return existingRecords.get(where.externalId) ?? null;
        }
        return null;
      }),
      create: jest.fn(async (payload) => {
        const record = {
          ...payload,
          id: `feed_${createdRecords.length + 1}`,
          update: jest.fn(async (updates) => {
            Object.assign(record, updates);
            return record;
          }),
        };
        createdRecords.push(record);
        existingRecords.set(record.externalId, record);
        return record;
      }),
    };

    const { runNewsAggregationOnce, __setNewsAggregationModels, __resetNewsAggregationState } = await import(
      '../newsAggregationService.js',
    );
    __setNewsAggregationModels({ FeedPost: feedPostStub });

    const now = new Date().toISOString();
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        response: {
          results: [
            {
              id: 'article/1',
              webTitle: 'Gig markets on the rise',
              webUrl: 'https://guardian.test/article/1',
              webPublicationDate: now,
              fields: {
                trailText: '<p>Rapid hiring &amp; collaboration.</p>',
                thumbnail: 'https://guardian.test/image.jpg',
                shortUrl: 'https://gu.com/p/1',
              },
            },
          ],
        },
      }),
    }));

    try {
      await runNewsAggregationOnce();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(createdRecords).toHaveLength(1);
      expect(createdRecords[0]).toEqual(
        expect.objectContaining({
          externalId: 'article/1',
          title: 'Gig markets on the rise',
          summary: 'Rapid hiring & collaboration.',
          source: 'The Guardian',
        }),
      );
    } finally {
      __resetNewsAggregationState();
    }
  });

  it('updates existing posts when reprocessing the same article', async () => {
    const existing = {
      externalId: 'article/2',
      title: 'Old title',
      summary: 'Old summary',
      content: 'Old summary',
      link: 'https://gu.com/p/2',
      imageUrl: null,
      source: 'The Guardian',
      publishedAt: new Date('2024-01-01T00:00:00.000Z'),
      update: jest.fn(async function update(updates) {
        Object.assign(this, updates);
        return this;
      }),
    };

    const feedPostStub = {
      findOne: jest.fn(async ({ where }) => {
        if (where?.externalId === 'article/2') {
          return existing;
        }
        return null;
      }),
      create: jest.fn(),
    };

    const { runNewsAggregationOnce, __setNewsAggregationModels, __resetNewsAggregationState } = await import(
      '../newsAggregationService.js',
    );
    __setNewsAggregationModels({ FeedPost: feedPostStub });

    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        response: {
          results: [
            {
              id: 'article/2',
              webTitle: 'Updated gig insights',
              webUrl: 'https://guardian.test/article/2',
              webPublicationDate: new Date().toISOString(),
              fields: {
                trailText: '<p>Better insights &mdash; more momentum.</p>',
                thumbnail: 'https://guardian.test/new-image.jpg',
                shortUrl: 'https://gu.com/p/2',
              },
            },
          ],
        },
      }),
    }));

    try {
      await runNewsAggregationOnce();

      expect(existing.update).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: 'Better insights — more momentum.',
          imageUrl: 'https://guardian.test/new-image.jpg',
        }),
      );
    } finally {
      __resetNewsAggregationState();
    }
  });
});

describe('messagingService assignSupportAgent', () => {
  const messagingModelsUrl = new URL('../../models/messagingModels.js', import.meta.url);
  const modelsIndexUrl = new URL('../../models/index.js', import.meta.url);
  const cacheModuleUrl = new URL('../../utils/cache.js', import.meta.url);
  const agoraModuleUrl = new URL('../agoraService.js', import.meta.url);

  beforeEach(() => {
    resetAll();
  });

  afterEach(() => {
    resetAll();
  });

  async function loadMessagingService({
    agentUserType = 'company',
    agentRoles = ['support_agent'],
    participantIds = [102, 204],
  } = {}) {
    const trx = { LOCK: { UPDATE: Symbol('update') } };

    const supportCaseRecord = {
      id: 8801,
      threadId: 4455,
      status: 'triage',
      priority: 'high',
      reason: 'Customer escalation',
      metadata: { customer: 'Acme Corp', _internalNote: 'sensitive' },
      assignedTo: null,
      assignedBy: null,
      assignedAt: null,
      firstResponseAt: null,
      save: jest.fn(async function save() {
        return this;
      }),
    };

    const agentRecord = {
      id: 730,
      firstName: 'Jordan',
      lastName: 'Lee',
      email: 'support.agent@example.com',
      userType: agentUserType,
    };

    const Message = { create: jest.fn() };
    const MessageThread = { update: jest.fn(), findByPk: jest.fn() };
    const MessageParticipant = {
      findAll: jest.fn(async () => participantIds.map((userId) => ({ userId }))),
    };
    const SupportCase = {
      findOne: jest.fn(async () => supportCaseRecord),
      findByPk: jest.fn(async () => ({
        ...supportCaseRecord,
        get: ({ plain } = {}) => (plain ? { ...supportCaseRecord } : supportCaseRecord),
        assignedAgent: {
          id: agentRecord.id,
          firstName: agentRecord.firstName,
          lastName: agentRecord.lastName,
          email: agentRecord.email,
        },
        escalatedByUser: null,
        resolvedByUser: null,
      })),
    };
    const User = {
      findByPk: jest.fn(async () => agentRecord),
    };
    const userRoleStub = {
      findAll: jest.fn(async () => agentRoles.map((role) => ({ role }))),
    };

    await jest.unstable_mockModule(messagingModelsUrl.pathname, () => ({
      sequelize: { transaction: jest.fn(async (handler) => handler(trx)) },
      MessageThread,
      MessageParticipant,
      Message,
      MessageAttachment: { create: jest.fn() },
      MessageLabel: { findAll: jest.fn(), create: jest.fn(), update: jest.fn(), destroy: jest.fn() },
      MessageThreadLabel: { findAll: jest.fn(), bulkCreate: jest.fn(), destroy: jest.fn() },
      SupportCase,
      User,
      MESSAGE_CHANNEL_TYPES: ['direct', 'support', 'project', 'contract', 'group'],
      MESSAGE_THREAD_STATES: ['active', 'archived', 'locked'],
      MESSAGE_TYPES: ['text', 'file', 'system', 'event'],
      SUPPORT_CASE_STATUSES: ['triage', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'],
      SUPPORT_CASE_PRIORITIES: ['low', 'medium', 'high', 'urgent'],
    }));
    await jest.unstable_mockModule(modelsIndexUrl.pathname, () => ({
      UserRole: userRoleStub,
    }));
    await jest.unstable_mockModule(cacheModuleUrl.pathname, () => ({
      appCache: {
        flushByPrefix: jest.fn(),
        delete: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
      },
      buildCacheKey: (...parts) => parts.join(':'),
    }));
    await jest.unstable_mockModule(agoraModuleUrl.pathname, () => ({
      createCallTokens: jest.fn(() => ({ token: 'token', uid: 'uid', appId: 'gigvora' })),
      getDefaultAgoraExpiry: jest.fn(() => new Date(Date.now() + 60_000)),
    }));

    const service = await import('../messagingService.js');

    return {
      assignSupportAgent: service.assignSupportAgent,
      supportCaseRecord,
      agentRecord,
      stubs: { Message, MessageParticipant, MessageThread, SupportCase, User },
      userRoleStub,
    };
  }

  it('prevents assigning agents without support authorization', async () => {
    const { assignSupportAgent, stubs, userRoleStub, agentRecord, supportCaseRecord } =
      await loadMessagingService({
      agentUserType: 'company',
      agentRoles: [],
    });

    await expect(assignSupportAgent(4455, agentRecord.id, { assignedBy: 12 })).rejects.toThrow(
      'Assigned agent is not authorized for support operations.',
    );
    expect(userRoleStub.findAll).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: agentRecord.id } }));
    expect(stubs.SupportCase.findOne).toHaveBeenCalledTimes(1);
    expect(stubs.SupportCase.findOne.mock.calls[0][0]).toEqual(
      expect.objectContaining({ where: { threadId: 4455 } }),
    );
    expect(stubs.Message.create).not.toHaveBeenCalled();
    expect(supportCaseRecord.save).not.toHaveBeenCalled();
    expect(stubs.SupportCase.findByPk).not.toHaveBeenCalled();
  });

  it('assigns authorized support agents and returns a sanitized case', async () => {
    const { assignSupportAgent, supportCaseRecord, stubs, userRoleStub, agentRecord } =
      await loadMessagingService({ agentUserType: 'company', agentRoles: ['support_agent'] });

    const result = await assignSupportAgent(4455, agentRecord.id, { assignedBy: 12 });

    expect(supportCaseRecord.assignedTo).toBe(agentRecord.id);
    expect(supportCaseRecord.status).toBe('in_progress');
    expect(supportCaseRecord.save).toHaveBeenCalledTimes(1);
    expect(stubs.SupportCase.findByPk).toHaveBeenCalledTimes(1);
    expect(stubs.Message.create).toHaveBeenCalledWith(
      expect.objectContaining({ threadId: 4455, messageType: 'system' }),
      expect.objectContaining({ transaction: expect.any(Object) }),
    );
    expect(stubs.MessageParticipant.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { threadId: 4455 } }),
    );
    expect(userRoleStub.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(
      expect.objectContaining({
        id: supportCaseRecord.id,
        assignedTo: agentRecord.id,
        metadata: expect.objectContaining({ customer: 'Acme Corp' }),
      }),
    );
    expect(result.metadata).not.toHaveProperty('_internalNote');
  });
});

describe('pageSettingsService', () => {
  beforeEach(() => {
    resetAll();
  });

  afterEach(() => {
    resetAll();
  });

  const loadService = async (overrides = {}) => {
    const models = await import('../../models/pageSetting.js');
    const loggerModule = await import('../../utils/logger.js');
    const { PageSetting, PAGE_LAYOUT_VARIANTS, PAGE_SETTING_STATUSES, PAGE_SETTING_VISIBILITIES } = models;

    const originalFns = {
      findAndCountAll: PageSetting.findAndCountAll,
      findOne: PageSetting.findOne,
      findByPk: PageSetting.findByPk,
      create: PageSetting.create,
    };

    PageSetting.findAndCountAll = overrides.findAndCountAll ?? jest.fn(async () => ({ rows: [], count: 0 }));
    PageSetting.findOne = overrides.findOne ?? jest.fn(async () => null);
    PageSetting.findByPk = overrides.findByPk ?? jest.fn(async () => null);
    PageSetting.create =
      overrides.create ??
      jest.fn(async (payload) => ({
        ...payload,
        id: 'page_setting_1',
        toPublicObject: () => ({ id: 'page_setting_1', slug: payload.slug, title: payload.name ?? null }),
      }));

    loggerModule.default.info = jest.fn();
    loggerModule.default.warn = jest.fn();
    loggerModule.default.error = jest.fn();

    const module = await import('../pageSettingsService.js');

    return {
      ...module,
      restore: () => {
        PageSetting.findAndCountAll = originalFns.findAndCountAll;
        PageSetting.findOne = originalFns.findOne;
        PageSetting.findByPk = originalFns.findByPk;
        PageSetting.create = originalFns.create;
      },
      PAGE_LAYOUT_VARIANTS,
      PAGE_SETTING_STATUSES,
      PAGE_SETTING_VISIBILITIES,
    };
  };

  it('lists settings with pagination metadata', async () => {
    const rows = [
      { toPublicObject: () => ({ id: 'ps_1', slug: 'studio' }) },
      { toPublicObject: () => ({ id: 'ps_2', slug: 'labs' }) },
    ];
    const { listPageSettings, restore } = await loadService({
      findAndCountAll: jest.fn(async ({ limit, offset }) => {
        expect(limit).toBe(25);
        expect(offset).toBe(0);
        return { rows, count: 2 };
      }),
    });

    try {
      const result = await listPageSettings({});
      expect(result.items).toHaveLength(2);
      expect(result.meta).toEqual({ total: 2, limit: 25, offset: 0 });
    } finally {
      restore();
    }
  });

  it('creates a new page setting with sanitised payloads', async () => {
    let capturedPayload = null;
    const { createPageSetting, restore } = await loadService({
      create: jest.fn(async (payload) => {
        capturedPayload = payload;
        return {
          ...payload,
          id: 'ps_new',
          toPublicObject: () => ({ id: 'ps_new', slug: payload.slug, navigation: payload.navigation }),
        };
      }),
    });

    try {
      const created = await createPageSetting(
        {
          name: 'Launch Stories',
          slug: 'Launch Stories!!',
          status: 'published',
          visibility: 'public',
          navigation: { header: [{ label: 'Home', url: ' https://gigvora.com ' }] },
          callToAction: { primary: { label: 'Join', url: '/join' } },
        },
        { actorId: 42 },
      );

      expect(capturedPayload.slug).toBe('launch-stories');
      expect(capturedPayload.roleAccess.allowedRoles).toContain('admin');
      expect(capturedPayload.navigation.header[0]).toEqual(
        expect.objectContaining({ label: 'Home', url: 'https://gigvora.com', external: false }),
      );
      expect(created.slug).toBe('launch-stories');
    } finally {
      restore();
    }
  });

  it('updates an existing page setting and preserves published timestamps', async () => {
    const stored = {
      id: 'ps_existing',
      slug: 'workspace',
      status: 'draft',
      lastPublishedAt: null,
      roleAccess: { allowedRoles: ['admin'] },
      toJSON: () => ({ slug: 'workspace', roleAccess: { allowedRoles: ['admin'] } }),
      set: jest.fn(function set(payload) {
        Object.assign(this, payload);
      }),
      save: jest.fn(async function save() {
        return this;
      }),
      toPublicObject: () => ({ id: 'ps_existing', slug: 'workspace', status: 'published' }),
    };

    const { updatePageSetting, restore } = await loadService({
      findByPk: jest.fn(async () => stored),
      findOne: jest.fn(async () => null),
    });

    try {
      const result = await updatePageSetting(
        'ps_existing',
        {
          status: 'published',
          navigation: { links: [{ label: 'Docs', url: 'https://docs.gigvora.com' }] },
        },
        { actorId: 8 },
      );

      expect(stored.set).toHaveBeenCalled();
      expect(stored.save).toHaveBeenCalled();
      expect(stored.updatedBy).toBe(8);
      expect(result).toEqual({ id: 'ps_existing', slug: 'workspace', status: 'published' });
    } finally {
      restore();
    }
  });
});

describe('healthService readiness reporting', () => {
  const modelsModuleUrl = new URL('../../models/index.js', import.meta.url);
  const runtimeHealthModuleUrl = new URL('../../lifecycle/runtimeHealth.js', import.meta.url);
  const dbLifecycleModuleUrl = new URL('../databaseLifecycleService.js', import.meta.url);
  const workerModuleUrl = new URL('../../lifecycle/workerManager.js', import.meta.url);
  const runtimeConfigModuleUrl = new URL('../../config/runtimeConfig.js', import.meta.url);

  beforeEach(() => {
    resetAll();
  });

  afterEach(() => {
    resetAll();
  });

  it('verifies connectivity once and surfaces cached readiness metadata', async () => {
    const authenticate = jest.fn(async () => {});
    const markDependencyHealthy = jest.fn();

    await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({
      sequelize: {
        authenticate,
        getDialect: () => 'postgres',
      },
    }));

    await jest.unstable_mockModule(runtimeHealthModuleUrl.pathname, () => ({
      buildHealthReport: jest.fn(() => ({
        status: 'ok',
        timestamp: new Date('2024-01-01T00:00:00Z').toISOString(),
        uptimeSeconds: 120,
        http: { status: 'running' },
      })),
      getHealthState: jest.fn(() => ({
        dependencies: {
          redis: { status: 'ok', updatedAt: new Date('2024-01-01T00:05:00Z').toISOString() },
        },
        workers: {
          aggregator: { status: 'ok', updatedAt: new Date('2024-01-01T00:04:00Z').toISOString() },
        },
        http: { status: 'running' },
      })),
      markDependencyHealthy,
      markDependencyUnavailable: jest.fn(),
    }));

    await jest.unstable_mockModule(dbLifecycleModuleUrl.pathname, () => ({
      getDatabasePoolSnapshot: jest.fn(() => ({ size: 12, idle: 3 })),
    }));

    await jest.unstable_mockModule(workerModuleUrl.pathname, () => ({
      collectWorkerTelemetry: jest.fn(async () => [
        {
          name: 'aggregator',
          metrics: { queueDepth: 2 },
          metadata: { uptimeMinutes: 45 },
          lastSampleAt: new Date('2024-01-01T00:04:00Z').toISOString(),
        },
      ]),
    }));

    await jest.unstable_mockModule(runtimeConfigModuleUrl.pathname, () => ({
      getRuntimeConfig: jest.fn(() => ({ serviceName: 'gigvora-platform', env: 'test' })),
    }));

    const healthService = await import('../healthService.js');

    await healthService.verifyDatabaseConnectivity();
    await healthService.verifyDatabaseConnectivity();

    expect(authenticate).toHaveBeenCalledTimes(1);
    expect(markDependencyHealthy).toHaveBeenCalledWith(
      'database',
      expect.objectContaining({ vendor: 'postgres', latencyMs: expect.any(Number), pool: expect.any(Object) }),
    );

    const report = await healthService.getReadinessReport({ page: 1, perPage: 5 });
    expect(report.database.status).toBe('ok');
    expect(report.dependencies.nodes[0]).toMatchObject({ name: 'redis', status: 'ok' });
    expect(report.workers.nodes[0]).toMatchObject({ name: 'aggregator', telemetry: { queueDepth: 2 } });
    expect(report.httpStatus).toBe(200);
  });
});

describe('notificationService queueing and listing', () => {
  const modelsModuleUrl = new URL('../../models/index.js', import.meta.url);
  const cacheModuleUrl = new URL('../../utils/cache.js', import.meta.url);
  const originalFormatter = Intl.DateTimeFormat;

  beforeEach(() => {
    resetAll();
  });

  afterEach(() => {
    resetAll();
    Intl.DateTimeFormat = originalFormatter;
  });

  it('respects quiet hours and paginates notification listings', async () => {
    const createdPayloads = [];
    const preferenceRecord = {
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      inAppEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '06:00',
      metadata: { timezone: 'UTC' },
    };

    await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({
      sequelize: {
        transaction: jest.fn(async (handler) => handler({})),
      },
      NotificationPreference: {
        findOne: jest.fn(async () => preferenceRecord),
      },
      Notification: {
        create: jest.fn(async (payload) => {
          createdPayloads.push(payload);
          return {
            toPublicObject: () => ({ id: 'notif_1', status: payload.status, title: payload.title }),
          };
        }),
        findAndCountAll: jest.fn(async () => ({
          rows: [
            { toPublicObject: () => ({ id: 'notif_1', status: 'pending', title: 'Maintenance window' }) },
            { toPublicObject: () => ({ id: 'notif_2', status: 'delivered', title: 'Daily digest' }) },
          ],
          count: 2,
        })),
      },
      NOTIFICATION_CATEGORIES: ['system', 'marketing'],
      NOTIFICATION_PRIORITIES: ['low', 'normal', 'high'],
      NOTIFICATION_STATUSES: ['pending', 'delivered', 'dismissed', 'read'],
      DIGEST_FREQUENCIES: ['immediate', 'daily'],
    }));

    await jest.unstable_mockModule(cacheModuleUrl.pathname, () => ({
      appCache: {
        remember: jest.fn((key, ttl, callback) => callback()),
        flushByPrefix: jest.fn(),
      },
      buildCacheKey: (...parts) => parts.join(':'),
    }));

    Intl.DateTimeFormat = jest.fn(() => ({ format: () => '23:30' }));

    const notificationService = await import('../notificationService.js');

    const queued = await notificationService.queueNotification({
      userId: 7001,
      category: 'system',
      priority: 'high',
      type: 'platform_maintenance',
      title: 'Maintenance starting soon',
      body: 'Platform access will be read-only during the deployment window.',
    });

    expect(createdPayloads[0]).toMatchObject({
      userId: 7001,
      status: 'pending',
      priority: 'high',
    });
    expect(queued).toEqual({ id: 'notif_1', status: 'pending', title: 'Maintenance starting soon' });

    const listed = await notificationService.listNotifications(7001, { status: 'unread' }, { page: 1, pageSize: 10 });
    expect(listed.data).toHaveLength(2);
    expect(listed.pagination).toEqual({ page: 1, pageSize: 10, total: 2, totalPages: 1 });
  });
});

describe('networkingService business cards', () => {
  const modelsModuleUrl = new URL('../../models/index.js', import.meta.url);
  const cacheModuleUrl = new URL('../../utils/cache.js', import.meta.url);

  beforeEach(() => {
    resetAll();
  });

  afterEach(() => {
    resetAll();
  });

  it('enforces workspace access and normalises card payloads', async () => {
    const createMock = jest.fn(async (payload) => ({
      ...payload,
      id: 'card_1',
      toPublicObject: () => ({
        id: 'card_1',
        title: payload.title,
        contactEmail: payload.contactEmail,
        status: payload.status,
      }),
    }));

    await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({
      sequelize: {
        transaction: jest.fn(async (handler) => handler({})),
      },
      NetworkingBusinessCard: {
        create: createMock,
        findByPk: jest.fn(),
      },
      ProviderWorkspace: {
        findByPk: jest.fn(),
      },
      NetworkingSession: { findByPk: jest.fn() },
      NetworkingSessionSignup: { count: jest.fn(), create: jest.fn(), findByPk: jest.fn(), findOne: jest.fn() },
      NetworkingSessionRotation: { findAll: jest.fn(), bulkCreate: jest.fn() },
      NETWORKING_SESSION_STATUSES: ['draft', 'scheduled', 'in_progress', 'completed', 'cancelled'],
      NETWORKING_SESSION_ACCESS_TYPES: ['public', 'invite_only', 'workspace'],
      NETWORKING_SESSION_VISIBILITIES: ['public', 'community', 'workspace'],
      NETWORKING_SESSION_SIGNUP_STATUSES: ['registered', 'waitlisted', 'checked_in', 'completed', 'removed', 'no_show'],
      NETWORKING_SESSION_SIGNUP_SOURCES: ['self', 'admin'],
      NETWORKING_BUSINESS_CARD_STATUSES: ['draft', 'published'],
      NETWORKING_ROTATION_STATUSES: ['scheduled', 'completed'],
    }));

    await jest.unstable_mockModule(cacheModuleUrl.pathname, () => ({
      appCache: {
        remember: jest.fn((key, ttl, callback) => callback()),
        flushByPrefix: jest.fn(),
      },
      buildCacheKey: (...parts) => parts.join(':'),
    }));

    const networkingService = await import('../networkingService.js');

    await expect(
      networkingService.createNetworkingBusinessCard(
        { title: 'Venture Catalyst', contactEmail: 'mentor@example.com', status: 'published' },
        { ownerId: 99, companyId: 501, authorizedWorkspaceIds: [404] },
      ),
    ).rejects.toThrow('You do not have permission to manage this networking workspace.');

    const created = await networkingService.createNetworkingBusinessCard(
      {
        title: 'Venture Catalyst',
        contactEmail: 'mentor@example.com',
        headline: 'Product mentor',
        tags: ['Product', 'Growth'],
        status: 'published',
      },
      { ownerId: 99, companyId: 501, authorizedWorkspaceIds: [501] },
    );

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contactEmail: 'mentor@example.com',
        tags: ['Product', 'Growth'],
        status: 'published',
      }),
    );
    expect(created).toEqual(
      expect.objectContaining({ id: 'card_1', contactEmail: 'mentor@example.com', status: 'published' }),
    );
  });
});

describe('pageService invites', () => {
  const modelsModuleUrl = new URL('../../models/index.js', import.meta.url);

  beforeEach(() => {
    resetAll();
  });

  afterEach(() => {
    resetAll();
    jest.restoreAllMocks();
  });

  it('creates page invites with normalised metadata and expiry', async () => {
    const now = new Date('2024-01-01T00:00:00Z').getTime();
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(now);

    const membershipMock = jest.fn(async (options) => {
      if (options?.where?.userId) {
        return { id: 7, role: 'owner' };
      }
      return null;
    });

    const createdInvite = {
      id: 'invite_1',
      pageId: 88,
      email: 'new@company.com',
      role: 'editor',
      status: 'pending',
      message: 'Join us',
      invitedById: 42,
      expiresAt: new Date(now + 14 * 24 * 60 * 60 * 1000),
      metadata: null,
      invitedBy: null,
      reload: jest.fn(async function reload() {
        this.invitedBy = {
          id: 42,
          firstName: 'Ada',
          lastName: 'Lovelace',
          email: 'ada@gigvora.com',
          userType: 'admin',
        };
        return this;
      }),
      get: jest.fn(() => ({
        id: 'invite_1',
        pageId: 88,
        email: 'new@company.com',
        role: 'editor',
        status: 'pending',
        message: 'Join us',
        invitedById: 42,
        invitedBy: {
          id: 42,
          firstName: 'Ada',
          lastName: 'Lovelace',
          email: 'ada@gigvora.com',
          userType: 'admin',
        },
        expiresAt: new Date(now + 14 * 24 * 60 * 60 * 1000),
        metadata: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      })),
    };

    const createInviteMock = jest.fn(async (payload) => {
      expect(payload.expiresAt.getTime()).toBe(now + 14 * 24 * 60 * 60 * 1000);
      Object.assign(createdInvite, payload, { id: 'invite_1' });
      return createdInvite;
    });

    await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({
      sequelize: {
        transaction: jest.fn(async (handler) => handler({})),
      },
      Page: { findByPk: jest.fn() },
      PageMembership: { findOne: membershipMock },
      PageInvite: {
        findOne: jest.fn(async () => null),
        create: createInviteMock,
      },
      PagePost: {},
      User: {
        findByPk: jest.fn(async () => ({
          id: 42,
          firstName: 'Ada',
          lastName: 'Lovelace',
          email: 'ada@gigvora.com',
          userType: 'admin',
        })),
      },
      sequelizeModule: { transaction: jest.fn() },
      PAGE_VISIBILITIES: ['public', 'private'],
      PAGE_MEMBER_ROLES: ['member', 'editor', 'admin', 'owner', 'moderator'],
      PAGE_MEMBER_STATUSES: ['pending', 'active', 'suspended', 'invited'],
      PAGE_POST_STATUSES: ['draft', 'published'],
      PAGE_POST_VISIBILITIES: ['public', 'followers'],
      COMMUNITY_INVITE_STATUSES: ['pending', 'accepted', 'declined'],
    }));

    const pageService = await import('../pageService.js');

    try {
      const invite = await pageService.createPageInvite(
        88,
        { email: 'NEW@Company.com', role: 'editor', message: 'Join us' },
        { actorId: 42 },
      );

      expect(createInviteMock).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@company.com',
          invitedById: 42,
          status: 'pending',
        }),
        expect.any(Object),
      );
      expect(invite).toMatchObject({
        email: 'new@company.com',
        role: 'editor',
        invitedBy: expect.objectContaining({ email: 'ada@gigvora.com' }),
      });
    } finally {
      nowSpy.mockRestore();
    }
  });
});
