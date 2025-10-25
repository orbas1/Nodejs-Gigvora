import { jest } from '@jest/globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsIndexPath = path.resolve(__dirname, '../../models/index.js');
await jest.unstable_mockModule(modelsIndexPath, () => ({}));

const projectModelsPath = path.resolve(__dirname, '../../models/projectGigManagementModels.js');

const Project = {
  findAll: jest.fn(),
  findAndCountAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  count: jest.fn(),
  sum: jest.fn(),
};

const ProjectAutoMatchFreelancer = {
  bulkCreate: jest.fn(),
  findOrCreate: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn(),
  findAll: jest.fn(),
};

const projectGigManagementSequelize = {
  transaction: jest.fn(async (handler) => handler({})),
  getDialect: jest.fn(() => 'postgres'),
};

await jest.unstable_mockModule(projectModelsPath, () => ({
  Project,
  ProjectAutoMatchFreelancer,
  PROJECT_STATUSES: ['planning', 'in_progress', 'completed'],
  PROJECT_AUTOMATCH_DECISION_STATUSES: ['pending', 'accepted', 'rejected'],
  projectGigManagementSequelize,
}));

const serviceModulePath = path.resolve(__dirname, '../agencyProjectManagementService.js');
const {
  listAgencyProjects,
  createAgencyProject,
  upsertProjectAutoMatchFreelancer,
  updateProjectAutoMatchFreelancer,
} = await import(serviceModulePath);

const { ValidationError, NotFoundError } = await import('../../utils/errors.js');

function toRecord(initialState) {
  const state = { ...initialState };
  const record = {
    get: jest.fn(({ plain } = {}) => (plain ? { ...state } : { ...state })),
    update: jest.fn(async (updates = {}) => {
      Object.assign(state, updates);
      return record;
    }),
    reload: jest.fn(async () => record),
    set: jest.fn((key, value) => {
      state[key] = value;
      return record;
    }),
  };
  return Object.assign(record, state);
}

function resetProjectMocks() {
  const openRecord = toRecord({
    id: 1,
    ownerId: 99,
    title: 'Launch Campaign',
    description: 'Build go-to-market plan for Q1 initiatives.',
    lifecycleState: 'open',
    autoMatchEnabled: true,
    autoMatchAcceptEnabled: true,
    autoMatchRejectEnabled: false,
    autoMatchFreelancers: [
      toRecord({
        id: 301,
        projectId: 1,
        freelancerId: 501,
        freelancerName: 'Dana Ray',
        status: 'pending',
        autoMatchEnabled: true,
        score: 91.2,
        updatedAt: new Date('2024-01-06T00:00:00.000Z'),
      }),
    ],
    metadata: { staffingAudit: [] },
    updatedAt: new Date('2024-01-10T00:00:00.000Z'),
  });

  const closedRecord = toRecord({
    id: 2,
    ownerId: 99,
    title: 'Client Rollout',
    description: 'Deliver final assets and handover.',
    lifecycleState: 'closed',
    autoMatchEnabled: false,
    autoMatchFreelancers: [],
    metadata: { staffingAudit: [] },
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  });

  Project.findAndCountAll.mockReset().mockResolvedValue({ rows: [openRecord, closedRecord], count: 2 });

  Project.findAll.mockReset().mockImplementation(async (options = {}) => {
    if (options.attributes?.includes('metadata')) {
      return [
        toRecord({
          id: 1,
          title: 'Launch Campaign',
          metadata: {
            staffingAudit: [
              {
                id: 'audit-1',
                action: 'project_created',
                actorId: 42,
                occurredAt: '2024-01-05T00:00:00.000Z',
                metadata: { title: 'Launch Campaign' },
              },
            ],
          },
          updatedAt: new Date('2024-01-05T00:00:00.000Z'),
        }),
      ];
    }
    return [
      toRecord({
        id: 3,
        title: 'Stale Brief',
        updatedAt: new Date('2023-12-01T00:00:00.000Z'),
      }),
    ];
  });

  Project.findByPk.mockReset().mockImplementation(async (id) => {
    if (id === 55) {
      return toRecord({
        id: 55,
        ownerId: 99,
        title: 'Social Campaign',
        metadata: { staffingAudit: [] },
        autoMatchFreelancers: [],
      });
    }
    return null;
  });

  Project.create.mockReset().mockImplementation(async (data) => {
    const record = toRecord({
      id: 90,
      ...data,
      autoMatchEnabled: data.autoMatchEnabled ?? false,
      autoMatchAcceptEnabled: data.autoMatchAcceptEnabled ?? false,
      autoMatchRejectEnabled: data.autoMatchRejectEnabled ?? false,
      autoMatchFreelancers: [],
    });
    return record;
  });

  Project.count
    .mockReset()
    .mockResolvedValueOnce(2)
    .mockResolvedValueOnce(1)
    .mockResolvedValueOnce(1)
    .mockResolvedValueOnce(1)
    .mockResolvedValue(0);

  Project.sum.mockReset().mockResolvedValueOnce('12000').mockResolvedValueOnce('4800');

  ProjectAutoMatchFreelancer.bulkCreate.mockReset().mockResolvedValue([]);

  ProjectAutoMatchFreelancer.findOrCreate.mockReset().mockResolvedValue([
    toRecord({
      id: 707,
      projectId: 55,
      freelancerId: 7,
      freelancerName: 'Ruth Miles',
      freelancerRole: 'Producer',
      status: 'pending',
      autoMatchEnabled: true,
      score: 82,
      notes: null,
      metadata: null,
    }),
    true,
  ]);

  ProjectAutoMatchFreelancer.findOne.mockReset().mockImplementation(async ({ where }) => {
    if (where.id === 707 && where.projectId === 55) {
      return toRecord({
        id: 707,
        projectId: 55,
        freelancerId: 7,
        freelancerName: 'Ruth Miles',
        freelancerRole: 'Producer',
        status: 'pending',
        autoMatchEnabled: true,
        score: 82,
        notes: null,
        metadata: null,
      });
    }
    return null;
  });

  ProjectAutoMatchFreelancer.count
    .mockReset()
    .mockResolvedValueOnce(3)
    .mockResolvedValueOnce(5)
    .mockResolvedValueOnce(2)
    .mockResolvedValue(0);

  ProjectAutoMatchFreelancer.findAll.mockReset().mockResolvedValue([
    {
      get: ({ plain } = {}) =>
        plain
          ? {
              id: 401,
              projectId: 1,
              freelancerId: 888,
              freelancerName: 'Casey Duran',
              status: 'pending',
              autoMatchEnabled: true,
              score: 89,
              updatedAt: new Date('2024-01-06T00:00:00.000Z'),
              Project: { title: 'Launch Campaign' },
            }
          : null,
    },
  ]);

  projectGigManagementSequelize.transaction.mockClear();
}

beforeEach(() => {
  resetProjectMocks();
});

describe('agencyProjectManagementService', () => {
  test('listAgencyProjects aggregates metrics and returns paginated results', async () => {
    const result = await listAgencyProjects(99, { filters: { lifecycleState: 'open' }, pagination: { page: 1, pageSize: 10 } });

    expect(Project.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ ownerId: 99, lifecycleState: 'open' }),
        limit: 10,
        offset: 0,
      }),
    );

    expect(result.summary).toEqual({ totalProjects: 2, openCount: 1, closedCount: 1, autoMatchEnabledCount: 1 });
    expect(result.portfolioHealth.budgetAllocated).toBe(12000);
    expect(result.autoMatchQueue).toHaveLength(1);
    expect(result.staffingAudit[0]).toMatchObject({ action: 'project_created', actorId: 42 });
    expect(result.pagination).toEqual({ page: 1, pageSize: 10, totalItems: 2, totalPages: 1 });
  });

  test('createAgencyProject validates payload, persists data, and seeds freelancers', async () => {
    const payload = {
      title: '  Global Creative Retainer  ',
      description: 'Deliver multi-market assets and campaign optimisation.',
      category: ' Marketing Operations ',
      skills: ['brand strategy', 'analytics'],
      durationWeeks: 8,
      status: 'in_progress',
      lifecycleState: 'open',
      startDate: '2024-02-01T00:00:00.000Z',
      budgetCurrency: 'gbp',
      budgetAllocated: 15000,
      autoMatch: {
        enabled: true,
        budgetMin: 5000,
        freelancers: [
          {
            freelancerId: 77,
            freelancerName: '  Jamie Fox  ',
            freelancerRole: 'Art Director',
            score: 88,
            status: 'accepted',
            metadata: { invitedBy: 9 },
          },
        ],
      },
    };

    const project = await createAgencyProject(99, payload, { actorId: 21 });

    expect(Project.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Global Creative Retainer',
        category: 'Marketing Operations',
        durationWeeks: 8,
        budgetCurrency: 'GBP',
        budgetAllocated: 15000,
        budgetSpent: 0,
      }),
      expect.any(Object),
    );

    expect(ProjectAutoMatchFreelancer.bulkCreate).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          freelancerId: 77,
          freelancerName: 'Jamie Fox',
          freelancerRole: 'Art Director',
          score: 88,
          status: 'accepted',
          autoMatchEnabled: true,
          metadata: { invitedBy: 9 },
        }),
      ],
      expect.any(Object),
    );

    expect(project.autoMatchFreelancers).toHaveLength(1);
    expect(project.autoMatchFreelancers[0]).toMatchObject({ freelancerId: 77, freelancerName: 'Jamie Fox' });
  });

  test('createAgencyProject throws ValidationError when required fields are missing', async () => {
    await expect(createAgencyProject(99, { title: 'ab', description: 'short' })).rejects.toBeInstanceOf(ValidationError);
  });

  test('upsertProjectAutoMatchFreelancer normalises payload and appends audit entry', async () => {
    const result = await upsertProjectAutoMatchFreelancer(
      99,
      55,
      {
        freelancerId: 7,
        freelancerName: 'Ruth Miles',
        freelancerRole: 'Producer',
        score: 95,
        status: 'accepted',
        metadata: { sourcedBy: 'auto-match' },
      },
      { actorId: 33 },
    );

    expect(ProjectAutoMatchFreelancer.findOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId: 55, freelancerId: 7 },
        defaults: expect.objectContaining({ score: 95, status: 'accepted' }),
      }),
    );

    expect(result).toMatchObject({ freelancerId: 7, status: 'accepted' });
  });

  test('updateProjectAutoMatchFreelancer applies sanitised updates', async () => {
    const result = await updateProjectAutoMatchFreelancer(
      99,
      55,
      707,
      { autoMatchEnabled: false, status: 'rejected', notes: 'Not available' },
      { actorId: 44 },
    );

    expect(result).toMatchObject({ status: 'rejected', autoMatchEnabled: false, notes: 'Not available' });
  });

  test('updateProjectAutoMatchFreelancer throws when entry missing', async () => {
    await expect(
      updateProjectAutoMatchFreelancer(99, 55, 999, { status: 'accepted' }, { actorId: 1 }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
