import { apiClient } from './apiClient.js';

const volunteeringHeaders = {
  'X-Workspace-Roles': 'freelancer',
};

function ensureFreelancerId(freelancerId) {
  if (!freelancerId) {
    throw new Error('A freelancerId is required for volunteering requests.');
  }
  return freelancerId;
}

export function fetchFreelancerVolunteeringWorkspace(freelancerId, { signal } = {}) {
  const id = ensureFreelancerId(freelancerId);
  return apiClient.get(`/freelancers/${id}/volunteering`, {
    signal,
    headers: volunteeringHeaders,
  });
}

export function createFreelancerVolunteeringApplication(freelancerId, payload) {
  const id = ensureFreelancerId(freelancerId);
  return apiClient.post(`/freelancers/${id}/volunteering/applications`, payload, {
    headers: volunteeringHeaders,
  });
}

export function updateFreelancerVolunteeringApplication(freelancerId, applicationId, payload) {
  const id = ensureFreelancerId(freelancerId);
  return apiClient.put(`/freelancers/${id}/volunteering/applications/${applicationId}`, payload, {
    headers: volunteeringHeaders,
  });
}

export function deleteFreelancerVolunteeringApplication(freelancerId, applicationId) {
  const id = ensureFreelancerId(freelancerId);
  return apiClient.delete(`/freelancers/${id}/volunteering/applications/${applicationId}`, {
    headers: volunteeringHeaders,
  });
}

export function createFreelancerVolunteeringResponse(freelancerId, applicationId, payload) {
  const id = ensureFreelancerId(freelancerId);
  return apiClient.post(`/freelancers/${id}/volunteering/applications/${applicationId}/responses`, payload, {
    headers: volunteeringHeaders,
  });
}

export function updateFreelancerVolunteeringResponse(freelancerId, responseId, payload) {
  const id = ensureFreelancerId(freelancerId);
  return apiClient.put(`/freelancers/${id}/volunteering/responses/${responseId}`, payload, {
    headers: volunteeringHeaders,
  });
}

export function deleteFreelancerVolunteeringResponse(freelancerId, responseId) {
  const id = ensureFreelancerId(freelancerId);
  return apiClient.delete(`/freelancers/${id}/volunteering/responses/${responseId}`, {
    headers: volunteeringHeaders,
  });
}

export function createFreelancerVolunteeringContract(freelancerId, payload) {
  const id = ensureFreelancerId(freelancerId);
  return apiClient.post(`/freelancers/${id}/volunteering/contracts`, payload, {
    headers: volunteeringHeaders,
  });
}

export function updateFreelancerVolunteeringContract(freelancerId, contractId, payload) {
  const id = ensureFreelancerId(freelancerId);
  return apiClient.put(`/freelancers/${id}/volunteering/contracts/${contractId}`, payload, {
    headers: volunteeringHeaders,
  });
}

export function deleteFreelancerVolunteeringContract(freelancerId, contractId) {
  const id = ensureFreelancerId(freelancerId);
  return apiClient.delete(`/freelancers/${id}/volunteering/contracts/${contractId}`, {
    headers: volunteeringHeaders,
  });
}

export function createFreelancerVolunteeringSpend(freelancerId, contractId, payload) {
  const id = ensureFreelancerId(freelancerId);
  return apiClient.post(`/freelancers/${id}/volunteering/contracts/${contractId}/spend`, payload, {
    headers: volunteeringHeaders,
  });
}

export function updateFreelancerVolunteeringSpend(freelancerId, spendId, payload) {
  const id = ensureFreelancerId(freelancerId);
  return apiClient.put(`/freelancers/${id}/volunteering/spend/${spendId}`, payload, {
    headers: volunteeringHeaders,
  });
}

export function deleteFreelancerVolunteeringSpend(freelancerId, spendId) {
  const id = ensureFreelancerId(freelancerId);
  return apiClient.delete(`/freelancers/${id}/volunteering/spend/${spendId}`, {
    headers: volunteeringHeaders,
  });
}

export default {
  fetchFreelancerVolunteeringWorkspace,
  createFreelancerVolunteeringApplication,
  updateFreelancerVolunteeringApplication,
  deleteFreelancerVolunteeringApplication,
  createFreelancerVolunteeringResponse,
  updateFreelancerVolunteeringResponse,
  deleteFreelancerVolunteeringResponse,
  createFreelancerVolunteeringContract,
  updateFreelancerVolunteeringContract,
  deleteFreelancerVolunteeringContract,
  createFreelancerVolunteeringSpend,
  updateFreelancerVolunteeringSpend,
  deleteFreelancerVolunteeringSpend,
};
