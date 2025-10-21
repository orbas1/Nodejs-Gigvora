import apiClient from './apiClient.js';

export async function fetchMaintenanceStatus(options = {}) {
  return apiClient.get('/admin/maintenance', options);
}

export async function updateMaintenanceStatus(payload) {
  return apiClient.put('/admin/maintenance', payload);
}

export async function scheduleMaintenanceWindow(payload) {
  return apiClient.post('/admin/maintenance/windows', payload);
}

export async function updateMaintenanceWindow(windowId, payload) {
  if (!windowId) {
    throw new Error('windowId is required to update a maintenance window.');
  }
  return apiClient.put(`/admin/maintenance/windows/${windowId}`, payload);
}

export async function deleteMaintenanceWindow(windowId) {
  if (!windowId) {
    throw new Error('windowId is required to delete a maintenance window.');
  }
  return apiClient.delete(`/admin/maintenance/windows/${windowId}`);
}

export async function notifyMaintenanceAudience(payload) {
  return apiClient.post('/admin/maintenance/notifications', payload);
}

export default {
  fetchMaintenanceStatus,
  updateMaintenanceStatus,
  scheduleMaintenanceWindow,
  updateMaintenanceWindow,
  deleteMaintenanceWindow,
  notifyMaintenanceAudience,
};
