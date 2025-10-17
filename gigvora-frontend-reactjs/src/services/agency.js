import apiClient from './apiClient.js';

function sanitizeParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && `${value}`.length > 0),
  );
}

export async function fetchAgencyDashboard({ workspaceId, workspaceSlug, lookbackDays, signal, fresh } = {}) {
  const params = sanitizeParams({
    workspaceId,
    workspaceSlug,
    lookbackDays,
    fresh: fresh ? 'true' : undefined,
  });

  return apiClient.get('/agency/dashboard', { params, signal });
}

export async function fetchAgencyProfileManagement({ signal } = {}) {
  return apiClient.get('/agency/profile', { signal });
}

export async function updateAgencyProfileBasics(payload, { signal } = {}) {
  return apiClient.put('/agency/profile', payload, { signal });
}

export async function createAgencyProfileMedia(payload, { signal } = {}) {
  return apiClient.post('/agency/profile/media', payload, { signal });
}

export async function updateAgencyProfileMedia(mediaId, payload, { signal } = {}) {
  return apiClient.put(`/agency/profile/media/${mediaId}`, payload, { signal });
}

export async function deleteAgencyProfileMedia(mediaId, { signal } = {}) {
  return apiClient.delete(`/agency/profile/media/${mediaId}`, { signal });
}

export async function createAgencyProfileSkill(payload, { signal } = {}) {
  return apiClient.post('/agency/profile/skills', payload, { signal });
}

export async function updateAgencyProfileSkill(skillId, payload, { signal } = {}) {
  return apiClient.put(`/agency/profile/skills/${skillId}`, payload, { signal });
}

export async function deleteAgencyProfileSkill(skillId, { signal } = {}) {
  return apiClient.delete(`/agency/profile/skills/${skillId}`, { signal });
}

export async function createAgencyProfileCredential(payload, { signal } = {}) {
  return apiClient.post('/agency/profile/credentials', payload, { signal });
}

export async function updateAgencyProfileCredential(credentialId, payload, { signal } = {}) {
  return apiClient.put(`/agency/profile/credentials/${credentialId}`, payload, { signal });
}

export async function deleteAgencyProfileCredential(credentialId, { signal } = {}) {
  return apiClient.delete(`/agency/profile/credentials/${credentialId}`, { signal });
}

export async function createAgencyProfileExperience(payload, { signal } = {}) {
  return apiClient.post('/agency/profile/experiences', payload, { signal });
}

export async function updateAgencyProfileExperience(experienceId, payload, { signal } = {}) {
  return apiClient.put(`/agency/profile/experiences/${experienceId}`, payload, { signal });
}

export async function deleteAgencyProfileExperience(experienceId, { signal } = {}) {
  return apiClient.delete(`/agency/profile/experiences/${experienceId}`, { signal });
}

export async function createAgencyProfileWorkforceSegment(payload, { signal } = {}) {
  return apiClient.post('/agency/profile/workforce', payload, { signal });
}

export async function updateAgencyProfileWorkforceSegment(segmentId, payload, { signal } = {}) {
  return apiClient.put(`/agency/profile/workforce/${segmentId}`, payload, { signal });
}

export async function deleteAgencyProfileWorkforceSegment(segmentId, { signal } = {}) {
  return apiClient.delete(`/agency/profile/workforce/${segmentId}`, { signal });
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

export async function fetchAgencyCalendar(
  { workspaceSlug, workspaceId, types, status, from, to } = {},
  { signal } = {},
) {
  const typeParam = Array.isArray(types) ? types.filter(Boolean).join(',') : types;
  return apiClient.get('/agency/calendar', {
    params: {
      workspaceSlug: workspaceSlug ?? undefined,
      workspaceId: workspaceId ?? undefined,
      types: typeParam && typeParam.length ? typeParam : undefined,
      status: status ?? undefined,
      from: from ?? undefined,
      to: to ?? undefined,
    },
    signal,
  });
}

export async function fetchAgencyCalendarEvent(eventId, { workspaceSlug, workspaceId } = {}, { signal } = {}) {
  return apiClient.get(`/agency/calendar/${eventId}`, {
    params: {
      workspaceSlug: workspaceSlug ?? undefined,
      workspaceId: workspaceId ?? undefined,
    },
    signal,
  });
}

export async function createAgencyCalendarEvent(payload = {}, { signal } = {}) {
  return apiClient.post('/agency/calendar', payload, { signal });
}

export async function updateAgencyCalendarEvent(eventId, payload = {}, { signal } = {}) {
  return apiClient.put(`/agency/calendar/${eventId}`, payload, { signal });
}

export async function deleteAgencyCalendarEvent(eventId, payload = {}, { signal } = {}) {
  return apiClient.delete(`/agency/calendar/${eventId}`, {
    params: {
      workspaceSlug: payload.workspaceSlug ?? undefined,
      workspaceId: payload.workspaceId ?? undefined,
    },
    signal,
  });
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
  fetchAgencyCalendar,
  fetchAgencyCalendarEvent,
  createAgencyCalendarEvent,
  updateAgencyCalendarEvent,
  deleteAgencyCalendarEvent,
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
  fetchAgencyProfileManagement,
  updateAgencyProfileBasics,
  createAgencyProfileMedia,
  updateAgencyProfileMedia,
  deleteAgencyProfileMedia,
  createAgencyProfileSkill,
  updateAgencyProfileSkill,
  deleteAgencyProfileSkill,
  createAgencyProfileCredential,
  updateAgencyProfileCredential,
  deleteAgencyProfileCredential,
  createAgencyProfileExperience,
  updateAgencyProfileExperience,
  deleteAgencyProfileExperience,
  createAgencyProfileWorkforceSegment,
  updateAgencyProfileWorkforceSegment,
  deleteAgencyProfileWorkforceSegment,
};
