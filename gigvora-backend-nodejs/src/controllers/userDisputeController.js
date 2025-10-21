import asyncHandler from '../utils/asyncHandler.js';
import userDisputeService from '../services/userDisputeService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions, resolveRequestUserId } from '../utils/requestContext.js';

const DISPUTE_ADMIN_PERMISSIONS = new Set(['disputes:manage', 'trust:manage']);
const DISPUTE_ADMIN_ROLES = new Set(['admin', 'platform_admin', 'support', 'operations', 'trust']);

function ensurePositiveInteger(value, label) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return numeric;
}

function ensurePayloadObject(body) {
  if (body == null) {
    return {};
  }
  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Request payload must be provided as an object.');
  }
  return { ...body };
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

function assertUserDisputeAccess(req, targetUserId) {
  const actorId = resolveRequestUserId(req);
  if (!actorId) {
    throw new AuthorizationError('Authentication is required to access dispute history.');
  }

  if (Number(actorId) === Number(targetUserId)) {
    return { actorId: Number(actorId), actingAs: 'self' };
  }

  const roles = collectRoles(req);
  const permissions = new Set(resolveRequestPermissions(req).map((permission) => String(permission).toLowerCase()));
  const hasRole = Array.from(roles).some((role) => DISPUTE_ADMIN_ROLES.has(role));
  const hasPermission = Array.from(permissions).some((permission) => DISPUTE_ADMIN_PERMISSIONS.has(permission));

  if (!hasRole && !hasPermission) {
    throw new AuthorizationError('Dispute records are restricted to support and trust operators.');
  }

  return { actorId: Number(actorId), actingAs: 'administrator' };
}

export const listUserDisputes = asyncHandler(async (req, res) => {
  const userId = ensurePositiveInteger(req.params.id, 'userId');
  const context = assertUserDisputeAccess(req, userId);
  const { stage, status } = req.query;
  const payload = await userDisputeService.listUserDisputes(userId, { stage, status });
  res.json({ ...payload, access: context });
});

export const getUserDispute = asyncHandler(async (req, res) => {
  const userId = ensurePositiveInteger(req.params.id, 'userId');
  const context = assertUserDisputeAccess(req, userId);
  const disputeId = ensurePositiveInteger(req.params.disputeId, 'disputeId');
  const dispute = await userDisputeService.getUserDispute(userId, disputeId);
  res.json({ dispute, access: context });
});

export const createUserDispute = asyncHandler(async (req, res) => {
  const userId = ensurePositiveInteger(req.params.id, 'userId');
  const context = assertUserDisputeAccess(req, userId);
  const dispute = await userDisputeService.createUserDispute(userId, ensurePayloadObject(req.body));
  res.status(201).json({ dispute, access: context });
});

export const appendUserDisputeEvent = asyncHandler(async (req, res) => {
  const userId = ensurePositiveInteger(req.params.id, 'userId');
  const context = assertUserDisputeAccess(req, userId);
  const disputeId = ensurePositiveInteger(req.params.disputeId, 'disputeId');
  const dispute = await userDisputeService.appendUserDisputeEvent(
    userId,
    disputeId,
    ensurePayloadObject(req.body),
  );
  res.status(201).json({ dispute, access: context });
});

export default {
  listUserDisputes,
  getUserDispute,
  createUserDispute,
  appendUserDisputeEvent,
};
