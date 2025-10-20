import { apiClient } from './apiClient.js';

export function listAdminMentors(params = {}, options = {}) {
  return apiClient.get('/admin/mentors', { params, ...options });
}

export function fetchAdminMentorStats(options = {}) {
  return apiClient.get('/admin/mentors/stats', options);
}

export function createAdminMentor(payload = {}, options = {}) {
  return apiClient.post('/admin/mentors', payload, options);
}

export function updateAdminMentor(mentorId, payload = {}, options = {}) {
  if (!mentorId) {
    throw new Error('mentorId is required');
  }
  return apiClient.put(`/admin/mentors/${mentorId}`, payload, options);
}

export function archiveAdminMentor(mentorId, options = {}) {
  if (!mentorId) {
    throw new Error('mentorId is required');
  }
  return apiClient.delete(`/admin/mentors/${mentorId}`, options);
}

export function reactivateAdminMentor(mentorId, options = {}) {
  if (!mentorId) {
    throw new Error('mentorId is required');
  }
  return apiClient.post(`/admin/mentors/${mentorId}/reactivate`, {}, options);
}

export default {
  listAdminMentors,
  fetchAdminMentorStats,
  createAdminMentor,
  updateAdminMentor,
  archiveAdminMentor,
  reactivateAdminMentor,
};
