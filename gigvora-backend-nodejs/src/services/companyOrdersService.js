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
import { AuthorizationError, NotFoundError } from '../utils/errors.js';
import {
  normalizeDeliverables,
  buildGigClassesFromDeliverables,
  deriveOrderMetrics,
  evaluateSlaAlerts,
} from './utils/companyOrderNormalization.js';

function ensureOrderOwnership(order, ownerId) {
  if (!order || Number(order.ownerId) !== Number(ownerId)) {
    throw new NotFoundError('Gig order not found.');
  }
  return order;
}

const FINANCE_ROLE_HINTS = ['finance', 'controller', 'accounting', 'treasury'];
const OPERATIONS_ROLE_HINTS = ['operations', 'project', 'program'];
const ESCROW_SCOPE_HINTS = ['company.escrow:manage', 'finance:manage', 'company:finance:manage'];
const MESSAGE_SCOPE_HINTS = [
  'company.orders:comment',
  'project-gig-management:comment',
  'gig-orders:comment',
  'company.orders:manage',
];

function computePermissionFlags(access = {}) {
  const actorRole = access.actorRole ?? null;
  const normalizedRole = actorRole ? actorRole.toString().toLowerCase() : null;
  const permissions = Array.isArray(access.permissions)
    ? access.permissions.map((permission) => permission.toString().toLowerCase())
    : [];

  const hasFinanceRole = normalizedRole
    ? FINANCE_ROLE_HINTS.some((role) => normalizedRole.includes(role))
    : false;
  const hasOperationsRole = normalizedRole
    ? OPERATIONS_ROLE_HINTS.some((role) => normalizedRole.includes(role))
    : false;

  const hasEscrowScope = permissions.some((permission) => ESCROW_SCOPE_HINTS.includes(permission));
  const hasMessagingScope = permissions.some((permission) => MESSAGE_SCOPE_HINTS.includes(permission));

  const canManage = Boolean(access.canManage);
  const canView = Boolean(access.canView || canManage);
  const canManageEscrow = Boolean(canManage && (hasFinanceRole || hasEscrowScope));
  const canPostMessages = Boolean(canManage || hasOperationsRole || hasMessagingScope);

  return {
    canView,
    canManage,
    canManageEscrow,
    canPostMessages,
    actorId: access.actorId ?? null,
    actorRole: normalizedRole,
    allowedRoles: access.allowedRoles ?? [],
    permissions,
    reason: access.reason ?? null,
  };
}

function assertViewAccess(flags) {
  if (!flags.canView) {
    throw new AuthorizationError('You do not have permission to view these company orders.');
  }
}

function assertManageAccess(flags) {
  if (!flags.canManage) {
    throw new AuthorizationError(flags.reason ?? 'You do not have permission to manage these company orders.');
  }
}

function assertEscrowAccess(flags) {
  if (!flags.canManageEscrow) {
    throw new AuthorizationError('Escrow checkpoints require finance or company admin privileges.');
  }
}

function assertMessagingAccess(flags) {
  if (!flags.canPostMessages) {
    throw new AuthorizationError('You do not have permission to post updates for this order.');
  }
}

function buildPermissionsSummary(flags) {
  return {
    canManageOrders: flags.canManage,
    canManageEscrow: flags.canManageEscrow,
    canPostMessages: flags.canPostMessages,
    actorRole: flags.actorRole,
    allowedRoles: flags.allowedRoles,
    reason: flags.canManage ? null : flags.reason ?? null,
  };
}

const ATS_MILESTONE_MESSAGES = new Map([
  ['in_delivery', { title: 'Delivery started', summary: 'Order moved into delivery. ATS milestone updated accordingly.' }],
  [
    'in_revision',
    { title: 'Revision cycle triggered', summary: 'Order entered revision. ATS workflow notified for review alignment.' },
  ],
  [
    'completed',
    { title: 'Order completed', summary: 'Order marked completed. ATS approvals and hiring milestones synchronised.' },
  ],
]);

async function syncAtsMilestone({ ownerId, order, previousStatus, actorId }) {
  if (!order?.status) {
    return;
  }
  const normalizedStatus = String(order.status).toLowerCase();
  if (normalizedStatus === previousStatus?.toLowerCase()) {
    return;
  }

  const milestone = ATS_MILESTONE_MESSAGES.get(normalizedStatus);
  if (!milestone) {
    return;
  }

  await addGigTimelineEvent(ownerId, order.id, {
    eventType: 'milestone',
    title: milestone.title,
    summary: `${milestone.summary} Previous status: ${previousStatus ?? 'unknown'}.`,
    occurredAt: new Date().toISOString(),
    visibility: 'internal',
    metadata: {
      integration: 'ats',
      previousStatus: previousStatus ?? null,
      status: normalizedStatus,
      progressPercent: order.progressPercent ?? null,
    },
  }, {
    actorId: actorId ?? ownerId,
  });
}

async function escalateBreachedOrders({ ownerId, escalations, actorId }) {
  if (!Array.isArray(escalations) || !escalations.length) {
    return;
  }

  await Promise.all(
    escalations.map(async (entry) => {
      const order = entry.order ?? {};
      const metadata = order.metadata && typeof order.metadata === 'object' ? { ...order.metadata } : {};
      const triggeredAt = entry.triggeredAt ?? new Date().toISOString();

      await createGigOrderMessage(
        ownerId,
        entry.orderId,
        {
          body: `Automated support escalation: Order ${order.orderNumber ?? entry.orderId} for ${
            order.vendorName ?? 'vendor'
          } breached its delivery SLA on ${new Date(entry.dueAt).toLocaleString()}. Support desk has been notified.`,
          authorName: 'Gigvora Support Automations',
          roleLabel: 'support_escalation',
          visibility: 'shared',
        },
        {
          actorId: actorId ?? ownerId,
          actorRole: 'system',
          actorName: 'Gigvora Support Automations',
        },
      );

      await updateGigOrder(ownerId, entry.orderId, {
        metadata: {
          ...metadata,
          slaEscalatedAt: triggeredAt,
          slaStatus: 'breached',
        },
      });

      if (entry.order) {
        entry.order.metadata = {
          ...metadata,
          slaEscalatedAt: triggeredAt,
          slaStatus: 'breached',
        };
      }
    }),
  );
}

export async function getCompanyOrdersDashboard({ ownerId, status, accessContext = {}, now = new Date() } = {}) {
  const flags = computePermissionFlags(accessContext);
  assertViewAccess(flags);

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

  const metrics = deriveOrderMetrics(filteredOrders, purchasedGigs.currency ?? 'USD');
  const sla = evaluateSlaAlerts(filteredOrders, { now });

  if (flags.canManage && sla.escalations.length) {
    await escalateBreachedOrders({ ownerId, escalations: sla.escalations, actorId: flags.actorId });
  }

  return {
    summary: overview?.summary ?? {},
    purchasedGigs: {
      ...purchasedGigs,
      orders: filteredOrders,
    },
    metrics,
    timeline: purchasedGigs.timeline ?? { upcoming: [], recent: [] },
    chat: purchasedGigs.chat ?? { recent: [] },
    permissions: buildPermissionsSummary(flags),
    sla,
  };
}

export async function createCompanyOrder({ ownerId, payload = {}, accessContext = {} }) {
  const flags = computePermissionFlags(accessContext);
  assertManageAccess(flags);

  const deliverables = normalizeDeliverables(payload.deliverables ?? payload.requirements);
  const classes = buildGigClassesFromDeliverables(deliverables, { amount: payload.amount, currency: payload.currency });
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
      atsIntegration: {
        lastSyncedStatus: payload.status ?? 'requirements',
        lastSyncedAt: new Date().toISOString(),
      },
    },
    classes,
  });

  return order;
}

export async function updateCompanyOrder({ ownerId, orderId, payload = {}, accessContext = {} }) {
  const flags = computePermissionFlags(accessContext);
  assertManageAccess(flags);

  const existingOrder = await GigOrder.findByPk(orderId);
  ensureOrderOwnership(existingOrder, ownerId);
  const previousStatus = existingOrder.status ? String(existingOrder.status).toLowerCase() : null;

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
    updates.classes = buildGigClassesFromDeliverables(deliverables, { amount: payload.amount, currency: payload.currency });
    updates.metadata = {
      ...(payload.metadata ?? {}),
      deliverables,
    };
  }

  const nextStatus = (payload.status ?? existingOrder.status ?? '').toString().toLowerCase();
  if (previousStatus !== nextStatus) {
    updates.metadata = {
      ...(updates.metadata ?? payload.metadata ?? {}),
      atsIntegration: {
        ...(existingOrder.metadata?.atsIntegration ?? {}),
        lastSyncedStatus: nextStatus,
        previousStatus,
        lastSyncedAt: new Date().toISOString(),
      },
    };
  }

  const order = await updateGigOrder(ownerId, orderId, updates);
  await syncAtsMilestone({ ownerId, order, previousStatus, actorId: flags.actorId });
  return order;
}

export async function deleteCompanyOrder({ ownerId, orderId, accessContext = {} }) {
  const flags = computePermissionFlags(accessContext);
  assertManageAccess(flags);
  const order = await GigOrder.findByPk(orderId);
  ensureOrderOwnership(order, ownerId);
  await order.destroy();
  return { success: true };
}

export async function getCompanyOrderDetail({ ownerId, orderId, accessContext = {} }) {
  const flags = computePermissionFlags(accessContext);
  assertViewAccess(flags);
  const detail = await getGigOrderDetail(ownerId, orderId, { messageLimit: 100 });
  return detail;
}

export async function createCompanyOrderTimeline({ ownerId, orderId, payload, accessContext = {} }) {
  const flags = computePermissionFlags(accessContext);
  assertManageAccess(flags);
  return addGigTimelineEvent(ownerId, orderId, payload);
}

export async function updateCompanyOrderTimeline({ ownerId, orderId, eventId, payload, accessContext = {} }) {
  const flags = computePermissionFlags(accessContext);
  assertManageAccess(flags);
  return updateGigTimelineEvent(ownerId, orderId, eventId, payload);
}

export async function deleteCompanyOrderTimeline({ ownerId, orderId, eventId, accessContext = {} }) {
  const flags = computePermissionFlags(accessContext);
  assertManageAccess(flags);
  const order = await ensureOrderOwnership(await GigOrder.findByPk(orderId), ownerId);
  const event = await GigTimelineEvent.findByPk(eventId);
  if (!event || event.orderId !== order.id) {
    throw new NotFoundError('Timeline event not found.');
  }
  await event.destroy();
  return { success: true };
}

export async function postCompanyOrderMessage({ ownerId, orderId, payload, actor = {}, accessContext = {} }) {
  const flags = computePermissionFlags(accessContext);
  assertMessagingAccess(flags);
  return createGigOrderMessage(ownerId, orderId, payload, {
    actorId: actor.id ?? ownerId,
    actorName: actor.name ?? payload.authorName ?? 'Company operator',
    actorRole: 'company',
  });
}

export async function createCompanyOrderEscrow({ ownerId, orderId, payload, accessContext = {} }) {
  const flags = computePermissionFlags(accessContext);
  assertEscrowAccess(flags);
  return createGigOrderEscrowCheckpoint(ownerId, orderId, payload, { actorRole: 'company' });
}

export async function updateCompanyOrderEscrow({ ownerId, checkpointId, payload, accessContext = {} }) {
  const flags = computePermissionFlags(accessContext);
  assertEscrowAccess(flags);
  return updateGigOrderEscrowCheckpoint(ownerId, checkpointId, payload, { actorRole: 'company' });
}

export async function submitCompanyOrderReview({ ownerId, orderId, payload, accessContext = {} }) {
  const flags = computePermissionFlags(accessContext);
  assertManageAccess(flags);
  const updates = payload?.scorecard ? { scorecard: payload.scorecard } : payload;
  return updateGigOrder(ownerId, orderId, updates);
}

export async function deleteCompanyOrderSubmission({ ownerId, submissionId, accessContext = {} }) {
  const flags = computePermissionFlags(accessContext);
  assertManageAccess(flags);
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
