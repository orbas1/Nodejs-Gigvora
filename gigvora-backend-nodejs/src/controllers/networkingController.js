import {
  listNetworkingSessions,
  createNetworkingSession,
  getNetworkingSession,
  updateNetworkingSession,
  regenerateNetworkingRotations,
  registerForNetworkingSession,
  updateNetworkingSignup,
  listNetworkingBusinessCards,
  createNetworkingBusinessCard,
  updateNetworkingBusinessCard,
  getNetworkingSessionRuntime,
} from '../services/networkingService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions, resolveRequestUserId } from '../utils/requestContext.js';

function parsePositiveInteger(value, label, { optional = false } = {}) {
  if (value == null || value === '') {
    if (optional) {
      return null;
    }
    throw new ValidationError(`${label} is required.`);
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return parsed;
}

function parseOptionalInteger(value, label) {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError(`${label} must be a positive integer when provided.`);
  }
  return parsed;
}

function parseBoolean(value, fallback = undefined) {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalized = `${value}`.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }
  throw new ValidationError('Boolean parameters must be true or false.');
}

function resolveActorId(req, { required = true } = {}) {
  const actorId = resolveRequestUserId(req);
  if (!actorId && required) {
    throw new AuthorizationError('Authentication required.');
  }
  return actorId;
}

function ensureWorkspaceAccess(req, workspaceId) {
  const permissions = new Set(resolveRequestPermissions(req).map((permission) => permission.toLowerCase()));
  const roles = Array.isArray(req.user?.roles) ? req.user.roles : [req.user?.role].filter(Boolean);
  roles.map((role) => `${role}`.toLowerCase()).forEach((role) => permissions.add(role));

  if (
    permissions.has('admin') ||
    permissions.has('community.manage.any') ||
    permissions.has('networking.manage.any')
  ) {
    return;
  }

  const access = req.networkingAccess ?? {};
  const permittedWorkspaceIds = Array.isArray(access.permittedWorkspaceIds)
    ? access.permittedWorkspaceIds
    : [];
  const numericWorkspaceId = Number.isFinite(workspaceId) ? workspaceId : parseOptionalInteger(workspaceId, 'workspaceId');

  if (
    numericWorkspaceId != null &&
    permittedWorkspaceIds.length &&
    !permittedWorkspaceIds.includes(numericWorkspaceId)
  ) {
    throw new AuthorizationError('You do not have access to this workspace.');
  }

  if (numericWorkspaceId != null && permittedWorkspaceIds.length === 0 && !permissions.has('networking.manage.own')) {
    throw new AuthorizationError('You must be provisioned for this workspace.');
  }
}

function clampLookback(value, fallback) {
  const parsed = value == null ? fallback : parsePositiveInteger(value, 'lookbackDays');
  return Math.min(parsed, 365);
}

function sanitisePayload(payload, label) {
  if (payload == null) {
    return {};
  }
  if (typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ValidationError(`${label} must be an object.`);
  }
  return JSON.parse(JSON.stringify(payload));
}

export async function index(req, res) {
  const {
    companyId,
    status,
    includeMetrics,
    upcomingOnly,
    lookbackDays,
  } = req.query ?? {};

  const access = req.networkingAccess ?? {};
  const permittedWorkspaceIds = Array.isArray(access.permittedWorkspaceIds)
    ? access.permittedWorkspaceIds
    : [];

  const requestedCompanyId = parseOptionalInteger(companyId, 'companyId');
  if (requestedCompanyId != null) {
    ensureWorkspaceAccess(req, requestedCompanyId);
  }

  const resolvedCompanyId =
    requestedCompanyId ??
    (access.defaultWorkspaceId != null ? parseOptionalInteger(access.defaultWorkspaceId, 'workspaceId') : null) ??
    (permittedWorkspaceIds[0] ?? null);

  const result = await listNetworkingSessions(
    {
      companyId: resolvedCompanyId,
      status: status ?? undefined,
      includeMetrics: parseBoolean(includeMetrics, true),
      upcomingOnly: parseBoolean(upcomingOnly, false),
      lookbackDays: clampLookback(lookbackDays, 180),
    },
    { authorizedWorkspaceIds: permittedWorkspaceIds },
  );

  res.json({
    ...result,
    meta: {
      permittedWorkspaceIds,
      selectedWorkspaceId: resolvedCompanyId,
    },
  });
}

export async function create(req, res) {
  const payload = req.body ?? {};
  const actorId = resolveActorId(req);
  const access = req.networkingAccess ?? {};
  const permittedWorkspaceIds = Array.isArray(access.permittedWorkspaceIds)
    ? access.permittedWorkspaceIds
    : [];

  const requestPayload = sanitisePayload(payload, 'networking session');
  if (requestPayload.companyId == null && access.defaultWorkspaceId != null) {
    requestPayload.companyId = parseOptionalInteger(access.defaultWorkspaceId, 'workspaceId');
  }

  ensureWorkspaceAccess(req, requestPayload.companyId ?? permittedWorkspaceIds[0]);

  const result = await createNetworkingSession(requestPayload, {
    actorId,
    authorizedWorkspaceIds: permittedWorkspaceIds,
  });
  res.status(201).json(result);
}

export async function show(req, res) {
  const sessionId = parsePositiveInteger(req.params?.sessionId, 'sessionId');
  const includeAssociations = parseBoolean(req.query?.includeAssociations);
  const access = req.networkingAccess ?? {};
  const permittedWorkspaceIds = Array.isArray(access.permittedWorkspaceIds)
    ? access.permittedWorkspaceIds
    : [];

  const result = await getNetworkingSession(sessionId, {
    includeAssociations: includeAssociations ?? true,
    authorizedWorkspaceIds: permittedWorkspaceIds,
  });
  res.json(result);
}

export async function update(req, res) {
  const sessionId = parsePositiveInteger(req.params?.sessionId, 'sessionId');
  const payload = sanitisePayload(req.body ?? {}, 'networking session');
  const actorId = resolveActorId(req);
  const access = req.networkingAccess ?? {};
  const permittedWorkspaceIds = Array.isArray(access.permittedWorkspaceIds)
    ? access.permittedWorkspaceIds
    : [];

  ensureWorkspaceAccess(req, payload.companyId ?? permittedWorkspaceIds[0]);

  const result = await updateNetworkingSession(sessionId, payload, {
    actorId,
    authorizedWorkspaceIds: permittedWorkspaceIds,
  });
  res.json(result);
}

export async function regenerateRotationsHandler(req, res) {
  const sessionId = parsePositiveInteger(req.params?.sessionId, 'sessionId');
  const payload = sanitisePayload(req.body ?? {}, 'rotation request');
  const access = req.networkingAccess ?? {};
  const permittedWorkspaceIds = Array.isArray(access.permittedWorkspaceIds)
    ? access.permittedWorkspaceIds
    : [];

  const result = await regenerateNetworkingRotations(sessionId, payload, {
    authorizedWorkspaceIds: permittedWorkspaceIds,
  });
  res.json(result);
}

export async function register(req, res) {
  const sessionId = parsePositiveInteger(req.params?.sessionId, 'sessionId');
  const payload = sanitisePayload(req.body ?? {}, 'registration');
  const actorId = resolveActorId(req);
  const result = await registerForNetworkingSession(sessionId, payload, { actorId });
  res.status(201).json(result);
}

export async function updateSignupHandler(req, res) {
  const sessionId = parsePositiveInteger(req.params?.sessionId, 'sessionId');
  const signupId = parsePositiveInteger(req.params?.signupId, 'signupId');
  const payload = sanitisePayload(req.body ?? {}, 'signup update');
  const access = req.networkingAccess ?? {};
  const permittedWorkspaceIds = Array.isArray(access.permittedWorkspaceIds)
    ? access.permittedWorkspaceIds
    : [];

  const result = await updateNetworkingSignup(
    sessionId,
    signupId,
    payload,
    { authorizedWorkspaceIds: permittedWorkspaceIds },
  );
  res.json(result);
}

export async function runtime(req, res) {
  const sessionId = parsePositiveInteger(req.params?.sessionId, 'sessionId');
  const access = req.networkingAccess ?? {};
  const permittedWorkspaceIds = Array.isArray(access.permittedWorkspaceIds)
    ? access.permittedWorkspaceIds
    : [];

  const result = await getNetworkingSessionRuntime(sessionId, {
    authorizedWorkspaceIds: permittedWorkspaceIds,
  });
  res.json(result);
}

export async function listBusinessCardsHandler(req, res) {
  const { ownerId, companyId } = req.query ?? {};
  const access = req.networkingAccess ?? {};
  const permittedWorkspaceIds = Array.isArray(access.permittedWorkspaceIds)
    ? access.permittedWorkspaceIds
    : [];

  const requestedCompanyId = parseOptionalInteger(companyId, 'companyId');
  if (requestedCompanyId != null) {
    ensureWorkspaceAccess(req, requestedCompanyId);
  }

  const result = await listNetworkingBusinessCards(
    {
      ownerId: parseOptionalInteger(ownerId, 'ownerId'),
      companyId:
        requestedCompanyId ??
        (access.defaultWorkspaceId != null ? parseOptionalInteger(access.defaultWorkspaceId, 'workspaceId') : null),
    },
    { authorizedWorkspaceIds: permittedWorkspaceIds },
  );
  res.json(result);
}

export async function createBusinessCardHandler(req, res) {
  const payload = req.body ?? {};
  const ownerId = resolveActorId(req);
  const companyId = parseOptionalInteger(payload.companyId ?? req.user?.companyId, 'companyId');
  const access = req.networkingAccess ?? {};
  const permittedWorkspaceIds = Array.isArray(access.permittedWorkspaceIds)
    ? access.permittedWorkspaceIds
    : [];

  ensureWorkspaceAccess(req, companyId ?? permittedWorkspaceIds[0]);

  const result = await createNetworkingBusinessCard(
    sanitisePayload(payload, 'business card'),
    {
      ownerId,
      companyId:
        companyId ??
        (access.defaultWorkspaceId != null ? parseOptionalInteger(access.defaultWorkspaceId, 'workspaceId') : null),
      authorizedWorkspaceIds: permittedWorkspaceIds,
    },
  );
  res.status(201).json(result);
}

export async function updateBusinessCardHandler(req, res) {
  const cardId = parsePositiveInteger(req.params?.cardId, 'cardId');
  const payload = sanitisePayload(req.body ?? {}, 'business card');
  const access = req.networkingAccess ?? {};
  const permittedWorkspaceIds = Array.isArray(access.permittedWorkspaceIds)
    ? access.permittedWorkspaceIds
    : [];

  const result = await updateNetworkingBusinessCard(cardId, payload, {
    authorizedWorkspaceIds: permittedWorkspaceIds,
  });
  res.json(result);
}

export default {
  index,
  create,
  show,
  update,
  regenerateRotations: regenerateRotationsHandler,
  register,
  updateSignup: updateSignupHandler,
  runtime,
  listBusinessCards: listBusinessCardsHandler,
  createBusinessCard: createBusinessCardHandler,
  updateBusinessCard: updateBusinessCardHandler,
};
