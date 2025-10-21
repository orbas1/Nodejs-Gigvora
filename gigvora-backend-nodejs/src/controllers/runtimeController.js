import { getVisibleAnnouncements } from '../services/runtimeMaintenanceService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions, resolveRequestUserId } from '../utils/requestContext.js';

const ALLOWED_AUDIENCES = new Set([
  'public',
  'authenticated',
  'user',
  'provider',
  'company',
  'agency',
  'admin',
  'operations',
]);

const OPERATIONS_ROLES = new Set(['admin', 'platform_admin', 'operations', 'operations_lead', 'site-reliability', 'sre']);
const PROVIDER_ROLES = new Set(['provider', 'agency', 'company', 'workspace_admin']);
const OPERATIONS_PERMISSIONS = new Set(['runtime:maintenance:view', 'runtime:maintenance:manage', 'operations:runtime']);

function normalise(value) {
  if (!value) {
    return null;
  }
  return `${value}`.trim().toLowerCase();
}

function collectRoles(req) {
  const roles = new Set();
  const primary = normalise(req.user?.type ?? req.user?.role);
  if (primary) {
    roles.add(primary);
  }
  if (Array.isArray(req.user?.roles)) {
    req.user.roles.forEach((role) => {
      const normalised = normalise(role);
      if (normalised) {
        roles.add(normalised);
      }
    });
  }
  const headerRoles = req.headers?.['x-roles'];
  if (typeof headerRoles === 'string') {
    headerRoles
      .split(',')
      .map((entry) => normalise(entry))
      .filter(Boolean)
      .forEach((role) => roles.add(role));
  }
  return roles;
}

function collectPermissions(req) {
  return new Set(resolveRequestPermissions(req).map((permission) => normalise(permission)).filter(Boolean));
}

function parseAudience(value) {
  const audience = normalise(value) ?? 'public';
  if (!ALLOWED_AUDIENCES.has(audience)) {
    throw new ValidationError('audience is not supported for maintenance announcements.');
  }
  return audience;
}

function parseBoolean(value, fallback = false) {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalised = normalise(value);
  if (normalised == null) {
    return fallback;
  }
  if (['1', 'true', 'yes', 'y'].includes(normalised)) {
    return true;
  }
  if (['0', 'false', 'no', 'n'].includes(normalised)) {
    return false;
  }
  return fallback;
}

function clampNumber(value, { min, max, fallback }) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric)) {
    throw new ValidationError('Numeric query parameters must be integers.');
  }
  if (numeric < min) {
    return min;
  }
  if (numeric > max) {
    return max;
  }
  return numeric;
}

function ensureAudienceAccess(req, { audience, includeResolved }) {
  const resolvedAudience = parseAudience(audience);
  if (resolvedAudience === 'public') {
    return { actorId: null, audience: resolvedAudience, canViewResolved: false };
  }

  const actorId = resolveRequestUserId(req);
  if (!actorId) {
    throw new AuthorizationError('Authentication is required to view private maintenance schedules.');
  }

  const roles = collectRoles(req);
  const permissions = collectPermissions(req);
  const hasOperationsAccess =
    Array.from(roles).some((role) => OPERATIONS_ROLES.has(role)) ||
    Array.from(permissions).some((permission) => OPERATIONS_PERMISSIONS.has(permission));

  if (resolvedAudience === 'authenticated' || resolvedAudience === 'user') {
    return { actorId, audience: resolvedAudience, canViewResolved: includeResolved && hasOperationsAccess };
  }

  if (['provider', 'company', 'agency'].includes(resolvedAudience)) {
    const matchesRole = Array.from(roles).some((role) => PROVIDER_ROLES.has(role) || role === resolvedAudience);
    if (!matchesRole && !hasOperationsAccess) {
      throw new AuthorizationError('You do not have access to provider maintenance announcements.');
    }
    return { actorId, audience: resolvedAudience, canViewResolved: includeResolved && hasOperationsAccess };
  }

  if (['admin', 'operations'].includes(resolvedAudience)) {
    if (!hasOperationsAccess) {
      throw new AuthorizationError('Operations or administrator access is required for this maintenance feed.');
    }
    return { actorId, audience: resolvedAudience, canViewResolved: true };
  }

  return { actorId, audience: resolvedAudience, canViewResolved: includeResolved && hasOperationsAccess };
}

export async function maintenanceAnnouncements(req, res) {
  const includeResolved = parseBoolean(req.query?.includeResolved, false);
  const audienceContext = ensureAudienceAccess(req, {
    audience: req.query?.audience,
    includeResolved,
  });

  const windowMinutes = clampNumber(req.query?.windowMinutes, { min: 5, max: 24 * 60, fallback: 90 });
  const limit = clampNumber(req.query?.limit, { min: 1, max: 50, fallback: 20 });

  const result = await getVisibleAnnouncements({
    audience: audienceContext.audience,
    channel: req.query?.channel,
    windowMinutes,
    includeResolved: includeResolved && audienceContext.canViewResolved,
    limit,
  });

  res.json({
    ...result,
    access: {
      actorId: audienceContext.actorId,
      audience: audienceContext.audience,
      canViewResolved: audienceContext.canViewResolved,
    },
  });
}

export default {
  maintenanceAnnouncements,
};
