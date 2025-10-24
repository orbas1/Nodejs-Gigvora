import {
  getFreelancerReputationOverview,
  createTestimonial,
  createSuccessStory,
  upsertMetric,
  createBadge,
  createReviewWidget,
  generateReviewWidgetEmbed,
} from '../services/reputationService.js';
import {
  listFreelancerReviews,
  createFreelancerReview,
  updateFreelancerReview,
  deleteFreelancerReview,
} from '../services/freelancerReviewService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions, resolveRequestUserId } from '../utils/requestContext.js';

const VIEW_PERMISSION_KEYS = new Set(['reputation:view', 'reputation:manage', 'marketing:reputation:view']);
const MANAGE_PERMISSION_KEYS = new Set(['reputation:manage', 'marketing:reputation:manage']);
const VIEW_ROLE_KEYS = new Set([
  'admin',
  'platform_admin',
  'operations',
  'operations_lead',
  'marketing',
  'growth',
  'success',
  'support',
  'reputation',
]);
const MANAGE_ROLE_KEYS = new Set(['admin', 'platform_admin', 'marketing', 'operations_lead', 'reputation']);

function normalise(value) {
  if (!value) {
    return null;
  }
  return `${value}`.trim().toLowerCase();
}

function collectRoles(req) {
  const roles = new Set();
  const primary = normalise(req.user?.type ?? req.user?.role);
  if (primary) {
    roles.add(primary);
  }
  if (Array.isArray(req.user?.roles)) {
    req.user.roles.forEach((role) => {
      const normalised = normalise(role);
      if (normalised) {
        roles.add(normalised);
      }
    });
  }
  const headerRoles = req.headers?.['x-roles'];
  if (typeof headerRoles === 'string') {
    headerRoles
      .split(',')
      .map((entry) => normalise(entry))
      .filter(Boolean)
      .forEach((role) => roles.add(role));
  }
  return roles;
}

function collectPermissions(req) {
  return new Set(resolveRequestPermissions(req).map((permission) => normalise(permission)).filter(Boolean));
}

function hasAllowed(set, allowed) {
  for (const candidate of set) {
    if (allowed.has(candidate)) {
      return true;
    }
  }
  return false;
}

function ensureReputationAccess(req, { manage = false } = {}) {
  const actorId = resolveRequestUserId(req);
  if (!actorId) {
    throw new AuthorizationError('Authentication is required for reputation operations.');
  }

  const roles = collectRoles(req);
  const permissions = collectPermissions(req);
  const hasView = hasAllowed(roles, VIEW_ROLE_KEYS) || hasAllowed(permissions, VIEW_PERMISSION_KEYS);

  if (!hasView) {
    throw new AuthorizationError('Reputation insights are restricted to marketing and operations teams.');
  }

  const canManage =
    hasAllowed(roles, MANAGE_ROLE_KEYS) || hasAllowed(permissions, MANAGE_PERMISSION_KEYS) || roles.has('admin');

  if (manage && !canManage) {
    throw new AuthorizationError('Reputation management privileges are required for this action.');
  }

  return { actorId, canManage };
}

function parsePositiveInteger(value, label) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return numeric;
}

function parseBoolean(value, fallback = false) {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalised = normalise(value);
  if (normalised == null) {
    return fallback;
  }
  if (['1', 'true', 'yes', 'y'].includes(normalised)) {
    return true;
  }
  if (['0', 'false', 'no', 'n'].includes(normalised)) {
    return false;
  }
  return fallback;
}

function clampLimit(value, fallback, maximum) {
  if (value == null) {
    return fallback;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return fallback;
  }
  return Math.min(numeric, maximum);
}

function ensureObject(body, label) {
  if (body == null) {
    return {};
  }
  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError(`${label} must be provided as an object.`);
  }
  return { ...body };
}

function normalizeTagsQuery(value) {
  if (value == null) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => `${entry}`.trim()).filter(Boolean);
  }
  return `${value}`
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function respondWithAccess(res, body, context, { status = 200 } = {}) {
  res.status(status).json({
    ...body,
    access: {
      actorId: context.actorId,
      canManage: context.canManage,
    },
  });
}

export async function getFreelancerReputation(req, res) {
  const context = ensureReputationAccess(req, { manage: false });
  const freelancerId = parsePositiveInteger(req.params?.freelancerId, 'freelancerId');
  const { includeDrafts, limitTestimonials, limitStories } = req.query ?? {};

  const payload = await getFreelancerReputationOverview({
    freelancerId,
    includeDrafts: parseBoolean(includeDrafts, false) && context.canManage,
    limitTestimonials: clampLimit(limitTestimonials, 12, 50),
    limitStories: clampLimit(limitStories, 8, 30),
  });

  respondWithAccess(res, payload, context);
}

export async function postTestimonial(req, res) {
  const context = ensureReputationAccess(req, { manage: true });
  const freelancerId = parsePositiveInteger(req.params?.freelancerId, 'freelancerId');
  const result = await createTestimonial(freelancerId, ensureObject(req.body, 'testimonial'));
  respondWithAccess(res, { testimonial: result }, context, { status: 201 });
}

export async function postSuccessStory(req, res) {
  const context = ensureReputationAccess(req, { manage: true });
  const freelancerId = parsePositiveInteger(req.params?.freelancerId, 'freelancerId');
  const result = await createSuccessStory(freelancerId, ensureObject(req.body, 'success story'));
  respondWithAccess(res, { successStory: result }, context, { status: 201 });
}

export async function postMetric(req, res) {
  const context = ensureReputationAccess(req, { manage: true });
  const freelancerId = parsePositiveInteger(req.params?.freelancerId, 'freelancerId');
  const result = await upsertMetric(freelancerId, ensureObject(req.body, 'metric update'));
  respondWithAccess(res, { metric: result }, context, { status: 201 });
}

export async function postBadge(req, res) {
  const context = ensureReputationAccess(req, { manage: true });
  const freelancerId = parsePositiveInteger(req.params?.freelancerId, 'freelancerId');
  const result = await createBadge(freelancerId, ensureObject(req.body, 'badge'));
  respondWithAccess(res, { badge: result }, context, { status: 201 });
}

export async function postReviewWidget(req, res) {
  const context = ensureReputationAccess(req, { manage: true });
  const freelancerId = parsePositiveInteger(req.params?.freelancerId, 'freelancerId');
  const result = await createReviewWidget(freelancerId, ensureObject(req.body, 'review widget'));
  respondWithAccess(res, { widget: result }, context, { status: 201 });
}

export async function getReviewWidgetEmbed(req, res) {
  const freelancerId = parsePositiveInteger(req.params?.freelancerId, 'freelancerId');
  const slug = `${req.params?.slug ?? ''}`.trim();
  if (!slug) {
    throw new ValidationError('slug is required.');
  }

  const preview = parseBoolean(req.query?.preview, false);
  const { html } = await generateReviewWidgetEmbed(freelancerId, slug, { preview });

  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Cache-Control', preview ? 'no-store' : 'public, max-age=300');
  res.status(200).send(html);
}

export async function getFreelancerReviews(req, res) {
  const context = ensureReputationAccess(req, { manage: false });
  const freelancerId = parsePositiveInteger(req.params?.freelancerId, 'freelancerId');
  const { page, pageSize, sort, status, highlighted, minRating, maxRating, query } = req.query ?? {};
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
    tags: normalizeTagsQuery(req.query?.tags),
  });
  respondWithAccess(res, payload, context);
}

export async function postFreelancerReview(req, res) {
  const context = ensureReputationAccess(req, { manage: true });
  const freelancerId = parsePositiveInteger(req.params?.freelancerId, 'freelancerId');
  const result = await createFreelancerReview(freelancerId, ensureObject(req.body, 'freelancer review'));
  respondWithAccess(res, { review: result }, context, { status: 201 });
}

export async function putFreelancerReview(req, res) {
  const context = ensureReputationAccess(req, { manage: true });
  const freelancerId = parsePositiveInteger(req.params?.freelancerId, 'freelancerId');
  const reviewId = parsePositiveInteger(req.params?.reviewId, 'reviewId');
  const result = await updateFreelancerReview(freelancerId, reviewId, ensureObject(req.body, 'freelancer review update'));
  respondWithAccess(res, { review: result }, context);
}

export async function removeFreelancerReview(req, res) {
  const context = ensureReputationAccess(req, { manage: true });
  const freelancerId = parsePositiveInteger(req.params?.freelancerId, 'freelancerId');
  const reviewId = parsePositiveInteger(req.params?.reviewId, 'reviewId');
  await deleteFreelancerReview(freelancerId, reviewId);
  respondWithAccess(res, { removedReviewId: reviewId }, context);
}

export default {
  getFreelancerReputation,
  postTestimonial,
  postSuccessStory,
  postMetric,
  postBadge,
  postReviewWidget,
  getReviewWidgetEmbed,
  getFreelancerReviews,
  postFreelancerReview,
  putFreelancerReview,
  removeFreelancerReview,
};

