import {
  getFreelancerReputationOverview,
  createTestimonial,
  createSuccessStory,
  upsertMetric,
  createBadge,
  createReviewWidget,
} from '../services/reputationService.js';

function parseBoolean(value, fallback = false) {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalized = `${value}`.trim().toLowerCase();
  return ['1', 'true', 'yes', 'y'].includes(normalized)
    ? true
    : ['0', 'false', 'no', 'n'].includes(normalized)
    ? false
    : fallback;
}

function parseLimit(value, fallback) {
  if (value == null) {
    return fallback;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return fallback;
  }
  return numeric;
}

export async function getFreelancerReputation(req, res) {
  const { freelancerId } = req.params;
  const { includeDrafts, limitTestimonials, limitStories } = req.query ?? {};

  const payload = await getFreelancerReputationOverview({
    freelancerId,
    includeDrafts: parseBoolean(includeDrafts, false),
    limitTestimonials: parseLimit(limitTestimonials, 12),
    limitStories: parseLimit(limitStories, 8),
  });

  res.json(payload);
}

export async function postTestimonial(req, res) {
  const { freelancerId } = req.params;
  const result = await createTestimonial(freelancerId, req.body ?? {});
  res.status(201).json(result);
}

export async function postSuccessStory(req, res) {
  const { freelancerId } = req.params;
  const result = await createSuccessStory(freelancerId, req.body ?? {});
  res.status(201).json(result);
}

export async function postMetric(req, res) {
  const { freelancerId } = req.params;
  const result = await upsertMetric(freelancerId, req.body ?? {});
  res.status(201).json(result);
}

export async function postBadge(req, res) {
  const { freelancerId } = req.params;
  const result = await createBadge(freelancerId, req.body ?? {});
  res.status(201).json(result);
}

export async function postReviewWidget(req, res) {
  const { freelancerId } = req.params;
  const result = await createReviewWidget(freelancerId, req.body ?? {});
  res.status(201).json(result);
}

export default {
  getFreelancerReputation,
  postTestimonial,
  postSuccessStory,
  postMetric,
  postBadge,
  postReviewWidget,
};

