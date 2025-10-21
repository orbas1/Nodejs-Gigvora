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
