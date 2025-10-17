import { Op, fn, col } from 'sequelize';
import {
  AgencyTimelinePost,
  AgencyTimelinePostRevision,
  AgencyTimelinePostMetric,
  ProviderWorkspace,
  ProviderWorkspaceMember,
  User,
  AGENCY_TIMELINE_POST_STATUSES,
  AGENCY_TIMELINE_VISIBILITIES,
  AGENCY_TIMELINE_DISTRIBUTION_CHANNELS,
} from '../models/index.js';
import { AuthenticationError, AuthorizationError, NotFoundError, ValidationError } from '../utils/errors.js';
import sequelize from '../models/sequelizeClient.js';

const DEFAULT_LOOKBACK_DAYS = 90;
const ALLOWED_ROLE_SET = new Set(['agency', 'agency_admin', 'admin']);

function slugify(value, fallback = 'post') {
  if (!value) {
    return fallback;
  }
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160) || fallback;
}

async function ensureUniqueSlug(baseSlug, { transaction } = {}) {
  let candidate = slugify(baseSlug);
  if (!candidate) {
    candidate = 'post';
  }
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await AgencyTimelinePost.findOne({ where: { slug: candidate }, transaction, attributes: ['id'] });
    if (!existing) {
      return candidate;
    }
    suffix += 1;
    candidate = `${slugify(baseSlug)}-${suffix}`;
  }
}

function normaliseStringArray(values, { limit = 20, maxLength = 120 } = {}) {
  if (!Array.isArray(values)) {
    return [];
  }
  const filtered = values
    .map((value) => `${value ?? ''}`.trim())
    .filter((value) => value.length > 0)
    .map((value) => value.slice(0, maxLength));
  return Array.from(new Set(filtered)).slice(0, limit);
}

function sanitiseChannels(channels) {
  const allowed = new Set(AGENCY_TIMELINE_DISTRIBUTION_CHANNELS);
  return normaliseStringArray(channels).filter((channel) => allowed.has(channel));
}

function sanitiseAttachments(attachments) {
  if (!Array.isArray(attachments)) {
    return [];
  }
  return attachments
    .map((item, index) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const label = `${item.label ?? ''}`.trim().slice(0, 180);
      const type = `${item.type ?? ''}`.trim().slice(0, 60) || 'file';
      const url = `${item.url ?? ''}`.trim();
      if (!url) {
        return null;
      }
      return {
        id: item.id ?? `att-${index + 1}`,
        label: label || `Attachment ${index + 1}`,
        type,
        url,
      };
    })
    .filter(Boolean)
    .slice(0, 25);
}

function sanitiseVisibility(value) {
  const normalised = `${value ?? ''}`.trim().toLowerCase();
  if (AGENCY_TIMELINE_VISIBILITIES.includes(normalised)) {
    return normalised;
  }
  return 'internal';
}

function sanitiseStatus(value) {
  const normalised = `${value ?? ''}`.trim().toLowerCase();
  if (AGENCY_TIMELINE_POST_STATUSES.includes(normalised)) {
    return normalised;
  }
  return 'draft';
}

function determineEngagementRate({ impressions = 0, engagements = 0 }) {
  const safeImpressions = Number(impressions) || 0;
  if (!safeImpressions) {
    return 0;
  }
  const safeEngagements = Number(engagements) || 0;
  return safeEngagements / safeImpressions;
}

function normaliseDate(input) {
  if (!input) {
    return null;
  }
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function resolveAgencyWorkspace({ workspaceId, workspaceSlug } = {}, { actorId, actorRole } = {}) {
  if (!actorId) {
    throw new AuthenticationError('Authentication required to manage timeline posts.');
  }
  const normalisedRole = typeof actorRole === 'string' ? actorRole.toLowerCase() : null;
  if (!ALLOWED_ROLE_SET.has(normalisedRole)) {
    throw new AuthorizationError('You do not have permission to manage agency timeline posts.');
  }

  async function ensureAccess(workspace) {
    if (!workspace) {
      return null;
    }
    if (normalisedRole === 'admin' || workspace.ownerId === actorId) {
      return workspace;
    }
    const membership = await ProviderWorkspaceMember.count({
      where: { workspaceId: workspace.id, userId: actorId },
    });
    if (membership === 0) {
      throw new AuthorizationError('You do not have permission to access this agency workspace.');
    }
    return workspace;
  }

  if (workspaceId || workspaceSlug) {
    const where = { type: 'agency' };
    if (workspaceId) where.id = workspaceId;
    if (workspaceSlug) where.slug = workspaceSlug;
    const workspace = await ProviderWorkspace.findOne({ where });
    if (!workspace) {
      throw new NotFoundError('Agency workspace not found.');
    }
    return ensureAccess(workspace);
  }

  if (normalisedRole === 'admin') {
    const workspace = await ProviderWorkspace.findOne({ where: { type: 'agency' }, order: [['createdAt', 'ASC']] });
    if (!workspace) {
      throw new AuthorizationError('No agency workspaces have been provisioned yet.');
    }
    return workspace;
  }

  const ownedWorkspace = await ProviderWorkspace.findOne({
    where: { type: 'agency', ownerId: actorId },
    order: [['createdAt', 'ASC']],
  });
  if (ownedWorkspace) {
    return ownedWorkspace;
  }

  const membership = await ProviderWorkspaceMember.findOne({
    where: { userId: actorId },
    include: [
      {
        model: ProviderWorkspace,
        as: 'workspace',
        where: { type: 'agency' },
        required: true,
      },
    ],
    order: [['createdAt', 'ASC']],
  });

  if (!membership?.workspace) {
    throw new AuthorizationError('No agency workspace is linked to your account yet.');
  }

  return membership.workspace;
}

function presentUser(user) {
  if (!user) {
    return null;
  }
  const plain = user.get ? user.get({ plain: true }) : user;
  const nameParts = [plain.firstName, plain.lastName].filter(Boolean);
  return {
    id: plain.id,
    name: nameParts.length ? nameParts.join(' ') : plain.email || null,
    email: plain.email ?? null,
  };
}

function aggregateMetricsByPost(metrics = []) {
  const perPost = new Map();
  metrics.forEach((metric) => {
    const postId = metric.postId;
    if (!perPost.has(postId)) {
      perPost.set(postId, {
        impressions: 0,
        clicks: 0,
        engagements: 0,
        shares: 0,
        comments: 0,
        leads: 0,
        audience: 0,
        conversionRate: 0,
        periods: [],
        channels: new Map(),
      });
    }
    const aggregate = perPost.get(postId);
    aggregate.impressions += Number(metric.impressions) || 0;
    aggregate.clicks += Number(metric.clicks) || 0;
    aggregate.engagements += Number(metric.engagements) || 0;
    aggregate.shares += Number(metric.shares) || 0;
    aggregate.comments += Number(metric.comments) || 0;
    aggregate.leads += Number(metric.leads) || 0;
    aggregate.audience += Number(metric.audience) || 0;
    aggregate.periods.push({
      periodStart: metric.periodStart,
      periodEnd: metric.periodEnd,
      impressions: Number(metric.impressions) || 0,
      engagements: Number(metric.engagements) || 0,
      clicks: Number(metric.clicks) || 0,
      conversionRate: Number(metric.conversionRate) || 0,
      channel: metric.channel ?? null,
    });
    const channelKey = metric.channel ?? 'unspecified';
    const existingChannel = aggregate.channels.get(channelKey) ?? {
      channel: channelKey,
      impressions: 0,
      engagements: 0,
      clicks: 0,
      leads: 0,
    };
    existingChannel.impressions += Number(metric.impressions) || 0;
    existingChannel.engagements += Number(metric.engagements) || 0;
    existingChannel.clicks += Number(metric.clicks) || 0;
    existingChannel.leads += Number(metric.leads) || 0;
    aggregate.channels.set(channelKey, existingChannel);
    aggregate.conversionRate = aggregate.impressions
      ? aggregate.leads / aggregate.impressions
      : aggregate.conversionRate;
  });
  return perPost;
}

function presentPost(post, aggregates = new Map()) {
  const plain = post.get ? post.get({ plain: true }) : post;
  const aggregate = aggregates.get(plain.id) ?? {
    impressions: 0,
    clicks: 0,
    engagements: 0,
    shares: 0,
    comments: 0,
    leads: 0,
    audience: 0,
    conversionRate: 0,
    periods: [],
    channels: new Map(),
  };

  const analytics = {
    impressions: aggregate.impressions,
    clicks: aggregate.clicks,
    engagements: aggregate.engagements,
    shares: aggregate.shares,
    comments: aggregate.comments,
    leads: aggregate.leads,
    audience: aggregate.audience,
    conversionRate: aggregate.conversionRate,
    engagementRate: determineEngagementRate(aggregate),
    channels: Array.from(aggregate.channels.values()).map((channel) => ({
      ...channel,
      engagementRate: determineEngagementRate(channel),
    })),
    periods: aggregate.periods.map((period) => ({
      ...period,
      engagementRate: determineEngagementRate(period),
    })),
  };

  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    title: plain.title,
    slug: plain.slug,
    excerpt: plain.excerpt,
    content: plain.content,
    status: plain.status,
    visibility: plain.visibility,
    scheduledAt: plain.scheduledAt,
    publishedAt: plain.publishedAt,
    archivedAt: plain.archivedAt,
    lastSentAt: plain.lastSentAt,
    heroImageUrl: plain.heroImageUrl,
    thumbnailUrl: plain.thumbnailUrl,
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    attachments: Array.isArray(plain.attachments) ? plain.attachments : [],
    distributionChannels: Array.isArray(plain.distributionChannels) ? plain.distributionChannels : [],
    audienceRoles: Array.isArray(plain.audienceRoles) ? plain.audienceRoles : [],
    owner: presentUser(plain.owner),
    createdBy: presentUser(plain.createdBy),
    updatedBy: presentUser(plain.updatedBy),
    engagementScore: Number(plain.engagementScore ?? analytics.engagementRate ?? 0),
    analytics,
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function buildTrendSeries(metrics = []) {
  const buckets = new Map();
  metrics.forEach((metric) => {
    const key = (metric.periodStart || metric.periodEnd || metric.createdAt || new Date()).toISOString().slice(0, 10);
    if (!buckets.has(key)) {
      buckets.set(key, {
        date: key,
        impressions: 0,
        clicks: 0,
        engagements: 0,
        leads: 0,
      });
    }
    const bucket = buckets.get(key);
    bucket.impressions += Number(metric.impressions) || 0;
    bucket.clicks += Number(metric.clicks) || 0;
    bucket.engagements += Number(metric.engagements) || 0;
    bucket.leads += Number(metric.leads) || 0;
  });
  return Array.from(buckets.values())
    .map((bucket) => ({
      ...bucket,
      engagementRate: determineEngagementRate(bucket),
      conversionRate: bucket.impressions ? bucket.leads / bucket.impressions : 0,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

async function fetchAggregates(postIds, { startDate } = {}) {
  if (!postIds.length) {
    return new Map();
  }
  const where = { postId: { [Op.in]: postIds } };
  if (startDate) {
    where.periodStart = { [Op.gte]: startDate };
  }
  const metrics = await AgencyTimelinePostMetric.findAll({ where });
  return aggregateMetricsByPost(metrics);
}

function buildAnalyticsSummary(metrics = []) {
  return metrics.reduce(
    (acc, metric) => ({
      impressions: acc.impressions + (Number(metric.impressions) || 0),
      clicks: acc.clicks + (Number(metric.clicks) || 0),
      engagements: acc.engagements + (Number(metric.engagements) || 0),
      shares: acc.shares + (Number(metric.shares) || 0),
      comments: acc.comments + (Number(metric.comments) || 0),
      leads: acc.leads + (Number(metric.leads) || 0),
      audience: acc.audience + (Number(metric.audience) || 0),
    }),
    { impressions: 0, clicks: 0, engagements: 0, shares: 0, comments: 0, leads: 0, audience: 0 },
  );
}

async function getTimelineDashboard(
  { workspaceId, workspaceSlug, lookbackDays = DEFAULT_LOOKBACK_DAYS } = {},
  { actorId, actorRole } = {},
) {
  const workspace = await resolveAgencyWorkspace({ workspaceId, workspaceSlug }, { actorId, actorRole });
  const parsedLookback = Number.isFinite(Number(lookbackDays)) && Number(lookbackDays) > 0 ? Number(lookbackDays) : DEFAULT_LOOKBACK_DAYS;
  const lookbackStart = new Date(Date.now() - parsedLookback * 24 * 60 * 60 * 1000);

  const posts = await AgencyTimelinePost.findAll({
    where: { workspaceId: workspace.id },
    include: [
      { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
    order: [
      ['status', 'ASC'],
      ['scheduledAt', 'ASC NULLS LAST'],
      ['publishedAt', 'DESC NULLS LAST'],
      ['updatedAt', 'DESC'],
    ],
  });

  const postIds = posts.map((post) => post.id);
  const metrics = await AgencyTimelinePostMetric.findAll({
    where: {
      postId: { [Op.in]: postIds.length ? postIds : [0] },
      periodStart: { [Op.gte]: lookbackStart },
    },
  });

  const aggregates = aggregateMetricsByPost(metrics);
  const presentedPosts = posts.map((post) => presentPost(post, aggregates));

  const pipeline = {
    draft: presentedPosts.filter((post) => post.status === 'draft'),
    scheduled: presentedPosts.filter((post) => post.status === 'scheduled'),
    published: presentedPosts.filter((post) => post.status === 'published'),
    archived: presentedPosts.filter((post) => post.status === 'archived'),
  };

  const summaryTotals = buildAnalyticsSummary(metrics);
  const publishedThisMonth = presentedPosts.filter((post) => {
    if (!post.publishedAt) return false;
    const publishedDate = new Date(post.publishedAt);
    const now = new Date();
    return publishedDate.getUTCFullYear() === now.getUTCFullYear() && publishedDate.getUTCMonth() === now.getUTCMonth();
  }).length;

  const scheduledCount = pipeline.scheduled.length;
  const engagementRate = determineEngagementRate(summaryTotals);
  const channelBreakdown = Array.from(
    presentedPosts.reduce((map, post) => {
      post.analytics.channels.forEach((channel) => {
        const key = channel.channel || 'unspecified';
        const existing = map.get(key) ?? { channel: key, posts: 0, impressions: 0, engagementRate: 0, clicks: 0 };
        existing.posts += 1;
        existing.impressions += Number(channel.impressions) || 0;
        existing.clicks += Number(channel.clicks) || 0;
        const rate = determineEngagementRate(channel);
        existing.engagementRate = existing.posts > 0 ? (existing.engagementRate * (existing.posts - 1) + rate) / existing.posts : rate;
        map.set(key, existing);
      });
      return map;
    }, new Map()),
  ).map((entry) => ({
    ...entry,
    conversionRate: entry.impressions ? entry.clicks / entry.impressions : 0,
  }));

  const trend = buildTrendSeries(metrics);

  const topPosts = presentedPosts
    .filter((post) => post.status === 'published')
    .map((post) => ({
      id: post.id,
      title: post.title,
      status: post.status,
      publishedAt: post.publishedAt,
      impressions: post.analytics.impressions,
      clicks: post.analytics.clicks,
      engagementRate: post.analytics.engagementRate,
      conversionRate: post.analytics.conversionRate,
    }))
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 8);

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      timezone: workspace.timezone,
    },
    summary: {
      totalPosts: presentedPosts.length,
      publishedThisMonth,
      scheduledCount,
      averageEngagementRate: engagementRate,
      topChannel: channelBreakdown.sort((a, b) => b.impressions - a.impressions)[0] ?? null,
      lookbackDays: parsedLookback,
      lastUpdatedAt: new Date(),
    },
    pipeline,
    analytics: {
      totals: {
        ...summaryTotals,
        engagementRate,
        conversionRate: summaryTotals.impressions ? summaryTotals.leads / summaryTotals.impressions : 0,
      },
      trend,
      topPosts,
      channelBreakdown,
    },
    metadata: {
      statuses: AGENCY_TIMELINE_POST_STATUSES,
      visibilities: AGENCY_TIMELINE_VISIBILITIES,
      channels: AGENCY_TIMELINE_DISTRIBUTION_CHANNELS,
    },
  };
}

async function listTimelinePosts(
  { workspaceId, workspaceSlug, status, search, limit = 50, offset = 0, lookbackDays = DEFAULT_LOOKBACK_DAYS } = {},
  context = {},
) {
  const workspace = await resolveAgencyWorkspace({ workspaceId, workspaceSlug }, context);
  const where = { workspaceId: workspace.id };
  if (status && AGENCY_TIMELINE_POST_STATUSES.includes(status)) {
    where.status = status;
  }
  if (search && `${search}`.trim()) {
    const term = `%${`${search}`.trim().toLowerCase()}%`;
    if (Op.iLike) {
      where[Op.or] = [
        { title: { [Op.iLike]: term } },
        { excerpt: { [Op.iLike]: term } },
      ];
    } else {
      where[Op.or] = [
        sequelize.where(fn('lower', col('title')), { [Op.like]: term }),
        sequelize.where(fn('lower', col('excerpt')), { [Op.like]: term }),
      ];
    }
  }

  const posts = await AgencyTimelinePost.findAndCountAll({
    where,
    include: [
      { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
    order: [
      ['status', 'ASC'],
      ['scheduledAt', 'ASC NULLS LAST'],
      ['publishedAt', 'DESC NULLS LAST'],
      ['updatedAt', 'DESC'],
    ],
    limit,
    offset,
  });

  const lookbackStart = new Date(Date.now() - Number(lookbackDays || DEFAULT_LOOKBACK_DAYS) * 24 * 60 * 60 * 1000);
  const aggregates = await fetchAggregates(posts.rows.map((post) => post.id), { startDate: lookbackStart });

  return {
    total: posts.count,
    results: posts.rows.map((post) => presentPost(post, aggregates)),
  };
}

async function getTimelinePost(postId, context = {}) {
  const post = await AgencyTimelinePost.findByPk(postId, {
    include: [
      { model: ProviderWorkspace, as: 'workspace', attributes: ['id', 'name', 'slug', 'timezone'] },
      { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
  });
  if (!post) {
    throw new NotFoundError('Timeline post not found.');
  }

  await resolveAgencyWorkspace({ workspaceId: post.workspaceId }, context);
  const aggregates = await fetchAggregates([post.id]);
  const revisions = await AgencyTimelinePostRevision.findAll({
    where: { postId: post.id },
    order: [['version', 'DESC']],
    limit: 25,
  });

  return {
    post: presentPost(post, aggregates),
    revisions: revisions.map((revision) => {
      const plain = revision.get({ plain: true });
      return {
        id: plain.id,
        version: plain.version,
        title: plain.title,
        excerpt: plain.excerpt,
        changeSummary: plain.changeSummary,
        createdAt: plain.createdAt,
        editorId: plain.editorId,
        snapshot: plain.snapshot ?? null,
      };
    }),
  };
}

function assertValidStatusTransition(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) {
    return;
  }
  const allowedTransitions = {
    draft: new Set(['draft', 'scheduled', 'published', 'archived']),
    scheduled: new Set(['draft', 'scheduled', 'published', 'archived']),
    published: new Set(['published', 'archived']),
    archived: new Set(['archived']),
  };
  const allowed = allowedTransitions[currentStatus] ?? new Set();
  if (!allowed.has(nextStatus)) {
    throw new ValidationError(`Cannot transition post from ${currentStatus} to ${nextStatus}.`);
  }
}

function validateSchedule(status, scheduledAt) {
  if (status === 'scheduled') {
    const date = normaliseDate(scheduledAt);
    if (!date) {
      throw new ValidationError('Scheduled posts must include a valid scheduledAt value.');
    }
    if (date.getTime() < Date.now() - 60 * 1000) {
      throw new ValidationError('Scheduled posts must be set in the future.');
    }
  }
}

async function createTimelinePost(
  {
    workspaceId,
    workspaceSlug,
    title,
    excerpt,
    content,
    visibility,
    status = 'draft',
    scheduledAt,
    publishedAt,
    ownerId,
    tags,
    attachments,
    distributionChannels,
    audienceRoles,
    metadata = {},
  } = {},
  { actorId, actorRole } = {},
) {
  const workspace = await resolveAgencyWorkspace({ workspaceId, workspaceSlug }, { actorId, actorRole });
  const normalisedTitle = `${title ?? ''}`.trim();
  if (!normalisedTitle) {
    throw new ValidationError('Title is required.');
  }
  const normalisedStatus = sanitiseStatus(status);
  validateSchedule(normalisedStatus, scheduledAt);

  return sequelize.transaction(async (transaction) => {
    const slug = await ensureUniqueSlug(normalisedTitle, { transaction });
    const record = await AgencyTimelinePost.create(
      {
        workspaceId: workspace.id,
        title: normalisedTitle,
        slug,
        excerpt: excerpt ? `${excerpt}`.slice(0, 500) : null,
        content: content ?? null,
        visibility: sanitiseVisibility(visibility),
        status: normalisedStatus,
        scheduledAt: normaliseDate(scheduledAt),
        publishedAt: normaliseDate(publishedAt),
        ownerId: ownerId ?? actorId ?? null,
        createdById: actorId ?? null,
        updatedById: actorId ?? null,
        tags: normaliseStringArray(tags, { limit: 16, maxLength: 60 }),
        attachments: sanitiseAttachments(attachments),
        distributionChannels: sanitiseChannels(distributionChannels),
        audienceRoles: normaliseStringArray(audienceRoles, { limit: 10, maxLength: 60 }),
        metadata: metadata && typeof metadata === 'object' ? metadata : {},
        engagementScore: 0,
      },
      { transaction },
    );

    await AgencyTimelinePostRevision.create(
      {
        postId: record.id,
        editorId: actorId ?? null,
        version: 1,
        title: record.title,
        excerpt: record.excerpt,
        content: record.content,
        snapshot: presentPost(record, new Map()),
      },
      { transaction },
    );

    const fresh = await AgencyTimelinePost.findByPk(record.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      transaction,
    });

    return presentPost(fresh, new Map());
  });
}

async function updateTimelinePost(
  postId,
  {
    title,
    excerpt,
    content,
    visibility,
    status,
    scheduledAt,
    publishedAt,
    ownerId,
    tags,
    attachments,
    distributionChannels,
    audienceRoles,
    metadata,
  } = {},
  { actorId, actorRole } = {},
) {
  const post = await AgencyTimelinePost.findByPk(postId);
  if (!post) {
    throw new NotFoundError('Timeline post not found.');
  }
  await resolveAgencyWorkspace({ workspaceId: post.workspaceId }, { actorId, actorRole });

  const nextTitle = title != null ? `${title}`.trim() : post.title;
  if (!nextTitle) {
    throw new ValidationError('Title is required.');
  }
  const nextStatus = status != null ? sanitiseStatus(status) : post.status;
  assertValidStatusTransition(post.status, nextStatus);
  validateSchedule(nextStatus, scheduledAt ?? post.scheduledAt);

  return sequelize.transaction(async (transaction) => {
    if (title != null && `${title}`.trim() !== post.title) {
      post.title = `${title}`.trim();
      post.slug = await ensureUniqueSlug(post.title, { transaction });
    } else if (title != null) {
      post.title = `${title}`.trim();
    }
    if (excerpt !== undefined) {
      post.excerpt = excerpt ? `${excerpt}`.slice(0, 500) : null;
    }
    if (content !== undefined) {
      post.content = content ?? null;
    }
    if (visibility !== undefined) {
      post.visibility = sanitiseVisibility(visibility);
    }
    if (status !== undefined) {
      post.status = nextStatus;
      if (nextStatus === 'published' && !post.publishedAt) {
        post.publishedAt = new Date();
      }
      if (nextStatus === 'archived') {
        post.archivedAt = new Date();
      }
    }
    if (scheduledAt !== undefined) {
      post.scheduledAt = normaliseDate(scheduledAt);
    }
    if (publishedAt !== undefined) {
      post.publishedAt = normaliseDate(publishedAt);
    }
    if (ownerId !== undefined) {
      post.ownerId = ownerId ?? null;
    }
    if (tags !== undefined) {
      post.tags = normaliseStringArray(tags, { limit: 16, maxLength: 60 });
    }
    if (attachments !== undefined) {
      post.attachments = sanitiseAttachments(attachments);
    }
    if (distributionChannels !== undefined) {
      post.distributionChannels = sanitiseChannels(distributionChannels);
    }
    if (audienceRoles !== undefined) {
      post.audienceRoles = normaliseStringArray(audienceRoles, { limit: 10, maxLength: 60 });
    }
    if (metadata !== undefined) {
      post.metadata = metadata && typeof metadata === 'object' ? metadata : {};
    }
    post.updatedById = actorId ?? post.updatedById ?? null;

    await post.save({ transaction });

    const lastRevision = await AgencyTimelinePostRevision.findOne({
      where: { postId: post.id },
      order: [['version', 'DESC']],
      transaction,
    });
    const nextVersion = (lastRevision?.version ?? 0) + 1;
    await AgencyTimelinePostRevision.create(
      {
        postId: post.id,
        editorId: actorId ?? null,
        version: nextVersion,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        changeSummary: `Updated by ${actorId ?? 'system'} at ${new Date().toISOString()}`,
        snapshot: presentPost(post, new Map()),
      },
      { transaction },
    );

    const fresh = await AgencyTimelinePost.findByPk(post.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      transaction,
    });
    const aggregates = await fetchAggregates([post.id]);
    return presentPost(fresh, aggregates);
  });
}

async function updateTimelinePostStatus(postId, { status, scheduledAt, publishedAt } = {}, context = {}) {
  if (!status) {
    throw new ValidationError('Status is required.');
  }
  const post = await AgencyTimelinePost.findByPk(postId);
  if (!post) {
    throw new NotFoundError('Timeline post not found.');
  }
  await resolveAgencyWorkspace({ workspaceId: post.workspaceId }, context);
  const nextStatus = sanitiseStatus(status);
  assertValidStatusTransition(post.status, nextStatus);
  validateSchedule(nextStatus, scheduledAt ?? post.scheduledAt);

  post.status = nextStatus;
  if (scheduledAt !== undefined) {
    post.scheduledAt = normaliseDate(scheduledAt);
  }
  if (publishedAt !== undefined) {
    post.publishedAt = normaliseDate(publishedAt);
  }
  if (nextStatus === 'published') {
    post.publishedAt = post.publishedAt ?? new Date();
  }
  if (nextStatus === 'archived') {
    post.archivedAt = new Date();
  }
  await post.save();

  const aggregates = await fetchAggregates([post.id]);
  const fresh = await AgencyTimelinePost.findByPk(post.id, {
    include: [
      { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
  });
  return presentPost(fresh, aggregates);
}

async function deleteTimelinePost(postId, context = {}) {
  const post = await AgencyTimelinePost.findByPk(postId);
  if (!post) {
    throw new NotFoundError('Timeline post not found.');
  }
  await resolveAgencyWorkspace({ workspaceId: post.workspaceId }, context);
  post.status = 'archived';
  post.archivedAt = new Date();
  await post.save();
  return { success: true };
}

async function getTimelinePostAnalytics(postId, { lookbackDays = DEFAULT_LOOKBACK_DAYS } = {}, context = {}) {
  const post = await AgencyTimelinePost.findByPk(postId);
  if (!post) {
    throw new NotFoundError('Timeline post not found.');
  }
  await resolveAgencyWorkspace({ workspaceId: post.workspaceId }, context);
  const parsedLookback = Number.isFinite(Number(lookbackDays)) && Number(lookbackDays) > 0 ? Number(lookbackDays) : DEFAULT_LOOKBACK_DAYS;
  const lookbackStart = new Date(Date.now() - parsedLookback * 24 * 60 * 60 * 1000);

  const metrics = await AgencyTimelinePostMetric.findAll({
    where: {
      postId: post.id,
      periodStart: { [Op.gte]: lookbackStart },
    },
    order: [['periodStart', 'ASC']],
  });

  const aggregate = aggregateMetricsByPost(metrics).get(post.id) ?? {
    impressions: 0,
    clicks: 0,
    engagements: 0,
    shares: 0,
    comments: 0,
    leads: 0,
    audience: 0,
    conversionRate: 0,
    periods: [],
    channels: new Map(),
  };

  return {
    postId: post.id,
    totals: {
      impressions: aggregate.impressions,
      clicks: aggregate.clicks,
      engagements: aggregate.engagements,
      shares: aggregate.shares,
      comments: aggregate.comments,
      leads: aggregate.leads,
      audience: aggregate.audience,
      engagementRate: determineEngagementRate(aggregate),
      conversionRate: aggregate.conversionRate,
    },
    trend: buildTrendSeries(metrics),
    channels: Array.from(aggregate.channels.values()).map((channel) => ({
      ...channel,
      engagementRate: determineEngagementRate(channel),
      conversionRate: channel.impressions ? channel.leads / channel.impressions : 0,
    })),
  };
}

export {
  getTimelineDashboard,
  listTimelinePosts,
  getTimelinePost,
  createTimelinePost,
  updateTimelinePost,
  updateTimelinePostStatus,
  deleteTimelinePost,
  getTimelinePostAnalytics,
};

export default {
  getTimelineDashboard,
  listTimelinePosts,
  getTimelinePost,
  createTimelinePost,
  updateTimelinePost,
  updateTimelinePostStatus,
  deleteTimelinePost,
  getTimelinePostAnalytics,
};
