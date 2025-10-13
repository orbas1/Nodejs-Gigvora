import { getFreelancerSpotlight } from '../services/communitySpotlightService.js';

export async function communitySpotlight(req, res) {
  const { freelancerId } = req.params;
  const { profileId, includeDraft } = req.query ?? {};

  const result = await getFreelancerSpotlight({
    userId: freelancerId,
    profileId,
    includeDraft: includeDraft === 'true',
  });

import {
  getFreelancerOrderPipeline,
  createFreelancerOrder,
  updateFreelancerOrder,
  createRequirementForm,
  updateRequirementForm,
  createRevision,
  updateRevision,
  createEscrowCheckpoint,
  updateEscrowCheckpoint,
} from '../services/freelancerOrderPipelineService.js';

function toOptionalNumber(value) {
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

export async function orderPipeline(req, res) {
  const { freelancerId, lookbackDays } = req.query ?? {};
  const result = await getFreelancerOrderPipeline(freelancerId, { lookbackDays });
  res.json(result);
}

export async function createOrder(req, res) {
  const payload = req.body ?? {};
  if (payload.freelancerId == null) {
    payload.freelancerId = toOptionalNumber(req.query?.freelancerId) ?? payload.freelancerId;
  }
  const result = await createFreelancerOrder(payload);
  res.status(201).json(result);
}

export async function updateOrder(req, res) {
  const { orderId } = req.params ?? {};
  const result = await updateFreelancerOrder(orderId, req.body ?? {});
  res.json(result);
}

export async function createOrderRequirement(req, res) {
  const { orderId } = req.params ?? {};
  const result = await createRequirementForm(orderId, req.body ?? {});
  res.status(201).json(result);
}

export async function updateOrderRequirement(req, res) {
  const { formId } = req.params ?? {};
  const result = await updateRequirementForm(formId, req.body ?? {});
  res.json(result);
}

export async function createOrderRevision(req, res) {
  const { orderId } = req.params ?? {};
  const result = await createRevision(orderId, req.body ?? {});
  res.status(201).json(result);
}

export async function updateOrderRevision(req, res) {
  const { revisionId } = req.params ?? {};
  const result = await updateRevision(revisionId, req.body ?? {});
  res.json(result);
}

export async function createOrderEscrowCheckpoint(req, res) {
  const { orderId } = req.params ?? {};
  const result = await createEscrowCheckpoint(orderId, req.body ?? {});
  res.status(201).json(result);
}

export async function updateOrderEscrowCheckpoint(req, res) {
  const { checkpointId } = req.params ?? {};
  const result = await updateEscrowCheckpoint(checkpointId, req.body ?? {});
  res.json(result);
}

export default {
  communitySpotlight,
  orderPipeline,
  createOrder,
  updateOrder,
  createOrderRequirement,
  updateOrderRequirement,
  createOrderRevision,
  updateOrderRevision,
  createOrderEscrowCheckpoint,
  updateOrderEscrowCheckpoint,
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
import freelancerPurchasedGigService from '../services/freelancerPurchasedGigService.js';

export async function getPurchasedGigWorkspace(req, res) {
  const { id } = req.params;
  const dashboard = await freelancerPurchasedGigService.getFreelancerPurchasedGigDashboard(id, {
    bypassCache: req.query.fresh === 'true',
  });

  if (!dashboard.freelancer) {
    return res.status(404).json({ message: 'Freelancer not found' });
  }

  res.json(dashboard);
}

export default {
  getPurchasedGigWorkspace,
};
