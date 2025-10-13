import {
  Gig,
  GigOrder,
  GigOrderRequirement,
  GigOrderRevision,
  GigOrderPayout,
  GigOrderActivity,
  User,
  Profile,
  FreelancerProfile,
} from '../models/index.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { ValidationError } from '../utils/errors.js';

const CACHE_NAMESPACE = 'freelancer:purchased_gigs';
const CACHE_TTL_SECONDS = 60;

const REVISION_ACTIVE_STATUSES = new Set(['requested', 'in_progress', 'submitted']);
const PENDING_PAYOUT_STATUSES = new Set(['pending', 'scheduled', 'at_risk', 'on_hold']);

function normalizeFreelancerId(rawId) {
  const parsed = Number.parseInt(rawId, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError('freelancerId must be a positive integer.');
  }
  return parsed;
}

function toPlain(instance) {
  if (!instance) {
    return null;
  }
  if (typeof instance.toPublicObject === 'function') {
    return instance.toPublicObject();
  }
  if (typeof instance.get === 'function') {
    return instance.get({ plain: true });
  }
  return { ...instance };
}

function coerceArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

function sanitizeOrder(instance) {
  const base = toPlain(instance);
  if (!base) {
    return null;
  }

  const gigInstance = instance?.get?.('gig') ?? instance?.gig;
  const gig = gigInstance
    ? {
        id: gigInstance.id,
        title: gigInstance.title,
      }
    : null;

  const clientInstance = instance?.get?.('client') ?? instance?.client;
  const client = clientInstance
    ? {
        id: clientInstance.id,
        firstName: clientInstance.firstName,
        lastName: clientInstance.lastName,
        email: clientInstance.email,
        name: `${clientInstance.firstName ?? ''} ${clientInstance.lastName ?? ''}`.trim() || base.clientCompanyName,
      }
    : null;

  const requirements = coerceArray(instance?.get?.('requirements') ?? instance?.requirements).map((req) =>
    toPlain(req),
  );
  const revisions = coerceArray(instance?.get?.('revisions') ?? instance?.revisions).map((rev) => toPlain(rev));
  const payouts = coerceArray(instance?.get?.('payouts') ?? instance?.payouts).map((payout) => toPlain(payout));

  const requirementsOutstanding = requirements.filter((req) => req?.status === 'pending').length;
  const revisionCycles = revisions.length;

  const nextMilestone = payouts
    .filter((payout) => payout && payout.status !== 'released')
    .sort((a, b) => {
      const first = a?.expectedAt ? new Date(a.expectedAt).getTime() : Number.POSITIVE_INFINITY;
      const second = b?.expectedAt ? new Date(b.expectedAt).getTime() : Number.POSITIVE_INFINITY;
      return first - second;
    })[0] ?? null;

  return {
    ...base,
    amount: base.amount == null ? 0 : Number(base.amount),
    gig,
    client,
    requirements: requirements.map((req) => ({
      ...req,
      items: Array.isArray(req?.items) ? req.items : [],
    })),
    revisions: revisions.map((rev) => ({
      ...rev,
      focusAreas: Array.isArray(rev?.focusAreas) ? rev.focusAreas : [],
    })),
    payouts: payouts.map((payout) => ({
      ...payout,
      amount: payout?.amount == null ? 0 : Number(payout.amount),
    })),
    requirementsOutstanding,
    revisionCycles,
    nextMilestone,
  };
}

function buildPipeline(orders) {
  const stages = [
    {
      key: 'awaiting_requirements',
      label: 'Awaiting requirements',
      description: 'Kickoff forms or initial assets pending from the client.',
      statuses: ['awaiting_requirements'],
    },
    {
      key: 'in_progress',
      label: 'In progress',
      description: 'Delivery is underway with milestones scheduled.',
      statuses: ['in_progress'],
    },
    {
      key: 'revision_requested',
      label: 'Revisions',
      description: 'Feedback loops active and requiring turnaround.',
      statuses: ['revision_requested'],
    },
    {
      key: 'ready_for_payout',
      label: 'Ready for payout',
      description: 'Approved for release or awaiting final confirmation.',
      statuses: ['ready_for_payout', 'completed'],
    },
  ];

  return stages.map((stage) => {
    const filtered = orders
      .filter((order) => stage.statuses.includes(order.status))
      .sort((a, b) => {
        const first = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
        const second = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
        return first - second;
      });
    return {
      key: stage.key,
      label: stage.label,
      description: stage.description,
      orders: filtered,
    };
  });
}

function buildRequirementQueue(orders) {
  const items = [];
  orders.forEach((order) => {
    order.requirements
      .filter((requirement) => requirement?.status === 'pending')
      .forEach((requirement) => {
        items.push({
          id: requirement.id,
          orderId: order.id,
          orderNumber: order.orderNumber,
          gig: order.gig,
          clientCompanyName: order.clientCompanyName,
          clientContactName: order.clientContactName || order.client?.name || null,
          priority: requirement.priority ?? 'medium',
          dueAt: requirement.dueAt ?? order.kickoffDueAt ?? order.dueAt ?? null,
          requestedAt: requirement.requestedAt ?? order.submittedAt ?? null,
          items: Array.isArray(requirement.items) ? requirement.items : [],
        });
      });
  });
  return items.sort((a, b) => {
    const first = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
    const second = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
    return first - second;
  });
}

function buildRevisionQueue(orders) {
  const entries = [];
  orders.forEach((order) => {
    order.revisions
      .filter((revision) => REVISION_ACTIVE_STATUSES.has(revision.status))
      .forEach((revision) => {
        entries.push({
          id: revision.id,
          orderId: order.id,
          orderNumber: order.orderNumber,
          gig: order.gig,
          clientCompanyName: order.clientCompanyName,
          roundNumber: revision.roundNumber ?? 1,
          status: revision.status,
          severity: revision.severity ?? 'medium',
          focusAreas: Array.isArray(revision.focusAreas) ? revision.focusAreas : [],
          requestedAt: revision.requestedAt ?? null,
          dueAt: revision.dueAt ?? null,
          submittedAt: revision.submittedAt ?? null,
        });
      });
  });
  return entries.sort((a, b) => {
    const first = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
    const second = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
    return first - second;
  });
}

function buildPayoutSchedule(orders) {
  const payouts = [];
  orders.forEach((order) => {
    order.payouts.forEach((payout) => {
      payouts.push({
        ...payout,
        orderId: order.id,
        orderNumber: order.orderNumber,
        clientCompanyName: order.clientCompanyName,
        gig: order.gig,
      });
    });
  });

  return payouts.sort((a, b) => {
    const first = a.expectedAt ? new Date(a.expectedAt).getTime() : Number.POSITIVE_INFINITY;
    const second = b.expectedAt ? new Date(b.expectedAt).getTime() : Number.POSITIVE_INFINITY;
    return first - second;
  });
}

async function fetchActivityFeed(freelancerId) {
  const activities = await GigOrderActivity.findAll({
    where: { freelancerId },
    include: [
      {
        model: GigOrder,
        as: 'order',
        include: [
          { model: Gig, as: 'gig' },
          { model: User, as: 'client', attributes: ['id', 'firstName', 'lastName', 'email'] },
        ],
      },
      { model: User, as: 'actor', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
    order: [['occurredAt', 'DESC']],
    limit: 25,
  });

  return activities.map((activity) => {
    const base = toPlain(activity);
    const orderInstance = activity.get?.('order') ?? activity.order;
    const actorInstance = activity.get?.('actor') ?? activity.actor;
    const order = orderInstance ? sanitizeOrder(orderInstance) : null;
    const actor = actorInstance
      ? {
          id: actorInstance.id,
          firstName: actorInstance.firstName,
          lastName: actorInstance.lastName,
          email: actorInstance.email,
        }
      : null;

    return {
      ...base,
      order: order
        ? {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            gig: order.gig,
            clientCompanyName: order.clientCompanyName,
          }
        : null,
      actor,
    };
  });
}

function calculateSummary(orders, { requirementQueue, revisionQueue, payoutSchedule }) {
  const summary = {
    activeOrders: 0,
    requirementsDue: requirementQueue.length,
    revisionCount: revisionQueue.length,
    pendingPayoutValue: 0,
    pipelineValue: 0,
    payoutsDueThisWeek: 0,
  };

  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  orders.forEach((order) => {
    if (!['completed', 'cancelled'].includes(order.status)) {
      summary.activeOrders += 1;
    }
    summary.pipelineValue += Number.isFinite(order.amount) ? order.amount : 0;
    order.payouts.forEach((payout) => {
      if (PENDING_PAYOUT_STATUSES.has(payout.status)) {
        summary.pendingPayoutValue += payout.amount ?? 0;
        const expectedAt = payout.expectedAt ? new Date(payout.expectedAt) : null;
        if (expectedAt && expectedAt >= now && expectedAt <= inSevenDays) {
          summary.payoutsDueThisWeek += 1;
        }
      }
    });
  });

  summary.pendingPayoutValue = Number(summary.pendingPayoutValue.toFixed(2));
  summary.pipelineValue = Number(summary.pipelineValue.toFixed(2));

  return summary;
}

async function loadFreelancerProfile(freelancerId) {
  const freelancer = await User.findByPk(freelancerId, {
    include: [Profile, FreelancerProfile],
  });
  if (!freelancer) {
    return null;
  }
  const plain = freelancer.get({ plain: true });
  const profile = plain.Profile ?? {};
  const freelancerProfile = plain.FreelancerProfile ?? {};
  const name = `${plain.firstName ?? ''} ${plain.lastName ?? ''}`.trim();
  const availabilityStatus = profile.availabilityStatus ?? null;
  const statusLabel = availabilityStatus
    ? `${availabilityStatus.replace(/_/g, ' ')}`
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : null;

  return {
    id: plain.id,
    name: name || plain.email,
    firstName: plain.firstName,
    lastName: plain.lastName,
    email: plain.email,
    headline: profile.headline ?? freelancerProfile.title ?? null,
    role: freelancerProfile.title ?? 'Freelancer',
    availabilityStatus,
    availabilityStatusLabel: statusLabel,
    badges: Array.isArray(profile.volunteerBadges) ? profile.volunteerBadges : [],
    metrics: {
      likesCount: profile.likesCount ?? 0,
      followersCount: profile.followersCount ?? 0,
      trustScore: profile.trustScore == null ? null : Number(profile.trustScore),
    },
  };
}

async function fetchDashboard(freelancerId) {
  const [orders, activityFeed, freelancer] = await Promise.all([
    GigOrder.findAll({
      where: { freelancerId },
      include: [
        { model: Gig, as: 'gig' },
        { model: User, as: 'client', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: GigOrderRequirement, as: 'requirements' },
        { model: GigOrderRevision, as: 'revisions' },
        { model: GigOrderPayout, as: 'payouts' },
      ],
      order: [
        ['submittedAt', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    ]),
    fetchActivityFeed(freelancerId),
    loadFreelancerProfile(freelancerId),
  ]);

  const sanitizedOrders = orders.map(sanitizeOrder).filter(Boolean);
  const requirementQueue = buildRequirementQueue(sanitizedOrders);
  const revisionQueue = buildRevisionQueue(sanitizedOrders);
  const payoutSchedule = buildPayoutSchedule(sanitizedOrders);
  const summary = calculateSummary(sanitizedOrders, {
    requirementQueue,
    revisionQueue,
    payoutSchedule,
  });

  const pipeline = buildPipeline(sanitizedOrders);

  return {
    freelancer,
    summary,
    pipeline,
    requirementQueue,
    revisionQueue,
    payoutSchedule,
    activityFeed,
    orders: sanitizedOrders,
  };
}

export async function getFreelancerPurchasedGigDashboard(rawFreelancerId, { bypassCache = false } = {}) {
  const freelancerId = normalizeFreelancerId(rawFreelancerId);
  const cacheKey = buildCacheKey(CACHE_NAMESPACE, { freelancerId });

  if (bypassCache) {
    return fetchDashboard(freelancerId);
  }

  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, () => fetchDashboard(freelancerId));
}

export default {
  getFreelancerPurchasedGigDashboard,
};
