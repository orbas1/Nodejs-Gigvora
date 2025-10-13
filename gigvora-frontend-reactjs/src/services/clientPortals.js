import apiClient from './apiClient.js';

export async function fetchClientPortalDashboard(portalId, { signal } = {}) {
  if (portalId == null || portalId === '') {
    throw new Error('portalId is required');
  }
  const normalizedId = typeof portalId === 'number' ? portalId : String(portalId).trim();
  if (!normalizedId) {
    throw new Error('portalId is required');
  }
  return apiClient.get(`/client-portals/${normalizedId}/dashboard`, { signal });
}

export default {
  fetchClientPortalDashboard,
};
