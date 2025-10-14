import {
  getProjectWorkManagement,
  createSprint,
  createSprintTask,
  updateSprintTask,
  logTaskTime,
  createRisk,
  updateRisk,
  createChangeRequest,
  approveChangeRequest,
} from '../services/workManagementService.js';

function parseNumeric(value) {
  if (value == null || value === '') {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export async function overview(req, res) {
  const { projectId } = req.params;
  const data = await getProjectWorkManagement(parseNumeric(projectId));
  res.json(data);
}

export async function storeSprint(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumeric(payload.actorId);
  const sprint = await createSprint(parseNumeric(projectId), payload, { actorId });
  res.status(201).json(sprint);
}

export async function storeTask(req, res) {
  const { projectId, sprintId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumeric(payload.actorId);
  const enrichedPayload = sprintId ? { ...payload, sprintId: parseNumeric(sprintId) } : payload;
  const task = await createSprintTask(parseNumeric(projectId), enrichedPayload, { actorId });
  res.status(201).json(task);
}

export async function updateTask(req, res) {
  const { projectId, taskId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumeric(payload.actorId);
  const task = await updateSprintTask(parseNumeric(projectId), parseNumeric(taskId), payload, { actorId });
  res.json(task);
}

export async function logTime(req, res) {
  const { projectId, taskId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumeric(payload.actorId);
  const result = await logTaskTime(parseNumeric(projectId), parseNumeric(taskId), payload, { actorId });
  res.status(201).json(result);
}

export async function storeRisk(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumeric(payload.actorId);
  const risk = await createRisk(parseNumeric(projectId), payload, { actorId });
  res.status(201).json(risk);
}

export async function modifyRisk(req, res) {
  const { projectId, riskId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumeric(payload.actorId);
  const risk = await updateRisk(parseNumeric(projectId), parseNumeric(riskId), payload, { actorId });
  res.json(risk);
}

export async function storeChangeRequest(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumeric(payload.actorId);
  const change = await createChangeRequest(parseNumeric(projectId), payload, { actorId });
  res.status(201).json(change);
}

export async function approveChange(req, res) {
  const { projectId, changeRequestId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumeric(payload.actorId);
  const change = await approveChangeRequest(
    parseNumeric(projectId),
    parseNumeric(changeRequestId),
    payload,
    { actorId },
  );
  res.json(change);
}

export default {
  overview,
  storeSprint,
  storeTask,
  updateTask,
  logTime,
  storeRisk,
  modifyRisk,
  storeChangeRequest,
  approveChange,
};
