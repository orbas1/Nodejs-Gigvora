import { apiClient } from './apiClient.js';

export async function fetchFreelancerReputation(freelancerId, options = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to load reputation data.');
  }

  const { includeDrafts = false, limitTestimonials, limitStories, signal } = options;

  return apiClient.get(`/reputation/freelancers/${freelancerId}`, {
    params: {
      includeDrafts: includeDrafts ? 'true' : undefined,
      limitTestimonials,
      limitStories,
    },
    signal,
  });
}

export async function createTestimonial(freelancerId, body, options = {}) {
  return apiClient.post(`/reputation/freelancers/${freelancerId}/testimonials`, body, options);
}

export async function createSuccessStory(freelancerId, body, options = {}) {
  return apiClient.post(`/reputation/freelancers/${freelancerId}/success-stories`, body, options);
}

export async function upsertMetric(freelancerId, body, options = {}) {
  return apiClient.post(`/reputation/freelancers/${freelancerId}/metrics`, body, options);
}

export async function createBadge(freelancerId, body, options = {}) {
  return apiClient.post(`/reputation/freelancers/${freelancerId}/badges`, body, options);
}

export async function createReviewWidget(freelancerId, body, options = {}) {
  return apiClient.post(`/reputation/freelancers/${freelancerId}/widgets`, body, options);
}

export async function fetchFreelancerReviews(freelancerId, params = {}, options = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to load reviews.');
  }

  const { signal } = options;
  const normalizedParams = { ...params };

  if (Array.isArray(normalizedParams.tags)) {
    normalizedParams.tags = normalizedParams.tags.join(',');
  }

  return apiClient.get(`/reputation/freelancers/${freelancerId}/reviews`, {
    params: normalizedParams,
    signal,
  });
}

export async function createFreelancerReview(freelancerId, body, options = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to create a review.');
  }
  return apiClient.post(`/reputation/freelancers/${freelancerId}/reviews`, body, options);
}

export async function updateFreelancerReview(freelancerId, reviewId, body, options = {}) {
  if (!freelancerId || !reviewId) {
    throw new Error('freelancerId and reviewId are required to update a review.');
  }
  return apiClient.put(`/reputation/freelancers/${freelancerId}/reviews/${reviewId}`, body, options);
}

export async function deleteFreelancerReview(freelancerId, reviewId, options = {}) {
  if (!freelancerId || !reviewId) {
    throw new Error('freelancerId and reviewId are required to delete a review.');
  }
  return apiClient.delete(`/reputation/freelancers/${freelancerId}/reviews/${reviewId}`, options);
}

export async function updateReferenceSettings(freelancerId, settings, options = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to update reference settings.');
  }

  return apiClient.put(`/reputation/freelancers/${freelancerId}/references/settings`, settings, options);
}

export async function requestReferenceInvite(freelancerId, payload, options = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to request a reference invite.');
  }
  return apiClient.post(`/reputation/freelancers/${freelancerId}/references/requests`, payload, options);
}

export async function verifyReference(freelancerId, referenceId, body = {}, options = {}) {
  if (!freelancerId || !referenceId) {
    throw new Error('freelancerId and referenceId are required to verify a reference.');
  }
  return apiClient.post(`/reputation/freelancers/${freelancerId}/references/${referenceId}/verify`, body, options);
}

export default {
  fetchFreelancerReputation,
  createTestimonial,
  createSuccessStory,
  upsertMetric,
  createBadge,
  createReviewWidget,
  fetchFreelancerReviews,
  createFreelancerReview,
  updateFreelancerReview,
  deleteFreelancerReview,
  updateReferenceSettings,
  requestReferenceInvite,
  verifyReference,
};

