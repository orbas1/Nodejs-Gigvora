import { apiClient } from './apiClient.js';

function normaliseDashboardParams(input, options = {}) {
  if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
    return { params: input, options };
  }
  return {
    params: { freelancerId: input },
    options,
  };
}

export async function fetchFreelancerDashboard(input = {}, options = {}) {
  const { params, options: requestOptions } = normaliseDashboardParams(input, options);
  const { freelancerId, limit } = params;

  if (!freelancerId) {
    throw new Error('freelancerId is required to load the freelancer dashboard.');
  }

  return apiClient.get('/freelancer/dashboard', {
    params: {
      freelancerId,
      limit: limit ?? undefined,
    },
    signal: requestOptions.signal,
  });
}

export async function createFreelancerGig(payload, options = {}) {
  return apiClient.post('/freelancer/gigs', payload, options);
}

export async function updateFreelancerGig(gigId, payload, options = {}) {
  if (!gigId) {
    throw new Error('gigId is required to update a freelancer gig.');
  }
  return apiClient.put(`/freelancer/gigs/${gigId}`, payload, options);
}

export async function publishFreelancerGig(gigId, payload = {}, options = {}) {
  if (!gigId) {
    throw new Error('gigId is required to publish a freelancer gig.');
  }
  return apiClient.post(`/freelancer/gigs/${gigId}/publish`, payload, options);
}

export async function getFreelancerGig(gigId, options = {}) {
  if (!gigId) {
    throw new Error('gigId is required to fetch a freelancer gig.');
  }
  return apiClient.get(`/freelancer/gigs/${gigId}`, options);
}

export async function fetchFreelancerPurchasedGigWorkspace(freelancerId, { signal, fresh = false } = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to load purchased gigs workspace.');
  }
  const params = fresh ? { fresh: 'true' } : undefined;
  return apiClient.get(`/freelancers/${freelancerId}/purchased-gigs`, { signal, params });
}

const freelancerService = {
  fetchFreelancerDashboard,
  createFreelancerGig,
  updateFreelancerGig,
  publishFreelancerGig,
  getFreelancerGig,
  fetchFreelancerPurchasedGigWorkspace,
};

export default freelancerService;
