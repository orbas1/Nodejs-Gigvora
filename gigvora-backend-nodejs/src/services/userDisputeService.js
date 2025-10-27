import { Op } from 'sequelize';
import {
  DisputeCase,
  DisputeEvent,
  DisputeWorkflowSetting,
  EscrowTransaction,
  User,
} from '../models/index.js';
import trustService from './trustService.js';
import { ValidationError, NotFoundError, AuthorizationError } from '../utils/errors.js';

const CUSTOMER_STATUSES = new Set(['open', 'awaiting_customer', 'under_review']);
const ACTIVE_TRANSACTION_STATUSES = new Set(['funded', 'in_escrow', 'disputed']);
const RESOLVED_STATUSES = new Set(['settled', 'closed']);
const ESCALATED_STAGES = new Set(['mediation', 'arbitration', 'resolved']);
const RESPONDER_ACTORS = new Set(['mediator', 'admin', 'provider']);
const ALERT_SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const REASON_CODE_FALLBACK = [
  'quality_issue',
  'scope_disagreement',
  'missed_deadline',
  'communication_breakdown',
  'fraud_concern',
  'payment_issue',
];

function deriveEnumValues(model, attribute, fallback) {
  const values = model.rawAttributes?.[attribute]?.values;
  if (Array.isArray(values) && values.length) {
    return [...values];
  }
  return [...fallback];
}

const STAGE_VALUES = deriveEnumValues(DisputeCase, 'stage', ['intake', 'mediation', 'arbitration', 'resolved']);
const STATUS_VALUES = deriveEnumValues(DisputeCase, 'status', ['open', 'awaiting_customer', 'under_review', 'settled', 'closed']);
const PRIORITY_VALUES = deriveEnumValues(DisputeCase, 'priority', ['low', 'medium', 'high', 'urgent']);
const ACTOR_TYPE_VALUES = deriveEnumValues(DisputeEvent, 'actorType', ['customer', 'provider', 'mediator', 'admin', 'system']);
const ACTION_TYPE_VALUES = deriveEnumValues(DisputeEvent, 'actionType', [
  'comment',
  'evidence_upload',
  'deadline_adjusted',
  'stage_advanced',
  'status_change',
  'system_notice',
]);

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
  };
}

function humanize(value) {
  return value
    .toString()
    .replace(/[_-]+/g, ' ')
    .replace(/(^|\s)([a-z])/g, (match, boundary, letter) => `${boundary}${letter.toUpperCase()}`)
    .trim();
}

function buildMetadata(workflow, reasonCodes = REASON_CODE_FALLBACK) {
  const addLabel = (value) => ({ value, label: humanize(value) });
  return {
    stages: STAGE_VALUES.map(addLabel),
    statuses: STATUS_VALUES.map(addLabel),
    priorities: PRIORITY_VALUES.map(addLabel),
    reasonCodes: Array.from(new Set(reasonCodes)).map(addLabel),
    actionTypes: ACTION_TYPE_VALUES.map(addLabel),
    actorTypes: ACTOR_TYPE_VALUES.map(addLabel),
    workflow,
  };
}

function parseDateTime(value) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatOwner(user) {
  if (!user) {
    return null;
  }
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (fullName) {
    return fullName;
  }
  return user.email ?? null;
}

function computeFirstResponseMinutes(dispute) {
  if (!Array.isArray(dispute.events) || dispute.events.length === 0) {
    return null;
  }
  const openedAt = parseDateTime(dispute.openedAt);
  if (!openedAt) {
    return null;
  }
  const responderEvent = dispute.events.find((event) => RESPONDER_ACTORS.has(event.actorType));
  if (!responderEvent) {
    return null;
  }
  const eventAt = parseDateTime(responderEvent.eventAt ?? responderEvent.createdAt);
  if (!eventAt) {
    return null;
  }
  const diff = (eventAt.getTime() - openedAt.getTime()) / (1000 * 60);
  if (!Number.isFinite(diff) || diff < 0) {
    return null;
  }
  return Number(diff.toFixed(1));
}

function computeTrustScore({
  total,
  resolutionRate,
  autoEscalationRate,
  averageFirstResponseMinutes,
  slaBreaches,
  responseTargetMinutes,
}) {
  if (!total) {
    return null;
  }

  let score = 60;

  if (typeof resolutionRate === 'number') {
    score += Math.round(resolutionRate * 24);
  }

  if (typeof autoEscalationRate === 'number') {
    score += Math.round(autoEscalationRate * 8);
  }

  if (typeof averageFirstResponseMinutes === 'number' && averageFirstResponseMinutes >= 0) {
    const target = responseTargetMinutes || 1440;
    const ratio = averageFirstResponseMinutes / target;
    const responseContribution = ratio <= 1 ? 12 : Math.max(0, 12 - (ratio - 1) * 18);
    score += Math.round(responseContribution);
  }

  if (slaBreaches > 0) {
    score -= Math.min(30, slaBreaches * 6);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildRiskAlertsForDispute(dispute, { now, resolutionTargetHours, responseTargetMinutes }) {
  const alerts = [];
  const owner = formatOwner(dispute.assignedTo);
  const truncatedSummary = dispute.summary?.length > 140 ? `${dispute.summary.slice(0, 137)}…` : dispute.summary;

  const addAlert = (suffix, severity, title, summary) => {
    alerts.push({
      id: `dispute-${dispute.id}-${suffix}`,
      disputeId: dispute.id,
      severity,
      title,
      summary,
      owner,
    });
  };

  const customerDeadline = parseDateTime(dispute.customerDeadlineAt);
  const providerDeadline = parseDateTime(dispute.providerDeadlineAt);
  const overdueDeadline = [customerDeadline, providerDeadline]
    .filter(Boolean)
    .find((deadline) => deadline.getTime() < now.getTime());

  if (overdueDeadline) {
    addAlert(
      'sla',
      'critical',
      'SLA window breached',
      truncatedSummary ?? 'Response window has elapsed without resolution.',
    );
    return alerts;
  }

  if (dispute.priority === 'urgent') {
    addAlert(
      'priority',
      'critical',
      'Urgent dispute needs action',
      truncatedSummary ?? 'Escalate with stakeholders to prevent trust impact.',
    );
  } else if (dispute.priority === 'high') {
    addAlert(
      'priority',
      'high',
      'High-priority case under review',
      truncatedSummary ?? 'Coordinate updates with the assigned specialist.',
    );
  }

  if (dispute.status === 'awaiting_customer') {
    addAlert(
      'awaiting',
      'high',
      'Awaiting customer response',
      truncatedSummary ?? 'Follow up with the customer to keep momentum.',
    );
  }

  const daysOpen = dispute.metrics?.daysOpen ?? 0;
  const agingThreshold = Math.max(2, Math.ceil((resolutionTargetHours || 120) / 24));
  if (daysOpen > agingThreshold) {
    addAlert(
      'aging',
      'medium',
      'Case aging beyond target',
      truncatedSummary ?? 'Resolution cadence has slowed below trust targets.',
    );
  }

  const firstResponseMinutes = computeFirstResponseMinutes(dispute);
  if (typeof firstResponseMinutes === 'number' && firstResponseMinutes > responseTargetMinutes) {
    addAlert(
      'response',
      'medium',
      'Slow first response detected',
      truncatedSummary ?? 'Ensure future responses land within SLA expectations.',
    );
  }

  if (ESCALATED_STAGES.has(dispute.stage)) {
    const exposureAmount = Number.parseFloat(
      dispute.transaction?.netAmount ?? dispute.transaction?.amount ?? 0,
    );
    if (Number.isFinite(exposureAmount) && exposureAmount >= 1500) {
      const exposureCurrency = dispute.transaction?.currencyCode || 'USD';
      addAlert(
        'exposure',
        'medium',
        'High-value dispute escalated',
        `Escrow exposure ${exposureAmount.toLocaleString('en-GB', { maximumFractionDigits: 0 })} ${
          exposureCurrency
        } requires close monitoring.`,
      );
    }
  }

  return alerts;
}

function buildSummary(disputes, workflowSettings) {
  if (!Array.isArray(disputes) || disputes.length === 0) {
    return {
      total: 0,
      openCount: 0,
      awaitingCustomerAction: 0,
      escalatedCount: 0,
      lastUpdatedAt: null,
      upcomingDeadlines: [],
      resolutionRate: null,
      averageFirstResponseMinutes: null,
      autoEscalationRate: null,
      slaBreaches: 0,
      trustScore: null,
      openExposure: null,
      riskAlerts: [],
      nextSlaReviewAt: null,
    };
  }

  const upcomingDeadlines = [];
  const riskAlerts = [];
  const firstResponseSamples = [];
  const exposures = new Map();
  let openCount = 0;
  let awaitingCustomerAction = 0;
  let escalatedCount = 0;
  let resolvedCount = 0;
  let lastUpdatedAt = null;
  let slaBreaches = 0;

  const now = new Date();
  const responseTargetMinutes = (workflowSettings?.responseSlaHours ?? 24) * 60;
  const resolutionTargetHours = workflowSettings?.resolutionSlaHours ?? 120;

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
    if (RESOLVED_STATUSES.has(dispute.status)) {
      resolvedCount += 1;
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
        summary: dispute.summary,
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
        summary: dispute.summary,
      });
    }

    const deadlines = [dispute.customerDeadlineAt, dispute.providerDeadlineAt]
      .map((deadline) => parseDateTime(deadline))
      .filter(Boolean);
    if (deadlines.some((deadline) => deadline.getTime() < now.getTime() && CUSTOMER_STATUSES.has(dispute.status))) {
      slaBreaches += 1;
    }

    const firstResponse = computeFirstResponseMinutes(dispute);
    if (typeof firstResponse === 'number') {
      firstResponseSamples.push(firstResponse);
    }

    const alertCandidates = buildRiskAlertsForDispute(dispute, {
      now,
      resolutionTargetHours,
      responseTargetMinutes,
    });
    alertCandidates.forEach((alert) => riskAlerts.push(alert));

    if (!RESOLVED_STATUSES.has(dispute.status)) {
      const currency = dispute.transaction?.currencyCode ?? 'USD';
      const amount = Number.parseFloat(dispute.transaction?.netAmount ?? dispute.transaction?.amount ?? 0) || 0;
      if (amount > 0) {
        exposures.set(currency, (exposures.get(currency) ?? 0) + amount);
      }
    }
  });

  upcomingDeadlines.sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));

  riskAlerts.sort((a, b) => {
    const orderA = ALERT_SEVERITY_ORDER[a.severity] ?? 99;
    const orderB = ALERT_SEVERITY_ORDER[b.severity] ?? 99;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.id.localeCompare(b.id);
  });

  const firstResponseAverage =
    firstResponseSamples.length === 0
      ? null
      : Number((firstResponseSamples.reduce((total, value) => total + value, 0) / firstResponseSamples.length).toFixed(1));

  const resolutionRate = disputes.length ? resolvedCount / disputes.length : null;
  const autoEscalationRate = disputes.length ? escalatedCount / disputes.length : null;

  let openExposure = null;
  if (exposures.size === 1) {
    const [[currency, total]] = Array.from(exposures.entries());
    openExposure = { amount: Number(total.toFixed(2)), currency };
  } else if (exposures.size > 1) {
    const total = Array.from(exposures.values()).reduce((sum, value) => sum + value, 0);
    openExposure = { amount: Number(total.toFixed(2)), currency: 'USD' };
  }

  const nextSlaReviewAt = upcomingDeadlines.length
    ? upcomingDeadlines[0].dueAt
    : new Date(now.getTime() + (workflowSettings?.responseSlaHours ?? 24) * 60 * 60 * 1000).toISOString();

  const trustScore = computeTrustScore({
    total: disputes.length,
    resolutionRate,
    autoEscalationRate,
    averageFirstResponseMinutes: firstResponseAverage,
    slaBreaches,
    responseTargetMinutes,
  });

  return {
    total: disputes.length,
    openCount,
    awaitingCustomerAction,
    escalatedCount,
    lastUpdatedAt: lastUpdatedAt ? lastUpdatedAt.toISOString() : null,
    upcomingDeadlines: upcomingDeadlines.slice(0, 5),
    resolutionRate,
    averageFirstResponseMinutes: firstResponseAverage,
    autoEscalationRate,
    slaBreaches,
    trustScore,
    openExposure,
    riskAlerts: riskAlerts.slice(0, 5),
    nextSlaReviewAt,
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

  const attachments = events.filter((event) => Boolean(event.evidenceUrl)).map((event) => ({
    id: `${event.id}`,
    fileName: event.evidenceFileName,
    url: event.evidenceUrl,
    uploadedAt: event.eventAt,
    contentType: event.evidenceContentType ?? 'application/octet-stream',
  }));

  const permissions = {
    canAddEvidence: !['settled', 'closed'].includes(disputePlain.status),
    canRequestMediation: disputePlain.stage === 'intake',
    canEscalate: disputePlain.stage !== 'arbitration' && disputePlain.stage !== 'resolved',
    canClose: disputePlain.status !== 'closed',
  };

  return {
    ...disputePlain,
    transaction,
    openedBy,
    assignedTo,
    events,
    attachments,
    metrics: {
      daysOpen,
      eventCount: events.length,
      attachmentCount: attachments.length,
    },
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
  if (stage && STAGE_VALUES.includes(stage)) {
    filters.stage = stage;
  }
  if (status && STATUS_VALUES.includes(status)) {
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

  const workspaceIds = new Set(
    decorated
      .map((dispute) => {
        const fromMetadata = dispute.metadata?.workspaceId ?? dispute.metadata?.workspace?.id;
        const fromTransaction = dispute.transaction?.metadata?.workspaceId ?? dispute.transaction?.metadata?.workspace?.id;
        return fromMetadata ?? fromTransaction ?? null;
      })
      .filter((value) => value != null)
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isInteger(value)),
  );

  let workflowSettings = null;
  if (workspaceIds.size === 1) {
    const [workspaceId] = Array.from(workspaceIds);
    const { settings } = await trustService.getDisputeWorkflowSettings({ workspaceId });
    workflowSettings = settings;
  } else {
    const workflowSettingRecord = await DisputeWorkflowSetting.findOne({ order: [['updatedAt', 'DESC']] });
    if (workflowSettingRecord) {
      workflowSettings = workflowSettingRecord.toPublicObject();
    } else {
      const { settings } = await trustService.getDisputeWorkflowSettings();
      workflowSettings = settings;
    }
  }

  const summary = buildSummary(decorated, workflowSettings);

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

  const reasonCodes = Array.from(
    new Set([
      ...REASON_CODE_FALLBACK,
      ...decorated.map((dispute) => dispute.reasonCode).filter(Boolean),
    ]),
  );

  return {
    summary,
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
    metadata: buildMetadata(workflowSettings, reasonCodes),
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
  } = payload ?? {};

  if (!notes && !evidence?.content) {
    throw new ValidationError('A note or evidence upload is required to update the dispute');
  }

  if (stage && !STAGE_VALUES.includes(stage)) {
    throw new ValidationError('Invalid dispute stage supplied');
  }

  if (status && !STATUS_VALUES.includes(status)) {
    throw new ValidationError('Invalid dispute status supplied');
  }

  const allowedStatusChanges = ['open', 'awaiting_customer', 'under_review', 'settled'];
  const nextStatus = status && allowedStatusChanges.includes(status) ? status : undefined;
  const nextStage = stage && STAGE_VALUES.includes(stage) ? stage : undefined;

  const eventPayload = {
    actorId: userId,
    actorType,
    actionType: ACTION_TYPE_VALUES.includes(actionType) ? actionType : 'comment',
    notes: notes ?? null,
    stage: nextStage,
    status: nextStatus,
    customerDeadlineAt,
    providerDeadlineAt,
    resolutionNotes,
    evidence,
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

export const __testables__ = {
  buildSummary,
  buildMetadata,
  computeFirstResponseMinutes,
  formatOwner,
  STAGE_VALUES,
  STATUS_VALUES,
  PRIORITY_VALUES,
  ACTOR_TYPE_VALUES,
  ACTION_TYPE_VALUES,
  REASON_CODE_FALLBACK,
};
