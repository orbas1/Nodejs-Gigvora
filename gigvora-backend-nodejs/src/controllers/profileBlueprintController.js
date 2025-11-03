import { listProfileBlueprints, getProfileBlueprint } from '../services/profileBlueprintService.js';

export async function index(req, res) {
  const payload = await listProfileBlueprints();
  res.json(payload);
}

export async function show(req, res) {
  const { blueprintId } = req.params;
  const payload = await getProfileBlueprint(blueprintId);
  res.json(payload);
}

export default {
  index,
  show,
};
