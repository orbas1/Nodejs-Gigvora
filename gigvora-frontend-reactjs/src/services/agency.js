import { apiClient } from './apiClient.js';

export async function fetchAgencyDashboard(
  { workspaceSlug, workspaceId, lookbackDays } = {},
  { signal } = {},
) {
  return apiClient.get('/agency/dashboard', {
    params: {
      workspaceSlug: workspaceSlug ?? undefined,
      workspaceId: workspaceId ?? undefined,
      lookbackDays: lookbackDays ?? undefined,
    },
    signal,
  });
}

export async function fetchAgencyVolunteeringOverview(
  { workspaceSlug, workspaceId } = {},
  { signal } = {},
) {
  return apiClient.get('/agency/volunteering/overview', {
    params: {
      workspaceSlug: workspaceSlug ?? undefined,
      workspaceId: workspaceId ?? undefined,
    },
    signal,
  });
}

export function createAgencyVolunteeringContract(payload, options = {}) {
  return apiClient.post('/agency/volunteering/contracts', payload, options);
}

export function updateAgencyVolunteeringContract(contractId, payload, options = {}) {
  return apiClient.patch(`/agency/volunteering/contracts/${contractId}`, payload, options);
}

export function deleteAgencyVolunteeringContract(contractId, options = {}) {
  return apiClient.delete(`/agency/volunteering/contracts/${contractId}`, options);
}

export function createAgencyVolunteeringApplication(payload, options = {}) {
  return apiClient.post('/agency/volunteering/applications', payload, options);
}

export function updateAgencyVolunteeringApplication(applicationId, payload, options = {}) {
  return apiClient.patch(`/agency/volunteering/applications/${applicationId}`, payload, options);
}

export function deleteAgencyVolunteeringApplication(applicationId, options = {}) {
  return apiClient.delete(`/agency/volunteering/applications/${applicationId}`, options);
}

export function createAgencyVolunteeringResponse(payload, options = {}) {
  return apiClient.post('/agency/volunteering/responses', payload, options);
}

export function updateAgencyVolunteeringResponse(responseId, payload, options = {}) {
  return apiClient.patch(`/agency/volunteering/responses/${responseId}`, payload, options);
}

export function deleteAgencyVolunteeringResponse(responseId, options = {}) {
  return apiClient.delete(`/agency/volunteering/responses/${responseId}`, options);
}

export function createAgencyVolunteeringSpendEntry(payload, options = {}) {
  return apiClient.post('/agency/volunteering/spend', payload, options);
}

export function updateAgencyVolunteeringSpendEntry(spendEntryId, payload, options = {}) {
  return apiClient.patch(`/agency/volunteering/spend/${spendEntryId}`, payload, options);
}

export function deleteAgencyVolunteeringSpendEntry(spendEntryId, options = {}) {
  return apiClient.delete(`/agency/volunteering/spend/${spendEntryId}`, options);
}

export default {
  fetchAgencyDashboard,
  fetchAgencyVolunteeringOverview,
  createAgencyVolunteeringContract,
  updateAgencyVolunteeringContract,
  deleteAgencyVolunteeringContract,
  createAgencyVolunteeringApplication,
  updateAgencyVolunteeringApplication,
  deleteAgencyVolunteeringApplication,
  createAgencyVolunteeringResponse,
  updateAgencyVolunteeringResponse,
  deleteAgencyVolunteeringResponse,
  createAgencyVolunteeringSpendEntry,
  updateAgencyVolunteeringSpendEntry,
  deleteAgencyVolunteeringSpendEntry,
};

