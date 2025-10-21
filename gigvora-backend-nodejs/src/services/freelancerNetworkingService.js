import { Op } from 'sequelize';
import {
  sequelize,
  User,
  NetworkingSession,
  NetworkingSessionSignup,
  NetworkingConnection,
  NetworkingBusinessCard,
  NetworkingSessionOrder,
  AdCampaign,
  ProviderWorkspaceMember,
  NETWORKING_SESSION_SIGNUP_STATUSES,
  NETWORKING_SIGNUP_PAYMENT_STATUSES,
  NETWORKING_CONNECTION_STATUSES,
  NETWORKING_CONNECTION_TYPES,
  NETWORKING_SESSION_ORDER_STATUSES,
  AD_STATUSES,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import {
  listPurchases as listUserNetworkingPurchases,
  createPurchase as createUserNetworkingPurchase,
  updatePurchase as updateUserNetworkingPurchase,
} from './userNetworkingService.js';
import { registerForNetworkingSession } from './networkingService.js';

const UPCOMING_STATUSES = new Set(['scheduled', 'in_progress']);
const COMPLETED_SIGNUP_STATUSES = new Set(['completed']);
const CANCELLED_SIGNUP_STATUSES = new Set(['removed']);

function normalizeInteger(value) {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function toCents(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('Purchase amount must be a numeric value.');
  }
  return Math.round(numeric * 100);
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError('Invalid date supplied.');
  }
  return date;
}

function normalizePaymentStatus(value) {
  if (!value) {
    return undefined;
  }
  const lowered = String(value).toLowerCase();
  const valid = NETWORKING_SIGNUP_PAYMENT_STATUSES.find((status) => status === lowered);
  if (!valid) {
    throw new ValidationError('Unsupported payment status.');
  }
  return valid;
}

function normalizeConnectionStatus(value) {
  if (!value) {
    return undefined;
  }
  const lowered = String(value).toLowerCase();
  const valid = NETWORKING_CONNECTION_STATUSES.find((status) => status === lowered);
  if (!valid) {
    throw new ValidationError('Unsupported connection status.');
  }
  return valid;
}

function normalizeConnectionType(value) {
  if (!value) {
    return undefined;
  }
  const lowered = String(value).toLowerCase();
  const valid = NETWORKING_CONNECTION_TYPES.find((status) => status === lowered);
  if (!valid) {
    throw new ValidationError('Unsupported connection type.');
  }
  return valid;
}

function toCurrencyString(cents, currency = 'USD') {
  const numeric = Number(cents ?? 0) / 100;
  if (!Number.isFinite(numeric)) {
    return `${currency} —`;
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch (error) {
    return `${currency} ${numeric.toFixed(0)}`;
  }
}

function normaliseBudgetCents(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('Budget must be numeric.');
  }
  return Math.max(0, Math.round(numeric * 100));
}

function ensureAdStatus(value) {
  if (!value) {
    return AD_STATUSES[0];
  }
  const normalised = String(value).toLowerCase();
  if (!AD_STATUSES.includes(normalised)) {
    throw new ValidationError(`Status must be one of: ${AD_STATUSES.join(', ')}.`);
  }
  return normalised;
}

function formatName(user) {
  if (!user) {
    return null;
  }
  const parts = [user.firstName, user.lastName].filter(Boolean);
  const name = parts.join(' ').trim();
  return name || user.email || null;
}

async function getOrCreateBusinessCard(freelancer) {
  const existing = await NetworkingBusinessCard.findOne({
    where: { ownerId: freelancer.id },
    order: [
      ['updatedAt', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });
  if (existing) {
    return existing;
  }

  const defaultPreferences = {
    shareAvailability: true,
    autoShareCard: true,
    calendarSync: 'google',
    digestFrequency: 'weekly',
    allowMentorIntroductions: true,
    followUpReminders: true,
  };

  return NetworkingBusinessCard.create({
    ownerId: freelancer.id,
    title: formatName(freelancer) ?? 'Networking professional',
    headline: 'Freelance networking partner',
    status: 'draft',
    contactEmail: freelancer.email ?? null,
    preferences: defaultPreferences,
    metadata: { createdBy: 'freelancer_networking_dashboard' },
  });
}

function sanitizeBusinessCard(card) {
  if (!card) {
    return null;
  }
  const payload = card.toPublicObject();
  return {
    id: payload.id,
    title: payload.title,
    headline: payload.headline,
    bio: payload.bio,
    contactEmail: payload.contactEmail,
    contactPhone: payload.contactPhone,
    websiteUrl: payload.websiteUrl,
    linkedinUrl: payload.linkedinUrl,
    calendlyUrl: payload.calendlyUrl,
    portfolioUrl: payload.portfolioUrl,
    attachments: payload.attachments ?? [],
    spotlightVideoUrl: payload.spotlightVideoUrl ?? null,
    status: payload.status,
    preferences: payload.preferences ?? {},
    metadata: payload.metadata ?? {},
    updatedAt: payload.updatedAt,
  };
}

function sanitizeOrder(order) {
  if (!order) {
    return null;
  }
  const payload = order.toPublicObject ? order.toPublicObject() : order;
  return {
    id: payload.id,
    sessionId: payload.sessionId,
    purchaserId: payload.purchaserId,
    status: payload.status,
    amountCents: payload.amountCents ?? 0,
    currency: payload.currency ?? 'USD',
    purchasedAt: payload.purchasedAt ?? null,
    reference: payload.reference ?? null,
    purchaserEmail: payload.purchaserEmail ?? null,
    purchaserName: payload.purchaserName ?? null,
    metadata: payload.metadata ?? {},
    session: payload.session ?? null,
    createdAt: payload.createdAt ?? null,
    updatedAt: payload.updatedAt ?? null,
  };
}

function summariseOrders(orders = []) {
  const paid = orders.filter((order) => order.status === 'paid');
  const pending = orders.filter((order) => order.status === 'pending');
  const refunded = orders.filter((order) => order.status === 'refunded');
  const cancelled = orders.filter((order) => order.status === 'cancelled');
  const currency = orders.find((order) => order.currency)?.currency ?? 'USD';

  const totalSpendCents = paid.reduce((total, order) => total + (order.amountCents ?? 0), 0);
  const pendingCents = pending.reduce((total, order) => total + (order.amountCents ?? 0), 0);
  const refundedCents = refunded.reduce((total, order) => total + (order.amountCents ?? 0), 0);

  return {
    totals: {
      total: orders.length,
      paid: paid.length,
      pending: pending.length,
      refunded: refunded.length,
      cancelled: cancelled.length,
    },
    spend: {
      currency,
      totalSpendCents,
      totalSpendFormatted: toCurrencyString(totalSpendCents, currency),
      pendingCents,
      pendingFormatted: toCurrencyString(pendingCents, currency),
      refundedCents,
      refundedFormatted: toCurrencyString(refundedCents, currency),
    },
  };
}

function computeWeeklyBuckets({ bookings, connections, orders }) {
  const now = new Date();
  const startOfWeek = (input) => {
    const date = new Date(input);
    date.setUTCHours(0, 0, 0, 0);
    const day = date.getUTCDay();
    date.setUTCDate(date.getUTCDate() - day);
    return date;
  };
  const labelForWeek = (start) => {
    return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const buckets = new Map();
  for (let offset = 5; offset >= 0; offset -= 1) {
    const anchor = new Date(now);
    anchor.setUTCDate(anchor.getUTCDate() - offset * 7);
    const start = startOfWeek(anchor);
    buckets.set(start.getTime(), {
      week: labelForWeek(start),
      start,
      end: new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000),
      bookings: 0,
      connections: 0,
      spendCents: 0,
    });
  }

  const assign = (date, key, incrementCents = 0) => {
    if (!date) {
      return;
    }
    const start = startOfWeek(date);
    const bucket = buckets.get(start.getTime());
    if (!bucket) {
      return;
    }
    bucket[key] += 1;
    if (incrementCents) {
      bucket.spendCents += incrementCents;
    }
  };

  bookings.forEach((booking) => {
    const sessionDate = booking.session?.startTime ? new Date(booking.session.startTime) : null;
    assign(sessionDate, 'bookings');
  });

  connections.forEach((connection) => {
    const interacted = connection.firstInteractedAt ? new Date(connection.firstInteractedAt) : null;
    assign(interacted ?? connection.createdAt, 'connections');
  });

  orders.forEach((order) => {
    const purchasedAt = order.purchasedAt ? new Date(order.purchasedAt) : null;
    assign(purchasedAt, 'bookings', order.amountCents ?? 0);
  });

  return Array.from(buckets.values()).map((bucket) => ({
    week: bucket.week,
    bookings: bucket.bookings,
    connections: bucket.connections,
    spendCents: bucket.spendCents,
  }));
}

function computeNetworkingMetrics({ bookings, connections, orders }) {
  const totalBookings = bookings.length;
  const completedBookings = bookings.filter((booking) => booking.status === 'completed' || booking.session?.status === 'completed');
  const cancelledBookings = bookings.filter((booking) => booking.status === 'removed' || booking.session?.status === 'cancelled');

  const totalConnections = connections.length;
  const followUpConnections = connections.filter((connection) => connection.status === 'follow_up');
  const connectedConnections = connections.filter((connection) => connection.status === 'connected');

  const paidOrders = orders.filter((order) => order.status === 'paid');
  const currency = orders.find((order) => order.currency)?.currency ?? 'USD';
  const totalSpendCents = paidOrders.reduce((total, order) => total + (order.amountCents ?? 0), 0);
  const averageSpendCents = paidOrders.length ? Math.round(totalSpendCents / paidOrders.length) : 0;

  const weeklyActivity = computeWeeklyBuckets({ bookings, connections, orders });

  const sessionMap = new Map();
  bookings.forEach((booking) => {
    const session = booking.session;
    if (!session) {
      return;
    }
    const entry = sessionMap.get(session.id) ?? {
      id: session.id,
      title: session.title,
      status: session.status,
      bookings: 0,
      spendCents: 0,
      lastActivityAt: null,
    };
    entry.bookings += 1;
    const sessionDate = session.endTime ? new Date(session.endTime) : session.startTime ? new Date(session.startTime) : null;
    if (sessionDate && (!entry.lastActivityAt || sessionDate > entry.lastActivityAt)) {
      entry.lastActivityAt = sessionDate;
    }
    sessionMap.set(session.id, entry);
  });

  orders.forEach((order) => {
    if (!order.sessionId) {
      return;
    }
    const entry = sessionMap.get(order.sessionId) ?? {
      id: order.sessionId,
      title: order.session?.title ?? 'Networking session',
      status: order.session?.status ?? 'scheduled',
      bookings: 0,
      spendCents: 0,
      lastActivityAt: null,
    };
    entry.spendCents += order.amountCents ?? 0;
    const purchaseDate = order.purchasedAt ? new Date(order.purchasedAt) : null;
    if (purchaseDate && (!entry.lastActivityAt || purchaseDate > entry.lastActivityAt)) {
      entry.lastActivityAt = purchaseDate;
    }
    sessionMap.set(order.sessionId, entry);
  });

  const topSessions = Array.from(sessionMap.values())
    .sort((a, b) => {
      if (b.bookings !== a.bookings) {
        return b.bookings - a.bookings;
      }
      return b.spendCents - a.spendCents;
    })
    .slice(0, 5)
    .map((entry) => ({
      ...entry,
      lastActivityAt: entry.lastActivityAt ? entry.lastActivityAt.toISOString() : null,
      spendFormatted: toCurrencyString(entry.spendCents, currency),
    }));

  return {
    conversions: {
      attendanceRate: totalBookings ? Number(((completedBookings.length / totalBookings) * 100).toFixed(1)) : 0,
      cancellationRate: totalBookings ? Number(((cancelledBookings.length / totalBookings) * 100).toFixed(1)) : 0,
      followUpRate: totalConnections ? Number(((followUpConnections.length / totalConnections) * 100).toFixed(1)) : 0,
      connectionCloseRate: totalConnections ? Number(((connectedConnections.length / totalConnections) * 100).toFixed(1)) : 0,
      paidRate: orders.length ? Number(((paidOrders.length / orders.length) * 100).toFixed(1)) : 0,
    },
    spend: {
      totalSpendCents,
      totalSpendFormatted: toCurrencyString(totalSpendCents, currency),
      averageSpendCents,
      averageSpendFormatted: toCurrencyString(averageSpendCents, currency),
    },
    topSessions,
    weeklyActivity,
  };
}

function sanitizeCampaign(campaign) {
  if (!campaign) {
    return null;
  }
  const payload = campaign.toPublicObject ? campaign.toPublicObject() : campaign;
  const metrics = payload.metadata?.metrics ?? {};
  const spendCents = metrics.spendCents ?? payload.metadata?.spendCents ?? 0;
  const impressions = metrics.impressions ?? payload.metadata?.impressions ?? 0;
  const clicks = metrics.clicks ?? payload.metadata?.clicks ?? 0;
  const conversions = metrics.conversions ?? payload.metadata?.conversions ?? 0;

  return {
    id: payload.id,
    name: payload.name,
    objective: payload.objective,
    status: payload.status,
    budgetCents: payload.budgetCents ?? null,
    currencyCode: payload.currencyCode ?? 'USD',
    startDate: payload.startDate ?? null,
    endDate: payload.endDate ?? null,
    ownerId: payload.ownerId ?? null,
    metadata: payload.metadata ?? {},
    metrics: {
      spendCents,
      impressions,
      clicks,
      conversions,
    },
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  };
}

function buildAdInsights(campaigns = []) {
  if (!campaigns.length) {
    return {
      totalSpendCents: 0,
      totalSpendFormatted: toCurrencyString(0),
      totalImpressions: 0,
      totalClicks: 0,
      averageCpc: 0,
      activeCampaigns: 0,
    };
  }
  const totalSpendCents = campaigns.reduce((total, campaign) => total + (campaign.metrics?.spendCents ?? 0), 0);
  const totalImpressions = campaigns.reduce((total, campaign) => total + (campaign.metrics?.impressions ?? 0), 0);
  const totalClicks = campaigns.reduce((total, campaign) => total + (campaign.metrics?.clicks ?? 0), 0);
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === 'active').length;
  const averageCpc = totalClicks ? Number(((totalSpendCents / totalClicks) / 100).toFixed(2)) : 0;

  return {
    totalSpendCents,
    totalSpendFormatted: toCurrencyString(totalSpendCents),
    totalImpressions,
    totalClicks,
    averageCpc,
    activeCampaigns,
  };
}

async function fetchFreelancer(freelancerId) {
  const freelancer = await User.findByPk(freelancerId, {
    attributes: ['id', 'firstName', 'lastName', 'email'],
  });
  if (!freelancer) {
    throw new NotFoundError('Freelancer not found.');
  }
  return freelancer;
}

async function resolveWorkspaceIds(freelancerId) {
  const memberships = await ProviderWorkspaceMember.findAll({
    where: { userId: freelancerId, status: 'active' },
    attributes: ['workspaceId'],
  });
  return memberships.map((membership) => membership.workspaceId).filter((id) => Number.isFinite(id));
}

async function listAvailableSessions(freelancerId, { limit = 25 } = {}) {
  const workspaceIds = await resolveWorkspaceIds(freelancerId);
  const visibilityFilters = [{ visibility: 'public' }];
  if (workspaceIds.length) {
    visibilityFilters.push({ visibility: 'workspace', companyId: { [Op.in]: workspaceIds } });
  }

  const sessions = await NetworkingSession.findAll({
    where: {
      status: { [Op.in]: ['scheduled', 'in_progress'] },
      [Op.or]: visibilityFilters,
    },
    order: [
      ['startTime', 'ASC'],
      ['createdAt', 'DESC'],
    ],
    limit,
  });

  return sessions.map((session) => session.toPublicObject());
}

async function listConnections(freelancerId, { limit = 100 } = {}) {
  const connections = await NetworkingConnection.findAll({
    where: {
      [Op.or]: [{ sourceParticipantId: freelancerId }, { targetParticipantId: freelancerId }],
    },
    include: [
      {
        model: NetworkingSession,
        as: 'session',
        attributes: ['id', 'title', 'startTime', 'endTime', 'status'],
      },
      {
        model: User,
        as: 'sourceParticipant',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: User,
        as: 'targetParticipant',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
    ],
    order: [
      ['followUpAt', 'ASC'],
      ['createdAt', 'DESC'],
    ],
    limit: Math.max(1, Math.min(100, limit)),
  });

  return connections.map((connection) => {
    const serialized = connection.toPublicObject();
    const isSource = Number(serialized.sourceParticipantId) === Number(freelancerId);
    const counterpartParticipant = isSource
      ? serialized.targetParticipant
      : serialized.sourceParticipant;

    return {
      ...serialized,
      counterpart: {
        name: counterpartParticipant?.name ?? serialized.counterpartName ?? null,
        email: counterpartParticipant?.email ?? serialized.counterpartEmail ?? null,
        participantId: counterpartParticipant?.id ?? (isSource
          ? serialized.targetParticipantId
          : serialized.sourceParticipantId),
      },
    };
  });
}

export async function getFreelancerNetworkingDashboard(
  freelancerId,
  { lookbackDays = 180, limitConnections = 100 } = {},
) {
  const freelancer = await fetchFreelancer(freelancerId);
  const since = Number.isFinite(Number(lookbackDays))
    ? new Date(Date.now() - Number(lookbackDays) * 24 * 60 * 60 * 1000)
    : null;

  const signupWhere = { participantId: freelancerId };
  if (since) {
    signupWhere.createdAt = { [Op.gte]: since };
  }

  const signups = await NetworkingSessionSignup.findAll({
    where: signupWhere,
    include: [
      {
        model: NetworkingSession,
        as: 'session',
        attributes: [
          'id',
          'title',
          'status',
          'startTime',
          'endTime',
          'accessType',
          'priceCents',
          'currency',
          'joinLimit',
        ],
      },
      {
        model: NetworkingBusinessCard,
        as: 'businessCard',
        attributes: ['id', 'title'],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: 200,
  });

  const now = Date.now();
  let upcomingCount = 0;
  let completedCount = 0;
  let cancelledCount = 0;
  let paidSessions = 0;
  let pendingPayment = 0;
  let totalSpendCents = 0;

  const bookings = signups.map((signup) => {
    const booking = signup.toPublicObject();
    const session = signup.session ? signup.session.toPublicObject() : null;
    const startTime = session?.startTime ? new Date(session.startTime).getTime() : null;

    if (session && UPCOMING_STATUSES.has(session.status ?? '')) {
      if (startTime == null || startTime >= now) {
        upcomingCount += 1;
      }
    }
    if (
      COMPLETED_SIGNUP_STATUSES.has(booking.status ?? '') ||
      (session && session.status === 'completed')
    ) {
      completedCount += 1;
    }
    if (CANCELLED_SIGNUP_STATUSES.has(booking.status ?? '') || session?.status === 'cancelled') {
      cancelledCount += 1;
    }

    if (booking.paymentStatus === 'paid') {
      paidSessions += 1;
      totalSpendCents += booking.purchaseCents ?? 0;
    } else if (booking.paymentStatus === 'pending') {
      pendingPayment += 1;
    }

    return {
      ...booking,
      session,
    };
  });

  const [availableSessions, connections, rawOrders, businessCard, campaigns] = await Promise.all([
    listAvailableSessions(freelancerId, { limit: 25 }),
    listConnections(freelancerId, { limit: limitConnections }),
    listUserNetworkingPurchases(freelancerId, { limit: 200 }),
    getOrCreateBusinessCard(freelancer),
    listFreelancerNetworkingCampaigns(freelancerId),
  ]);

  const orders = rawOrders.map((order) => sanitizeOrder(order));
  const metrics = computeNetworkingMetrics({ bookings, connections, orders });
  const orderSummary = summariseOrders(orders);
  const businessCardPayload = sanitizeBusinessCard(businessCard);
  const adsInsights = buildAdInsights(campaigns);

  return {
    freelancer: {
      id: freelancer.id,
      name: formatName(freelancer),
      email: freelancer.email ?? null,
    },
    summary: {
      totalBookings: bookings.length,
      upcomingSessions: upcomingCount,
      completedSessions: completedCount,
      cancelledSessions: cancelledCount,
      paidSessions,
      pendingPayment,
      totalSpendCents,
    },
    bookings,
    availableSessions,
    connections: {
      total: connections.length,
      items: connections,
    },
    metrics,
    orders: {
      items: orders,
      summary: orderSummary,
    },
    settings: {
      businessCard: businessCardPayload,
    },
    preferences: businessCardPayload?.preferences ?? {},
    ads: {
      campaigns,
      insights: adsInsights,
    },
    config: {
      paymentStatuses: NETWORKING_SIGNUP_PAYMENT_STATUSES,
      signupStatuses: NETWORKING_SESSION_SIGNUP_STATUSES,
      connectionStatuses: NETWORKING_CONNECTION_STATUSES,
      connectionTypes: NETWORKING_CONNECTION_TYPES,
      orderStatuses: NETWORKING_SESSION_ORDER_STATUSES,
    },
  };
}

export async function bookNetworkingSessionForFreelancer(
  freelancerId,
  sessionId,
  payload = {},
) {
  const freelancer = await fetchFreelancer(freelancerId);
  const numericSessionId = normalizeInteger(sessionId);
  if (!numericSessionId) {
    throw new ValidationError('A valid sessionId is required.');
  }
  if (!freelancer.email) {
    throw new ValidationError('Freelancer profile requires an email to register for sessions.');
  }

  const participantName = payload.participantName?.trim() || formatName(freelancer) || freelancer.email;
  const metadata = { ...(payload.metadata ?? {}) };
  if (payload.note) {
    metadata.bookingNote = payload.note;
  }

  const result = await registerForNetworkingSession(numericSessionId, {
    participantId: freelancer.id,
    participantEmail: payload.participantEmail ?? freelancer.email,
    participantName,
    businessCardId: payload.businessCardId ?? null,
    metadata,
  });

  const signup = await NetworkingSessionSignup.findByPk(result.id);
  if (!signup) {
    throw new NotFoundError('Networking session registration could not be loaded.');
  }

  const updates = {
    bookedAt: new Date(),
  };

  const purchaseAmount = payload.purchaseAmount ?? payload.purchaseCents ?? null;
  if (purchaseAmount != null && purchaseAmount !== '') {
    updates.purchaseCents = toCents(purchaseAmount);
    updates.purchaseCurrency = payload.purchaseCurrency ?? 'USD';
  }
  const paymentStatus = normalizePaymentStatus(payload.paymentStatus);
  if (paymentStatus) {
    updates.paymentStatus = paymentStatus;
  }

  if (payload.metadata) {
    updates.metadata = { ...(signup.metadata ?? {}), ...payload.metadata };
  }

  if (payload.businessCardId && !signup.businessCardId) {
    const card = await NetworkingBusinessCard.findByPk(payload.businessCardId);
    if (card && card.ownerId === freelancer.id) {
      await signup.update({
        businessCardId: card.id,
        businessCardSnapshot: card.toPublicObject(),
      });
    }
  }

  await signup.update(updates);
  return signup.toPublicObject();
}

export async function updateFreelancerNetworkingSignup(
  freelancerId,
  signupId,
  payload = {},
) {
  const numericSignupId = normalizeInteger(signupId);
  if (!numericSignupId) {
    throw new ValidationError('A valid signupId is required.');
  }

  const signup = await NetworkingSessionSignup.findOne({
    where: { id: numericSignupId, participantId: freelancerId },
    include: [
      {
        model: NetworkingSession,
        as: 'session',
        attributes: ['id', 'companyId'],
      },
    ],
  });

  if (!signup) {
    throw new NotFoundError('Networking session registration not found.');
  }

  const updates = {};

  if (payload.status && NETWORKING_SESSION_SIGNUP_STATUSES.includes(payload.status)) {
    updates.status = payload.status;
  }

  if (payload.purchaseAmount != null || payload.purchaseCents != null) {
    const cents = toCents(payload.purchaseAmount ?? payload.purchaseCents);
    updates.purchaseCents = cents;
    if (payload.purchaseCurrency) {
      updates.purchaseCurrency = payload.purchaseCurrency;
    }
  }
  if (payload.purchaseCurrency && !payload.purchaseAmount && !payload.purchaseCents) {
    updates.purchaseCurrency = payload.purchaseCurrency;
  }

  const paymentStatus = normalizePaymentStatus(payload.paymentStatus);
  if (paymentStatus) {
    updates.paymentStatus = paymentStatus;
  }

  if (payload.bookedAt !== undefined) {
    updates.bookedAt = payload.bookedAt ? normalizeDate(payload.bookedAt) : null;
  }
  if (payload.cancelledAt !== undefined) {
    updates.cancelledAt = payload.cancelledAt ? normalizeDate(payload.cancelledAt) : null;
    if (updates.cancelledAt && !updates.status) {
      updates.status = 'removed';
    }
  }
  if (payload.note !== undefined) {
    updates.metadata = {
      ...(signup.metadata ?? {}),
      bookingNote: payload.note ?? null,
    };
  }

  if (payload.followUpsScheduled != null) {
    updates.followUpsScheduled = Math.max(0, Math.round(Number(payload.followUpsScheduled) || 0));
  }
  if (payload.messagesSent != null) {
    updates.messagesSent = Math.max(0, Math.round(Number(payload.messagesSent) || 0));
  }

  await signup.update(updates);
  return signup.toPublicObject();
}

export async function cancelFreelancerNetworkingSignup(
  freelancerId,
  signupId,
  payload = {},
) {
  const numericSignupId = normalizeInteger(signupId);
  if (!numericSignupId) {
    throw new ValidationError('A valid signupId is required.');
  }

  const signup = await NetworkingSessionSignup.findOne({
    where: { id: numericSignupId, participantId: freelancerId },
  });

  if (!signup) {
    throw new NotFoundError('Networking session registration not found.');
  }

  const metadata = { ...(signup.metadata ?? {}) };
  if (payload.reason) {
    metadata.cancellationReason = payload.reason;
  }

  await signup.update({
    status: 'removed',
    cancelledAt: new Date(),
    metadata,
  });

  return signup.toPublicObject();
}

export async function listFreelancerNetworkingConnections(freelancerId, options = {}) {
  const connections = await listConnections(freelancerId, options);
  return {
    total: connections.length,
    items: connections,
  };
}

export async function createFreelancerNetworkingConnection(
  freelancerId,
  payload = {},
) {
  const sessionId = normalizeInteger(payload.sessionId);
  const sourceSignupId = normalizeInteger(payload.sourceSignupId);
  const targetSignupId = normalizeInteger(payload.targetSignupId);
  const followUpAt = payload.followUpAt ? normalizeDate(payload.followUpAt) : null;
  const firstInteractedAt = payload.firstInteractedAt ? normalizeDate(payload.firstInteractedAt) : new Date();

  let resolvedSourceSignupId = sourceSignupId;
  if (!resolvedSourceSignupId && sessionId) {
    const existingSignup = await NetworkingSessionSignup.findOne({
      where: { sessionId, participantId: freelancerId },
      attributes: ['id'],
    });
    resolvedSourceSignupId = existingSignup?.id ?? null;
  }

  const updates = {
    sessionId,
    sourceSignupId: resolvedSourceSignupId,
    targetSignupId,
    sourceParticipantId: freelancerId,
    targetParticipantId: normalizeInteger(payload.targetParticipantId),
    counterpartName: payload.counterpartName?.trim() || null,
    counterpartEmail: payload.counterpartEmail?.trim() || null,
    connectionType: normalizeConnectionType(payload.connectionType) ?? 'follow',
    status: normalizeConnectionStatus(payload.status) ?? 'new',
    notes: payload.notes ?? null,
    metadata: payload.metadata ?? {},
    followUpAt,
    firstInteractedAt,
  };

  if (targetSignupId) {
    const targetSignup = await NetworkingSessionSignup.findByPk(targetSignupId);
    if (targetSignup) {
      updates.targetParticipantId = targetSignup.participantId ?? updates.targetParticipantId;
      if (!updates.counterpartName && targetSignup.participantName) {
        updates.counterpartName = targetSignup.participantName;
      }
      if (!updates.counterpartEmail && targetSignup.participantEmail) {
        updates.counterpartEmail = targetSignup.participantEmail;
      }
      if (!updates.sessionId) {
        updates.sessionId = targetSignup.sessionId;
      }
    }
  }

  const connection = await NetworkingConnection.create(updates);
  return connection.toPublicObject();
}

export async function updateFreelancerNetworkingConnection(
  freelancerId,
  connectionId,
  payload = {},
) {
  const numericConnectionId = normalizeInteger(connectionId);
  if (!numericConnectionId) {
    throw new ValidationError('A valid connectionId is required.');
  }

  const connection = await NetworkingConnection.findOne({
    where: {
      id: numericConnectionId,
      [Op.or]: [{ sourceParticipantId: freelancerId }, { targetParticipantId: freelancerId }],
    },
  });

  if (!connection) {
    throw new NotFoundError('Networking connection not found.');
  }

  const updates = {};
  const type = normalizeConnectionType(payload.connectionType);
  if (type) {
    updates.connectionType = type;
  }
  const status = normalizeConnectionStatus(payload.status);
  if (status) {
    updates.status = status;
  }
  if (payload.notes !== undefined) {
    updates.notes = payload.notes ?? null;
  }
  if (payload.followUpAt !== undefined) {
    updates.followUpAt = payload.followUpAt ? normalizeDate(payload.followUpAt) : null;
  }
  if (payload.firstInteractedAt !== undefined) {
    updates.firstInteractedAt = payload.firstInteractedAt
      ? normalizeDate(payload.firstInteractedAt)
      : null;
  }
  if (payload.metadata !== undefined) {
    updates.metadata = payload.metadata ?? {};
  }

  await connection.update(updates);
  return connection.toPublicObject();
}

export async function deleteFreelancerNetworkingConnection(freelancerId, connectionId) {
  const numericConnectionId = normalizeInteger(connectionId);
  if (!numericConnectionId) {
    throw new ValidationError('A valid connectionId is required.');
  }

  const connection = await NetworkingConnection.findOne({
    where: { id: numericConnectionId, ownerId: freelancerId },
  });

  if (!connection) {
    throw new NotFoundError('Networking contact not found.');
  }

  const payload = connection.toPublicObject();
  await connection.destroy();
  return payload;
}

export async function listFreelancerNetworkingCampaigns(freelancerId) {
  const campaigns = await AdCampaign.findAll({
    where: { ownerId: freelancerId },
    order: [
      ['createdAt', 'DESC'],
    ],
  });

  return campaigns
    .map((campaign) => sanitizeCampaign(campaign))
    .filter((campaign) => {
      const category = campaign.metadata?.category ?? campaign.metadata?.workspace ?? 'freelancer_networking';
      return category === 'freelancer_networking';
    });
}

function normaliseCampaignPayload(payload = {}) {
  const metrics = payload.metrics ?? {};
  const toNumber = (value) => {
    if (value == null || value === '') {
      return 0;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const spendCentsInput =
    metrics.spendCents != null && metrics.spendCents !== '' ? Number(metrics.spendCents) : null;
  const spendCents = Number.isFinite(spendCentsInput)
    ? Math.max(0, Math.round(spendCentsInput))
    : Math.max(0, Math.round(toNumber(metrics.spend) * 100));

  return {
    name: payload.name?.trim(),
    objective: payload.objective?.trim() || 'awareness',
    status: ensureAdStatus(payload.status),
    budgetCents: normaliseBudgetCents(payload.budget ?? payload.budgetCents ?? null),
    currencyCode: payload.currencyCode ? String(payload.currencyCode).toUpperCase() : 'USD',
    startDate: payload.startDate ? new Date(payload.startDate) : null,
    endDate: payload.endDate ? new Date(payload.endDate) : null,
    metadata: {
      ...(payload.metadata ?? {}),
      category: 'freelancer_networking',
      creative: {
        headline: payload.headline ?? payload.metadata?.creative?.headline ?? null,
        description: payload.description ?? payload.metadata?.creative?.description ?? null,
        mediaUrl: payload.mediaUrl ?? payload.metadata?.creative?.mediaUrl ?? null,
        cta: payload.cta ?? payload.metadata?.creative?.cta ?? null,
        ctaUrl: payload.ctaUrl ?? payload.metadata?.creative?.ctaUrl ?? null,
        thumbnailUrl: payload.thumbnailUrl ?? payload.metadata?.creative?.thumbnailUrl ?? null,
      },
      metrics: {
        spendCents,
        impressions: toNumber(metrics.impressions),
        clicks: toNumber(metrics.clicks),
        conversions: toNumber(metrics.conversions),
      },
      placements: Array.isArray(payload.placements)
        ? payload.placements
        : String(payload.placements ?? '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
      audience: payload.audience ?? payload.metadata?.audience ?? null,
    },
  };
}

function ensureCampaignName(payload) {
  if (!payload.name) {
    throw new ValidationError('Campaign name is required.');
  }
}

export async function listFreelancerNetworkingOrders(freelancerId, options = {}) {
  const orders = await listUserNetworkingPurchases(freelancerId, options);
  const sanitised = orders.map((order) => sanitizeOrder(order));
  return {
    items: sanitised,
    summary: summariseOrders(sanitised),
  };
}

export async function createFreelancerNetworkingOrder(freelancerId, payload = {}) {
  const order = await createUserNetworkingPurchase(freelancerId, payload);
  return sanitizeOrder(order);
}

export async function updateFreelancerNetworkingOrder(freelancerId, orderId, payload = {}) {
  const order = await updateUserNetworkingPurchase(freelancerId, orderId, payload);
  return sanitizeOrder(order);
}

export async function deleteFreelancerNetworkingOrder(freelancerId, orderId) {
  const numericOrderId = normalizeInteger(orderId);
  if (!numericOrderId) {
    throw new ValidationError('A valid orderId is required.');
  }

  const order = await NetworkingSessionOrder.findOne({
    where: { id: numericOrderId, purchaserId: freelancerId },
  });

  if (!order) {
    throw new NotFoundError('Networking order not found.');
  }

  const payload = sanitizeOrder(order);
  await order.destroy();
  return payload;
}

export async function getFreelancerNetworkingSettings(freelancerId) {
  const freelancer = await fetchFreelancer(freelancerId);
  const card = await getOrCreateBusinessCard(freelancer);
  return sanitizeBusinessCard(card);
}

function normaliseAttachments(attachments) {
  if (!attachments) {
    return [];
  }
  if (!Array.isArray(attachments)) {
    return [];
  }
  return attachments
    .map((attachment) => {
      if (!attachment) {
        return null;
      }
      if (typeof attachment === 'string') {
        return { name: attachment, url: attachment };
      }
      const name = attachment.name?.toString().trim() || null;
      const url = attachment.url?.toString().trim() || null;
      if (!url) {
        return null;
      }
      return { name: name || url, url };
    })
    .filter(Boolean);
}

export async function updateFreelancerNetworkingSettings(freelancerId, payload = {}) {
  const freelancer = await fetchFreelancer(freelancerId);
  const card = await getOrCreateBusinessCard(freelancer);

  const updates = {};
  if (payload.title !== undefined) updates.title = payload.title ?? null;
  if (payload.headline !== undefined) updates.headline = payload.headline ?? null;
  if (payload.bio !== undefined) updates.bio = payload.bio ?? null;
  if (payload.contactEmail !== undefined) updates.contactEmail = payload.contactEmail ?? null;
  if (payload.contactPhone !== undefined) updates.contactPhone = payload.contactPhone ?? null;
  if (payload.websiteUrl !== undefined) updates.websiteUrl = payload.websiteUrl ?? null;
  if (payload.linkedinUrl !== undefined) updates.linkedinUrl = payload.linkedinUrl ?? null;
  if (payload.calendlyUrl !== undefined) updates.calendlyUrl = payload.calendlyUrl ?? null;
  if (payload.portfolioUrl !== undefined) updates.portfolioUrl = payload.portfolioUrl ?? null;
  if (payload.spotlightVideoUrl !== undefined) updates.spotlightVideoUrl = payload.spotlightVideoUrl ?? null;
  if (payload.attachments !== undefined) updates.attachments = normaliseAttachments(payload.attachments);

  const metadata = { ...(card.metadata ?? {}) };
  if (payload.coverImageUrl !== undefined) {
    metadata.coverImageUrl = payload.coverImageUrl ?? null;
  }
  if (payload.videoTranscript !== undefined) {
    metadata.videoTranscript = payload.videoTranscript ?? null;
  }
  updates.metadata = metadata;

  await card.update(updates);
  await card.reload();
  return sanitizeBusinessCard(card);
}

export async function updateFreelancerNetworkingPreferences(freelancerId, preferences = {}) {
  const freelancer = await fetchFreelancer(freelancerId);
  const card = await getOrCreateBusinessCard(freelancer);
  const current = card.preferences && typeof card.preferences === 'object' ? card.preferences : {};

  const allowedKeys = [
    'shareAvailability',
    'autoShareCard',
    'calendarSync',
    'digestFrequency',
    'allowMentorIntroductions',
    'followUpReminders',
    'autoAcceptInvites',
    'notifyOnOrders',
  ];

  const next = { ...current };
  allowedKeys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(preferences, key)) {
      next[key] = preferences[key];
    }
  });

  await card.update({ preferences: next });
  await card.reload();
  return sanitizeBusinessCard(card);
}

export async function createFreelancerNetworkingCampaign(freelancerId, payload = {}) {
  const freelancer = await fetchFreelancer(freelancerId);
  const normalised = normaliseCampaignPayload(payload);
  ensureCampaignName(normalised);

  const campaign = await AdCampaign.create({
    name: normalised.name,
    objective: normalised.objective,
    status: normalised.status,
    budgetCents: normalised.budgetCents,
    currencyCode: normalised.currencyCode,
    startDate: normalised.startDate,
    endDate: normalised.endDate,
    ownerId: freelancer.id,
    metadata: normalised.metadata,
  });

  return sanitizeCampaign(campaign);
}

export async function updateFreelancerNetworkingCampaign(freelancerId, campaignId, payload = {}) {
  const campaign = await AdCampaign.findByPk(campaignId);
  if (!campaign || campaign.ownerId !== Number(freelancerId)) {
    throw new NotFoundError('Campaign not found.');
  }

  const normalised = normaliseCampaignPayload(payload);
  if (normalised.name) {
    campaign.name = normalised.name;
  }
  if (normalised.objective) {
    campaign.objective = normalised.objective;
  }
  campaign.status = normalised.status;
  campaign.budgetCents = normalised.budgetCents;
  campaign.currencyCode = normalised.currencyCode;
  campaign.startDate = normalised.startDate;
  campaign.endDate = normalised.endDate;
  campaign.metadata = { ...(campaign.metadata ?? {}), ...normalised.metadata };

  await campaign.save();
  await campaign.reload();
  return sanitizeCampaign(campaign);
}

export async function deleteFreelancerNetworkingCampaign(freelancerId, campaignId) {
  const campaign = await AdCampaign.findByPk(campaignId);
  if (!campaign || campaign.ownerId !== Number(freelancerId)) {
    throw new NotFoundError('Campaign not found.');
  }
  await campaign.destroy();
  return { success: true };
}

export async function getFreelancerNetworkingAds(freelancerId) {
  const campaigns = await listFreelancerNetworkingCampaigns(freelancerId);
  return { campaigns, insights: buildAdInsights(campaigns) };
}

export default {
  getFreelancerNetworkingDashboard,
  bookNetworkingSessionForFreelancer,
  updateFreelancerNetworkingSignup,
  cancelFreelancerNetworkingSignup,
  listFreelancerNetworkingConnections,
  createFreelancerNetworkingConnection,
  updateFreelancerNetworkingConnection,
  deleteFreelancerNetworkingConnection,
  listFreelancerNetworkingOrders,
  createFreelancerNetworkingOrder,
  updateFreelancerNetworkingOrder,
  deleteFreelancerNetworkingOrder,
  getFreelancerNetworkingSettings,
  updateFreelancerNetworkingSettings,
  updateFreelancerNetworkingPreferences,
  createFreelancerNetworkingCampaign,
  updateFreelancerNetworkingCampaign,
  deleteFreelancerNetworkingCampaign,
  getFreelancerNetworkingAds,
};
