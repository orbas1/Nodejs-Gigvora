import { apiClient } from './apiClient.js';

export async function fetchAdminEmailOverview(options = {}) {
  return apiClient.get('/admin/email', options);
}

export async function updateAdminSmtpSettings(payload = {}, options = {}) {
  return apiClient.put('/admin/email/smtp', payload, options);
}

export async function sendAdminTestEmail(payload = {}, options = {}) {
  return apiClient.post('/admin/email/smtp/test', payload, options);
}

export async function fetchAdminEmailTemplates(params = {}, options = {}) {
  const response = await apiClient.get('/admin/email/templates', { params, ...options });
  return Array.isArray(response?.templates) ? response.templates : [];
}

export async function createAdminEmailTemplate(payload = {}, options = {}) {
  return apiClient.post('/admin/email/templates', payload, options);
}

export async function updateAdminEmailTemplate(templateId, payload = {}, options = {}) {
  if (!templateId) {
    throw new Error('templateId is required');
  }
  return apiClient.put(`/admin/email/templates/${templateId}`, payload, options);
}

export async function deleteAdminEmailTemplate(templateId, options = {}) {
  if (!templateId) {
    throw new Error('templateId is required');
  }
  return apiClient.delete(`/admin/email/templates/${templateId}`, options);
}

export default {
  fetchAdminEmailOverview,
  updateAdminSmtpSettings,
  sendAdminTestEmail,
  fetchAdminEmailTemplates,
  createAdminEmailTemplate,
  updateAdminEmailTemplate,
  deleteAdminEmailTemplate,
};
