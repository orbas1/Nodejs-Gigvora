import {
  getFreelancerReputationOverview,
  createTestimonial,
  createSuccessStory,
  upsertMetric,
  createBadge,
  createReviewWidget,
} from '../services/reputationService.js';
import {
  listFreelancerReviews,
  createFreelancerReview,
  updateFreelancerReview,
  deleteFreelancerReview,
} from '../services/freelancerReviewService.js';

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

function normalizeTagsQuery(value) {
  if (value == null) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value;
  }
  return `${value}`
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function getFreelancerReviews(req, res) {
  const { freelancerId } = req.params;
  const { page, pageSize, sort, status, highlighted, minRating, maxRating, query, tags } = req.query ?? {};
  const payload = await listFreelancerReviews({
    freelancerId,
    page,
    pageSize,
    sort,
    status,
    highlighted,
    minRating,
    maxRating,
    query,
    tags: normalizeTagsQuery(tags),
  });
  res.json(payload);
}

export async function postFreelancerReview(req, res) {
  const { freelancerId } = req.params;
  const result = await createFreelancerReview(freelancerId, req.body ?? {});
  res.status(201).json(result);
}

export async function putFreelancerReview(req, res) {
  const { freelancerId, reviewId } = req.params;
  const result = await updateFreelancerReview(freelancerId, reviewId, req.body ?? {});
  res.json(result);
}

export async function removeFreelancerReview(req, res) {
  const { freelancerId, reviewId } = req.params;
  await deleteFreelancerReview(freelancerId, reviewId);
  res.status(204).send();
}

export default {
  getFreelancerReputation,
  postTestimonial,
  postSuccessStory,
  postMetric,
  postBadge,
  postReviewWidget,
  getFreelancerReviews,
  postFreelancerReview,
  putFreelancerReview,
  removeFreelancerReview,
};

