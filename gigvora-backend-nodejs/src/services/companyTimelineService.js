import { Op } from 'sequelize';

import {
  CompanyTimelineEvent,
  CompanyTimelinePost,
  CompanyTimelinePostMetric,
  ProviderWorkspace,
  User,
  COMPANY_TIMELINE_EVENT_STATUSES,
  COMPANY_TIMELINE_POST_STATUSES,
  COMPANY_TIMELINE_POST_VISIBILITIES,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function toPlain(record) {
  if (!record) {
    return null;
  }
  if (typeof record.toPublicObject === 'function') {
    return record.toPublicObject();
  }
  if (typeof record.get === 'function') {
    return record.get({ plain: true });
  }
  return record;
}

function parseDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normaliseTags(tags) {
  if (!tags) {
    return [];
  }
  if (Array.isArray(tags)) {
    return tags.map((tag) => `${tag}`.trim()).filter(Boolean);
  }
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  if (typeof tags === 'object') {
    return Object.values(tags)
      .map((tag) => `${tag}`.trim())
      .filter(Boolean);
  }
  return [];
}

function ensureStatus(status, allowed, label) {
  if (!status) {
    throw new ValidationError(`${label} is required.`);
  }
  if (!allowed.includes(status)) {
    throw new ValidationError(`Invalid ${label} value.`);
  }
  return status;
}

async function ensureWorkspace(workspaceId, { workspace } = {}) {
  if (workspace && workspace.id === workspaceId) {
    return workspace;
  }
  if (!workspaceId) {
    throw new ValidationError('workspaceId is required.');
  }
  const found = await ProviderWorkspace.findByPk(workspaceId);
  if (!found) {
    throw new NotFoundError('Workspace not found.');
  }
  return found;
}

function aggregatePostMetrics(metrics) {
  const totals = {
    impressions: 0,
    clicks: 0,
    reactions: 0,
    comments: 0,
    shares: 0,
    saves: 0,
  };

  metrics.forEach((metric) => {
    totals.impressions += Number(metric.impressions ?? 0);
    totals.clicks += Number(metric.clicks ?? 0);
    totals.reactions += Number(metric.reactions ?? 0);
    totals.comments += Number(metric.comments ?? 0);
    totals.shares += Number(metric.shares ?? 0);
    totals.saves += Number(metric.saves ?? 0);
  });

  const engagements =
    totals.clicks + totals.reactions + totals.comments + totals.shares + totals.saves;
  const engagementRate = totals.impressions ? Number(((engagements / totals.impressions) * 100).toFixed(2)) : 0;

  const ordered = metrics
    .slice()
    .sort((a, b) => new Date(b.metricDate ?? 0) - new Date(a.metricDate ?? 0));

  return {
    totals: { ...totals, engagements, engagementRate },
    series: ordered.map((metric) => ({
      metricDate: metric.metricDate,
      impressions: Number(metric.impressions ?? 0),
      engagements:
        Number(metric.clicks ?? 0) +
        Number(metric.reactions ?? 0) +
        Number(metric.comments ?? 0) +
        Number(metric.shares ?? 0) +
        Number(metric.saves ?? 0),
      clicks: Number(metric.clicks ?? 0),
      reactions: Number(metric.reactions ?? 0),
      comments: Number(metric.comments ?? 0),
      shares: Number(metric.shares ?? 0),
      saves: Number(metric.saves ?? 0),
    })),
    lastMetricAt: ordered.length ? ordered[0].metricDate : null,
  };
}

function aggregateTimelineAnalytics(postsWithMetrics, metrics) {
  const statusCounts = postsWithMetrics.reduce(
    (accumulator, post) => {
      const key = post.status ?? 'unknown';
      accumulator[key] = (accumulator[key] ?? 0) + 1;
      return accumulator;
    },
    {},
  );

  const totals = metrics.reduce(
    (accumulator, metric) => {
      accumulator.impressions += Number(metric.impressions ?? 0);
      accumulator.clicks += Number(metric.clicks ?? 0);
      accumulator.reactions += Number(metric.reactions ?? 0);
      accumulator.comments += Number(metric.comments ?? 0);
      accumulator.shares += Number(metric.shares ?? 0);
      accumulator.saves += Number(metric.saves ?? 0);
      return accumulator;
    },
    { impressions: 0, clicks: 0, reactions: 0, comments: 0, shares: 0, saves: 0 },
  );

  totals.engagements = totals.clicks + totals.reactions + totals.comments + totals.shares + totals.saves;
  totals.averageEngagementRate = totals.impressions
    ? Number(((totals.engagements / totals.impressions) * 100).toFixed(2))
    : 0;

  const metricsByDate = new Map();
  metrics.forEach((metric) => {
    const key = metric.metricDate ?? 'unknown';
    const value = metricsByDate.get(key) ?? {
      metricDate: key,
      impressions: 0,
      engagements: 0,
      clicks: 0,
      reactions: 0,
      comments: 0,
      shares: 0,
      saves: 0,
    };
    value.impressions += Number(metric.impressions ?? 0);
    value.clicks += Number(metric.clicks ?? 0);
    value.reactions += Number(metric.reactions ?? 0);
    value.comments += Number(metric.comments ?? 0);
    value.shares += Number(metric.shares ?? 0);
    value.saves += Number(metric.saves ?? 0);
    value.engagements =
      value.clicks + value.reactions + value.comments + value.shares + value.saves;
    metricsByDate.set(key, value);
  });

  const trend = Array.from(metricsByDate.values()).sort(
    (a, b) => new Date(a.metricDate ?? 0) - new Date(b.metricDate ?? 0),
  );

  const topPosts = postsWithMetrics
    .slice()
    .sort((a, b) => b.metricsSummary.totals.engagements - a.metricsSummary.totals.engagements)
    .slice(0, 5)
    .map((post) => ({
      id: post.id,
      title: post.title,
      status: post.status,
      publishedAt: post.publishedAt,
      engagements: post.metricsSummary.totals.engagements,
      impressions: post.metricsSummary.totals.impressions,
      engagementRate: post.metricsSummary.totals.engagementRate,
    }));

  return { statusCounts, totals, trend, topPosts };
}

export async function getTimelineManagementSnapshot({ workspaceId, lookbackDays = 30, workspace } = {}) {
  const resolvedWorkspace = await ensureWorkspace(workspaceId, { workspace });

  const lookback = Number.isFinite(Number(lookbackDays)) && Number(lookbackDays) > 0 ? Number(lookbackDays) : 30;
  const sinceDate = new Date(Date.now() - lookback * 24 * 60 * 60 * 1000);
  const metricSince = sinceDate.toISOString().slice(0, 10);

  const [events, posts, metrics] = await Promise.all([
    CompanyTimelineEvent.findAll({
      where: { workspaceId: resolvedWorkspace.id },
      include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      order: [
        ['startDate', 'ASC'],
        ['dueDate', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    }),
    CompanyTimelinePost.findAll({
      where: { workspaceId: resolvedWorkspace.id },
      include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      order: [
        ['status', 'ASC'],
        ['publishedAt', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    }),
    CompanyTimelinePostMetric.findAll({
      where: {
        workspaceId: resolvedWorkspace.id,
        metricDate: { [Op.gte]: metricSince },
      },
      order: [['metricDate', 'ASC']],
    }),
  ]);

  const eventRecords = events.map((event) => toPlain(event));
  const postRecords = posts.map((post) => toPlain(post));
  const metricRecords = metrics.map((metric) => toPlain(metric));

  const eventsByStatus = eventRecords.reduce(
    (accumulator, event) => {
      const key = event.status ?? 'planned';
      accumulator[key] = (accumulator[key] ?? 0) + 1;
      return accumulator;
    },
    {},
  );

  const upcoming = eventRecords
    .filter((event) => {
      const due = parseDate(event.dueDate ?? event.startDate);
      if (!due) {
        return false;
      }
      return due >= new Date() && !['completed'].includes(event.status);
    })
    .sort((a, b) => new Date(a.dueDate ?? a.startDate ?? 0) - new Date(b.dueDate ?? b.startDate ?? 0))
    .slice(0, 6);

  const overdue = eventRecords
    .filter((event) => {
      const due = parseDate(event.dueDate ?? event.startDate);
      if (!due) {
        return false;
      }
      return due < new Date() && !['completed'].includes(event.status);
    })
    .sort((a, b) => new Date(a.dueDate ?? a.startDate ?? 0) - new Date(b.dueDate ?? b.startDate ?? 0))
    .slice(0, 6);

  const metricsByPostId = new Map();
  metricRecords.forEach((metric) => {
    const key = metric.postId;
    if (!metricsByPostId.has(key)) {
      metricsByPostId.set(key, []);
    }
    metricsByPostId.get(key).push(metric);
  });

  const postsWithMetrics = postRecords.map((post) => {
    const metricsForPost = metricsByPostId.get(post.id) ?? [];
    const tags = Array.isArray(post.tags) ? post.tags : [];
    const metricsSummary = aggregatePostMetrics(metricsForPost);
    return {
      ...post,
      tags,
      metricsSummary,
    };
  });

  const tagFrequency = postsWithMetrics.reduce((accumulator, post) => {
    (post.tags ?? []).forEach((tag) => {
      accumulator[tag] = (accumulator[tag] ?? 0) + 1;
    });
    return accumulator;
  }, {});

  const analytics = aggregateTimelineAnalytics(postsWithMetrics, metricRecords);

  return {
    workspaceId: resolvedWorkspace.id,
    lookbackDays: lookback,
    generatedAt: new Date().toISOString(),
    events: {
      items: eventRecords,
      statusCounts: eventsByStatus,
      upcoming,
      overdue,
    },
    posts: {
      items: postsWithMetrics,
      statusCounts: analytics.statusCounts,
      tagFrequency,
    },
    analytics,
  };
}

export async function createTimelineEvent({ workspaceId, actorId, payload }) {
  const workspace = await ensureWorkspace(workspaceId);
  const title = `${payload?.title ?? ''}`.trim();
  if (!title) {
    throw new ValidationError('Title is required.');
  }
  const status = ensureStatus(
    payload?.status ?? 'planned',
    COMPANY_TIMELINE_EVENT_STATUSES,
    'status',
  );

  const event = await CompanyTimelineEvent.create({
    workspaceId: workspace.id,
    ownerId: payload?.ownerId ?? actorId ?? null,
    title,
    description: payload?.description ?? null,
    status,
    category: payload?.category ?? null,
    startDate: payload?.startDate ? new Date(payload.startDate) : null,
    dueDate: payload?.dueDate ? new Date(payload.dueDate) : null,
    metadata: payload?.metadata && typeof payload.metadata === 'object' ? payload.metadata : null,
  });

  return toPlain(event);
}

export async function updateTimelineEvent(eventId, { workspaceId, payload }) {
  if (!eventId) {
    throw new ValidationError('eventId is required.');
  }
  await ensureWorkspace(workspaceId);
  const event = await CompanyTimelineEvent.findByPk(eventId);
  if (!event || event.workspaceId !== Number(workspaceId)) {
    throw new NotFoundError('Timeline event not found.');
  }

  const updates = {};
  if (payload?.title != null) {
    const title = `${payload.title}`.trim();
    if (!title) {
      throw new ValidationError('Title cannot be empty.');
    }
    updates.title = title;
  }
  if (payload?.description !== undefined) {
    updates.description = payload.description ?? null;
  }
  if (payload?.status) {
    updates.status = ensureStatus(payload.status, COMPANY_TIMELINE_EVENT_STATUSES, 'status');
  }
  if (payload?.category !== undefined) {
    updates.category = payload.category ?? null;
  }
  if (payload?.startDate !== undefined) {
    updates.startDate = payload.startDate ? new Date(payload.startDate) : null;
  }
  if (payload?.dueDate !== undefined) {
    updates.dueDate = payload.dueDate ? new Date(payload.dueDate) : null;
  }
  if (payload?.ownerId !== undefined) {
    updates.ownerId = payload.ownerId ?? null;
  }
  if (payload?.metadata !== undefined) {
    updates.metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null;
  }

  await event.update(updates);
  return toPlain(event);
}

export async function deleteTimelineEvent(eventId, { workspaceId }) {
  if (!eventId) {
    throw new ValidationError('eventId is required.');
  }
  await ensureWorkspace(workspaceId);
  const event = await CompanyTimelineEvent.findByPk(eventId);
  if (!event || event.workspaceId !== Number(workspaceId)) {
    throw new NotFoundError('Timeline event not found.');
  }
  await event.destroy();
  return { success: true };
}

export async function createTimelinePost({ workspaceId, actorId, payload }) {
  const workspace = await ensureWorkspace(workspaceId);
  const title = `${payload?.title ?? ''}`.trim();
  if (!title) {
    throw new ValidationError('Title is required.');
  }

  const post = await CompanyTimelinePost.create({
    workspaceId: workspace.id,
    authorId: payload?.authorId ?? actorId ?? null,
    title,
    summary: payload?.summary ?? null,
    body: payload?.body ?? null,
    heroImageUrl: payload?.heroImageUrl ?? null,
    ctaUrl: payload?.ctaUrl ?? null,
    status: ensureStatus(payload?.status ?? 'draft', COMPANY_TIMELINE_POST_STATUSES, 'status'),
    visibility: ensureStatus(
      payload?.visibility ?? 'workspace',
      COMPANY_TIMELINE_POST_VISIBILITIES,
      'visibility',
    ),
    scheduledFor: payload?.scheduledFor ? new Date(payload.scheduledFor) : null,
    publishedAt: payload?.publishedAt ? new Date(payload.publishedAt) : null,
    expiresAt: payload?.expiresAt ? new Date(payload.expiresAt) : null,
    tags: normaliseTags(payload?.tags),
    metadata: payload?.metadata && typeof payload.metadata === 'object' ? payload.metadata : null,
  });

  return toPlain(post);
}

export async function updateTimelinePost(postId, { workspaceId, payload }) {
  if (!postId) {
    throw new ValidationError('postId is required.');
  }
  await ensureWorkspace(workspaceId);
  const post = await CompanyTimelinePost.findByPk(postId);
  if (!post || post.workspaceId !== Number(workspaceId)) {
    throw new NotFoundError('Timeline post not found.');
  }

  const updates = {};
  if (payload?.title !== undefined) {
    const title = `${payload.title ?? ''}`.trim();
    if (!title) {
      throw new ValidationError('Title cannot be empty.');
    }
    updates.title = title;
  }
  if (payload?.summary !== undefined) {
    updates.summary = payload.summary ?? null;
  }
  if (payload?.body !== undefined) {
    updates.body = payload.body ?? null;
  }
  if (payload?.heroImageUrl !== undefined) {
    updates.heroImageUrl = payload.heroImageUrl ?? null;
  }
  if (payload?.ctaUrl !== undefined) {
    updates.ctaUrl = payload.ctaUrl ?? null;
  }
  if (payload?.status) {
    updates.status = ensureStatus(payload.status, COMPANY_TIMELINE_POST_STATUSES, 'status');
  }
  if (payload?.visibility) {
    updates.visibility = ensureStatus(
      payload.visibility,
      COMPANY_TIMELINE_POST_VISIBILITIES,
      'visibility',
    );
  }
  if (payload?.scheduledFor !== undefined) {
    updates.scheduledFor = payload.scheduledFor ? new Date(payload.scheduledFor) : null;
  }
  if (payload?.publishedAt !== undefined) {
    updates.publishedAt = payload.publishedAt ? new Date(payload.publishedAt) : null;
  }
  if (payload?.expiresAt !== undefined) {
    updates.expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;
  }
  if (payload?.tags !== undefined) {
    updates.tags = normaliseTags(payload.tags);
  }
  if (payload?.metadata !== undefined) {
    updates.metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null;
  }
  if (payload?.authorId !== undefined) {
    updates.authorId = payload.authorId ?? null;
  }

  await post.update(updates);
  return toPlain(post);
}

export async function changeTimelinePostStatus(postId, { workspaceId, status, publishedAt, scheduledFor }) {
  if (!postId) {
    throw new ValidationError('postId is required.');
  }
  await ensureWorkspace(workspaceId);
  const post = await CompanyTimelinePost.findByPk(postId);
  if (!post || post.workspaceId !== Number(workspaceId)) {
    throw new NotFoundError('Timeline post not found.');
  }

  const nextStatus = ensureStatus(status, COMPANY_TIMELINE_POST_STATUSES, 'status');
  const updates = { status: nextStatus };
  if (publishedAt !== undefined) {
    updates.publishedAt = publishedAt ? new Date(publishedAt) : null;
  }
  if (scheduledFor !== undefined) {
    updates.scheduledFor = scheduledFor ? new Date(scheduledFor) : null;
  }
  if (nextStatus === 'published' && !updates.publishedAt) {
    updates.publishedAt = new Date();
  }
  await post.update(updates);
  return toPlain(post);
}

export async function deleteTimelinePost(postId, { workspaceId }) {
  if (!postId) {
    throw new ValidationError('postId is required.');
  }
  await ensureWorkspace(workspaceId);
  const post = await CompanyTimelinePost.findByPk(postId);
  if (!post || post.workspaceId !== Number(workspaceId)) {
    throw new NotFoundError('Timeline post not found.');
  }
  await post.destroy();
  return { success: true };
}

export async function recordTimelinePostMetrics(postId, { workspaceId, metricDate, metrics = {}, metadata }) {
  if (!postId) {
    throw new ValidationError('postId is required.');
  }
  const normalizedDate = metricDate ? metricDate : new Date().toISOString().slice(0, 10);
  if (!normalizedDate) {
    throw new ValidationError('metricDate is required.');
  }
  await ensureWorkspace(workspaceId);
  const post = await CompanyTimelinePost.findByPk(postId);
  if (!post || post.workspaceId !== Number(workspaceId)) {
    throw new NotFoundError('Timeline post not found.');
  }

  const payload = {
    impressions: Number(metrics.impressions ?? 0) || 0,
    clicks: Number(metrics.clicks ?? 0) || 0,
    reactions: Number(metrics.reactions ?? 0) || 0,
    comments: Number(metrics.comments ?? 0) || 0,
    shares: Number(metrics.shares ?? 0) || 0,
    saves: Number(metrics.saves ?? 0) || 0,
    metadata: metadata && typeof metadata === 'object' ? metadata : null,
  };

  const [metric] = await CompanyTimelinePostMetric.findOrCreate({
    where: { workspaceId: Number(workspaceId), postId: Number(postId), metricDate: normalizedDate },
    defaults: payload,
  });

  if (!metric.isNewRecord) {
    await metric.update(payload);
  }

  return toPlain(metric);
}

export default {
  getTimelineManagementSnapshot,
  createTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
  createTimelinePost,
  updateTimelinePost,
  changeTimelinePostStatus,
  deleteTimelinePost,
  recordTimelinePostMetrics,
};
