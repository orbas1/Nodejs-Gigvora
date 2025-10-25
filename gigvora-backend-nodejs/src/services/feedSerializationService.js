function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
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
      if (isPlainObject(item)) {
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

function resolveAuthorSnapshot(rawUser, rawProfile, fallbackType = 'Gigvora member', sourceType = 'update') {
  const computedName =
    [rawUser?.firstName, rawUser?.lastName, rawUser?.name].filter(Boolean).join(' ').trim() || rawUser?.email || fallbackType;
  const computedHeadline =
    rawProfile?.headline ||
    rawProfile?.bio ||
    rawUser?.title ||
    (sourceType === 'news' ? rawUser?.source || 'Gigvora newsroom' : 'Marketplace community update');
  const computedAvatarSeed = rawProfile?.avatarSeed || computedName;
  return {
    name: computedName,
    headline: computedHeadline,
    avatarSeed: computedAvatarSeed,
  };
}

function serialiseFeedPost(instance, { reactionSummary = {}, commentCount = 0 } = {}) {
  const raw = instance?.toJSON ? instance.toJSON() : instance;
  const user = raw?.User || raw?.user || null;
  const profile = user?.Profile || user?.profile || null;
  const authorSnapshot = resolveAuthorSnapshot(user, profile, 'Gigvora member', raw?.type);
  const attachments = sanitiseMediaAttachments(raw?.mediaAttachments);
  const likesCount =
    parseCount(reactionSummary.likes) ?? parseCount(raw?.reactions?.likes) ?? parseCount(raw?.likes) ?? 0;
  const reactionPayload = { ...reactionSummary, likes: likesCount };
  const metricsSource = isPlainObject(raw?.metrics) ? raw.metrics : {};
  const derivedCommentCount =
    parseCount(commentCount) ??
    parseCount(metricsSource.comments) ??
    (Array.isArray(raw?.comments) ? raw.comments.length : null) ??
    parseCount(raw?.commentCount) ??
    0;

  let publishedAt = null;
  if (raw?.publishedAt) {
    if (raw.publishedAt instanceof Date) {
      publishedAt = raw.publishedAt.toISOString();
    } else {
      const parsed = new Date(raw.publishedAt);
      publishedAt = Number.isNaN(parsed.getTime()) ? `${raw.publishedAt}` : parsed.toISOString();
    }
  }

  return {
    id: raw?.id,
    userId: raw?.userId,
    content: raw?.content,
    summary: raw?.summary,
    title: raw?.title,
    type: raw?.type,
    link: raw?.link,
    imageUrl: raw?.imageUrl,
    source: raw?.source,
    visibility: raw?.visibility,
    mediaAttachments: attachments,
    createdAt: raw?.createdAt,
    updatedAt: raw?.updatedAt,
    publishedAt,
    author: authorSnapshot,
    authorName: authorSnapshot.name,
    authorHeadline: authorSnapshot.headline,
    authorAvatarSeed: authorSnapshot.avatarSeed,
    reactions: reactionPayload,
    comments: Array.isArray(raw?.comments) ? raw.comments : [],
    metrics: {
      ...metricsSource,
      comments: derivedCommentCount,
    },
    User: raw?.User,
  };
}

function serialiseComment(instance, replyMap = new Map()) {
  const raw = instance?.toJSON ? instance.toJSON() : instance;
  const authorUser = raw?.author || raw?.User || raw?.user || null;
  const profile = authorUser?.Profile || authorUser?.profile || null;
  const authorSnapshot = resolveAuthorSnapshot(authorUser, profile, 'Gigvora member');
  const repliesSource = replyMap instanceof Map ? replyMap.get(raw?.id) ?? [] : raw?.replies ?? [];
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
    id: raw?.id,
    postId: raw?.postId,
    parentId: raw?.parentId,
    message: raw?.body,
    body: raw?.body,
    createdAt: raw?.createdAt,
    updatedAt: raw?.updatedAt,
    author: authorSnapshot.name,
    authorName: authorSnapshot.name,
    authorHeadline: authorSnapshot.headline,
    authorAvatarSeed: authorSnapshot.avatarSeed,
    replies,
    User: userPayload,
    user: userPayload,
  };
}

export { sanitizeUrl, sanitizeString, parseCount, sanitiseMediaAttachments, serialiseFeedPost, serialiseComment };

export default {
  sanitizeUrl,
  sanitizeString,
  parseCount,
  sanitiseMediaAttachments,
  serialiseFeedPost,
  serialiseComment,
};
