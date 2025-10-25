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
import { GigOrder, GigTimelineEvent, GigSubmission } from '../models/index.js';
import { AuthorizationError, ConflictError, NotFoundError } from '../utils/errors.js';
import { appCache } from '../utils/cache.js';
import {
  normalizeCompanyOrderDeliverables,
  buildGigClassesFromDeliverables,
  mapDeliverablesToRequirements,
} from './utils/companyOrderNormalisers.js';
import {
  assertCanManageOrders,
  assertCanManageEscrow,
  assertCanPostMessages,
} from '../utils/companyOrderAccess.js';

const DASHBOARD_CACHE_PREFIX = 'company:orders:dashboard';
const DASHBOARD_CACHE_TTL_SECONDS = 30;
const ESCALATION_CACHE_PREFIX = 'company:orders:escalations';
const ESCALATION_CACHE_TTL_SECONDS = 60 * 60; // one hour

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

function queueSlaEscalation({ ownerId, orderId, alert, hoursOverdue }) {
  const key = `${ESCALATION_CACHE_PREFIX}:${Number(ownerId) || 0}:${Number(orderId) || 0}`;
  const existing = appCache.get(key);
  if (existing?.status === 'queued') {
    return existing;
  }

  const payload = {
    status: 'queued',
    ownerId: Number(ownerId) || null,
    orderId: Number(orderId) || null,
    severity: alert.severity,
    message: alert.message,
    hoursOverdue,
    queuedAt: new Date().toISOString(),
  };

  appCache.set(key, payload, ESCALATION_CACHE_TTL_SECONDS);
  return payload;
}

function detectSlaBreaches(orders = [], { ownerId, escalate = false } = {}) {
  const nowMs = Date.now();
  const alerts = [];
  let breachCount = 0;

  orders.forEach((order) => {
    if (!order) {
      return;
    }
    const dueAtMs = order.dueAt ? new Date(order.dueAt).getTime() : NaN;
    const isClosed = order.isClosed === true || String(order.status).toLowerCase() === 'closed';
    if (!Number.isFinite(dueAtMs) || isClosed || dueAtMs >= nowMs) {
      return;
    }

    breachCount += 1;
    const hoursOverdue = Math.max(1, Math.round((nowMs - dueAtMs) / (1000 * 60 * 60)));
    const alert = {
      type: 'sla_breach',
      orderId: order.id,
      severity: hoursOverdue >= 24 ? 'critical' : 'warning',
      occurredAt: new Date(dueAtMs).toISOString(),
      detectedAt: new Date(nowMs).toISOString(),
      message: `Order ${order.reference ?? order.id} is overdue by ${hoursOverdue}h.`,
    };

    if (escalate) {
      alert.escalation = queueSlaEscalation({ ownerId, orderId: order.id, alert, hoursOverdue });
    }

    alerts.push(alert);
  });

  return { alerts, breachCount };
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
  const detection = detectSlaBreaches(snapshot.orders ?? [], {
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
  invalidateDashboardCache(ownerId);
  return order;
}

export async function deleteCompanyOrder({ ownerId, orderId, context }) {
  assertCanManageOrders(context);
  const order = await GigOrder.findByPk(orderId);
  ensureOrderOwnership(order, ownerId);
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
