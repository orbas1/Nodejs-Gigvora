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
import { NotFoundError } from '../utils/errors.js';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function ensureOrderOwnership(order, ownerId) {
  if (!order || Number(order.ownerId) !== Number(ownerId)) {
    throw new NotFoundError('Gig order not found.');
  }
  return order;
}

function normalizeDeliverables(deliverables = []) {
  if (!Array.isArray(deliverables)) {
    return [];
  }
  return deliverables
    .map((item, index) => {
      const title = typeof item?.title === 'string' ? item.title.trim() : '';
      if (!title) {
        return null;
      }
      const dueAt = item?.dueAt ? new Date(item.dueAt).toISOString() : null;
      const notes = typeof item?.notes === 'string' ? item.notes.trim() : null;
      const amount = item?.amount != null ? toNumber(item.amount, null) : null;
      const deliveryDays = item?.deliveryDays != null ? toNumber(item.deliveryDays, null) : null;
      return {
        id: item?.id != null ? Number(item.id) : undefined,
        title,
        dueAt,
        notes,
        amount,
        deliveryDays,
        ordinal: item?.ordinal != null ? Number(item.ordinal) : index + 1,
      };
    })
    .filter(Boolean);
}

function buildGigClasses(deliverables, { amount, currency }) {
  const resolvedCurrency = (currency && currency.toString().trim().toUpperCase()) || 'USD';
  const safeAmount = Math.max(toNumber(amount, 1200), 1200);
  const slice = deliverables.slice(0, 6);
  const baseShare = slice.length ? safeAmount / slice.length : safeAmount;

  const classes = slice.map((deliverable, index) => {
    const label = deliverable.title || `Deliverable ${index + 1}`;
    const share = deliverable.amount != null ? Math.max(toNumber(deliverable.amount), 50) : Math.max(baseShare, 50);
    const deliveryDays = deliverable.deliveryDays != null ? Math.max(toNumber(deliverable.deliveryDays), 1) : 7 * (index + 1);

    return {
      key: `deliverable-${index + 1}`,
      name: label.slice(0, 80),
      summary: deliverable.notes?.slice(0, 260) || 'Curated deliverable packaged for this engagement.',
      priceAmount: Math.round(share),
      priceCurrency: resolvedCurrency,
      deliveryDays,
      inclusions: [],
    };
  });

  while (classes.length < 3) {
    const ordinal = classes.length + 1;
    classes.push({
      key: `package-${ordinal}`,
      name: `Package ${ordinal}`,
      summary: 'Expanded scope with additional collaboration hours.',
      priceAmount: Math.round(safeAmount * (1 + ordinal * 0.15)),
      priceCurrency: resolvedCurrency,
      deliveryDays: 7 * (ordinal + 1),
      inclusions: [],
    });
  }

  return classes.slice(0, 6);
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

export async function getCompanyOrdersDashboard({ ownerId, status } = {}) {
  const overview = await getProjectGigManagementOverview(ownerId);
  const purchasedGigs = overview?.purchasedGigs ?? {};
  const orders = Array.isArray(purchasedGigs.orders) ? purchasedGigs.orders : [];
  const filteredOrders = status
    ? orders.filter((order) => {
        if (!order) return false;
        if (status === 'open') {
          return order.isClosed !== true && order.status !== 'closed';
        }
        if (status === 'closed') {
          return order.isClosed === true || order.status === 'closed';
        }
        return String(order.status).toLowerCase() === String(status).toLowerCase();
      })
    : orders;

  const metrics = deriveMetrics(filteredOrders, purchasedGigs.currency ?? 'USD');

  return {
    summary: overview?.summary ?? {},
    purchasedGigs: {
      ...purchasedGigs,
      orders: filteredOrders,
    },
    metrics,
    timeline: purchasedGigs.timeline ?? { upcoming: [], recent: [] },
    chat: purchasedGigs.chat ?? { recent: [] },
    permissions: {
      canManageOrders: true,
      canManageEscrow: true,
      canPostMessages: true,
    },
  };
}

export async function createCompanyOrder({ ownerId, payload = {} }) {
  const deliverables = normalizeDeliverables(payload.deliverables ?? payload.requirements);
  const classes = buildGigClasses(deliverables, { amount: payload.amount, currency: payload.currency });
  const requirements = deliverables.map((item) => ({
    id: item.id,
    title: item.title,
    dueAt: item.dueAt ?? null,
    status: payload.status ?? 'pending',
    notes: item.notes ?? null,
  }));

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

  return order;
}

export async function updateCompanyOrder({ ownerId, orderId, payload = {} }) {
  const updates = { ...payload };
  if (payload.deliverables || payload.requirements) {
    const deliverables = normalizeDeliverables(payload.deliverables ?? payload.requirements);
    updates.requirements = deliverables.map((item) => ({
      id: item.id,
      title: item.title,
      dueAt: item.dueAt ?? null,
      status: payload.status ?? 'pending',
      notes: item.notes ?? null,
    }));
    updates.classes = buildGigClasses(deliverables, { amount: payload.amount, currency: payload.currency });
    updates.metadata = {
      ...(payload.metadata ?? {}),
      deliverables,
    };
  }

  const order = await updateGigOrder(ownerId, orderId, updates);
  return order;
}

export async function deleteCompanyOrder({ ownerId, orderId }) {
  const order = await GigOrder.findByPk(orderId);
  ensureOrderOwnership(order, ownerId);
  await order.destroy();
  return { success: true };
}

export async function getCompanyOrderDetail({ ownerId, orderId }) {
  const detail = await getGigOrderDetail(ownerId, orderId, { messageLimit: 100 });
  return detail;
}

export async function createCompanyOrderTimeline({ ownerId, orderId, payload }) {
  return addGigTimelineEvent(ownerId, orderId, payload);
}

export async function updateCompanyOrderTimeline({ ownerId, orderId, eventId, payload }) {
  return updateGigTimelineEvent(ownerId, orderId, eventId, payload);
}

export async function deleteCompanyOrderTimeline({ ownerId, orderId, eventId }) {
  const order = await ensureOrderOwnership(await GigOrder.findByPk(orderId), ownerId);
  const event = await GigTimelineEvent.findByPk(eventId);
  if (!event || event.orderId !== order.id) {
    throw new NotFoundError('Timeline event not found.');
  }
  await event.destroy();
  return { success: true };
}

export async function postCompanyOrderMessage({ ownerId, orderId, payload, actor = {} }) {
  return createGigOrderMessage(ownerId, orderId, payload, {
    actorId: actor.id ?? ownerId,
    actorName: actor.name ?? payload.authorName ?? 'Company operator',
    actorRole: 'company',
  });
}

export async function createCompanyOrderEscrow({ ownerId, orderId, payload }) {
  return createGigOrderEscrowCheckpoint(ownerId, orderId, payload, { actorRole: 'company' });
}

export async function updateCompanyOrderEscrow({ ownerId, checkpointId, payload }) {
  return updateGigOrderEscrowCheckpoint(ownerId, checkpointId, payload, { actorRole: 'company' });
}

export async function submitCompanyOrderReview({ ownerId, orderId, payload }) {
  const updates = payload?.scorecard ? { scorecard: payload.scorecard } : payload;
  return updateGigOrder(ownerId, orderId, updates);
}

export async function deleteCompanyOrderSubmission({ ownerId, submissionId }) {
  const submission = await GigSubmission.findByPk(submissionId);
  if (!submission) {
    throw new NotFoundError('Submission not found.');
  }
  const order = await GigOrder.findByPk(submission.orderId);
  ensureOrderOwnership(order, ownerId);
  await submission.destroy();
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
