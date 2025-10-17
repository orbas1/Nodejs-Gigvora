import {
  NetworkingSession,
  NetworkingSessionSignup,
  NetworkingSessionOrder,
  NetworkingConnection,
  User,
} from '../models/index.js';
import {
  NETWORKING_SESSION_SIGNUP_STATUSES,
  NETWORKING_SESSION_ORDER_STATUSES,
  NETWORKING_CONNECTION_FOLLOW_STATUSES,
} from '../models/constants/index.js';
import { ValidationError, ConflictError, AuthorizationError } from '../utils/errors.js';

function normalizePositiveInteger(value, label) {
  if (value == null) {
    throw new ValidationError(`${label} is required.`);
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return numeric;
}

function normalizeOptionalInteger(value, label) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError(`${label} must be a number.`);
  }
  return numeric;
}

function normalizeOptionalDate(value, label) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${label} must be a valid date.`);
  }
  return date;
}

function normalizeAmountCents({ amount, amountCents }) {
  if (amountCents != null && amountCents !== '') {
    const numeric = Number.parseInt(amountCents, 10);
    if (!Number.isFinite(numeric)) {
      throw new ValidationError('amountCents must be a number.');
    }
    return numeric;
  }
  if (amount == null || amount === '') {
    throw new ValidationError('amount is required.');
  }
  const numeric = Number.parseFloat(amount);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('amount must be a number.');
  }
  return Math.round(numeric * 100);
}

function normalizeCurrency(value) {
  if (!value) {
    return 'USD';
  }
  return String(value).trim().toUpperCase();
}

function normalizeStatus(value, allowed, label) {
  const status = value ? String(value).toLowerCase() : null;
  if (!status) {
    return allowed[0];
  }
  if (!allowed.includes(status)) {
    throw new ValidationError(`${label} must be one of: ${allowed.join(', ')}.`);
  }
  return status;
}

function normalizeTags(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  if (typeof value === 'object') {
    return Object.values(value)
      .map((entry) => String(entry).trim())
      .filter(Boolean);
  }
  return [];
}

function sanitizeSession(sessionInstance) {
  if (!sessionInstance) {
    return null;
  }
  const session = sessionInstance.toPublicObject?.() ?? sessionInstance.get?.({ plain: true }) ?? sessionInstance;
  return {
    id: session.id,
    title: session.title,
    slug: session.slug,
    startTime: session.startTime ?? null,
    endTime: session.endTime ?? null,
    status: session.status,
    accessType: session.accessType,
    priceCents: session.priceCents == null ? null : Number(session.priceCents),
    currency: session.currency ?? 'USD',
  };
}

function sanitizeUser(userInstance) {
  if (!userInstance) {
    return null;
  }
  const plain = userInstance.get?.({ plain: true }) ?? userInstance;
  return {
    id: plain.id,
    firstName: plain.firstName ?? null,
    lastName: plain.lastName ?? null,
    email: plain.email ?? null,
  };
}

function sanitizeBooking(signupInstance) {
  if (!signupInstance) {
    return null;
  }
  const base = signupInstance.toPublicObject?.() ?? signupInstance.get?.({ plain: true }) ?? signupInstance;
  const session = sanitizeSession(signupInstance.get?.('session') ?? signupInstance.session);
  const metadata = base.metadata ?? {};
  return {
    id: base.id,
    sessionId: base.sessionId,
    participantId: base.participantId,
    participantName: base.participantName,
    participantEmail: base.participantEmail,
    status: base.status,
    seatNumber: base.seatNumber ?? null,
    joinUrl: base.joinUrl ?? null,
    checkedInAt: base.checkedInAt ?? null,
    completedAt: base.completedAt ?? null,
    connectionsSaved: base.connectionsSaved ?? 0,
    followUpsScheduled: base.followUpsScheduled ?? 0,
    satisfactionScore: base.satisfactionScore == null ? null : Number(base.satisfactionScore),
    userNotes: metadata.userNotes ?? null,
    metadata,
    session,
    createdAt: base.createdAt,
    updatedAt: base.updatedAt,
  };
}

function sanitizeOrder(orderInstance) {
  if (!orderInstance) {
    return null;
  }
  const base = orderInstance.toPublicObject?.() ?? orderInstance.get?.({ plain: true }) ?? orderInstance;
  const session = sanitizeSession(orderInstance.get?.('session') ?? orderInstance.session);
  const metadata = base.metadata ?? {};
  const amountCents = base.amountCents == null ? 0 : Number(base.amountCents);
  return {
    id: base.id,
    sessionId: base.sessionId,
    purchaserId: base.purchaserId,
    purchaserEmail: base.purchaserEmail,
    purchaserName: base.purchaserName,
    status: base.status,
    amountCents,
    amount: amountCents / 100,
    currency: base.currency ?? 'USD',
    purchasedAt: base.purchasedAt,
    reference: base.reference ?? null,
    notes: metadata.userNotes ?? null,
    metadata,
    session,
    createdAt: base.createdAt,
    updatedAt: base.updatedAt,
  };
}

function sanitizeConnection(connectionInstance) {
  if (!connectionInstance) {
    return null;
  }
  const base = connectionInstance.toPublicObject?.() ?? connectionInstance.get?.({ plain: true }) ?? connectionInstance;
  const session = sanitizeSession(connectionInstance.get?.('session') ?? connectionInstance.session);
  const contact = sanitizeUser(connectionInstance.get?.('contact') ?? connectionInstance.contact);
  return {
    id: base.id,
    ownerId: base.ownerId,
    connectionUserId: base.connectionUserId,
    sessionId: base.sessionId,
    connectionName: base.connectionName,
    connectionEmail: base.connectionEmail,
    connectionHeadline: base.connectionHeadline,
    connectionCompany: base.connectionCompany,
    followStatus: base.followStatus,
    connectedAt: base.connectedAt,
    lastContactedAt: base.lastContactedAt ?? null,
    notes: base.notes ?? null,
    tags: Array.isArray(base.tags)
      ? base.tags
      : base.tags && typeof base.tags === 'object'
        ? Object.values(base.tags)
        : base.tags
          ? [base.tags]
          : [],
    metadata: base.metadata ?? {},
    session,
    contact,
    createdAt: base.createdAt,
    updatedAt: base.updatedAt,
  };
}

function formatCurrency(amount, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch (error) {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
}

function buildSummary({ bookings, orders, connections }) {
  const now = new Date();
  const upcoming = bookings.filter((booking) => {
    const sessionStart = booking.session?.startTime ? new Date(booking.session.startTime) : null;
    if (!sessionStart || Number.isNaN(sessionStart.getTime())) {
      return false;
    }
    return sessionStart.getTime() > now.getTime();
  });
  const completed = bookings.filter((booking) => {
    if (booking.completedAt) {
      return true;
    }
    const sessionEnd = booking.session?.endTime ? new Date(booking.session.endTime) : null;
    if (!sessionEnd || Number.isNaN(sessionEnd.getTime())) {
      return false;
    }
    return sessionEnd.getTime() < now.getTime();
  });
  const checkIns = bookings.filter((booking) => Boolean(booking.checkedInAt)).length;
  const satisfactionScores = bookings
    .map((booking) => (booking.satisfactionScore == null ? null : Number(booking.satisfactionScore)))
    .filter((score) => Number.isFinite(score));
  const averageSatisfaction = satisfactionScores.length
    ? satisfactionScores.reduce((total, score) => total + score, 0) / satisfactionScores.length
    : null;

  const paidOrders = orders.filter((order) => order.status === 'paid');
  const refundedOrders = orders.filter((order) => order.status === 'refunded');
  const pendingOrders = orders.filter((order) => order.status === 'pending');

  const totalSpendCents = paidOrders.reduce((total, order) => total + order.amountCents, 0);
  const refundedCents = refundedOrders.reduce((total, order) => total + order.amountCents, 0);
  const pendingSpendCents = pendingOrders.reduce((total, order) => total + order.amountCents, 0);
  const representativeCurrency = orders.find((order) => order.currency)?.currency ?? 'USD';

  const followStatusCounts = connections.reduce((accumulator, connection) => {
    const key = connection.followStatus ?? 'unknown';
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});

  return {
    summary: {
      sessionsBooked: bookings.length,
      upcomingSessions: upcoming.length,
      completedSessions: completed.length,
      checkInRate: bookings.length ? Number(((checkIns / bookings.length) * 100).toFixed(1)) : 0,
      purchasesMade: orders.length,
      totalSpendCents,
      totalSpendFormatted: formatCurrency(totalSpendCents / 100, representativeCurrency),
      pendingSpendCents,
      pendingSpendFormatted: formatCurrency(pendingSpendCents / 100, representativeCurrency),
      refundedCents,
      refundedAmountFormatted: formatCurrency(refundedCents / 100, representativeCurrency),
      averageSatisfaction,
      connectionsTracked: connections.length,
      followStatusCounts,
      lastUpdatedAt: new Date().toISOString(),
    },
    bookings: {
      list: bookings,
      upcomingCount: upcoming.length,
      completedCount: completed.length,
      checkedInCount: checkIns,
    },
    purchases: {
      list: orders,
      totalSpendCents,
      totalSpendFormatted: formatCurrency(totalSpendCents / 100, representativeCurrency),
      pendingSpendCents,
      pendingSpendFormatted: formatCurrency(pendingSpendCents / 100, representativeCurrency),
      refundedCents,
      refundedAmountFormatted: formatCurrency(refundedCents / 100, representativeCurrency),
      currency: representativeCurrency,
    },
    connections: {
      list: connections,
      total: connections.length,
      followStatusCounts,
    },
  };
}

async function fetchBookingRecords(userId, { limit = 50 } = {}) {
  return NetworkingSessionSignup.findAll({
    where: { participantId: userId },
    include: [{ model: NetworkingSession, as: 'session' }],
    order: [
      ['createdAt', 'DESC'],
      ['id', 'DESC'],
    ],
    limit: Math.min(Math.max(Number(limit) || 50, 1), 200),
  });
}

async function fetchOrderRecords(userId, { limit = 50 } = {}) {
  return NetworkingSessionOrder.findAll({
    where: { purchaserId: userId },
    include: [{ model: NetworkingSession, as: 'session' }],
    order: [
      ['purchasedAt', 'DESC'],
      ['id', 'DESC'],
    ],
    limit: Math.min(Math.max(Number(limit) || 50, 1), 200),
  });
}

async function fetchConnectionRecords(userId, { limit = 100 } = {}) {
  return NetworkingConnection.findAll({
    where: { ownerId: userId },
    include: [
      { model: NetworkingSession, as: 'session' },
      { model: User, as: 'contact', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
    order: [
      ['connectedAt', 'DESC'],
      ['id', 'DESC'],
    ],
    limit: Math.min(Math.max(Number(limit) || 100, 1), 200),
  });
}

export async function getOverview(userId) {
  const normalizedUserId = normalizePositiveInteger(userId, 'userId');
  const [bookingRecords, orderRecords, connectionRecords] = await Promise.all([
    fetchBookingRecords(normalizedUserId),
    fetchOrderRecords(normalizedUserId),
    fetchConnectionRecords(normalizedUserId),
  ]);

  const bookings = bookingRecords.map((record) => sanitizeBooking(record)).filter(Boolean);
  const orders = orderRecords.map((record) => sanitizeOrder(record)).filter(Boolean);
  const connections = connectionRecords.map((record) => sanitizeConnection(record)).filter(Boolean);

  return buildSummary({ bookings, orders, connections });
}

export async function listBookings(userId, options = {}) {
  const normalizedUserId = normalizePositiveInteger(userId, 'userId');
  const records = await fetchBookingRecords(normalizedUserId, options);
  return records.map((record) => sanitizeBooking(record)).filter(Boolean);
}

export async function createBooking(userId, payload = {}) {
  const normalizedUserId = normalizePositiveInteger(userId, 'userId');
  const sessionId = normalizePositiveInteger(payload.sessionId, 'sessionId');
  const status = normalizeStatus(payload.status, NETWORKING_SESSION_SIGNUP_STATUSES, 'status');
  const seatNumber = normalizeOptionalInteger(payload.seatNumber, 'seatNumber');
  const checkedInAt = normalizeOptionalDate(payload.checkedInAt, 'checkedInAt');
  const completedAt = normalizeOptionalDate(payload.completedAt, 'completedAt');

  const [session, participant, existing] = await Promise.all([
    NetworkingSession.findByPk(sessionId),
    User.findByPk(normalizedUserId, { attributes: ['id', 'firstName', 'lastName', 'email'] }),
    NetworkingSessionSignup.findOne({
      where: {
        sessionId,
        participantId: normalizedUserId,
      },
    }),
  ]);

  if (!session) {
    throw new ValidationError('Networking session not found.');
  }
  if (!participant) {
    throw new ValidationError('Participant profile not found.');
  }
  if (existing) {
    throw new ConflictError('You are already registered for this networking session.');
  }

  const participantEmail = payload.participantEmail ?? participant.email;
  if (!participantEmail) {
    throw new ValidationError('participantEmail is required to create a booking.');
  }

  const metadata = {
    ...(payload.metadata ?? {}),
  };
  if (payload.userNotes != null) {
    metadata.userNotes = payload.userNotes || null;
  }

  const signup = await NetworkingSessionSignup.create({
    sessionId,
    participantId: normalizedUserId,
    participantEmail,
    participantName:
      payload.participantName ??
      [participant.firstName, participant.lastName].filter(Boolean).join(' ') ||
        participant.email ||
        'Networking participant',
    status,
    seatNumber,
    joinUrl: payload.joinUrl ?? null,
    checkedInAt,
    completedAt,
    metadata,
  });

  const created = await NetworkingSessionSignup.findByPk(signup.id, {
    include: [{ model: NetworkingSession, as: 'session' }],
  });
  return sanitizeBooking(created);
}

export async function updateBooking(userId, bookingId, payload = {}) {
  const normalizedUserId = normalizePositiveInteger(userId, 'userId');
  const normalizedBookingId = normalizePositiveInteger(bookingId, 'bookingId');
  const signup = await NetworkingSessionSignup.findByPk(normalizedBookingId, {
    include: [{ model: NetworkingSession, as: 'session' }],
  });
  if (!signup) {
    throw new ValidationError('Booking not found.');
  }
  if (signup.participantId !== normalizedUserId) {
    throw new AuthorizationError('You do not have permission to update this booking.');
  }

  const updates = {};
  if (payload.status != null) {
    updates.status = normalizeStatus(payload.status, NETWORKING_SESSION_SIGNUP_STATUSES, 'status');
  }
  if (payload.seatNumber !== undefined) {
    updates.seatNumber = normalizeOptionalInteger(payload.seatNumber, 'seatNumber');
  }
  if (payload.joinUrl !== undefined) {
    updates.joinUrl = payload.joinUrl || null;
  }
  if (payload.checkedInAt !== undefined) {
    updates.checkedInAt = normalizeOptionalDate(payload.checkedInAt, 'checkedInAt');
  }
  if (payload.completedAt !== undefined) {
    updates.completedAt = normalizeOptionalDate(payload.completedAt, 'completedAt');
  }

  const metadata = { ...(signup.metadata ?? {}) };
  if (payload.userNotes !== undefined) {
    metadata.userNotes = payload.userNotes || null;
  }
  if (payload.metadata && typeof payload.metadata === 'object') {
    Object.assign(metadata, payload.metadata);
  }
  updates.metadata = metadata;

  await signup.update(updates);
  await signup.reload({ include: [{ model: NetworkingSession, as: 'session' }] });
  return sanitizeBooking(signup);
}

export async function listPurchases(userId, options = {}) {
  const normalizedUserId = normalizePositiveInteger(userId, 'userId');
  const records = await fetchOrderRecords(normalizedUserId, options);
  return records.map((record) => sanitizeOrder(record)).filter(Boolean);
}

export async function createPurchase(userId, payload = {}) {
  const normalizedUserId = normalizePositiveInteger(userId, 'userId');
  const sessionId = normalizePositiveInteger(payload.sessionId, 'sessionId');
  const status = normalizeStatus(payload.status, NETWORKING_SESSION_ORDER_STATUSES, 'status');
  const amountCents = normalizeAmountCents(payload);
  const currency = normalizeCurrency(payload.currency);
  const purchasedAt = normalizeOptionalDate(payload.purchasedAt, 'purchasedAt') ?? new Date();

  const [session, purchaser] = await Promise.all([
    NetworkingSession.findByPk(sessionId),
    User.findByPk(normalizedUserId, { attributes: ['id', 'firstName', 'lastName', 'email'] }),
  ]);

  if (!session) {
    throw new ValidationError('Networking session not found.');
  }
  if (!purchaser) {
    throw new ValidationError('Purchaser profile not found.');
  }

  const metadata = { ...(payload.metadata ?? {}) };
  if (payload.notes != null) {
    metadata.userNotes = payload.notes || null;
  }

  const order = await NetworkingSessionOrder.create({
    sessionId,
    purchaserId: normalizedUserId,
    purchaserEmail: payload.purchaserEmail ?? purchaser.email ?? null,
    purchaserName:
      payload.purchaserName ??
      [purchaser.firstName, purchaser.lastName].filter(Boolean).join(' ') ||
        purchaser.email ||
        'Networking customer',
    status,
    amountCents,
    currency,
    purchasedAt,
    reference: payload.reference ?? null,
    metadata,
  });

  const created = await NetworkingSessionOrder.findByPk(order.id, {
    include: [{ model: NetworkingSession, as: 'session' }],
  });
  return sanitizeOrder(created);
}

export async function updatePurchase(userId, orderId, payload = {}) {
  const normalizedUserId = normalizePositiveInteger(userId, 'userId');
  const normalizedOrderId = normalizePositiveInteger(orderId, 'orderId');
  const order = await NetworkingSessionOrder.findByPk(normalizedOrderId, {
    include: [{ model: NetworkingSession, as: 'session' }],
  });
  if (!order) {
    throw new ValidationError('Purchase not found.');
  }
  if (order.purchaserId !== normalizedUserId) {
    throw new AuthorizationError('You do not have permission to update this purchase.');
  }

  const updates = {};
  if (payload.status != null) {
    updates.status = normalizeStatus(payload.status, NETWORKING_SESSION_ORDER_STATUSES, 'status');
  }
  if (payload.amount != null || payload.amountCents != null) {
    updates.amountCents = normalizeAmountCents(payload);
  }
  if (payload.currency != null) {
    updates.currency = normalizeCurrency(payload.currency);
  }
  if (payload.purchasedAt !== undefined) {
    updates.purchasedAt = normalizeOptionalDate(payload.purchasedAt, 'purchasedAt') ?? new Date();
  }
  if (payload.reference !== undefined) {
    updates.reference = payload.reference || null;
  }
  if (payload.purchaserEmail !== undefined) {
    updates.purchaserEmail = payload.purchaserEmail || null;
  }
  if (payload.purchaserName !== undefined) {
    updates.purchaserName = payload.purchaserName || null;
  }

  const metadata = { ...(order.metadata ?? {}) };
  if (payload.notes !== undefined) {
    metadata.userNotes = payload.notes || null;
  }
  if (payload.metadata && typeof payload.metadata === 'object') {
    Object.assign(metadata, payload.metadata);
  }
  updates.metadata = metadata;

  await order.update(updates);
  await order.reload({ include: [{ model: NetworkingSession, as: 'session' }] });
  return sanitizeOrder(order);
}

export async function listConnections(userId, options = {}) {
  const normalizedUserId = normalizePositiveInteger(userId, 'userId');
  const records = await fetchConnectionRecords(normalizedUserId, options);
  return records.map((record) => sanitizeConnection(record)).filter(Boolean);
}

export async function createConnection(userId, payload = {}) {
  const normalizedUserId = normalizePositiveInteger(userId, 'userId');
  const connectionName = payload.connectionName ? String(payload.connectionName).trim() : '';
  if (!connectionName) {
    throw new ValidationError('connectionName is required.');
  }

  const sessionId = payload.sessionId != null ? normalizeOptionalInteger(payload.sessionId, 'sessionId') : null;
  const connectionUserId = payload.connectionUserId != null
    ? normalizeOptionalInteger(payload.connectionUserId, 'connectionUserId')
    : null;
  const followStatus = normalizeStatus(payload.followStatus, NETWORKING_CONNECTION_FOLLOW_STATUSES, 'followStatus');
  const connectedAt = normalizeOptionalDate(payload.connectedAt, 'connectedAt') ?? new Date();
  const lastContactedAt = normalizeOptionalDate(payload.lastContactedAt, 'lastContactedAt');
  const tags = normalizeTags(payload.tags);

  const connection = await NetworkingConnection.create({
    ownerId: normalizedUserId,
    connectionUserId,
    sessionId,
    connectionName,
    connectionEmail: payload.connectionEmail ?? null,
    connectionHeadline: payload.connectionHeadline ?? null,
    connectionCompany: payload.connectionCompany ?? null,
    followStatus,
    connectedAt,
    lastContactedAt,
    notes: payload.notes ?? null,
    tags,
    metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {},
  });

  const created = await NetworkingConnection.findByPk(connection.id, {
    include: [
      { model: NetworkingSession, as: 'session' },
      { model: User, as: 'contact', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
  });
  return sanitizeConnection(created);
}

export async function updateConnection(userId, connectionId, payload = {}) {
  const normalizedUserId = normalizePositiveInteger(userId, 'userId');
  const normalizedConnectionId = normalizePositiveInteger(connectionId, 'connectionId');
  const connection = await NetworkingConnection.findByPk(normalizedConnectionId, {
    include: [
      { model: NetworkingSession, as: 'session' },
      { model: User, as: 'contact', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
  });
  if (!connection) {
    throw new ValidationError('Connection not found.');
  }
  if (connection.ownerId !== normalizedUserId) {
    throw new AuthorizationError('You do not have permission to update this connection.');
  }

  const updates = {};
  if (payload.followStatus != null) {
    updates.followStatus = normalizeStatus(payload.followStatus, NETWORKING_CONNECTION_FOLLOW_STATUSES, 'followStatus');
  }
  if (payload.connectionName !== undefined) {
    const trimmed = String(payload.connectionName ?? '').trim();
    if (!trimmed) {
      throw new ValidationError('connectionName cannot be empty.');
    }
    updates.connectionName = trimmed;
  }
  if (payload.connectionEmail !== undefined) {
    updates.connectionEmail = payload.connectionEmail || null;
  }
  if (payload.connectionHeadline !== undefined) {
    updates.connectionHeadline = payload.connectionHeadline || null;
  }
  if (payload.connectionCompany !== undefined) {
    updates.connectionCompany = payload.connectionCompany || null;
  }
  if (payload.sessionId !== undefined) {
    updates.sessionId = payload.sessionId == null ? null : normalizeOptionalInteger(payload.sessionId, 'sessionId');
  }
  if (payload.connectionUserId !== undefined) {
    updates.connectionUserId =
      payload.connectionUserId == null ? null : normalizeOptionalInteger(payload.connectionUserId, 'connectionUserId');
  }
  if (payload.connectedAt !== undefined) {
    updates.connectedAt = normalizeOptionalDate(payload.connectedAt, 'connectedAt') ?? new Date();
  }
  if (payload.lastContactedAt !== undefined) {
    updates.lastContactedAt = normalizeOptionalDate(payload.lastContactedAt, 'lastContactedAt');
  }
  if (payload.notes !== undefined) {
    updates.notes = payload.notes || null;
  }
  if (payload.tags !== undefined) {
    updates.tags = normalizeTags(payload.tags);
  }
  if (payload.metadata && typeof payload.metadata === 'object') {
    updates.metadata = { ...(connection.metadata ?? {}), ...payload.metadata };
  }

  await connection.update(updates);
  await connection.reload({
    include: [
      { model: NetworkingSession, as: 'session' },
      { model: User, as: 'contact', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
  });
  return sanitizeConnection(connection);
}

export default {
  getOverview,
  listBookings,
  createBooking,
  updateBooking,
  listPurchases,
  createPurchase,
  updatePurchase,
  listConnections,
  createConnection,
  updateConnection,
};
