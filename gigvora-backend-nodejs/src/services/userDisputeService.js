import { Op } from 'sequelize';
import {
  DisputeCase,
  DisputeEvent,
  EscrowTransaction,
  User,
} from '../models/index.js';
import {
  DISPUTE_STATUSES,
  DISPUTE_STAGES,
  DISPUTE_PRIORITIES,
  DISPUTE_ACTION_TYPES,
  DISPUTE_ACTOR_TYPES,
  DISPUTE_REASON_CODES,
} from '../models/constants/index.js';
import trustService from './trustService.js';
import { ValidationError, NotFoundError, AuthorizationError } from '../utils/errors.js';

const CUSTOMER_STATUSES = new Set(['open', 'awaiting_customer', 'under_review']);
const ACTIVE_TRANSACTION_STATUSES = new Set(['funded', 'in_escrow', 'disputed']);
const DECISION_ACTION_TYPES = new Set(['status_change', 'stage_advanced']);

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function toPlainUser(instance) {
  if (!instance) {
    return null;
  }
  const plain = instance.toPublicObject?.() ?? instance.get?.({ plain: true }) ?? instance;
  return {
    id: plain.id,
    firstName: plain.firstName ?? null,
    lastName: plain.lastName ?? null,
    email: plain.email ?? null,
  };
}

function toPlainTransaction(instance) {
  if (!instance) {
    return null;
  }
  const plain = instance.toPublicObject?.() ?? instance.get?.({ plain: true }) ?? instance;
  const initiatorInstance = instance.get?.('initiator') ?? instance.initiator ?? null;
  const counterpartyInstance = instance.get?.('counterparty') ?? instance.counterparty ?? null;
  const amount = Number.parseFloat(plain.amount ?? 0) || 0;
  const titleFromMetadata = plain.metadata?.title || plain.metadata?.gigTitle || plain.metadata?.projectName;
  const displayName =
    titleFromMetadata ||
    plain.milestoneLabel ||
    plain.metadata?.description ||
    plain.reference ||
    `Escrow transaction #${plain.id}`;

  return {
    id: plain.id,
    reference: plain.reference,
    status: plain.status,
    amount,
    currencyCode: plain.currencyCode ?? 'USD',
    counterpartyId: plain.counterpartyId ?? null,
    initiatedById: plain.initiatedById ?? null,
    milestoneLabel: plain.milestoneLabel ?? null,
    scheduledReleaseAt: plain.scheduledReleaseAt ?? null,
    metadata: plain.metadata ?? null,
    displayName,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
    initiator: toPlainUser(initiatorInstance),
    counterparty: toPlainUser(counterpartyInstance),
  };
}

function toPlainEvent(instance) {
  if (!instance) {
    return null;
  }
  const plain = instance.toPublicObject?.() ?? instance.get?.({ plain: true }) ?? instance;
  return {
    id: plain.id,
    disputeCaseId: plain.disputeCaseId,
    actorId: plain.actorId ?? null,
    actorType: plain.actorType,
    actionType: plain.actionType,
    notes: plain.notes ?? null,
    evidenceUrl: plain.evidenceUrl ?? null,
    evidenceFileName: plain.evidenceFileName ?? null,
    evidenceContentType: plain.evidenceContentType ?? null,
    metadata: plain.metadata ?? null,
    eventAt: plain.eventAt ?? plain.createdAt ?? null,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
    actor: toPlainUser(instance.get?.('actor') ?? instance.actor ?? null),
    actorType: plain.actorType,
  };
}

function humanize(value) {
  return value
    .toString()
    .replace(/[_-]+/g, ' ')
    .replace(/(^|\s)([a-z])/g, (match, boundary, letter) => `${boundary}${letter.toUpperCase()}`)
    .trim();
}

function buildMetadata() {
  const addLabel = (value) => ({ value, label: humanize(value) });
  return {
    stages: DISPUTE_STAGES.map(addLabel),
    statuses: DISPUTE_STATUSES.map(addLabel),
    priorities: DISPUTE_PRIORITIES.map(addLabel),
    reasonCodes: DISPUTE_REASON_CODES.map(addLabel),
    actionTypes: DISPUTE_ACTION_TYPES.map(addLabel),
    actorTypes: DISPUTE_ACTOR_TYPES.map(addLabel),
  };
}

function buildSummary(disputes) {
  if (!Array.isArray(disputes) || disputes.length === 0) {
    return {
      total: 0,
      openCount: 0,
      awaitingCustomerAction: 0,
      escalatedCount: 0,
      lastUpdatedAt: null,
      upcomingDeadlines: [],
    };
  }

  const upcomingDeadlines = [];
  let openCount = 0;
  let awaitingCustomerAction = 0;
  let escalatedCount = 0;
  let lastUpdatedAt = null;

  disputes.forEach((dispute) => {
    if (CUSTOMER_STATUSES.has(dispute.status)) {
      openCount += 1;
    }
    if (dispute.status === 'awaiting_customer') {
      awaitingCustomerAction += 1;
    }
    if (dispute.stage && dispute.stage !== 'intake') {
      escalatedCount += 1;
    }
    const updatedAt = new Date(dispute.updatedAt ?? dispute.createdAt ?? Date.now());
    if (!lastUpdatedAt || updatedAt > lastUpdatedAt) {
      lastUpdatedAt = updatedAt;
    }
    if (dispute.customerDeadlineAt) {
      upcomingDeadlines.push({
        id: `${dispute.id}-customer`,
        disputeId: dispute.id,
        type: 'customer',
        dueAt: dispute.customerDeadlineAt,
        label: 'Customer response',
        status: dispute.status,
      });
    }
    if (dispute.providerDeadlineAt) {
      upcomingDeadlines.push({
        id: `${dispute.id}-provider`,
        disputeId: dispute.id,
        type: 'provider',
        dueAt: dispute.providerDeadlineAt,
        label: 'Provider response',
        status: dispute.status,
      });
    }
  });

  upcomingDeadlines.sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));

  return {
    total: disputes.length,
    openCount,
    awaitingCustomerAction,
    escalatedCount,
    lastUpdatedAt: lastUpdatedAt ? lastUpdatedAt.toISOString() : null,
    upcomingDeadlines: upcomingDeadlines.slice(0, 5),
  };
}

function decorateDispute(disputeRecord) {
  if (!disputeRecord) {
    return null;
  }
  const disputePlain = disputeRecord.toPublicObject?.() ?? disputeRecord.get?.({ plain: true }) ?? disputeRecord;
  const transaction = toPlainTransaction(disputeRecord.get?.('transaction') ?? disputeRecord.transaction ?? null);
  const openedBy = toPlainUser(disputeRecord.get?.('openedBy') ?? disputeRecord.openedBy ?? null);
  const assignedTo = toPlainUser(disputeRecord.get?.('assignedTo') ?? disputeRecord.assignedTo ?? null);
  const eventsSource = disputeRecord.get?.('events') ?? disputeRecord.events ?? [];
  const events = Array.isArray(eventsSource) ? eventsSource.map((event) => toPlainEvent(event)) : [];
  events.sort((a, b) => new Date(a.eventAt ?? 0) - new Date(b.eventAt ?? 0));

  const daysOpen = disputePlain.openedAt ? Math.max(0, Math.floor((Date.now() - new Date(disputePlain.openedAt).getTime()) / (1000 * 60 * 60 * 24))) : 0;

  const attachments = events
    .filter((event) => Boolean(event.evidenceUrl))
    .map((event) => ({
      id: `${event.id}`,
      fileName: event.evidenceFileName,
      url: event.evidenceUrl,
      uploadedAt: event.eventAt,
      contentType: event.evidenceContentType ?? 'application/octet-stream',
      label: event.evidenceFileName ?? 'Uploaded evidence',
    }));

  const timelineEvents = events.map((event) => {
    const metadata = event.metadata ?? {};
    const attachmentsFromMetadata = Array.isArray(metadata.attachments) ? metadata.attachments : [];
    const combinedAttachments = [
      ...(event.evidenceUrl
        ? [
            {
              id: `${event.id}-evidence`,
              fileName: event.evidenceFileName ?? 'evidence',
              url: event.evidenceUrl,
              uploadedAt: event.eventAt,
              contentType: event.evidenceContentType ?? 'application/octet-stream',
              label: event.evidenceFileName ?? 'Uploaded evidence',
            },
          ]
        : []),
      ...attachmentsFromMetadata,
    ];

    const stage = metadata.caseStageAfter ?? metadata.stage ?? disputePlain.stage;
    const status = metadata.caseStatusAfter ?? metadata.status ?? disputePlain.status;
    const slaStatus = metadata.slaStatus ?? (metadata.breachDetected ? 'breach' : metadata.atRisk ? 'at_risk' : null);
    let severity = metadata.severity ?? null;
    if (!severity) {
      if (slaStatus === 'breach') {
        severity = 'critical';
      } else if (slaStatus === 'at_risk' || ['under_review', 'awaiting_customer'].includes(status)) {
        severity = 'warning';
      } else if (['settled', 'closed'].includes(status)) {
        severity = 'success';
      }
    }

    return {
      ...event,
      stage,
      status,
      slaStatus,
      severity,
      actorRole: metadata.actorRole ?? event.actorType ?? null,
      attachments: combinedAttachments,
      actions: Array.isArray(metadata.actions) ? metadata.actions : [],
    };
  });

  const lastCommunicatedEvent = [...timelineEvents]
    .reverse()
    .find((event) => event.actorType && event.actorType !== 'system' && (event.notes || event.attachments?.length));
  const lastCommunicatedAt = lastCommunicatedEvent?.eventAt ?? null;

  const firstResponseEvent = timelineEvents.find((event) => event.actorType && event.actorType !== 'system');
  const firstResponseHours =
    firstResponseEvent && disputePlain.openedAt
      ? Math.max(
          0,
          Number(((new Date(firstResponseEvent.eventAt).getTime() - new Date(disputePlain.openedAt).getTime()) / (1000 * 60 * 60)).toFixed(2)),
        )
      : null;

  const checklistFromMetadata = Array.isArray(disputePlain.metadata?.checklist) ? disputePlain.metadata.checklist : [];
  const checklist =
    checklistFromMetadata.length > 0
      ? checklistFromMetadata
      : [
          {
            id: 'acknowledge-case',
            label: 'Acknowledge dispute to customer',
            description: 'Send confirmation with timelines and next checkpoints.',
            completed: Boolean(firstResponseEvent),
          },
          {
            id: 'review-evidence',
            label: 'Review submitted evidence',
            description: 'Verify attachments for authenticity and sensitivity.',
            completed: attachments.length > 0,
          },
          {
            id: 'schedule-mediation',
            label: 'Schedule mediation session',
            description: 'Align both parties on facilitation slot within 24 hours.',
            completed: timelineEvents.some((event) => event.stage === 'mediation'),
          },
        ];

  const decisionLog = timelineEvents
    .filter((event) => DECISION_ACTION_TYPES.has(event.actionType))
    .map((event) => ({
      id: `decision-${event.id}`,
      title: humanize(event.metadata?.decisionTitle ?? event.actionType ?? 'decision logged'),
      notes: event.notes ?? event.metadata?.notes ?? null,
      recordedAt: event.eventAt,
      stage: event.stage,
      status: event.status,
    }));

  const nextSlaAtCandidates = [disputePlain.customerDeadlineAt, disputePlain.providerDeadlineAt]
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));
  const nextSlaAt = nextSlaAtCandidates.length ? new Date(Math.min(...nextSlaAtCandidates)).toISOString() : null;

  const evidenceReviewedEvent = timelineEvents
    .slice()
    .reverse()
    .find((event) => event.actionType === 'evidence_upload' || event.metadata?.evidenceReviewedAt);
  const mediationEvent = timelineEvents.find((event) => event.stage === 'mediation');

  const participants = [];
  const participantIndex = new Map();
  const registerParticipant = (source, role) => {
    if (!source) {
      return;
    }
    const id = source.id ?? source.email ?? role;
    if (!id || participantIndex.has(id)) {
      return;
    }
    participantIndex.set(id, true);
    const nameFromProfile = [source.firstName, source.lastName].filter(Boolean).join(' ').trim();
    const resolvedName = source.displayName ?? (nameFromProfile || source.email) ?? role;
    participants.push({
      id,
      name: resolvedName,
      email: source.email ?? null,
      role,
      avatarUrl: source.avatarUrl ?? null,
    });
  };

  registerParticipant(openedBy, 'requester');
  registerParticipant(assignedTo, 'assignee');
  registerParticipant(transaction?.initiator, 'customer');
  registerParticipant(transaction?.counterparty, 'provider');

  timelineEvents.forEach((event) => {
    if (event.actor) {
      registerParticipant(event.actor, event.actorRole ?? event.actorType ?? 'collaborator');
    }
  });

  const severity = (() => {
    if (['settled', 'closed'].includes(disputePlain.status)) {
      return 'success';
    }
    if (disputePlain.resolvedAt || disputePlain.status === 'resolved') {
      return 'success';
    }
    if (disputePlain.priority === 'urgent' || disputePlain.priority === 'high' || disputePlain.stage === 'arbitration') {
      return 'critical';
    }
    if (disputePlain.status === 'awaiting_customer' || disputePlain.status === 'escalated' || disputePlain.stage !== 'intake') {
      return 'warning';
    }
    return disputePlain.dueSoon ? 'warning' : disputePlain.overdue ? 'critical' : 'info';
  })();

  const alert = (() => {
    if (['settled', 'closed'].includes(disputePlain.status)) {
      return null;
    }
    if (disputePlain.overdue) {
      return { type: 'deadline', severity: 'critical', message: 'Past due on published SLA.' };
    }
    if (disputePlain.dueSoon) {
      return { type: 'deadline', severity: 'warning', message: 'Due within SLA window.' };
    }
    return null;
  })();

  const financials = {
    amountDisputed: Number.isFinite(transaction?.amount) ? Number(transaction.amount) : null,
    currency: transaction?.currencyCode ?? 'USD',
    netAmount: Number.isFinite(transaction?.netAmount) ? Number(transaction.netAmount) : null,
    escrowReference: transaction?.reference ?? null,
  };

  const permissions = {
    canAddEvidence: !['settled', 'closed'].includes(disputePlain.status),
    canRequestMediation: disputePlain.stage === 'intake',
    canEscalate: disputePlain.stage !== 'arbitration' && disputePlain.stage !== 'resolved',
    canClose: disputePlain.status !== 'closed',
  };

  return {
    ...disputePlain,
    title: disputePlain.title ?? transaction?.displayName ?? disputePlain.summary,
    severity,
    transaction,
    openedBy,
    assignedTo,
    events: timelineEvents,
    attachments,
    participants,
    collaborators: participants,
    checklist,
    decisionLog,
    financials,
    nextSlaAt,
    lastCommunicatedAt,
    evidenceReviewedAt: evidenceReviewedEvent?.eventAt ?? evidenceReviewedEvent?.metadata?.evidenceReviewedAt ?? null,
    mediationScheduledAt: mediationEvent?.eventAt ?? null,
    metrics: {
      daysOpen,
      eventCount: timelineEvents.length,
      attachmentCount: attachments.length,
      firstResponseHours,
    },
    alert,
    permissions,
  };
}

async function assertTransactionAccess(userId, transactionId) {
  const transaction = await EscrowTransaction.findByPk(transactionId);
  if (!transaction) {
    throw new NotFoundError('Escrow transaction not found');
  }
  if (transaction.initiatedById !== userId && transaction.counterpartyId !== userId) {
    throw new AuthorizationError('You do not have access to this transaction');
  }
  return transaction;
}

async function loadDisputeForUser(userId, disputeId) {
  const dispute = await DisputeCase.findByPk(disputeId, {
    include: [
      {
        model: EscrowTransaction,
        as: 'transaction',
      },
    ],
  });
  if (!dispute) {
    throw new NotFoundError('Dispute not found');
  }
  const transaction = dispute.get('transaction') ?? dispute.transaction;
  if (!transaction || (transaction.initiatedById !== userId && transaction.counterpartyId !== userId && dispute.openedById !== userId)) {
    throw new AuthorizationError('You do not have access to this dispute');
  }
  return dispute;
}

function resolveActorType(userId, transaction) {
  if (transaction.initiatedById === userId) {
    return 'customer';
  }
  if (transaction.counterpartyId === userId) {
    return 'provider';
  }
  return 'customer';
}

export async function listUserDisputes(userId, { stage, status } = {}) {
  if (!userId) {
    throw new ValidationError('userId is required');
  }
  const filters = {};
  if (stage && DISPUTE_STAGES.includes(stage)) {
    filters.stage = stage;
  }
  if (status && DISPUTE_STATUSES.includes(status)) {
    filters.status = status;
  }

  const disputes = await DisputeCase.findAll({
    where: {
      ...filters,
      [Op.or]: [
        { '$transaction.initiatedById$': userId },
        { '$transaction.counterpartyId$': userId },
        { openedById: userId },
      ],
    },
    include: [
      {
        model: EscrowTransaction,
        as: 'transaction',
        required: true,
        include: [
          { model: User, as: 'initiator', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: User, as: 'counterparty', attributes: ['id', 'firstName', 'lastName', 'email'] },
        ],
      },
      { model: User, as: 'openedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'assignedTo', attributes: ['id', 'firstName', 'lastName', 'email'] },
      {
        model: DisputeEvent,
        as: 'events',
        separate: true,
        include: [{ model: User, as: 'actor', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        order: [['eventAt', 'ASC']],
      },
    ],
    order: [
      ['priority', 'DESC'],
      ['updatedAt', 'DESC'],
    ],
    distinct: true,
  });

  const decorated = disputes.map(decorateDispute);

  const eligibleTransactions = await EscrowTransaction.findAll({
    where: {
      [Op.or]: [
        { initiatedById: userId },
        { counterpartyId: userId },
      ],
      status: Array.from(ACTIVE_TRANSACTION_STATUSES),
    },
    order: [['updatedAt', 'DESC']],
    limit: 50,
  });

  return {
    summary: buildSummary(decorated),
    disputes: decorated,
    eligibleTransactions: eligibleTransactions.map((transaction) => {
      const plain = toPlainTransaction(transaction);
      const actorType = resolveActorType(userId, transaction);
      return {
        ...plain,
        actorType,
        eligibleForDispute: ACTIVE_TRANSACTION_STATUSES.has(transaction.status),
      };
    }),
    metadata: buildMetadata(),
    permissions: {
      canCreate: eligibleTransactions.length > 0,
    },
  };
}

export async function getUserDispute(userId, disputeId) {
  if (!userId || !disputeId) {
    throw new ValidationError('userId and disputeId are required');
  }
  const dispute = await DisputeCase.findByPk(disputeId, {
    include: [
      {
        model: EscrowTransaction,
        as: 'transaction',
        required: true,
        include: [
          { model: User, as: 'initiator', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: User, as: 'counterparty', attributes: ['id', 'firstName', 'lastName', 'email'] },
        ],
      },
      { model: User, as: 'openedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'assignedTo', attributes: ['id', 'firstName', 'lastName', 'email'] },
      {
        model: DisputeEvent,
        as: 'events',
        separate: true,
        include: [{ model: User, as: 'actor', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        order: [['eventAt', 'ASC']],
      },
    ],
  });
  if (!dispute) {
    throw new NotFoundError('Dispute not found');
  }
  const transaction = dispute.get('transaction') ?? dispute.transaction;
  if (!transaction || (transaction.initiatedById !== userId && transaction.counterpartyId !== userId && dispute.openedById !== userId)) {
    throw new AuthorizationError('You do not have access to this dispute');
  }
  return decorateDispute(dispute);
}

export async function createUserDispute(userId, payload) {
  if (!userId) {
    throw new ValidationError('userId is required');
  }
  const {
    escrowTransactionId,
    reasonCode,
    priority = 'medium',
    summary,
    customerDeadlineAt,
    providerDeadlineAt,
    metadata,
  } = payload ?? {};

  if (!escrowTransactionId || !reasonCode || !summary) {
    throw new ValidationError('escrowTransactionId, reasonCode, and summary are required');
  }

  const transaction = await assertTransactionAccess(userId, escrowTransactionId);
  if (!ACTIVE_TRANSACTION_STATUSES.has(transaction.status)) {
    throw new ValidationError('Disputes can only be opened for funded or in-escrow transactions');
  }

  const dispute = await trustService.createDisputeCase({
    escrowTransactionId,
    openedById: userId,
    priority,
    reasonCode,
    summary,
    customerDeadlineAt: customerDeadlineAt ?? null,
    providerDeadlineAt: providerDeadlineAt ?? null,
    metadata: metadata ?? null,
  });

  return getUserDispute(userId, dispute.id);
}

export async function appendUserDisputeEvent(userId, disputeId, payload) {
  if (!userId || !disputeId) {
    throw new ValidationError('userId and disputeId are required');
  }
  const dispute = await loadDisputeForUser(userId, disputeId);
  const transaction = dispute.get('transaction') ?? dispute.transaction;
  const actorType = resolveActorType(userId, transaction ?? {});

  const {
    notes,
    actionType = 'comment',
    stage,
    status,
    customerDeadlineAt,
    providerDeadlineAt,
    resolutionNotes,
    evidence,
    transactionResolution,
    metadata: rawMetadata,
  } = payload ?? {};

  if (!notes && !evidence?.content) {
    throw new ValidationError('A note or evidence upload is required to update the dispute');
  }

  if (stage && !DISPUTE_STAGES.includes(stage)) {
    throw new ValidationError('Invalid dispute stage supplied');
  }

  if (status && !DISPUTE_STATUSES.includes(status)) {
    throw new ValidationError('Invalid dispute status supplied');
  }

  const allowedStatusChanges = ['open', 'awaiting_customer', 'under_review', 'settled'];
  const nextStatus = status && allowedStatusChanges.includes(status) ? status : undefined;
  const nextStage = stage && DISPUTE_STAGES.includes(stage) ? stage : undefined;

  const metadata = isPlainObject(rawMetadata) ? { ...rawMetadata } : {};

  const eventPayload = {
    actorId: userId,
    actorType,
    actionType: DISPUTE_ACTION_TYPES.includes(actionType) ? actionType : 'comment',
    notes: notes ?? null,
    stage: nextStage,
    status: nextStatus,
    customerDeadlineAt,
    providerDeadlineAt,
    resolutionNotes,
    evidence,
    transactionResolution,
    metadata: {
      ...metadata,
      caseStageBefore: dispute.stage,
      caseStatusBefore: dispute.status,
      caseStageAfter: nextStage ?? dispute.stage,
      caseStatusAfter: nextStatus ?? dispute.status,
      customerDeadlineAt: customerDeadlineAt ?? dispute.customerDeadlineAt ?? null,
      providerDeadlineAt: providerDeadlineAt ?? dispute.providerDeadlineAt ?? null,
      actorRole: metadata.actorRole ?? actorType,
    },
  };

  const result = await trustService.appendDisputeEvent(disputeId, eventPayload);
  return getUserDispute(userId, result.dispute.id);
}

export async function getUserDisputeOverview(userId) {
  const data = await listUserDisputes(userId);
  return {
    summary: data.summary,
    metadata: data.metadata,
    permissions: data.permissions,
  };
}

export default {
  listUserDisputes,
  getUserDispute,
  createUserDispute,
  appendUserDisputeEvent,
  getUserDisputeOverview,
};
