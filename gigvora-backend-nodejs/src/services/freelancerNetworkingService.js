import { Op } from 'sequelize';
import {
  sequelize,
  User,
  NetworkingSession,
  NetworkingSessionSignup,
  NetworkingConnection,
  NetworkingBusinessCard,
  ProviderWorkspaceMember,
  NETWORKING_SESSION_SIGNUP_STATUSES,
  NETWORKING_SIGNUP_PAYMENT_STATUSES,
  NETWORKING_CONNECTION_STATUSES,
  NETWORKING_CONNECTION_TYPES,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
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

function formatName(user) {
  if (!user) {
    return null;
  }
  const parts = [user.firstName, user.lastName].filter(Boolean);
  const name = parts.join(' ').trim();
  return name || user.email || null;
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

  const [availableSessions, connections] = await Promise.all([
    listAvailableSessions(freelancerId, { limit: 25 }),
    listConnections(freelancerId, { limit: limitConnections }),
  ]);

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
    config: {
      paymentStatuses: NETWORKING_SIGNUP_PAYMENT_STATUSES,
      signupStatuses: NETWORKING_SESSION_SIGNUP_STATUSES,
      connectionStatuses: NETWORKING_CONNECTION_STATUSES,
      connectionTypes: NETWORKING_CONNECTION_TYPES,
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

export default {
  getFreelancerNetworkingDashboard,
  bookNetworkingSessionForFreelancer,
  updateFreelancerNetworkingSignup,
  listFreelancerNetworkingConnections,
  createFreelancerNetworkingConnection,
  updateFreelancerNetworkingConnection,
};
