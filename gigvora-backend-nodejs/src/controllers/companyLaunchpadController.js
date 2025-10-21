import {
  getLaunchpadJobDashboard,
  linkJobToLaunchpad,
  updateLaunchpadJobLink,
  removeLaunchpadJobLink,
  createLaunchpadPlacement,
  updateLaunchpadPlacement,
  removeLaunchpadPlacement,
} from '../services/companyLaunchpadService.js';

function parseInteger(value, fallback = undefined) {
  if (value == null || value === '') {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function dashboard(req, res) {
  const { workspaceId, workspaceSlug, launchpadId, lookbackDays } = req.query ?? {};

  const result = await getLaunchpadJobDashboard({
    workspaceId: parseInteger(workspaceId, workspaceSlug ? undefined : workspaceId),
    launchpadId: parseInteger(launchpadId),
    lookbackDays: parseInteger(lookbackDays, 90),
  });

  res.json(result);
}

export async function createLink(req, res) {
  const payload = req.body ?? {};
  const actorId = req.user?.id ?? null;
  const link = await linkJobToLaunchpad({ ...payload, createdById: actorId });
  res.status(201).json(link);
}

export async function updateLink(req, res) {
  const { linkId } = req.params ?? {};
  const payload = req.body ?? {};
  const link = await updateLaunchpadJobLink(linkId, payload);
  res.json(link);
}

export async function removeLink(req, res) {
  const { linkId } = req.params ?? {};
  await removeLaunchpadJobLink(linkId);
  res.status(204).send();
}

export async function createPlacementEntry(req, res) {
  const { linkId } = req.params ?? {};
  const payload = req.body ?? {};
  const placement = await createLaunchpadPlacement(linkId, payload);
  res.status(201).json(placement);
}

export async function updatePlacementEntry(req, res) {
  const { placementId } = req.params ?? {};
  const payload = req.body ?? {};
  const placement = await updateLaunchpadPlacement(placementId, payload);
  res.json(placement);
}

export async function removePlacementEntry(req, res) {
  const { placementId } = req.params ?? {};
  await removeLaunchpadPlacement(placementId);
  res.status(204).send();
}

export default {
  dashboard,
  createLink,
  updateLink,
  removeLink,
  createPlacementEntry,
  updatePlacementEntry,
  removePlacementEntry,
};

