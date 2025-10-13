import {
  listProjectBlueprints,
  getProjectBlueprint,
  upsertProjectBlueprint,
} from '../services/projectBlueprintService.js';

function parseActorId(value) {
  if (value == null) {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export async function index(req, res) {
  const blueprints = await listProjectBlueprints();
  res.json({ blueprints });
}

export async function show(req, res) {
  const { projectId } = req.params;
  const blueprint = await getProjectBlueprint(projectId);
  res.json(blueprint);
}

export async function upsert(req, res) {
  const { projectId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseActorId(payload.actorId);
  const sanitizedPayload = { ...payload };
  delete sanitizedPayload.actorId;

  const blueprint = await upsertProjectBlueprint(projectId, sanitizedPayload, { actorId });
  res.json(blueprint);
}

export default {
  index,
  show,
  upsert,
};
