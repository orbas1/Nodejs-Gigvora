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

export function createMentorClient(payload) {
  return apiClient.post('/mentors/clients', payload, { headers: mentorRoleHeaders });
}

export function updateMentorClient(clientId, payload) {
  return apiClient.put(`/mentors/clients/${clientId}`, payload, { headers: mentorRoleHeaders });
}

export function deleteMentorClient(clientId) {
  return apiClient.delete(`/mentors/clients/${clientId}`, { headers: mentorRoleHeaders });
}

export function createMentorEvent(payload) {
  return apiClient.post('/mentors/calendar/events', payload, { headers: mentorRoleHeaders });
}

export function updateMentorEvent(eventId, payload) {
  return apiClient.put(`/mentors/calendar/events/${eventId}`, payload, { headers: mentorRoleHeaders });
}

export function deleteMentorEvent(eventId) {
  return apiClient.delete(`/mentors/calendar/events/${eventId}`, { headers: mentorRoleHeaders });
}

export function createMentorSupportTicket(payload) {
  return apiClient.post('/mentors/support/tickets', payload, { headers: mentorRoleHeaders });
}

export function updateMentorSupportTicket(ticketId, payload) {
  return apiClient.put(`/mentors/support/tickets/${ticketId}`, payload, { headers: mentorRoleHeaders });
}

export function deleteMentorSupportTicket(ticketId) {
  return apiClient.delete(`/mentors/support/tickets/${ticketId}`, { headers: mentorRoleHeaders });
}

export function createMentorMessage(payload) {
  return apiClient.post('/mentors/inbox/messages', payload, { headers: mentorRoleHeaders });
}

export function updateMentorMessage(messageId, payload) {
  return apiClient.put(`/mentors/inbox/messages/${messageId}`, payload, { headers: mentorRoleHeaders });
}

export function deleteMentorMessage(messageId) {
  return apiClient.delete(`/mentors/inbox/messages/${messageId}`, { headers: mentorRoleHeaders });
}

export function updateMentorVerificationStatus(payload) {
  return apiClient.put('/mentors/verification/status', payload, { headers: mentorRoleHeaders });
}

export function createMentorVerificationDocument(payload) {
  return apiClient.post('/mentors/verification/documents', payload, { headers: mentorRoleHeaders });
}

export function updateMentorVerificationDocument(documentId, payload) {
  return apiClient.put(`/mentors/verification/documents/${documentId}`, payload, { headers: mentorRoleHeaders });
}

export function deleteMentorVerificationDocument(documentId) {
  return apiClient.delete(`/mentors/verification/documents/${documentId}`, { headers: mentorRoleHeaders });
}

export function createMentorWalletTransaction(payload) {
  return apiClient.post('/mentors/wallet/transactions', payload, { headers: mentorRoleHeaders });
}

export function updateMentorWalletTransaction(transactionId, payload) {
  return apiClient.put(`/mentors/wallet/transactions/${transactionId}`, payload, { headers: mentorRoleHeaders });
}

export function deleteMentorWalletTransaction(transactionId) {
  return apiClient.delete(`/mentors/wallet/transactions/${transactionId}`, { headers: mentorRoleHeaders });
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
  createMentorClient,
  updateMentorClient,
  deleteMentorClient,
  createMentorEvent,
  updateMentorEvent,
  deleteMentorEvent,
  createMentorSupportTicket,
  updateMentorSupportTicket,
  deleteMentorSupportTicket,
  createMentorMessage,
  updateMentorMessage,
  deleteMentorMessage,
  updateMentorVerificationStatus,
  createMentorVerificationDocument,
  updateMentorVerificationDocument,
  deleteMentorVerificationDocument,
  createMentorWalletTransaction,
  updateMentorWalletTransaction,
  deleteMentorWalletTransaction,
  createMentorInvoice,
  updateMentorInvoice,
  deleteMentorInvoice,
  createMentorPayout,
  updateMentorPayout,
  deleteMentorPayout,
};
