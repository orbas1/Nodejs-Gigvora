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
