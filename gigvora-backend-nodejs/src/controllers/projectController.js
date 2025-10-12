import {
  createProject,
  updateProjectAutoAssign,
  getProjectOverview,
  listProjectEvents,
  updateProjectDetails,
} from '../services/projectService.js';
import { resolveRequestUserId } from '../utils/requestContext.js';

function parseNumber(value, fallback = undefined) {
  if (value == null) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function store(req, res) {
  const payload = req.body ?? {};
  const actorId = resolveRequestUserId(req);
  const result = await createProject(payload, { actorId });
  res.status(201).json(result);
}

export async function toggleAutoAssign(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const actorId = resolveRequestUserId(req);
  const result = await updateProjectAutoAssign(parseNumber(projectId, projectId), payload, { actorId });
  res.json(result);
}

export async function update(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const actorId = resolveRequestUserId(req);
  const result = await updateProjectDetails(parseNumber(projectId, projectId), payload, { actorId });
  res.json(result);
}

export async function show(req, res) {
  const { projectId } = req.params;
  const overview = await getProjectOverview(parseNumber(projectId, projectId));
  res.json(overview);
}

export async function events(req, res) {
  const { projectId } = req.params;
  const { limit } = req.query ?? {};
  const events = await listProjectEvents(parseNumber(projectId, projectId), { limit: parseNumber(limit) });
  res.json({ events });
}

export default {
  store,
  toggleAutoAssign,
  update,
  show,
  events,
};
