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
  return fallback;
}

export async function index(req, res) {
  const { workspaceId } = req.query ?? {};
  if (!workspaceId) {
    return res.status(400).json({ message: 'workspaceId query parameter is required.' });
  }
  const workflow = await getInterviewWorkflow(workspaceId);
  res.json(workflow);
}

export async function listWorkspaces(req, res) {
  const workspaces = await listInterviewWorkspaces();
  res.json({ workspaces });
}

export async function workspace(req, res) {
  const { workspaceId } = req.params;
  if (!workspaceId) {
    return res.status(400).json({ message: 'workspaceId is required.' });
  }
  const overview = await getWorkspaceOverview(workspaceId);
  res.json(overview);
}

export async function workspaceRooms(req, res) {
  const { workspaceId } = req.params;
  if (!workspaceId) {
    return res.status(400).json({ message: 'workspaceId is required.' });
  }
  const rooms = await listInterviewRooms(workspaceId);
  res.json({ rooms });
}

export async function show(req, res) {
  const { roomId } = req.params;
  const room = await getInterviewRoom(roomId);
  res.json(room);
}

export async function store(req, res) {
  const payload = {
    ...req.body,
    workspaceId: req.params?.workspaceId ?? req.body?.workspaceId,
    hdEnabled: parseBoolean(req.body?.hdEnabled, true),
    recordingEnabled: parseBoolean(req.body?.recordingEnabled, true),
  };
  const room = await createInterviewRoom(payload);
  res.status(201).json(room);
}

export async function update(req, res) {
  const { roomId } = req.params;
  const payload = {
    ...req.body,
    hdEnabled: parseBoolean(req.body?.hdEnabled, undefined),
    recordingEnabled: parseBoolean(req.body?.recordingEnabled, undefined),
  };
  const room = await upsertInterviewRoom(roomId, payload);
  res.json(room);
}

export async function addParticipant(req, res) {
  const { roomId } = req.params;
  const participant = await addInterviewParticipant(roomId, req.body ?? {});
  res.status(201).json(participant);
}

export async function updateChecklist(req, res) {
  const { roomId, itemId } = req.params;
  const item = await updateChecklistItem(roomId, itemId, req.body ?? {});
  res.json(item);
}

export async function updateLane(req, res) {
  const { workspaceId, laneId } = req.params;
  const lane = await updateInterviewWorkflowLane(workspaceId, laneId, req.body ?? {});
  res.json(lane);
}

export async function destroyRoom(req, res) {
  const { roomId } = req.params;
  await deleteInterviewRoom(roomId);
  res.status(204).send();
}

export async function updateParticipant(req, res) {
  const { roomId, participantId } = req.params;
  const participant = await updateInterviewParticipant(roomId, participantId, req.body ?? {});
  res.json(participant);
}

export async function removeParticipant(req, res) {
  const { roomId, participantId } = req.params;
  await removeInterviewParticipant(roomId, participantId);
  res.status(204).send();
}

export async function createChecklist(req, res) {
  const { roomId } = req.params;
  const item = await createChecklistItem(roomId, req.body ?? {});
  res.status(201).json(item);
}

export async function removeChecklist(req, res) {
  const { roomId, itemId } = req.params;
  await deleteChecklistItem(roomId, itemId);
  res.status(204).send();
}

export async function createLane(req, res) {
  const { workspaceId } = req.params;
  const lane = await createInterviewWorkflowLane(workspaceId, req.body ?? {});
  res.status(201).json(lane);
}

export async function destroyLane(req, res) {
  const { workspaceId, laneId } = req.params;
  await deleteInterviewWorkflowLane(workspaceId, laneId);
  res.status(204).send();
}

export async function createCard(req, res) {
  const { workspaceId, laneId } = req.params;
  const card = await createInterviewCard(workspaceId, laneId, req.body ?? {});
  res.status(201).json(card);
}

export async function updateCard(req, res) {
  const { workspaceId, laneId, cardId } = req.params;
  const card = await updateInterviewCard(workspaceId, laneId, cardId, req.body ?? {});
  res.json(card);
}

export async function removeCard(req, res) {
  const { workspaceId, laneId, cardId } = req.params;
  await deleteInterviewCard(workspaceId, laneId, cardId);
  res.status(204).send();
}

export async function listTemplates(req, res) {
  const { workspaceId } = req.params;
  const templates = await listPanelTemplates(workspaceId);
  res.json({ templates });
}

export async function createTemplate(req, res) {
  const { workspaceId } = req.params;
  const template = await createPanelTemplate(workspaceId, req.body ?? {});
  res.status(201).json(template);
}

export async function updateTemplate(req, res) {
  const { templateId } = req.params;
  const template = await updatePanelTemplate(templateId, req.body ?? {});
  res.json(template);
}

export async function removeTemplate(req, res) {
  const { templateId } = req.params;
  await deletePanelTemplate(templateId);
  res.status(204).send();
}

export async function listPrep(req, res) {
  const { workspaceId } = req.params;
  const portals = await listCandidatePrepPortals(workspaceId);
  res.json({ prepPortals: portals });
}

export async function createPrep(req, res) {
  const { workspaceId } = req.params;
  const portal = await createCandidatePrepPortal(workspaceId, req.body ?? {});
  res.status(201).json(portal);
}

export async function updatePrep(req, res) {
  const { portalId } = req.params;
  const portal = await updateCandidatePrepPortal(portalId, req.body ?? {});
  res.json(portal);
}

export async function removePrep(req, res) {
  const { portalId } = req.params;
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
