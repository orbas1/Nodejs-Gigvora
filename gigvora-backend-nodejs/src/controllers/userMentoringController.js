import * as userMentoringService from '../services/userMentoringService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions, resolveRequestUserId } from '../utils/requestContext.js';

const ADMIN_PERMISSIONS = new Set(['mentoring:manage', 'mentoring:admin']);
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

function assertMentoringAccess(req, targetUserId) {
  const actorId = resolveRequestUserId(req);
  if (!actorId) {
    throw new AuthorizationError('Authentication is required for mentoring operations.');
  }

  if (Number(actorId) === Number(targetUserId)) {
    return { actorId: Number(actorId), actingAs: 'self' };
  }

  const roles = collectRoles(req);
  const permissions = new Set(resolveRequestPermissions(req).map((permission) => String(permission).toLowerCase()));
  const hasRole = Array.from(roles).some((role) => ADMIN_ROLES.has(role));
  const hasPermission = Array.from(permissions).some((permission) => ADMIN_PERMISSIONS.has(permission));

  if (!hasRole && !hasPermission) {
    throw new AuthorizationError('You do not have permission to manage mentoring for this user.');
  }

  return { actorId: Number(actorId), actingAs: 'administrator' };
}

export async function getMentoringDashboard(req, res) {
  const userId = ensureUserId(req.params.userId ?? req.params.id);
  const context = assertMentoringAccess(req, userId);
  const dashboard = await userMentoringService.getMentoringDashboard(userId, {
    bypassCache: req.query.fresh === 'true',
  });
  res.json({ ...dashboard, access: context });
}

export async function createMentoringSession(req, res) {
  const userId = ensureUserId(req.params.userId ?? req.params.id);
  const context = assertMentoringAccess(req, userId);
  const session = await userMentoringService.createMentoringSession(
    userId,
    ensurePayloadObject(req.body, 'mentoring session'),
  );
  res.status(201).json({ ...session, access: context });
}

export async function updateMentoringSession(req, res) {
  const userId = ensureUserId(req.params.userId ?? req.params.id);
  const context = assertMentoringAccess(req, userId);
  const session = await userMentoringService.updateMentoringSession(
    userId,
    req.params.sessionId,
    ensurePayloadObject(req.body, 'mentoring session update'),
  );
  res.json({ ...session, access: context });
}

export async function recordMentorshipPurchase(req, res) {
  const userId = ensureUserId(req.params.userId ?? req.params.id);
  const context = assertMentoringAccess(req, userId);
  const order = await userMentoringService.recordMentorshipPurchase(
    userId,
    ensurePayloadObject(req.body, 'mentorship purchase'),
  );
  res.status(201).json({ ...order, access: context });
}

export async function updateMentorshipPurchase(req, res) {
  const userId = ensureUserId(req.params.userId ?? req.params.id);
  const context = assertMentoringAccess(req, userId);
  const order = await userMentoringService.updateMentorshipPurchase(
    userId,
    req.params.orderId,
    ensurePayloadObject(req.body, 'mentorship purchase update'),
  );
  res.json({ ...order, access: context });
}

export async function addFavouriteMentor(req, res) {
  const userId = ensureUserId(req.params.userId ?? req.params.id);
  const context = assertMentoringAccess(req, userId);
  const favourite = await userMentoringService.addFavouriteMentor(
    userId,
    ensurePayloadObject(req.body, 'favourite mentor'),
  );
  res.status(201).json({ ...favourite, access: context });
}

export async function removeFavouriteMentor(req, res) {
  const userId = ensureUserId(req.params.userId ?? req.params.id);
  const context = assertMentoringAccess(req, userId);
  const response = await userMentoringService.removeFavouriteMentor(userId, Number(req.params.mentorId));
  res.json({ ...response, access: context });
}

export async function submitMentorReview(req, res) {
  const userId = ensureUserId(req.params.userId ?? req.params.id);
  const context = assertMentoringAccess(req, userId);
  const review = await userMentoringService.submitMentorReview(
    userId,
    ensurePayloadObject(req.body, 'mentor review'),
  );
  res.status(201).json({ ...review, access: context });
}

export default {
  getMentoringDashboard,
  createMentoringSession,
  updateMentoringSession,
  recordMentorshipPurchase,
  updateMentorshipPurchase,
  addFavouriteMentor,
  removeFavouriteMentor,
  submitMentorReview,
};
