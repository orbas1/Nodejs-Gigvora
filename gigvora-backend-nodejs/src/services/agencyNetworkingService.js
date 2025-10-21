import { Op } from 'sequelize';
import {
  ProviderWorkspace,
  ProviderWorkspaceMember,
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
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from '../utils/errors.js';

function parseInteger(value, { label = 'value', required = false, positive = true } = {}) {
  if (value == null || value === '') {
    if (required) {
      throw new ValidationError(`${label} is required.`);
    }
    return null;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || (positive && numeric <= 0)) {
    throw new ValidationError(`${label} must be a valid ${positive ? 'positive ' : ''}integer.`);
  }
  return numeric;
}

function parseFloatValue(value, { label = 'value', required = false } = {}) {
  if (value == null || value === '') {
    if (required) {
      throw new ValidationError(`${label} is required.`);
    }
    return null;
  }
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError(`${label} must be a number.`);
  }
  return numeric;
}

function parseDate(value, { label = 'date' } = {}) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${label} must be a valid date.`);
  }
  return date;
}

function parseCurrency(value) {
  if (!value) {
    return 'USD';
  }
  return String(value).trim().toUpperCase();
}

function normalizeStatus(value, allowed, label) {
  if (!value) {
    return allowed[0];
  }
  const status = String(value).toLowerCase();
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
  const session =
    sessionInstance.toPublicObject?.() ?? sessionInstance.get?.({ plain: true }) ?? sessionInstance;
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
  const name = [plain.firstName, plain.lastName].filter(Boolean).join(' ').trim();
  return {
    id: plain.id,
    name: name || plain.email || null,
    email: plain.email ?? null,
  };
}

function sanitizeBooking(signupInstance) {
  if (!signupInstance) {
    return null;
  }
  const base =
    signupInstance.toPublicObject?.() ?? signupInstance.get?.({ plain: true }) ?? signupInstance;
  const session = sanitizeSession(signupInstance.get?.('session') ?? signupInstance.session);
  const metadata = base.metadata ?? {};
  return {
    id: base.id,
    sessionId: base.sessionId,
    participantId: base.participantId,
    participantEmail: base.participantEmail,
    participantName: base.participantName,
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
  const base =
    connectionInstance.toPublicObject?.() ?? connectionInstance.get?.({ plain: true }) ?? connectionInstance;
  const session = sanitizeSession(connectionInstance.get?.('session') ?? connectionInstance.session);
  const contact = sanitizeUser(connectionInstance.get?.('contact') ?? connectionInstance.contact);
  const owner = sanitizeUser(connectionInstance.get?.('owner') ?? connectionInstance.owner);
  const tags = Array.isArray(base.tags)
    ? base.tags
    : base.tags && typeof base.tags === 'object'
      ? Object.values(base.tags)
      : base.tags
        ? [base.tags]
        : [];
  return {
    id: base.id,
    ownerId: base.ownerId,
    connectionUserId: base.connectionUserId ?? null,
    sessionId: base.sessionId ?? null,
    connectionName: base.connectionName ?? base.counterpartName ?? contact?.name ?? null,
    connectionEmail: base.connectionEmail ?? contact?.email ?? null,
    connectionHeadline: base.connectionHeadline ?? null,
    connectionCompany: base.connectionCompany ?? null,
    followStatus: base.followStatus ?? base.status ?? 'saved',
    connectedAt: base.connectedAt ?? base.firstInteractedAt ?? null,
    lastContactedAt: base.lastContactedAt ?? base.followUpAt ?? null,
    notes: base.notes ?? null,
    tags,
    metadata: base.metadata ?? {},
    session,
    owner,
    contact,
    createdAt: base.createdAt,
    updatedAt: base.updatedAt,
  };
}

function buildSummary({ bookings = [], orders = [], connections = [] }) {
  const totalSpendCents = orders.reduce((acc, order) => acc + (order.amountCents ?? 0), 0);
  const pendingSpendCents = orders
    .filter((order) => order.status === 'pending')
    .reduce((acc, order) => acc + (order.amountCents ?? 0), 0);
  const refundedCents = orders
    .filter((order) => order.status === 'refunded')
    .reduce((acc, order) => acc + (order.amountCents ?? 0), 0);
  const satisfactionScores = bookings
    .map((booking) => (booking.satisfactionScore == null ? null : Number(booking.satisfactionScore)))
    .filter((score) => score != null && Number.isFinite(score));
  const averageSatisfaction =
    satisfactionScores.length > 0
      ? satisfactionScores.reduce((acc, score) => acc + score, 0) / satisfactionScores.length
      : null;
  const upcomingSessions = bookings.filter((booking) => {
    const start = booking.session?.startTime ? new Date(booking.session.startTime) : null;
    return start && start.getTime() > Date.now();
  }).length;
  const completedSessions = bookings.filter((booking) => booking.status === 'completed' || booking.completedAt).length;
  const checkedInCount = bookings.filter((booking) => Boolean(booking.checkedInAt)).length;
  const followStatusCounts = connections.reduce((acc, connection) => {
    const status = connection.followStatus ?? 'saved';
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    sessionsBooked: bookings.length,
    upcomingSessions,
    completedSessions,
    totalSpendCents,
    pendingSpendCents,
    refundedCents,
    averageSatisfaction,
    checkedInCount,
    connectionsTracked: connections.length,
    followStatusCounts,
    currency: bookings[0]?.session?.currency ?? orders[0]?.currency ?? 'USD',
  };
}

async function ensureWorkspaceAccess(workspace, actorId, actorRoles = []) {
  if (!workspace) {
    return null;
  }
  const normalizedRoles = new Set((actorRoles ?? []).map((role) => `${role}`.toLowerCase()));
  const isAdmin = normalizedRoles.has('admin');

  if (isAdmin || workspace.ownerId === actorId) {
    return workspace;
  }

  const membershipCount = await ProviderWorkspaceMember.count({
    where: { workspaceId: workspace.id, userId: actorId },
  });

  if (membershipCount === 0) {
    throw new AuthorizationError('You do not have permission to access this agency workspace.');
  }

  return workspace;
}

async function resolveAgencyWorkspace({ workspaceId, workspaceSlug } = {}, { actorId, actorRole = null, actorRoles = [] } = {}) {
  if (!actorId) {
    throw new AuthenticationError('Authentication required.');
  }

  const normalizedRoles = new Set([actorRole, ...(actorRoles ?? [])].filter(Boolean).map((role) => `${role}`.toLowerCase()));
  const isAdmin = normalizedRoles.has('admin');

  const parsedId = parseInteger(workspaceId, { label: 'workspaceId' });
  const sanitizedSlug = workspaceSlug ? String(workspaceSlug).trim() : null;

  if (parsedId || sanitizedSlug) {
    const where = { type: 'agency' };
    if (parsedId) where.id = parsedId;
    if (sanitizedSlug) where.slug = sanitizedSlug;

    const workspace = await ProviderWorkspace.findOne({ where });
    if (!workspace) {
      throw new NotFoundError('Agency workspace not found.');
    }
    await ensureWorkspaceAccess(workspace, actorId, Array.from(normalizedRoles));
    return workspace;
  }

  if (isAdmin) {
    const workspace = await ProviderWorkspace.findOne({ where: { type: 'agency' }, order: [['createdAt', 'ASC']] });
    if (!workspace) {
      throw new NotFoundError('No agency workspaces are registered yet.');
    }
    return workspace;
  }

  const ownedWorkspace = await ProviderWorkspace.findOne({
    where: { type: 'agency', ownerId: actorId },
    order: [['createdAt', 'ASC']],
  });
  if (ownedWorkspace) {
    return ownedWorkspace;
  }

  const membership = await ProviderWorkspaceMember.findOne({
    where: { userId: actorId },
    include: [
      {
        model: ProviderWorkspace,
        as: 'workspace',
        where: { type: 'agency' },
      },
    ],
    order: [['createdAt', 'ASC']],
  });

  if (!membership?.workspace) {
    throw new AuthorizationError('No agency workspace available for your account.');
  }

  return membership.workspace;
}

async function fetchWorkspaceMembers(workspaceId) {
  const members = await ProviderWorkspaceMember.findAll({
    where: { workspaceId },
    attributes: ['userId'],
  });
  const memberIds = members
    .map((member) => member.userId)
    .filter((id) => Number.isInteger(id));
  return Array.from(new Set(memberIds));
}

async function fetchBookingRecords(workspaceId, { limit = 50 } = {}) {
  return NetworkingSessionSignup.findAll({
    include: [
      {
        model: NetworkingSession,
        as: 'session',
        where: { companyId: workspaceId },
        required: true,
      },
    ],
    order: [['createdAt', 'DESC']],
    limit,
  });
}

async function fetchOrderRecords(workspaceId, { limit = 50 } = {}) {
  return NetworkingSessionOrder.findAll({
    include: [
      {
        model: NetworkingSession,
        as: 'session',
        where: { companyId: workspaceId },
        required: true,
      },
      {
        model: User,
        as: 'purchaser',
        required: false,
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
    ],
    order: [['purchasedAt', 'DESC']],
    limit,
  });
}

async function fetchConnectionRecords(workspace, { limit = 100 } = {}) {
  const memberIds = await fetchWorkspaceMembers(workspace.id);
  const ownerIds = new Set([workspace.ownerId, ...memberIds].filter((id) => Number.isInteger(id)));
  if (ownerIds.size === 0) {
    return [];
  }

  const records = await NetworkingConnection.findAll({
    where: {
      ownerId: { [Op.in]: Array.from(ownerIds) },
    },
    include: [
      {
        model: NetworkingSession,
        as: 'session',
        required: false,
      },
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        required: false,
      },
      {
        model: User,
        as: 'contact',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        required: false,
      },
    ],
    order: [['connectedAt', 'DESC']],
    limit: limit * 3,
  });

  return records.filter((record) => {
    const metadataWorkspaceId = record.metadata?.workspaceId ?? record.get?.('metadata')?.workspaceId;
    if (metadataWorkspaceId && Number.parseInt(metadataWorkspaceId, 10) === workspace.id) {
      return true;
    }
    const session = record.get?.('session') ?? record.session;
    if (session?.companyId === workspace.id) {
      return true;
    }
    return false;
  }).slice(0, limit);
}

export async function getOverview(options = {}, actorContext = {}) {
  const workspace = await resolveAgencyWorkspace(options, actorContext);
  const [bookingRecords, orderRecords, connectionRecords] = await Promise.all([
    fetchBookingRecords(workspace.id, options),
    fetchOrderRecords(workspace.id, options),
    fetchConnectionRecords(workspace, options),
  ]);

  const bookings = bookingRecords.map((record) => sanitizeBooking(record)).filter(Boolean);
  const orders = orderRecords.map((record) => sanitizeOrder(record)).filter(Boolean);
  const connections = connectionRecords.map((record) => sanitizeConnection(record)).filter(Boolean);

  const summary = buildSummary({ bookings, orders, connections });

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    },
    summary: {
      ...summary,
      workspaceId: workspace.id,
    },
    bookings: {
      total: bookings.length,
      list: bookings,
    },
    purchases: {
      total: orders.length,
      totalSpendCents: summary.totalSpendCents,
      currency: summary.currency ?? 'USD',
      list: orders,
    },
    connections: {
      total: connections.length,
      list: connections,
    },
    meta: {
      workspaceId: workspace.id,
    },
  };
}

export async function listBookings(options = {}, actorContext = {}) {
  const workspace = await resolveAgencyWorkspace(options, actorContext);
  const records = await fetchBookingRecords(workspace.id, options);
  return records.map((record) => sanitizeBooking(record)).filter(Boolean);
}

export async function createBooking(payload = {}, actorContext = {}) {
  const workspace = await resolveAgencyWorkspace(payload, actorContext);
  const actorId = actorContext.actorId ?? null;
  const sessionId = parseInteger(payload.sessionId, { label: 'sessionId', required: true });
  const status = normalizeStatus(payload.status, NETWORKING_SESSION_SIGNUP_STATUSES, 'status');
  const seatNumber = parseInteger(payload.seatNumber, { label: 'seatNumber', positive: true });
  const participantId = parseInteger(payload.participantId, { label: 'participantId', positive: true });
  const participantEmail = payload.participantEmail ? String(payload.participantEmail).trim() : null;
  if (!participantEmail) {
    throw new ValidationError('participantEmail is required.');
  }

  const [session, participant] = await Promise.all([
    NetworkingSession.findOne({ where: { id: sessionId, companyId: workspace.id } }),
    participantId ? User.findByPk(participantId, { attributes: ['id', 'firstName', 'lastName', 'email'] }) : null,
  ]);

  if (!session) {
    throw new ValidationError('Networking session not found for this workspace.');
  }

  const participantName = payload.participantName
    ? String(payload.participantName).trim()
    : participant
      ? [participant.firstName, participant.lastName].filter(Boolean).join(' ').trim() || participant.email
      : 'Networking participant';

  const signup = await NetworkingSessionSignup.create({
    sessionId,
    participantId: participantId ?? null,
    participantEmail,
    participantName,
    status,
    source: 'host',
    seatNumber: seatNumber ?? null,
    joinUrl: payload.joinUrl ?? null,
    checkedInAt: parseDate(payload.checkedInAt, { label: 'checkedInAt' }),
    completedAt: parseDate(payload.completedAt, { label: 'completedAt' }),
    metadata: {
      ...(payload.metadata ?? {}),
      createdByWorkspaceId: workspace.id,
      createdByUserId: actorId,
      userNotes: payload.userNotes ?? null,
    },
  });

  const created = await NetworkingSessionSignup.findByPk(signup.id, {
    include: [{ model: NetworkingSession, as: 'session' }],
  });

  return sanitizeBooking(created);
}

export async function updateBooking(bookingId, payload = {}, actorContext = {}) {
  const workspace = await resolveAgencyWorkspace(payload, actorContext);
  const normalizedBookingId = parseInteger(bookingId, { label: 'bookingId', required: true });
  const signup = await NetworkingSessionSignup.findByPk(normalizedBookingId, {
    include: [{ model: NetworkingSession, as: 'session' }],
  });
  if (!signup || signup.session?.companyId !== workspace.id) {
    throw new AuthorizationError('Booking not found for this workspace.');
  }

  const updates = {};
  if (payload.status != null) {
    updates.status = normalizeStatus(payload.status, NETWORKING_SESSION_SIGNUP_STATUSES, 'status');
  }
  if (payload.seatNumber !== undefined) {
    updates.seatNumber = parseInteger(payload.seatNumber, { label: 'seatNumber', positive: true }) ?? null;
  }
  if (payload.joinUrl !== undefined) {
    updates.joinUrl = payload.joinUrl || null;
  }
  if (payload.checkedInAt !== undefined) {
    updates.checkedInAt = parseDate(payload.checkedInAt, { label: 'checkedInAt' });
  }
  if (payload.completedAt !== undefined) {
    updates.completedAt = parseDate(payload.completedAt, { label: 'completedAt' });
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

export async function listPurchases(options = {}, actorContext = {}) {
  const workspace = await resolveAgencyWorkspace(options, actorContext);
  const records = await fetchOrderRecords(workspace.id, options);
  return records.map((record) => sanitizeOrder(record)).filter(Boolean);
}

export async function createPurchase(payload = {}, actorContext = {}) {
  const workspace = await resolveAgencyWorkspace(payload, actorContext);
  const actorId = actorContext.actorId ?? null;
  const sessionId = parseInteger(payload.sessionId, { label: 'sessionId', required: true });
  const status = normalizeStatus(payload.status, NETWORKING_SESSION_ORDER_STATUSES, 'status');
  const amount = parseFloatValue(payload.amount ?? payload.amountCents, { label: 'amount', required: true });
  const amountCents = payload.amountCents != null ? parseInteger(payload.amountCents, { label: 'amountCents', positive: true }) : Math.round(amount * 100);
  const purchasedAt = parseDate(payload.purchasedAt, { label: 'purchasedAt' }) ?? new Date();
  const purchaserId = parseInteger(payload.purchaserId, { label: 'purchaserId', positive: true }) ?? actorId;

  const [session, purchaser] = await Promise.all([
    NetworkingSession.findOne({ where: { id: sessionId, companyId: workspace.id } }),
    purchaserId ? User.findByPk(purchaserId, { attributes: ['id', 'firstName', 'lastName', 'email'] }) : null,
  ]);

  if (!session) {
    throw new ValidationError('Networking session not found for this workspace.');
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
    purchaserId: purchaser.id,
    purchaserEmail: payload.purchaserEmail ?? purchaser.email ?? null,
    purchaserName:
      payload.purchaserName ??
      ([purchaser.firstName, purchaser.lastName].filter(Boolean).join(' ').trim() || purchaser.email),
    status,
    amountCents,
    currency: parseCurrency(payload.currency ?? session.currency ?? 'USD'),
    purchasedAt,
    reference: payload.reference ?? null,
    metadata: {
      ...metadata,
      createdByWorkspaceId: workspace.id,
      createdByUserId: actorId,
    },
  });

  const created = await NetworkingSessionOrder.findByPk(order.id, {
    include: [{ model: NetworkingSession, as: 'session' }],
  });

  return sanitizeOrder(created);
}

export async function updatePurchase(orderId, payload = {}, actorContext = {}) {
  const workspace = await resolveAgencyWorkspace(payload, actorContext);
  const normalizedOrderId = parseInteger(orderId, { label: 'orderId', required: true });
  const order = await NetworkingSessionOrder.findByPk(normalizedOrderId, {
    include: [{ model: NetworkingSession, as: 'session' }],
  });
  if (!order || order.session?.companyId !== workspace.id) {
    throw new AuthorizationError('Purchase not found for this workspace.');
  }

  const updates = {};
  if (payload.status != null) {
    updates.status = normalizeStatus(payload.status, NETWORKING_SESSION_ORDER_STATUSES, 'status');
  }
  if (payload.amountCents !== undefined || payload.amount !== undefined) {
    const amount = parseFloatValue(payload.amount ?? payload.amountCents, { label: 'amount' });
    updates.amountCents =
      payload.amountCents != null
        ? parseInteger(payload.amountCents, { label: 'amountCents', positive: true })
        : amount != null
          ? Math.round(amount * 100)
          : order.amountCents;
  }
  if (payload.currency != null) {
    updates.currency = parseCurrency(payload.currency);
  }
  if (payload.purchasedAt !== undefined) {
    updates.purchasedAt = parseDate(payload.purchasedAt, { label: 'purchasedAt' });
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

export async function listConnections(options = {}, actorContext = {}) {
  const workspace = await resolveAgencyWorkspace(options, actorContext);
  const records = await fetchConnectionRecords(workspace, options);
  return records.map((record) => sanitizeConnection(record)).filter(Boolean);
}

export async function createConnection(payload = {}, actorContext = {}) {
  const workspace = await resolveAgencyWorkspace(payload, actorContext);
  const actorId = actorContext.actorId;
  if (!actorId) {
    throw new AuthenticationError('Authentication required.');
  }

  const ownerId = parseInteger(payload.ownerId, { label: 'ownerId', positive: true }) ?? actorId;
  const connectionUserId = parseInteger(payload.connectionUserId, { label: 'connectionUserId', positive: true });
  const sessionId = parseInteger(payload.sessionId, { label: 'sessionId', positive: true });

  if (!payload.connectionName && !payload.connectionEmail && !payload.counterpartName) {
    throw new ValidationError('connectionName is required.');
  }

  let session = null;
  if (sessionId) {
    session = await NetworkingSession.findOne({ where: { id: sessionId, companyId: workspace.id } });
    if (!session) {
      throw new ValidationError('Networking session not found for this workspace.');
    }
  }

  const connection = await NetworkingConnection.create({
    ownerId,
    connectionUserId: connectionUserId ?? null,
    sessionId: session ? session.id : sessionId ?? null,
    connectionName:
      payload.connectionName || payload.counterpartName || payload.connectionEmail || 'Networking connection',
    connectionEmail: payload.connectionEmail ?? null,
    connectionHeadline: payload.connectionHeadline ?? null,
    connectionCompany: payload.connectionCompany ?? null,
    followStatus: normalizeStatus(payload.followStatus, NETWORKING_CONNECTION_FOLLOW_STATUSES, 'followStatus'),
    connectedAt: parseDate(payload.connectedAt, { label: 'connectedAt' }) ?? new Date(),
    lastContactedAt: parseDate(payload.lastContactedAt, { label: 'lastContactedAt' }),
    notes: payload.notes ?? null,
    tags: normalizeTags(payload.tags),
    metadata: {
      ...(payload.metadata ?? {}),
      workspaceId: workspace.id,
      createdByUserId: actorId,
    },
  });

  const created = await NetworkingConnection.findByPk(connection.id, {
    include: [
      { model: NetworkingSession, as: 'session', required: false },
      { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
      { model: User, as: 'contact', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
    ],
  });

  return sanitizeConnection(created);
}

export async function updateConnection(connectionId, payload = {}, actorContext = {}) {
  const workspace = await resolveAgencyWorkspace(payload, actorContext);
  const normalizedConnectionId = parseInteger(connectionId, { label: 'connectionId', required: true });
  const connection = await NetworkingConnection.findByPk(normalizedConnectionId, {
    include: [{ model: NetworkingSession, as: 'session', required: false }],
  });
  if (!connection) {
    throw new NotFoundError('Connection not found.');
  }
  const metadataWorkspaceId = connection.metadata?.workspaceId ?? null;
  if (metadataWorkspaceId && Number.parseInt(metadataWorkspaceId, 10) !== workspace.id) {
    throw new AuthorizationError('Connection not found for this workspace.');
  }
  if (connection.sessionId) {
    const session = connection.get?.('session') ?? (await NetworkingSession.findByPk(connection.sessionId));
    if (session && session.companyId !== workspace.id) {
      throw new AuthorizationError('Connection not found for this workspace.');
    }
  }

  const updates = {};
  if (payload.connectionName !== undefined) {
    updates.connectionName = payload.connectionName || 'Networking connection';
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
  if (payload.followStatus != null) {
    updates.followStatus = normalizeStatus(payload.followStatus, NETWORKING_CONNECTION_FOLLOW_STATUSES, 'followStatus');
  }
  if (payload.connectedAt !== undefined) {
    updates.connectedAt = parseDate(payload.connectedAt, { label: 'connectedAt' });
  }
  if (payload.lastContactedAt !== undefined) {
    updates.lastContactedAt = parseDate(payload.lastContactedAt, { label: 'lastContactedAt' });
  }
  if (payload.notes !== undefined) {
    updates.notes = payload.notes || null;
  }
  if (payload.tags !== undefined) {
    updates.tags = normalizeTags(payload.tags);
  }

  const metadata = { ...(connection.metadata ?? {}) };
  if (payload.metadata && typeof payload.metadata === 'object') {
    Object.assign(metadata, payload.metadata);
  }
  metadata.workspaceId = workspace.id;
  updates.metadata = metadata;

  await connection.update(updates);
  await connection.reload({
    include: [
      { model: NetworkingSession, as: 'session', required: false },
      { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
      { model: User, as: 'contact', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
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
