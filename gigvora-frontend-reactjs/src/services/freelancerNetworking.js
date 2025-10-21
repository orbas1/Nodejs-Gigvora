import { apiClient } from './apiClient.js';

export function getFreelancerNetworkingDashboard(freelancerId, { lookbackDays, limitConnections, signal } = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to load networking insights.');
  }
  const params = {};
  if (lookbackDays != null) params.lookbackDays = lookbackDays;
  if (limitConnections != null) params.limitConnections = limitConnections;
  return apiClient.get(`/freelancers/${freelancerId}/networking/dashboard`, { params, signal });
}

export function bookFreelancerNetworkingSession(freelancerId, sessionId, payload = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to book a networking session.');
  }
  if (!sessionId) {
    throw new Error('sessionId is required to book a networking session.');
  }
  return apiClient.post(`/freelancers/${freelancerId}/networking/sessions/${sessionId}/book`, payload);
}

export function updateFreelancerNetworkingSignup(freelancerId, signupId, payload = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to update networking registrations.');
  }
  if (!signupId) {
    throw new Error('signupId is required to update networking registrations.');
  }
  return apiClient.patch(`/freelancers/${freelancerId}/networking/signups/${signupId}`, payload);
}

export function deleteFreelancerNetworkingSignup(freelancerId, signupId, payload = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to cancel networking registrations.');
  }
  if (!signupId) {
    throw new Error('signupId is required to cancel networking registrations.');
  }
  return apiClient.delete(`/freelancers/${freelancerId}/networking/signups/${signupId}`, { data: payload });
}

export function listFreelancerNetworkingConnections(freelancerId, { limit, signal } = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to load networking connections.');
  }
  const params = {};
  if (limit != null) params.limit = limit;
  return apiClient.get(`/freelancers/${freelancerId}/networking/connections`, { params, signal });
}

export function createFreelancerNetworkingConnection(freelancerId, payload = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to create networking connections.');
  }
  return apiClient.post(`/freelancers/${freelancerId}/networking/connections`, payload);
}

export function updateFreelancerNetworkingConnection(freelancerId, connectionId, payload = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to update networking connections.');
  }
  if (!connectionId) {
    throw new Error('connectionId is required to update networking connections.');
  }
  return apiClient.patch(`/freelancers/${freelancerId}/networking/connections/${connectionId}`, payload);
}

export function deleteFreelancerNetworkingConnection(freelancerId, connectionId) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to delete networking connections.');
  }
  if (!connectionId) {
    throw new Error('connectionId is required to delete networking connections.');
  }
  return apiClient.delete(`/freelancers/${freelancerId}/networking/connections/${connectionId}`);
}

export function getFreelancerNetworkingMetrics(freelancerId, { lookbackDays, limitConnections, signal } = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to load networking metrics.');
  }
  const params = {};
  if (lookbackDays != null) params.lookbackDays = lookbackDays;
  if (limitConnections != null) params.limitConnections = limitConnections;
  return apiClient.get(`/freelancers/${freelancerId}/networking/metrics`, { params, signal });
}

export function listFreelancerNetworkingOrders(freelancerId, { limit, signal } = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to load networking orders.');
  }
  const params = {};
  if (limit != null) params.limit = limit;
  return apiClient.get(`/freelancers/${freelancerId}/networking/orders`, { params, signal });
}

export function createFreelancerNetworkingOrder(freelancerId, payload = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to create networking orders.');
  }
  return apiClient.post(`/freelancers/${freelancerId}/networking/orders`, payload);
}

export function updateFreelancerNetworkingOrder(freelancerId, orderId, payload = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to update networking orders.');
  }
  if (!orderId) {
    throw new Error('orderId is required to update networking orders.');
  }
  return apiClient.patch(`/freelancers/${freelancerId}/networking/orders/${orderId}`, payload);
}

export function deleteFreelancerNetworkingOrder(freelancerId, orderId) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to delete networking orders.');
  }
  if (!orderId) {
    throw new Error('orderId is required to delete networking orders.');
  }
  return apiClient.delete(`/freelancers/${freelancerId}/networking/orders/${orderId}`);
}

export function getFreelancerNetworkingSettings(freelancerId, { signal } = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to load networking settings.');
  }
  return apiClient.get(`/freelancers/${freelancerId}/networking/settings`, { signal });
}

export function updateFreelancerNetworkingSettings(freelancerId, payload = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to update networking settings.');
  }
  return apiClient.patch(`/freelancers/${freelancerId}/networking/settings`, payload);
}

export function updateFreelancerNetworkingPreferences(freelancerId, payload = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to update networking preferences.');
  }
  return apiClient.patch(`/freelancers/${freelancerId}/networking/preferences`, payload);
}

export function listFreelancerNetworkingAds(freelancerId, { signal } = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to load networking ads.');
  }
  return apiClient.get(`/freelancers/${freelancerId}/networking/ads`, { signal });
}

export function createFreelancerNetworkingAd(freelancerId, payload = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to create networking campaigns.');
  }
  return apiClient.post(`/freelancers/${freelancerId}/networking/ads`, payload);
}

export function updateFreelancerNetworkingAd(freelancerId, campaignId, payload = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to update networking campaigns.');
  }
  if (!campaignId) {
    throw new Error('campaignId is required to update networking campaigns.');
  }
  return apiClient.patch(`/freelancers/${freelancerId}/networking/ads/${campaignId}`, payload);
}

export function deleteFreelancerNetworkingAd(freelancerId, campaignId) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to delete networking campaigns.');
  }
  if (!campaignId) {
    throw new Error('campaignId is required to delete networking campaigns.');
  }
  return apiClient.delete(`/freelancers/${freelancerId}/networking/ads/${campaignId}`);
}

const freelancerNetworkingService = {
  getFreelancerNetworkingDashboard,
  bookFreelancerNetworkingSession,
  updateFreelancerNetworkingSignup,
  deleteFreelancerNetworkingSignup,
  listFreelancerNetworkingConnections,
  createFreelancerNetworkingConnection,
  updateFreelancerNetworkingConnection,
  deleteFreelancerNetworkingConnection,
  getFreelancerNetworkingMetrics,
  listFreelancerNetworkingOrders,
  createFreelancerNetworkingOrder,
  updateFreelancerNetworkingOrder,
  deleteFreelancerNetworkingOrder,
  getFreelancerNetworkingSettings,
  updateFreelancerNetworkingSettings,
  updateFreelancerNetworkingPreferences,
  listFreelancerNetworkingAds,
  createFreelancerNetworkingAd,
  updateFreelancerNetworkingAd,
  deleteFreelancerNetworkingAd,
};

export default freelancerNetworkingService;
