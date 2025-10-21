import { apiClient } from './apiClient.js';

function ensureOwner(ownerId) {
  if (!ownerId) {
    throw new Error('ownerId is required to load the pipeline dashboard.');
  }
  return ownerId;
}

function ensureIdentifier(value, message) {
  if (!value) {
    throw new Error(message);
  }
  return value;
}

export async function fetchPipelineDashboard(ownerId, { view, signal, lookbackDays, ownerType } = {}) {
  ensureOwner(ownerId);
  return apiClient.get('/pipeline/dashboard', {
    params: {
      ownerId,
      view,
      lookbackDays,
      ownerType,
    },
    signal,
  });
}

export async function fetchFreelancerPipelineDashboard(ownerId, options = {}) {
  return fetchPipelineDashboard(ensureOwner(ownerId), {
    ...options,
    ownerType: options.ownerType ?? 'freelancer',
  });
}

export async function createPipelineDeal(ownerId, payload, { signal, ownerType } = {}) {
  ensureOwner(ownerId);
  return apiClient.post('/pipeline/deals', { ownerId, ownerType, ...payload }, { signal });
}

export async function updatePipelineDeal(ownerId, dealId, payload, { signal, ownerType } = {}) {
  ensureOwner(ownerId);
  ensureIdentifier(dealId, 'dealId is required to update a pipeline deal.');
  return apiClient.patch(`/pipeline/deals/${dealId}`, { ownerId, ownerType, ...payload }, { signal });
}

export async function deletePipelineDeal(ownerId, dealId, { signal, ownerType } = {}) {
  ensureOwner(ownerId);
  ensureIdentifier(dealId, 'dealId is required to delete a pipeline deal.');
  return apiClient.delete(`/pipeline/deals/${dealId}`, { signal, body: { ownerId, ownerType } });
}

export async function createPipelineProposal(ownerId, payload, { signal, ownerType } = {}) {
  ensureOwner(ownerId);
  return apiClient.post('/pipeline/proposals', { ownerId, ownerType, ...payload }, { signal });
}

export async function createPipelineFollowUp(ownerId, payload, { signal, ownerType } = {}) {
  ensureOwner(ownerId);
  return apiClient.post('/pipeline/follow-ups', { ownerId, ownerType, ...payload }, { signal });
}

export async function updatePipelineFollowUp(ownerId, followUpId, payload, { signal, ownerType } = {}) {
  ensureOwner(ownerId);
  ensureIdentifier(followUpId, 'followUpId is required to update a follow-up.');
  return apiClient.patch(`/pipeline/follow-ups/${followUpId}`, { ownerId, ownerType, ...payload }, { signal });
}

export async function deletePipelineFollowUp(ownerId, followUpId, { signal, ownerType } = {}) {
  ensureOwner(ownerId);
  ensureIdentifier(followUpId, 'followUpId is required to delete a follow-up.');
  return apiClient.delete(`/pipeline/follow-ups/${followUpId}`, { signal, body: { ownerId, ownerType } });
}

export async function createPipelineCampaign(ownerId, payload, { signal, ownerType } = {}) {
  ensureOwner(ownerId);
  return apiClient.post('/pipeline/campaigns', { ownerId, ownerType, ...payload }, { signal });
}

export async function deletePipelineCampaign(ownerId, campaignId, { signal, ownerType } = {}) {
  ensureOwner(ownerId);
  ensureIdentifier(campaignId, 'campaignId is required to delete a pipeline campaign.');
  return apiClient.delete(`/pipeline/campaigns/${campaignId}`, { signal, body: { ownerId, ownerType } });
}

export async function deletePipelineProposal(ownerId, proposalId, { signal, ownerType } = {}) {
  ensureOwner(ownerId);
  ensureIdentifier(proposalId, 'proposalId is required to delete a pipeline proposal.');
  return apiClient.delete(`/pipeline/proposals/${proposalId}`, { signal, body: { ownerId, ownerType } });
}

export default {
  fetchFreelancerPipelineDashboard,
  fetchPipelineDashboard,
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
};
