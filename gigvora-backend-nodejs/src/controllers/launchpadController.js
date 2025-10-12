import {
  applyToLaunchpad,
  updateLaunchpadApplicationStatus,
  submitEmployerRequest,
  recordLaunchpadPlacement,
  linkLaunchpadOpportunity,
  getLaunchpadDashboard,
} from '../services/launchpadService.js';

function parseNumber(value, fallback = undefined) {
  if (value == null || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function createApplication(req, res) {
  const payload = req.body ?? {};
  const result = await applyToLaunchpad(payload);
  res.status(201).json(result);
}

export async function updateApplication(req, res) {
  const { applicationId } = req.params ?? {};
  const payload = req.body ?? {};
  const result = await updateLaunchpadApplicationStatus(parseNumber(applicationId, applicationId), payload);
  res.json(result);
}

export async function createEmployerRequest(req, res) {
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const result = await submitEmployerRequest(payload, { actorId });
  res.status(201).json(result);
}

export async function createPlacement(req, res) {
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const result = await recordLaunchpadPlacement(payload, { actorId });
  res.status(201).json(result);
}

export async function createOpportunityLink(req, res) {
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId);
  const result = await linkLaunchpadOpportunity(payload, { actorId });
  res.status(201).json(result);
}

export async function dashboard(req, res) {
  const { launchpadId, lookbackDays } = req.query ?? {};
  const result = await getLaunchpadDashboard(parseNumber(launchpadId), {
    lookbackDays: parseNumber(lookbackDays, 60),
  });
  res.json(result);
}

export default {
  createApplication,
  updateApplication,
  createEmployerRequest,
  createPlacement,
  createOpportunityLink,
  dashboard,
};
