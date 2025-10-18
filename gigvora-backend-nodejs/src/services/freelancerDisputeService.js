import { Op } from 'sequelize';
import {
  DisputeCase,
  DisputeEvent,
  EscrowAccount,
  EscrowTransaction,
} from '../models/index.js';
import {
  DISPUTE_STAGES,
  DISPUTE_STATUSES,
  DISPUTE_PRIORITIES,
  DISPUTE_ACTION_TYPES,
  DISPUTE_ACTOR_TYPES,
} from '../models/constants/index.js';
import {
  createDisputeCase,
  appendDisputeEvent as appendTrustDisputeEvent,
} from './trustService.js';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
} from '../utils/errors.js';

const DEFAULT_LIST_LIMIT = 40;
const UPCOMING_DEADLINE_LIMIT = 8;
const TRANSACTION_LOOKBACK_LIMIT = 30;
const DUE_SOON_THRESHOLD_HOURS = 72;
const RESOLUTION_OPTIONS = [
  { value: 'none', label: 'Log update only' },
  { value: 'release', label: 'Release funds to freelancer' },
  { value: 'refund', label: 'Refund client' },
];

const DISPUTE_REASON_CATALOG = [
  {
    value: 'quality_issue',
    label: 'Quality issue',
    description: 'Client contests the quality or completeness of delivered work.',
  },
  {
    value: 'missed_deadline',
    label: 'Missed deadline',
    description: 'Milestones or delivery dates were missed and require mediation.',
  },
  {
    value: 'scope_disagreement',
    label: 'Scope disagreement',
    description: 'Parties disagree on what was included in the agreed scope.',
  },
  {
    value: 'payment_release',
    label: 'Payment release',
    description: 'Escrow release is disputed or being challenged by either party.',
  },
  {
    value: 'refund_request',
    label: 'Refund requested',
    description: 'Client is requesting a refund of the escrowed amount.',
  },
];

const ELIGIBLE_TRANSACTION_STATUSES = new Set(['initiated', 'funded', 'in_escrow', 'disputed']);
const ACTIVE_DISPUTE_STATUSES = new Set(['open', 'awaiting_customer', 'under_review']);

function normaliseFreelancerId(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError('freelancerId must be a positive integer.');
  }
  return parsed;
}

function normaliseDisputeId(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError('disputeId must be a positive integer.');
  }
  return parsed;
}

function parseActorRoles(actorRoles) {
  if (!actorRoles) {
    return [];
  }
  if (Array.isArray(actorRoles)) {
    return actorRoles
      .map((role) => (typeof role === 'string' ? role.trim().toLowerCase() : null))
      .filter(Boolean);
  }
  if (typeof actorRoles === 'string') {
    return actorRoles
      .split(',')
      .map((role) => role.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
}

function computePermissions(actorRoles) {
  const roles = new Set(parseActorRoles(actorRoles));
  const isFreelancer = roles.has('freelancer');
  const isAdmin = roles.has('admin') || roles.has('superadmin');
  const isFinance = roles.has('finance') || roles.has('finance_admin') || roles.has('trust') || roles.has('compliance');
  const canOpen = isFreelancer || isAdmin || isFinance;
  const canUploadEvidence = canOpen || roles.has('support');
  const canEscalate = canOpen || roles.has('support');
  const canResolve = isAdmin || isFinance;

  const preferredActorType = isFreelancer
    ? 'provider'
    : isFinance || isAdmin
    ? 'mediator'
    : 'system';

  return {
    canOpen,
    canUploadEvidence,
    canEscalate,
    canResolve,
    actorType: DISPUTE_ACTOR_TYPES.includes(preferredActorType) ? preferredActorType : 'system',
  };
}

function humaniseDeadline(deadline) {
  if (!deadline) {
    return null;
  }
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function projectDispute(record) {
  const base = record.toPublicObject();
  const transaction = record.transaction?.toPublicObject?.();
  const events = Array.isArray(record.events) ? record.events : [];
  const latestEvent = events.length ? events[0]?.toPublicObject?.() ?? events[0] : null;

  return {
    ...base,
    latestEvent,
    transaction,
  };
}

function buildSummary(disputes) {
  const summary = {
    totalCases: disputes.length,
    openCases: 0,
    awaitingCustomer: 0,
    urgentCases: 0,
    dueWithin72h: 0,
    lastUpdatedAt: new Date().toISOString(),
  };

  const stageCounts = DISPUTE_STAGES.reduce((acc, stage) => ({ ...acc, [stage]: 0 }), {});
  const statusCounts = DISPUTE_STATUSES.reduce((acc, status) => ({ ...acc, [status]: 0 }), {});
  const priorityCounts = DISPUTE_PRIORITIES.reduce((acc, priority) => ({ ...acc, [priority]: 0 }), {});

  const upcoming = [];
  const now = Date.now();

  for (const dispute of disputes) {
    stageCounts[dispute.stage] = (stageCounts[dispute.stage] ?? 0) + 1;
    statusCounts[dispute.status] = (statusCounts[dispute.status] ?? 0) + 1;
    priorityCounts[dispute.priority] = (priorityCounts[dispute.priority] ?? 0) + 1;

    if (ACTIVE_DISPUTE_STATUSES.has(dispute.status)) {
      summary.openCases += 1;
    }
    if (dispute.status === 'awaiting_customer') {
      summary.awaitingCustomer += 1;
    }
    if (dispute.priority === 'urgent') {
      summary.urgentCases += 1;
    }

    const deadlines = [dispute.providerDeadlineAt, dispute.customerDeadlineAt]
      .map((value) => (value ? new Date(value).getTime() : null))
      .filter((value) => Number.isFinite(value));

    if (deadlines.length) {
      const nextDeadline = Math.min(...deadlines);
      const isDueSoon = nextDeadline - now <= DUE_SOON_THRESHOLD_HOURS * 60 * 60 * 1000;
      if (isDueSoon) {
        summary.dueWithin72h += 1;
      }
      upcoming.push({
        disputeId: dispute.id,
        dueAt: new Date(nextDeadline).toISOString(),
        isPastDue: nextDeadline < now,
        summary: dispute.summary,
        priority: dispute.priority,
        stage: dispute.stage,
      });
    }
  }

  upcoming.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

  return {
    summary,
    metrics: {
      byStage: stageCounts,
      byStatus: statusCounts,
      byPriority: priorityCounts,
    },
    upcomingDeadlines: upcoming.slice(0, UPCOMING_DEADLINE_LIMIT),
  };
}

async function resolveTransactionForFreelancer(freelancerId, transactionId) {
  const transaction = await EscrowTransaction.findOne({
    where: { id: transactionId },
    include: [
      {
        model: EscrowAccount,
        as: 'account',
        required: true,
        where: { userId: freelancerId },
      },
    ],
  });

  if (!transaction) {
    throw new NotFoundError('Escrow transaction not found for freelancer.');
  }

  const publicTransaction = transaction.toPublicObject();
  if (!ELIGIBLE_TRANSACTION_STATUSES.has(publicTransaction.status)) {
    throw new ValidationError('Selected transaction is not eligible for dispute management.');
  }

  return transaction;
}

async function ensureDisputeOwnership(freelancerId, disputeId) {
  const dispute = await DisputeCase.findOne({
    where: { id: disputeId },
    include: [
      {
        model: EscrowTransaction,
        as: 'transaction',
        required: true,
        include: [
          {
            model: EscrowAccount,
            as: 'account',
            required: true,
            where: { userId: freelancerId },
          },
        ],
      },
    ],
  });

  if (!dispute) {
    throw new NotFoundError('Dispute case not found.');
  }

  return dispute;
}

function mapEligibleTransactions(transactions, activeIds) {
  return transactions.map((transaction) => {
    const payload = transaction.toPublicObject();
    return {
      id: payload.id,
      reference: payload.reference,
      amount: payload.amount,
      currencyCode: payload.currencyCode,
      status: payload.status,
      milestoneLabel: payload.milestoneLabel,
      gigId: payload.gigId,
      scheduledReleaseAt: payload.scheduledReleaseAt,
      metadata: payload.metadata ?? null,
      hasActiveDispute: activeIds.has(payload.id),
    };
  });
}

export async function getFreelancerDisputeDashboard(freelancerIdInput, options = {}) {
  const freelancerId = normaliseFreelancerId(freelancerIdInput);
  const limit = Number.isFinite(options.limit) && options.limit > 0 ? options.limit : DEFAULT_LIST_LIMIT;
  const includeClosed = options.includeClosed === true || options.includeClosed === 'true';
  const permissions = computePermissions(options.actorRoles);

  const whereClause = {};
  if (options.stage && DISPUTE_STAGES.includes(options.stage)) {
    whereClause.stage = options.stage;
  }
  if (options.status && DISPUTE_STATUSES.includes(options.status)) {
    whereClause.status = options.status;
  } else if (!includeClosed) {
    whereClause.status = { [Op.ne]: 'closed' };
  }

  const disputes = await DisputeCase.findAll({
    where: whereClause,
    include: [
      {
        model: EscrowTransaction,
        as: 'transaction',
        required: true,
        include: [
          {
            model: EscrowAccount,
            as: 'account',
            required: true,
            where: { userId: freelancerId },
          },
        ],
      },
      {
        model: DisputeEvent,
        as: 'events',
        separate: true,
        limit: 1,
        order: [
          ['eventAt', 'DESC'],
          ['id', 'DESC'],
        ],
      },
    ],
    order: [
      ['priority', 'DESC'],
      ['updatedAt', 'DESC'],
    ],
    limit,
  });

  const projectedDisputes = disputes.map(projectDispute);
  const { summary, metrics, upcomingDeadlines } = buildSummary(projectedDisputes);
  const activeTransactionIds = new Set(
    projectedDisputes
      .filter((dispute) => ACTIVE_DISPUTE_STATUSES.has(dispute.status))
      .map((dispute) => dispute.escrowTransactionId),
  );

  const eligibleTransactions = await EscrowTransaction.findAll({
    where: {
      status: Array.from(ELIGIBLE_TRANSACTION_STATUSES),
    },
    include: [
      {
        model: EscrowAccount,
        as: 'account',
        required: true,
        where: { userId: freelancerId },
      },
    ],
    order: [['updatedAt', 'DESC']],
    limit: TRANSACTION_LOOKBACK_LIMIT,
  });

  return {
    summary,
    metrics,
    disputes: projectedDisputes,
    upcomingDeadlines,
    filters: {
      stages: DISPUTE_STAGES,
      statuses: DISPUTE_STATUSES,
      priorities: DISPUTE_PRIORITIES,
      reasonCodes: DISPUTE_REASON_CATALOG,
      actionTypes: DISPUTE_ACTION_TYPES,
    },
    resolutionOptions: RESOLUTION_OPTIONS,
    eligibleTransactions: mapEligibleTransactions(eligibleTransactions, activeTransactionIds),
    permissions,
    lastRefreshedAt: new Date().toISOString(),
  };
}

export async function openFreelancerDispute(freelancerIdInput, payload, options = {}) {
  const freelancerId = normaliseFreelancerId(freelancerIdInput);
  const permissions = computePermissions(options.actorRoles);
  if (!permissions.canOpen) {
    throw new AuthorizationError('You do not have permission to open disputes.');
  }

  const {
    escrowTransactionId,
    reasonCode,
    summary,
    priority = 'medium',
    customerDeadlineAt,
    providerDeadlineAt,
    metadata,
    openedById,
    assignedToId,
  } = payload ?? {};

  const actorId = Number.parseInt(openedById ?? options.actorId ?? freelancerId, 10);
  if (!Number.isFinite(actorId) || actorId <= 0) {
    throw new ValidationError('openedById must be a positive integer.');
  }

  if (!reasonCode || !DISPUTE_REASON_CATALOG.some((item) => item.value === reasonCode)) {
    throw new ValidationError('A recognised reasonCode is required.');
  }

  if (!summary || typeof summary !== 'string' || !summary.trim()) {
    throw new ValidationError('A dispute summary is required.');
  }

  if (!DISPUTE_PRIORITIES.includes(priority)) {
    throw new ValidationError(`priority must be one of: ${DISPUTE_PRIORITIES.join(', ')}`);
  }

  const transaction = await resolveTransactionForFreelancer(freelancerId, escrowTransactionId);

  const dispute = await createDisputeCase(
    {
      escrowTransactionId: transaction.id,
      openedById: actorId,
      assignedToId: assignedToId ?? null,
      priority,
      reasonCode,
      summary,
      customerDeadlineAt: humaniseDeadline(customerDeadlineAt),
      providerDeadlineAt: humaniseDeadline(providerDeadlineAt),
      metadata: metadata ?? { origin: 'freelancer_dashboard' },
    },
    options,
  );

  const record = await ensureDisputeOwnership(freelancerId, dispute.id);
  const events = await DisputeEvent.findAll({
    where: { disputeCaseId: dispute.id },
    order: [
      ['eventAt', 'ASC'],
      ['id', 'ASC'],
    ],
  });

  return {
    dispute: projectDispute({
      ...record,
      toPublicObject: record.toPublicObject.bind(record),
      transaction: record.transaction,
      events: events.length ? [events[events.length - 1]] : [],
    }),
    events: events.map((event) => event.toPublicObject()),
  };
}

export async function getFreelancerDisputeDetail(freelancerIdInput, disputeIdInput) {
  const freelancerId = normaliseFreelancerId(freelancerIdInput);
  const disputeId = normaliseDisputeId(disputeIdInput);

  const disputeRecord = await ensureDisputeOwnership(freelancerId, disputeId);
  const events = await DisputeEvent.findAll({
    where: { disputeCaseId: disputeId },
    order: [
      ['eventAt', 'ASC'],
      ['id', 'ASC'],
    ],
  });

  return {
    dispute: projectDispute({
      ...disputeRecord,
      toPublicObject: disputeRecord.toPublicObject.bind(disputeRecord),
      transaction: disputeRecord.transaction,
      events: events.length ? [events[events.length - 1]] : [],
    }),
    events: events.map((event) => event.toPublicObject()),
    availableStages: DISPUTE_STAGES,
    availableStatuses: DISPUTE_STATUSES,
    availableActionTypes: DISPUTE_ACTION_TYPES,
    resolutionOptions: RESOLUTION_OPTIONS,
  };
}

export async function appendFreelancerDisputeEvent(freelancerIdInput, disputeIdInput, payload, options = {}) {
  const freelancerId = normaliseFreelancerId(freelancerIdInput);
  const disputeId = normaliseDisputeId(disputeIdInput);
  const permissions = computePermissions(options.actorRoles);

  const disputeRecord = await ensureDisputeOwnership(freelancerId, disputeId);

  const {
    actionType = 'comment',
    stage,
    status,
    transactionResolution,
    actorId,
    actorType,
  } = payload ?? {};

  if (transactionResolution && !permissions.canResolve) {
    throw new AuthorizationError('You do not have permission to resolve disputes.');
  }

  if (status && ['settled', 'closed'].includes(status) && !permissions.canResolve) {
    throw new AuthorizationError('You do not have permission to close disputes.');
  }

  if (!DISPUTE_ACTION_TYPES.includes(actionType)) {
    throw new ValidationError('Unsupported dispute action type.');
  }

  if (stage && !DISPUTE_STAGES.includes(stage)) {
    throw new ValidationError('Unknown dispute stage.');
  }

  if (status && !DISPUTE_STATUSES.includes(status)) {
    throw new ValidationError('Unknown dispute status.');
  }

  const resolvedActorId = Number.parseInt(actorId ?? options.actorId ?? freelancerId, 10);
  if (!Number.isFinite(resolvedActorId) || resolvedActorId <= 0) {
    throw new ValidationError('actorId must be a positive integer.');
  }

  const resolvedActorType = DISPUTE_ACTOR_TYPES.includes(actorType)
    ? actorType
    : permissions.actorType ?? 'system';

  const result = await appendTrustDisputeEvent(
    disputeRecord.id,
    {
      ...payload,
      actorId: resolvedActorId,
      actorType: resolvedActorType,
      actionType,
      stage,
      status,
      transactionResolution: transactionResolution && transactionResolution !== 'none' ? transactionResolution : undefined,
      customerDeadlineAt: humaniseDeadline(payload?.customerDeadlineAt),
      providerDeadlineAt: humaniseDeadline(payload?.providerDeadlineAt),
    },
    options,
  );

  const updatedEvents = await DisputeEvent.findAll({
    where: { disputeCaseId: disputeRecord.id },
    order: [
      ['eventAt', 'ASC'],
      ['id', 'ASC'],
    ],
  });

  return {
    dispute: projectDispute({
      ...disputeRecord,
      stage: result.dispute.stage,
      status: result.dispute.status,
      priority: result.dispute.priority,
      toPublicObject: () => result.dispute,
      transaction: disputeRecord.transaction,
      events: updatedEvents.length ? [updatedEvents[updatedEvents.length - 1]] : [],
    }),
    events: updatedEvents.map((event) => event.toPublicObject()),
    event: result.event.toPublicObject(),
  };
}

export default {
  getFreelancerDisputeDashboard,
  openFreelancerDispute,
  getFreelancerDisputeDetail,
  appendFreelancerDisputeEvent,
};
