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

export function createMentorBooking(payload) {
  return apiClient.post('/mentors/bookings', payload, { headers: mentorRoleHeaders });
}

export function updateMentorBooking(bookingId, payload) {
  return apiClient.put(`/mentors/bookings/${bookingId}`, payload, { headers: mentorRoleHeaders });
}

export function deleteMentorBooking(bookingId) {
  return apiClient.delete(`/mentors/bookings/${bookingId}`, { headers: mentorRoleHeaders });
}

export function createMentorInvoice(payload) {
  return apiClient.post('/mentors/finance/invoices', payload, { headers: mentorRoleHeaders });
}

export function updateMentorInvoice(invoiceId, payload) {
  return apiClient.put(`/mentors/finance/invoices/${invoiceId}`, payload, { headers: mentorRoleHeaders });
}

export function deleteMentorInvoice(invoiceId) {
  return apiClient.delete(`/mentors/finance/invoices/${invoiceId}`, { headers: mentorRoleHeaders });
}

export function createMentorPayout(payload) {
  return apiClient.post('/mentors/finance/payouts', payload, { headers: mentorRoleHeaders });
}

export function updateMentorPayout(payoutId, payload) {
  return apiClient.put(`/mentors/finance/payouts/${payoutId}`, payload, { headers: mentorRoleHeaders });
}

export function deleteMentorPayout(payoutId) {
  return apiClient.delete(`/mentors/finance/payouts/${payoutId}`, { headers: mentorRoleHeaders });
}

export default {
  submitMentorProfile,
  fetchMentorDashboard,
  saveMentorAvailability,
  saveMentorPackages,
  createMentorBooking,
  updateMentorBooking,
  deleteMentorBooking,
  createMentorInvoice,
  updateMentorInvoice,
  deleteMentorInvoice,
  createMentorPayout,
  updateMentorPayout,
  deleteMentorPayout,
};
