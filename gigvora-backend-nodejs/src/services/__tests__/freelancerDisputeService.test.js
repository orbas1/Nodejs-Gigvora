import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Op } from 'sequelize';

const modelsPath = new URL('../../models/index.js', import.meta.url).pathname;
const trustServicePath = new URL('../trustService.js', import.meta.url).pathname;
const constantsPath = new URL('../../models/constants/index.js', import.meta.url).pathname;
const errorsPath = new URL('../../utils/errors.js', import.meta.url).pathname;

let models;
let trustService;
let service;
let AuthorizationError;

function createDisputeRecord({
  id,
  stage,
  status,
  priority,
  summary,
  reasonCode,
  customerDeadlineAt,
  providerDeadlineAt,
  updatedAt,
  transactionId,
  transactionReference,
  transactionStatus = 'in_escrow',
  amount = 2500,
  latestEvent,
}) {
  return {
    toPublicObject: () => ({
      id,
      escrowTransactionId: transactionId,
      stage,
      status,
      priority,
      summary,
      reasonCode,
      customerDeadlineAt,
      providerDeadlineAt,
      openedAt: '2025-01-10T08:00:00.000Z',
      updatedAt,
    }),
    transaction: {
      toPublicObject: () => ({
        id: transactionId,
        reference: transactionReference,
        amount,
        currencyCode: 'USD',
        status: transactionStatus,
        milestoneLabel: 'Milestone',
      }),
    },
    events: latestEvent
      ? [
          {
            toPublicObject: () => latestEvent,
          },
        ]
      : [],
  };
}

beforeEach(async () => {
  jest.resetModules();

  models = {
    DisputeCase: {
      findAll: jest.fn(),
      findOne: jest.fn(),
    },
    DisputeEvent: {
      findAll: jest.fn(),
    },
    EscrowTransaction: {
      findAll: jest.fn(),
      findOne: jest.fn(),
    },
    EscrowAccount: {},
  };

  trustService = {
    createDisputeCase: jest.fn(),
    appendDisputeEvent: jest.fn(),
  };

  jest.unstable_mockModule(modelsPath, () => ({
    DisputeCase: models.DisputeCase,
    DisputeEvent: models.DisputeEvent,
    EscrowTransaction: models.EscrowTransaction,
    EscrowAccount: models.EscrowAccount,
  }));

  jest.unstable_mockModule(trustServicePath, () => trustService);
  jest.unstable_mockModule(constantsPath, () => ({
    DISPUTE_STAGES: ['intake', 'mediation', 'arbitration', 'resolved'],
    DISPUTE_STATUSES: ['open', 'awaiting_customer', 'under_review', 'settled', 'closed'],
    DISPUTE_PRIORITIES: ['low', 'medium', 'high', 'urgent'],
    DISPUTE_ACTION_TYPES: ['comment', 'evidence_upload', 'deadline_adjusted', 'stage_advanced', 'status_change', 'system_notice'],
    DISPUTE_ACTOR_TYPES: ['customer', 'provider', 'mediator', 'admin', 'system'],
  }));

  ({ AuthorizationError } = await import(errorsPath));
  service = await import('../freelancerDisputeService.js');
});

describe('freelancerDisputeService.getFreelancerDisputeDashboard', () => {
  it('summarises disputes, deadlines, and eligible transactions', async () => {
    const baseNow = new Date('2025-01-15T12:00:00Z').getTime();
    const realDateNow = Date.now;
    Date.now = jest.fn(() => baseNow);

    models.DisputeCase.findAll.mockResolvedValue([
      createDisputeRecord({
        id: 201,
        stage: 'mediation',
        status: 'open',
        priority: 'high',
        summary: 'Clarify automation deliverables scope',
        reasonCode: 'scope_disagreement',
        customerDeadlineAt: '2025-01-18T16:00:00.000Z',
        providerDeadlineAt: '2025-01-17T18:00:00.000Z',
        updatedAt: '2025-01-15T11:45:00.000Z',
        transactionId: 801,
        transactionReference: 'seed-dispute-automation',
        latestEvent: { id: 701, actionType: 'status_change', eventAt: '2025-01-15T11:45:00.000Z' },
      }),
      createDisputeRecord({
        id: 202,
        stage: 'intake',
        status: 'awaiting_customer',
        priority: 'urgent',
        summary: 'QA adjustments before final payment',
        reasonCode: 'quality_issue',
        customerDeadlineAt: '2025-01-13T15:00:00.000Z',
        providerDeadlineAt: '2025-01-13T15:00:00.000Z',
        updatedAt: '2025-01-15T09:45:00.000Z',
        transactionId: 802,
        transactionReference: 'seed-dispute-qa',
        latestEvent: { id: 702, actionType: 'comment', eventAt: '2025-01-14T09:00:00.000Z' },
      }),
    ]);

    models.EscrowTransaction.findAll.mockResolvedValue([
      {
        toPublicObject: () => ({
          id: 801,
          reference: 'seed-dispute-automation',
          amount: 2850,
          currencyCode: 'USD',
          status: 'in_escrow',
          milestoneLabel: 'Automation blueprint delivery',
          scheduledReleaseAt: '2025-01-20T17:00:00.000Z',
          metadata: { seedKey: 'automation' },
        }),
      },
      {
        toPublicObject: () => ({
          id: 802,
          reference: 'seed-dispute-qa',
          amount: 1750,
          currencyCode: 'USD',
          status: 'disputed',
          milestoneLabel: 'QA review sprint',
          scheduledReleaseAt: '2025-01-10T14:00:00.000Z',
          metadata: { seedKey: 'qa' },
        }),
      },
    ]);

    const result = await service.getFreelancerDisputeDashboard(44, {
      status: 'open',
      actorRoles: ['freelancer'],
    });

    expect(models.DisputeCase.findAll).toHaveBeenCalledTimes(1);
    const callArgs = models.DisputeCase.findAll.mock.calls[0][0];
    expect(callArgs.where.status[Op.in]).toEqual(expect.arrayContaining(['open', 'awaiting_customer', 'under_review']));

    const accountInclude = callArgs.include.find((item) => item.as === 'transaction').include.find((item) => item.as === 'account');
    expect(accountInclude.where).toEqual({ userId: 44 });

    expect(result.summary.totalCases).toBe(2);
    expect(result.summary.openCases).toBe(2);
    expect(result.summary.awaitingCustomer).toBe(1);
    expect(result.summary.urgentCases).toBe(1);
    expect(result.summary.dueWithin72h).toBe(2);

    expect(result.metrics.byStage.mediation).toBe(1);
    expect(result.metrics.byStatus.awaiting_customer).toBe(1);

    expect(result.upcomingDeadlines[0]).toMatchObject({ disputeId: 202, isPastDue: true });
    expect(result.disputes[0].latestEvent.actionType).toBe('status_change');
    expect(result.eligibleTransactions.every((item) => item.hasActiveDispute)).toBe(true);
    expect(result.permissions).toMatchObject({ canOpen: true, actorType: 'provider' });

    Date.now = realDateNow;
  });
});

describe('freelancerDisputeService.appendFreelancerDisputeEvent', () => {
  it('appends events with permission checks and refreshed timeline', async () => {
    const disputeRecord = {
      id: 201,
      escrowTransactionId: 801,
      toPublicObject: () => ({
        id: 201,
        stage: 'mediation',
        status: 'open',
        priority: 'high',
        summary: 'Clarify automation deliverables scope',
        reasonCode: 'scope_disagreement',
        customerDeadlineAt: '2025-01-18T16:00:00.000Z',
        providerDeadlineAt: '2025-01-17T18:00:00.000Z',
        openedAt: '2025-01-12T12:30:00.000Z',
        updatedAt: '2025-01-15T11:45:00.000Z',
        escrowTransactionId: 801,
      }),
      transaction: {
        toPublicObject: () => ({
          id: 801,
          reference: 'seed-dispute-automation',
          amount: 2850,
          currencyCode: 'USD',
          status: 'disputed',
          milestoneLabel: 'Automation blueprint delivery',
        }),
      },
    };

    models.DisputeCase.findOne.mockResolvedValue(disputeRecord);
    models.DisputeEvent.findAll.mockResolvedValue([
      { toPublicObject: () => ({ id: 501, actionType: 'comment', eventAt: '2025-01-12T13:00:00.000Z' }) },
      { toPublicObject: () => ({ id: 502, actionType: 'status_change', eventAt: '2025-01-15T11:45:00.000Z' }) },
    ]);

    trustService.appendDisputeEvent.mockResolvedValue({
      dispute: {
        id: 201,
        stage: 'mediation',
        status: 'under_review',
        priority: 'high',
      },
      event: {
        toPublicObject: () => ({ id: 503, actionType: 'status_change', eventAt: '2025-01-15T14:00:00.000Z' }),
      },
    });

    const result = await service.appendFreelancerDisputeEvent(44, 201, {
      actionType: 'status_change',
      status: 'under_review',
      transactionResolution: 'release',
      providerDeadlineAt: '2025-01-19T12:00:00.000Z',
    }, { actorRoles: ['trust'], actorId: 88 });

    expect(trustService.appendDisputeEvent).toHaveBeenCalledWith(
      201,
      expect.objectContaining({
        actorId: 88,
        actorType: 'mediator',
        status: 'under_review',
        transactionResolution: 'release',
        providerDeadlineAt: '2025-01-19T12:00:00.000Z',
      }),
      expect.any(Object),
    );

    expect(result.dispute.stage).toBe('mediation');
    expect(result.event).toEqual({ id: 503, actionType: 'status_change', eventAt: '2025-01-15T14:00:00.000Z' });
    expect(result.events).toHaveLength(2);
  });

  it('rejects resolution attempts from unauthorised actors', async () => {
    models.DisputeCase.findOne.mockResolvedValue({
      toPublicObject: () => ({ id: 201, stage: 'mediation', status: 'open', priority: 'high' }),
      transaction: { toPublicObject: () => ({ id: 801, reference: 'seed-dispute-automation', amount: 2850, currencyCode: 'USD' }) },
    });

    await expect(
      service.appendFreelancerDisputeEvent(44, 201, { transactionResolution: 'refund' }, { actorRoles: ['freelancer'] }),
    ).rejects.toThrow(AuthorizationError);

    expect(trustService.appendDisputeEvent).not.toHaveBeenCalled();
  });
});
