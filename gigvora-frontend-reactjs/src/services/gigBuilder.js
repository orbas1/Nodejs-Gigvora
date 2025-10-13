import apiClient from './apiClient.js';

export async function fetchGigBuilderExperience(freelancerId, { gigId, signal } = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to load gig builder data');
  }
  const params = {};
  if (gigId) {
    params.gigId = gigId;
  }
  return apiClient.get(`/users/${freelancerId}/gig-builder`, { params, signal });
}

export default {
  fetchGigBuilderExperience,
};
