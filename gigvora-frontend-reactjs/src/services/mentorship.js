import { apiClient } from './apiClient.js';

export function submitMentorProfile(payload) {
  return apiClient.post('/mentors/profile', payload);
}

export function fetchMentorDashboard({ lookbackDays = 30 } = {}) {
  return apiClient.get('/mentors/dashboard', {
    params: {
      lookbackDays,
    },
  });
}

export function saveMentorAvailability(slots) {
  return apiClient.post('/mentors/availability', { slots });
}

export function saveMentorPackages(packages) {
  return apiClient.post('/mentors/packages', { packages });
}

export default {
  submitMentorProfile,
  fetchMentorDashboard,
  saveMentorAvailability,
  saveMentorPackages,
};
