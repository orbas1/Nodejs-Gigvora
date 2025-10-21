import {
  getCompanyAdsWorkspace,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  createCreative,
  updateCreative,
  deleteCreative,
  createPlacement,
  updatePlacement,
  deletePlacement,
  togglePlacementStatus,
} from '../services/companyAdsService.js';

function resolveOwnerId(req) {
  if (req.user?.id != null) {
    return Number(req.user.id);
  }
  if (req.user?.userId != null) {
    return Number(req.user.userId);
  }
  if (req.query?.ownerId != null) {
    return Number(req.query.ownerId);
  }
  throw new Error('Authenticated user required.');
}

export async function workspace(req, res) {
  const ownerId = resolveOwnerId(req);
  const { surfaces, context: contextRaw, bypassCache } = req.query ?? {};
  const surfaceList = typeof surfaces === 'string'
    ? surfaces
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    : Array.isArray(surfaces)
    ? surfaces
    : undefined;
  let context = undefined;
  if (typeof contextRaw === 'string' && contextRaw.trim().length) {
    try {
      context = JSON.parse(contextRaw);
    } catch (error) {
      context = { raw: contextRaw };
    }
  } else if (contextRaw && typeof contextRaw === 'object') {
    context = contextRaw;
  }
  const result = await getCompanyAdsWorkspace({
    ownerId,
    surfaces: surfaceList,
    context,
    bypassCache: bypassCache === 'true',
  });
  res.json(result);
}

export async function createCampaignHandler(req, res) {
  const ownerId = resolveOwnerId(req);
  const campaign = await createCampaign({ ownerId, payload: req.body ?? {} });
  res.status(201).json({ campaign });
}

export async function updateCampaignHandler(req, res) {
  const ownerId = resolveOwnerId(req);
  const { campaignId } = req.params;
  const campaign = await updateCampaign({ ownerId, campaignId, payload: req.body ?? {} });
  res.json({ campaign });
}

export async function deleteCampaignHandler(req, res) {
  const ownerId = resolveOwnerId(req);
  const { campaignId } = req.params;
  await deleteCampaign({ ownerId, campaignId });
  res.status(204).end();
}

export async function createCreativeHandler(req, res) {
  const ownerId = resolveOwnerId(req);
  const { campaignId } = req.params;
  const creative = await createCreative({ ownerId, campaignId, payload: req.body ?? {} });
  res.status(201).json({ creative });
}

export async function updateCreativeHandler(req, res) {
  const ownerId = resolveOwnerId(req);
  const { creativeId } = req.params;
  const creative = await updateCreative({ ownerId, creativeId, payload: req.body ?? {} });
  res.json({ creative });
}

export async function deleteCreativeHandler(req, res) {
  const ownerId = resolveOwnerId(req);
  const { creativeId } = req.params;
  await deleteCreative({ ownerId, creativeId });
  res.status(204).end();
}

export async function createPlacementHandler(req, res) {
  const ownerId = resolveOwnerId(req);
  const { creativeId } = req.params;
  const placement = await createPlacement({ ownerId, creativeId, payload: req.body ?? {} });
  res.status(201).json({ placement });
}

export async function updatePlacementHandler(req, res) {
  const ownerId = resolveOwnerId(req);
  const { placementId } = req.params;
  const placement = await updatePlacement({ ownerId, placementId, payload: req.body ?? {} });
  res.json({ placement });
}

export async function deletePlacementHandler(req, res) {
  const ownerId = resolveOwnerId(req);
  const { placementId } = req.params;
  await deletePlacement({ ownerId, placementId });
  res.status(204).end();
}

export async function togglePlacementHandler(req, res) {
  const ownerId = resolveOwnerId(req);
  const { placementId } = req.params;
  const placement = await togglePlacementStatus({ ownerId, placementId });
  res.json({ placement });
}

export default {
  workspace,
  createCampaignHandler,
  updateCampaignHandler,
  deleteCampaignHandler,
  createCreativeHandler,
  updateCreativeHandler,
  deleteCreativeHandler,
  createPlacementHandler,
  updatePlacementHandler,
  deletePlacementHandler,
  togglePlacementHandler,
};
