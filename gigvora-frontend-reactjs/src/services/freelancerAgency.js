import { apiClient } from './apiClient.js';

export async function fetchFreelancerAgencyCollaborations(
  freelancerId,
  { lookbackDays, includeInactive, signal } = {},
) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to load agency collaborations.');
  }

  return apiClient.get(`/freelancers/${freelancerId}/agency-collaborations`, {
    signal,
    params: {
      lookbackDays: lookbackDays ?? undefined,
      includeInactive: includeInactive ?? undefined,
    },
  });
}

export default {
  fetchFreelancerAgencyCollaborations,
};

