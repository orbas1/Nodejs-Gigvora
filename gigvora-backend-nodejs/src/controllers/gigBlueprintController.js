import { getGigBlueprint, listGigBlueprints } from '../services/gigBlueprintService.js';

export async function index(req, res) {
  const { blueprints, meta } = await listGigBlueprints();
  res.json({ blueprints, meta });
}

export async function show(req, res) {
  const { blueprintId } = req.params;
  const { blueprint, meta } = await getGigBlueprint(blueprintId);
  res.json({ blueprint, meta });
}

export default {
  index,
  show,
};
