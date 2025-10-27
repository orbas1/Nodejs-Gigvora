import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { appCache } from '../../src/utils/cache.js';
import { NotFoundError, ValidationError } from '../../src/utils/errors.js';

const transactionMock = jest.fn(async (handler) =>
  handler({ LOCK: { UPDATE: Symbol('update') } }),
);

const sequelize = { transaction: transactionMock };

const modelMocks = {
  User: { findByPk: jest.fn() },
  FreelancerOperationsMembership: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    sequelize,
  },
  FreelancerOperationsWorkflow: {
    findAll: jest.fn(),
    sequelize,
  },
  FreelancerOperationsNotice: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    sequelize,
  },
  FreelancerOperationsSnapshot: {
    findOrCreate: jest.fn(),
    sequelize,
  },
};

Object.keys(global.__mockSequelizeModels).forEach((key) => delete global.__mockSequelizeModels[key]);
Object.assign(global.__mockSequelizeModels, modelMocks);

const modelsModule = await import('../../src/models/index.js');
if (typeof modelsModule.__setModelStubs === 'function') {
  modelsModule.__setModelStubs({
    User: modelMocks.User,
    FreelancerOperationsMembership: modelMocks.FreelancerOperationsMembership,
    FreelancerOperationsWorkflow: modelMocks.FreelancerOperationsWorkflow,
    FreelancerOperationsNotice: modelMocks.FreelancerOperationsNotice,
    FreelancerOperationsSnapshot: modelMocks.FreelancerOperationsSnapshot,
  });
}

const {
  getFreelancerOperationsHq,
  requestFreelancerOperationsMembership,
  updateFreelancerOperationsMembership,
  acknowledgeFreelancerOperationsNotice,
  syncFreelancerOperationsHq,
} = await import('../../src/services/freelancerOperationsService.js');

const flushSpy = jest.spyOn(appCache, 'flushByPrefix');

function resetMocks() {
  transactionMock.mockReset().mockImplementation(async (handler) =>
    handler({ LOCK: { UPDATE: Symbol('update') } }),
  );
  Object.values(modelMocks).forEach((entry) => {
    if (!entry) return;
    Object.values(entry).forEach((maybeFn) => {
      if (typeof maybeFn?.mockReset === 'function') {
        maybeFn.mockReset();
      }
    });
  });
  flushSpy.mockClear();
  appCache.store.clear();
}

function createMembershipRecord(overrides = {}) {
  const record = {
    id: overrides.id ?? 1,
    freelancerId: overrides.freelancerId ?? 77,
    slug: overrides.slug ?? 'ops-core',
    name: overrides.name ?? 'Operations core',
    status: overrides.status ?? 'active',
    role: overrides.role ?? 'Operations lead',
    description: overrides.description ?? 'Full access',
    requestedAt: overrides.requestedAt ?? new Date('2024-01-10T12:00:00.000Z'),
    activatedAt: overrides.activatedAt ?? new Date('2024-01-12T12:00:00.000Z'),
    lastReviewedAt: overrides.lastReviewedAt ?? new Date('2024-02-01T12:00:00.000Z'),
    metadata: overrides.metadata ? { ...overrides.metadata } : {},
    save: jest.fn().mockResolvedValue(undefined),
    get({ plain } = {}) {
      if (plain) {
        const { save, get: _get, ...rest } = this;
        return JSON.parse(JSON.stringify(rest));
      }
      return this;
    },
  };
  return record;
}

function createWorkflowRecord(overrides = {}) {
  const record = {
    id: overrides.id ?? 11,
    freelancerId: overrides.freelancerId ?? 77,
    slug: overrides.slug ?? 'workflow-a',
    title: overrides.title ?? 'Launch onboarding',
    status: overrides.status ?? 'tracking',
    completion: overrides.completion ?? 64,
    dueAt: overrides.dueAt ?? new Date('2024-03-01T10:00:00.000Z'),
    blockers: overrides.blockers ?? [],
    metadata: overrides.metadata ? { ...overrides.metadata } : {},
    get({ plain } = {}) {
      if (plain) {
        return {
          id: this.id,
          slug: this.slug,
          title: this.title,
          status: this.status,
          completion: this.completion,
          dueAt: this.dueAt,
          blockers: Array.isArray(this.blockers) ? [...this.blockers] : [],
          metadata: { ...this.metadata },
        };
      }
      return this;
    },
  };
  return record;
}

function createNoticeRecord(overrides = {}) {
  const record = {
    id: overrides.id ?? 21,
    freelancerId: overrides.freelancerId ?? 77,
    slug: overrides.slug ?? 'notice-kyc',
    tone: overrides.tone ?? 'warning',
    title: overrides.title ?? 'Verify client KYC',
    message: overrides.message ?? 'Upload documents',
    acknowledged: overrides.acknowledged ?? false,
    acknowledgedAt: overrides.acknowledgedAt ?? null,
    expiresAt: overrides.expiresAt ?? new Date('2024-03-10T10:00:00.000Z'),
    metadata: overrides.metadata ? { ...overrides.metadata } : {},
    save: jest.fn().mockResolvedValue(undefined),
    get({ plain } = {}) {
      if (plain) {
        const { save, get: _get, ...rest } = this;
        return JSON.parse(JSON.stringify(rest));
      }
      return this;
    },
  };
  return record;
}

function createSnapshotRecord(overrides = {}) {
  const record = {
    id: overrides.id ?? 31,
    freelancerId: overrides.freelancerId ?? 77,
    activeWorkflows: overrides.activeWorkflows ?? 0,
    escalations: overrides.escalations ?? 0,
    automationCoverage: overrides.automationCoverage ?? 0,
    complianceScore: overrides.complianceScore ?? 0,
    outstandingTasks: overrides.outstandingTasks ?? 0,
    recentApprovals: overrides.recentApprovals ?? 0,
    nextReviewAt: overrides.nextReviewAt ?? null,
    lastSyncedAt: overrides.lastSyncedAt ?? null,
    currency: overrides.currency ?? 'USD',
    metadata: overrides.metadata ? { ...overrides.metadata } : {},
    save: jest.fn().mockResolvedValue(undefined),
    get({ plain } = {}) {
      if (plain) {
        const { save, get: _get, ...rest } = this;
        return JSON.parse(JSON.stringify(rest));
      }
      return this;
    },
  };
  return record;
}

describe('freelancerOperationsService', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterAll(() => {
    flushSpy.mockRestore();
  });

  it('aggregates operations HQ data and caches the snapshot', async () => {
    const membershipRows = [
      createMembershipRecord({ slug: 'ops-core', name: 'Operations core', metadata: { steward: 'Kai' } }),
      createMembershipRecord({
        id: 2,
        slug: 'ops-growth',
        name: 'Growth network',
        status: 'available',
        role: null,
        requestedAt: null,
        activatedAt: null,
        lastReviewedAt: null,
        metadata: { seatsRemaining: 4 },
      }),
    ];
    const workflowRows = [
      createWorkflowRecord({ slug: 'workflow-a', completion: 72, status: 'tracking' }),
      createWorkflowRecord({ slug: 'workflow-risk', completion: 40, status: 'at-risk' }),
    ];
    const noticeRows = [
      createNoticeRecord({ slug: 'notice-kyc', tone: 'warning', acknowledged: false }),
    ];
    const snapshot = createSnapshotRecord({
      activeWorkflows: 4,
      escalations: 1,
      automationCoverage: 72.5,
      complianceScore: 88.1,
      outstandingTasks: 2,
      recentApprovals: 6,
      nextReviewAt: new Date('2024-04-12T09:00:00.000Z'),
      lastSyncedAt: new Date('2024-04-10T12:00:00.000Z'),
    });

    modelMocks.User.findByPk.mockResolvedValue({ id: 77, userType: 'freelancer' });
    modelMocks.FreelancerOperationsMembership.findAll.mockResolvedValue(membershipRows);
    modelMocks.FreelancerOperationsWorkflow.findAll.mockResolvedValue(workflowRows);
    modelMocks.FreelancerOperationsNotice.findAll.mockResolvedValue(noticeRows);
    modelMocks.FreelancerOperationsSnapshot.findOrCreate.mockResolvedValue([snapshot, false]);

    const first = await getFreelancerOperationsHq(77);

    expect(first.memberships).toHaveLength(2);
    expect(first.memberships[0]).toMatchObject({ id: 'ops-core', status: 'active', metadata: { steward: 'Kai' } });
    expect(first.workflows[1]).toMatchObject({ id: 'workflow-risk', completion: 40, status: 'at-risk' });
    expect(first.metrics).toMatchObject({
      activeWorkflows: 4,
      automationCoverage: 72.5,
      complianceScore: 88.1,
      escalations: 2,
      currency: 'USD',
    });
    expect(first.compliance).toMatchObject({ outstandingTasks: 2, recentApprovals: 6 });
    expect(modelMocks.User.findByPk).toHaveBeenCalledTimes(1);

    modelMocks.User.findByPk.mockClear();
    modelMocks.FreelancerOperationsMembership.findAll.mockClear();
    modelMocks.FreelancerOperationsWorkflow.findAll.mockClear();
    modelMocks.FreelancerOperationsNotice.findAll.mockClear();
    modelMocks.FreelancerOperationsSnapshot.findOrCreate.mockClear();

    const cached = await getFreelancerOperationsHq(77);
    expect(cached).toBe(first);
    expect(modelMocks.User.findByPk).not.toHaveBeenCalled();
    expect(modelMocks.FreelancerOperationsMembership.findAll).not.toHaveBeenCalled();
  });

  it('validates freelancer identifiers', async () => {
    await expect(getFreelancerOperationsHq('abc')).rejects.toThrow(ValidationError);
    await expect(requestFreelancerOperationsMembership(-5, 'ops-core')).rejects.toThrow(ValidationError);
  });

  it('creates membership requests for new slugs and flushes cache', async () => {
    const now = new Date('2024-04-10T12:00:00.000Z');
    jest.useFakeTimers().setSystemTime(now);

    modelMocks.User.findByPk.mockResolvedValue({ id: 77, userType: 'freelancer' });
    modelMocks.FreelancerOperationsMembership.findOne.mockResolvedValue(null);
    modelMocks.FreelancerOperationsMembership.create.mockImplementation(async (payload) =>
      createMembershipRecord({ ...payload, id: 301 }),
    );

    const membership = await requestFreelancerOperationsMembership(77, 'ops-growth-network', {
      requestedRole: 'Automation advisor',
      reason: 'Need to collaborate on compliance workflows',
      metadata: { region: 'emea' },
    });

    expect(membership).toMatchObject({
      id: 'ops-growth-network',
      status: 'requested',
      role: 'Automation advisor',
      description: 'Need to collaborate on compliance workflows',
    });
    expect(modelMocks.FreelancerOperationsMembership.create).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'ops-growth-network',
        status: 'requested',
        metadata: expect.objectContaining({ region: 'emea' }),
      }),
      expect.any(Object),
    );
    expect(flushSpy).toHaveBeenCalledWith('freelancer:operations-hq:');
    expect(transactionMock).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('throws when requesting a numeric membership that does not exist', async () => {
    modelMocks.User.findByPk.mockResolvedValue({ id: 77, userType: 'freelancer' });
    modelMocks.FreelancerOperationsMembership.findOne.mockResolvedValue(null);

    await expect(requestFreelancerOperationsMembership(77, 999)).rejects.toBeInstanceOf(NotFoundError);
    expect(modelMocks.FreelancerOperationsMembership.create).not.toHaveBeenCalled();
  });

  it('updates memberships and merges metadata', async () => {
    modelMocks.User.findByPk.mockResolvedValue({ id: 77, userType: 'freelancer' });
    const membershipRecord = createMembershipRecord({
      slug: 'ops-core',
      status: 'available',
      metadata: { steward: 'Kai' },
    });
    modelMocks.FreelancerOperationsMembership.findOne.mockResolvedValue(membershipRecord);

    const updated = await updateFreelancerOperationsMembership(77, 'ops-core', {
      status: 'active',
      role: 'Operations lead',
      description: 'Full access confirmed',
      metadata: { steward: 'Ari', synced: true },
    });

    expect(membershipRecord.save).toHaveBeenCalled();
    expect(membershipRecord.status).toBe('active');
    expect(membershipRecord.metadata).toMatchObject({ steward: 'Ari', synced: true });
    expect(updated).toMatchObject({ id: 'ops-core', status: 'active', role: 'Operations lead' });
    expect(flushSpy).toHaveBeenCalledWith('freelancer:operations-hq:');
  });

  it('acknowledges notices and records timestamps', async () => {
    modelMocks.User.findByPk.mockResolvedValue({ id: 77, userType: 'freelancer' });
    const noticeRecord = createNoticeRecord({ slug: 'notice-kyc', acknowledged: false });
    modelMocks.FreelancerOperationsNotice.findOne.mockResolvedValue(noticeRecord);

    const notice = await acknowledgeFreelancerOperationsNotice(77, 'notice-kyc');

    expect(noticeRecord.save).toHaveBeenCalled();
    expect(notice).toMatchObject({ id: 'notice-kyc', acknowledged: true });
    expect(flushSpy).toHaveBeenCalledWith('freelancer:operations-hq:');
  });

  it('syncs operations snapshots, refreshes metrics, and bypasses cache', async () => {
    modelMocks.User.findByPk.mockResolvedValue({ id: 77, userType: 'freelancer' });
    const snapshot = createSnapshotRecord({ activeWorkflows: 1, escalations: 0 });
    modelMocks.FreelancerOperationsSnapshot.findOrCreate.mockResolvedValue([snapshot, false]);

    const membershipRows = [createMembershipRecord({ slug: 'ops-core' })];
    const workflowRows = [
      createWorkflowRecord({ slug: 'workflow-a', status: 'tracking', completion: 80 }),
      createWorkflowRecord({ slug: 'workflow-risk', status: 'blocked', completion: 20 }),
    ];
    const noticeRows = [createNoticeRecord({ tone: 'critical', acknowledged: false })];

    modelMocks.FreelancerOperationsMembership.findAll.mockResolvedValue(membershipRows);
    modelMocks.FreelancerOperationsWorkflow.findAll.mockResolvedValue(workflowRows);
    modelMocks.FreelancerOperationsNotice.findAll.mockResolvedValue(noticeRows);

    const payload = await syncFreelancerOperationsHq(77);

    expect(transactionMock).toHaveBeenCalled();
    expect(snapshot.save).toHaveBeenCalled();
    expect(snapshot.activeWorkflows).toBe(2);
    expect(snapshot.escalations).toBeGreaterThanOrEqual(1);
    expect(payload.metrics).toMatchObject({ activeWorkflows: 2, escalations: expect.any(Number) });
    expect(flushSpy).toHaveBeenCalledWith('freelancer:operations-hq:');
  });
});

