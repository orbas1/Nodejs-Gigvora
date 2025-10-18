import apiClient from './apiClient.js';

function sanitizeParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && `${value}`.length > 0),
  );
}

export function fetchAgencyNetworkingOverview({ workspaceId, workspaceSlug, limit } = {}, { signal } = {}) {
  const params = sanitizeParams({ workspaceId, workspaceSlug, limit });
  return apiClient.get('/agency/networking/overview', { params, signal });
}

export function listAgencyNetworkingBookings({ workspaceId, workspaceSlug, limit } = {}, { signal } = {}) {
  const params = sanitizeParams({ workspaceId, workspaceSlug, limit });
  return apiClient.get('/agency/networking/bookings', { params, signal });
}

export function createAgencyNetworkingBooking(payload, { workspaceId, workspaceSlug } = {}, { signal } = {}) {
  const params = sanitizeParams({ workspaceId, workspaceSlug });
  return apiClient.post('/agency/networking/bookings', { ...payload, ...params }, { signal });
}

export function updateAgencyNetworkingBooking(bookingId, payload, { workspaceId, workspaceSlug } = {}, { signal } = {}) {
  const params = sanitizeParams({ workspaceId, workspaceSlug });
  return apiClient.patch(`/agency/networking/bookings/${bookingId}`, { ...payload, ...params }, { signal });
}

export function listAgencyNetworkingPurchases({ workspaceId, workspaceSlug, limit } = {}, { signal } = {}) {
  const params = sanitizeParams({ workspaceId, workspaceSlug, limit });
  return apiClient.get('/agency/networking/purchases', { params, signal });
}

export function createAgencyNetworkingPurchase(payload, { workspaceId, workspaceSlug } = {}, { signal } = {}) {
  const params = sanitizeParams({ workspaceId, workspaceSlug });
  return apiClient.post('/agency/networking/purchases', { ...payload, ...params }, { signal });
}

export function updateAgencyNetworkingPurchase(orderId, payload, { workspaceId, workspaceSlug } = {}, { signal } = {}) {
  const params = sanitizeParams({ workspaceId, workspaceSlug });
  return apiClient.patch(`/agency/networking/purchases/${orderId}`, { ...payload, ...params }, { signal });
}

export function listAgencyNetworkingConnections({ workspaceId, workspaceSlug, limit } = {}, { signal } = {}) {
  const params = sanitizeParams({ workspaceId, workspaceSlug, limit });
  return apiClient.get('/agency/networking/connections', { params, signal });
}

export function createAgencyNetworkingConnection(payload, { workspaceId, workspaceSlug } = {}, { signal } = {}) {
  const params = sanitizeParams({ workspaceId, workspaceSlug });
  return apiClient.post('/agency/networking/connections', { ...payload, ...params }, { signal });
}

export function updateAgencyNetworkingConnection(connectionId, payload, { workspaceId, workspaceSlug } = {}, { signal } = {}) {
  const params = sanitizeParams({ workspaceId, workspaceSlug });
  return apiClient.patch(`/agency/networking/connections/${connectionId}`, { ...payload, ...params }, { signal });
}

export default {
  fetchAgencyNetworkingOverview,
  listAgencyNetworkingBookings,
  createAgencyNetworkingBooking,
  updateAgencyNetworkingBooking,
  listAgencyNetworkingPurchases,
  createAgencyNetworkingPurchase,
  updateAgencyNetworkingPurchase,
  listAgencyNetworkingConnections,
  createAgencyNetworkingConnection,
  updateAgencyNetworkingConnection,
};
