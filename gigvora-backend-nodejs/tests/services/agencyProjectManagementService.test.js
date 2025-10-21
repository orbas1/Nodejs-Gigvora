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
  findByPk: jest.fn(),
  create: jest.fn(),
};
const ProjectAutoMatchFreelancer = {
  bulkCreate: jest.fn(),
  findOrCreate: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
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
  return {
    ...state,
    get: jest.fn(({ plain: toPlain } = {}) => (toPlain ? { ...state } : { ...state })),
    update: jest.fn(async (updates = {}) => Object.assign(state, updates)),
    reload: jest.fn(async () => ({ ...state, get: () => ({ ...state }) })),
  };
}

function resetProjectMocks() {
  Project.findAll.mockReset().mockResolvedValue([
    {
      get: ({ plain } = {}) =>
        plain
          ? {
              id: 1,
              ownerId: 99,
              title: 'Launch Campaign',
              description: 'Build go-to-market plan',
              lifecycleState: 'open',
              autoMatchEnabled: true,
              autoMatchAcceptEnabled: true,
              autoMatchRejectEnabled: false,
              autoMatchFreelancers: [
                { get: () => ({ id: 301, status: 'pending', autoMatchEnabled: true, score: 0.76 }) },
                { get: () => ({ id: 302, status: 'accepted', autoMatchEnabled: true, score: 0.92 }) },
              ],
            }
          : null,
    },
    {
      get: ({ plain } = {}) =>
        plain
          ? {
              id: 2,
              ownerId: 99,
              title: 'Closeout',
              description: 'Complete handover',
              lifecycleState: 'closed',
              autoMatchEnabled: false,
              autoMatchFreelancers: [],
            }
          : null,
    },
  ]);

  Project.findByPk.mockReset().mockImplementation(async (id) => {
    if (id === 55) {
      return toRecord({
        id: 55,
        ownerId: 99,
        title: 'Social Campaign',
        autoMatchFreelancers: [],
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
  });
  Project.create.mockReset().mockResolvedValue(createdState);

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

    expect(Project.findAll).toHaveBeenCalledWith(expect.objectContaining({ where: { ownerId: 99 } }));
    expect(overview.summary).toEqual({ totalProjects: 2, openCount: 1, closedCount: 1, autoMatchEnabledCount: 1 });
    expect(overview.autoMatchQueue).toEqual([
      expect.objectContaining({ projectId: 1, pending: [expect.objectContaining({ status: 'pending' })] }),
    ]);
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
    });

    expect(projectGigManagementSequelize.transaction).toHaveBeenCalled();
    expect(Project.create).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 99, title: 'Discovery sprint' }), expect.any(Object));
    expect(ProjectAutoMatchFreelancer.bulkCreate).toHaveBeenCalled();
    expect(result.autoMatch.enabled).toBe(true);
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

