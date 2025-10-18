import { apiClient } from './apiClient.js';

export function fetchUserNetworkingOverview(userId, { signal } = {}) {
  if (!userId) {
    throw new Error('userId is required to load networking data.');
  }
  return apiClient.get(`/users/${userId}/networking/overview`, { signal });
}

export function listUserNetworkingBookings(userId, { signal, limit } = {}) {
  if (!userId) {
    throw new Error('userId is required to load bookings.');
  }
  return apiClient.get(`/users/${userId}/networking/bookings`, {
    params: { limit },
    signal,
  });
}

export function createUserNetworkingBooking(userId, payload) {
  if (!userId) {
    throw new Error('userId is required to create a booking.');
  }
  return apiClient.post(`/users/${userId}/networking/bookings`, payload);
}

export function updateUserNetworkingBooking(userId, bookingId, payload) {
  if (!userId) {
    throw new Error('userId is required to update a booking.');
  }
  if (!bookingId) {
    throw new Error('bookingId is required to update a booking.');
  }
  return apiClient.patch(`/users/${userId}/networking/bookings/${bookingId}`, payload);
}

export function listUserNetworkingPurchases(userId, { signal, limit } = {}) {
  if (!userId) {
    throw new Error('userId is required to load purchases.');
  }
  return apiClient.get(`/users/${userId}/networking/purchases`, {
    params: { limit },
    signal,
  });
}

export function createUserNetworkingPurchase(userId, payload) {
  if (!userId) {
    throw new Error('userId is required to create a purchase.');
  }
  return apiClient.post(`/users/${userId}/networking/purchases`, payload);
}

export function updateUserNetworkingPurchase(userId, orderId, payload) {
  if (!userId) {
    throw new Error('userId is required to update a purchase.');
  }
  if (!orderId) {
    throw new Error('orderId is required to update a purchase.');
  }
  return apiClient.patch(`/users/${userId}/networking/purchases/${orderId}`, payload);
}

export function listUserNetworkingConnections(userId, { signal, limit } = {}) {
  if (!userId) {
    throw new Error('userId is required to load connections.');
  }
  return apiClient.get(`/users/${userId}/networking/connections`, {
    params: { limit },
    signal,
  });
}

export function createUserNetworkingConnection(userId, payload) {
  if (!userId) {
    throw new Error('userId is required to create a connection.');
  }
  return apiClient.post(`/users/${userId}/networking/connections`, payload);
}

export function updateUserNetworkingConnection(userId, connectionId, payload) {
  if (!userId) {
    throw new Error('userId is required to update a connection.');
  }
  if (!connectionId) {
    throw new Error('connectionId is required to update a connection.');
  }
  return apiClient.patch(`/users/${userId}/networking/connections/${connectionId}`, payload);
}

export default {
  fetchUserNetworkingOverview,
  listUserNetworkingBookings,
  createUserNetworkingBooking,
  updateUserNetworkingBooking,
  listUserNetworkingPurchases,
  createUserNetworkingPurchase,
  updateUserNetworkingPurchase,
  listUserNetworkingConnections,
  createUserNetworkingConnection,
  updateUserNetworkingConnection,
};
