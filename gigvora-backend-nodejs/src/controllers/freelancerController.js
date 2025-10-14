import { getFreelancerSpotlight } from '../services/communitySpotlightService.js';
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
import freelancerPurchasedGigService from '../services/freelancerPurchasedGigService.js';
import { getFreelancerDashboard as getFreelancerSummary } from '../services/freelancerService.js';
import {
  createGigBlueprint,
  updateGigBlueprint,
  publishGig,
  getGigDetail,
} from '../services/gigService.js';
import { ValidationError } from '../utils/errors.js';

function parsePositiveInteger(value) {
  if (value == null || value === '') {
    return undefined;
  }

  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
}

function requireFreelancerId(value) {
  const parsed = parsePositiveInteger(value);

  if (!parsed) {
    throw new ValidationError('freelancerId must be a positive integer.');
  }

  return parsed;
}

export async function dashboard(req, res) {
  const { freelancerId, actorId, limit } = req.query ?? {};
  const resolvedId = requireFreelancerId(freelancerId ?? actorId);
  const limitGigs = parsePositiveInteger(limit) ?? 10;

  const payload = await getFreelancerSummary({
    freelancerId: resolvedId,
    limitGigs,
  });

  res.json(payload);
}

export async function communitySpotlight(req, res) {
  const { freelancerId } = req.params;
  const { profileId, includeDraft } = req.query ?? {};

  const spotlight = await getFreelancerSpotlight({
    userId: requireFreelancerId(freelancerId),
    profileId,
    includeDraft: includeDraft === 'true',
  });

  res.json(spotlight);
}

export async function orderPipeline(req, res) {
  const { freelancerId, lookbackDays } = req.query ?? {};

  const pipeline = await getFreelancerOrderPipeline(requireFreelancerId(freelancerId), {
    lookbackDays: parsePositiveInteger(lookbackDays),
  });

  res.json(pipeline);
}

export async function createOrder(req, res) {
  const payload = req.body ? { ...req.body } : {};
  const { freelancerId } = req.query ?? {};

  payload.freelancerId = payload.freelancerId ?? parsePositiveInteger(freelancerId);

  if (!payload.freelancerId) {
    throw new ValidationError('freelancerId is required to create an order.');
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

export async function createGig(req, res) {
  const payload = req.body ? { ...req.body } : {};
  const actorId = parsePositiveInteger(payload.actorId ?? payload.ownerId);

  const gig = await createGigBlueprint(payload, { actorId });
  res.status(201).json(gig);
}

export async function updateGig(req, res) {
  const { gigId } = req.params;
  const payload = req.body ? { ...req.body } : {};
  const actorId = parsePositiveInteger(payload.actorId ?? payload.ownerId);

  const gig = await updateGigBlueprint(gigId, payload, { actorId });
  res.json(gig);
}

export async function publish(req, res) {
  const { gigId } = req.params;
  const payload = req.body ?? {};
  const actorId = parsePositiveInteger(payload.actorId ?? payload.ownerId);

  const gig = await publishGig(gigId, {
    actorId,
    visibility: payload.visibility,
  });

  res.json(gig);
}

export async function show(req, res) {
  const { gigId } = req.params;
  const gig = await getGigDetail(gigId);
  res.json(gig);
}

export async function getPurchasedGigWorkspace(req, res) {
  const { id } = req.params;

  const dashboard = await freelancerPurchasedGigService.getFreelancerPurchasedGigDashboard(id, {
    bypassCache: req.query?.fresh === 'true',
  });

  if (!dashboard.freelancer) {
    return res.status(404).json({ message: 'Freelancer not found' });
  }

  res.json(dashboard);
}

export default {
  dashboard,
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
  createGig,
  updateGig,
  publish,
  show,
  getPurchasedGigWorkspace,
};
