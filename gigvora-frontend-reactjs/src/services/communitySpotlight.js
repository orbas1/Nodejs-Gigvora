import { apiClient } from './apiClient.js';

function ensureId(value, message) {
  if (value === undefined || value === null || `${value}`.trim().length === 0) {
    throw new Error(message);
  }
  return typeof value === 'string' ? value.trim() : value;
}

export async function fetchCommunitySpotlight({ freelancerId, profileId, includeDraft = false, signal } = {}) {
  const resolvedFreelancerId = ensureId(freelancerId, 'freelancerId is required to load the community spotlight.');

  const params = {};
  if (profileId) {
    params.profileId = typeof profileId === 'string' ? profileId.trim() : profileId;
  }
  if (includeDraft) {
    params.includeDraft = 'true';
  }

  return apiClient.get(`/freelancers/${resolvedFreelancerId}/community-spotlight`, { params, signal });
}

export default {
  fetchCommunitySpotlight,
};
