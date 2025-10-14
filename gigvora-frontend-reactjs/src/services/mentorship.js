import { apiClient } from './apiClient.js';

const mentorRoleHeaders = {
  'X-Workspace-Roles': 'mentor',
};

export function submitMentorProfile(payload) {
  return apiClient.post('/mentors/profile', payload, { headers: mentorRoleHeaders });
}

export function fetchMentorDashboard({ lookbackDays = 30 } = {}) {
  return apiClient.get('/mentors/dashboard', {
    params: {
      lookbackDays,
    },
    headers: mentorRoleHeaders,
  });
}

export function saveMentorAvailability(slots) {
  return apiClient.post('/mentors/availability', { slots }, { headers: mentorRoleHeaders });
}

export function saveMentorPackages(packages) {
  return apiClient.post('/mentors/packages', { packages }, { headers: mentorRoleHeaders });
}

export default {
  submitMentorProfile,
  fetchMentorDashboard,
  saveMentorAvailability,
  saveMentorPackages,
};
