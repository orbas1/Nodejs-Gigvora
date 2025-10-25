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
import {
  ensurePlainObject,
  parsePositiveInteger,
  sanitizeActorPayload,
} from '../utils/controllerAccess.js';

function requirePositiveIdentifier(name, value) {
  return parsePositiveInteger(value, name);
}

function requireFreelancerId(value) {
  return parsePositiveInteger(value, 'freelancerId');
}

function resolveFreelancerIdFromQuery(query = {}) {
  const candidate = query.freelancerId ?? query.actorId;
  const parsed = parsePositiveInteger(candidate, 'freelancerId', { optional: true });
  if (!parsed) {
    throw new ValidationError('freelancerId must be a positive integer.');
  }
  return parsed;
}

function resolveActorContext(req, inputPayload = {}) {
  const baseActorId = parsePositiveInteger(req.user?.id ?? req.user?.userId, 'actorId', {
    optional: true,
  });
  const preparedPayload = ensurePlainObject(inputPayload);
  if (preparedPayload.ownerId != null && preparedPayload.actorId == null) {
    preparedPayload.actorId = preparedPayload.ownerId;
  }
  const { actorId, payload } = sanitizeActorPayload(preparedPayload, { actorId: baseActorId });
  delete payload.ownerId;
  if (!actorId) {
    throw new ValidationError('actorId must be a positive integer.');
  }
  return { actorId, payload };
}

export async function dashboard(req, res) {
  const { limit } = req.query ?? {};
  const resolvedId = resolveFreelancerIdFromQuery(req.query);
  const limitGigs = parsePositiveInteger(limit, 'limit', { optional: true }) ?? 10;

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
  const { lookbackDays } = req.query ?? {};

  const pipeline = await getFreelancerOrderPipeline(resolveFreelancerIdFromQuery(req.query), {
    lookbackDays: parsePositiveInteger(lookbackDays, 'lookbackDays', { optional: true }),
  });

  res.json(pipeline);
}

export async function createOrder(req, res) {
  const payload = ensurePlainObject(req.body);
  const resolvedFreelancerId =
    parsePositiveInteger(payload.freelancerId, 'freelancerId', { optional: true }) ??
    parsePositiveInteger(req.query?.freelancerId, 'freelancerId', { optional: true });

  if (!resolvedFreelancerId) {
    throw new ValidationError('freelancerId is required to create an order.');
  }

  payload.freelancerId = resolvedFreelancerId;

  const result = await createFreelancerOrder(payload);
  res.status(201).json(result);
}

export async function updateOrder(req, res) {
  const orderId = requirePositiveIdentifier('orderId', req.params?.orderId);
  const result = await updateFreelancerOrder(orderId, req.body ?? {});
  res.json(result);
}

export async function createOrderRequirement(req, res) {
  const orderId = requirePositiveIdentifier('orderId', req.params?.orderId);
  const result = await createRequirementForm(orderId, req.body ?? {});
  res.status(201).json(result);
}

export async function updateOrderRequirement(req, res) {
  const formId = requirePositiveIdentifier('formId', req.params?.formId);
  const result = await updateRequirementForm(formId, req.body ?? {});
  res.json(result);
}

export async function createOrderRevision(req, res) {
  const orderId = requirePositiveIdentifier('orderId', req.params?.orderId);
  const result = await createRevision(orderId, req.body ?? {});
  res.status(201).json(result);
}

export async function updateOrderRevision(req, res) {
  const revisionId = requirePositiveIdentifier('revisionId', req.params?.revisionId);
  const result = await updateRevision(revisionId, req.body ?? {});
  res.json(result);
}

export async function createOrderEscrowCheckpoint(req, res) {
  const orderId = requirePositiveIdentifier('orderId', req.params?.orderId);
  const result = await createEscrowCheckpoint(orderId, req.body ?? {});
  res.status(201).json(result);
}

export async function updateOrderEscrowCheckpoint(req, res) {
  const checkpointId = requirePositiveIdentifier('checkpointId', req.params?.checkpointId);
  const result = await updateEscrowCheckpoint(checkpointId, req.body ?? {});
  res.json(result);
}

export async function createGig(req, res) {
  const { actorId, payload } = resolveActorContext(req, req.body);
  const gig = await createGigBlueprint(payload, { actorId });
  res.status(201).json(gig);
}

export async function updateGig(req, res) {
  const gigId = requirePositiveIdentifier('gigId', req.params?.gigId);
  const { actorId, payload } = resolveActorContext(req, req.body);
  const gig = await updateGigBlueprint(gigId, payload, { actorId });
  res.json(gig);
}

export async function publish(req, res) {
  const gigId = requirePositiveIdentifier('gigId', req.params?.gigId);
  const { actorId, payload } = resolveActorContext(req, req.body);

  const gig = await publishGig(gigId, {
    actorId,
    visibility: payload.visibility,
  });

  res.json(gig);
}

export async function show(req, res) {
  const gigId = requirePositiveIdentifier('gigId', req.params?.gigId);
  const gig = await getGigDetail(gigId);
  res.json(gig);
}

export async function getPurchasedGigWorkspace(req, res) {
  const id = requirePositiveIdentifier('id', req.params?.id);

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
