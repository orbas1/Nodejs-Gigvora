import { FeedPost, User, Profile } from '../models/index.js';
import { enforceFeedPostPolicies } from '../services/contentModerationService.js';
import { ValidationError, AuthorizationError, AuthenticationError } from '../utils/errors.js';

const ALLOWED_VISIBILITY = new Set(['public', 'connections']);
const ALLOWED_TYPES = new Set(['update', 'media', 'job', 'gig', 'project', 'volunteering', 'launchpad', 'news']);
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

function sanitiseMediaAttachments(input) {
  if (!Array.isArray(input)) {
    return [];
  }
  return input
    .map((item) => {
      if (typeof item === 'string') {
        const url = sanitizeUrl(item);
        return url ? { url, type: 'image' } : null;
      }
      if (item && typeof item === 'object') {
        const url = sanitizeUrl(item.url ?? item.href);
        if (!url) {
          return null;
        }
        const type = typeof item.type === 'string' ? item.type : 'attachment';
        return { url, type };
      }
      return null;
    })
    .filter(Boolean);
}

export async function listFeed(req, res) {
  const posts = await FeedPost.findAll({
    include: [{ model: User, include: [Profile] }],
    order: [['createdAt', 'DESC']],
  });
  res.json(posts.map((post) => serialiseFeedPost(post)));
}

export async function createPost(req, res) {
  const actor = resolveActor(req);
  const role = resolveRole(req);

  const { userId, content, visibility, type = 'update', link, title, summary, imageUrl, source } = req.body || {};
  const resolvedUserId = parseUserId(userId ?? actor?.id);

  if (!resolvedUserId) {
    throw new ValidationError('A valid userId must be provided.');
  }

  assertPublishPermissions(actor, role, resolvedUserId);

  const trimmedContent = sanitizeString(content, { maxLength: 2200, fallback: '' }) ?? '';
  const trimmedSummary = sanitizeString(summary, { maxLength: 500, fallback: '' }) ?? '';
  if (!trimmedContent && !trimmedSummary) {
    throw new ValidationError('Post content is required.');
  }

  const resolvedVisibility = normaliseVisibility(visibility);

  const resolvedType = String(type || 'update').toLowerCase();
  if (!ALLOWED_TYPES.has(resolvedType)) {
    throw new ValidationError('Unsupported post type.');
  }

  const sanitizedLink = sanitizeUrl(link);
  const sanitizedImageUrl = sanitizeUrl(imageUrl);
  const attachments = sanitiseMediaAttachments(req.body?.mediaAttachments);

  const baseTitle = sanitizeString(title, { maxLength: 280 });
  const baseSummary = trimmedSummary || null;
  const baseSource = sanitizeString(source, { maxLength: 120 });

  const moderationContext = enforceFeedPostPolicies(
    {
      content: trimmedContent || trimmedSummary,
      summary: baseSummary,
      title: baseTitle,
      link: sanitizedLink,
      attachments,
    },
    { role },
  );

  const payload = {
    userId: resolvedUserId,
    content: moderationContext.content,
    visibility: resolvedVisibility,
    type: resolvedType,
    link: moderationContext.link,
  };

  if (baseTitle) {
    payload.title = moderationContext.title?.slice(0, 280) ?? baseTitle;
  }
  if (baseSummary) {
    payload.summary = moderationContext.summary ?? baseSummary;
  }
  if (sanitizedImageUrl) {
    payload.imageUrl = sanitizedImageUrl;
  }
  if (baseSource) {
    payload.source = baseSource;
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
