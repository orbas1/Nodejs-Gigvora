import { apiClient } from './apiClient.js';

export async function fetchFreelancerPipelineDashboard(ownerId, { view, signal } = {}) {
  if (!ownerId) {
    throw new Error('ownerId is required to load the pipeline dashboard.');
  }
  return apiClient.get('/pipeline/dashboard', { params: { ownerId, view }, signal });
}

export async function createPipelineDeal(ownerId, payload, { signal } = {}) {
  if (!ownerId) {
    throw new Error('ownerId is required to create a pipeline deal.');
  }
  return apiClient.post('/pipeline/deals', { ownerId, ...payload }, { signal });
}

export async function updatePipelineDeal(ownerId, dealId, payload, { signal } = {}) {
  if (!ownerId) {
    throw new Error('ownerId is required to update a pipeline deal.');
  }
  return apiClient.patch(`/pipeline/deals/${dealId}`, { ownerId, ...payload }, { signal });
}

export async function createPipelineProposal(ownerId, payload, { signal } = {}) {
  if (!ownerId) {
    throw new Error('ownerId is required to create a pipeline proposal.');
  }
  return apiClient.post('/pipeline/proposals', { ownerId, ...payload }, { signal });
}

export async function createPipelineFollowUp(ownerId, payload, { signal } = {}) {
  if (!ownerId) {
    throw new Error('ownerId is required to schedule a follow-up.');
  }
  return apiClient.post('/pipeline/follow-ups', { ownerId, ...payload }, { signal });
}

export async function updatePipelineFollowUp(ownerId, followUpId, payload, { signal } = {}) {
  if (!ownerId) {
    throw new Error('ownerId is required to update a follow-up.');
  }
  return apiClient.patch(`/pipeline/follow-ups/${followUpId}`, { ownerId, ...payload }, { signal });
}

export async function createPipelineCampaign(ownerId, payload, { signal } = {}) {
  if (!ownerId) {
    throw new Error('ownerId is required to create a pipeline campaign.');
  }
  return apiClient.post('/pipeline/campaigns', { ownerId, ...payload }, { signal });
}

export default {
  fetchFreelancerPipelineDashboard,
  createPipelineDeal,
  updatePipelineDeal,
  createPipelineProposal,
  createPipelineFollowUp,
  updatePipelineFollowUp,
  createPipelineCampaign,
};
