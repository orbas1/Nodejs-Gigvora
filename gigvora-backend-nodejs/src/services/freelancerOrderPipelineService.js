import { Op } from 'sequelize';
import {
  sequelize,
  GigOrder,
  GigOrderRequirementForm,
  GigOrderRevision,
  GigOrderEscrowCheckpoint,
  GIG_ORDER_PIPELINE_STATUSES,
  GIG_ORDER_STATUS_TYPES,
  GIG_ORDER_INTAKE_STATUSES,
  GIG_ORDER_KICKOFF_STATUSES,
  GIG_ORDER_REQUIREMENT_FORM_STATUSES,
  GIG_ORDER_REVISION_STATUSES,
  GIG_ORDER_ESCROW_STATUSES,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const DEFAULT_LOOKBACK_DAYS = 120;
const MAX_LOOKBACK_DAYS = 365;
const REQUIREMENT_OVERDUE_DAYS = 3;
const DELIVERY_SOON_THRESHOLD_DAYS = 3;

const ORDER_INCLUDES = [
  { model: GigOrderRequirementForm, as: 'requirementForms' },
  { model: GigOrderRevision, as: 'revisions' },
  { model: GigOrderEscrowCheckpoint, as: 'escrowCheckpoints' },
  { association: 'freelancer', attributes: ['id', 'firstName', 'lastName', 'email'] },
  { association: 'client', attributes: ['id', 'firstName', 'lastName', 'email'] },
];

function normalizeId(value, fieldName = 'id') {
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
    return null;
  }
  if (Array.isArray(tags)) {
    return tags.filter(Boolean);
  }
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  if (typeof tags === 'object') {
    return tags;
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

function ensureFromSet(value, allowed, fieldName) {
  if (value == null) {
    return undefined;
  }
  if (!allowed.includes(value)) {
    throw new ValidationError(`${fieldName} must be one of: ${allowed.join(', ')}`);
  }
  return value;
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

async function fetchOrder(orderId, { transaction } = {}) {
  const order = await GigOrder.findByPk(orderId, {
    include: ORDER_INCLUDES,
    transaction,
  });
  if (!order) {
    throw new NotFoundError('Order not found.');
  }
  return order;
}

function sortOrderCollections(order) {
  if (!order) return order;
  if (Array.isArray(order.requirementForms)) {
    order.requirementForms.sort((a, b) => {
      const first = new Date(a.requestedAt ?? a.createdAt ?? 0).getTime();
      const second = new Date(b.requestedAt ?? b.createdAt ?? 0).getTime();
      return second - first;
    });
  }
  if (Array.isArray(order.revisions)) {
    order.revisions.sort((a, b) => b.revisionNumber - a.revisionNumber);
  }
  if (Array.isArray(order.escrowCheckpoints)) {
    order.escrowCheckpoints.sort((a, b) => {
      const first = new Date(a.createdAt ?? 0).getTime();
      const second = new Date(b.createdAt ?? 0).getTime();
      return first - second;
    });
  }
  return order;
}

function deriveOrderMetrics(order) {
  const pendingRequirementStatuses = new Set([
    'pending_client',
    'in_progress',
    'needs_revision',
  ]);
  const openRevisionStatuses = new Set(['open', 'in_progress', 'submitted', 'declined']);
  const pendingEscrowStatuses = new Set(['funded', 'pending_release', 'held', 'disputed']);

  const pendingRequirements = order.requirementForms?.filter((form) =>
    pendingRequirementStatuses.has(form.status),
  ).length;
  const openRevisions = order.revisions?.filter((revision) =>
    openRevisionStatuses.has(revision.status),
  ).length;
  const outstandingEscrow = (order.escrowCheckpoints ?? []).reduce((sum, checkpoint) => {
    if (pendingEscrowStatuses.has(checkpoint.status)) {
      return sum + Number(checkpoint.amount ?? 0);
    }
    return sum;
  }, 0);

  let nextAction = 'Review inquiry and confirm requirements.';
  if (order.pipelineStage === 'qualification') {
    nextAction = pendingRequirements ? 'Awaiting client requirement form.' : 'Schedule kickoff call.';
  } else if (order.pipelineStage === 'kickoff_scheduled') {
    nextAction = order.kickoffStatus === 'scheduled' ? 'Prepare kickoff agenda.' : 'Schedule kickoff call.';
  } else if (order.pipelineStage === 'production') {
    nextAction = openRevisions ? 'Address open revision requests.' : 'Work towards delivery milestone.';
  } else if (order.pipelineStage === 'delivery') {
    nextAction = outstandingEscrow
      ? 'Collect client approval and trigger escrow release.'
      : 'Confirm final acceptance.';
  } else if (order.pipelineStage === 'completed') {
    nextAction = 'Capture testimonial and close out project.';
  } else if (order.pipelineStage === 'cancelled') {
    nextAction = 'Archive supporting notes and inform stakeholders.';
  }

  return {
    pendingRequirements,
    openRevisions,
    outstandingEscrow: Number(outstandingEscrow.toFixed(2)),
    nextAction,
  };
}

function percentage(count, total, precision = 1) {
  if (!total) {
    return null;
  }
  const value = (Number(count ?? 0) / Number(total)) * 100;
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
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
    funded: 0,
    pendingRelease: 0,
    released: 0,
    held: 0,
    disputed: 0,
    totalFunded: 0,
    outstanding: 0,
    releasedValue: 0,
  };

  let totalValue = 0;
  let openValue = 0;
  let completedValue = 0;
  let csatSum = 0;
  let csatCount = 0;
  let kickoffScheduled = 0;
  let deliveryDueSoon = 0;
  const now = new Date();

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
    if (order.kickoffStatus === 'scheduled') {
      kickoffScheduled += 1;
    }
    if (order.deliveryDueAt) {
      const dueAt = new Date(order.deliveryDueAt);
      if (!Number.isNaN(dueAt.getTime())) {
        const diffDays = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays >= 0 && diffDays <= DELIVERY_SOON_THRESHOLD_DAYS) {
          deliveryDueSoon += 1;
        }
      }
    }

    (order.requirementForms ?? []).forEach((form) => {
      if (form.status === 'submitted') {
        requirementStats.submitted += 1;
      } else if (form.status === 'approved') {
        requirementStats.approved += 1;
      } else if (form.status === 'needs_revision') {
        requirementStats.needsRevision += 1;
      } else if (['pending_client', 'in_progress'].includes(form.status)) {
        requirementStats.pending += 1;
      }
      if (!['approved', 'archived'].includes(form.status)) {
        const requestedAt = form.requestedAt ? new Date(form.requestedAt) : null;
        if (requestedAt && !Number.isNaN(requestedAt.getTime())) {
          const ageDays = (now.getTime() - requestedAt.getTime()) / (1000 * 60 * 60 * 24);
          if (ageDays > REQUIREMENT_OVERDUE_DAYS && !form.submittedAt) {
            requirementStats.overdue += 1;
          }
        }
      }
    });

    (order.revisions ?? []).forEach((revision) => {
      if (['open', 'in_progress'].includes(revision.status)) {
        revisionStats.active += 1;
      } else if (revision.status === 'submitted') {
        revisionStats.awaitingReview += 1;
      } else if (revision.status === 'approved') {
        revisionStats.completed += 1;
      } else if (revision.status === 'declined') {
        revisionStats.declined += 1;
      }
    });

    (order.escrowCheckpoints ?? []).forEach((checkpoint) => {
      const amount = Number(checkpoint.amount ?? 0);
      escrowStats.totalFunded += amount;
      if (checkpoint.status === 'released') {
        escrowStats.released += 1;
        escrowStats.releasedValue += amount;
      } else if (checkpoint.status === 'pending_release') {
        escrowStats.pendingRelease += 1;
        escrowStats.outstanding += amount;
      } else if (checkpoint.status === 'funded') {
        escrowStats.funded += 1;
        escrowStats.outstanding += amount;
      } else if (checkpoint.status === 'held') {
        escrowStats.held += 1;
        escrowStats.outstanding += amount;
      } else if (checkpoint.status === 'disputed') {
        escrowStats.disputed += 1;
        escrowStats.outstanding += amount;
      }
    });
  });

  const totalOrders = orders.length;
  const cancelledOrders = stageBuckets.cancelled ?? 0;
  const activeOrders = totalOrders - cancelledOrders;
  const qualificationProgress = totalOrders - ((stageBuckets.inquiry ?? 0) + cancelledOrders);
  const kickoffProgress =
    (stageBuckets.kickoff_scheduled ?? 0) +
    (stageBuckets.production ?? 0) +
    (stageBuckets.delivery ?? 0) +
    (stageBuckets.completed ?? 0);
  const deliveryProgress = (stageBuckets.delivery ?? 0) + (stageBuckets.completed ?? 0);
  const winCount = stageBuckets.completed ?? 0;

  return {
    totals: {
      orders: totalOrders,
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
      counts: {
        funded: escrowStats.funded,
        pendingRelease: escrowStats.pendingRelease,
        released: escrowStats.released,
        held: escrowStats.held,
        disputed: escrowStats.disputed,
      },
      amounts: {
        totalFunded: Number(escrowStats.totalFunded.toFixed(2)),
        outstanding: Number(escrowStats.outstanding.toFixed(2)),
        releasedValue: Number(escrowStats.releasedValue.toFixed(2)),
        currency: orders[0]?.escrowCurrency ?? orders[0]?.valueCurrency ?? 'USD',
      },
    },
    health: {
      csatAverage: csatCount ? Number((csatSum / csatCount).toFixed(2)) : null,
      kickoffScheduled,
      deliveryDueSoon,
    },
    conversion: {
      qualificationRate: percentage(qualificationProgress, totalOrders),
      kickoffRate: percentage(kickoffProgress, totalOrders),
      deliveryRate: percentage(deliveryProgress, totalOrders),
      winRate: percentage(winCount, activeOrders > 0 ? activeOrders : totalOrders),
      cancellationRate: percentage(cancelledOrders, totalOrders),
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

  const serialized = orders.map((orderInstance) => {
    const order = sortOrderCollections(orderInstance.toPublicObject());
    return { ...order, metrics: deriveOrderMetrics(order) };
  });

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

function prepareRequirementFormPayload(payload = {}) {
  const status = ensureFromSet(
    payload.status ?? 'pending_client',
    GIG_ORDER_REQUIREMENT_FORM_STATUSES,
    'status',
  );
  return {
    status,
    schemaVersion: payload.schemaVersion ?? null,
    questions: payload.questions ?? null,
    responses: payload.responses ?? null,
    requestedAt: sanitizeDate(payload.requestedAt) ?? new Date(),
    submittedAt: sanitizeDate(payload.submittedAt),
    approvedAt: sanitizeDate(payload.approvedAt),
    reviewerId: payload.reviewerId ?? null,
    lastReminderAt: sanitizeDate(payload.lastReminderAt),
  };
}

function prepareRevisionPayload(orderId, payload = {}) {
  const status = ensureFromSet(payload.status ?? 'open', GIG_ORDER_REVISION_STATUSES, 'status');
  return {
    orderId,
    status,
    summary: payload.summary ?? null,
    details: payload.details ?? null,
    requestedById: payload.requestedById ?? null,
    requestedAt: sanitizeDate(payload.requestedAt) ?? new Date(),
    dueAt: sanitizeDate(payload.dueAt),
    completedAt: sanitizeDate(payload.completedAt),
  };
}

function prepareEscrowCheckpointPayload(payload = {}) {
  const status = ensureFromSet(payload.status ?? 'funded', GIG_ORDER_ESCROW_STATUSES, 'status');
  return {
    label: payload.label?.trim() || 'Milestone',
    amount: normalizeAmount(payload.amount ?? 0, 'amount'),
    currency: normalizeCurrency(payload.currency ?? payload.currencyCode ?? 'USD'),
    status,
    approvalRequirement: payload.approvalRequirement ?? null,
    csatThreshold:
      payload.csatThreshold == null ? null : Number(Number(payload.csatThreshold).toFixed(2)),
    releasedAt: sanitizeDate(payload.releasedAt),
    releasedById: payload.releasedById ?? null,
    payoutReference: payload.payoutReference ?? null,
    notes: payload.notes ?? null,
  };
}

export async function createFreelancerOrder(payload = {}) {
  const freelancerId = normalizeId(payload.freelancerId, 'freelancerId');
  const clientName = payload.clientName?.trim();
  const gigTitle = payload.gigTitle?.trim();
  if (!clientName) {
    throw new ValidationError('clientName is required.');
  }
  if (!gigTitle) {
    throw new ValidationError('gigTitle is required.');
  }

  const pipelineStage = ensureFromSet(
    payload.pipelineStage ?? 'inquiry',
    GIG_ORDER_PIPELINE_STATUSES,
    'pipelineStage',
  ) ?? 'inquiry';
  const intakeStatus = ensureFromSet(
    payload.intakeStatus ?? 'not_started',
    GIG_ORDER_INTAKE_STATUSES,
    'intakeStatus',
  ) ?? 'not_started';
  const kickoffStatus = ensureFromSet(
    payload.kickoffStatus ?? 'not_scheduled',
    GIG_ORDER_KICKOFF_STATUSES,
    'kickoffStatus',
  ) ?? 'not_scheduled';
  const status = ensureFromSet(payload.status ?? 'open', GIG_ORDER_STATUS_TYPES, 'status') ?? 'open';

  const valueCurrency = normalizeCurrency(payload.valueCurrency ?? payload.currency ?? 'USD');
  const valueAmount = normalizeAmount(payload.valueAmount ?? payload.value ?? 0, 'valueAmount');
  const escrowCurrency = normalizeCurrency(payload.escrowCurrency ?? valueCurrency ?? 'USD');
  const escrowTotalAmount = normalizeAmount(
    payload.escrowTotalAmount ?? payload.escrowTotal ?? valueAmount,
    'escrowTotalAmount',
  );

  const tags = normalizeTags(payload.tags);
  const csatScore = normalizeCsat(payload.csatScore);

  const order = await sequelize.transaction(async (transaction) => {
    const createdOrder = await GigOrder.create(
      {
        freelancerId,
        clientId: payload.clientId ?? null,
        clientName,
        clientEmail: payload.clientEmail?.trim() || null,
        clientOrganization: payload.clientOrganization?.trim() || null,
        gigTitle,
        pipelineStage,
        status,
        intakeStatus,
        kickoffScheduledAt: sanitizeDate(payload.kickoffScheduledAt),
        kickoffStatus,
        productionStartedAt: sanitizeDate(payload.productionStartedAt),
        deliveryDueAt: sanitizeDate(payload.deliveryDueAt),
        deliveredAt: sanitizeDate(payload.deliveredAt),
        csatScore,
        valueAmount,
        valueCurrency,
        escrowTotalAmount,
        escrowCurrency,
        notes: payload.notes ?? null,
        tags,
        lastClientContactAt: sanitizeDate(payload.lastClientContactAt),
        nextClientTouchpointAt: sanitizeDate(payload.nextClientTouchpointAt),
      },
      { transaction },
    );

    if (Array.isArray(payload.requirementForms) && payload.requirementForms.length) {
      const forms = payload.requirementForms.map((form) => ({
        ...prepareRequirementFormPayload(form),
        orderId: createdOrder.id,
      }));
      await GigOrderRequirementForm.bulkCreate(forms, { transaction });
    }

    if (Array.isArray(payload.revisions) && payload.revisions.length) {
      const revisions = await Promise.all(
        payload.revisions.map(async (revision, index) => ({
          ...prepareRevisionPayload(createdOrder.id, revision),
          revisionNumber: revision.revisionNumber ?? index + 1,
        })),
      );
      await GigOrderRevision.bulkCreate(revisions, { transaction });
    }

    if (Array.isArray(payload.escrowCheckpoints) && payload.escrowCheckpoints.length) {
      const checkpoints = payload.escrowCheckpoints.map((checkpoint) => ({
        ...prepareEscrowCheckpointPayload(checkpoint),
        orderId: createdOrder.id,
      }));
      await GigOrderEscrowCheckpoint.bulkCreate(checkpoints, { transaction });
    }

    return fetchOrder(createdOrder.id, { transaction });
  });

  return sortOrderCollections(order.toPublicObject());
}

export async function updateFreelancerOrder(orderId, payload = {}) {
  const id = normalizeId(orderId, 'orderId');
  const order = await fetchOrder(id);

  const updates = {};
  if (payload.pipelineStage != null) {
    updates.pipelineStage = ensureFromSet(payload.pipelineStage, GIG_ORDER_PIPELINE_STATUSES, 'pipelineStage');
  }
  if (payload.status != null) {
    updates.status = ensureFromSet(payload.status, GIG_ORDER_STATUS_TYPES, 'status');
  }
  if (payload.intakeStatus != null) {
    updates.intakeStatus = ensureFromSet(payload.intakeStatus, GIG_ORDER_INTAKE_STATUSES, 'intakeStatus');
  }
  if (payload.kickoffStatus != null) {
    updates.kickoffStatus = ensureFromSet(payload.kickoffStatus, GIG_ORDER_KICKOFF_STATUSES, 'kickoffStatus');
  }
  if (payload.kickoffScheduledAt !== undefined) {
    updates.kickoffScheduledAt = sanitizeDate(payload.kickoffScheduledAt);
  }
  if (payload.productionStartedAt !== undefined) {
    updates.productionStartedAt = sanitizeDate(payload.productionStartedAt);
  }
  if (payload.deliveryDueAt !== undefined) {
    updates.deliveryDueAt = sanitizeDate(payload.deliveryDueAt);
  }
  if (payload.deliveredAt !== undefined) {
    updates.deliveredAt = sanitizeDate(payload.deliveredAt);
  }
  if (payload.lastClientContactAt !== undefined) {
    updates.lastClientContactAt = sanitizeDate(payload.lastClientContactAt);
  }
  if (payload.nextClientTouchpointAt !== undefined) {
    updates.nextClientTouchpointAt = sanitizeDate(payload.nextClientTouchpointAt);
  }
  if (payload.notes !== undefined) {
    updates.notes = payload.notes ?? null;
  }
  if (payload.tags !== undefined) {
    updates.tags = normalizeTags(payload.tags);
  }
  if (payload.csatScore !== undefined) {
    updates.csatScore = normalizeCsat(payload.csatScore);
  }
  if (payload.valueAmount !== undefined) {
    updates.valueAmount = normalizeAmount(payload.valueAmount, 'valueAmount');
  }
  if (payload.valueCurrency !== undefined) {
    updates.valueCurrency = normalizeCurrency(payload.valueCurrency, order.valueCurrency);
  }
  if (payload.escrowTotalAmount !== undefined) {
    updates.escrowTotalAmount = normalizeAmount(payload.escrowTotalAmount, 'escrowTotalAmount');
  }
  if (payload.escrowCurrency !== undefined) {
    updates.escrowCurrency = normalizeCurrency(payload.escrowCurrency, order.escrowCurrency);
  }

  if (updates.pipelineStage === 'completed' && !updates.status) {
    updates.status = 'completed';
    updates.deliveredAt = updates.deliveredAt ?? new Date();
  }
  if (updates.pipelineStage === 'cancelled' && !updates.status) {
    updates.status = 'cancelled';
  }

  await order.update(updates);
  const refreshed = await fetchOrder(order.id);
  const serialized = sortOrderCollections(refreshed.toPublicObject());
  return { ...serialized, metrics: deriveOrderMetrics(serialized) };
}

export async function createRequirementForm(orderId, payload = {}) {
  const id = normalizeId(orderId, 'orderId');
  const order = await fetchOrder(id);

  const form = await GigOrderRequirementForm.create({
    ...prepareRequirementFormPayload(payload),
    orderId: order.id,
  });

  const refreshed = await fetchOrder(order.id);
  const serialized = sortOrderCollections(refreshed.toPublicObject());
  return {
    order: { ...serialized, metrics: deriveOrderMetrics(serialized) },
    requirementForm: form.toPublicObject(),
  };
}

export async function updateRequirementForm(formId, payload = {}) {
  const id = normalizeId(formId, 'formId');
  const form = await GigOrderRequirementForm.findByPk(id);
  if (!form) {
    throw new NotFoundError('Requirement form not found.');
  }

  const updates = prepareRequirementFormPayload({ ...form.toPublicObject(), ...payload });

  if (payload.status === 'approved' && !payload.approvedAt) {
    updates.approvedAt = new Date();
  }
  if (payload.status === 'submitted' && !payload.submittedAt) {
    updates.submittedAt = new Date();
  }

  await form.update(updates);
  const refreshed = await fetchOrder(form.orderId);
  const serialized = sortOrderCollections(refreshed.toPublicObject());
  return {
    order: { ...serialized, metrics: deriveOrderMetrics(serialized) },
    requirementForm: form.toPublicObject(),
  };
}

export async function createRevision(orderId, payload = {}) {
  const id = normalizeId(orderId, 'orderId');
  const order = await fetchOrder(id);
  const prepared = prepareRevisionPayload(order.id, payload);
  if (payload.revisionNumber != null) {
    prepared.revisionNumber = Number(payload.revisionNumber);
  } else {
    const currentMax = (await GigOrderRevision.max('revisionNumber', { where: { orderId: order.id } })) || 0;
    prepared.revisionNumber = currentMax + 1;
  }

  const revision = await GigOrderRevision.create(prepared);
  const refreshed = await fetchOrder(order.id);
  const serialized = sortOrderCollections(refreshed.toPublicObject());
  return {
    order: { ...serialized, metrics: deriveOrderMetrics(serialized) },
    revision: revision.toPublicObject(),
  };
}

export async function updateRevision(revisionId, payload = {}) {
  const id = normalizeId(revisionId, 'revisionId');
  const revision = await GigOrderRevision.findByPk(id);
  if (!revision) {
    throw new NotFoundError('Revision not found.');
  }

  const updates = prepareRevisionPayload(revision.orderId, { ...revision.toPublicObject(), ...payload });
  if (payload.status === 'approved' && !payload.completedAt) {
    updates.completedAt = new Date();
  }
  await revision.update(updates);

  const refreshed = await fetchOrder(revision.orderId);
  const serialized = sortOrderCollections(refreshed.toPublicObject());
  return {
    order: { ...serialized, metrics: deriveOrderMetrics(serialized) },
    revision: revision.toPublicObject(),
  };
}

export async function createEscrowCheckpoint(orderId, payload = {}) {
  const id = normalizeId(orderId, 'orderId');
  const order = await fetchOrder(id);
  const prepared = prepareEscrowCheckpointPayload(payload);
  prepared.orderId = order.id;
  const checkpoint = await GigOrderEscrowCheckpoint.create(prepared);

  const refreshed = await fetchOrder(order.id);
  const serialized = sortOrderCollections(refreshed.toPublicObject());
  return {
    order: { ...serialized, metrics: deriveOrderMetrics(serialized) },
    checkpoint: checkpoint.toPublicObject(),
  };
}

export async function updateEscrowCheckpoint(checkpointId, payload = {}) {
  const id = normalizeId(checkpointId, 'checkpointId');
  const checkpoint = await GigOrderEscrowCheckpoint.findByPk(id);
  if (!checkpoint) {
    throw new NotFoundError('Escrow checkpoint not found.');
  }

  const updates = prepareEscrowCheckpointPayload({ ...checkpoint.toPublicObject(), ...payload });
  if (payload.status === 'released' && !payload.releasedAt) {
    updates.releasedAt = new Date();
  }
  await checkpoint.update(updates);

  const refreshed = await fetchOrder(checkpoint.orderId);
  const serialized = sortOrderCollections(refreshed.toPublicObject());
  return {
    order: { ...serialized, metrics: deriveOrderMetrics(serialized) },
    checkpoint: checkpoint.toPublicObject(),
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
