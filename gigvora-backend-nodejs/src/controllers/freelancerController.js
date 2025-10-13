import { getFreelancerDashboard } from '../services/freelancerService.js';
import {
  createGigBlueprint,
  updateGigBlueprint,
  publishGig,
  getGigDetail,
} from '../services/gigService.js';

function parseNumber(value) {
  if (value == null || value === '') {
    return undefined;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

export async function dashboard(req, res) {
  const { freelancerId, limit, actorId } = req.query ?? {};
  const normalizedId = parseNumber(freelancerId ?? actorId);
  const limitGigs = parseNumber(limit) ?? 10;
  const data = await getFreelancerDashboard({ freelancerId: normalizedId, limitGigs });
  res.json(data);
}

export async function createGig(req, res) {
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? payload.ownerId);
  const gig = await createGigBlueprint(payload, { actorId });
  res.status(201).json(gig);
}

export async function updateGig(req, res) {
  const { gigId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? payload.ownerId);
  const gig = await updateGigBlueprint(gigId, payload, { actorId });
  res.json(gig);
}

export async function publish(req, res) {
  const { gigId } = req.params;
  const payload = req.body ?? {};
  const actorId = parseNumber(payload.actorId ?? payload.ownerId);
  const gig = await publishGig(gigId, { actorId, visibility: payload.visibility });
  res.json(gig);
}

export async function show(req, res) {
  const { gigId } = req.params;
  const gig = await getGigDetail(gigId);
  res.json(gig);
}

export default {
  dashboard,
  createGig,
  updateGig,
  publish,
  show,
};
