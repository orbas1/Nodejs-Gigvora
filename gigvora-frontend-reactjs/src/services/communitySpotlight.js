import { apiClient } from './apiClient.js';

export async function fetchCommunitySpotlight({ freelancerId, profileId, includeDraft = false, signal } = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to load the community spotlight.');
  }

  const params = {};
  if (profileId) {
    params.profileId = profileId;
  }
  if (includeDraft) {
    params.includeDraft = 'true';
  }

  return apiClient.get(`/freelancers/${freelancerId}/community-spotlight`, { params, signal });
}

export default {
  fetchCommunitySpotlight,
};
