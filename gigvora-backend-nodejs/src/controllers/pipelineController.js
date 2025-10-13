import {
  getFreelancerPipelineDashboard,
  createPipelineDeal,
  updatePipelineDeal,
  createPipelineProposal,
  createPipelineFollowUp,
  updatePipelineFollowUp,
  createPipelineCampaign,
} from '../services/pipelineService.js';
import { ValidationError } from '../utils/errors.js';

function resolveOwnerId(req) {
  return (
    req.body?.ownerId ??
    req.query?.ownerId ??
    req.params?.ownerId ??
    req.user?.id ??
    null
  );
}

export async function dashboard(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to load the pipeline dashboard.');
  }
  const { view } = req.query ?? {};
  const result = await getFreelancerPipelineDashboard(ownerId, { view });
  res.json(result);
}

export async function storeDeal(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to create a deal.');
  }
  const deal = await createPipelineDeal(ownerId, req.body ?? {});
  res.status(201).json(deal);
}

export async function updateDeal(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to update a deal.');
  }
  const { dealId } = req.params;
  const deal = await updatePipelineDeal(ownerId, dealId, req.body ?? {});
  res.json(deal);
}

export async function storeProposal(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to create a proposal.');
  }
  const proposal = await createPipelineProposal(ownerId, req.body ?? {});
  res.status(201).json(proposal);
}

export async function storeFollowUp(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to create a follow-up.');
  }
  const followUp = await createPipelineFollowUp(ownerId, req.body ?? {});
  res.status(201).json(followUp);
}

export async function updateFollowUp(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to update a follow-up.');
  }
  const { followUpId } = req.params;
  const followUp = await updatePipelineFollowUp(ownerId, followUpId, req.body ?? {});
  res.json(followUp);
}

export async function storeCampaign(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to create a campaign.');
  }
  const campaign = await createPipelineCampaign(ownerId, req.body ?? {});
  res.status(201).json(campaign);
}

export default {
  dashboard,
  storeDeal,
  updateDeal,
  storeProposal,
  storeFollowUp,
  updateFollowUp,
  storeCampaign,
};
