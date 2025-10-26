import apiClient from './apiClient.js';

export async function fetchTaxDocuments(params = {}, { signal } = {}) {
  return apiClient.get('/compliance/tax-documents', { params, signal });
}

export async function acknowledgeTaxDocument(filingId, payload = {}, { signal } = {}) {
  if (!filingId) {
    throw new Error('filingId is required to acknowledge a tax document.');
  }
  return apiClient.post(`/compliance/tax-documents/${filingId}/acknowledge`, payload, { signal });
}

export async function uploadTaxDocument(filingId, payload = {}, { signal } = {}) {
  if (!filingId) {
    throw new Error('filingId is required to upload a tax document.');
  }
  const { data, fileName, contentType } = payload;
  if (!data || !fileName || !contentType) {
    throw new Error('data, fileName, and contentType are required to upload a tax document.');
  }
  return apiClient.post(`/compliance/tax-documents/${filingId}/upload`, payload, { signal });
}

export async function downloadTaxDocument(filingId, { signal } = {}) {
  if (!filingId) {
    throw new Error('filingId is required to download a tax document.');
  }
  return apiClient.get(`/compliance/tax-documents/${filingId}/download`, { signal });
}

export async function snoozeTaxReminder(reminderId, payload = {}, { signal } = {}) {
  if (!reminderId) {
    throw new Error('reminderId is required to snooze a tax reminder.');
  }
  return apiClient.post(`/compliance/tax-reminders/${reminderId}/snooze`, payload, { signal });
}

export default {
  fetchTaxDocuments,
  acknowledgeTaxDocument,
  uploadTaxDocument,
  downloadTaxDocument,
  snoozeTaxReminder,
};
