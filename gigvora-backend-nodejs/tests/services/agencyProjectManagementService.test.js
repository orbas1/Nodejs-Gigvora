import { jest } from '@jest/globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsIndexPath = path.resolve(__dirname, '../../src/models/index.js');
await jest.unstable_mockModule(modelsIndexPath, () => ({}));

const projectModelsPath = path.resolve(__dirname, '../../src/models/projectGigManagementModels.js');

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
  findByPk: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn(),
  findAll: jest.fn(),
};

const projectGigManagementSequelize = {
  transaction: jest.fn(async (handler) => handler({})),
};

await jest.unstable_mockModule(projectModelsPath, () => ({
  Project,
  ProjectAutoMatchFreelancer,
  PROJECT_STATUSES: ['planning', 'active', 'completed', 'cancelled'],
  PROJECT_AUTOMATCH_DECISION_STATUSES: ['pending', 'accepted', 'rejected'],
  projectGigManagementSequelize,
}));

const serviceModulePath = path.resolve(__dirname, '../../src/services/agencyProjectManagementService.js');
const {
  listAgencyProjects,
  createAgencyProject,
  updateAgencyProject,
  updateProjectAutoMatchSettings,
  upsertProjectAutoMatchFreelancer,
  updateProjectAutoMatchFreelancer,
} = await import(serviceModulePath);

const { AuthorizationError, NotFoundError } = await import('../../src/utils/errors.js');

function toRecord(plain) {
  const state = { ...plain };
  const record = {
    get: jest.fn(({ plain: toPlain } = {}) => (toPlain ? { ...state } : { ...state })),
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
    description: 'Build go-to-market plan',
    lifecycleState: 'open',
    autoMatchEnabled: true,
    autoMatchAcceptEnabled: true,
    autoMatchRejectEnabled: false,
    autoMatchFreelancers: [
      toRecord({ id: 301, projectId: 1, status: 'pending', autoMatchEnabled: true, score: 0.76 }),
      toRecord({ id: 302, projectId: 1, status: 'accepted', autoMatchEnabled: true, score: 0.92 }),
    ],
    metadata: { staffingAudit: [] },
    updatedAt: new Date('2024-01-10T00:00:00.000Z'),
  });
  const closedRecord = toRecord({
    id: 2,
    ownerId: 99,
    title: 'Closeout',
    description: 'Complete handover',
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
        title: 'Stale Project',
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
        autoMatchFreelancers: [],
        metadata: { staffingAudit: [] },
      });
    }
    return null;
  });

  const createdState = toRecord({
    id: 90,
    ownerId: 99,
    title: 'Discovery sprint',
    autoMatchEnabled: false,
    autoMatchFreelancers: [],
    metadata: { staffingAudit: [] },
  });
  Project.create.mockReset().mockResolvedValue(createdState);

  Project.count
    .mockReset()
    .mockResolvedValueOnce(2)
    .mockResolvedValueOnce(1)
    .mockResolvedValueOnce(1)
    .mockResolvedValueOnce(1)
    .mockResolvedValue(0);

  Project.sum.mockReset().mockResolvedValueOnce('10000').mockResolvedValueOnce('4500');

  ProjectAutoMatchFreelancer.bulkCreate.mockReset().mockResolvedValue([]);
  ProjectAutoMatchFreelancer.findOrCreate.mockReset().mockResolvedValue([
    toRecord({
      id: 707,
      projectId: 55,
      freelancerId: 7,
      freelancerName: 'Ruth Miles',
      status: 'pending',
      autoMatchEnabled: true,
      score: 0.82,
    }),
    true,
  ]);
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
              freelancerId: 501,
              freelancerName: 'Dana Ray',
              status: 'pending',
              autoMatchEnabled: true,
              score: 0.91,
              updatedAt: new Date('2024-01-06T00:00:00.000Z'),
              Project: { title: 'Launch Campaign' },
            }
          : null,
    },
  ]);
  ProjectAutoMatchFreelancer.findByPk.mockReset().mockImplementation(async (id) => {
    if (id === 707) {
      return toRecord({
        id: 707,
        projectId: 55,
        freelancerId: 7,
        freelancerName: 'Ruth Miles',
        status: 'pending',
        autoMatchEnabled: true,
        score: 0.82,
      });
    }
    return null;
  });
  ProjectAutoMatchFreelancer.findOne.mockReset().mockImplementation(async ({ where }) => {
    if (where?.id === 707 && where.projectId === 55) {
      return toRecord({
        id: 707,
        projectId: 55,
        freelancerId: 7,
        freelancerName: 'Ruth Miles',
        status: 'pending',
        autoMatchEnabled: true,
        score: 0.82,
      });
    }
    return null;
  });

  projectGigManagementSequelize.transaction.mockClear().mockImplementation(async (handler) => handler({}));
}

describe('agencyProjectManagementService', () => {
  beforeEach(() => {
    resetProjectMocks();
  });

  it('summarises projects into open, closed, and auto-match queue', async () => {
    const overview = await listAgencyProjects(99);

    expect(Project.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ ownerId: 99 }),
        limit: expect.any(Number),
        offset: expect.any(Number),
      }),
    );
    expect(overview.summary).toEqual({ totalProjects: 2, openCount: 1, closedCount: 1, autoMatchEnabledCount: 1 });
    expect(overview.autoMatchInsights).toEqual({ pendingDecisions: 3, acceptedDecisions: 5, rejectedDecisions: 2 });
    expect(overview.autoMatchQueue).toEqual([
      expect.objectContaining({ projectId: 1, freelancerName: 'Dana Ray', status: 'pending' }),
    ]);
    expect(overview.pagination).toEqual({ page: 1, pageSize: expect.any(Number), totalItems: 2, totalPages: 1 });
    expect(overview.portfolioHealth).toMatchObject({
      budgetAllocated: 10000,
      budgetSpent: 4500,
      staleProjects: [expect.objectContaining({ projectTitle: 'Stale Project' })],
    });
    expect(overview.staffingAudit[0]).toMatchObject({ action: 'project_created', projectTitle: 'Launch Campaign' });
  });

  it('creates a project with sanitized defaults and auto-match freelances', async () => {
    const result = await createAgencyProject(99, {
      title: 'Discovery sprint',
      description: 'Understand users',
      autoMatch: {
        enabled: true,
        budgetMin: '1000',
        freelancers: [
          { freelancerId: 10, freelancerName: 'Alex Doe', status: 'accepted', score: '0.91' },
          { freelancerId: 11, freelancerName: 'Jordan Poe', score: 0.77 },
        ],
      },
    }, { actorId: 501 });

    expect(projectGigManagementSequelize.transaction).toHaveBeenCalled();
    expect(Project.create).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 99, title: 'Discovery sprint' }), expect.any(Object));
    expect(ProjectAutoMatchFreelancer.bulkCreate).toHaveBeenCalled();
    expect(result.autoMatch.enabled).toBe(true);
    const metadata = Project.create.mock.calls[0][0].metadata;
    expect(metadata.staffingAudit).toEqual([
      expect.objectContaining({ action: 'project_created', actorId: 501 }),
    ]);
  });

  it('updates an existing project respecting owner permissions', async () => {
    const updated = await updateAgencyProject(99, 55, { title: 'Social amplification', autoMatch: { enabled: true } });

    expect(Project.findByPk).toHaveBeenCalledWith(55, expect.any(Object));
    expect(updated.title).toBe('Social amplification');
  });

  it('prevents updating projects owned by someone else', async () => {
    Project.findByPk.mockResolvedValueOnce(toRecord({ id: 55, ownerId: 44, autoMatchFreelancers: [] }));
    await expect(updateAgencyProject(99, 55, { title: 'Oops' })).rejects.toBeInstanceOf(AuthorizationError);
  });

  it('updates auto match settings via helper', async () => {
    const updated = await updateProjectAutoMatchSettings(99, 55, { enabled: false, durationWeeksMin: 4 });
    expect(updated.autoMatch.enabled).toBe(false);
  });

  it('records staffing audit when updating auto match settings with actor context', async () => {
    const projectRecord = toRecord({
      id: 777,
      ownerId: 99,
      title: 'Campaign',
      autoMatchFreelancers: [],
      metadata: { staffingAudit: [] },
    });
    Project.findByPk.mockResolvedValueOnce(projectRecord);

    await updateProjectAutoMatchSettings(99, 777, { enabled: true, budgetMax: 5000 }, { actorId: 88 });

    expect(projectRecord.set).toHaveBeenCalledWith(
      'metadata',
      expect.objectContaining({
        staffingAudit: expect.arrayContaining([
          expect.objectContaining({ action: 'auto_match_settings_updated', actorId: 88 }),
        ]),
      }),
    );
  });

  it('upserts auto match freelancer entries', async () => {
    const entry = await upsertProjectAutoMatchFreelancer(99, 55, {
      freelancerId: 7,
      freelancerName: 'Ruth Miles',
      status: 'accepted',
      score: 0.95,
    });

    expect(ProjectAutoMatchFreelancer.findOrCreate).toHaveBeenCalled();
    expect(entry).toMatchObject({ freelancerId: 7, status: 'accepted', score: 0.95 });
  });

  it('updates an existing auto match freelancer entry', async () => {
    const entry = await updateProjectAutoMatchFreelancer(99, 55, 707, { status: 'rejected', autoMatchEnabled: false });

    expect(ProjectAutoMatchFreelancer.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 707, projectId: 55 } }));
    expect(entry.status).toBe('rejected');
    expect(entry.autoMatchEnabled).toBe(false);
  });

  it('throws when freelancer entry missing', async () => {
    await expect(updateProjectAutoMatchFreelancer(99, 55, 900, {})).rejects.toBeInstanceOf(NotFoundError);
  });
});

