import { getUserConsentSnapshot, recordUserConsentDecision } from '../services/consentService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions, resolveRequestUserId } from '../utils/requestContext.js';

const CONSENT_ADMIN_PERMISSIONS = new Set(['consent:manage', 'governance:consents', 'compliance:consents']);
const CONSENT_ADMIN_ROLES = new Set(['admin', 'platform_admin', 'compliance', 'legal', 'support']);

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

function assertCanActOnUser(req, targetUserId) {
  const actorId = resolveRequestUserId(req);
  if (!actorId) {
    throw new AuthorizationError('Authentication is required to manage consent decisions.');
  }

  if (Number(actorId) === Number(targetUserId)) {
    return { actorId: Number(actorId), actingAs: 'self' };
  }

  const roles = collectRoles(req);
  const permissions = new Set(resolveRequestPermissions(req).map((permission) => String(permission).toLowerCase()));
  const hasRole = Array.from(roles).some((role) => CONSENT_ADMIN_ROLES.has(role));
  const hasPermission = Array.from(permissions).some((permission) => CONSENT_ADMIN_PERMISSIONS.has(permission));

  if (!hasRole && !hasPermission) {
    throw new AuthorizationError('Consent records can only be managed by compliance or legal administrators.');
  }

  return { actorId: Number(actorId), actingAs: 'administrator' };
}

function ensureUserId(value) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('A valid user id is required.');
  }
  return numeric;
}

function ensurePolicyCode(value) {
  if (!value || !String(value).trim()) {
    throw new ValidationError('policyCode is required.');
  }
  return String(value).trim();
}

function ensurePayloadObject(body) {
  if (body == null) {
    return {};
  }
  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Consent payload must be provided as an object.');
  }
  return { ...body };
}

export async function snapshot(req, res) {
  const userId = ensureUserId(req.params?.id);
  const context = assertCanActOnUser(req, userId);
  const filters = {
    audience: req.query?.audience,
    region: req.query?.region,
  };
  const snapshotData = await getUserConsentSnapshot(userId, filters);
  res.json({
    userId,
    outstandingRequired: snapshotData.outstandingRequired,
    policies: snapshotData.policies,
    access: {
      actorId: context.actorId,
      actingAs: context.actingAs,
    },
  });
}

export async function update(req, res) {
  const userId = ensureUserId(req.params?.id);
  const context = assertCanActOnUser(req, userId);
  const policyCode = ensurePolicyCode(req.params?.policyCode);
  const payload = ensurePayloadObject(req.body);

  const consent = await recordUserConsentDecision(userId, policyCode, {
    status: payload.status,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    source: payload.source ?? (context.actingAs === 'self' ? 'self_service' : 'admin_override'),
    metadata: payload.metadata,
    actorId: context.actingAs === 'self' ? null : String(context.actorId),
  });

  res.json({
    consent: consent.toSnapshot(),
    access: {
      actorId: context.actorId,
      actingAs: context.actingAs,
    },
  });
}

export default {
  snapshot,
  update,
};
