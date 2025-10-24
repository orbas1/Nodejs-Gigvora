import { Op } from 'sequelize';
import {
  User,
  FreelancerTimelineWorkspace,
  FreelancerTimelinePost,
  FreelancerTimelineEntry,
  FreelancerTimelinePostMetric,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { enforceFeedPostPolicies } from './contentModerationService.js';

const ALLOWED_VISIBILITY = new Set(['public', 'connections', 'private']);
const ALLOWED_POST_STATUS = new Set(['draft', 'scheduled', 'published', 'archived']);
const ALLOWED_ENTRY_TYPES = new Set(['milestone', 'content', 'event', 'campaign']);
const ALLOWED_ENTRY_STATUS = new Set(['planned', 'in_progress', 'completed', 'blocked']);

function normalizeFreelancerId(value) {
  if (value == null || value === '') {
    throw new ValidationError('freelancerId is required.');
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('freelancerId must be a positive integer.');
  }
  return numeric;
}

async function ensureFreelancerExists(freelancerId) {
  const freelancer = await User.findByPk(freelancerId, {
    attributes: ['id', 'userType', 'firstName', 'lastName', 'email'],
  });
  if (!freelancer) {
    throw new NotFoundError('Freelancer not found.');
  }
  return freelancer;
}

async function ensureWorkspace(freelancerId) {
  const [workspace] = await FreelancerTimelineWorkspace.findOrCreate({
    where: { freelancerId },
    defaults: {
      freelancerId,
      timezone: 'UTC',
      defaultVisibility: 'public',
      autoShareToFeed: false,
      reviewBeforePublish: true,
    },
  });
  return workspace;
}

function sanitizeString(value, { maxLength = 255, allowNull = true } = {}) {
  if (value == null) {
    return allowNull ? null : '';
  }
  const trimmed = `${value}`.trim();
  if (!trimmed) {
    return allowNull ? null : '';
  }
  return trimmed.slice(0, maxLength);
}

function sanitizeText(value, { allowNull = true, maxLength } = {}) {
  if (value == null) {
    return allowNull ? null : '';
  }
  const text = `${value}`.trim();
  if (!text) {
    return allowNull ? null : '';
  }
  if (maxLength && text.length > maxLength) {
    return text.slice(0, maxLength);
  }
  return text;
}

function sanitizeBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value == null) {
    return fallback;
  }
  const normalized = `${value}`.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }
  return fallback;
}

function sanitizeUrl(value) {
  if (!value) {
    return null;
  }
  try {
    const trimmed = `${value}`.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString().slice(0, 2048);
  } catch (error) {
    logger.debug?.('Invalid URL detected when sanitising timeline payload', { value });
    return null;
  }
}

function normalizeDate(value, { allowNull = true, defaultNow = false } = {}) {
  if (value == null || value === '') {
    if (!allowNull) {
      return defaultNow ? new Date() : null;
    }
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError('Invalid date provided.');
  }
  return date;
}

function normalizeDateOnly(value, { allowNull = false } = {}) {
  const normalized = normalizeDate(value, { allowNull });
  if (!normalized) {
    return null;
  }
  return normalized.toISOString().slice(0, 10);
}

function normalizeTags(input, { limit = 12 } = {}) {
  if (!input) {
    return [];
  }
  const raw = Array.isArray(input)
    ? input
    : `${input}`
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean);
  const unique = [];
  raw.forEach((item) => {
    const value = sanitizeString(item, { allowNull: false, maxLength: 60 });
    if (value && !unique.includes(value)) {
      unique.push(value);
    }
  });
  return unique.slice(0, limit);
}

function sanitizeStringList(input, { limit = 10, maxLength = 120 } = {}) {
  if (!input) {
    return [];
  }
  const raw = Array.isArray(input)
    ? input
    : `${input}`
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean);
  const unique = [];
  raw.forEach((item) => {
    const value = sanitizeString(item, { allowNull: false, maxLength });
    if (value && !unique.includes(value)) {
      unique.push(value);
    }
  });
  return unique.slice(0, limit);
}

function normalizeAttachments(input, { limit = 8 } = {}) {
  if (!Array.isArray(input)) {
    return [];
  }
  const attachments = input
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const url = sanitizeUrl(item.url ?? item.href ?? item.link);
      if (!url) {
        return null;
      }
      const label = sanitizeString(item.label ?? item.title ?? item.name, {
        allowNull: false,
        maxLength: 140,
      });
      const type = sanitizeString(item.type ?? item.kind ?? '', { maxLength: 60, allowNull: true });
      return {
        label,
        url,
        type: type ?? null,
        thumbnail: sanitizeUrl(item.thumbnail ?? item.preview ?? null),
      };
    })
    .filter(Boolean);
  return attachments.slice(0, limit);
}

function sanitizeAudience(audience) {
  if (!Array.isArray(audience)) {
    return [];
  }
  return audience
    .map((segment) =>
      typeof segment === 'object'
        ? {
            label: sanitizeString(segment.label ?? segment.name ?? segment.id ?? '', {
              allowNull: false,
              maxLength: 120,
            }),
            id: sanitizeString(segment.id ?? segment.slug ?? segment.label ?? '', {
              allowNull: true,
              maxLength: 120,
            }),
          }
        : {
            label: sanitizeString(segment, { allowNull: false, maxLength: 120 }),
            id: sanitizeString(segment, { allowNull: true, maxLength: 120 }),
          },
    )
    .filter((segment) => segment.label)
    .slice(0, 12);
}

function sanitizeCallToAction(cta) {
  if (!cta || typeof cta !== 'object') {
    return null;
  }
  const label = sanitizeString(cta.label ?? cta.text ?? '', { allowNull: false, maxLength: 80 });
  const url = sanitizeUrl(cta.url ?? cta.href ?? null);
  if (!label || !url) {
    return null;
  }
  return {
    label,
    url,
    style: sanitizeString(cta.style ?? cta.variant ?? '', { maxLength: 40, allowNull: true }),
  };
}

function sanitizeMetricCount(value) {
  if (value == null || value === '') {
    return 0;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new ValidationError('Metric counts must be zero or greater.');
  }
  return numeric;
}

function sanitizeMetricRate(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new ValidationError('Conversion rate must be zero or greater.');
  }
  return Math.round(numeric * 100) / 100;
}

function mapWorkspace(record) {
  const plain = record.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    timezone: plain.timezone || 'UTC',
    defaultVisibility: plain.defaultVisibility || 'public',
    autoShareToFeed: Boolean(plain.autoShareToFeed),
    reviewBeforePublish: Boolean(plain.reviewBeforePublish),
    distributionChannels: Array.isArray(plain.distributionChannels) ? plain.distributionChannels : [],
    contentThemes: Array.isArray(plain.contentThemes) ? plain.contentThemes : [],
    pinnedCampaigns: Array.isArray(plain.pinnedCampaigns) ? plain.pinnedCampaigns : [],
    cadenceGoal: plain.cadenceGoal ?? null,
    lastSyncedAt: plain.lastSyncedAt ?? null,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
}

function mapMetric(record) {
  const plain = record.get({ plain: true });
  return {
    id: plain.id,
    postId: plain.postId,
    freelancerId: plain.freelancerId,
    capturedAt: plain.capturedAt,
    impressions: Number(plain.impressions ?? 0),
    views: Number(plain.views ?? 0),
    clicks: Number(plain.clicks ?? 0),
    comments: Number(plain.comments ?? 0),
    reactions: Number(plain.reactions ?? 0),
    saves: Number(plain.saves ?? 0),
    shares: Number(plain.shares ?? 0),
    profileVisits: Number(plain.profileVisits ?? 0),
    leads: Number(plain.leads ?? 0),
    conversionRate: plain.conversionRate == null ? null : Number(plain.conversionRate),
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
}

function mapEntry(record) {
  const plain = record.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    workspaceId: plain.workspaceId,
    title: plain.title,
    description: plain.description ?? null,
    entryType: plain.entryType,
    status: plain.status,
    startAt: plain.startAt ?? null,
    endAt: plain.endAt ?? null,
    linkedPostId: plain.linkedPostId ?? null,
    owner: plain.owner ?? null,
    channel: plain.channel ?? null,
    location: plain.location ?? null,
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    metadata: plain.metadata ?? null,
    linkedPost: plain.linkedPost
      ? {
          id: plain.linkedPost.id,
          title: plain.linkedPost.title,
          status: plain.linkedPost.status,
          visibility: plain.linkedPost.visibility,
          scheduledAt: plain.linkedPost.scheduledAt,
          publishedAt: plain.linkedPost.publishedAt,
        }
      : null,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
}

function mapPost(record) {
  const plain = record.get({ plain: true });
  const metrics = Array.isArray(plain.metrics)
    ? plain.metrics.map((metric) => mapMetric({ get: () => metric }))
    : [];
  const totals = metrics.reduce(
    (accumulator, metric) => ({
      impressions: accumulator.impressions + (metric.impressions ?? 0),
      views: accumulator.views + (metric.views ?? 0),
      clicks: accumulator.clicks + (metric.clicks ?? 0),
      comments: accumulator.comments + (metric.comments ?? 0),
      reactions: accumulator.reactions + (metric.reactions ?? 0),
      saves: accumulator.saves + (metric.saves ?? 0),
      shares: accumulator.shares + (metric.shares ?? 0),
      profileVisits: accumulator.profileVisits + (metric.profileVisits ?? 0),
      leads: accumulator.leads + (metric.leads ?? 0),
    }),
    {
      impressions: 0,
      views: 0,
      clicks: 0,
      comments: 0,
      reactions: 0,
      saves: 0,
      shares: 0,
      profileVisits: 0,
      leads: 0,
    },
  );
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    workspaceId: plain.workspaceId,
    title: plain.title,
    summary: plain.summary ?? null,
    content: plain.content ?? null,
    status: plain.status,
    visibility: plain.visibility,
    scheduledAt: plain.scheduledAt ?? null,
    publishedAt: plain.publishedAt ?? null,
    timezone: plain.timezone ?? null,
    heroImageUrl: plain.heroImageUrl ?? null,
    allowComments: Boolean(plain.allowComments ?? true),
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    attachments: Array.isArray(plain.attachments) ? plain.attachments : [],
    targetAudience: Array.isArray(plain.targetAudience) ? plain.targetAudience : [],
    campaign: plain.campaign ?? null,
    callToAction: plain.callToAction ?? null,
    metrics: {
      totals,
      trend: metrics,
    },
    linkedEntryCount: Array.isArray(plain.linkedEntries) ? plain.linkedEntries.length : 0,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
    lastEditedById: plain.lastEditedById ?? null,
  };
}

function computeAnalytics(posts, entries) {
  const totals = {
    posts: posts.length,
    drafts: posts.filter((post) => post.status === 'draft').length,
    scheduled: posts.filter((post) => post.status === 'scheduled').length,
    published: posts.filter((post) => post.status === 'published').length,
    archived: posts.filter((post) => post.status === 'archived').length,
    impressions: 0,
    views: 0,
    clicks: 0,
    comments: 0,
    reactions: 0,
    saves: 0,
    shares: 0,
    profileVisits: 0,
    leads: 0,
  };

  const trendAccumulator = new Map();

  posts.forEach((post) => {
    const metricsTotals = post.metrics?.totals ?? {};
    totals.impressions += metricsTotals.impressions ?? 0;
    totals.views += metricsTotals.views ?? 0;
    totals.clicks += metricsTotals.clicks ?? 0;
    totals.comments += metricsTotals.comments ?? 0;
    totals.reactions += metricsTotals.reactions ?? 0;
    totals.saves += metricsTotals.saves ?? 0;
    totals.shares += metricsTotals.shares ?? 0;
    totals.profileVisits += metricsTotals.profileVisits ?? 0;
    totals.leads += metricsTotals.leads ?? 0;

    const trendSeries = post.metrics?.trend ?? [];
    trendSeries.forEach((metric) => {
      if (!metric.capturedAt) {
        return;
      }
      const key = metric.capturedAt;
      const bucket = trendAccumulator.get(key) ?? {
        capturedAt: key,
        impressions: 0,
        clicks: 0,
        reactions: 0,
        comments: 0,
        saves: 0,
        shares: 0,
      };
      bucket.impressions += metric.impressions ?? 0;
      bucket.clicks += metric.clicks ?? 0;
      bucket.reactions += metric.reactions ?? 0;
      bucket.comments += metric.comments ?? 0;
      bucket.saves += metric.saves ?? 0;
      bucket.shares += metric.shares ?? 0;
      trendAccumulator.set(key, bucket);
    });
  });

  const engagementActions =
    totals.clicks + totals.comments + totals.reactions + totals.shares + totals.saves;
  const engagementRate = totals.impressions > 0 ? engagementActions / totals.impressions : 0;

  const trend = Array.from(trendAccumulator.values())
    .sort((a, b) => new Date(a.capturedAt) - new Date(b.capturedAt))
    .slice(-30);

  const topPosts = posts
    .map((post) => {
      const metricsTotals = post.metrics?.totals ?? {};
      const engagement =
        (metricsTotals.clicks ?? 0) +
        (metricsTotals.comments ?? 0) +
        (metricsTotals.reactions ?? 0) +
        (metricsTotals.shares ?? 0) +
        (metricsTotals.saves ?? 0);
      return {
        id: post.id,
        title: post.title,
        status: post.status,
        impressions: metricsTotals.impressions ?? 0,
        engagement,
        publishedAt: post.publishedAt,
        tags: post.tags,
      };
    })
    .sort((a, b) => b.engagement - a.engagement || b.impressions - a.impressions)
    .slice(0, 5);

  const now = Date.now();
  const timelineSummary = {
    total: entries.length,
    planned: entries.filter((entry) => entry.status === 'planned').length,
    inProgress: entries.filter((entry) => entry.status === 'in_progress').length,
    completed: entries.filter((entry) => entry.status === 'completed').length,
    blocked: entries.filter((entry) => entry.status === 'blocked').length,
    upcoming: entries.filter((entry) => entry.startAt && new Date(entry.startAt).getTime() > now).length,
  };

  const tagCounts = new Map();
  posts.forEach((post) => {
    (post.tags ?? []).forEach((tag) => {
      const key = `${tag}`.trim();
      if (!key) {
        return;
      }
      tagCounts.set(key, (tagCounts.get(key) ?? 0) + 1);
    });
  });

  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }));

  const latestPublished = posts
    .filter((post) => post.status === 'published' && post.publishedAt)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .map((post) => post.publishedAt)[0] ?? null;

  return {
    totals: {
      ...totals,
      engagementRate,
      latestPublishedAt: latestPublished,
    },
    timelineSummary,
    trend,
    topPosts,
    topTags,
  };
}

async function loadEntry(entryId, freelancerId) {
  const entry = await FreelancerTimelineEntry.findOne({
    where: { id: entryId, freelancerId },
    include: [
      { model: FreelancerTimelinePost, as: 'linkedPost' },
    ],
  });
  if (!entry) {
    throw new NotFoundError('Timeline entry not found.');
  }
  return entry;
}

async function loadPost(postId, freelancerId) {
  const post = await FreelancerTimelinePost.findOne({
    where: { id: postId, freelancerId },
    include: [
      { model: FreelancerTimelinePostMetric, as: 'metrics', separate: true, order: [['capturedAt', 'ASC']] },
      { model: FreelancerTimelineEntry, as: 'linkedEntries' },
    ],
  });
  if (!post) {
    throw new NotFoundError('Timeline post not found.');
  }
  return post;
}

export async function getFreelancerTimelineWorkspace({ freelancerId }) {
  const normalizedId = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(normalizedId);
  const workspace = await ensureWorkspace(normalizedId);

  const [entriesRaw, postsRaw] = await Promise.all([
    FreelancerTimelineEntry.findAll({
      where: { freelancerId: normalizedId },
      include: [{ model: FreelancerTimelinePost, as: 'linkedPost' }],
      order: [
        ['startAt', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    }),
    FreelancerTimelinePost.findAll({
      where: { freelancerId: normalizedId },
      include: [
        { model: FreelancerTimelinePostMetric, as: 'metrics', separate: true, order: [['capturedAt', 'ASC']] },
        { model: FreelancerTimelineEntry, as: 'linkedEntries' },
      ],
      order: [
        ['updatedAt', 'DESC'],
        ['id', 'DESC'],
      ],
    }),
  ]);

  const entries = entriesRaw.map(mapEntry);
  const posts = postsRaw.map(mapPost);
  const analytics = computeAnalytics(posts, entries);

  return {
    workspace: mapWorkspace(workspace),
    timelineEntries: entries,
    posts,
    analytics,
  };
}

export async function saveTimelineSettings(freelancerId, settings = {}) {
  const normalizedId = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(normalizedId);
  const workspace = await ensureWorkspace(normalizedId);

  if (settings.timezone != null) {
    workspace.timezone = sanitizeString(settings.timezone, { allowNull: false, maxLength: 120 });
  }

  if (settings.defaultVisibility != null) {
    const visibility = `${settings.defaultVisibility}`.toLowerCase();
    if (!ALLOWED_VISIBILITY.has(visibility)) {
      throw new ValidationError('Invalid defaultVisibility provided.');
    }
    workspace.defaultVisibility = visibility;
  }

  if (settings.autoShareToFeed != null) {
    workspace.autoShareToFeed = sanitizeBoolean(settings.autoShareToFeed, workspace.autoShareToFeed);
  }

  if (settings.reviewBeforePublish != null) {
    workspace.reviewBeforePublish = sanitizeBoolean(
      settings.reviewBeforePublish,
      workspace.reviewBeforePublish,
    );
  }

  if (settings.distributionChannels != null) {
    workspace.distributionChannels = sanitizeStringList(settings.distributionChannels, {
      limit: 10,
      maxLength: 120,
    });
  }

  if (settings.contentThemes != null) {
    workspace.contentThemes = sanitizeStringList(settings.contentThemes, {
      limit: 12,
      maxLength: 120,
    });
  }

  if (settings.pinnedCampaigns != null) {
    workspace.pinnedCampaigns = sanitizeStringList(settings.pinnedCampaigns, {
      limit: 8,
      maxLength: 140,
    });
  }

  if (settings.cadenceGoal != null) {
    const numeric = Number.parseInt(settings.cadenceGoal, 10);
    workspace.cadenceGoal = Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  }

  workspace.lastSyncedAt = new Date();
  await workspace.save();
  return mapWorkspace(workspace);
}

export async function createTimelineEntry(freelancerId, payload = {}) {
  const normalizedId = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(normalizedId);
  const workspace = await ensureWorkspace(normalizedId);

  const entryType = `${payload.entryType ?? 'milestone'}`.toLowerCase();
  if (!ALLOWED_ENTRY_TYPES.has(entryType)) {
    throw new ValidationError('Invalid entryType provided.');
  }

  const status = `${payload.status ?? 'planned'}`.toLowerCase();
  if (!ALLOWED_ENTRY_STATUS.has(status)) {
    throw new ValidationError('Invalid status provided.');
  }

  let linkedPostId = null;
  if (payload.linkedPostId != null) {
    const numeric = Number.parseInt(payload.linkedPostId, 10);
    if (!Number.isInteger(numeric) || numeric <= 0) {
      throw new ValidationError('linkedPostId must be a positive integer.');
    }
    const linkedPost = await FreelancerTimelinePost.findOne({
      where: { id: numeric, freelancerId: normalizedId },
      attributes: ['id'],
    });
    if (!linkedPost) {
      throw new NotFoundError('Linked post could not be found for this freelancer.');
    }
    linkedPostId = numeric;
  }

  const entry = await FreelancerTimelineEntry.create({
    freelancerId: normalizedId,
    workspaceId: workspace.id,
    title: sanitizeString(payload.title, { allowNull: false, maxLength: 180 }),
    description: sanitizeText(payload.description, { allowNull: true }),
    entryType,
    status,
    startAt: normalizeDate(payload.startAt, { allowNull: true }),
    endAt: normalizeDate(payload.endAt, { allowNull: true }),
    linkedPostId,
    owner: sanitizeString(payload.owner, { allowNull: true, maxLength: 180 }),
    channel: sanitizeString(payload.channel, { allowNull: true, maxLength: 180 }),
    location: sanitizeString(payload.location, { allowNull: true, maxLength: 255 }),
    tags: normalizeTags(payload.tags),
    metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null,
  });

  await entry.reload({ include: [{ model: FreelancerTimelinePost, as: 'linkedPost' }] });
  return mapEntry(entry);
}

export async function updateTimelineEntry(freelancerId, entryId, payload = {}) {
  const normalizedId = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(normalizedId);
  const entry = await loadEntry(entryId, normalizedId);

  if (payload.title != null) {
    entry.title = sanitizeString(payload.title, { allowNull: false, maxLength: 180 });
  }

  if (payload.description !== undefined) {
    entry.description = sanitizeText(payload.description, { allowNull: true });
  }

  if (payload.entryType != null) {
    const entryType = `${payload.entryType}`.toLowerCase();
    if (!ALLOWED_ENTRY_TYPES.has(entryType)) {
      throw new ValidationError('Invalid entryType provided.');
    }
    entry.entryType = entryType;
  }

  if (payload.status != null) {
    const status = `${payload.status}`.toLowerCase();
    if (!ALLOWED_ENTRY_STATUS.has(status)) {
      throw new ValidationError('Invalid status provided.');
    }
    entry.status = status;
  }

  if (payload.startAt !== undefined) {
    entry.startAt = normalizeDate(payload.startAt, { allowNull: true });
  }

  if (payload.endAt !== undefined) {
    entry.endAt = normalizeDate(payload.endAt, { allowNull: true });
  }

  if (payload.owner !== undefined) {
    entry.owner = sanitizeString(payload.owner, { allowNull: true, maxLength: 180 });
  }

  if (payload.channel !== undefined) {
    entry.channel = sanitizeString(payload.channel, { allowNull: true, maxLength: 180 });
  }

  if (payload.location !== undefined) {
    entry.location = sanitizeString(payload.location, { allowNull: true, maxLength: 255 });
  }

  if (payload.tags !== undefined) {
    entry.tags = normalizeTags(payload.tags);
  }

  if (payload.metadata !== undefined) {
    entry.metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null;
  }

  if (payload.linkedPostId !== undefined) {
    if (payload.linkedPostId == null || payload.linkedPostId === '') {
      entry.linkedPostId = null;
    } else {
      const numeric = Number.parseInt(payload.linkedPostId, 10);
      if (!Number.isInteger(numeric) || numeric <= 0) {
        throw new ValidationError('linkedPostId must be a positive integer.');
      }
      const linkedPost = await FreelancerTimelinePost.findOne({
        where: { id: numeric, freelancerId: normalizedId },
        attributes: ['id'],
      });
      if (!linkedPost) {
        throw new NotFoundError('Linked post could not be found for this freelancer.');
      }
      entry.linkedPostId = numeric;
    }
  }

  await entry.save();
  await entry.reload({ include: [{ model: FreelancerTimelinePost, as: 'linkedPost' }] });
  return mapEntry(entry);
}

export async function deleteTimelineEntry(freelancerId, entryId) {
  const normalizedId = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(normalizedId);
  const deleted = await FreelancerTimelineEntry.destroy({ where: { id: entryId, freelancerId: normalizedId } });
  if (!deleted) {
    throw new NotFoundError('Timeline entry not found.');
  }
  return { success: true };
}

export async function createTimelinePost(freelancerId, payload = {}, options = {}) {
  const normalizedId = normalizeFreelancerId(freelancerId);
  const freelancer = await ensureFreelancerExists(normalizedId);
  const workspace = await ensureWorkspace(normalizedId);

  const status = `${payload.status ?? 'draft'}`.toLowerCase();
  if (!ALLOWED_POST_STATUS.has(status)) {
    throw new ValidationError('Invalid status provided.');
  }

  const visibility = `${payload.visibility ?? workspace.defaultVisibility ?? 'public'}`.toLowerCase();
  if (!ALLOWED_VISIBILITY.has(visibility)) {
    throw new ValidationError('Invalid visibility provided.');
  }

  const actorRole = Array.isArray(options.actorRoles) && options.actorRoles.length
    ? `${options.actorRoles[0]}`.toLowerCase()
    : options.actorRole || freelancer.userType || 'freelancer';

  const sanitizedTitle = sanitizeString(payload.title, { allowNull: false, maxLength: 180 });
  const sanitizedSummary = sanitizeText(payload.summary, { allowNull: true });
  const sanitizedContent = sanitizeText(payload.content, { allowNull: true });
  const sanitizedAttachments = normalizeAttachments(payload.attachments);
  const moderationContext = enforceFeedPostPolicies(
    {
      content: sanitizedContent,
      summary: sanitizedSummary,
      title: sanitizedTitle,
      link: null,
      attachments: sanitizedAttachments,
    },
    { role: actorRole },
  );

  const post = await FreelancerTimelinePost.create({
    freelancerId: normalizedId,
    workspaceId: workspace.id,
    title: moderationContext.title ?? sanitizedTitle,
    summary: moderationContext.summary ?? sanitizedSummary,
    content: moderationContext.content ?? sanitizedContent,
    status,
    visibility,
    scheduledAt: normalizeDate(payload.scheduledAt, { allowNull: true }),
    publishedAt: normalizeDate(payload.publishedAt, { allowNull: true }),
    timezone: sanitizeString(payload.timezone, { allowNull: true, maxLength: 120 }) ?? workspace.timezone,
    heroImageUrl: sanitizeUrl(payload.heroImageUrl),
    allowComments: sanitizeBoolean(payload.allowComments, true),
    tags: normalizeTags(payload.tags),
    attachments: moderationContext.attachments ?? sanitizedAttachments,
    targetAudience: sanitizeAudience(payload.targetAudience),
    campaign: sanitizeString(payload.campaign, { allowNull: true, maxLength: 180 }),
    callToAction: sanitizeCallToAction(payload.callToAction),
    metricsSnapshot: null,
    lastEditedById: options.actorId ?? options.userId ?? freelancer.id,
  });

  const loaded = await loadPost(post.id, normalizedId);
  const mapped = mapPost(loaded);
  if (Array.isArray(moderationContext?.signals) && moderationContext.signals.length) {
    mapped.moderation = { signals: moderationContext.signals };
  }
  return mapped;
}

export async function updateTimelinePost(freelancerId, postId, payload = {}, options = {}) {
  const normalizedId = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(normalizedId);
  const post = await loadPost(postId, normalizedId);

  let sanitizedTitle = post.title;
  let sanitizedSummary = post.summary ?? null;
  let sanitizedContent = post.content ?? null;
  let sanitizedAttachments = Array.isArray(post.attachments) ? post.attachments : [];
  let shouldModerate = false;

  if (payload.title != null) {
    sanitizedTitle = sanitizeString(payload.title, { allowNull: false, maxLength: 180 });
    post.title = sanitizedTitle;
    shouldModerate = true;
  }

  if (payload.summary !== undefined) {
    sanitizedSummary = sanitizeText(payload.summary, { allowNull: true });
    post.summary = sanitizedSummary;
    shouldModerate = true;
  }

  if (payload.content !== undefined) {
    sanitizedContent = sanitizeText(payload.content, { allowNull: true });
    post.content = sanitizedContent;
    shouldModerate = true;
  }

  if (payload.status != null) {
    const status = `${payload.status}`.toLowerCase();
    if (!ALLOWED_POST_STATUS.has(status)) {
      throw new ValidationError('Invalid status provided.');
    }
    post.status = status;
  }

  if (payload.visibility != null) {
    const visibility = `${payload.visibility}`.toLowerCase();
    if (!ALLOWED_VISIBILITY.has(visibility)) {
      throw new ValidationError('Invalid visibility provided.');
    }
    post.visibility = visibility;
  }

  if (payload.scheduledAt !== undefined) {
    post.scheduledAt = normalizeDate(payload.scheduledAt, { allowNull: true });
  }

  if (payload.publishedAt !== undefined) {
    post.publishedAt = normalizeDate(payload.publishedAt, { allowNull: true });
  }

  if (payload.timezone !== undefined) {
    post.timezone = sanitizeString(payload.timezone, { allowNull: true, maxLength: 120 });
  }

  if (payload.heroImageUrl !== undefined) {
    post.heroImageUrl = sanitizeUrl(payload.heroImageUrl);
  }

  if (payload.allowComments !== undefined) {
    post.allowComments = sanitizeBoolean(payload.allowComments, post.allowComments);
  }

  if (payload.tags !== undefined) {
    post.tags = normalizeTags(payload.tags);
  }

  if (payload.attachments !== undefined) {
    sanitizedAttachments = normalizeAttachments(payload.attachments);
    post.attachments = sanitizedAttachments;
    shouldModerate = true;
  }

  if (payload.targetAudience !== undefined) {
    post.targetAudience = sanitizeAudience(payload.targetAudience);
  }

  if (payload.campaign !== undefined) {
    post.campaign = sanitizeString(payload.campaign, { allowNull: true, maxLength: 180 });
  }

  if (payload.callToAction !== undefined) {
    post.callToAction = sanitizeCallToAction(payload.callToAction);
  }

  if (payload.metricsSnapshot !== undefined && payload.metricsSnapshot && typeof payload.metricsSnapshot === 'object') {
    post.metricsSnapshot = payload.metricsSnapshot;
  }

  post.lastEditedById = options.actorId ?? options.userId ?? post.lastEditedById;

  let moderationContext = null;
  if (shouldModerate) {
    const actorRole = Array.isArray(options.actorRoles) && options.actorRoles.length
      ? `${options.actorRoles[0]}`.toLowerCase()
      : options.actorRole || post.get?.('ownerRole') || 'freelancer';
    moderationContext = enforceFeedPostPolicies(
      {
        content: sanitizedContent,
        summary: sanitizedSummary,
        title: sanitizedTitle,
        link: null,
        attachments: sanitizedAttachments,
      },
      { role: actorRole },
    );
    post.title = moderationContext.title ?? sanitizedTitle;
    post.summary = moderationContext.summary ?? sanitizedSummary;
    post.content = moderationContext.content ?? sanitizedContent;
    post.attachments = moderationContext.attachments ?? sanitizedAttachments;
  }

  await post.save();
  const loaded = await loadPost(post.id, normalizedId);
  const mapped = mapPost(loaded);
  if (Array.isArray(moderationContext?.signals) && moderationContext.signals.length) {
    mapped.moderation = { signals: moderationContext.signals };
  }
  return mapped;
}

export async function deleteTimelinePost(freelancerId, postId) {
  const normalizedId = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(normalizedId);
  const deleted = await FreelancerTimelinePost.destroy({
    where: { id: postId, freelancerId: normalizedId },
  });
  if (!deleted) {
    throw new NotFoundError('Timeline post not found.');
  }
  return { success: true };
}

export async function publishTimelinePost(freelancerId, postId, payload = {}, options = {}) {
  const normalizedId = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(normalizedId);
  const post = await loadPost(postId, normalizedId);

  post.status = 'published';
  post.publishedAt = normalizeDate(payload.publishedAt, { allowNull: true }) ?? new Date();
  post.scheduledAt = normalizeDate(payload.scheduledAt ?? post.scheduledAt, { allowNull: true });
  post.visibility = payload.visibility ? `${payload.visibility}`.toLowerCase() : post.visibility;
  if (payload.visibility && !ALLOWED_VISIBILITY.has(post.visibility)) {
    throw new ValidationError('Invalid visibility provided.');
  }
  post.lastEditedById = options.actorId ?? options.userId ?? post.lastEditedById;
  await post.save();
  const loaded = await loadPost(post.id, normalizedId);
  return mapPost(loaded);
}

export async function upsertTimelinePostMetrics(freelancerId, postId, payload = {}) {
  const normalizedId = normalizeFreelancerId(freelancerId);
  await ensureFreelancerExists(normalizedId);
  const post = await FreelancerTimelinePost.findOne({
    where: { id: postId, freelancerId: normalizedId },
    attributes: ['id'],
  });
  if (!post) {
    throw new NotFoundError('Timeline post not found.');
  }

  const capturedAt = normalizeDateOnly(payload.capturedAt, { allowNull: false });

  const [metric, created] = await FreelancerTimelinePostMetric.findOrCreate({
    where: { postId: post.id, freelancerId: normalizedId, capturedAt },
    defaults: {
      impressions: sanitizeMetricCount(payload.impressions),
      views: sanitizeMetricCount(payload.views),
      clicks: sanitizeMetricCount(payload.clicks),
      comments: sanitizeMetricCount(payload.comments),
      reactions: sanitizeMetricCount(payload.reactions),
      saves: sanitizeMetricCount(payload.saves),
      shares: sanitizeMetricCount(payload.shares),
      profileVisits: sanitizeMetricCount(payload.profileVisits),
      leads: sanitizeMetricCount(payload.leads),
      conversionRate: sanitizeMetricRate(payload.conversionRate),
      metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null,
    },
  });

  if (!created) {
    metric.impressions = sanitizeMetricCount(payload.impressions ?? metric.impressions);
    metric.views = sanitizeMetricCount(payload.views ?? metric.views);
    metric.clicks = sanitizeMetricCount(payload.clicks ?? metric.clicks);
    metric.comments = sanitizeMetricCount(payload.comments ?? metric.comments);
    metric.reactions = sanitizeMetricCount(payload.reactions ?? metric.reactions);
    metric.saves = sanitizeMetricCount(payload.saves ?? metric.saves);
    metric.shares = sanitizeMetricCount(payload.shares ?? metric.shares);
    metric.profileVisits = sanitizeMetricCount(payload.profileVisits ?? metric.profileVisits);
    metric.leads = sanitizeMetricCount(payload.leads ?? metric.leads);
    metric.conversionRate = sanitizeMetricRate(
      payload.conversionRate != null ? payload.conversionRate : metric.conversionRate,
    );
    if (payload.metadata !== undefined) {
      metric.metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null;
    }
    await metric.save();
  }

  return mapMetric(metric);
}

export default {
  getFreelancerTimelineWorkspace,
  saveTimelineSettings,
  createTimelineEntry,
  updateTimelineEntry,
  deleteTimelineEntry,
  createTimelinePost,
  updateTimelinePost,
  deleteTimelinePost,
  publishTimelinePost,
  upsertTimelinePostMetrics,
};
