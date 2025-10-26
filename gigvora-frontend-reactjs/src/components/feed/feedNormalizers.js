import { REACTION_ALIASES, REACTION_LOOKUP, REACTION_OPTIONS } from './reactionsConfig.js';

export const POST_TYPE_META = {
  update: {
    label: 'Update',
    badgeClassName: 'bg-slate-100 text-slate-700',
  },
  media: {
    label: 'Media drop',
    badgeClassName: 'bg-indigo-100 text-indigo-700',
  },
  job: {
    label: 'Job opportunity',
    badgeClassName: 'bg-emerald-100 text-emerald-700',
  },
  gig: {
    label: 'Gig opportunity',
    badgeClassName: 'bg-orange-100 text-orange-700',
  },
  project: {
    label: 'Project update',
    badgeClassName: 'bg-blue-100 text-blue-700',
  },
  volunteering: {
    label: 'Volunteer mission',
    badgeClassName: 'bg-rose-100 text-rose-700',
  },
  launchpad: {
    label: 'Experience Launchpad',
    badgeClassName: 'bg-violet-100 text-violet-700',
  },
  news: {
    label: 'Gigvora News',
    badgeClassName: 'bg-sky-100 text-sky-700',
  },
};

export const OPPORTUNITY_POST_TYPES = new Set(['job', 'gig', 'project', 'launchpad', 'volunteering', 'mentorship']);

export function resolveAuthor(post = {}, fallbackSession = null) {
  const directAuthor = post.author ?? {};
  const user = post.User ?? post.user ?? {};
  const profile = user.Profile ?? user.profile ?? {};
  const fallbackName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const name =
    directAuthor.name ||
    post.authorName ||
    fallbackName ||
    post.authorTitle ||
    fallbackSession?.name ||
    'Gigvora member';
  const headline =
    directAuthor.headline ||
    post.authorHeadline ||
    profile.headline ||
    profile.bio ||
    post.authorTitle ||
    fallbackSession?.title ||
    'Marketplace community update';
  const avatarSeed = directAuthor.avatarSeed || post.authorAvatarSeed || profile.avatarSeed || name;

  return {
    name,
    headline,
    avatarSeed,
  };
}

export function resolvePostType(post = {}) {
  const typeKey = (post.type || post.category || post.opportunityType || 'update').toLowerCase();
  const meta = POST_TYPE_META[typeKey] ?? POST_TYPE_META.update;
  return { key: POST_TYPE_META[typeKey] ? typeKey : 'update', ...meta };
}

export function extractMediaAttachments(post = {}) {
  const attachments = [];
  if (Array.isArray(post.mediaAttachments)) {
    post.mediaAttachments
      .filter(Boolean)
      .forEach((attachment, index) => {
        if (!attachment?.url && !attachment?.src) {
          return;
        }
        attachments.push({
          id: attachment.id ?? `${post.id ?? 'media'}-${index + 1}`,
          type: attachment.type ?? (attachment.url?.endsWith('.gif') ? 'gif' : 'image'),
          url: attachment.url ?? attachment.src,
          alt: attachment.alt ?? attachment.caption ?? post.title ?? 'Feed media attachment',
        });
      });
  }

  const legacyUrl = post.imageUrl || post.mediaUrl || post.coverImage;
  if (legacyUrl) {
    attachments.push({
      id: `${post.id ?? 'media'}-legacy`,
      type: legacyUrl.endsWith('.gif') ? 'gif' : 'image',
      url: legacyUrl,
      alt: post.imageAlt || post.title || 'Feed media attachment',
    });
  }

  return attachments;
}

export function normaliseReactionSummary(reactions = {}) {
  const summary = {};
  if (reactions && typeof reactions === 'object') {
    Object.entries(reactions).forEach(([key, value]) => {
      if (!Number.isFinite(Number(value))) {
        return;
      }
      const normalisedKey = key.toString().toLowerCase().replace(/[^a-z]/g, '');
      const canonical = REACTION_ALIASES[normalisedKey] || (REACTION_LOOKUP[normalisedKey] ? normalisedKey : null);
      if (!canonical) {
        summary[normalisedKey] = (summary[normalisedKey] ?? 0) + Number(value);
        return;
      }
      summary[canonical] = (summary[canonical] ?? 0) + Number(value);
    });
  }

  REACTION_OPTIONS.forEach((option) => {
    if (typeof summary[option.id] !== 'number') {
      summary[option.id] = 0;
    }
  });

  return summary;
}

export function normaliseFeedPost(post, fallbackSession) {
  if (!post || typeof post !== 'object') {
    return null;
  }

  const createdAt = post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString();
  const normalisedType = (post.type || post.category || post.opportunityType || 'update').toLowerCase();

  const derivedAuthorName =
    post.authorName ||
    [post.User?.firstName, post.User?.lastName, post.User?.name].filter(Boolean).join(' ') ||
    fallbackSession?.name ||
    'Gigvora member';

  const reactionSummary = normaliseReactionSummary(post.reactions);
  const reactionsMap = { ...reactionSummary };
  if (typeof reactionsMap.like === 'number') {
    reactionsMap.likes = reactionsMap.like;
  }

  const viewerReaction = (() => {
    const rawReaction =
      post.viewerReaction ||
      post.viewerReactionType ||
      (post.viewerHasLiked ? 'like' : null);
    if (!rawReaction) {
      return null;
    }
    const key = rawReaction.toString().toLowerCase().replace(/[^a-z]/g, '');
    return REACTION_ALIASES[key] || (REACTION_LOOKUP[key] ? key : null);
  })();

  const normalised = {
    id: post.id ?? `local-${Date.now()}`,
    content: post.content ?? '',
    summary: post.summary ?? post.content ?? '',
    type: normalisedType,
    link: post.link ?? post.resourceLink ?? null,
    createdAt,
    authorName: derivedAuthorName,
    authorHeadline:
      post.authorHeadline ||
      post.authorTitle ||
      post.User?.Profile?.headline ||
      post.User?.Profile?.bio ||
      fallbackSession?.title ||
      'Marketplace community update',
    reactions: reactionsMap,
    reactionSummary,
    viewerReaction,
    viewerHasLiked: viewerReaction ? viewerReaction === 'like' : Boolean(post.viewerHasLiked),
    comments: Array.isArray(post.comments) ? post.comments : [],
    mediaAttachments: extractMediaAttachments(post),
    User:
      post.User ??
      (fallbackSession
        ? {
            firstName: fallbackSession.name,
            Profile: {
              avatarSeed: fallbackSession.avatarSeed ?? fallbackSession.name,
              headline: fallbackSession.title,
            },
          }
        : undefined),
  };

  if (post.title) {
    normalised.title = post.title;
  }
  if (post.source) {
    normalised.source = post.source;
  }

  const shareCount = (() => {
    const candidates = [
      post.metrics?.shares,
      post.metrics?.shareCount,
      post.metrics?.share_count,
      post.shareCount,
      post.shares,
    ];
    for (const candidate of candidates) {
      const numeric = Number.parseInt(candidate, 10);
      if (Number.isFinite(numeric) && numeric >= 0) {
        return numeric;
      }
    }
    return 0;
  })();

  normalised.shareCount = shareCount;
  if (post.metrics || shareCount) {
    normalised.metrics = {
      ...(post.metrics ?? {}),
      shares: shareCount,
    };
  }

  return normalised;
}

export function countTotalEngagement(post = {}) {
  const reactionTotal = Object.values(post.reactionSummary ?? post.reactions ?? {}).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0,
  );
  const shareTotal = Number(post.shareCount ?? post.metrics?.shares ?? 0) || 0;
  const commentTotal = Array.isArray(post.comments) ? post.comments.length : Number(post.commentCount ?? 0) || 0;
  return reactionTotal + shareTotal + commentTotal;
}

export function collectTopics(post = {}) {
  const topics = new Set();
  const append = (value) => {
    if (!value) return;
    const cleaned = value.toString().trim().toLowerCase();
    if (!cleaned || cleaned.length > 60) {
      return;
    }
    topics.add(cleaned);
  };

  if (Array.isArray(post.topics)) {
    post.topics.forEach((topic) => append(topic));
  }
  if (Array.isArray(post.tags)) {
    post.tags.forEach((tag) => append(tag));
  }
  if (Array.isArray(post.categories)) {
    post.categories.forEach((category) => append(category));
  }
  if (typeof post.type === 'string') {
    append(post.type);
  }
  if (typeof post.audience === 'string') {
    append(post.audience);
  }

  return Array.from(topics);
}

export default {
  POST_TYPE_META,
  OPPORTUNITY_POST_TYPES,
  resolveAuthor,
  resolvePostType,
  extractMediaAttachments,
  normaliseReactionSummary,
  normaliseFeedPost,
  countTotalEngagement,
  collectTopics,
};
