import * as userNetworkingService from '../services/userNetworkingService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions, resolveRequestUserId } from '../utils/requestContext.js';

const ADMIN_PERMISSIONS = new Set(['networking:manage', 'connections:manage']);
const ADMIN_ROLES = new Set(['admin', 'platform_admin', 'operations', 'support']);

function ensureUserId(param) {
  const numeric = Number.parseInt(param, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('A valid user id is required.');
  }
  return numeric;
}

function ensurePayloadObject(body, label) {
  if (body == null) {
    return {};
  }
  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError(`${label} must be provided as an object.`);
  }
  return { ...body };
}

function clampLimit(value) {
  if (value == null || value === '') {
    return undefined;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('limit must be a positive integer.');
  }
  return Math.min(numeric, 100);
}

function collectRoles(req) {
  const roles = new Set();
  const primary = req.user?.type ?? req.user?.role;
  if (primary) {
    roles.add(String(primary).toLowerCase());
  }
  if (Array.isArray(req.user?.roles)) {
    req.user.roles
      .map((role) => String(role).toLowerCase())
      .filter(Boolean)
      .forEach((role) => roles.add(role));
  }
  return roles;
}

function assertNetworkingAccess(req, targetUserId) {
  const actorId = resolveRequestUserId(req);
  if (!actorId) {
    throw new AuthorizationError('Authentication is required to manage networking.');
  }

  if (Number(actorId) === Number(targetUserId)) {
    return { actorId: Number(actorId), actingAs: 'self' };
  }

  const roles = collectRoles(req);
  const permissions = new Set(resolveRequestPermissions(req).map((permission) => String(permission).toLowerCase()));
  const hasRole = Array.from(roles).some((role) => ADMIN_ROLES.has(role));
  const hasPermission = Array.from(permissions).some((permission) => ADMIN_PERMISSIONS.has(permission));

  if (!hasRole && !hasPermission) {
    throw new AuthorizationError('You do not have permission to manage networking for this user.');
  }

  return { actorId: Number(actorId), actingAs: 'administrator' };
}

export async function getOverview(req, res) {
  const userId = ensureUserId(req.params.id);
  const context = assertNetworkingAccess(req, userId);
  const overview = await userNetworkingService.getOverview(userId);
  res.json({ ...overview, access: context });
}

export async function listBookings(req, res) {
  const userId = ensureUserId(req.params.id);
  const context = assertNetworkingAccess(req, userId);
  const limit = clampLimit(req.query?.limit);
  const bookings = await userNetworkingService.listBookings(userId, { limit });
  res.json({ data: bookings, access: context });
}

export async function createBooking(req, res) {
  const userId = ensureUserId(req.params.id);
  const context = assertNetworkingAccess(req, userId);
  const booking = await userNetworkingService.createBooking(
    userId,
    ensurePayloadObject(req.body, 'networking booking'),
  );
  res.status(201).json({ ...booking, access: context });
}

export async function updateBooking(req, res) {
  const userId = ensureUserId(req.params.id);
  const context = assertNetworkingAccess(req, userId);
  const booking = await userNetworkingService.updateBooking(
    userId,
    req.params.bookingId,
    ensurePayloadObject(req.body, 'networking booking update'),
  );
  res.json({ ...booking, access: context });
}

export async function listPurchases(req, res) {
  const userId = ensureUserId(req.params.id);
  const context = assertNetworkingAccess(req, userId);
  const limit = clampLimit(req.query?.limit);
  const purchases = await userNetworkingService.listPurchases(userId, { limit });
  res.json({ data: purchases, access: context });
}

export async function createPurchase(req, res) {
  const userId = ensureUserId(req.params.id);
  const context = assertNetworkingAccess(req, userId);
  const purchase = await userNetworkingService.createPurchase(
    userId,
    ensurePayloadObject(req.body, 'networking purchase'),
  );
  res.status(201).json({ ...purchase, access: context });
}

export async function updatePurchase(req, res) {
  const userId = ensureUserId(req.params.id);
  const context = assertNetworkingAccess(req, userId);
  const purchase = await userNetworkingService.updatePurchase(
    userId,
    req.params.orderId,
    ensurePayloadObject(req.body, 'networking purchase update'),
  );
  res.json({ ...purchase, access: context });
}

export async function listConnections(req, res) {
  const userId = ensureUserId(req.params.id);
  const context = assertNetworkingAccess(req, userId);
  const limit = clampLimit(req.query?.limit);
  const connections = await userNetworkingService.listConnections(userId, { limit });
  res.json({ data: connections, access: context });
}

export async function createConnection(req, res) {
  const userId = ensureUserId(req.params.id);
  const context = assertNetworkingAccess(req, userId);
  const connection = await userNetworkingService.createConnection(
    userId,
    ensurePayloadObject(req.body, 'networking connection'),
  );
  res.status(201).json({ ...connection, access: context });
}

export async function updateConnection(req, res) {
  const userId = ensureUserId(req.params.id);
  const context = assertNetworkingAccess(req, userId);
  const connection = await userNetworkingService.updateConnection(
    userId,
    req.params.connectionId,
    ensurePayloadObject(req.body, 'networking connection update'),
  );
  res.json({ ...connection, access: context });
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
