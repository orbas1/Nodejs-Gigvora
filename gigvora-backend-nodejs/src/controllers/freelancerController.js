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
  orderPipeline,
  createOrder,
  updateOrder,
  createOrderRequirement,
  updateOrderRequirement,
  createOrderRevision,
  updateOrderRevision,
  createOrderEscrowCheckpoint,
  updateOrderEscrowCheckpoint,
};
