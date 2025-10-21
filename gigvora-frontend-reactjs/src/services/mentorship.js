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

export function createMentorHubUpdate(payload) {
  return apiClient.post('/mentors/hub/updates', payload, { headers: mentorRoleHeaders });
}

export function updateMentorHubUpdate(updateId, payload) {
  return apiClient.put(`/mentors/hub/updates/${updateId}`, payload, { headers: mentorRoleHeaders });
}

export function deleteMentorHubUpdate(updateId) {
  return apiClient.delete(`/mentors/hub/updates/${updateId}`, { headers: mentorRoleHeaders });
}

export function createMentorHubAction(payload) {
  return apiClient.post('/mentors/hub/actions', payload, { headers: mentorRoleHeaders });
}

export function updateMentorHubAction(actionId, payload) {
  return apiClient.put(`/mentors/hub/actions/${actionId}`, payload, { headers: mentorRoleHeaders });
}

export function deleteMentorHubAction(actionId) {
  return apiClient.delete(`/mentors/hub/actions/${actionId}`, { headers: mentorRoleHeaders });
}

export function updateMentorHubSpotlight(payload) {
  return apiClient.put('/mentors/hub/spotlight', payload, { headers: mentorRoleHeaders });
}

export function createMentorHubResource(payload) {
  return apiClient.post('/mentors/hub/resources', payload, { headers: mentorRoleHeaders });
}

export function updateMentorHubResource(resourceId, payload) {
  return apiClient.put(`/mentors/hub/resources/${resourceId}`, payload, { headers: mentorRoleHeaders });
}

export function deleteMentorHubResource(resourceId) {
  return apiClient.delete(`/mentors/hub/resources/${resourceId}`, { headers: mentorRoleHeaders });
}

export function createMentorCreationItem(payload) {
  return apiClient.post('/mentors/creation-studio/items', payload, { headers: mentorRoleHeaders });
}

export function updateMentorCreationItem(itemId, payload) {
  return apiClient.put(`/mentors/creation-studio/items/${itemId}`, payload, { headers: mentorRoleHeaders });
}

export function deleteMentorCreationItem(itemId) {
  return apiClient.delete(`/mentors/creation-studio/items/${itemId}`, { headers: mentorRoleHeaders });
}

export function publishMentorCreationItem(itemId, payload = {}) {
  return apiClient.post(`/mentors/creation-studio/items/${itemId}/publish`, payload, { headers: mentorRoleHeaders });
}

export function createMentorMetricWidget(payload) {
  return apiClient.post('/mentors/metrics/widgets', payload, { headers: mentorRoleHeaders });
}

export function updateMentorMetricWidget(widgetId, payload) {
  return apiClient.put(`/mentors/metrics/widgets/${widgetId}`, payload, { headers: mentorRoleHeaders });
}

export function deleteMentorMetricWidget(widgetId) {
  return apiClient.delete(`/mentors/metrics/widgets/${widgetId}`, { headers: mentorRoleHeaders });
}

export function generateMentorMetricsReport(payload = {}) {
  return apiClient.post('/mentors/metrics/report', payload, { headers: mentorRoleHeaders });
}

export function updateMentorSettings(payload) {
  return apiClient.put('/mentors/settings', payload, { headers: mentorRoleHeaders });
}

export function updateMentorSystemPreferences(payload) {
  return apiClient.put('/mentors/system-preferences', payload, { headers: mentorRoleHeaders });
}

export function rotateMentorApiKey() {
  return apiClient.post('/mentors/system-preferences/api-key/rotate', {}, { headers: mentorRoleHeaders });
}

export function createMentorOrder(payload) {
  return apiClient.post('/mentors/orders', payload, { headers: mentorRoleHeaders });
}

export function updateMentorOrder(orderId, payload) {
  return apiClient.put(`/mentors/orders/${orderId}`, payload, { headers: mentorRoleHeaders });
}

export function deleteMentorOrder(orderId) {
  return apiClient.delete(`/mentors/orders/${orderId}`, { headers: mentorRoleHeaders });
}

export function createMentorAdCampaign(payload) {
  return apiClient.post('/mentors/ads/campaigns', payload, { headers: mentorRoleHeaders });
}

export function updateMentorAdCampaign(campaignId, payload) {
  return apiClient.put(`/mentors/ads/campaigns/${campaignId}`, payload, { headers: mentorRoleHeaders });
}

export function deleteMentorAdCampaign(campaignId) {
  return apiClient.delete(`/mentors/ads/campaigns/${campaignId}`, { headers: mentorRoleHeaders });
}

export function toggleMentorAdCampaign(campaignId, payload) {
  return apiClient.post(`/mentors/ads/campaigns/${campaignId}/status`, payload, { headers: mentorRoleHeaders });
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
  createMentorHubUpdate,
  updateMentorHubUpdate,
  deleteMentorHubUpdate,
  createMentorHubAction,
  updateMentorHubAction,
  deleteMentorHubAction,
  updateMentorHubSpotlight,
  createMentorHubResource,
  updateMentorHubResource,
  deleteMentorHubResource,
  createMentorCreationItem,
  updateMentorCreationItem,
  deleteMentorCreationItem,
  publishMentorCreationItem,
  createMentorMetricWidget,
  updateMentorMetricWidget,
  deleteMentorMetricWidget,
  generateMentorMetricsReport,
  updateMentorSettings,
  updateMentorSystemPreferences,
  rotateMentorApiKey,
  createMentorOrder,
  updateMentorOrder,
  deleteMentorOrder,
  createMentorAdCampaign,
  updateMentorAdCampaign,
  deleteMentorAdCampaign,
  toggleMentorAdCampaign,
};
