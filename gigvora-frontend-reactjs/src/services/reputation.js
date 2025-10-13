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

export default {
  fetchFreelancerReputation,
  createTestimonial,
  createSuccessStory,
  upsertMetric,
  createBadge,
  createReviewWidget,
};

