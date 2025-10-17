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

const freelancerNetworkingService = {
  getFreelancerNetworkingDashboard,
  bookFreelancerNetworkingSession,
  updateFreelancerNetworkingSignup,
  listFreelancerNetworkingConnections,
  createFreelancerNetworkingConnection,
  updateFreelancerNetworkingConnection,
};

export default freelancerNetworkingService;
