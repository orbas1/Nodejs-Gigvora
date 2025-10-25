import { apiClient } from './apiClient.js';

const BASE_PATH = '/reputation/freelancers';
const DEFAULT_COLLECTION_LIMIT = 20;
const MAX_COLLECTION_LIMIT = 100;

function ensureIdentifier(name, value) {
  if (value === null || value === undefined) {
    throw new Error(`${name} is required.`);
  }
  const normalised = `${value}`.trim();
  if (!normalised) {
    throw new Error(`${name} is required.`);
  }
  return normalised;
}

function ensureFreelancerId(freelancerId) {
  return ensureIdentifier('freelancerId', freelancerId);
}

function ensurePayload(payload) {
  if (payload == null) {
    return {};
  }
  if (typeof payload !== 'object') {
    throw new Error('Payload must be an object.');
  }
  return payload;
}

function ensureOptions(options) {
  if (options === undefined || options === null) {
    return {};
  }
  if (typeof options !== 'object') {
    throw new Error('Request options must be an object.');
  }
  const rest = { ...options };
  if (Object.prototype.hasOwnProperty.call(rest, 'params')) {
    delete rest.params;
  }
  return rest;
}

function buildFreelancerPath(freelancerId, ...segments) {
  const safeSegments = segments
    .filter((segment) => segment !== undefined && segment !== null)
    .map((segment) => `${segment}`.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment));

  const base = `${BASE_PATH}/${encodeURIComponent(ensureFreelancerId(freelancerId))}`;
  if (!safeSegments.length) {
    return base;
  }
  return `${base}/${safeSegments.join('/')}`;
}

function normaliseLimit(value, fallback = DEFAULT_COLLECTION_LIMIT) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, 1), MAX_COLLECTION_LIMIT);
}

function normaliseQueryParams(params = {}) {
  if (params === null || typeof params !== 'object') {
    throw new Error('Query parameters must be provided as an object.');
  }

  const entries = Object.entries(params)
    .map(([key, value]) => {
      if (value === undefined || value === null) {
        return [key, undefined];
      }
      if (Array.isArray(value)) {
        return [key, value.map((item) => `${item}`.trim()).filter(Boolean).join(',') || undefined];
      }
      if (typeof value === 'number') {
        return [key, Number.isFinite(value) ? value : undefined];
      }
      const trimmed = `${value}`.trim();
      return [key, trimmed.length ? trimmed : undefined];
    })
    .filter(([, value]) => value !== undefined);

  return Object.fromEntries(entries);
}

function sendFreelancerMutation(method, freelancerId, segments, payload, options) {
  const client = apiClient[method];
  if (typeof client !== 'function') {
    throw new Error(`Unsupported method: ${method}`);
  }

  const path = buildFreelancerPath(freelancerId, ...segments);
  const safeOptions = ensureOptions(options);

  if (method === 'delete') {
    return client(path, Object.keys(safeOptions).length ? safeOptions : undefined);
  }

  const body = ensurePayload(payload);
  return client(path, body, Object.keys(safeOptions).length ? safeOptions : undefined);
}

export async function fetchFreelancerReputation(freelancerId, options = {}) {
  const { includeDrafts = false, limitTestimonials, limitStories, ...rest } = options ?? {};
  const safeOptions = ensureOptions(rest);
  const { signal, ...other } = safeOptions;

  const params = {
    includeDrafts: includeDrafts ? 'true' : undefined,
    limitTestimonials: normaliseLimit(limitTestimonials, DEFAULT_COLLECTION_LIMIT),
    limitStories: normaliseLimit(limitStories, DEFAULT_COLLECTION_LIMIT),
  };

  const requestOptions = {
    params: normaliseQueryParams(params),
    ...other,
  };

  if (signal) {
    requestOptions.signal = signal;
  }

  return apiClient.get(buildFreelancerPath(freelancerId), requestOptions);
}

export async function createTestimonial(freelancerId, payload, options) {
  return sendFreelancerMutation('post', freelancerId, ['testimonials'], payload, options);
}

export async function createSuccessStory(freelancerId, payload, options) {
  return sendFreelancerMutation('post', freelancerId, ['success-stories'], payload, options);
}

export async function upsertMetric(freelancerId, payload, options) {
  return sendFreelancerMutation('post', freelancerId, ['metrics'], payload, options);
}

export async function createBadge(freelancerId, payload, options) {
  return sendFreelancerMutation('post', freelancerId, ['badges'], payload, options);
}

export async function createReviewWidget(freelancerId, payload, options) {
  return sendFreelancerMutation('post', freelancerId, ['widgets'], payload, options);
}

export async function fetchFreelancerReviews(freelancerId, params = {}, options = {}) {
  const safeParams = normaliseQueryParams({
    ...params,
    limit: normaliseLimit(params.limit, DEFAULT_COLLECTION_LIMIT),
  });
  const safeOptions = ensureOptions(options);
  const { signal, ...other } = safeOptions;
  const requestOptions = {
    params: safeParams,
    ...other,
  };
  if (signal) {
    requestOptions.signal = signal;
  }
  return apiClient.get(buildFreelancerPath(freelancerId, 'reviews'), requestOptions);
}

export async function createFreelancerReview(freelancerId, payload, options) {
  return sendFreelancerMutation('post', freelancerId, ['reviews'], payload, options);
}

export async function updateFreelancerReview(freelancerId, reviewId, payload, options) {
  return sendFreelancerMutation(
    'put',
    freelancerId,
    ['reviews', ensureIdentifier('reviewId', reviewId)],
    payload,
    options,
  );
}

export async function deleteFreelancerReview(freelancerId, reviewId, options) {
  return sendFreelancerMutation('delete', freelancerId, ['reviews', ensureIdentifier('reviewId', reviewId)], undefined, options);
}

export async function updateReferenceSettings(freelancerId, payload, options) {
  return sendFreelancerMutation('put', freelancerId, ['references', 'settings'], payload, options);
}

export async function requestReferenceInvite(freelancerId, payload, options) {
  return sendFreelancerMutation('post', freelancerId, ['references', 'requests'], payload, options);
}

export async function verifyReference(freelancerId, referenceId, payload = {}, options) {
  return sendFreelancerMutation(
    'post',
    freelancerId,
    ['references', ensureIdentifier('referenceId', referenceId), 'verify'],
    payload,
    options,
  );
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

