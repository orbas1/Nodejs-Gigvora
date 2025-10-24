import { Op, fn, col } from 'sequelize';
import { FeedPost, FeedComment, FeedReaction, User, Profile } from '../models/index.js';
import { enforceFeedPostPolicies } from '../services/contentModerationService.js';
import { ValidationError, AuthorizationError, AuthenticationError } from '../utils/errors.js';

const ALLOWED_VISIBILITY = new Set(['public', 'connections']);
const ALLOWED_TYPES = new Set(['update', 'media', 'job', 'gig', 'project', 'volunteering', 'launchpad', 'news']);
const ALLOWED_REACTIONS = new Set(['like', 'celebrate', 'support', 'love', 'insightful']);
const AUTHORIZED_ROLES = new Set([
  'member',
  'user',
  'freelancer',
  'agency',
  'agency_admin',
  'company',
  'company_admin',
  'headhunter',
  'mentor',
  'admin',
  'moderator',
  'community_manager',
]);

const SELF_ONLY_ROLES = new Set(['member', 'user', 'freelancer', 'agency', 'company', 'headhunter', 'mentor']);
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;
const DEFAULT_COMMENT_LIMIT = 20;
const MAX_COMMENT_LIMIT = 100;

function resolveRole(req) {
  const candidate =
    req.headers['x-user-role'] ||
    req.headers['x-user-type'] ||
    req.user?.role ||
    req.user?.type ||
    req.user?.accountRole ||
    req.user?.accountType ||
    '';
  const role = candidate.toString().toLowerCase().trim();
  return role || null;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object ?? {}, key);
}

function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }
  try {
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      return null;
    }
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.href;
  } catch (error) {
    return null;
  }
}

function sanitizeString(value, { maxLength = 500, fallback = null } = {}) {
  if (value == null) {
    return fallback;
  }
  const trimmed = `${value}`.trim();
  if (!trimmed) {
    return fallback;
  }
  return trimmed.slice(0, maxLength);
}

function parseCount(value) {
  if (value == null) {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return null;
  }
  return numeric;
}

function sanitiseMediaAttachments(input) {
  if (!Array.isArray(input)) {
    return [];
  }
  return input
    .map((item, index) => {
      if (typeof item === 'string') {
        const url = sanitizeUrl(item);
        return url ? { id: `attachment-${index + 1}`, url, type: 'image' } : null;
      }
      if (item && typeof item === 'object') {
        const url = sanitizeUrl(item.url ?? item.href);
        if (!url) {
          return null;
        }
        const type = typeof item.type === 'string' ? item.type.toLowerCase() : 'attachment';
        const alt = sanitizeString(item.alt ?? item.caption ?? '', { maxLength: 180, fallback: '' });
        return { id: item.id ?? `attachment-${index + 1}`, url, type, alt };
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 4);
}

async function resolveUserSnapshot(userId) {
  if (!userId) {
    return {
      name: 'Gigvora member',
      headline: 'Marketplace community update',
      avatarSeed: 'gigvora-member',
      user: null,
    };
  }
  const record = await User.findByPk(userId, { include: [Profile] });
  if (!record) {
    return {
      name: 'Gigvora member',
      headline: 'Marketplace community update',
      avatarSeed: 'gigvora-member',
      user: null,
    };
  }
  const profile = record.Profile ?? null;
  const name = [record.firstName, record.lastName].filter(Boolean).join(' ').trim() || record.email || 'Gigvora member';
  const headline =
    profile?.headline || profile?.bio || record.title || record.jobTitle || 'Marketplace community update';
  const avatarSeed = profile?.avatarSeed || name || record.email || 'Gigvora member';

  return {
    name,
    headline,
    avatarSeed,
    user: {
      id: record.id,
      email: record.email,
      firstName: record.firstName,
      lastName: record.lastName,
      title: record.title ?? null,
      Profile: profile
        ? {
            id: profile.id,
            headline: profile.headline,
            bio: profile.bio,
            avatarSeed: profile.avatarSeed,
          }
        : null,
    },
  };
}

function serialiseFeedPost(instance, { reactionSummary = {}, commentCount = 0 } = {}) {
  const raw = instance?.toJSON ? instance.toJSON() : instance;
  const user = raw.User || raw.user || null;
  const profile = user?.Profile || user?.profile || null;
  const computedAuthorName =
    raw.authorName || [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || 'Gigvora member';
  const computedAuthorHeadline =
    raw.authorHeadline ||
    profile?.headline ||
    profile?.bio ||
    user?.title ||
    (raw.type === 'news' ? raw.source || 'Gigvora newsroom' : 'Marketplace community update');
  const computedAvatarSeed = raw.authorAvatarSeed || profile?.avatarSeed || computedAuthorName;
  const attachments = Array.isArray(raw.mediaAttachments) ? raw.mediaAttachments : [];
  const likesCount =
    parseCount(reactionSummary.likes) ??
    parseCount(raw.reactions?.likes) ??
    parseCount(raw.likes) ??
    0;
  const reactionPayload = { ...reactionSummary, likes: likesCount };
  const metricsSource = raw.metrics && typeof raw.metrics === 'object' ? raw.metrics : {};
  const derivedCommentCount =
    parseCount(commentCount) ??
    parseCount(metricsSource.comments) ??
    (Array.isArray(raw.comments) ? raw.comments.length : null) ??
    parseCount(raw.commentCount) ??
    0;

  return {
    id: raw.id,
    userId: raw.userId,
    content: raw.content,
    summary: raw.summary,
    title: raw.title,
    type: raw.type,
    link: raw.link,
    imageUrl: raw.imageUrl,
    source: raw.source,
    visibility: raw.visibility,
    mediaAttachments: attachments,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    publishedAt: raw.publishedAt,
    author: {
      name: computedAuthorName,
      headline: computedAuthorHeadline,
      avatarSeed: computedAvatarSeed,
    },
    authorName: computedAuthorName,
    authorHeadline: computedAuthorHeadline,
    authorAvatarSeed: computedAvatarSeed,
    reactions: reactionPayload,
    comments: Array.isArray(raw.comments) ? raw.comments : [],
    metrics: {
      ...metricsSource,
      comments: derivedCommentCount,
    },
    User: raw.User,
  };
}

function serialiseComment(instance, replyMap = new Map()) {
  const raw = instance?.toJSON ? instance.toJSON() : instance;
  const authorUser = raw.author || raw.User || raw.user || null;
  const profile = authorUser?.Profile || authorUser?.profile || null;
  const computedAuthorName =
    raw.authorName ||
    [authorUser?.firstName, authorUser?.lastName, authorUser?.name].filter(Boolean).join(' ').trim() ||
    'Gigvora member';
  const computedHeadline =
    raw.authorHeadline || profile?.headline || profile?.bio || authorUser?.title || 'Gigvora member';
  const computedAvatarSeed = raw.authorAvatarSeed || profile?.avatarSeed || computedAuthorName;
  const repliesSource = replyMap instanceof Map ? replyMap.get(raw.id) ?? [] : raw.replies ?? [];
  const replies = repliesSource.map((reply) => serialiseComment(reply, replyMap));
  const userPayload = authorUser
    ? {
        id: authorUser.id,
        firstName: authorUser.firstName,
        lastName: authorUser.lastName,
        title: authorUser.title ?? null,
        Profile: profile
          ? {
              id: profile.id,
              headline: profile.headline,
              bio: profile.bio,
              avatarSeed: profile.avatarSeed,
            }
          : null,
      }
    : null;

  return {
    id: raw.id,
    postId: raw.postId,
    parentId: raw.parentId,
    message: raw.body,
    body: raw.body,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    author: computedAuthorName,
    authorName: computedAuthorName,
    authorHeadline: computedHeadline,
    authorAvatarSeed: computedAvatarSeed,
    replies,
    User: userPayload,
    user: userPayload,
  };
}

function resolveActor(req) {
  return req.user ?? null;
}

function parseUserId(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }
  return numeric;
}

function assertPublishPermissions(actor, role, targetUserId) {
  if (!role) {
    throw new AuthenticationError('A valid role is required to publish timeline updates.');
  }
  if (!AUTHORIZED_ROLES.has(role)) {
    throw new AuthorizationError('You do not have permission to publish to the timeline.');
  }
  if (!actor) {
    throw new AuthenticationError('Authentication is required to publish updates.');
  }

  if (SELF_ONLY_ROLES.has(role) && actor.id && Number(actor.id) !== targetUserId) {
    throw new AuthorizationError('You can only publish updates for your own account.');
  }
}

function assertInteractionPermissions(actor, role) {
  if (!actor?.id) {
    throw new AuthenticationError('Authentication is required to interact with the timeline.');
  }
  if (!role || !AUTHORIZED_ROLES.has(role)) {
    throw new AuthorizationError('You do not have permission to interact with the timeline.');
  }
}

function normaliseVisibility(value) {
  if (!value) {
    return 'public';
  }
  const normalised = `${value}`.toLowerCase().trim();
  if (!ALLOWED_VISIBILITY.has(normalised)) {
    throw new ValidationError('Invalid visibility provided.');
  }
  return normalised;
}

function normaliseType(value) {
  if (!value) {
    return 'update';
  }
  const normalised = `${value}`.toLowerCase().trim();
  if (!ALLOWED_TYPES.has(normalised)) {
    throw new ValidationError('Unsupported post type.');
  }
  return normalised;
}

function buildModeratedPayload({ content, summary, title, link, attachments }, role) {
  const trimmedContent = sanitizeString(content, { maxLength: 2200, fallback: '' }) ?? '';
  const trimmedSummary = sanitizeString(summary, { maxLength: 500, fallback: '' }) ?? '';
  if (!trimmedContent && !trimmedSummary) {
    throw new ValidationError('Post content is required.');
  }
  const baseTitle = sanitizeString(title, { maxLength: 280 });
  const sanitisedLink = sanitizeUrl(link);
  const moderation = enforceFeedPostPolicies(
    {
      content: trimmedContent || trimmedSummary,
      summary: trimmedSummary || null,
      title: baseTitle || null,
      link: sanitisedLink,
      attachments,
    },
    { role },
  );
  const moderatedAttachments = moderation.attachments?.filter((attachment) => attachment?.url) ?? [];
  return {
    content: moderation.content,
    summary: moderation.summary ?? (trimmedSummary || null),
    title: moderation.title ? moderation.title.slice(0, 280) : baseTitle ?? null,
    link: moderation.link,
    attachments: moderatedAttachments,
    signals: moderation.signals ?? [],
  };
}

async function computeReactionSummary(postIds) {
  if (!postIds.length) {
    return new Map();
  }
  const rows = await FeedReaction.findAll({
    attributes: ['postId', 'reactionType', [fn('COUNT', col('id')), 'count']],
    where: { postId: { [Op.in]: postIds }, active: true },
    group: ['postId', 'reactionType'],
    raw: true,
  });
  const map = new Map();
  rows.forEach((row) => {
    const existing = map.get(row.postId) ?? {};
    const key = row.reactionType === 'like' ? 'likes' : row.reactionType;
    existing[key] = Number(row.count);
    map.set(row.postId, existing);
  });
  postIds.forEach((id) => {
    if (!map.has(id)) {
      map.set(id, { likes: 0 });
    } else if (map.has(id) && map.get(id).likes == null) {
      map.get(id).likes = 0;
    }
  });
  return map;
}

async function computeCommentCounts(postIds) {
  if (!postIds.length) {
    return new Map();
  }
  const rows = await FeedComment.findAll({
    attributes: ['postId', [fn('COUNT', col('id')), 'count']],
    where: { postId: { [Op.in]: postIds } },
    group: ['postId'],
    raw: true,
  });
  const map = new Map();
  rows.forEach((row) => {
    map.set(row.postId, Number(row.count));
  });
  postIds.forEach((id) => {
    if (!map.has(id)) {
      map.set(id, 0);
    }
  });
  return map;
}

export async function listFeed(req, res) {
  const limit = Math.min(
    Math.max(Number.parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE,
  );
  const cursor = req.query.cursor ? Number.parseInt(req.query.cursor, 10) : null;
  const page = req.query.page ? Number.parseInt(req.query.page, 10) : null;

  const where = {};
  if (cursor && Number.isFinite(cursor)) {
    where.id = { [Op.lt]: cursor };
  }

  const queryOptions = {
    where,
    include: [{ model: User, include: [Profile] }],
    order: [
      ['createdAt', 'DESC'],
      ['id', 'DESC'],
    ],
    limit: limit + 1,
  };

  if (!cursor && page && Number.isFinite(page) && page > 0) {
    queryOptions.offset = (page - 1) * limit;
  }

  const records = await FeedPost.findAll(queryOptions);
  const hasMore = records.length > limit;
  const trimmed = hasMore ? records.slice(0, limit) : records;
  const postIds = trimmed.map((post) => post.id).filter(Boolean);
  const [reactionMap, commentMap, total] = await Promise.all([
    computeReactionSummary(postIds),
    computeCommentCounts(postIds),
    FeedPost.count(),
  ]);

  const items = trimmed.map((post) =>
    serialiseFeedPost(post, {
      reactionSummary: reactionMap.get(post.id) ?? { likes: 0 },
      commentCount: commentMap.get(post.id) ?? 0,
    }),
  );

  const nextCursor = hasMore ? trimmed[trimmed.length - 1].id : null;
  const nextPage = hasMore && !cursor && page && Number.isFinite(page) ? page + 1 : null;

  res.json({
    items,
    nextCursor,
    nextPage,
    hasMore,
    total,
  });
}

export async function createPost(req, res) {
  const actor = resolveActor(req);
  const role = resolveRole(req);

  const {
    userId,
    content,
    summary,
    title,
    visibility,
    type,
    link,
    imageUrl,
    source,
    mediaAttachments,
  } = req.body || {};
  const resolvedUserId = parseUserId(userId ?? actor?.id);

  if (!resolvedUserId) {
    throw new ValidationError('A valid userId must be provided.');
  }

  assertPublishPermissions(actor, role, resolvedUserId);

  const attachments = sanitiseMediaAttachments(mediaAttachments);
  const moderated = buildModeratedPayload({ content, summary, title, link, attachments }, role);
  const snapshot = await resolveUserSnapshot(resolvedUserId);

  const payload = {
    userId: resolvedUserId,
    content: moderated.content,
    summary: moderated.summary,
    title: moderated.title,
    visibility: normaliseVisibility(visibility),
    type: normaliseType(type),
    link: moderated.link,
    mediaAttachments: moderated.attachments.length ? moderated.attachments : null,
    imageUrl: sanitizeUrl(imageUrl),
    source: sanitizeString(source, { maxLength: 120 }),
    authorName: snapshot.name,
    authorHeadline: snapshot.headline,
    authorAvatarSeed: snapshot.avatarSeed,
    publishedAt: new Date(),
  };

  const created = await FeedPost.create(payload);
  const hydrated = await FeedPost.findByPk(created.id, { include: [{ model: User, include: [Profile] }] });
  const responsePayload = serialiseFeedPost(hydrated, { reactionSummary: { likes: 0 }, commentCount: 0 });
  if (moderated.signals.length) {
    responsePayload.moderation = { signals: moderated.signals };
  }
  res.status(201).json(responsePayload);
}

export async function updatePost(req, res) {
  const { postId } = req.params;
  const actor = resolveActor(req);
  const role = resolveRole(req);

  const numericId = Number.parseInt(postId, 10);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    throw new ValidationError('A valid post identifier is required.');
  }

  const existing = await FeedPost.findByPk(numericId, { include: [{ model: User, include: [Profile] }] });
  if (!existing) {
    throw new ValidationError('Feed post not found.');
  }

  assertPublishPermissions(actor, role, existing.userId);

  const updates = {};
  const requestBody = req.body ?? {};

  if (hasOwn(requestBody, 'visibility')) {
    updates.visibility = normaliseVisibility(requestBody.visibility);
  }
  if (hasOwn(requestBody, 'type')) {
    updates.type = normaliseType(requestBody.type);
  }
  if (hasOwn(requestBody, 'imageUrl')) {
    updates.imageUrl = sanitizeUrl(requestBody.imageUrl);
  }
  if (hasOwn(requestBody, 'source')) {
    updates.source = sanitizeString(requestBody.source, { maxLength: 120 });
  }

  const shouldModerate =
    hasOwn(requestBody, 'content') ||
    hasOwn(requestBody, 'summary') ||
    hasOwn(requestBody, 'title') ||
    hasOwn(requestBody, 'link') ||
    hasOwn(requestBody, 'mediaAttachments');

  if (shouldModerate) {
    const attachmentsInput = hasOwn(requestBody, 'mediaAttachments')
      ? sanitiseMediaAttachments(requestBody.mediaAttachments)
      : Array.isArray(existing.mediaAttachments)
      ? existing.mediaAttachments
      : [];
    const moderated = buildModeratedPayload(
      {
        content: hasOwn(requestBody, 'content') ? requestBody.content : existing.content,
        summary: hasOwn(requestBody, 'summary') ? requestBody.summary : existing.summary,
        title: hasOwn(requestBody, 'title') ? requestBody.title : existing.title,
        link: hasOwn(requestBody, 'link') ? requestBody.link : existing.link,
        attachments: attachmentsInput,
      },
      role,
    );

    if (hasOwn(requestBody, 'content') || hasOwn(requestBody, 'summary')) {
      updates.content = moderated.content;
      updates.summary = moderated.summary;
    }
    if (hasOwn(requestBody, 'title')) {
      updates.title = moderated.title;
    }
    if (hasOwn(requestBody, 'link')) {
      updates.link = moderated.link;
    }
    if (hasOwn(requestBody, 'mediaAttachments')) {
      updates.mediaAttachments = moderated.attachments.length ? moderated.attachments : null;
    }
  }

  if (!Object.keys(updates).length) {
    return res.json(serialiseFeedPost(existing));
  }

  await existing.update(updates);
  const reloaded = await FeedPost.findByPk(existing.id, { include: [{ model: User, include: [Profile] }] });
  res.json(serialiseFeedPost(reloaded));
}

export async function deletePost(req, res) {
  const { postId } = req.params;
  const actor = resolveActor(req);
  const role = resolveRole(req);

  const numericId = Number.parseInt(postId, 10);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    throw new ValidationError('A valid post identifier is required.');
  }

  const existing = await FeedPost.findByPk(numericId);
  if (!existing) {
    return res.status(204).send();
  }

  assertPublishPermissions(actor, role, existing.userId);

  await existing.destroy();
  res.status(204).send();
}

export async function listComments(req, res) {
  const { postId } = req.params;
  const numericId = Number.parseInt(postId, 10);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    throw new ValidationError('A valid post identifier is required.');
  }

  const post = await FeedPost.findByPk(numericId, { attributes: ['id'] });
  if (!post) {
    throw new ValidationError('Feed post not found.');
  }

  const limit = Math.min(
    Math.max(Number.parseInt(req.query.limit, 10) || DEFAULT_COMMENT_LIMIT, 1),
    MAX_COMMENT_LIMIT,
  );
  const cursor = req.query.cursor ? Number.parseInt(req.query.cursor, 10) : null;

  const rootWhere = { postId: numericId, parentId: null };
  if (cursor && Number.isFinite(cursor)) {
    rootWhere.id = { [Op.lt]: cursor };
  }

  const rootComments = await FeedComment.findAll({
    where: rootWhere,
    include: [{ model: User, as: 'author', include: [Profile] }],
    order: [
      ['createdAt', 'DESC'],
      ['id', 'DESC'],
    ],
    limit: limit + 1,
  });
  const hasMore = rootComments.length > limit;
  const trimmed = hasMore ? rootComments.slice(0, limit) : rootComments;
  const rootIds = trimmed.map((comment) => comment.id);

  let replyMap = new Map();
  if (rootIds.length) {
    const replies = await FeedComment.findAll({
      where: { postId: numericId, parentId: { [Op.in]: rootIds } },
      include: [{ model: User, as: 'author', include: [Profile] }],
      order: [
        ['createdAt', 'ASC'],
        ['id', 'ASC'],
      ],
    });
    replyMap = replies.reduce((map, reply) => {
      const bucket = map.get(reply.parentId) ?? [];
      bucket.push(reply);
      map.set(reply.parentId, bucket);
      return map;
    }, new Map());
  }

  const items = trimmed.map((comment) => serialiseComment(comment, replyMap));
  const total = await FeedComment.count({ where: { postId: numericId, parentId: null } });
  const nextCursor = hasMore ? trimmed[trimmed.length - 1].id : null;

  res.json({ items, total, hasMore, nextCursor });
}

export async function createComment(req, res) {
  const { postId } = req.params;
  const actor = resolveActor(req);
  const role = resolveRole(req);

  const numericId = Number.parseInt(postId, 10);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    throw new ValidationError('A valid post identifier is required.');
  }

  const post = await FeedPost.findByPk(numericId, { attributes: ['id'] });
  if (!post) {
    throw new ValidationError('Feed post not found.');
  }

  assertInteractionPermissions(actor, role);

  const { message, body, context } = req.body || {};
  const text = sanitizeString(message ?? body ?? context, { maxLength: 1200, fallback: '' }) ?? '';
  if (!text) {
    throw new ValidationError('A message is required to create a feed comment.');
  }

  const snapshot = await resolveUserSnapshot(actor.id);
  const created = await FeedComment.create({
    postId: numericId,
    userId: actor.id,
    body: text,
    authorName: snapshot.name,
    authorHeadline: snapshot.headline,
    authorAvatarSeed: snapshot.avatarSeed,
  });

  const hydrated = await FeedComment.findByPk(created.id, {
    include: [{ model: User, as: 'author', include: [Profile] }],
  });

  res.status(201).json(serialiseComment(hydrated));
}

export async function createReply(req, res) {
  const { postId, commentId } = req.params;
  const actor = resolveActor(req);
  const role = resolveRole(req);

  const numericPostId = Number.parseInt(postId, 10);
  const numericCommentId = Number.parseInt(commentId, 10);
  if (!Number.isFinite(numericPostId) || numericPostId <= 0) {
    throw new ValidationError('A valid post identifier is required.');
  }
  if (!Number.isFinite(numericCommentId) || numericCommentId <= 0) {
    throw new ValidationError('A valid comment identifier is required.');
  }

  const parent = await FeedComment.findByPk(numericCommentId);
  if (!parent || parent.postId !== numericPostId) {
    throw new ValidationError('Comment not found for the specified post.');
  }

  assertInteractionPermissions(actor, role);

  const { message, body, context } = req.body || {};
  const text = sanitizeString(message ?? body ?? context, { maxLength: 1200, fallback: '' }) ?? '';
  if (!text) {
    throw new ValidationError('A message is required to create a feed reply.');
  }

  const snapshot = await resolveUserSnapshot(actor.id);
  const created = await FeedComment.create({
    postId: numericPostId,
    userId: actor.id,
    parentId: numericCommentId,
    body: text,
    authorName: snapshot.name,
    authorHeadline: snapshot.headline,
    authorAvatarSeed: snapshot.avatarSeed,
  });

  const hydrated = await FeedComment.findByPk(created.id, {
    include: [{ model: User, as: 'author', include: [Profile] }],
  });

  res.status(201).json(serialiseComment(hydrated));
}

async function summariseReactionsForPost(postId) {
  const rows = await FeedReaction.findAll({
    attributes: ['reactionType', [fn('COUNT', col('id')), 'count']],
    where: { postId, active: true },
    group: ['reactionType'],
    raw: true,
  });
  const summary = rows.reduce((acc, row) => {
    const key = row.reactionType === 'like' ? 'likes' : row.reactionType;
    acc[key] = Number(row.count);
    return acc;
  }, {});
  if (summary.likes == null) {
    summary.likes = 0;
  }
  return summary;
}

export async function toggleReaction(req, res) {
  const { postId } = req.params;
  const actor = resolveActor(req);
  const role = resolveRole(req);

  const numericId = Number.parseInt(postId, 10);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    throw new ValidationError('A valid post identifier is required.');
  }

  assertInteractionPermissions(actor, role);

  const post = await FeedPost.findByPk(numericId, { attributes: ['id'] });
  if (!post) {
    throw new ValidationError('Feed post not found.');
  }

  const { reaction, active = true } = req.body || {};
  const reactionType = ((reaction ?? 'like').toString() || 'like').toLowerCase().trim();
  if (!ALLOWED_REACTIONS.has(reactionType)) {
    throw new ValidationError('Unsupported reaction type.');
  }

  const existing = await FeedReaction.findOne({
    where: { postId: numericId, userId: actor.id, reactionType },
  });

  if (active !== false) {
    if (existing) {
      if (!existing.active) {
        await existing.update({ active: true });
      }
    } else {
      await FeedReaction.create({ postId: numericId, userId: actor.id, reactionType, active: true });
    }
  } else if (existing) {
    if (existing.active) {
      await existing.update({ active: false });
    } else {
      await existing.destroy();
    }
  }

  const summary = await summariseReactionsForPost(numericId);
  res.json({ postId: numericId, reaction: reactionType, active: active !== false, summary });
}

export { serialiseFeedPost };
