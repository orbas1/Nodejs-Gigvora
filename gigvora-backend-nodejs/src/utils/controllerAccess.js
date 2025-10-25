import { AuthorizationError, ValidationError } from './errors.js';
import { hasProjectManagementAccess } from '../middleware/authorization.js';
import { resolveRequestUserId } from './requestContext.js';

const MANAGEMENT_ALLOWED_ROLES = [
  'project_manager',
  'project_management',
  'operations_lead',
  'operations',
  'agency',
  'agency_admin',
  'company',
  'company_admin',
  'workspace_admin',
  'admin',
];

export function ensurePlainObject(input, label = 'payload') {
  if (input == null) {
    return {};
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ValidationError(`${label} must be provided as an object.`);
  }
  return input;
}

export function parsePositiveInteger(value, label, { optional = false } = {}) {
  if (value == null || value === '') {
    if (optional) {
      return null;
    }
    throw new ValidationError(`${label} is required.`);
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    if (optional) {
      return null;
    }
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return numeric;
}

export function ensureProjectManagementAccess(req) {
  const hasAccess = Boolean(hasProjectManagementAccess(req));
  if (!hasAccess) {
    throw new AuthorizationError(
      'Project workspace operations require an active project management or operations role.',
    );
  }
  const actorId = resolveRequestUserId(req);
  const parsedActorId = actorId != null ? parsePositiveInteger(actorId, 'actorId', { optional: true }) : null;
  return {
    actorId: parsedActorId,
    hasManagementAccess: true,
    allowedRoles: [...MANAGEMENT_ALLOWED_ROLES],
  };
}

export function sanitizeActorPayload(payload, context) {
  const body = ensurePlainObject(payload);
  const override = body.actorId != null
    ? parsePositiveInteger(body.actorId, 'actorId', { optional: true })
    : null;
  const actorId = override ?? context.actorId ?? null;
  const sanitized = { ...body };
  delete sanitized.actorId;
  return { actorId, payload: sanitized };
}

export function buildManagementAccessSnapshot(context, { performedBy } = {}) {
  const actorId = context.actorId ?? null;
  const performer = performedBy ?? actorId ?? null;
  return {
    actorId,
    performedBy: performer,
    canView: true,
    canManage: Boolean(context.hasManagementAccess),
    allowedRoles: [...(context.allowedRoles ?? MANAGEMENT_ALLOWED_ROLES)],
  };
}

export function respondWithAccess(res, body, context, { status = 200, performedBy } = {}) {
  const responseBody = body != null && typeof body === 'object' && !Array.isArray(body)
    ? { ...body }
    : { result: body };
  responseBody.access = buildManagementAccessSnapshot(context, { performedBy });
  res.status(status).json(responseBody);
}

export function parseParamId(req, paramName, label = paramName) {
  return parsePositiveInteger(req.params?.[paramName], label);
}

export function parseRouteParam(req, config) {
  if (typeof config === 'string') {
    return parsePositiveInteger(req.params?.[config], config);
  }

  if (!config || typeof config !== 'object') {
    throw new ValidationError('Route parameter configuration must be a string or object.');
  }

  const { name, label = name, optional = false } = config;
  if (!name || typeof name !== 'string') {
    throw new ValidationError('Route parameter configuration requires a name.');
  }

  return parsePositiveInteger(req.params?.[name], label ?? name, { optional });
}

export default {
  ensurePlainObject,
  parsePositiveInteger,
  ensureProjectManagementAccess,
  sanitizeActorPayload,
  buildManagementAccessSnapshot,
  respondWithAccess,
  parseParamId,
  parseRouteParam,
};
