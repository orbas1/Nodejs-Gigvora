import apiClient from './apiClient.js';

export async function fetchMaintenanceStatus({ signal, params } = {}) {
  return apiClient.get('/admin/maintenance', { signal, params });
}

export async function updateMaintenanceStatus(payload = {}, { signal } = {}) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('A payload is required to update maintenance status.');
  }
  return apiClient.put('/admin/maintenance', payload, { signal });
}

export async function scheduleMaintenanceWindow(payload = {}, { signal } = {}) {
  if (!payload.startsAt || !payload.endsAt) {
    throw new Error('startsAt and endsAt are required to schedule a maintenance window.');
  }
  return apiClient.post('/admin/maintenance/windows', payload, { signal });
}

export async function updateMaintenanceWindow(windowId, payload = {}, { signal } = {}) {
  if (!windowId) {
    throw new Error('windowId is required to update a maintenance window.');
  }
  return apiClient.put(`/admin/maintenance/windows/${windowId}`, payload, { signal });
}

export async function deleteMaintenanceWindow(windowId, { signal } = {}) {
  if (!windowId) {
    throw new Error('windowId is required to delete a maintenance window.');
  }
  return apiClient.delete(`/admin/maintenance/windows/${windowId}`, { signal });
}

export async function notifyMaintenanceAudience(payload = {}, { signal } = {}) {
  if (!payload.channels || !Array.isArray(payload.channels) || payload.channels.length === 0) {
    throw new Error('channels are required to send a maintenance notification.');
  }
  return apiClient.post('/admin/maintenance/notifications', payload, { signal });
}

export default {
  fetchMaintenanceStatus,
  updateMaintenanceStatus,
  scheduleMaintenanceWindow,
  updateMaintenanceWindow,
  deleteMaintenanceWindow,
  notifyMaintenanceAudience,
};
