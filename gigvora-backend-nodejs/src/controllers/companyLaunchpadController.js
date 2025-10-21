import {
  getLaunchpadJobDashboard,
  linkJobToLaunchpad,
  updateLaunchpadJobLink,
  removeLaunchpadJobLink,
  createLaunchpadPlacement,
  updateLaunchpadPlacement,
  removeLaunchpadPlacement,
} from '../services/companyLaunchpadService.js';
import { ValidationError } from '../utils/errors.js';

function parseOptionalInteger(value) {
  if (value == null || value === '') {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function ensurePositiveInteger(value, fieldName) {
  const parsed = parseOptionalInteger(value);
  if (!parsed || parsed <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return parsed;
}

function resolveActorId(req) {
  const candidate =
    req.user?.id ?? req.auth?.userId ?? req.body?.createdById ?? req.body?.actorId ?? req.query?.actorId;
  const actorId = parseOptionalInteger(candidate);
  if (!actorId) {
    throw new ValidationError('Authenticated user context is required for this action.');
  }
  return actorId;
}

export async function dashboard(req, res) {
  const { workspaceId, workspaceSlug, launchpadId, lookbackDays } = req.query ?? {};

  const result = await getLaunchpadJobDashboard({
    workspaceId: parseOptionalInteger(workspaceId),
    workspaceSlug: workspaceSlug || undefined,
    launchpadId: parseOptionalInteger(launchpadId),
    lookbackDays: parseOptionalInteger(lookbackDays) ?? 90,
  });

  res.json(result);
}

export async function createLink(req, res) {
  const payload = req.body ?? {};
  const actorId = resolveActorId(req);
  const link = await linkJobToLaunchpad({ ...payload, createdById: actorId });
  res.status(201).json(link);
}

export async function updateLink(req, res) {
  const { linkId } = req.params ?? {};
  const payload = req.body ?? {};
  const link = await updateLaunchpadJobLink(ensurePositiveInteger(linkId, 'linkId'), payload);
  res.json(link);
}

export async function removeLink(req, res) {
  const { linkId } = req.params ?? {};
  await removeLaunchpadJobLink(ensurePositiveInteger(linkId, 'linkId'));
  res.status(204).send();
}

export async function createPlacementEntry(req, res) {
  const { linkId } = req.params ?? {};
  const payload = req.body ?? {};
  const placement = await createLaunchpadPlacement(ensurePositiveInteger(linkId, 'linkId'), payload);
  res.status(201).json(placement);
}

export async function updatePlacementEntry(req, res) {
  const { placementId } = req.params ?? {};
  const payload = req.body ?? {};
  const placement = await updateLaunchpadPlacement(ensurePositiveInteger(placementId, 'placementId'), payload);
  res.json(placement);
}

export async function removePlacementEntry(req, res) {
  const { placementId } = req.params ?? {};
  await removeLaunchpadPlacement(ensurePositiveInteger(placementId, 'placementId'));
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

