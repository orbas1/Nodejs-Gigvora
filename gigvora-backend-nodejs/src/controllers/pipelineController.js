import {
  getFreelancerPipelineDashboard,
  createPipelineDeal,
  updatePipelineDeal,
  createPipelineProposal,
  createPipelineFollowUp,
  updatePipelineFollowUp,
  createPipelineCampaign,
  deletePipelineDeal,
  deletePipelineFollowUp,
  deletePipelineProposal,
  deletePipelineCampaign,
} from '../services/pipelineService.js';
import { ProviderWorkspace, ProviderWorkspaceMember } from '../models/index.js';
import { ValidationError, AuthorizationError, NotFoundError } from '../utils/errors.js';

const PIPELINE_OWNER_TYPES = new Set(['freelancer', 'agency', 'company']);

function normaliseRole(value) {
  if (value == null) {
    return null;
  }
  const normalised = `${value}`.trim().toLowerCase();
  return normalised.length > 0 ? normalised : null;
}

function mapOwnerType(candidate) {
  const normalised = normaliseRole(candidate);
  if (!normalised) {
    return null;
  }
  if (PIPELINE_OWNER_TYPES.has(normalised)) {
    return normalised;
  }
  if (normalised.includes('freelancer')) {
    return 'freelancer';
  }
  if (normalised.includes('agency')) {
    return 'agency';
  }
  if (normalised.includes('company')) {
    return 'company';
  }
  return null;
}

function deriveOwnerTypeFromMemberships(user, ownerId) {
  if (!user || !Array.isArray(user.memberships) || ownerId == null) {
    return null;
  }
  const numericOwnerId = Number.parseInt(ownerId, 10);
  if (!Number.isInteger(numericOwnerId)) {
    return null;
  }
  for (const membership of user.memberships) {
    const membershipWorkspaceId = Number.parseInt(membership?.workspaceId ?? membership?.workspace?.id, 10);
    if (Number.isInteger(membershipWorkspaceId) && membershipWorkspaceId === numericOwnerId) {
      const derived = mapOwnerType(membership?.workspace?.type ?? membership?.workspaceType);
      if (derived) {
        return derived;
      }
    }
  }
  return null;
}

function buildRoleSet(user) {
  const roles = new Set();
  if (!user) {
    return roles;
  }
  const addRole = (value) => {
    const normalised = normaliseRole(value);
    if (normalised) {
      roles.add(normalised);
    }
  };
  if (Array.isArray(user.roles)) {
    user.roles.forEach((role) => addRole(role));
  }
  addRole(user.userType);
  addRole(user.type);
  if (Array.isArray(user.memberships)) {
    user.memberships.forEach((membership) => {
      addRole(membership?.role);
      addRole(membership?.workspace?.type ?? membership?.workspaceType);
    });
  }
  return roles;
}

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

function resolveOwnerType(req, ownerId = null) {
  const candidates = [
    { value: req.body?.ownerType, strict: true },
    { value: req.query?.ownerType, strict: true },
    { value: req.params?.ownerType, strict: true },
  ];

  const membershipDerivedType = deriveOwnerTypeFromMemberships(req.user, ownerId);
  if (membershipDerivedType) {
    candidates.push({ value: membershipDerivedType, strict: false });
  }

  const userCandidates = [req.user?.userType, req.user?.type];
  userCandidates.forEach((candidate) => {
    if (candidate != null) {
      candidates.push({ value: candidate, strict: false });
    }
  });

  if (Array.isArray(req.user?.roles)) {
    req.user.roles.forEach((role) => {
      candidates.push({ value: role, strict: false });
    });
  }

  for (const candidate of candidates) {
    const resolved = mapOwnerType(candidate.value);
    if (!resolved) {
      if (candidate.strict && candidate.value != null) {
        throw new ValidationError('Invalid pipeline owner type provided.');
      }
      continue;
    }
    return resolved;
  }

  return 'freelancer';
}

async function ensureOwnerAccess(req, ownerId, ownerType) {
  if (!req.user) {
    return { workspace: null };
  }
  const roleSet = buildRoleSet(req.user);
  const isAdmin = roleSet.has('admin') || roleSet.has('platform_admin');
  if (ownerType === 'freelancer') {
    if (isAdmin) {
      return { workspace: null };
    }
    if (req.user.id && Number.parseInt(req.user.id, 10) !== Number(ownerId)) {
      throw new AuthorizationError('You can only manage your own pipeline workspace.');
    }
    return { workspace: null };
  }

  if (ownerType === 'agency' || ownerType === 'company') {
    const workspace = await ProviderWorkspace.findOne({
      where: { id: ownerId, type: ownerType },
      attributes: ['id', 'ownerId', 'name', 'type'],
    });

    if (!workspace) {
      throw new NotFoundError('The requested workspace could not be found.');
    }

    if (isAdmin) {
      return { workspace };
    }

    if (Number.parseInt(workspace.ownerId, 10) === Number(req.user.id)) {
      return { workspace };
    }

    const membershipCount = await ProviderWorkspaceMember.count({
      where: { workspaceId: workspace.id, userId: req.user.id, status: 'active' },
    });

    if (membershipCount === 0) {
      throw new AuthorizationError('You do not have permission to access this pipeline workspace.');
    }

    return { workspace };
  }

  return { workspace: null };
}

export async function dashboard(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to load the pipeline dashboard.');
  }
  const ownerType = resolveOwnerType(req, ownerId);
  await ensureOwnerAccess(req, ownerId, ownerType);
  const { view } = req.query ?? {};
  const result = await getFreelancerPipelineDashboard(ownerId, { view, ownerType });
  res.json({ ...result, ownerType });
}

export async function storeDeal(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to create a deal.');
  }
  const ownerType = resolveOwnerType(req, ownerId);
  await ensureOwnerAccess(req, ownerId, ownerType);
  const payload = { ...(req.body ?? {}) };
  delete payload.ownerId;
  delete payload.ownerType;
  const deal = await createPipelineDeal(ownerId, payload, { ownerType });
  res.status(201).json(deal);
}

export async function updateDeal(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to update a deal.');
  }
  const ownerType = resolveOwnerType(req, ownerId);
  await ensureOwnerAccess(req, ownerId, ownerType);
  const { dealId } = req.params;
  const payload = { ...(req.body ?? {}) };
  delete payload.ownerId;
  delete payload.ownerType;
  const deal = await updatePipelineDeal(ownerId, dealId, payload, { ownerType });
  res.json(deal);
}

export async function storeProposal(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to create a proposal.');
  }
  const ownerType = resolveOwnerType(req, ownerId);
  await ensureOwnerAccess(req, ownerId, ownerType);
  const payload = { ...(req.body ?? {}) };
  delete payload.ownerId;
  delete payload.ownerType;
  const proposal = await createPipelineProposal(ownerId, payload, { ownerType });
  res.status(201).json(proposal);
}

export async function storeFollowUp(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to create a follow-up.');
  }
  const ownerType = resolveOwnerType(req, ownerId);
  await ensureOwnerAccess(req, ownerId, ownerType);
  const payload = { ...(req.body ?? {}) };
  delete payload.ownerId;
  delete payload.ownerType;
  const followUp = await createPipelineFollowUp(ownerId, payload, { ownerType });
  res.status(201).json(followUp);
}

export async function updateFollowUp(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to update a follow-up.');
  }
  const ownerType = resolveOwnerType(req, ownerId);
  await ensureOwnerAccess(req, ownerId, ownerType);
  const { followUpId } = req.params;
  const payload = { ...(req.body ?? {}) };
  delete payload.ownerId;
  delete payload.ownerType;
  const followUp = await updatePipelineFollowUp(ownerId, followUpId, payload, { ownerType });
  res.json(followUp);
}

export async function storeCampaign(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to create a campaign.');
  }
  const ownerType = resolveOwnerType(req, ownerId);
  await ensureOwnerAccess(req, ownerId, ownerType);
  const payload = { ...(req.body ?? {}) };
  delete payload.ownerId;
  delete payload.ownerType;
  const campaign = await createPipelineCampaign(ownerId, payload, { ownerType });
  res.status(201).json(campaign);
}

export async function destroyDeal(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to delete a deal.');
  }
  const ownerType = resolveOwnerType(req, ownerId);
  await ensureOwnerAccess(req, ownerId, ownerType);
  const { dealId } = req.params;
  await deletePipelineDeal(ownerId, dealId, { ownerType });
  res.status(204).send();
}

export async function destroyFollowUp(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to delete a follow-up.');
  }
  const ownerType = resolveOwnerType(req, ownerId);
  await ensureOwnerAccess(req, ownerId, ownerType);
  const { followUpId } = req.params;
  await deletePipelineFollowUp(ownerId, followUpId, { ownerType });
  res.status(204).send();
}

export async function destroyProposal(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to delete a proposal.');
  }
  const ownerType = resolveOwnerType(req, ownerId);
  await ensureOwnerAccess(req, ownerId, ownerType);
  const { proposalId } = req.params;
  await deletePipelineProposal(ownerId, proposalId, { ownerType });
  res.status(204).send();
}

export async function destroyCampaign(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to delete a campaign.');
  }
  const ownerType = resolveOwnerType(req, ownerId);
  await ensureOwnerAccess(req, ownerId, ownerType);
  const { campaignId } = req.params;
  await deletePipelineCampaign(ownerId, campaignId, { ownerType });
  res.status(204).send();
}

export default {
  dashboard,
  storeDeal,
  updateDeal,
  storeProposal,
  storeFollowUp,
  updateFollowUp,
  storeCampaign,
  destroyDeal,
  destroyFollowUp,
  destroyProposal,
  destroyCampaign,
};
