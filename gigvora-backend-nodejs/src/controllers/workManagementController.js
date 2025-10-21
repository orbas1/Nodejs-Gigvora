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
import { resolveRequestUserId } from '../utils/requestContext.js';

function parseNumeric(value) {
  if (value == null || value === '') {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function resolveActorContext(req, providedActorId) {
  const resolvedId = parseNumeric(providedActorId) ?? resolveRequestUserId(req) ?? req.user?.id ?? null;
  const actorRoles = Array.isArray(req.user?.roles)
    ? req.user.roles.map((role) => `${role}`.trim().toLowerCase()).filter(Boolean)
    : [];
  return { actorId: resolvedId, actorRoles };
}

export async function overview(req, res) {
  const { projectId } = req.params;
  const data = await getProjectWorkManagement(parseNumeric(projectId));
  res.json(data);
}

export async function storeSprint(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const sprint = await createSprint(parseNumeric(projectId), payload, resolveActorContext(req, payload.actorId));
  res.status(201).json(sprint);
}

export async function storeTask(req, res) {
  const { projectId, sprintId } = req.params;
  const payload = req.body ?? {};
  const enrichedPayload = sprintId ? { ...payload, sprintId: parseNumeric(sprintId) } : payload;
  const task = await createSprintTask(
    parseNumeric(projectId),
    enrichedPayload,
    resolveActorContext(req, payload.actorId),
  );
  res.status(201).json(task);
}

export async function updateTask(req, res) {
  const { projectId, taskId } = req.params;
  const payload = req.body ?? {};
  const task = await updateSprintTask(
    parseNumeric(projectId),
    parseNumeric(taskId),
    payload,
    resolveActorContext(req, payload.actorId),
  );
  res.json(task);
}

export async function logTime(req, res) {
  const { projectId, taskId } = req.params;
  const payload = req.body ?? {};
  const result = await logTaskTime(
    parseNumeric(projectId),
    parseNumeric(taskId),
    payload,
    resolveActorContext(req, payload.actorId),
  );
  res.status(201).json(result);
}

export async function storeRisk(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const risk = await createRisk(parseNumeric(projectId), payload, resolveActorContext(req, payload.actorId));
  res.status(201).json(risk);
}

export async function modifyRisk(req, res) {
  const { projectId, riskId } = req.params;
  const payload = req.body ?? {};
  const risk = await updateRisk(
    parseNumeric(projectId),
    parseNumeric(riskId),
    payload,
    resolveActorContext(req, payload.actorId),
  );
  res.json(risk);
}

export async function storeChangeRequest(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const change = await createChangeRequest(
    parseNumeric(projectId),
    payload,
    resolveActorContext(req, payload.actorId),
  );
  res.status(201).json(change);
}

export async function approveChange(req, res) {
  const { projectId, changeRequestId } = req.params;
  const payload = req.body ?? {};
  const change = await approveChangeRequest(
    parseNumeric(projectId),
    parseNumeric(changeRequestId),
    payload,
    resolveActorContext(req, payload.actorId),
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
