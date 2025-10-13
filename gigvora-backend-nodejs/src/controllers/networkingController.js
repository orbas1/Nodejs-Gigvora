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

function parseNumber(value) {
  if (value == null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseBoolean(value) {
  if (value == null) {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalized = `${value}`.toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }
  return undefined;
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

  const requestedCompanyId = parseNumber(companyId);
  if (
    requestedCompanyId != null &&
    permittedWorkspaceIds.length &&
    !permittedWorkspaceIds.includes(requestedCompanyId)
  ) {
    return res.status(403).json({ message: 'You do not have access to this workspace.' });
  }

  const resolvedCompanyId =
    requestedCompanyId != null
      ? requestedCompanyId
      : access.defaultWorkspaceId ?? permittedWorkspaceIds[0] ?? null;

  const result = await listNetworkingSessions(
    {
      companyId: resolvedCompanyId,
      status: status ?? undefined,
      includeMetrics: parseBoolean(includeMetrics) ?? true,
      upcomingOnly: parseBoolean(upcomingOnly) ?? false,
      lookbackDays: parseNumber(lookbackDays) ?? 180,
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
  const actorId = parseNumber(payload.actorId ?? req.user?.id);
  const access = req.networkingAccess ?? {};
  const permittedWorkspaceIds = Array.isArray(access.permittedWorkspaceIds)
    ? access.permittedWorkspaceIds
    : [];

  const requestPayload = { ...payload };
  if (requestPayload.companyId == null && access.defaultWorkspaceId != null) {
    requestPayload.companyId = access.defaultWorkspaceId;
  }

  const result = await createNetworkingSession(requestPayload, {
    actorId,
    authorizedWorkspaceIds: permittedWorkspaceIds,
  });
  res.status(201).json(result);
}

export async function show(req, res) {
  const { sessionId } = req.params ?? {};
  const includeAssociations = parseBoolean(req.query?.includeAssociations);
  const access = req.networkingAccess ?? {};
  const permittedWorkspaceIds = Array.isArray(access.permittedWorkspaceIds)
    ? access.permittedWorkspaceIds
    : [];

  const result = await getNetworkingSession(parseNumber(sessionId), {
    includeAssociations: includeAssociations ?? true,
    authorizedWorkspaceIds: permittedWorkspaceIds,
  });
  res.json(result);
}

export async function update(req, res) {
  const { sessionId } = req.params ?? {};
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? req.user?.id);
  const access = req.networkingAccess ?? {};
  const permittedWorkspaceIds = Array.isArray(access.permittedWorkspaceIds)
    ? access.permittedWorkspaceIds
    : [];

  const result = await updateNetworkingSession(parseNumber(sessionId), payload, {
    actorId,
    authorizedWorkspaceIds: permittedWorkspaceIds,
  });
  res.json(result);
}

export async function regenerateRotationsHandler(req, res) {
  const { sessionId } = req.params ?? {};
  const payload = req.body ?? {};
  const access = req.networkingAccess ?? {};
  const permittedWorkspaceIds = Array.isArray(access.permittedWorkspaceIds)
    ? access.permittedWorkspaceIds
    : [];

  const result = await regenerateNetworkingRotations(parseNumber(sessionId), payload, {
    authorizedWorkspaceIds: permittedWorkspaceIds,
  });
  res.json(result);
}

export async function register(req, res) {
  const { sessionId } = req.params ?? {};
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? req.user?.id);
  const result = await registerForNetworkingSession(parseNumber(sessionId), payload, { actorId });
  res.status(201).json(result);
}

export async function updateSignupHandler(req, res) {
  const { sessionId, signupId } = req.params ?? {};
  const payload = req.body ?? {};
  const access = req.networkingAccess ?? {};
  const permittedWorkspaceIds = Array.isArray(access.permittedWorkspaceIds)
    ? access.permittedWorkspaceIds
    : [];

  const result = await updateNetworkingSignup(
    parseNumber(sessionId),
    parseNumber(signupId),
    payload,
    { authorizedWorkspaceIds: permittedWorkspaceIds },
  );
  res.json(result);
}

export async function runtime(req, res) {
  const { sessionId } = req.params ?? {};
  const access = req.networkingAccess ?? {};
  const permittedWorkspaceIds = Array.isArray(access.permittedWorkspaceIds)
    ? access.permittedWorkspaceIds
    : [];

  const result = await getNetworkingSessionRuntime(parseNumber(sessionId), {
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

  const requestedCompanyId = parseNumber(companyId);
  if (
    requestedCompanyId != null &&
    permittedWorkspaceIds.length &&
    !permittedWorkspaceIds.includes(requestedCompanyId)
  ) {
    return res.status(403).json({ message: 'You do not have access to this workspace.' });
  }

  const result = await listNetworkingBusinessCards(
    {
      ownerId: parseNumber(ownerId),
      companyId: requestedCompanyId ?? access.defaultWorkspaceId ?? null,
    },
    { authorizedWorkspaceIds: permittedWorkspaceIds },
  );
  res.json(result);
}

export async function createBusinessCardHandler(req, res) {
  const payload = req.body ?? {};
  const ownerId = parseNumber(payload.ownerId ?? req.user?.id);
  const companyId = parseNumber(payload.companyId ?? req.user?.companyId);
  const access = req.networkingAccess ?? {};
  const permittedWorkspaceIds = Array.isArray(access.permittedWorkspaceIds)
    ? access.permittedWorkspaceIds
    : [];

  const result = await createNetworkingBusinessCard(
    payload,
    {
      ownerId,
      companyId: companyId ?? access.defaultWorkspaceId ?? null,
      authorizedWorkspaceIds: permittedWorkspaceIds,
    },
  );
  res.status(201).json(result);
}

export async function updateBusinessCardHandler(req, res) {
  const { cardId } = req.params ?? {};
  const payload = req.body ?? {};
  const access = req.networkingAccess ?? {};
  const permittedWorkspaceIds = Array.isArray(access.permittedWorkspaceIds)
    ? access.permittedWorkspaceIds
    : [];

  const result = await updateNetworkingBusinessCard(parseNumber(cardId), payload, {
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
