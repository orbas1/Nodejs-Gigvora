import {
  getFreelancerPipelineDashboard,
  createPipelineDeal,
  updatePipelineDeal,
  createPipelineProposal,
  createPipelineFollowUp,
  updatePipelineFollowUp,
  createPipelineCampaign,
} from '../services/pipelineService.js';
import { ValidationError, AuthorizationError } from '../utils/errors.js';

function resolveOwnerId(req) {
  const candidates = [
    req.body?.ownerId,
    req.query?.ownerId,
    req.params?.ownerId,
    req.user?.id,
  ];

  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) {
      continue;
    }
    const value = Number.parseInt(candidate, 10);
    if (Number.isInteger(value) && value > 0) {
      return value;
    }
  }

  return null;
}

function ensureOwnerAccess(req, ownerId) {
  if (!req.user) {
    return;
  }
  const isAdmin = (req.user.roles ?? []).includes('admin') || req.user.type === 'admin';
  if (isAdmin) {
    return;
  }
  if (req.user.id && Number.parseInt(req.user.id, 10) !== Number(ownerId)) {
    throw new AuthorizationError('You can only manage your own pipeline workspace.');
  }
}

export async function dashboard(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to load the pipeline dashboard.');
  }
  ensureOwnerAccess(req, ownerId);
  const { view } = req.query ?? {};
  const result = await getFreelancerPipelineDashboard(ownerId, { view });
  res.json(result);
}

export async function storeDeal(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to create a deal.');
  }
  ensureOwnerAccess(req, ownerId);
  const deal = await createPipelineDeal(ownerId, req.body ?? {});
  res.status(201).json(deal);
}

export async function updateDeal(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to update a deal.');
  }
  ensureOwnerAccess(req, ownerId);
  const { dealId } = req.params;
  const deal = await updatePipelineDeal(ownerId, dealId, req.body ?? {});
  res.json(deal);
}

export async function storeProposal(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to create a proposal.');
  }
  ensureOwnerAccess(req, ownerId);
  const proposal = await createPipelineProposal(ownerId, req.body ?? {});
  res.status(201).json(proposal);
}

export async function storeFollowUp(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to create a follow-up.');
  }
  ensureOwnerAccess(req, ownerId);
  const followUp = await createPipelineFollowUp(ownerId, req.body ?? {});
  res.status(201).json(followUp);
}

export async function updateFollowUp(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to update a follow-up.');
  }
  ensureOwnerAccess(req, ownerId);
  const { followUpId } = req.params;
  const followUp = await updatePipelineFollowUp(ownerId, followUpId, req.body ?? {});
  res.json(followUp);
}

export async function storeCampaign(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to create a campaign.');
  }
  ensureOwnerAccess(req, ownerId);
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
