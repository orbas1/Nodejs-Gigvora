import { randomUUID } from 'crypto';
import { Op } from 'sequelize';
import {
  sequelize,
  GigOrder,
  GigOrderRequirement,
  GigOrderRevision,
  GigOrderPayout,
  GIG_ORDER_PIPELINE_STATUSES,
  GIG_ORDER_REQUIREMENT_STATUSES,
  GIG_ORDER_REQUIREMENT_PRIORITIES,
  GIG_ORDER_REVISION_WORKFLOW_STATUSES,
  GIG_ORDER_PAYOUT_STATUSES,
  GIG_ORDER_STATUSES,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const DEFAULT_LOOKBACK_DAYS = 120;
const MAX_LOOKBACK_DAYS = 365;
const REQUIREMENT_OVERDUE_DAYS = 3;
const DELIVERY_SOON_THRESHOLD_DAYS = 3;

const ORDER_INCLUDES = [
  { model: GigOrderRequirement, as: 'requirements' },
  { model: GigOrderRevision, as: 'revisions' },
  { model: GigOrderPayout, as: 'payouts' },
  { association: 'freelancer', attributes: ['id', 'firstName', 'lastName', 'email'] },
  { association: 'client', attributes: ['id', 'firstName', 'lastName', 'email'] },
  { association: 'gig', attributes: ['id', 'title', 'slug'] },
];

const PAYOUT_TO_ESCROW_STATUS = Object.freeze({
  pending: 'funded',
  scheduled: 'pending_release',
  released: 'released',
  at_risk: 'held',
  on_hold: 'held',
});

const ESCROW_TO_PAYOUT_STATUS = Object.freeze({
  funded: 'pending',
  pending_release: 'scheduled',
  released: 'released',
  held: 'on_hold',
  disputed: 'at_risk',
  cancelled: 'on_hold',
});

function normalizeId(value, fieldName = 'id', { optional = false } = {}) {
  if ((value == null || value === '') && optional) {
    return null;
  }
  if (value == null || value === '') {
    throw new ValidationError(`${fieldName} is required.`);
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return parsed;
}

function normalizeAmount(value, fieldName) {
  if (value == null || value === '') {
    return 0;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new ValidationError(`${fieldName} must be a non-negative number.`);
  }
  return Number(numeric.toFixed(2));
}

function normalizeCurrency(value, fallback = 'USD') {
  if (value == null || value === '') {
    return fallback;
  }
  if (typeof value !== 'string') {
    throw new ValidationError('Currency codes must be strings.');
  }
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) {
    return fallback;
  }
  if (!/^\w{3}$/.test(trimmed)) {
    throw new ValidationError('Currency codes must be three characters long.');
  }
  return trimmed;
}

function normalizeCsat(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('CSAT score must be numeric.');
  }
  if (numeric < 0 || numeric > 5) {
    throw new ValidationError('CSAT score must be between 0 and 5.');
  }
  return Number(numeric.toFixed(2));
}

function normalizeTags(tags) {
  if (tags == null) {
    return [];
  }
  if (Array.isArray(tags)) {
    return tags.map((tag) => (typeof tag === 'string' ? tag.trim() : String(tag))).filter(Boolean);
  }
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  if (typeof tags === 'object') {
    return Object.values(tags)
      .map((tag) => (typeof tag === 'string' ? tag.trim() : String(tag)))
      .filter(Boolean);
  }
  throw new ValidationError('Tags must be an array, comma-separated string, or object.');
}

function sanitizeDate(value) {
  if (value == null || value === '') {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError('Invalid date value provided.');
  }
  return date;
}

function clampLookbackDays(value) {
  if (value == null || value === '') {
    return DEFAULT_LOOKBACK_DAYS;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return DEFAULT_LOOKBACK_DAYS;
  }
  return Math.min(Math.round(numeric), MAX_LOOKBACK_DAYS);
}

function parseMetadata(raw) {
  if (!raw) {
    return {};
  }
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) ?? {};
    } catch (error) {
      return {};
    }
  }
  if (typeof raw === 'object') {
    return { ...raw };
  }
  return {};
}

function mergeMetadata(current, updates) {
  const base = parseMetadata(current);
  return {
    ...base,
    ...updates,
  };
}

function generateOrderNumber() {
  return `ORD-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function mapPipelineStageToWorkflowStatus(stage) {
  switch (stage) {
    case 'qualification':
    case 'inquiry':
      return 'awaiting_requirements';
    case 'kickoff_scheduled':
    case 'production':
      return 'in_progress';
    case 'delivery':
      return 'ready_for_payout';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    case 'on_hold':
      return 'paused';
    default:
      return 'awaiting_requirements';
  }
}

function derivePipelineStage(workflowStatus, metadataStage) {
  if (metadataStage && GIG_ORDER_PIPELINE_STATUSES.includes(metadataStage)) {
    return metadataStage;
  }
  switch (workflowStatus) {
    case 'awaiting_requirements':
      return 'qualification';
    case 'in_progress':
      return 'production';
    case 'revision_requested':
      return 'delivery';
    case 'ready_for_payout':
      return 'delivery';
    case 'completed':
      return 'completed';
    case 'paused':
      return 'on_hold';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'inquiry';
  }
}

function deriveStatusType(workflowStatus) {
  if (workflowStatus === 'completed') {
    return 'completed';
  }
  if (workflowStatus === 'cancelled') {
    return 'cancelled';
  }
  return 'open';
}

function deriveIntakeStatus(requirements = [], metadataStatus) {
  if (metadataStatus && ['not_started', 'in_progress', 'completed'].includes(metadataStatus)) {
    return metadataStatus;
  }
  if (!requirements.length) {
    return 'not_started';
  }
  const hasPending = requirements.some((req) => req.status === 'pending');
  const hasReceived = requirements.some((req) => req.status === 'received');
  if (!hasPending && hasReceived) {
    return 'completed';
  }
  return 'in_progress';
}

function deriveKickoffStatus(kickoffScheduledAt, metadataStatus, metadataCompletedAt) {
  if (metadataStatus && ['not_scheduled', 'scheduled', 'completed', 'needs_reschedule'].includes(metadataStatus)) {
    return metadataStatus;
  }
  if (!kickoffScheduledAt) {
    return 'not_scheduled';
  }
  if (metadataCompletedAt) {
    return 'completed';
  }
  const now = Date.now();
  const scheduledTime = new Date(kickoffScheduledAt).getTime();
  if (Number.isNaN(scheduledTime)) {
    return 'not_scheduled';
  }
  if (scheduledTime < now) {
    return 'needs_reschedule';
  }
  return 'scheduled';
}

function deriveRequirementForms(requirements = []) {
  return requirements.map((requirement) => {
    const status = requirement.status;
    let derivedStatus = 'pending_client';
    if (status === 'received') {
      derivedStatus = 'submitted';
    } else if (status === 'waived') {
      derivedStatus = 'approved';
    }
    return {
      id: requirement.id,
      orderId: requirement.orderId,
      status: derivedStatus,
      schemaVersion: requirement.metadata?.schemaVersion ?? null,
      questions: requirement.items ?? null,
      responses: requirement.metadata?.responses ?? null,
      requestedAt: requirement.requestedAt ?? requirement.createdAt ?? null,
      submittedAt: requirement.receivedAt ?? null,
      approvedAt: status === 'waived' ? requirement.receivedAt ?? null : null,
      reviewerId: null,
      lastReminderAt: requirement.metadata?.lastReminderAt ?? null,
      createdAt: requirement.createdAt ?? null,
      updatedAt: requirement.updatedAt ?? null,
    };
  });
}

function mapRevisionStatus(status) {
  if (['requested', 'in_progress'].includes(status)) {
    return 'open';
  }
  if (status === 'submitted') {
    return 'submitted';
  }
  if (status === 'approved') {
    return 'approved';
  }
  if (status === 'rejected') {
    return 'declined';
  }
  return status;
}

function deriveEscrowCheckpoints(payouts = []) {
  return payouts.map((payout) => ({
    id: payout.id,
    orderId: payout.orderId,
    label: payout.milestoneLabel,
    amount: payout.amount == null ? 0 : Number(payout.amount),
    currency: payout.currencyCode ?? 'USD',
    status: PAYOUT_TO_ESCROW_STATUS[payout.status] ?? 'funded',
    approvalRequirement: payout.metadata?.approvalRequirement ?? null,
    csatThreshold:
      payout.metadata?.csatThreshold == null ? null : Number(payout.metadata.csatThreshold),
    releasedAt: payout.releasedAt ?? null,
    releasedById: payout.metadata?.releasedById ?? null,
    payoutReference: payout.metadata?.payoutReference ?? null,
    notes: payout.riskNote ?? payout.metadata?.notes ?? null,
    createdAt: payout.createdAt ?? null,
    updatedAt: payout.updatedAt ?? null,
  }));
}

function collectEscrowTotals(escrowCheckpoints = []) {
  return escrowCheckpoints.reduce(
    (acc, checkpoint) => {
      const amount = Number(checkpoint.amount ?? 0);
      acc.totalFunded += amount;
      switch (checkpoint.status) {
        case 'released':
          acc.counts.released += 1;
          acc.amounts.releasedValue += amount;
          break;
        case 'pending_release':
          acc.counts.pendingRelease += 1;
          acc.amounts.outstanding += amount;
          break;
        case 'held':
          acc.counts.held += 1;
          acc.amounts.outstanding += amount;
          break;
        case 'funded':
          acc.counts.funded += 1;
          acc.amounts.outstanding += amount;
          break;
        case 'disputed':
          acc.counts.disputed += 1;
          acc.amounts.outstanding += amount;
          break;
        default:
          break;
      }
      return acc;
    },
    {
      counts: {
        funded: 0,
        pendingRelease: 0,
        released: 0,
        held: 0,
        disputed: 0,
      },
      amounts: {
        totalFunded: 0,
        outstanding: 0,
        releasedValue: 0,
      },
    },
  );
}

function augmentOrder(base, orderInstance) {
  const metadata = parseMetadata(base.metadata);
  const workflowStatus = base.status;
  const requirements = (orderInstance.requirements ?? []).map((record) => record.toPublicObject());
  const revisions = (orderInstance.revisions ?? []).map((record) => record.toPublicObject());
  const payouts = (orderInstance.payouts ?? []).map((record) => record.toPublicObject());
  const requirementForms = deriveRequirementForms(requirements);
  const escrowCheckpoints = deriveEscrowCheckpoints(payouts);

  const pipelineStage = derivePipelineStage(workflowStatus, metadata.pipelineStage);
  const statusType = deriveStatusType(workflowStatus);
  const intakeStatus = deriveIntakeStatus(requirements, metadata.intakeStatus);
  const kickoffScheduledAt = metadata.kickoffScheduledAt ?? base.kickoffDueAt ?? null;
  const kickoffStatus = deriveKickoffStatus(
    kickoffScheduledAt,
    metadata.kickoffStatus,
    metadata.kickoffCompletedAt,
  );
  const productionStartedAt = metadata.productionStartedAt ?? null;
  const deliveryDueAt = metadata.deliveryDueAt ?? base.dueAt ?? null;
  const deliveredAt = metadata.deliveredAt ?? base.completedAt ?? null;
  const csatScore = metadata.csatScore ?? null;
  const valueAmount = metadata.valueAmount ?? (base.amount == null ? 0 : Number(base.amount));
  const valueCurrency = metadata.valueCurrency ?? base.currencyCode ?? 'USD';
  const tags = normalizeTags(metadata.tags);
  const lastClientContactAt = metadata.lastClientContactAt ?? null;
  const nextClientTouchpointAt = metadata.nextClientTouchpointAt ?? null;
  const gigTitle = metadata.gigTitle ?? orderInstance.gig?.title ?? null;
  const workflowMetadata = {
    pipelineStage,
    status: statusType,
    intakeStatus,
    kickoffStatus,
    kickoffScheduledAt,
    productionStartedAt,
    deliveryDueAt,
    deliveredAt,
    csatScore,
    valueAmount,
    valueCurrency,
    escrowCurrency: metadata.escrowCurrency ?? valueCurrency,
    tags,
    lastClientContactAt,
    nextClientTouchpointAt,
    gigTitle,
  };

  const escrowAggregates = collectEscrowTotals(escrowCheckpoints);
  workflowMetadata.escrowTotalAmount = metadata.escrowTotalAmount ?? escrowAggregates.amounts.totalFunded;

  return {
    ...base,
    workflowStatus,
    status: statusType,
    pipelineStage,
    intakeStatus,
    kickoffStatus,
    kickoffScheduledAt,
    productionStartedAt,
    deliveryDueAt,
    deliveredAt,
    csatScore,
    valueAmount,
    valueCurrency,
    escrowCurrency: workflowMetadata.escrowCurrency,
    escrowTotalAmount: workflowMetadata.escrowTotalAmount,
    tags,
    lastClientContactAt,
    nextClientTouchpointAt,
    gigTitle,
    requirementForms,
    requirements,
    revisions: revisions.map((revision) => ({ ...revision, status: mapRevisionStatus(revision.status) })),
    rawRevisions: revisions,
    payouts,
    escrowCheckpoints,
    metadata: { ...metadata, ...workflowMetadata },
  };
}

function deriveOrderMetrics(order) {
  const pendingRequirementStatuses = new Set(['pending_client', 'in_progress']);
  const openRevisionStatuses = new Set(['requested', 'open', 'in_progress', 'submitted', 'declined']);
  const pendingEscrowStatuses = new Set(['funded', 'pending_release', 'held', 'disputed']);

  const pendingRequirements = (order.requirementForms ?? []).filter((form) =>
    pendingRequirementStatuses.has(form.status),
  ).length;
  const overdueRequirements = (order.requirementForms ?? []).filter((form) => {
    if (!['pending_client', 'in_progress'].includes(form.status)) {
      return false;
    }
    const requestedAt = form.requestedAt ? new Date(form.requestedAt) : null;
    if (!requestedAt || Number.isNaN(requestedAt.getTime())) {
      return false;
    }
    const ageDays = (Date.now() - requestedAt.getTime()) / (1000 * 60 * 60 * 24);
    return ageDays > REQUIREMENT_OVERDUE_DAYS;
  }).length;

  const openRevisions = (order.rawRevisions ?? order.revisions ?? []).filter((revision) =>
    openRevisionStatuses.has(revision.status),
  ).length;

  const outstandingEscrow = (order.escrowCheckpoints ?? []).reduce((sum, checkpoint) => {
    if (pendingEscrowStatuses.has(checkpoint.status)) {
      return sum + Number(checkpoint.amount ?? 0);
    }
    return sum;
  }, 0);

  const now = Date.now();
  let kickoffScheduled = 0;
  if (order.kickoffStatus === 'scheduled') {
    kickoffScheduled = 1;
  }
  let deliveryDueSoon = 0;
  if (order.deliveryDueAt) {
    const due = new Date(order.deliveryDueAt);
    if (!Number.isNaN(due.getTime())) {
      const diffDays = (due.getTime() - now) / (1000 * 60 * 60 * 24);
      if (diffDays >= 0 && diffDays <= DELIVERY_SOON_THRESHOLD_DAYS) {
        deliveryDueSoon = 1;
      }
    }
  }

  return {
    pendingRequirements,
    overdueRequirements,
    openRevisions,
    outstandingEscrow: Number(outstandingEscrow.toFixed(2)),
    kickoffScheduled,
    deliveryDueSoon,
  };
}

function buildPipelineSummary(orders) {
  const stageBuckets = Object.fromEntries(GIG_ORDER_PIPELINE_STATUSES.map((status) => [status, 0]));
  const requirementStats = {
    pending: 0,
    submitted: 0,
    approved: 0,
    needsRevision: 0,
    overdue: 0,
  };
  const revisionStats = {
    active: 0,
    awaitingReview: 0,
    completed: 0,
    declined: 0,
  };
  const escrowStats = {
    counts: {
      funded: 0,
      pendingRelease: 0,
      released: 0,
      held: 0,
      disputed: 0,
    },
    amounts: {
      totalFunded: 0,
      outstanding: 0,
      releasedValue: 0,
      currency: orders[0]?.valueCurrency ?? 'USD',
    },
  };

  let totalValue = 0;
  let openValue = 0;
  let completedValue = 0;
  let csatSum = 0;
  let csatCount = 0;
  let kickoffScheduled = 0;
  let deliveryDueSoon = 0;

  orders.forEach((order) => {
    stageBuckets[order.pipelineStage] = (stageBuckets[order.pipelineStage] ?? 0) + 1;
    totalValue += Number(order.valueAmount ?? 0);
    if (order.status === 'open') {
      openValue += Number(order.valueAmount ?? 0);
    }
    if (order.status === 'completed') {
      completedValue += Number(order.valueAmount ?? 0);
    }
    if (order.csatScore != null) {
      csatSum += Number(order.csatScore);
      csatCount += 1;
    }
    kickoffScheduled += order.kickoffStatus === 'scheduled' ? 1 : 0;

    if (order.deliveryDueAt) {
      const due = new Date(order.deliveryDueAt);
      if (!Number.isNaN(due.getTime())) {
        const diffDays = (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (diffDays >= 0 && diffDays <= DELIVERY_SOON_THRESHOLD_DAYS) {
          deliveryDueSoon += 1;
        }
      }
    }

    (order.requirementForms ?? []).forEach((form) => {
      if (form.status === 'pending_client') {
        requirementStats.pending += 1;
      } else if (form.status === 'submitted') {
        requirementStats.submitted += 1;
      } else if (form.status === 'approved') {
        requirementStats.approved += 1;
      } else if (form.status === 'needs_revision') {
        requirementStats.needsRevision += 1;
      }
      const requestedAt = form.requestedAt ? new Date(form.requestedAt) : null;
      if (
        requestedAt &&
        Number.isFinite(requestedAt.getTime()) &&
        form.status !== 'approved' &&
        !form.submittedAt
      ) {
        const ageDays = (Date.now() - requestedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (ageDays > REQUIREMENT_OVERDUE_DAYS) {
          requirementStats.overdue += 1;
        }
      }
    });

    (order.revisions ?? []).forEach((revision) => {
      if (['open', 'requested'].includes(revision.status)) {
        revisionStats.active += 1;
      } else if (revision.status === 'submitted') {
        revisionStats.awaitingReview += 1;
      } else if (revision.status === 'approved') {
        revisionStats.completed += 1;
      } else if (revision.status === 'declined') {
        revisionStats.declined += 1;
      }
    });

    const escrowAggregates = collectEscrowTotals(order.escrowCheckpoints);
    escrowStats.counts.funded += escrowAggregates.counts.funded;
    escrowStats.counts.pendingRelease += escrowAggregates.counts.pendingRelease;
    escrowStats.counts.released += escrowAggregates.counts.released;
    escrowStats.counts.held += escrowAggregates.counts.held;
    escrowStats.counts.disputed += escrowAggregates.counts.disputed;
    escrowStats.amounts.totalFunded += escrowAggregates.amounts.totalFunded;
    escrowStats.amounts.outstanding += escrowAggregates.amounts.outstanding;
    escrowStats.amounts.releasedValue += escrowAggregates.amounts.releasedValue;
  });

  return {
    totals: {
      orders: orders.length,
      openOrders: orders.filter((order) => order.status === 'open').length,
      closedOrders: orders.filter((order) => order.status !== 'open').length,
      totalValue: Number(totalValue.toFixed(2)),
      openValue: Number(openValue.toFixed(2)),
      completedValue: Number(completedValue.toFixed(2)),
      currency: orders[0]?.valueCurrency ?? 'USD',
    },
    pipeline: stageBuckets,
    requirementForms: requirementStats,
    revisions: revisionStats,
    escrow: {
      counts: escrowStats.counts,
      amounts: {
        totalFunded: Number(escrowStats.amounts.totalFunded.toFixed(2)),
        outstanding: Number(escrowStats.amounts.outstanding.toFixed(2)),
        releasedValue: Number(escrowStats.amounts.releasedValue.toFixed(2)),
        currency: escrowStats.amounts.currency,
      },
    },
    health: {
      csatAverage: csatCount ? Number((csatSum / csatCount).toFixed(2)) : null,
      kickoffScheduled,
      deliveryDueSoon,
    },
  };
}

async function fetchOrder(orderId, { transaction } = {}) {
  const order = await GigOrder.findByPk(orderId, { include: ORDER_INCLUDES, transaction });
  if (!order) {
    throw new NotFoundError('Order not found.');
  }
  return order;
}

function serializeOrder(orderInstance) {
  const base = orderInstance.toPublicObject();
  const augmented = augmentOrder(base, orderInstance);
  const metrics = deriveOrderMetrics(augmented);
  const sortedRequirementForms = [...(augmented.requirementForms ?? [])].sort((a, b) => {
    const first = new Date(a.requestedAt ?? a.createdAt ?? 0).getTime();
    const second = new Date(b.requestedAt ?? b.createdAt ?? 0).getTime();
    return second - first;
  });
  const sortedRevisions = [...(augmented.revisions ?? [])].sort((a, b) =>
    (b.roundNumber ?? 0) - (a.roundNumber ?? 0),
  );
  const sortedEscrow = [...(augmented.escrowCheckpoints ?? [])].sort((a, b) => {
    const first = new Date(a.createdAt ?? 0).getTime();
    const second = new Date(b.createdAt ?? 0).getTime();
    return first - second;
  });

  return {
    ...augmented,
    requirementForms: sortedRequirementForms,
    revisions: sortedRevisions,
    escrowCheckpoints: sortedEscrow,
    metrics,
  };
}

function prepareRequirementPayload(payload = {}) {
  const status = payload.status ?? 'pending';
  if (!GIG_ORDER_REQUIREMENT_STATUSES.includes(status)) {
    throw new ValidationError(
      `status must be one of: ${GIG_ORDER_REQUIREMENT_STATUSES.join(', ')}`,
    );
  }
  const priority = payload.priority ?? 'medium';
  if (!GIG_ORDER_REQUIREMENT_PRIORITIES.includes(priority)) {
    throw new ValidationError(
      `priority must be one of: ${GIG_ORDER_REQUIREMENT_PRIORITIES.join(', ')}`,
    );
  }
  const title = payload.title?.trim();
  if (!title) {
    throw new ValidationError('title is required.');
  }

  return {
    title,
    status,
    priority,
    requestedAt: sanitizeDate(payload.requestedAt),
    dueAt: sanitizeDate(payload.dueAt),
    receivedAt: sanitizeDate(payload.receivedAt),
    notes: payload.notes ?? null,
    items: payload.items ?? null,
    metadata: payload.metadata ?? null,
  };
}

function prepareRevisionPayload(orderId, payload = {}) {
  const status = payload.status ?? 'requested';
  if (!GIG_ORDER_REVISION_WORKFLOW_STATUSES.includes(status)) {
    throw new ValidationError(
      `status must be one of: ${GIG_ORDER_REVISION_WORKFLOW_STATUSES.join(', ')}`,
    );
  }
  const severity = payload.severity ?? 'medium';
  if (!['low', 'medium', 'high'].includes(severity)) {
    throw new ValidationError('severity must be one of: low, medium, high');
  }
  return {
    orderId,
    roundNumber: payload.roundNumber ?? payload.revisionNumber ?? 1,
    status,
    severity,
    focusAreas: payload.focusAreas ?? null,
    summary: payload.summary ?? null,
    requestedAt: sanitizeDate(payload.requestedAt) ?? new Date(),
    dueAt: sanitizeDate(payload.dueAt),
    submittedAt: sanitizeDate(payload.submittedAt),
    approvedAt: sanitizeDate(payload.approvedAt),
    metadata: payload.metadata ?? null,
  };
}

function prepareEscrowPayload(orderId, payload = {}) {
  const status = payload.status ?? 'funded';
  const payoutStatus = ESCROW_TO_PAYOUT_STATUS[status] ?? 'pending';
  if (!GIG_ORDER_PAYOUT_STATUSES.includes(payoutStatus)) {
    throw new ValidationError(
      `status must map to one of: ${GIG_ORDER_PAYOUT_STATUSES.join(', ')}`,
    );
  }
  const label = payload.label?.trim() || 'Milestone';
  return {
    orderId,
    milestoneLabel: label,
    amount: normalizeAmount(payload.amount ?? 0, 'amount'),
    currencyCode: normalizeCurrency(payload.currency ?? payload.currencyCode ?? 'USD'),
    status: payoutStatus,
    expectedAt: sanitizeDate(payload.expectedAt ?? payload.releasedAt),
    releasedAt: sanitizeDate(payload.releasedAt),
    riskNote: payload.notes ?? null,
    metadata: {
      ...(payload.metadata ?? {}),
      approvalRequirement: payload.approvalRequirement ?? null,
      csatThreshold: payload.csatThreshold ?? null,
      payoutReference: payload.payoutReference ?? null,
      releasedById: payload.releasedById ?? null,
    },
  };
}

export async function getFreelancerOrderPipeline(freelancerId, { lookbackDays } = {}) {
  const where = {};
  if (freelancerId != null && freelancerId !== '') {
    where.freelancerId = normalizeId(freelancerId, 'freelancerId');
  }
  const normalizedLookback = clampLookbackDays(lookbackDays);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - normalizedLookback);
  where.createdAt = { [Op.gte]: cutoff };

  const orders = await GigOrder.findAll({
    where,
    include: ORDER_INCLUDES,
    order: [['createdAt', 'DESC']],
  });

  const serialized = orders.map((orderInstance) => serializeOrder(orderInstance));

  return {
    summary: buildPipelineSummary(serialized),
    orders: serialized,
    meta: {
      lookbackDays: normalizedLookback,
      fetchedAt: new Date().toISOString(),
      filters: {
        freelancerId: where.freelancerId ?? null,
      },
    },
  };
}

function buildOrderMetadataFromPayload(order, payload) {
  const metadata = parseMetadata(order.metadata);
  const updates = {};
  if (payload.pipelineStage) {
    updates.pipelineStage = payload.pipelineStage;
  }
  if (payload.intakeStatus) {
    updates.intakeStatus = payload.intakeStatus;
  }
  if (payload.kickoffStatus) {
    updates.kickoffStatus = payload.kickoffStatus;
  }
  if (payload.kickoffScheduledAt !== undefined) {
    updates.kickoffScheduledAt = payload.kickoffScheduledAt
      ? sanitizeDate(payload.kickoffScheduledAt).toISOString()
      : null;
  }
  if (payload.productionStartedAt !== undefined) {
    updates.productionStartedAt = payload.productionStartedAt
      ? sanitizeDate(payload.productionStartedAt).toISOString()
      : null;
  }
  if (payload.deliveryDueAt !== undefined) {
    updates.deliveryDueAt = payload.deliveryDueAt
      ? sanitizeDate(payload.deliveryDueAt).toISOString()
      : null;
  }
  if (payload.deliveredAt !== undefined) {
    updates.deliveredAt = payload.deliveredAt
      ? sanitizeDate(payload.deliveredAt).toISOString()
      : null;
  }
  if (payload.csatScore !== undefined) {
    updates.csatScore = payload.csatScore == null ? null : normalizeCsat(payload.csatScore);
  }
  if (payload.valueAmount !== undefined) {
    updates.valueAmount = normalizeAmount(payload.valueAmount, 'valueAmount');
  }
  if (payload.valueCurrency !== undefined) {
    updates.valueCurrency = normalizeCurrency(payload.valueCurrency, order.currencyCode ?? 'USD');
  }
  if (payload.escrowTotalAmount !== undefined) {
    updates.escrowTotalAmount = normalizeAmount(payload.escrowTotalAmount, 'escrowTotalAmount');
  }
  if (payload.escrowCurrency !== undefined) {
    updates.escrowCurrency = normalizeCurrency(
      payload.escrowCurrency,
      updates.valueCurrency ?? order.currencyCode ?? 'USD',
    );
  }
  if (payload.tags !== undefined) {
    updates.tags = normalizeTags(payload.tags);
  }
  if (payload.lastClientContactAt !== undefined) {
    updates.lastClientContactAt = payload.lastClientContactAt
      ? sanitizeDate(payload.lastClientContactAt).toISOString()
      : null;
  }
  if (payload.nextClientTouchpointAt !== undefined) {
    updates.nextClientTouchpointAt = payload.nextClientTouchpointAt
      ? sanitizeDate(payload.nextClientTouchpointAt).toISOString()
      : null;
  }
  if (payload.gigTitle !== undefined) {
    updates.gigTitle = payload.gigTitle ?? null;
  }
  return mergeMetadata(metadata, updates);
}

export async function createFreelancerOrder(payload = {}) {
  const freelancerId = normalizeId(payload.freelancerId, 'freelancerId');
  const clientName = payload.clientName?.trim();
  const gigTitle = payload.gigTitle?.trim() ?? null;
  if (!clientName) {
    throw new ValidationError('clientName is required.');
  }
  const clientOrganization = payload.clientOrganization?.trim() || clientName;

  const pipelineStage = payload.pipelineStage ?? 'inquiry';
  if (!GIG_ORDER_PIPELINE_STATUSES.includes(pipelineStage)) {
    throw new ValidationError(
      `pipelineStage must be one of: ${GIG_ORDER_PIPELINE_STATUSES.join(', ')}`,
    );
  }
  const workflowStatus = payload.workflowStatus ?? mapPipelineStageToWorkflowStatus(pipelineStage);
  if (!GIG_ORDER_STATUSES.includes(workflowStatus)) {
    throw new ValidationError(`workflowStatus must be one of: ${GIG_ORDER_STATUSES.join(', ')}`);
  }

  const metadata = mergeMetadata(payload.metadata, {
    pipelineStage,
    intakeStatus: payload.intakeStatus ?? 'not_started',
    kickoffStatus: payload.kickoffStatus ?? 'not_scheduled',
    kickoffScheduledAt: payload.kickoffScheduledAt
      ? sanitizeDate(payload.kickoffScheduledAt).toISOString()
      : null,
    productionStartedAt: payload.productionStartedAt
      ? sanitizeDate(payload.productionStartedAt).toISOString()
      : null,
    deliveryDueAt: payload.deliveryDueAt ? sanitizeDate(payload.deliveryDueAt).toISOString() : null,
    deliveredAt: payload.deliveredAt ? sanitizeDate(payload.deliveredAt).toISOString() : null,
    csatScore: payload.csatScore == null ? null : normalizeCsat(payload.csatScore),
    valueAmount: normalizeAmount(payload.valueAmount ?? payload.value ?? 0, 'valueAmount'),
    valueCurrency: normalizeCurrency(payload.valueCurrency ?? payload.currency ?? 'USD'),
    escrowTotalAmount: normalizeAmount(
      payload.escrowTotalAmount ?? payload.escrowTotal ?? payload.valueAmount ?? 0,
      'escrowTotalAmount',
    ),
    escrowCurrency: normalizeCurrency(
      payload.escrowCurrency ?? payload.escrowCurrencyCode ?? payload.valueCurrency ?? 'USD',
    ),
    tags: normalizeTags(payload.tags ?? []),
    lastClientContactAt: payload.lastClientContactAt
      ? sanitizeDate(payload.lastClientContactAt).toISOString()
      : null,
    nextClientTouchpointAt: payload.nextClientTouchpointAt
      ? sanitizeDate(payload.nextClientTouchpointAt).toISOString()
      : null,
    gigTitle,
  });

  const orderNumber = payload.orderNumber?.trim() || generateOrderNumber();

  const order = await sequelize.transaction(async (transaction) => {
    const createdOrder = await GigOrder.create(
      {
        orderNumber,
        freelancerId,
        clientId: payload.clientId ? normalizeId(payload.clientId, 'clientId') : null,
        gigId: payload.gigId ? normalizeId(payload.gigId, 'gigId') : null,
        clientCompanyName: clientOrganization,
        clientContactName: clientName,
        clientContactEmail: payload.clientEmail?.trim() || null,
        clientContactPhone: payload.clientPhone?.trim() || null,
        status: workflowStatus,
        currencyCode: metadata.valueCurrency,
        amount: metadata.valueAmount,
        progressPercent: payload.progressPercent ?? 0,
        submittedAt: sanitizeDate(payload.submittedAt) ?? new Date(),
        kickoffDueAt: metadata.kickoffScheduledAt ? new Date(metadata.kickoffScheduledAt) : null,
        dueAt: metadata.deliveryDueAt ? new Date(metadata.deliveryDueAt) : null,
        completedAt: metadata.deliveredAt ? new Date(metadata.deliveredAt) : null,
        metadata,
      },
      { transaction },
    );

    const requirementPayload = payload.requirementForms ?? payload.requirements ?? [];
    if (Array.isArray(requirementPayload) && requirementPayload.length) {
      const requirements = requirementPayload.map((form) => ({
        orderId: createdOrder.id,
        ...prepareRequirementPayload(form),
      }));
      await GigOrderRequirement.bulkCreate(requirements, { transaction });
    }

    if (Array.isArray(payload.revisions) && payload.revisions.length) {
      const revisions = payload.revisions.map((revision) =>
        prepareRevisionPayload(createdOrder.id, revision),
      );
      await GigOrderRevision.bulkCreate(revisions, { transaction });
    }

    const escrowPayload = payload.escrowCheckpoints ?? payload.payouts ?? [];
    if (Array.isArray(escrowPayload) && escrowPayload.length) {
      const checkpoints = escrowPayload.map((checkpoint) =>
        prepareEscrowPayload(createdOrder.id, checkpoint),
      );
      await GigOrderPayout.bulkCreate(checkpoints, { transaction });
    }

    return fetchOrder(createdOrder.id, { transaction });
  });

  return serializeOrder(order);
}

export async function updateFreelancerOrder(orderId, payload = {}) {
  const id = normalizeId(orderId, 'orderId');
  const order = await fetchOrder(id);

  const updates = {};
  if (payload.pipelineStage != null) {
    if (!GIG_ORDER_PIPELINE_STATUSES.includes(payload.pipelineStage)) {
      throw new ValidationError(
        `pipelineStage must be one of: ${GIG_ORDER_PIPELINE_STATUSES.join(', ')}`,
      );
    }
    const mappedStatus = mapPipelineStageToWorkflowStatus(payload.pipelineStage);
    updates.status = mappedStatus;
  }
  if (payload.workflowStatus != null) {
    if (!GIG_ORDER_STATUSES.includes(payload.workflowStatus)) {
      throw new ValidationError(`workflowStatus must be one of: ${GIG_ORDER_STATUSES.join(', ')}`);
    }
    updates.status = payload.workflowStatus;
  }
  if (payload.clientName !== undefined) {
    updates.clientContactName = payload.clientName?.trim() || null;
  }
  if (payload.clientOrganization !== undefined) {
    updates.clientCompanyName = payload.clientOrganization?.trim() || updates.clientContactName;
  }
  if (payload.clientEmail !== undefined) {
    updates.clientContactEmail = payload.clientEmail?.trim() || null;
  }
  if (payload.clientPhone !== undefined) {
    updates.clientContactPhone = payload.clientPhone?.trim() || null;
  }
  if (payload.valueAmount !== undefined) {
    updates.amount = normalizeAmount(payload.valueAmount, 'valueAmount');
  }
  if (payload.valueCurrency !== undefined) {
    updates.currencyCode = normalizeCurrency(payload.valueCurrency, order.currencyCode ?? 'USD');
  }
  if (payload.submittedAt !== undefined) {
    updates.submittedAt = sanitizeDate(payload.submittedAt);
  }
  if (payload.kickoffScheduledAt !== undefined) {
    updates.kickoffDueAt = sanitizeDate(payload.kickoffScheduledAt);
  }
  if (payload.deliveryDueAt !== undefined) {
    updates.dueAt = sanitizeDate(payload.deliveryDueAt);
  }
  if (payload.deliveredAt !== undefined) {
    updates.completedAt = sanitizeDate(payload.deliveredAt);
  }
  if (payload.progressPercent !== undefined) {
    updates.progressPercent = Number(payload.progressPercent);
  }

  const mergedMetadata = buildOrderMetadataFromPayload(order, payload);
  updates.metadata = mergedMetadata;

  await order.update(updates);
  const refreshed = await fetchOrder(order.id);
  return serializeOrder(refreshed);
}

export async function createRequirementForm(orderId, payload = {}) {
  const id = normalizeId(orderId, 'orderId');
  const order = await fetchOrder(id);

  const requirement = await GigOrderRequirement.create({
    orderId: order.id,
    ...prepareRequirementPayload(payload),
  });

  const refreshed = await fetchOrder(order.id);
  return {
    order: serializeOrder(refreshed),
    requirementForm: deriveRequirementForms([requirement.toPublicObject()])[0],
  };
}

export async function updateRequirementForm(formId, payload = {}) {
  const id = normalizeId(formId, 'formId');
  const requirement = await GigOrderRequirement.findByPk(id);
  if (!requirement) {
    throw new NotFoundError('Requirement form not found.');
  }

  const updates = prepareRequirementPayload({ ...requirement.toPublicObject(), ...payload });
  await requirement.update(updates);

  const refreshed = await fetchOrder(requirement.orderId);
  return {
    order: serializeOrder(refreshed),
    requirementForm: deriveRequirementForms([requirement.toPublicObject()])[0],
  };
}

export async function createRevision(orderId, payload = {}) {
  const id = normalizeId(orderId, 'orderId');
  const order = await fetchOrder(id);

  const revisionPayload = prepareRevisionPayload(order.id, payload);
  if (!payload.roundNumber && !payload.revisionNumber) {
    const currentMax =
      (await GigOrderRevision.max('roundNumber', { where: { orderId: order.id } })) || 0;
    revisionPayload.roundNumber = currentMax + 1;
  }

  const revision = await GigOrderRevision.create(revisionPayload);
  const refreshed = await fetchOrder(order.id);
  return {
    order: serializeOrder(refreshed),
    revision: { ...revision.toPublicObject(), status: mapRevisionStatus(revision.status) },
  };
}

export async function updateRevision(revisionId, payload = {}) {
  const id = normalizeId(revisionId, 'revisionId');
  const revision = await GigOrderRevision.findByPk(id);
  if (!revision) {
    throw new NotFoundError('Revision not found.');
  }

  const updates = prepareRevisionPayload(revision.orderId, { ...revision.toPublicObject(), ...payload });
  await revision.update(updates);

  const refreshed = await fetchOrder(revision.orderId);
  return {
    order: serializeOrder(refreshed),
    revision: { ...revision.toPublicObject(), status: mapRevisionStatus(revision.status) },
  };
}

export async function createEscrowCheckpoint(orderId, payload = {}) {
  const id = normalizeId(orderId, 'orderId');
  const order = await fetchOrder(id);

  const checkpoint = await GigOrderPayout.create(prepareEscrowPayload(order.id, payload));
  const refreshed = await fetchOrder(order.id);
  return {
    order: serializeOrder(refreshed),
    checkpoint: deriveEscrowCheckpoints([checkpoint.toPublicObject()])[0],
  };
}

export async function updateEscrowCheckpoint(checkpointId, payload = {}) {
  const id = normalizeId(checkpointId, 'checkpointId');
  const checkpoint = await GigOrderPayout.findByPk(id);
  if (!checkpoint) {
    throw new NotFoundError('Escrow checkpoint not found.');
  }

  const updates = prepareEscrowPayload(checkpoint.orderId, { ...checkpoint.toPublicObject(), ...payload });
  await checkpoint.update(updates);

  const refreshed = await fetchOrder(checkpoint.orderId);
  return {
    order: serializeOrder(refreshed),
    checkpoint: deriveEscrowCheckpoints([checkpoint.toPublicObject()])[0],
  };
}

export default {
  getFreelancerOrderPipeline,
  createFreelancerOrder,
  updateFreelancerOrder,
  createRequirementForm,
  updateRequirementForm,
  createRevision,
  updateRevision,
  createEscrowCheckpoint,
  updateEscrowCheckpoint,
};
