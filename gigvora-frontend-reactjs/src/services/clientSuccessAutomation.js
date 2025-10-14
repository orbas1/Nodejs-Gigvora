import { apiClient } from './apiClient.js';

export async function fetchFreelancerClientSuccessOverview(freelancerId, { signal } = {}) {
  if (freelancerId == null) {
    throw new Error('freelancerId is required');
  }
  return apiClient.get(`/freelancers/${freelancerId}/client-success/overview`, { signal });
}

export async function createClientSuccessPlaybook(freelancerId, payload) {
  if (freelancerId == null) {
    throw new Error('freelancerId is required');
  }
  return apiClient.post(`/freelancers/${freelancerId}/client-success/playbooks`, payload);
}

export async function enrollClientSuccessPlaybook(freelancerId, playbookId, payload) {
  if (freelancerId == null || playbookId == null) {
    throw new Error('freelancerId and playbookId are required');
  }
  return apiClient.post(
    `/freelancers/${freelancerId}/client-success/playbooks/${playbookId}/enrollments`,
    payload,
  );
}

export async function createClientSuccessReferral(freelancerId, gigId, payload) {
  if (freelancerId == null || gigId == null) {
    throw new Error('freelancerId and gigId are required');
  }
  return apiClient.post(
    `/freelancers/${freelancerId}/client-success/gigs/${gigId}/referrals`,
    payload,
  );
}

export async function createClientSuccessAffiliateLink(freelancerId, gigId, payload) {
  if (freelancerId == null || gigId == null) {
    throw new Error('freelancerId and gigId are required');
  }
  return apiClient.post(
    `/freelancers/${freelancerId}/client-success/gigs/${gigId}/affiliate-links`,
    payload,
  );
}

export default {
  fetchFreelancerClientSuccessOverview,
  createClientSuccessPlaybook,
  enrollClientSuccessPlaybook,
  createClientSuccessReferral,
  createClientSuccessAffiliateLink,
};
