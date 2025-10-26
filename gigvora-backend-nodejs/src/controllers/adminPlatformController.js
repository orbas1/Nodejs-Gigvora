import {
  listFeatureFlags,
  getFeatureFlag,
  updateFeatureFlag,
} from '../services/adminPlatformService.js';

export async function indexFeatureFlags(req, res) {
  const { status, search, limit, offset } = req.query ?? {};
  const result = await listFeatureFlags({ status, search, limit, offset });
  res.json(result);
}

export async function showFeatureFlag(req, res) {
  const flag = await getFeatureFlag(req.params.flagKey);
  res.json({ flag });
}

export async function patchFeatureFlag(req, res) {
  const actor = req.user
    ? { actorId: req.user.id ?? null, roles: req.user.roles ?? [] }
    : { actorId: null, roles: [] };
  const flag = await updateFeatureFlag(req.params.flagKey, req.body, actor);
  res.json({ flag });
}

export default {
  indexFeatureFlags,
  showFeatureFlag,
  patchFeatureFlag,
};
