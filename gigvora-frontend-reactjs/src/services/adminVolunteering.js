import { apiClient } from './apiClient.js';

export async function fetchVolunteerInsights(options = {}) {
  return apiClient.get('/admin/volunteering/insights', options);
}

export async function fetchVolunteerPrograms(params = {}, options = {}) {
  return apiClient.get('/admin/volunteering/programs', { ...options, params });
}

export async function fetchVolunteerProgram(programId, options = {}) {
  return apiClient.get(`/admin/volunteering/programs/${programId}`, options);
}

export async function createVolunteerProgram(payload, options = {}) {
  return apiClient.post('/admin/volunteering/programs', payload, options);
}

export async function updateVolunteerProgram(programId, payload, options = {}) {
  return apiClient.put(`/admin/volunteering/programs/${programId}`, payload, options);
}

export async function deleteVolunteerProgram(programId, options = {}) {
  return apiClient.delete(`/admin/volunteering/programs/${programId}`, options);
}

export async function fetchVolunteerRoles(params = {}, options = {}) {
  return apiClient.get('/admin/volunteering/roles', { ...options, params });
}

export async function fetchVolunteerRole(roleId, options = {}) {
  return apiClient.get(`/admin/volunteering/roles/${roleId}`, options);
}

export async function createVolunteerRole(payload, options = {}) {
  return apiClient.post('/admin/volunteering/roles', payload, options);
}

export async function updateVolunteerRole(roleId, payload, options = {}) {
  return apiClient.put(`/admin/volunteering/roles/${roleId}`, payload, options);
}

export async function deleteVolunteerRole(roleId, options = {}) {
  return apiClient.delete(`/admin/volunteering/roles/${roleId}`, options);
}

export async function publishVolunteerRole(roleId, options = {}) {
  return apiClient.post(`/admin/volunteering/roles/${roleId}/publish`, undefined, options);
}

export async function fetchVolunteerShifts(roleId, options = {}) {
  return apiClient.get(`/admin/volunteering/roles/${roleId}/shifts`, options);
}

export async function createVolunteerShift(roleId, payload, options = {}) {
  return apiClient.post(`/admin/volunteering/roles/${roleId}/shifts`, payload, options);
}

export async function updateVolunteerShift(roleId, shiftId, payload, options = {}) {
  return apiClient.put(`/admin/volunteering/roles/${roleId}/shifts/${shiftId}`, payload, options);
}

export async function deleteVolunteerShift(roleId, shiftId, options = {}) {
  return apiClient.delete(`/admin/volunteering/roles/${roleId}/shifts/${shiftId}`, options);
}

export async function fetchVolunteerAssignments(roleId, shiftId, options = {}) {
  return apiClient.get(`/admin/volunteering/roles/${roleId}/shifts/${shiftId}/assignments`, options);
}

export async function createVolunteerAssignment(roleId, shiftId, payload, options = {}) {
  return apiClient.post(`/admin/volunteering/roles/${roleId}/shifts/${shiftId}/assignments`, payload, options);
}

export async function updateVolunteerAssignment(roleId, shiftId, assignmentId, payload, options = {}) {
  return apiClient.put(
    `/admin/volunteering/roles/${roleId}/shifts/${shiftId}/assignments/${assignmentId}`,
    payload,
    options,
  );
}

export async function deleteVolunteerAssignment(roleId, shiftId, assignmentId, options = {}) {
  return apiClient.delete(`/admin/volunteering/roles/${roleId}/shifts/${shiftId}/assignments/${assignmentId}`, options);
}

export default {
  fetchVolunteerInsights,
  fetchVolunteerPrograms,
  fetchVolunteerProgram,
  createVolunteerProgram,
  updateVolunteerProgram,
  deleteVolunteerProgram,
  fetchVolunteerRoles,
  fetchVolunteerRole,
  createVolunteerRole,
  updateVolunteerRole,
  deleteVolunteerRole,
  publishVolunteerRole,
  fetchVolunteerShifts,
  createVolunteerShift,
  updateVolunteerShift,
  deleteVolunteerShift,
  fetchVolunteerAssignments,
  createVolunteerAssignment,
  updateVolunteerAssignment,
  deleteVolunteerAssignment,
};
