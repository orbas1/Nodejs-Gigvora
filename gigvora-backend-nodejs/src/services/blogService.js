import { Op, literal } from 'sequelize';
import {
  BlogCategory,
  BlogMedia,
  BlogPost,
  BlogPostMedia,
  BlogPostMetric,
  BlogPostTag,
  BlogComment,
  BlogTag,
  BLOG_COMMENT_STATUSES,
  User,
  sequelize,
} from '../models/index.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const STATUS_SET = new Set(['draft', 'scheduled', 'published', 'archived']);
const COUNTED_COMMENT_STATUSES = new Set(['approved']);
const COMMENT_STATUS_SET = new Set(BLOG_COMMENT_STATUSES);

function slugify(value, fallback = 'blog-post') {
  const base = `${value ?? ''}`.trim().toLowerCase();
  const sanitized = base
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  if (sanitized) {
    return sanitized;
  }
  return `${fallback}-${Math.random().toString(36).slice(2, 8)}`;
}

async function ensureUniqueSlug(model, desiredSlug, { transaction, excludeId } = {}) {
  let candidate = slugify(desiredSlug);
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const where = { slug: candidate };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    // eslint-disable-next-line no-await-in-loop
    const existing = await model.findOne({ where, transaction, paranoid: false });
    if (!existing) {
      return candidate;
    }
    suffix += 1;
    candidate = `${slugify(desiredSlug)}-${suffix}`;
  }
}

function normaliseArray(input) {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input;
  }
  return [input];
}

function toIntegerValue(value, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {}) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number.parseInt(value, 10);
  if (Number.isNaN(numeric)) {
    throw new ValidationError('Numeric values are required.');
  }
  return Math.min(Math.max(numeric, min), max);
}

function toDecimalValue(value, { min = 0, max = 100 } = {}) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number.parseFloat(value);
  if (Number.isNaN(numeric)) {
    throw new ValidationError('Decimal values are required.');
  }
  return Math.min(Math.max(numeric, min), max);
}

function parseDateInput(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError('Invalid timestamp provided.');
  }
  return date;
}

function normaliseCommentStatus(status, { defaultValue = null } = {}) {
  if (!status) {
    return defaultValue;
  }
  const normalised = `${status}`.trim().toLowerCase();
  if (!COMMENT_STATUS_SET.has(normalised)) {
    throw new ValidationError('Unsupported comment status.');
  }
  return normalised;
}

async function ensureMetricsRecord(postId, { transaction } = {}) {
  if (!postId) {
    throw new ValidationError('A valid blog post identifier is required.');
  }
  const [metrics] = await BlogPostMetric.findOrCreate({
    where: { postId },
    defaults: {
      totalViews: 0,
      uniqueVisitors: 0,
      averageReadTimeSeconds: 0,
      readCompletionRate: 0,
      clickThroughRate: 0,
      bounceRate: 0,
      shareCount: 0,
      likeCount: 0,
      subscriberConversions: 0,
      commentCount: 0,
      lastSyncedAt: null,
      metadata: null,
    },
    transaction,
  });
  return metrics;
}

async function refreshCommentCount(postId, { transaction } = {}) {
  if (!postId) {
    return null;
  }
  const commentCount = await BlogComment.count({
    where: {
      postId,
      status: { [Op.in]: Array.from(COUNTED_COMMENT_STATUSES) },
    },
    transaction,
  });
  const metrics = await ensureMetricsRecord(postId, { transaction });
  metrics.commentCount = commentCount;
  await metrics.save({ transaction });
  return metrics;
}

function asNumber(value, fallback = 0) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return fallback;
  }
  return numeric;
}

async function resolveCategory(input, { transaction, allowCreate = true } = {}) {
  if (!input) {
    return null;
  }
  if (typeof input === 'number' || /^\d+$/.test(`${input}`)) {
    const category = await BlogCategory.findByPk(Number(input), { transaction });
    if (!category) {
      throw new NotFoundError('Blog category not found.');
    }
    return category;
  }
  if (typeof input === 'string') {
    const category = await BlogCategory.findOne({ where: { slug: slugify(input) }, transaction });
    if (category) {
      return category;
    }
    if (!allowCreate) {
      throw new NotFoundError('Blog category not found.');
    }
    return BlogCategory.create(
      {
        name: input,
        slug: await ensureUniqueSlug(BlogCategory, input, { transaction }),
      },
      { transaction },
    );
  }
  if (typeof input === 'object') {
    const { id, slug, name, description, accentColor, heroImageUrl } = input;
    if (id) {
      return resolveCategory(id, { transaction, allowCreate });
    }
    if (!name) {
      throw new ValidationError('Category name is required.');
    }
    const normalizedSlug = slug ? slugify(slug) : await ensureUniqueSlug(BlogCategory, name, { transaction });
    const [category] = await BlogCategory.findOrCreate({
      where: { slug: normalizedSlug },
      defaults: {
        name,
        slug: normalizedSlug,
        description: description ?? null,
        accentColor: accentColor ?? null,
        heroImageUrl: heroImageUrl ?? null,
      },
      transaction,
    });
    if (description || accentColor || heroImageUrl) {
      category.set({
        description: description ?? category.description,
        accentColor: accentColor ?? category.accentColor,
        heroImageUrl: heroImageUrl ?? category.heroImageUrl,
      });
      await category.save({ transaction });
    }
    return category;
  }
  return null;
}

async function resolveTags(tagsInput, { transaction } = {}) {
  const tags = normaliseArray(tagsInput)
    .map((tag) => (typeof tag === 'string' ? { name: tag } : tag))
    .filter((tag) => tag && (tag.id || tag.slug || tag.name));

  if (!tags.length) {
    return [];
  }

  const resolved = [];
  for (const tag of tags) {
    if (tag.id) {
      const existing = await BlogTag.findByPk(tag.id, { transaction });
      if (!existing) {
        throw new NotFoundError(`Blog tag ${tag.id} could not be found.`);
      }
      resolved.push(existing);
      // eslint-disable-next-line no-continue
      continue;
    }
    const baseSlug = tag.slug ? slugify(tag.slug) : slugify(tag.name);
    const slug = await ensureUniqueSlug(BlogTag, baseSlug, { transaction });
    const [record] = await BlogTag.findOrCreate({
      where: { slug: baseSlug },
      defaults: {
        name: tag.name ?? tag.slug ?? slug,
        slug,
        description: tag.description ?? null,
        metadata: tag.metadata ?? null,
      },
      transaction,
    });
    if (tag.description || tag.metadata) {
      record.set({
        description: tag.description ?? record.description,
        metadata: tag.metadata ?? record.metadata,
      });
      await record.save({ transaction });
    }
    resolved.push(record);
  }
  return resolved;
}

async function resolveMedia(mediaInput, { transaction } = {}) {
  const items = normaliseArray(mediaInput)
    .map((media) => (typeof media === 'string' ? { url: media } : media))
    .filter((media) => media && (media.id || media.url));

  if (!items.length) {
    return [];
  }

  const resolved = [];
  for (const item of items) {
    if (item.id) {
      const existing = await BlogMedia.findByPk(item.id, { transaction });
      if (!existing) {
        throw new NotFoundError(`Media asset ${item.id} not found.`);
      }
      resolved.push({ instance: existing, payload: item });
      // eslint-disable-next-line no-continue
      continue;
    }
    if (!item.url) {
      throw new ValidationError('Media url is required.');
    }
    const created = await BlogMedia.create(
      {
        url: item.url,
        type: item.type ?? null,
        altText: item.altText ?? null,
        caption: item.caption ?? null,
        metadata: item.metadata ?? null,
      },
      { transaction },
    );
    resolved.push({ instance: created, payload: item });
  }
  return resolved;
}

function buildInclude({ requireCategory, requireTag } = {}) {
  return [
    {
      model: BlogCategory,
      as: 'category',
      required: Boolean(requireCategory),
      ...(requireCategory ? { where: requireCategory } : {}),
    },
    {
      model: BlogTag,
      as: 'tags',
      through: { attributes: [] },
      required: Boolean(requireTag),
      ...(requireTag ? { where: requireTag } : {}),
    },
    { model: BlogMedia, as: 'coverImage' },
    {
      model: BlogMedia,
      as: 'media',
      through: { attributes: ['position', 'role', 'caption'] },
    },
    { model: BlogPostMetric, as: 'metrics' },
    {
      model: User,
      as: 'author',
      attributes: ['id', 'firstName', 'lastName', 'email'],
    },
  ];
}

function buildPagination({ count, page, pageSize }) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  return {
    total: count,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export async function listBlogPosts(
  { status = 'published', page = 1, pageSize = 12, category, tag, search, includeUnpublished = false } = {},
) {
  const normalizedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const normalizedPageSize = Math.min(50, Math.max(1, Number.parseInt(pageSize, 10) || 12));

  const where = {};
  if (!includeUnpublished) {
    where.status = 'published';
  } else if (status && STATUS_SET.has(status)) {
    where.status = status;
  }

  if (search) {
    const value = `%${search.trim()}%`;
    where[Op.or] = [
      { title: { [Op.iLike ?? Op.like]: value } },
      { excerpt: { [Op.iLike ?? Op.like]: value } },
      { content: { [Op.iLike ?? Op.like]: value } },
    ];
  }

  const include = buildInclude({
    requireCategory: category ? { slug: slugify(category) } : null,
    requireTag: tag ? { slug: slugify(tag) } : null,
  });

  const { rows, count } = await BlogPost.findAndCountAll({
    where,
    include,
    limit: normalizedPageSize,
    offset: (normalizedPage - 1) * normalizedPageSize,
    order: [
      [literal('CASE WHEN "BlogPost"."featured" THEN 0 ELSE 1 END'), 'ASC'],
      ['publishedAt', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    distinct: true,
  });

  return {
    results: rows.map((row) => row.toPublicObject()),
    pagination: buildPagination({ count, page: normalizedPage, pageSize: normalizedPageSize }),
  };
}

export async function getBlogPost(identifier, { includeUnpublished = false } = {}) {
  if (!identifier) {
    throw new ValidationError('A blog identifier is required.');
  }

  const where = typeof identifier === 'number' || /^\d+$/.test(`${identifier}`)
    ? { id: Number(identifier) }
    : { slug: identifier };

  if (!includeUnpublished) {
    where.status = 'published';
  }

  const post = await BlogPost.findOne({
    where,
    include: buildInclude(),
  });

  if (!post) {
    throw new NotFoundError('Blog post not found.');
  }

  return post.toPublicObject();
}

function normaliseStatus(status) {
  if (!status) {
    return 'draft';
  }
  const normalized = `${status}`.trim().toLowerCase();
  if (!STATUS_SET.has(normalized)) {
    throw new ValidationError('Unsupported blog status.');
  }
  return normalized;
}

function computePublishedAt(status, publishedAt) {
  if (publishedAt) {
    const date = new Date(publishedAt);
    if (Number.isNaN(date.getTime())) {
      throw new ValidationError('Invalid publication timestamp.');
    }
    return date;
  }
  if (status === 'published') {
    return new Date();
  }
  return null;
}

async function upsertBlogPost(payload, { actorId, post }) {
  const {
    title,
    slug,
    excerpt,
    content,
    status,
    publishedAt,
    readingTimeMinutes,
    featured,
    category,
    categoryId,
    tags,
    media,
    coverImage,
    coverImageId,
    meta,
  } = payload ?? {};

  if (!title || !content) {
    throw new ValidationError('Blog posts require a title and content.');
  }

  const resolvedStatus = normaliseStatus(status ?? post?.status);
  const publicationDate = computePublishedAt(resolvedStatus, publishedAt ?? post?.publishedAt);

  return sequelize.transaction(async (transaction) => {
    const categoryInstance = await resolveCategory(category ?? categoryId, { transaction, allowCreate: true });
    const tagsCollection = await resolveTags(tags, { transaction });
    const mediaCollection = await resolveMedia(media, { transaction });

    let coverImageInstance = null;
    if (coverImageId || coverImage) {
      const [result] = await resolveMedia(coverImageId ? [{ id: coverImageId }] : [coverImage], { transaction });
      coverImageInstance = result?.instance ?? null;
    }

    const slugCandidate = await ensureUniqueSlug(BlogPost, slug ?? title, {
      transaction,
      excludeId: post?.id,
    });

    const payloadToPersist = {
      title,
      slug: slugCandidate,
      excerpt: excerpt ?? post?.excerpt ?? null,
      content,
      status: resolvedStatus,
      publishedAt: publicationDate,
      readingTimeMinutes: readingTimeMinutes ?? post?.readingTimeMinutes ?? 5,
      featured: Boolean(featured ?? post?.featured ?? false),
      authorId: actorId ?? post?.authorId ?? null,
      categoryId: categoryInstance?.id ?? null,
      coverImageId: coverImageInstance?.id ?? post?.coverImageId ?? null,
      meta: meta ?? post?.meta ?? null,
    };

    let target = post;
    if (!target) {
      target = await BlogPost.create(payloadToPersist, { transaction });
    } else {
      target.set(payloadToPersist);
      await target.save({ transaction });
    }

    if (tagsCollection.length) {
      await target.setTags(tagsCollection, { transaction });
    } else {
      await target.setTags([], { transaction });
    }

    if (mediaCollection.length) {
      await BlogPostMedia.destroy({ where: { postId: target.id }, transaction });
      await Promise.all(
        mediaCollection.map(({ instance, payload: mediaPayload }, index) =>
          BlogPostMedia.create(
            {
              postId: target.id,
              mediaId: instance.id,
              position: mediaPayload.position ?? index,
              role: mediaPayload.role ?? null,
              caption: mediaPayload.caption ?? instance.caption ?? null,
            },
            { transaction },
          ),
        ),
      );
    }

    await ensureMetricsRecord(target.id, { transaction });

    await target.reload({
      transaction,
      include: buildInclude(),
    });

    return target.toPublicObject();
  });
}

export async function createBlogPost(payload, { actorId } = {}) {
  return upsertBlogPost(payload, { actorId });
}

export async function updateBlogPost(postId, payload, { actorId } = {}) {
  if (!postId) {
    throw new ValidationError('A valid blog post identifier is required.');
  }
  const post = await BlogPost.findByPk(postId, { include: buildInclude() });
  if (!post) {
    throw new NotFoundError('Blog post not found.');
  }
  return upsertBlogPost(payload, { actorId, post });
}

export async function deleteBlogPost(postId) {
  if (!postId) {
    throw new ValidationError('A valid blog post identifier is required.');
  }
  const post = await BlogPost.findByPk(postId);
  if (!post) {
    throw new NotFoundError('Blog post not found.');
  }
  await sequelize.transaction(async (transaction) => {
    await BlogPostMedia.destroy({ where: { postId }, transaction });
    await BlogPostTag.destroy({ where: { postId }, transaction });
    await post.destroy({ transaction });
  });
  return { success: true };
}

export async function listBlogCategories() {
  const categories = await BlogCategory.findAll({ order: [['name', 'ASC']] });
  return categories.map((category) => category.toPublicObject());
}

export async function createBlogCategory(payload) {
  if (!payload?.name) {
    throw new ValidationError('Category name is required.');
  }
  const slug = await ensureUniqueSlug(BlogCategory, payload.slug ?? payload.name);
  const category = await BlogCategory.create({
    name: payload.name,
    slug,
    description: payload.description ?? null,
    accentColor: payload.accentColor ?? null,
    heroImageUrl: payload.heroImageUrl ?? null,
    metadata: payload.metadata ?? null,
  });
  return category.toPublicObject();
}

export async function updateBlogCategory(categoryId, payload) {
  if (!categoryId) {
    throw new ValidationError('Category id is required.');
  }
  const category = await BlogCategory.findByPk(categoryId);
  if (!category) {
    throw new NotFoundError('Category not found.');
  }
  if (payload.slug) {
    category.slug = await ensureUniqueSlug(BlogCategory, payload.slug, { excludeId: category.id });
  }
  category.name = payload.name ?? category.name;
  category.description = payload.description ?? category.description;
  category.accentColor = payload.accentColor ?? category.accentColor;
  category.heroImageUrl = payload.heroImageUrl ?? category.heroImageUrl;
  category.metadata = payload.metadata ?? category.metadata;
  await category.save();
  return category.toPublicObject();
}

export async function deleteBlogCategory(categoryId) {
  if (!categoryId) {
    throw new ValidationError('Category id is required.');
  }
  const category = await BlogCategory.findByPk(categoryId);
  if (!category) {
    throw new NotFoundError('Category not found.');
  }
  const postCount = await BlogPost.count({ where: { categoryId } });
  if (postCount > 0) {
    throw new ValidationError('Cannot delete a category that is assigned to published content.');
  }
  await category.destroy();
  return { success: true };
}

export async function listBlogTags() {
  const tags = await BlogTag.findAll({ order: [['name', 'ASC']] });
  return tags.map((tag) => tag.toPublicObject());
}

export async function createBlogTag(payload) {
  if (!payload?.name) {
    throw new ValidationError('Tag name is required.');
  }
  const slug = await ensureUniqueSlug(BlogTag, payload.slug ?? payload.name);
  const tag = await BlogTag.create({
    name: payload.name,
    slug,
    description: payload.description ?? null,
    metadata: payload.metadata ?? null,
  });
  return tag.toPublicObject();
}

export async function updateBlogTag(tagId, payload) {
  if (!tagId) {
    throw new ValidationError('Tag id is required.');
  }
  const tag = await BlogTag.findByPk(tagId);
  if (!tag) {
    throw new NotFoundError('Tag not found.');
  }
  if (payload.slug) {
    tag.slug = await ensureUniqueSlug(BlogTag, payload.slug, { excludeId: tag.id });
  }
  tag.name = payload.name ?? tag.name;
  tag.description = payload.description ?? tag.description;
  tag.metadata = payload.metadata ?? tag.metadata;
  await tag.save();
  return tag.toPublicObject();
}

export async function deleteBlogTag(tagId) {
  if (!tagId) {
    throw new ValidationError('Tag id is required.');
  }
  const tag = await BlogTag.findByPk(tagId);
  if (!tag) {
    throw new NotFoundError('Tag not found.');
  }
  const usage = await BlogPostTag.count({ where: { tagId } });
  if (usage > 0) {
    throw new ValidationError('Cannot delete a tag that is still in use.');
  }
  await tag.destroy();
  return { success: true };
}

export async function createBlogMedia(payload) {
  if (!payload?.url) {
    throw new ValidationError('Media url is required.');
  }
  const media = await BlogMedia.create({
    url: payload.url,
    type: payload.type ?? null,
    altText: payload.altText ?? null,
    caption: payload.caption ?? null,
    metadata: payload.metadata ?? null,
  });
  return media.toPublicObject();
}

export async function getBlogMetricsOverview({ startDate, endDate } = {}) {
  const start = startDate ? parseDateInput(startDate) : null;
  const end = endDate ? parseDateInput(endDate) : null;

  const where = {};
  if (start || end) {
    where.updatedAt = {};
    if (start) {
      where.updatedAt[Op.gte] = start;
    }
    if (end) {
      where.updatedAt[Op.lte] = end;
    }
  }

  const metrics = await BlogPostMetric.findAll({
    where,
    include: [
      {
        model: BlogPost,
        as: 'post',
        attributes: ['id', 'title', 'slug', 'status', 'publishedAt', 'createdAt', 'updatedAt'],
      },
    ],
    order: [['updatedAt', 'DESC']],
  });

  const totals = {
    postsTracked: metrics.length,
    totalViews: 0,
    uniqueVisitors: 0,
    likeCount: 0,
    shareCount: 0,
    subscriberConversions: 0,
    commentCount: 0,
  };

  const byStatus = {};
  let totalReadTime = 0;
  let totalCompletion = 0;
  let totalClickThrough = 0;
  let totalBounce = 0;
  let countForRates = 0;
  let lastSyncedAt = null;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  let postsUpdatedThisWeek = 0;

  const dataset = metrics.map((metric) => {
    const post = metric.get('post');
    totals.totalViews += asNumber(metric.totalViews);
    totals.uniqueVisitors += asNumber(metric.uniqueVisitors);
    totals.likeCount += asNumber(metric.likeCount);
    totals.shareCount += asNumber(metric.shareCount);
    totals.subscriberConversions += asNumber(metric.subscriberConversions);
    totals.commentCount += asNumber(metric.commentCount);

    totalReadTime += asNumber(metric.averageReadTimeSeconds);
    totalCompletion += asNumber(metric.readCompletionRate);
    totalClickThrough += asNumber(metric.clickThroughRate);
    totalBounce += asNumber(metric.bounceRate);
    countForRates += 1;

    if (post?.status) {
      byStatus[post.status] = (byStatus[post.status] ?? 0) + 1;
    }

    const candidateSync = metric.lastSyncedAt ?? metric.updatedAt ?? metric.createdAt;
    if (candidateSync && (!lastSyncedAt || candidateSync > lastSyncedAt)) {
      lastSyncedAt = candidateSync;
    }

    const updatedAt = metric.updatedAt ?? metric.createdAt;
    if (updatedAt && updatedAt >= weekAgo) {
      postsUpdatedThisWeek += 1;
    }

    return {
      ...metric.toPublicObject(),
      post: post
        ? {
            id: post.id,
            title: post.title,
            slug: post.slug,
            status: post.status,
            publishedAt: post.publishedAt,
          }
        : null,
    };
  });

  const engagement = {
    averageReadTimeSeconds: countForRates ? Math.round(totalReadTime / countForRates) : 0,
    readCompletionRate: countForRates ? Number((totalCompletion / countForRates).toFixed(2)) : 0,
    clickThroughRate: countForRates ? Number((totalClickThrough / countForRates).toFixed(2)) : 0,
    bounceRate: countForRates ? Number((totalBounce / countForRates).toFixed(2)) : 0,
  };

  const freshness = {
    lastSyncedAt: lastSyncedAt ?? null,
    postsTracked: metrics.length,
    postsUpdatedThisWeek,
    draftCount: byStatus.draft ?? 0,
    publishedCount: byStatus.published ?? 0,
    scheduledCount: byStatus.scheduled ?? 0,
    archivedCount: byStatus.archived ?? 0,
  };

  const trendingPosts = metrics
    .slice()
    .sort((a, b) => asNumber(b.totalViews) - asNumber(a.totalViews))
    .slice(0, 6)
    .map((metric) => {
      const post = metric.get('post');
      return {
        postId: metric.postId,
        title: post?.title ?? 'Untitled post',
        slug: post?.slug ?? null,
        status: post?.status ?? null,
        views: asNumber(metric.totalViews),
        uniqueVisitors: asNumber(metric.uniqueVisitors),
        likes: asNumber(metric.likeCount),
        comments: asNumber(metric.commentCount),
        shares: asNumber(metric.shareCount),
        publishedAt: post?.publishedAt ?? null,
      };
    });

  return {
    totals,
    engagement,
    freshness,
    byStatus,
    trendingPosts,
    posts: dataset,
    timeRange: { start: start ?? null, end: end ?? null },
  };
}

export async function getBlogPostMetrics(postId) {
  if (!postId) {
    throw new ValidationError('A valid blog post identifier is required.');
  }
  const post = await BlogPost.findByPk(postId, { include: buildInclude({}) });
  if (!post) {
    throw new NotFoundError('Blog post not found.');
  }
  await ensureMetricsRecord(post.id);
  await post.reload({ include: buildInclude({}) });
  const metrics = post.get('metrics');
  return {
    post: post.toPublicObject(),
    metrics: metrics && typeof metrics.toPublicObject === 'function' ? metrics.toPublicObject() : null,
  };
}

export async function updateBlogPostMetrics(postId, payload = {}) {
  if (!postId) {
    throw new ValidationError('A valid blog post identifier is required.');
  }
  const post = await BlogPost.findByPk(postId);
  if (!post) {
    throw new NotFoundError('Blog post not found.');
  }

  return sequelize.transaction(async (transaction) => {
    const metrics = await ensureMetricsRecord(post.id, { transaction });

    const updates = {};
    if (payload.totalViews != null) {
      updates.totalViews = toIntegerValue(payload.totalViews, { min: 0 }) ?? metrics.totalViews;
    }
    if (payload.uniqueVisitors != null) {
      updates.uniqueVisitors = toIntegerValue(payload.uniqueVisitors, { min: 0 }) ?? metrics.uniqueVisitors;
    }
    if (payload.averageReadTimeSeconds != null) {
      updates.averageReadTimeSeconds = toIntegerValue(payload.averageReadTimeSeconds, { min: 0 }) ?? metrics.averageReadTimeSeconds;
    }
    if (payload.readCompletionRate != null) {
      updates.readCompletionRate = toDecimalValue(payload.readCompletionRate, { min: 0, max: 100 }) ?? metrics.readCompletionRate;
    }
    if (payload.clickThroughRate != null) {
      updates.clickThroughRate = toDecimalValue(payload.clickThroughRate, { min: 0, max: 100 }) ?? metrics.clickThroughRate;
    }
    if (payload.bounceRate != null) {
      updates.bounceRate = toDecimalValue(payload.bounceRate, { min: 0, max: 100 }) ?? metrics.bounceRate;
    }
    if (payload.shareCount != null) {
      updates.shareCount = toIntegerValue(payload.shareCount, { min: 0 }) ?? metrics.shareCount;
    }
    if (payload.likeCount != null) {
      updates.likeCount = toIntegerValue(payload.likeCount, { min: 0 }) ?? metrics.likeCount;
    }
    if (payload.subscriberConversions != null) {
      updates.subscriberConversions = toIntegerValue(payload.subscriberConversions, { min: 0 }) ?? metrics.subscriberConversions;
    }
    if (payload.commentCount != null) {
      updates.commentCount = toIntegerValue(payload.commentCount, { min: 0 }) ?? metrics.commentCount;
    }
    if (payload.lastSyncedAt !== undefined) {
      updates.lastSyncedAt = parseDateInput(payload.lastSyncedAt);
    }
    if (payload.metadata !== undefined) {
      updates.metadata = payload.metadata ?? null;
    }

    if (Object.keys(updates).length) {
      metrics.set(updates);
      await metrics.save({ transaction });
    }

    await post.reload({ transaction, include: buildInclude({}) });
    await metrics.reload({ transaction });

    return {
      post: post.toPublicObject(),
      metrics: metrics.toPublicObject(),
    };
  });
}

export async function listBlogComments({ postId, status, page = 1, pageSize = 25 } = {}) {
  const normalizedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const normalizedPageSize = Math.min(100, Math.max(1, Number.parseInt(pageSize, 10) || 25));

  const where = {};
  if (postId != null && postId !== '') {
    const postIdentifier = Number(postId);
    if (Number.isNaN(postIdentifier)) {
      throw new ValidationError('Invalid blog post identifier.');
    }
    where.postId = postIdentifier;
  }

  const normalizedStatus = normaliseCommentStatus(status);
  if (normalizedStatus) {
    where.status = normalizedStatus;
  }

  const include = [
    {
      model: BlogPost,
      as: 'post',
      attributes: ['id', 'title', 'slug', 'status', 'publishedAt'],
    },
    {
      model: User,
      as: 'author',
      attributes: ['id', 'firstName', 'lastName', 'email'],
    },
    {
      model: BlogComment,
      as: 'parent',
      attributes: ['id', 'body', 'status'],
      include: [
        { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    },
    {
      model: BlogComment,
      as: 'replies',
      separate: true,
      order: [['createdAt', 'ASC']],
      include: [
        { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    },
  ];

  const { rows, count } = await BlogComment.findAndCountAll({
    where,
    include,
    order: [['createdAt', 'DESC']],
    limit: normalizedPageSize,
    offset: (normalizedPage - 1) * normalizedPageSize,
    distinct: true,
  });

  return {
    results: rows.map((row) => row.toPublicObject()),
    pagination: buildPagination({ count, page: normalizedPage, pageSize: normalizedPageSize }),
  };
}

export async function createBlogComment(postId, payload = {}, { actorId } = {}) {
  if (!postId) {
    throw new ValidationError('A valid blog post identifier is required.');
  }
  const post = await BlogPost.findByPk(postId);
  if (!post) {
    throw new NotFoundError('Blog post not found.');
  }
  if (!payload?.body) {
    throw new ValidationError('Comment body is required.');
  }

  const resolvedStatus = normaliseCommentStatus(payload.status, { defaultValue: 'approved' });
  const resolvedAuthorId = payload.authorId ?? actorId ?? null;

  return sequelize.transaction(async (transaction) => {
    let parentId = null;
    if (payload.parentId) {
      const parent = await BlogComment.findByPk(payload.parentId, { transaction });
      if (!parent || parent.postId !== post.id) {
        throw new ValidationError('Parent comment not found for this post.');
      }
      parentId = parent.id;
    }

    const created = await BlogComment.create(
      {
        postId: post.id,
        parentId,
        authorId: resolvedAuthorId,
        authorName: payload.authorName ?? null,
        authorEmail: payload.authorEmail ?? null,
        body: payload.body,
        status: resolvedStatus,
        isPinned: Boolean(payload.isPinned),
        likeCount: toIntegerValue(payload.likeCount, { min: 0 }) ?? 0,
        flagCount: toIntegerValue(payload.flagCount, { min: 0 }) ?? 0,
        metadata: payload.metadata ?? null,
        publishedAt:
          resolvedStatus === 'approved'
            ? parseDateInput(payload.publishedAt) ?? new Date()
            : parseDateInput(payload.publishedAt),
      },
      { transaction },
    );

    await ensureMetricsRecord(post.id, { transaction });
    await refreshCommentCount(post.id, { transaction });

    await created.reload({
      transaction,
      include: [
        { model: BlogPost, as: 'post', attributes: ['id', 'title', 'slug', 'status', 'publishedAt'] },
        { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] },
        {
          model: BlogComment,
          as: 'parent',
          include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        },
        {
          model: BlogComment,
          as: 'replies',
          include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        },
      ],
    });

    return created.toPublicObject();
  });
}

export async function updateBlogComment(commentId, payload = {}) {
  if (!commentId) {
    throw new ValidationError('A valid comment identifier is required.');
  }
  const comment = await BlogComment.findByPk(commentId);
  if (!comment) {
    throw new NotFoundError('Comment not found.');
  }

  return sequelize.transaction(async (transaction) => {
    if (payload.parentId !== undefined && payload.parentId !== comment.parentId) {
      if (!payload.parentId) {
        comment.parentId = null;
      } else {
        const parent = await BlogComment.findByPk(payload.parentId, { transaction });
        if (!parent || parent.postId !== comment.postId) {
          throw new ValidationError('Parent comment not found for this post.');
        }
        comment.parentId = parent.id;
      }
    }

    if (payload.body !== undefined) {
      if (!payload.body) {
        throw new ValidationError('Comment body cannot be empty.');
      }
      comment.body = payload.body;
    }

    if (payload.authorId !== undefined) {
      comment.authorId = payload.authorId ?? null;
    }
    if (payload.authorName !== undefined) {
      comment.authorName = payload.authorName ?? null;
    }
    if (payload.authorEmail !== undefined) {
      comment.authorEmail = payload.authorEmail ?? null;
    }
    if (payload.isPinned !== undefined) {
      comment.isPinned = Boolean(payload.isPinned);
    }
    if (payload.likeCount !== undefined) {
      comment.likeCount = toIntegerValue(payload.likeCount, { min: 0 }) ?? comment.likeCount;
    }
    if (payload.flagCount !== undefined) {
      comment.flagCount = toIntegerValue(payload.flagCount, { min: 0 }) ?? comment.flagCount;
    }
    if (payload.metadata !== undefined) {
      comment.metadata = payload.metadata ?? null;
    }

    if (payload.status !== undefined) {
      comment.status = normaliseCommentStatus(payload.status, { defaultValue: comment.status });
      if (comment.status === 'approved' && !comment.publishedAt) {
        comment.publishedAt = new Date();
      }
    }

    if (payload.publishedAt !== undefined) {
      comment.publishedAt = parseDateInput(payload.publishedAt);
    }

    comment.editedAt = new Date();
    await comment.save({ transaction });

    await refreshCommentCount(comment.postId, { transaction });

    await comment.reload({
      transaction,
      include: [
        { model: BlogPost, as: 'post', attributes: ['id', 'title', 'slug', 'status', 'publishedAt'] },
        { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] },
        {
          model: BlogComment,
          as: 'parent',
          include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        },
        {
          model: BlogComment,
          as: 'replies',
          include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        },
      ],
    });

    return comment.toPublicObject();
  });
}

export async function deleteBlogComment(commentId) {
  if (!commentId) {
    throw new ValidationError('A valid comment identifier is required.');
  }
  const comment = await BlogComment.findByPk(commentId);
  if (!comment) {
    throw new NotFoundError('Comment not found.');
  }

  await sequelize.transaction(async (transaction) => {
    const { postId } = comment;
    await comment.destroy({ transaction });
    await refreshCommentCount(postId, { transaction });
  });

  return { success: true };
}

export default {
  listBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  listBlogCategories,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  listBlogTags,
  createBlogTag,
  updateBlogTag,
  deleteBlogTag,
  createBlogMedia,
  getBlogMetricsOverview,
  getBlogPostMetrics,
  updateBlogPostMetrics,
  listBlogComments,
  createBlogComment,
  updateBlogComment,
  deleteBlogComment,
};
