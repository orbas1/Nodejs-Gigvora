import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fileURLToPath } from 'node:url';

const ORIGINAL_ENV = { ...process.env };

function resetEnv() {
  process.env = { ...ORIGINAL_ENV };
}

describe('gigService blueprint workflows', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    resetEnv();
    process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
    process.env.ADMIN_MANAGEMENT_MINIMAL_BOOTSTRAP = 'true';
  });

  it('creates and publishes a gig blueprint with sanitized assets', async () => {
    const createdPackages = [];
    const createdAddOns = [];
    const createdSlots = [];
    const usedSlugs = new Set(['launchpad-blueprint']);
    let gigRecord;

    const buildGigRecord = (payload) => ({
      ...payload,
      toPublicObject: jest.fn(() => ({
        id: gigRecord.id,
        ownerId: gigRecord.ownerId,
        title: gigRecord.title,
        slug: gigRecord.slug,
        status: gigRecord.status,
        visibility: gigRecord.visibility,
        heroAccent: gigRecord.heroAccent,
        publishedAt: gigRecord.publishedAt ?? null,
        packages: createdPackages.map((pkg) => ({ ...pkg })),
        addOns: createdAddOns.map((addon) => ({ ...addon })),
        availabilitySlots: createdSlots.map((slot) => ({ ...slot })),
      })),
      reload: jest.fn(async () => undefined),
      update: jest.fn(async (updates) => {
        Object.assign(gigRecord, updates);
        return gigRecord;
      }),
    });

    const modelsModule = fileURLToPath(new URL('../../models/index.js', import.meta.url));
    jest.unstable_mockModule(modelsModule, () => ({
      sequelize: {
        transaction: jest.fn(async (callback) => callback({})),
      },
      Gig: {
        findOne: jest.fn(async ({ where }) => {
          const slug = where?.slug;
          return slug && usedSlugs.has(slug) ? { id: 'existing-slug' } : null;
        }),
        create: jest.fn(async (payload) => {
          usedSlugs.add(payload.slug);
          gigRecord = buildGigRecord({ ...payload, id: 501 });
          return gigRecord;
        }),
        findByPk: jest.fn(async (id) => (gigRecord && gigRecord.id === id ? gigRecord : null)),
        findAll: jest.fn(async () => []),
      },
      GigPackage: {
        bulkCreate: jest.fn(async (packages) => {
          createdPackages.splice(0, createdPackages.length, ...packages.map((pkg) => ({ ...pkg })));
          return createdPackages;
        }),
        destroy: jest.fn(async () => undefined),
      },
      GigAddOn: {
        bulkCreate: jest.fn(async (addons) => {
          createdAddOns.splice(0, createdAddOns.length, ...addons.map((addon) => ({ ...addon })));
          return createdAddOns;
        }),
        destroy: jest.fn(async () => undefined),
      },
      GigAvailabilitySlot: {
        bulkCreate: jest.fn(async (slots) => {
          createdSlots.splice(0, createdSlots.length, ...slots.map((slot) => ({ ...slot })));
          return createdSlots;
        }),
        destroy: jest.fn(async () => undefined),
      },
      GIG_STATUSES: ['draft', 'published', 'archived'],
      GIG_VISIBILITY_OPTIONS: ['private', 'public', 'unlisted'],
    }));

    const { createGigBlueprint, publishGig } = await import('../gigService.js');

    const gigPayload = {
      ownerId: 42,
      title: 'Launchpad Blueprint',
      description: 'Shape the ultimate launch blueprint.',
      tagline: 'Blueprint your next big launch',
      heroAccent: '1e40af',
      status: 'DRAFT',
      visibility: 'PUBLIC',
      packages: [
        {
          name: 'Discovery Sprint',
          priceAmount: '199.999',
          priceCurrency: 'usd',
          deliveryDays: '5',
          revisionLimit: 2,
          highlights: 'Define scope\nRefine positioning',
        },
      ],
      addOns: [
        {
          name: 'Extended Support',
          priceAmount: 49,
          description: 'Two additional review cycles.',
          deliveryDays: '2',
        },
      ],
      availability: {
        slots: [
          {
            slotDate: '2024-05-01',
            startTime: '9:00',
            endTime: '11:30',
            capacity: 3,
          },
        ],
      },
    };

    const result = await createGigBlueprint(gigPayload, { actorId: 42 });

    expect(result.slug).toBe('launchpad-blueprint-2');
    expect(result.heroAccent).toBe('#1e40af');
    expect(result.packages).toHaveLength(1);
    expect(result.packages[0]).toMatchObject({
      packageKey: 'discovery-sprint',
      priceAmount: 200,
      priceCurrency: 'USD',
      highlights: ['Define scope', 'Refine positioning'],
    });
    expect(result.addOns[0]).toMatchObject({ name: 'Extended Support', priceAmount: 49 });
    expect(result.availabilitySlots[0]).toMatchObject({
      startTime: '09:00',
      endTime: '11:30',
      capacity: 3,
    });

    const published = await publishGig(result.id, { actorId: 42, visibility: 'unlisted' });
    expect(published.status).toBe('published');
    expect(published.visibility).toBe('unlisted');
    expect(published.publishedAt).toBeInstanceOf(Date);
  });
});

describe('headhunterService dashboard intelligence', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    resetEnv();
    process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
  });

  it('summarises workspace activity, wellbeing, and outreach signals', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-05-01T12:00:00Z'));

    const workspace = { id: 'ws_100', name: 'Global Talent Pod', slug: 'global-talent', timezone: 'UTC' };
    const members = [
      { id: 'member-1', status: 'active' },
      { id: 'member-2', status: 'active' },
      { id: 'member-3', status: 'active' },
    ];

    const makeProfile = (profile) => ({
      ...profile,
      get: jest.fn(() => ({ ...profile })),
    });

    const makeSupportArticle = (article) => ({ ...article });

    const now = new Date('2024-05-01T12:00:00.000Z');

    const modelsModule = fileURLToPath(new URL('../../models/index.js', import.meta.url));
    jest.unstable_mockModule(modelsModule, () => ({
      Application: {
        findAll: jest.fn(async () => [
          {
            id: 'app-1',
            applicantId: 9001,
            status: 'interview',
            stage: 'interview',
            submittedAt: new Date('2024-04-10T00:00:00Z'),
            decisionAt: new Date('2024-04-18T00:00:00Z'),
            metadata: {
              headhunterWorkspaceId: 'ws_100',
              lastTouchpointAt: new Date('2024-04-25T00:00:00Z'),
              notes: ['Invite to panel'],
            },
          },
          {
            id: 'app-2',
            applicantId: 9002,
            status: 'submitted',
            submittedAt: new Date('2024-04-05T00:00:00Z'),
            metadata: {},
          },
        ]),
      },
      MessageThread: {
        findAll: jest.fn(async () => [
          {
            id: 'thread-1',
            createdAt: new Date('2024-04-20T10:00:00Z'),
            metadata: { headhunterWorkspaceId: 'ws_100' },
          },
          {
            id: 'thread-2',
            createdAt: new Date('2024-04-18T10:00:00Z'),
            metadata: {},
          },
        ]),
      },
      Message: {
        findAll: jest.fn(async () => [
          { threadId: 'thread-1', body: 'Outreach sent', metadata: { direction: 'outbound' } },
          { threadId: 'thread-1', body: 'Candidate reply', metadata: { direction: 'inbound' } },
          { threadId: 'thread-2', body: 'Follow-up message', metadata: { direction: 'outbound' } },
        ]),
      },
      ProviderWorkspace: {
        findByPk: jest.fn(async (id) => (id === workspace.id ? workspace : null)),
      },
      ProviderWorkspaceMember: {
        findAll: jest.fn(async () => members),
      },
      ProviderContactNote: {
        findAll: jest.fn(async () => [
          { id: 'note-1', subjectUserId: 'client-1', authorId: 'hunter-1', note: 'Shared pipeline update', createdAt: now },
          { id: 'note-2', subjectUserId: 'client-2', authorId: 'hunter-2', note: 'Scheduled hiring sync', createdAt: new Date(now.getTime() - 86400000) },
        ]),
      },
      Profile: {
        findAll: jest.fn(async () => [
          makeProfile({ userId: 9001, name: 'Candidate One', availabilityStatus: 'active', trustScore: 92 }),
          makeProfile({ userId: 9002, name: 'Candidate Two', availabilityStatus: 'open', trustScore: 88 }),
        ]),
      },
      SupportKnowledgeArticle: {
        findAll: jest.fn(async () => [
          makeSupportArticle({
            id: 'kb-1',
            slug: 'closing-offers',
            title: 'Closing enterprise offers',
            summary: 'Framework for late-stage hiring.',
            tags: ['workspace:global-talent'],
            lastReviewedAt: new Date('2024-04-28T00:00:00Z'),
          }),
          makeSupportArticle({
            id: 'kb-2',
            slug: 'wellbeing-check-ins',
            title: 'Wellbeing check-ins',
            summary: 'Guide for weekly wellbeing reviews.',
            tags: ['global'],
            lastReviewedAt: new Date('2024-04-26T00:00:00Z'),
          }),
        ]),
      },
      Op: { in: Symbol.for('in'), or: Symbol.for('or'), like: Symbol.for('like') },
    }));

    const extrasModule = fileURLToPath(new URL('../../models/headhunterExtras.js', import.meta.url));
    jest.unstable_mockModule(extrasModule, () => ({
      ProviderAvailabilityWindow: {
        findAll: jest.fn(async () => [
          {
            id: 'avail-1',
            memberId: 'member-1',
            dayOfWeek: 'monday',
            startTimeUtc: '09:00',
            endTimeUtc: '12:00',
            availabilityType: 'interview',
            broadcastChannels: ['email'],
          },
        ]),
      },
      ProviderWellbeingLog: {
        findAll: jest.fn(async () => [
          {
            id: 'log-1',
            recordedAt: new Date('2024-04-24T00:00:00Z'),
            workloadScore: 6,
            wellbeingScore: 7,
            stressScore: 6,
            energyScore: 7,
            metadata: { note: 'Pacing towards offers' },
          },
        ]),
      },
    }));

    const { getDashboardSnapshot } = await import('../headhunterService.js');

    let snapshot;
    try {
      snapshot = await getDashboardSnapshot({ workspaceId: workspace.id, lookbackDays: 45 });
    } finally {
      jest.useRealTimers();
    }

    expect(snapshot.workspaceSummary).toEqual(
      expect.objectContaining({ id: workspace.id, memberCount: members.length, slug: workspace.slug }),
    );
    expect(snapshot.pipelineSummary.totals.applications).toBeGreaterThan(0);
    expect(snapshot.outreachPerformance).toEqual(
      expect.objectContaining({ campaignCount: 2, totalMessages: 3, responseRate: expect.any(Number) }),
    );
    expect(snapshot.wellbeing.metrics.burnoutRisk).toBe('elevated');
    expect(snapshot.knowledgeBase.totalArticles).toBe(2);
    expect(snapshot.insights.metrics.pipelineValue.value).toBeGreaterThan(0);
    expect(snapshot.meta.hasWorkspaceScopedData).toBe(true);
  });
});

describe('mentorshipService lifecycle management', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    resetEnv();
  });

  it('tracks mentor profile, availability, clients, and bookings cohesively', async () => {
    const {
      __resetMentorshipState,
      submitMentorProfile,
      updateMentorAvailability,
      updateMentorPackages,
      createMentorClient,
      updateMentorClient,
      createMentorBooking,
      updateMentorBooking,
      getMentorDashboard,
    } = await import('../mentorshipService.js');

    __resetMentorshipState();

    submitMentorProfile(101, {
      name: 'Ava Mentor',
      email: 'ava@gigvora.test',
      timezone: 'Europe/London',
      headline: 'Product mentor',
      bio: 'Helping product teams ship faster.',
    });

    updateMentorAvailability(101, [
      {
        day: 'Monday',
        start: '2024-05-06T09:00:00Z',
        end: '2024-05-06T12:00:00Z',
        capacity: 4,
        focus: 'Strategy',
      },
    ]);

    updateMentorPackages(101, [
      {
        name: 'Accelerator',
        sessions: 6,
        price: 750,
        durationMinutes: 90,
        description: 'Deep dive with follow-up plan.',
        outcome: 'Roadmap clarity',
      },
      {
        name: 'Stand-up sync',
        sessions: 4,
        price: 250,
        durationMinutes: 45,
        description: 'Weekly accountability call.',
        outcome: 'Momentum check-ins',
      },
    ]);

    const client = createMentorClient(101, {
      name: 'Nimbus Labs',
      status: 'Active',
      tier: 'Growth',
      contacts: [{ name: 'Product Lead', email: 'lead@nimbus.test' }],
    });

    updateMentorClient(101, client.id, { notes: 'Preparing for fundraising sprint.' });

    const booking = createMentorBooking(101, {
      clientId: client.id,
      mentee: 'Nimbus Founder',
      title: 'Quarterly strategy review',
      scheduledAt: '2024-05-02T09:30:00Z',
      durationMinutes: 90,
      sessionType: 'Workshop',
    });

    updateMentorBooking(101, booking.id, {
      status: 'Completed',
      feedbackScore: 4.8,
      notes: 'Outlined hiring experiments.',
    });

    const dashboard = getMentorDashboard(101, { lookbackDays: 30 });

    expect(dashboard.profile.name).toBe('Ava Mentor');
    expect(dashboard.availability[0]).toEqual(
      expect.objectContaining({ day: 'Monday', start: '2024-05-06T09:00:00.000Z', capacity: 4 }),
    );
    expect(dashboard.packages[0].name).toBe('Accelerator');
    expect(dashboard.clients).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Nimbus Labs', notes: 'Preparing for fundraising sprint.' })]),
    );
    expect(dashboard.bookings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ mentee: 'Nimbus Founder', status: 'Completed', notes: 'Outlined hiring experiments.' }),
      ]),
    );
    expect(dashboard.stats).toMatchObject({
      activeMentees: expect.any(Number),
      upcomingSessions: expect.any(Number),
      monthlyRevenue: expect.any(Number),
    });
  });
});
