import { Op } from 'sequelize';
import { sequelize, User, FreelancerReview } from '../models/index.js';
import {
  FREELANCER_REVIEW_VISIBILITIES,
  FREELANCER_REVIEW_PERSONAS,
} from '../models/constants/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const ALLOWED_STATUSES = Object.freeze(['draft', 'pending', 'published', 'archived']);
const LIKE_OPERATOR = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;

function normalizeFreelancerId(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError('freelancerId must be a positive integer');
  }
  return parsed;
}

function normalizeReviewId(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError('reviewId must be a positive integer');
  }
  return parsed;
}

async function ensureFreelancerExists(freelancerId) {
  const record = await User.findOne({ where: { id: freelancerId, userType: 'freelancer' }, attributes: ['id'] });
  if (!record) {
    throw new NotFoundError('Freelancer not found');
  }
}

function sanitizeString(value, { allowNull = true, maxLength = 255 } = {}) {
  if (value == null) {
    return allowNull ? null : '';
  }
  const trimmed = `${value}`.trim();
  if (!trimmed) {
    return allowNull ? null : '';
  }
  return trimmed.slice(0, maxLength);
}

function sanitizeUrl(value) {
  if (value == null || value === '') {
    return null;
  }
  try {
    const url = new URL(String(value));
    return url.toString().slice(0, 500);
  } catch (error) {
    throw new ValidationError('Invalid URL provided');
  }
}

function parseDate(value) {
  if (value == null || value === '') {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError('Invalid date provided');
  }
  return date;
}

function parseRating(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('rating must be numeric');
  }
  if (numeric < 0 || numeric > 5) {
    throw new ValidationError('rating must be between 0 and 5');
  }
  return numeric;
}

function normalizeStatus(value, { allowNull = false } = {}) {
  if (value == null || value === '') {
    if (allowNull) {
      return null;
    }
    return 'draft';
  }
  const normalized = `${value}`.trim().toLowerCase();
  if (!ALLOWED_STATUSES.includes(normalized)) {
    throw new ValidationError(`status must be one of: ${ALLOWED_STATUSES.join(', ')}`);
  }
  return normalized;
}

function normalizePersona(value) {
  if (value == null || value === '') {
    return null;
  }
  const normalized = `${value}`.trim().toLowerCase();
  const match = FREELANCER_REVIEW_PERSONAS.find((persona) => persona === normalized);
  if (!match) {
    throw new ValidationError(
      `persona must be one of: ${FREELANCER_REVIEW_PERSONAS.join(', ')}`,
    );
  }
  return match;
}

function normalizeVisibility(value) {
  if (value == null || value === '') {
    return 'public';
  }
  const normalized = `${value}`.trim().toLowerCase();
  const match = FREELANCER_REVIEW_VISIBILITIES.find((visibility) => visibility === normalized);
  if (!match) {
    throw new ValidationError(
      `visibility must be one of: ${FREELANCER_REVIEW_VISIBILITIES.join(', ')}`,
    );
  }
  return match;
}

function normalizeHighlights(value) {
  if (value == null) {
    return null;
  }
  if (!Array.isArray(value)) {
    throw new ValidationError('endorsementHighlights must be an array of strings');
  }
  const highlights = value
    .map((item) => (item == null ? null : `${item}`.trim()))
    .filter(Boolean);
  return highlights.length ? highlights.slice(0, 12) : [];
}

function normalizeMetadata(value) {
  if (value == null) {
    return null;
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError('metadata must be an object when provided');
  }
  return value;
}

function normalizeBoolean(value, defaultValue = false) {
  if (value === undefined) {
    return defaultValue;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false;
  }
  throw new ValidationError('Expected a boolean-like value');
}

function normalizeTags(value) {
  if (value == null) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => sanitizeString(entry, { allowNull: false, maxLength: 80 }))
      .filter(Boolean)
      .slice(0, 25);
  }
  const raw = sanitizeString(value, { allowNull: true, maxLength: 600 });
  if (!raw) {
    return [];
  }
  return raw
    .split(/[,#]/)
    .map((entry) => sanitizeString(entry, { allowNull: false, maxLength: 80 }))
    .filter(Boolean)
    .slice(0, 25);
}

function normalizeAttachments(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const label = sanitizeString(item.label, { allowNull: true, maxLength: 120 });
      const url = sanitizeUrl(item.url ?? item.href ?? null);
      if (!url) {
        return null;
      }
      const type = sanitizeString(item.type ?? item.mediaType ?? null, { allowNull: true, maxLength: 60 });
      return { label, url, type };
    })
    .filter(Boolean)
    .slice(0, 20);
}

function applyReviewFilters(where, filters = {}) {
  const nextWhere = { ...where };
  if (filters.status && filters.status !== 'all') {
    if (Array.isArray(filters.status)) {
      const statuses = filters.status
        .map((status) => normalizeStatus(status, { allowNull: true }))
        .filter(Boolean);
      if (statuses.length) {
        nextWhere.status = { [Op.in]: statuses };
      }
    } else {
      nextWhere.status = normalizeStatus(filters.status, { allowNull: true });
    }
  }
  if (filters.highlighted != null) {
    nextWhere.highlighted = Boolean(filters.highlighted);
  }
  if (filters.minRating != null || filters.maxRating != null) {
    const min = filters.minRating == null ? null : Number.parseFloat(filters.minRating);
    const max = filters.maxRating == null ? null : Number.parseFloat(filters.maxRating);
    const ratingClause = {};
    if (Number.isFinite(min)) {
      ratingClause[Op.gte] = min;
    }
    if (Number.isFinite(max)) {
      ratingClause[Op.lte] = max;
    }
    if (Object.keys(ratingClause).length) {
      nextWhere.rating = { ...(nextWhere.rating ?? {}), ...ratingClause };
    }
  }
  if (filters.query) {
    const query = `%${filters.query.trim()}%`;
    nextWhere[Op.or] = [
      { title: { [LIKE_OPERATOR]: query } },
      { reviewerName: { [LIKE_OPERATOR]: query } },
      { reviewerCompany: { [LIKE_OPERATOR]: query } },
    ];
  }
  if (filters.tags && Array.isArray(filters.tags) && filters.tags.length) {
    const safeTags = filters.tags
      .map((tag) => sanitizeString(tag, { allowNull: false, maxLength: 80 }))
      .filter(Boolean);
    if (safeTags.length) {
      if (sequelize.getDialect() === 'postgres') {
        nextWhere.tags = { [Op.contains]: safeTags };
      } else {
        nextWhere.tags = { [LIKE_OPERATOR]: `%${safeTags[0]}%` };
      }
    }
  }
  return nextWhere;
}

function resolveSort(sort) {
  switch ((sort ?? '').toString().toLowerCase()) {
    case 'rating_desc':
      return [
        ['rating', 'DESC'],
        ['capturedAt', 'DESC NULLS LAST'],
      ];
    case 'rating_asc':
      return [
        ['rating', 'ASC'],
        ['capturedAt', 'DESC NULLS LAST'],
      ];
    case 'oldest':
      return [
        ['capturedAt', 'ASC NULLS FIRST'],
        ['createdAt', 'ASC'],
      ];
    case 'recent':
    default:
      return [
        ['capturedAt', 'DESC NULLS LAST'],
        ['createdAt', 'DESC'],
      ];
  }
}

function buildRatingDistribution(rows) {
  const buckets = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  rows.forEach((row) => {
    const bucket = Math.max(1, Math.min(5, Number.parseInt(row.bucket ?? row.rating ?? 0, 10) || 0));
    if (buckets[bucket] != null) {
      buckets[bucket] += Number.parseInt(row.count ?? row.total ?? 0, 10) || 0;
    }
  });
  return buckets;
}

function buildStatusSummary(rows) {
  const summary = { total: 0, draft: 0, pending: 0, published: 0, archived: 0 };
  rows.forEach((row) => {
    const status = (row.status ?? '').toString().toLowerCase();
    const count = Number.parseInt(row.count ?? row.total ?? 0, 10) || 0;
    summary.total += count;
    if (summary[status] != null) {
      summary[status] += count;
    }
  });
  return summary;
}

function extractTopTags(rows) {
  const tally = new Map();
  rows.forEach((row) => {
    const tags = Array.isArray(row.tags) ? row.tags : [];
    tags.forEach((tag) => {
      const normalized = sanitizeString(tag, { allowNull: false, maxLength: 80 });
      if (!normalized) {
        return;
      }
      tally.set(normalized, (tally.get(normalized) ?? 0) + 1);
    });
  });
  return Array.from(tally.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));
}

export async function listFreelancerReviews({
  freelancerId,
  page = 1,
  pageSize = 20,
  sort = 'recent',
  ...filters
} = {}) {
  const id = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(id);

  const limit = Math.min(Math.max(Number.parseInt(pageSize, 10) || 20, 1), 100);
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * limit;

  const where = applyReviewFilters({ freelancerId: id }, filters);

  const { rows, count } = await FreelancerReview.findAndCountAll({
    where,
    limit,
    offset,
    order: resolveSort(sort),
  });

  const [statusRows, ratingRows, highlightedCount, ratingAverageRow, heroCoverage, previewCoverage, tagRows, recentPublished] =
    await Promise.all([
      FreelancerReview.findAll({
        where: { freelancerId: id },
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      FreelancerReview.findAll({
        where: { freelancerId: id, rating: { [Op.not]: null } },
        attributes: [[sequelize.literal('FLOOR(rating + 0.5)'), 'bucket'], [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: [sequelize.literal('FLOOR(rating + 0.5)')],
        raw: true,
      }),
      FreelancerReview.count({ where: { freelancerId: id, highlighted: true } }),
      FreelancerReview.findOne({
        where: { freelancerId: id, rating: { [Op.not]: null } },
        attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']],
        raw: true,
      }),
      FreelancerReview.count({ where: { freelancerId: id, heroImageUrl: { [Op.not]: null } } }),
      FreelancerReview.count({ where: { freelancerId: id, previewUrl: { [Op.not]: null } } }),
      FreelancerReview.findAll({
        where: { freelancerId: id },
        attributes: ['tags'],
        limit: 300,
        raw: true,
      }),
      FreelancerReview.findOne({
        where: { freelancerId: id, publishedAt: { [Op.not]: null } },
        attributes: ['publishedAt'],
        order: [['publishedAt', 'DESC']],
        raw: true,
      }),
    ]);

  const summary = buildStatusSummary(statusRows);
  const ratingDistribution = buildRatingDistribution(ratingRows);
  const averageRating = ratingAverageRow?.avgRating == null ? null : Number.parseFloat(ratingAverageRow.avgRating);

  const reviews = rows.map((row) => row.toPublicObject());

  const insights = {
    topTags: extractTopTags(tagRows),
    highlightedCount,
    heroImageCoverage: summary.total ? heroCoverage / summary.total : 0,
    previewCoverage: summary.total ? previewCoverage / summary.total : 0,
    lastPublishedAt: recentPublished?.publishedAt ?? null,
  };

  return {
    reviews,
    pagination: {
      page: safePage,
      pageSize: limit,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / limit)),
    },
    summary: {
      ...summary,
      highlighted: highlightedCount,
      averageRating,
      lastPublishedAt: insights.lastPublishedAt,
    },
    ratingDistribution,
    insights,
  };
}

export async function createFreelancerReview(freelancerId, payload = {}) {
  const id = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(id);

  const title = sanitizeString(payload.title, { allowNull: false, maxLength: 180 });
  const body = sanitizeString(payload.body ?? payload.review ?? payload.comment, { allowNull: false, maxLength: 10000 });

  if (!title) {
    throw new ValidationError('title is required');
  }
  if (!body) {
    throw new ValidationError('review body is required');
  }

  const record = await FreelancerReview.create({
    freelancerId: id,
    title,
    reviewerName: sanitizeString(payload.reviewerName, { maxLength: 180 }),
    reviewerRole: sanitizeString(payload.reviewerRole, { maxLength: 180 }),
    reviewerCompany: sanitizeString(payload.reviewerCompany, { maxLength: 180 }),
    rating: parseRating(payload.rating),
    status: normalizeStatus(payload.status),
    highlighted: Boolean(payload.highlighted),
    reviewSource: sanitizeString(payload.reviewSource, { maxLength: 120 }),
    body,
    capturedAt: parseDate(payload.capturedAt ?? payload.reviewedAt),
    publishedAt: parseDate(payload.publishedAt),
    previewUrl: sanitizeUrl(payload.previewUrl),
    heroImageUrl: sanitizeUrl(payload.heroImageUrl),
    tags: normalizeTags(payload.tags),
    attachments: normalizeAttachments(payload.attachments),
    responses: Array.isArray(payload.responses) ? payload.responses : null,
    privateNotes: sanitizeString(payload.privateNotes, { maxLength: 2000 }),
    persona: normalizePersona(payload.persona),
    visibility: normalizeVisibility(payload.visibility),
    reviewerAvatarUrl: sanitizeUrl(payload.reviewerAvatarUrl),
    endorsementHighlights: normalizeHighlights(payload.endorsementHighlights ?? payload.highlights),
    endorsementHeadline: sanitizeString(payload.endorsementHeadline ?? payload.headline, { maxLength: 255 }),
    endorsementChannel: sanitizeString(payload.endorsementChannel ?? payload.channel, { maxLength: 180 }),
    requestFollowUp: normalizeBoolean(payload.requestFollowUp, false),
    shareToProfile: normalizeBoolean(payload.shareToProfile, true),
    metadata: normalizeMetadata(payload.metadata),
  });

  return record.toPublicObject();
}

export async function updateFreelancerReview(freelancerId, reviewId, payload = {}) {
  const freelancer = normalizeFreelancerId(freelancerId);
  const id = normalizeReviewId(reviewId);
  await ensureFreelancerExists(freelancer);

  const record = await FreelancerReview.findOne({ where: { id, freelancerId: freelancer } });
  if (!record) {
    throw new NotFoundError('Review not found');
  }

  const updates = {};
  if (payload.title !== undefined) {
    const title = sanitizeString(payload.title, { allowNull: false, maxLength: 180 });
    if (!title) {
      throw new ValidationError('title is required');
    }
    updates.title = title;
  }
  if (payload.body !== undefined || payload.review !== undefined || payload.comment !== undefined) {
    const body = sanitizeString(payload.body ?? payload.review ?? payload.comment, {
      allowNull: false,
      maxLength: 10000,
    });
    if (!body) {
      throw new ValidationError('review body is required');
    }
    updates.body = body;
  }
  if (payload.reviewerName !== undefined) {
    updates.reviewerName = sanitizeString(payload.reviewerName, { maxLength: 180 });
  }
  if (payload.reviewerRole !== undefined) {
    updates.reviewerRole = sanitizeString(payload.reviewerRole, { maxLength: 180 });
  }
  if (payload.reviewerCompany !== undefined) {
    updates.reviewerCompany = sanitizeString(payload.reviewerCompany, { maxLength: 180 });
  }
  if (payload.rating !== undefined) {
    updates.rating = parseRating(payload.rating);
  }
  if (payload.status !== undefined) {
    updates.status = normalizeStatus(payload.status);
  }
  if (payload.highlighted !== undefined) {
    updates.highlighted = Boolean(payload.highlighted);
  }
  if (payload.reviewSource !== undefined) {
    updates.reviewSource = sanitizeString(payload.reviewSource, { maxLength: 120 });
  }
  if (payload.capturedAt !== undefined || payload.reviewedAt !== undefined) {
    updates.capturedAt = parseDate(payload.capturedAt ?? payload.reviewedAt);
  }
  if (payload.publishedAt !== undefined) {
    updates.publishedAt = parseDate(payload.publishedAt);
  }
  if (payload.previewUrl !== undefined) {
    updates.previewUrl = sanitizeUrl(payload.previewUrl);
  }
  if (payload.heroImageUrl !== undefined) {
    updates.heroImageUrl = sanitizeUrl(payload.heroImageUrl);
  }
  if (payload.tags !== undefined) {
    updates.tags = normalizeTags(payload.tags);
  }
  if (payload.attachments !== undefined) {
    updates.attachments = normalizeAttachments(payload.attachments);
  }
  if (payload.responses !== undefined) {
    updates.responses = Array.isArray(payload.responses) ? payload.responses : null;
  }
  if (payload.privateNotes !== undefined) {
    updates.privateNotes = sanitizeString(payload.privateNotes, { maxLength: 2000 });
  }
  if (payload.persona !== undefined) {
    updates.persona = normalizePersona(payload.persona);
  }
  if (payload.visibility !== undefined) {
    updates.visibility = normalizeVisibility(payload.visibility);
  }
  if (payload.reviewerAvatarUrl !== undefined) {
    updates.reviewerAvatarUrl = sanitizeUrl(payload.reviewerAvatarUrl);
  }
  if (payload.endorsementHighlights !== undefined || payload.highlights !== undefined) {
    updates.endorsementHighlights = normalizeHighlights(payload.endorsementHighlights ?? payload.highlights);
  }
  if (payload.endorsementHeadline !== undefined || payload.headline !== undefined) {
    updates.endorsementHeadline = sanitizeString(payload.endorsementHeadline ?? payload.headline, {
      maxLength: 255,
    });
  }
  if (payload.endorsementChannel !== undefined || payload.channel !== undefined) {
    updates.endorsementChannel = sanitizeString(payload.endorsementChannel ?? payload.channel, {
      maxLength: 180,
    });
  }
  if (payload.requestFollowUp !== undefined) {
    updates.requestFollowUp = normalizeBoolean(payload.requestFollowUp, false);
  }
  if (payload.shareToProfile !== undefined) {
    updates.shareToProfile = normalizeBoolean(payload.shareToProfile, true);
  }
  if (payload.metadata !== undefined) {
    updates.metadata = normalizeMetadata(payload.metadata);
  }

  if (Object.keys(updates).length === 0) {
    return record.toPublicObject();
  }

  await record.update(updates);
  return record.toPublicObject();
}

export async function deleteFreelancerReview(freelancerId, reviewId) {
  const freelancer = normalizeFreelancerId(freelancerId);
  const id = normalizeReviewId(reviewId);
  await ensureFreelancerExists(freelancer);

  const deleted = await FreelancerReview.destroy({ where: { id, freelancerId: freelancer } });
  if (!deleted) {
    throw new NotFoundError('Review not found');
  }
  return { success: true };
}

export default {
  listFreelancerReviews,
  createFreelancerReview,
  updateFreelancerReview,
  deleteFreelancerReview,
};
