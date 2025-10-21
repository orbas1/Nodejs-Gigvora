import {
  getInterviewRoom,
  createInterviewRoom,
  upsertInterviewRoom,
  addInterviewParticipant,
  updateChecklistItem,
  getInterviewWorkflow,
  updateInterviewWorkflowLane,
  listInterviewRooms,
  deleteInterviewRoom,
  updateInterviewParticipant,
  removeInterviewParticipant,
  createChecklistItem,
  deleteChecklistItem,
  createInterviewWorkflowLane,
  deleteInterviewWorkflowLane,
  createInterviewCard,
  updateInterviewCard,
  deleteInterviewCard,
  listPanelTemplates,
  createPanelTemplate,
  updatePanelTemplate,
  deletePanelTemplate,
  listCandidatePrepPortals,
  createCandidatePrepPortal,
  updateCandidatePrepPortal,
  deleteCandidatePrepPortal,
  listInterviewWorkspaces,
  getWorkspaceOverview,
} from '../services/interviewOrchestrationService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions, resolveRequestUserId } from '../utils/requestContext.js';

function parseBoolean(value, fallback) {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalised)) {
      return true;
    }
    if (['false', '0', 'no'].includes(normalised)) {
      return false;
    }
  }
  throw new ValidationError('Boolean parameters must be true or false.');
}

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

function ensureObjectPayload(body, label) {
  if (body == null) {
    return {};
  }
  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError(`${label} must be an object.`);
  }
  return JSON.parse(JSON.stringify(body));
}

function resolveMemberships(req) {
  const memberships = new Set();
  const candidateCollections = [req.user?.workspaceIds, req.user?.workspaces, req.user?.companies];
  for (const collection of candidateCollections) {
    if (!collection) continue;
    const array = Array.isArray(collection) ? collection : [collection];
    array
      .map((value) => Number.parseInt(value?.id ?? value, 10))
      .filter((value) => Number.isFinite(value) && value > 0)
      .forEach((value) => memberships.add(value));
  }
  return Array.from(memberships);
}

function ensureInterviewAccess(req) {
  const actorId = resolveRequestUserId(req);
  if (!actorId) {
    throw new AuthorizationError('Authentication required.');
  }

  const permissions = new Set(resolveRequestPermissions(req).map((permission) => permission.toLowerCase()));
  const roles = Array.isArray(req.user?.roles) ? req.user.roles : [req.user?.role].filter(Boolean);
  roles.map((role) => `${role}`.toLowerCase()).forEach((role) => permissions.add(role));

  const allowed = ['admin', 'interview.manage.any', 'talent.manage.any', 'hiring.manager', 'recruiter'];
  const hasGlobalAccess = allowed.some((permission) => permissions.has(permission));

  return { actorId, permissions, hasGlobalAccess };
}

function ensureWorkspaceAccess(req, workspaceId) {
  const { actorId, permissions, hasGlobalAccess } = ensureInterviewAccess(req);
  if (!workspaceId) {
    if (hasGlobalAccess) {
      return { actorId, permissions, hasGlobalAccess, memberships: resolveMemberships(req) };
    }
    throw new AuthorizationError('workspaceId is required for interview workspace access.');
  }

  const memberships = resolveMemberships(req);
  if (memberships.length && !memberships.includes(workspaceId) && !hasGlobalAccess) {
    throw new AuthorizationError('You do not have access to this interview workspace.');
  }

  if (!hasGlobalAccess && memberships.length === 0) {
    throw new AuthorizationError('You must belong to the workspace to perform this action.');
  }

  return { actorId, permissions, hasGlobalAccess, memberships };
}

export async function index(req, res) {
  const workspaceId = parsePositiveInteger(req.query?.workspaceId, 'workspaceId');
  ensureWorkspaceAccess(req, workspaceId);
  const workflow = await getInterviewWorkflow(workspaceId);
  res.json(workflow);
}

export async function listWorkspaces(req, res) {
  ensureInterviewAccess(req);
  const workspaces = await listInterviewWorkspaces();
  res.json({ workspaces });
}

export async function workspace(req, res) {
  const workspaceId = parsePositiveInteger(req.params?.workspaceId, 'workspaceId');
  ensureWorkspaceAccess(req, workspaceId);
  const overview = await getWorkspaceOverview(workspaceId);
  res.json(overview);
}

export async function workspaceRooms(req, res) {
  const workspaceId = parsePositiveInteger(req.params?.workspaceId, 'workspaceId');
  ensureWorkspaceAccess(req, workspaceId);
  const rooms = await listInterviewRooms(workspaceId);
  res.json({ rooms });
}

export async function show(req, res) {
  const roomId = parsePositiveInteger(req.params?.roomId, 'roomId');
  ensureInterviewAccess(req);
  const room = await getInterviewRoom(roomId);
  res.json(room);
}

export async function store(req, res) {
  const workspaceId = parsePositiveInteger(
    req.params?.workspaceId ?? req.body?.workspaceId,
    'workspaceId',
  );
  ensureWorkspaceAccess(req, workspaceId);
  const body = ensureObjectPayload(req.body, 'interview room');
  const payload = {
    ...body,
    workspaceId,
    name: body.name != null ? String(body.name).trim().slice(0, 150) : body.name,
    hdEnabled: parseBoolean(body.hdEnabled, true),
    recordingEnabled: parseBoolean(body.recordingEnabled, true),
  };
  const room = await createInterviewRoom(payload);
  res.status(201).json(room);
}

export async function update(req, res) {
  const roomId = parsePositiveInteger(req.params?.roomId, 'roomId');
  ensureInterviewAccess(req);
  const body = ensureObjectPayload(req.body, 'interview room');
  const payload = {
    ...body,
    name: body.name != null ? String(body.name).trim().slice(0, 150) : body.name,
  };
  if (body.hdEnabled !== undefined) {
    payload.hdEnabled = parseBoolean(body.hdEnabled, undefined);
  }
  if (body.recordingEnabled !== undefined) {
    payload.recordingEnabled = parseBoolean(body.recordingEnabled, undefined);
  }
  const room = await upsertInterviewRoom(roomId, payload);
  res.json(room);
}

export async function addParticipant(req, res) {
  const roomId = parsePositiveInteger(req.params?.roomId, 'roomId');
  ensureInterviewAccess(req);
  const participant = await addInterviewParticipant(roomId, ensureObjectPayload(req.body, 'participant'));
  res.status(201).json(participant);
}

export async function updateChecklist(req, res) {
  const roomId = parsePositiveInteger(req.params?.roomId, 'roomId');
  const itemId = parsePositiveInteger(req.params?.itemId, 'itemId');
  ensureInterviewAccess(req);
  const item = await updateChecklistItem(roomId, itemId, ensureObjectPayload(req.body, 'checklist item'));
  res.json(item);
}

export async function updateLane(req, res) {
  const workspaceId = parsePositiveInteger(req.params?.workspaceId, 'workspaceId');
  const laneId = parsePositiveInteger(req.params?.laneId, 'laneId');
  ensureWorkspaceAccess(req, workspaceId);
  const lane = await updateInterviewWorkflowLane(
    workspaceId,
    laneId,
    ensureObjectPayload(req.body, 'workflow lane'),
  );
  res.json(lane);
}

export async function destroyRoom(req, res) {
  const roomId = parsePositiveInteger(req.params?.roomId, 'roomId');
  ensureInterviewAccess(req);
  await deleteInterviewRoom(roomId);
  res.status(204).send();
}

export async function updateParticipant(req, res) {
  const roomId = parsePositiveInteger(req.params?.roomId, 'roomId');
  const participantId = parsePositiveInteger(req.params?.participantId, 'participantId');
  ensureInterviewAccess(req);
  const participant = await updateInterviewParticipant(
    roomId,
    participantId,
    ensureObjectPayload(req.body, 'participant update'),
  );
  res.json(participant);
}

export async function removeParticipant(req, res) {
  const roomId = parsePositiveInteger(req.params?.roomId, 'roomId');
  const participantId = parsePositiveInteger(req.params?.participantId, 'participantId');
  ensureInterviewAccess(req);
  await removeInterviewParticipant(roomId, participantId);
  res.status(204).send();
}

export async function createChecklist(req, res) {
  const roomId = parsePositiveInteger(req.params?.roomId, 'roomId');
  ensureInterviewAccess(req);
  const item = await createChecklistItem(roomId, ensureObjectPayload(req.body, 'checklist item'));
  res.status(201).json(item);
}

export async function removeChecklist(req, res) {
  const roomId = parsePositiveInteger(req.params?.roomId, 'roomId');
  const itemId = parsePositiveInteger(req.params?.itemId, 'itemId');
  ensureInterviewAccess(req);
  await deleteChecklistItem(roomId, itemId);
  res.status(204).send();
}

export async function createLane(req, res) {
  const workspaceId = parsePositiveInteger(req.params?.workspaceId, 'workspaceId');
  ensureWorkspaceAccess(req, workspaceId);
  const lane = await createInterviewWorkflowLane(
    workspaceId,
    ensureObjectPayload(req.body, 'workflow lane'),
  );
  res.status(201).json(lane);
}

export async function destroyLane(req, res) {
  const workspaceId = parsePositiveInteger(req.params?.workspaceId, 'workspaceId');
  const laneId = parsePositiveInteger(req.params?.laneId, 'laneId');
  ensureWorkspaceAccess(req, workspaceId);
  await deleteInterviewWorkflowLane(workspaceId, laneId);
  res.status(204).send();
}

export async function createCard(req, res) {
  const workspaceId = parsePositiveInteger(req.params?.workspaceId, 'workspaceId');
  const laneId = parsePositiveInteger(req.params?.laneId, 'laneId');
  ensureWorkspaceAccess(req, workspaceId);
  const card = await createInterviewCard(
    workspaceId,
    laneId,
    ensureObjectPayload(req.body, 'interview card'),
  );
  res.status(201).json(card);
}

export async function updateCard(req, res) {
  const workspaceId = parsePositiveInteger(req.params?.workspaceId, 'workspaceId');
  const laneId = parsePositiveInteger(req.params?.laneId, 'laneId');
  const cardId = parsePositiveInteger(req.params?.cardId, 'cardId');
  ensureWorkspaceAccess(req, workspaceId);
  const card = await updateInterviewCard(
    workspaceId,
    laneId,
    cardId,
    ensureObjectPayload(req.body, 'interview card'),
  );
  res.json(card);
}

export async function removeCard(req, res) {
  const workspaceId = parsePositiveInteger(req.params?.workspaceId, 'workspaceId');
  const laneId = parsePositiveInteger(req.params?.laneId, 'laneId');
  const cardId = parsePositiveInteger(req.params?.cardId, 'cardId');
  ensureWorkspaceAccess(req, workspaceId);
  await deleteInterviewCard(workspaceId, laneId, cardId);
  res.status(204).send();
}

export async function listTemplates(req, res) {
  const workspaceId = parsePositiveInteger(req.params?.workspaceId, 'workspaceId');
  ensureWorkspaceAccess(req, workspaceId);
  const templates = await listPanelTemplates(workspaceId);
  res.json({ templates });
}

export async function createTemplate(req, res) {
  const workspaceId = parsePositiveInteger(req.params?.workspaceId, 'workspaceId');
  ensureWorkspaceAccess(req, workspaceId);
  const template = await createPanelTemplate(
    workspaceId,
    ensureObjectPayload(req.body, 'panel template'),
  );
  res.status(201).json(template);
}

export async function updateTemplate(req, res) {
  const templateId = parsePositiveInteger(req.params?.templateId, 'templateId');
  ensureInterviewAccess(req);
  const template = await updatePanelTemplate(templateId, ensureObjectPayload(req.body, 'panel template update'));
  res.json(template);
}

export async function removeTemplate(req, res) {
  const templateId = parsePositiveInteger(req.params?.templateId, 'templateId');
  ensureInterviewAccess(req);
  await deletePanelTemplate(templateId);
  res.status(204).send();
}

export async function listPrep(req, res) {
  const workspaceId = parsePositiveInteger(req.params?.workspaceId, 'workspaceId');
  ensureWorkspaceAccess(req, workspaceId);
  const portals = await listCandidatePrepPortals(workspaceId);
  res.json({ prepPortals: portals });
}

export async function createPrep(req, res) {
  const workspaceId = parsePositiveInteger(req.params?.workspaceId, 'workspaceId');
  ensureWorkspaceAccess(req, workspaceId);
  const portal = await createCandidatePrepPortal(
    workspaceId,
    ensureObjectPayload(req.body, 'prep portal'),
  );
  res.status(201).json(portal);
}

export async function updatePrep(req, res) {
  const portalId = parsePositiveInteger(req.params?.portalId, 'portalId');
  ensureInterviewAccess(req);
  const portal = await updateCandidatePrepPortal(portalId, ensureObjectPayload(req.body, 'prep portal update'));
  res.json(portal);
}

export async function removePrep(req, res) {
  const portalId = parsePositiveInteger(req.params?.portalId, 'portalId');
  ensureInterviewAccess(req);
  await deleteCandidatePrepPortal(portalId);
  res.status(204).send();
}

export default {
  index,
  listWorkspaces,
  workspace,
  workspaceRooms,
  show,
  store,
  update,
  addParticipant,
  updateChecklist,
  updateLane,
  destroyRoom,
  updateParticipant,
  removeParticipant,
  createChecklist,
  removeChecklist,
  createLane,
  destroyLane,
  createCard,
  updateCard,
  removeCard,
  listTemplates,
  createTemplate,
  updateTemplate,
  removeTemplate,
  listPrep,
  createPrep,
  updatePrep,
  removePrep,
};
