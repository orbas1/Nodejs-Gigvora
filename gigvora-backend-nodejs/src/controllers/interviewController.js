import {
  getInterviewRoom,
  createInterviewRoom,
  upsertInterviewRoom,
  addInterviewParticipant,
  updateChecklistItem,
  getInterviewWorkflow,
  updateInterviewWorkflowLane,
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

export async function show(req, res) {
  const { roomId } = req.params;
  const room = await getInterviewRoom(roomId);
  res.json(room);
}

export async function store(req, res) {
  const payload = {
    ...req.body,
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

export default {
  index,
  show,
  store,
  update,
  addParticipant,
  updateChecklist,
  updateLane,
};
