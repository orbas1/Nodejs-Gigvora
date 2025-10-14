import { FeedPost, User, Profile } from '../models/index.js';
import { ValidationError, AuthorizationError } from '../utils/errors.js';
import { enforceFeedPostPolicies } from '../services/contentModerationService.js';

const ALLOWED_VISIBILITY = new Set(['public', 'connections']);
const ALLOWED_TYPES = new Set(['update', 'media', 'job', 'gig', 'project', 'volunteering', 'launchpad', 'news']);
const AUTHORISED_ROLES = new Set([
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

function resolveRole(req) {
  const role = (req.user?.role || req.headers['x-user-role'] || '').toString().toLowerCase().trim();
  return role || null;
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

function serialiseFeedPost(instance) {
  const raw = instance.toJSON();
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
    reactions: raw.reactions,
    likes: raw.likes,
    comments: raw.comments,
    metrics: raw.metrics,
    User: raw.User,
  };
}

export async function listFeed(req, res) {
  const posts = await FeedPost.findAll({
    include: [{ model: User, include: [Profile] }],
    order: [['createdAt', 'DESC']],
  });
  res.json(posts.map((post) => serialiseFeedPost(post)));
}

export async function createPost(req, res) {
  const role = resolveRole(req);
  if (role && !AUTHORISISED_ROLES.has(role)) {
    throw new AuthorizationError('You do not have permission to publish to the live feed.');
  }

  const { userId, content, visibility = 'public', type = 'update', link, title, summary } = req.body || {};
  const trimmedContent = typeof content === 'string' ? content.trim() : '';
  const trimmedSummary = typeof summary === 'string' ? summary.trim() : '';
  if (!trimmedContent && !trimmedSummary) {
    throw new ValidationError('Post content is required.');
  }

  if (visibility && !ALLOWED_VISIBILITY.has(String(visibility).toLowerCase())) {
    throw new ValidationError('Invalid visibility provided.');
  }

  const resolvedType = String(type || 'update').toLowerCase();
  if (!ALLOWED_TYPES.has(resolvedType)) {
    throw new ValidationError('Unsupported post type.');
  }

  if (userId == null || Number.isNaN(Number.parseInt(userId, 10))) {
    throw new ValidationError('A valid userId must be provided.');
  }

  const resolvedUserId = Number.parseInt(userId, 10);

  const sanitizedLink = sanitizeUrl(link);

  const moderationContext = enforceFeedPostPolicies(
    {
      content: trimmedContent || trimmedSummary,
      summary: trimmedSummary,
      title: typeof title === 'string' ? title : null,
      link: sanitizedLink,
      attachments: Array.isArray(req.body?.mediaAttachments) ? req.body.mediaAttachments : [],
    },
    { role },
  );

  const payload = {
    userId: resolvedUserId,
    content: moderationContext.content,
    visibility: visibility?.toLowerCase?.() || 'public',
    type: resolvedType,
    link: moderationContext.link,
  };

  if (title && typeof title === 'string') {
    payload.title = moderationContext.title?.slice(0, 280) || title.trim().slice(0, 280);
  }
  if (trimmedSummary) {
    payload.summary = moderationContext.summary || trimmedSummary;
  }

  const created = await FeedPost.create(payload);
  const hydrated = await FeedPost.findByPk(created.id, { include: [{ model: User, include: [Profile] }] });
  const responsePayload = serialiseFeedPost(hydrated);
  if (moderationContext.attachments?.length) {
    responsePayload.mediaAttachments = moderationContext.attachments.filter((attachment) => attachment.url);
  }
  if (moderationContext.signals?.length) {
    responsePayload.moderation = { signals: moderationContext.signals };
  }
  res.status(201).json(responsePayload);
}

export { serialiseFeedPost };
