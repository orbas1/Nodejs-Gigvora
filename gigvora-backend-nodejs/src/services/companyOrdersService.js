import {
  getProjectGigManagementOverview,
  createGigOrder,
  updateGigOrder,
  getGigOrderDetail,
  addGigTimelineEvent,
  updateGigTimelineEvent,
  createGigOrderMessage,
  createGigOrderEscrowCheckpoint,
  updateGigOrderEscrowCheckpoint,
} from './projectGigManagementWorkflowService.js';
import { Op } from 'sequelize';
import {
  GigOrder,
  GigTimelineEvent,
  GigSubmission,
  GigOrderEscalation,
} from '../models/projectGigManagementModels.js';
import { AuthorizationError, ConflictError, NotFoundError } from '../utils/errors.js';
import { appCache } from '../utils/cache.js';
import {
  normalizeCompanyOrderDeliverables,
  buildGigClassesFromDeliverables,
  mapDeliverablesToRequirements,
} from './utils/companyOrderNormalisers.js';
import { normaliseEscalationMetadata, toNullableEscalationMetadata } from './utils/escalationMetadata.js';
import {
  assertCanManageOrders,
  assertCanManageEscrow,
  assertCanPostMessages,
} from '../utils/companyOrderAccess.js';

const DASHBOARD_CACHE_PREFIX = 'company:orders:dashboard';
const DASHBOARD_CACHE_TTL_SECONDS = 30;
const ESCALATION_CACHE_PREFIX = 'company:orders:escalations';
const ESCALATION_CACHE_TTL_SECONDS = 60 * 60; // one hour
const OPEN_ESCALATION_STATUSES = new Set(['queued', 'notified']);
const CLOSED_ORDER_STATUSES = new Set(['completed', 'closed', 'cancelled', 'archived']);

const DEFAULT_PERMISSIONS = Object.freeze({
  canManageOrders: true,
  canManageEscrow: true,
  canPostMessages: true,
});

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function ensureOrderOwnership(order, ownerId) {
  if (!order || Number(order.ownerId) !== Number(ownerId)) {
    throw new NotFoundError('Company order not found.', {
      code: 'ORDER_NOT_FOUND',
      ownerId: Number(ownerId) || null,
    });
  }
  return order;
}

function deriveMetrics(orders = [], currency = 'USD') {
  const all = Array.isArray(orders) ? orders : [];
  const openOrders = all.filter((order) => order && order.isClosed !== true && order.status !== 'closed');
  const closedOrders = all.filter((order) => order && (order.isClosed === true || order.status === 'closed'));

  const valueInFlight = openOrders.reduce((total, order) => total + toNumber(order.amount), 0);
  const escrowHeldAmount = all.reduce((total, order) => total + toNumber(order.escrowHeldAmount), 0);

  return {
    totalOrders: all.length,
    openOrders: openOrders.length,
    closedOrders: closedOrders.length,
    valueInFlight: Math.round(valueInFlight),
    escrowHeldAmount: Math.round(escrowHeldAmount),
    currency,
  };
}

function buildDashboardCacheKey(ownerId, status = 'all') {
  const normalisedOwner = Number(ownerId) || 0;
  const normalisedStatus = (status || 'all').toString().toLowerCase();
  return `${DASHBOARD_CACHE_PREFIX}:${normalisedOwner}:${normalisedStatus}`;
}

function invalidateDashboardCache(ownerId) {
  const normalisedOwner = Number(ownerId) || 0;
  appCache.flushByPrefix(`${DASHBOARD_CACHE_PREFIX}:${normalisedOwner}:`);
}

function cloneCachedPayload(payload) {
  if (payload == null) {
    return payload;
  }
  if (typeof structuredClone === 'function') {
    return structuredClone(payload);
  }
  return JSON.parse(JSON.stringify(payload));
}

function formatEscalationRecord(record) {
  if (!record) {
    return null;
  }
  const plain = record.get ? record.get({ plain: true }) : record;
  const metadata = toNullableEscalationMetadata(plain.metadata);
  return {
    status: plain.status ?? 'queued',
    ownerId: plain.ownerId ?? null,
    orderId: plain.orderId ?? null,
    severity: plain.severity ?? 'warning',
    message: plain.message ?? null,
    hoursOverdue:
      plain.hoursOverdue == null ? null : Number.parseInt(plain.hoursOverdue, 10) || plain.hoursOverdue,
    detectedAt: plain.detectedAt ? new Date(plain.detectedAt).toISOString() : null,
    escalatedAt: plain.escalatedAt ? new Date(plain.escalatedAt).toISOString() : null,
    resolvedAt: plain.resolvedAt ? new Date(plain.resolvedAt).toISOString() : null,
    supportCaseId: plain.supportCaseId ?? null,
    supportThreadId: plain.supportThreadId ?? null,
    metadata,
  };
}

async function persistEscalation({ ownerId, orderId, severity, message, hoursOverdue, occurredAt }) {
  const now = new Date();
  const detectedAt = occurredAt ? new Date(occurredAt) : now;
  const existing = await GigOrderEscalation.findOne({
    where: {
      ownerId: Number(ownerId) || 0,
      orderId: Number(orderId) || 0,
      resolvedAt: { [Op.is]: null },
    },
  });

  if (existing) {
    const metadata = normaliseEscalationMetadata(existing.metadata);
    metadata.lastDetectedAt = now.toISOString();
    if (occurredAt) {
      metadata.dueAt = new Date(occurredAt).toISOString();
    }
    if (hoursOverdue != null) {
      metadata.hoursOverdue = hoursOverdue;
    }

    await existing.update({
      severity,
      message,
      hoursOverdue,
      status: OPEN_ESCALATION_STATUSES.has(existing.status) ? existing.status : 'queued',
      escalatedAt: existing.escalatedAt ?? now,
      detectedAt: existing.detectedAt ?? detectedAt,
      metadata,
    });

    return formatEscalationRecord(existing);
  }

  const created = await GigOrderEscalation.create({
    ownerId: Number(ownerId) || 0,
    orderId: Number(orderId) || 0,
    status: 'queued',
    severity,
    message,
    hoursOverdue,
    detectedAt,
    escalatedAt: now,
    metadata: {
      dueAt: occurredAt ? new Date(occurredAt).toISOString() : null,
      lastDetectedAt: now.toISOString(),
      hoursOverdue,
    },
  });

  return formatEscalationRecord(created);
}

async function loadOpenEscalations(ownerId, orderIds = []) {
  if (!ownerId) {
    return [];
  }
  const where = {
    ownerId: Number(ownerId) || 0,
    resolvedAt: { [Op.is]: null },
    status: { [Op.in]: Array.from(OPEN_ESCALATION_STATUSES) },
  };
  if (orderIds.length) {
    where.orderId = { [Op.in]: orderIds.map((id) => Number(id)) };
  }

  const rows = await GigOrderEscalation.findAll({
    where,
    order: [
      ['detectedAt', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });
  return rows.map((row) => formatEscalationRecord(row)).filter(Boolean);
}

function buildEscalationCacheKey(ownerId, orderId) {
  return `${ESCALATION_CACHE_PREFIX}:${Number(ownerId) || 0}:${Number(orderId) || 0}`;
}

async function queueSlaEscalation({ ownerId, orderId, alert, hoursOverdue }) {
  const persisted = await persistEscalation({
    ownerId,
    orderId,
    severity: alert.severity,
    message: alert.message,
    hoursOverdue,
    occurredAt: alert.occurredAt,
  });

  const payload = {
    status: persisted?.status ?? 'queued',
    ownerId: persisted?.ownerId ?? (Number(ownerId) || null),
    orderId: persisted?.orderId ?? (Number(orderId) || null),
    severity: persisted?.severity ?? alert.severity,
    message: persisted?.message ?? alert.message,
    hoursOverdue: persisted?.hoursOverdue ?? hoursOverdue,
    queuedAt: persisted?.escalatedAt ?? new Date().toISOString(),
    supportCaseId: persisted?.supportCaseId ?? null,
    supportThreadId: persisted?.supportThreadId ?? null,
    metadata: toNullableEscalationMetadata(persisted?.metadata),
  };

  appCache.set(buildEscalationCacheKey(ownerId, orderId), payload, ESCALATION_CACHE_TTL_SECONDS);
  return payload;
}

async function detectSlaBreaches(orders = [], { ownerId, escalate = false } = {}) {
  const nowMs = Date.now();
  const orderIds = orders.map((order) => order?.id).filter((value) => Number.isFinite(Number(value)));
  const persisted = await loadOpenEscalations(ownerId, orderIds);
  const alertsByOrderId = new Map();

  persisted.forEach((record) => {
    const alert = {
      type: 'sla_breach',
      orderId: record.orderId,
      severity: record.severity,
      occurredAt: record.metadata?.dueAt ?? record.detectedAt ?? null,
      detectedAt: record.detectedAt ?? null,
      message: record.message,
      escalation: {
        ...record,
        queuedAt: record.escalatedAt ?? record.detectedAt ?? null,
      },
    };
    alertsByOrderId.set(record.orderId, alert);
  });

  for (const order of orders) {
    if (!order) {
      continue;
    }
    const dueAtMs = order.dueAt ? new Date(order.dueAt).getTime() : NaN;
    const statusKey = String(order.status ?? '').toLowerCase();
    const isClosed = order.isClosed === true || CLOSED_ORDER_STATUSES.has(statusKey);
    if (!Number.isFinite(dueAtMs) || isClosed || dueAtMs >= nowMs) {
      continue;
    }

    const hoursOverdue = Math.max(1, Math.round((nowMs - dueAtMs) / (1000 * 60 * 60)));
    const severity = hoursOverdue >= 24 ? 'critical' : 'warning';
    const baseAlert = {
      type: 'sla_breach',
      orderId: order.id,
      severity,
      occurredAt: new Date(dueAtMs).toISOString(),
      detectedAt: new Date(nowMs).toISOString(),
      message: `Order ${order.reference ?? order.orderNumber ?? order.id} is overdue by ${hoursOverdue}h.`,
    };

    if (alertsByOrderId.has(order.id)) {
      const existing = alertsByOrderId.get(order.id);
      const needsUpdate =
        existing.severity !== severity ||
        existing.message !== baseAlert.message ||
        (existing.escalation?.hoursOverdue ?? hoursOverdue) !== hoursOverdue;

      if (needsUpdate && escalate) {
        const escalation = await queueSlaEscalation({ ownerId, orderId: order.id, alert: baseAlert, hoursOverdue });
        alertsByOrderId.set(order.id, { ...baseAlert, escalation });
      } else if (needsUpdate) {
        alertsByOrderId.set(order.id, { ...existing, ...baseAlert });
      }
      continue;
    }

    if (escalate) {
      const escalation = await queueSlaEscalation({ ownerId, orderId: order.id, alert: baseAlert, hoursOverdue });
      alertsByOrderId.set(order.id, { ...baseAlert, escalation });
    } else {
      alertsByOrderId.set(order.id, baseAlert);
    }
  }

  const alerts = Array.from(alertsByOrderId.values());
  return { alerts, breachCount: alerts.length };
}

async function resolveOrderEscalations({ ownerId, orderId, resolvedById, resolution }) {
  const records = await GigOrderEscalation.findAll({
    where: {
      ownerId: Number(ownerId) || 0,
      orderId: Number(orderId) || 0,
      resolvedAt: { [Op.is]: null },
    },
  });

  if (!records.length) {
    return;
  }

  const now = new Date();
  await Promise.all(
    records.map((record) => {
      const metadata = normaliseEscalationMetadata(record.metadata);
      if (resolvedById != null) {
        metadata.resolvedById = resolvedById;
      }
      if (resolution) {
        metadata.resolution = resolution;
      }
      return record.update({
        status: 'resolved',
        resolvedAt: now,
        metadata,
      });
    }),
  );

  appCache.flushByPrefix(buildEscalationCacheKey(ownerId, orderId));
}

export async function getCompanyOrdersDashboard({ ownerId, status, context } = {}) {
  const statusKey = status ? status.toString().toLowerCase() : 'all';
  const cacheKey = buildDashboardCacheKey(ownerId, statusKey);

  const base = await appCache.remember(cacheKey, DASHBOARD_CACHE_TTL_SECONDS, async () => {
    const overview = await getProjectGigManagementOverview(ownerId);
    const purchasedGigs = overview?.purchasedGigs ?? {};
    const orders = Array.isArray(purchasedGigs.orders) ? purchasedGigs.orders : [];
    const filteredOrders = status
      ? orders.filter((order) => {
          if (!order) return false;
          if (statusKey === 'open') {
            return order.isClosed !== true && order.status !== 'closed';
          }
          if (statusKey === 'closed') {
            return order.isClosed === true || order.status === 'closed';
          }
          return String(order.status).toLowerCase() === statusKey;
        })
      : orders;

    const metrics = deriveMetrics(filteredOrders, purchasedGigs.currency ?? 'USD');

    return {
      summary: overview?.summary ?? {},
      metrics,
      orders: filteredOrders,
      timeline: purchasedGigs.timeline ?? { upcoming: [], recent: [] },
      chat: purchasedGigs.chat ?? { recent: [] },
    };
  });

  const snapshot = cloneCachedPayload(base) ?? {};
  const detection = await detectSlaBreaches(snapshot.orders ?? [], {
    ownerId,
    escalate: Boolean(context?.permissions?.canManageOrders),
  });

  return {
    ...snapshot,
    metrics: { ...(snapshot.metrics ?? {}), slaBreaches: detection.breachCount },
    alerts: detection.alerts,
    permissions: context?.permissions ?? DEFAULT_PERMISSIONS,
  };
}

export async function createCompanyOrder({ ownerId, payload = {}, context }) {
  assertCanManageOrders(context);
  const deliverables = normalizeCompanyOrderDeliverables(payload.deliverables ?? payload.requirements);
  const classes = buildGigClassesFromDeliverables(deliverables, {
    amount: payload.amount,
    currency: payload.currency,
  });
  const requirements = mapDeliverablesToRequirements(deliverables, { status: payload.status ?? 'pending' });

  const order = await createGigOrder(ownerId, {
    vendorName: payload.vendorName,
    serviceName: payload.serviceName,
    amount: payload.amount,
    currency: payload.currency,
    kickoffAt: payload.kickoffAt,
    dueAt: payload.dueAt,
    status: payload.status,
    progressPercent: payload.progressPercent,
    requirements,
    metadata: {
      ...(payload.metadata ?? {}),
      deliverables,
    },
    classes,
  });

  invalidateDashboardCache(ownerId);
  return order;
}

export async function updateCompanyOrder({ ownerId, orderId, payload = {}, context }) {
  assertCanManageOrders(context);
  const updates = { ...payload };
  if (payload.deliverables || payload.requirements) {
    const deliverables = normalizeCompanyOrderDeliverables(payload.deliverables ?? payload.requirements);
    updates.requirements = mapDeliverablesToRequirements(deliverables, { status: payload.status ?? 'pending' });
    updates.classes = buildGigClassesFromDeliverables(deliverables, {
      amount: payload.amount,
      currency: payload.currency,
    });
    updates.metadata = {
      ...(payload.metadata ?? {}),
      deliverables,
    };
  }

  const order = await updateGigOrder(ownerId, orderId, updates);
  if (
    order?.id &&
    (order.isClosed === true || CLOSED_ORDER_STATUSES.has(String(order.status ?? '').toLowerCase()))
  ) {
    await resolveOrderEscalations({
      ownerId,
      orderId: order.id,
      resolvedById: context?.actorId ?? null,
      resolution: `order_status:${order.status ?? 'closed'}`,
    });
  }
  invalidateDashboardCache(ownerId);
  return order;
}

export async function deleteCompanyOrder({ ownerId, orderId, context }) {
  assertCanManageOrders(context);
  const order = await GigOrder.findByPk(orderId);
  ensureOrderOwnership(order, ownerId);
  await resolveOrderEscalations({
    ownerId,
    orderId,
    resolvedById: context?.actorId ?? null,
    resolution: 'deleted',
  });
  await order.destroy();
  invalidateDashboardCache(ownerId);
  return { success: true };
}

export async function getCompanyOrderDetail({ ownerId, orderId, context }) {
  if (!context?.permissions?.canManageOrders && !context?.permissions?.canManageEscrow) {
    throw new AuthorizationError('Viewing company order detail requires authenticated workspace access.', {
      code: 'ORDER_VIEW_FORBIDDEN',
    });
  }
  const detail = await getGigOrderDetail(ownerId, orderId, { messageLimit: 100 });
  return detail;
}

export async function createCompanyOrderTimeline({ ownerId, orderId, payload, context }) {
  assertCanManageOrders(context);
  const event = await addGigTimelineEvent(ownerId, orderId, payload);
  invalidateDashboardCache(ownerId);
  return event;
}

export async function updateCompanyOrderTimeline({ ownerId, orderId, eventId, payload, context }) {
  assertCanManageOrders(context);
  const event = await updateGigTimelineEvent(ownerId, orderId, eventId, payload);
  invalidateDashboardCache(ownerId);
  return event;
}

export async function deleteCompanyOrderTimeline({ ownerId, orderId, eventId, context }) {
  assertCanManageOrders(context);
  const order = await ensureOrderOwnership(await GigOrder.findByPk(orderId), ownerId);
  const event = await GigTimelineEvent.findByPk(eventId);
  if (!event || event.orderId !== order.id) {
    throw new NotFoundError('Timeline event not found.', {
      code: 'TIMELINE_EVENT_NOT_FOUND',
      orderId: Number(orderId) || null,
      eventId: Number(eventId) || null,
    });
  }
  await event.destroy();
  invalidateDashboardCache(ownerId);
  return { success: true };
}

export async function postCompanyOrderMessage({ ownerId, orderId, payload, actor = {}, context }) {
  assertCanPostMessages(context);
  const message = await createGigOrderMessage(ownerId, orderId, payload, {
    actorId: actor.id ?? ownerId,
    actorName: actor.name ?? payload.authorName ?? 'Company operator',
    actorRole: 'company',
  });
  invalidateDashboardCache(ownerId);
  return message;
}

export async function createCompanyOrderEscrow({ ownerId, orderId, payload, context }) {
  assertCanManageEscrow(context);
  const checkpoint = await createGigOrderEscrowCheckpoint(ownerId, orderId, payload, { actorRole: 'company' });
  invalidateDashboardCache(ownerId);
  return checkpoint;
}

export async function updateCompanyOrderEscrow({ ownerId, checkpointId, payload, context }) {
  assertCanManageEscrow(context);
  if (payload?.status === 'released' && payload?.releaseAmount != null && Number(payload.releaseAmount) <= 0) {
    throw new ConflictError('Escrow release amount must be positive.', {
      code: 'ESCROW_LOCKED',
      checkpointId: Number(checkpointId) || null,
    });
  }
  const checkpoint = await updateGigOrderEscrowCheckpoint(ownerId, checkpointId, payload, {
    actorRole: 'company',
  });
  invalidateDashboardCache(ownerId);
  return checkpoint;
}

export async function submitCompanyOrderReview({ ownerId, orderId, payload, context }) {
  assertCanManageOrders(context);
  const updates = payload?.scorecard ? { scorecard: payload.scorecard } : payload;
  const order = await updateGigOrder(ownerId, orderId, updates);
  invalidateDashboardCache(ownerId);
  return order;
}

export async function deleteCompanyOrderSubmission({ ownerId, submissionId }) {
  const submission = await GigSubmission.findByPk(submissionId);
  if (!submission) {
    throw new NotFoundError('Submission not found.');
  }
  const order = await GigOrder.findByPk(submission.orderId);
  ensureOrderOwnership(order, ownerId);
  await submission.destroy();
  invalidateDashboardCache(ownerId);
  return { success: true };
}

export default {
  getCompanyOrdersDashboard,
  createCompanyOrder,
  updateCompanyOrder,
  deleteCompanyOrder,
  getCompanyOrderDetail,
  createCompanyOrderTimeline,
  updateCompanyOrderTimeline,
  deleteCompanyOrderTimeline,
  postCompanyOrderMessage,
  createCompanyOrderEscrow,
  updateCompanyOrderEscrow,
  submitCompanyOrderReview,
  deleteCompanyOrderSubmission,
};
