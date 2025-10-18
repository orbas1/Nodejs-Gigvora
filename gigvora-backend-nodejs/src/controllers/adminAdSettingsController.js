import {
  getAdsSettingsSnapshot,
  upsertSurfaceSetting,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  createCreative,
  updateCreative,
  deleteCreative,
  createPlacement,
  updatePlacement,
  deletePlacement,
} from '../services/adminAdSettingsService.js';

export async function snapshot(req, res) {
  const result = await getAdsSettingsSnapshot();
  res.json(result);
}

export async function saveSurface(req, res) {
  const { surface } = req.params;
  const actorId = req.user?.id ?? null;
  const result = await upsertSurfaceSetting(surface, req.body ?? {}, { actorId });
  res.json(result);
}

export async function storeCampaign(req, res) {
  const actorId = req.user?.id ?? null;
  const result = await createCampaign(req.body ?? {}, { actorId });
  res.status(201).json(result);
}

export async function updateCampaignRecord(req, res) {
  const { campaignId } = req.params;
  const actorId = req.user?.id ?? null;
  const result = await updateCampaign(campaignId, req.body ?? {}, { actorId });
  res.json(result);
}

export async function destroyCampaign(req, res) {
  const { campaignId } = req.params;
  await deleteCampaign(campaignId);
  res.status(204).send();
}

export async function storeCreative(req, res) {
  const actorId = req.user?.id ?? null;
  const result = await createCreative(req.body ?? {}, { actorId });
  res.status(201).json(result);
}

export async function updateCreativeRecord(req, res) {
  const { creativeId } = req.params;
  const actorId = req.user?.id ?? null;
  const result = await updateCreative(creativeId, req.body ?? {}, { actorId });
  res.json(result);
}

export async function destroyCreative(req, res) {
  const { creativeId } = req.params;
  await deleteCreative(creativeId);
  res.status(204).send();
}

export async function storePlacement(req, res) {
  const actorId = req.user?.id ?? null;
  const result = await createPlacement(req.body ?? {}, { actorId });
  res.status(201).json(result);
}

export async function updatePlacementRecord(req, res) {
  const { placementId } = req.params;
  const actorId = req.user?.id ?? null;
  const result = await updatePlacement(placementId, req.body ?? {}, { actorId });
  res.json(result);
}

export async function destroyPlacement(req, res) {
  const { placementId } = req.params;
  await deletePlacement(placementId);
  res.status(204).send();
}

export default {
  snapshot,
  saveSurface,
  storeCampaign,
  updateCampaignRecord,
  destroyCampaign,
  storeCreative,
  updateCreativeRecord,
  destroyCreative,
  storePlacement,
  updatePlacementRecord,
  destroyPlacement,
};
