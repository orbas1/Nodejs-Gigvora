import { REACTION_ALIASES, REACTION_LOOKUP, REACTION_OPTIONS } from './reactionsConfig.js';

export function resolveAuthor(post) {
  const directAuthor = post?.author ?? {};
  const user = post?.User ?? post?.user ?? {};
  const profile = user?.Profile ?? user?.profile ?? {};
  const fallbackName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const name =
    directAuthor.name || post?.authorName || fallbackName || post?.authorTitle || 'Gigvora member';
  const headline =
    directAuthor.headline ||
    post?.authorHeadline ||
    profile.headline ||
    profile.bio ||
    post?.authorTitle ||
    'Marketplace community update';
  const avatarSeed = directAuthor.avatarSeed || post?.authorAvatarSeed || profile.avatarSeed || name;
  return {
    name,
    headline,
    avatarSeed,
  };
}

export function resolvePostType(post) {
  const mapping = {
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
    mentorship: {
      label: 'Mentorship call',
      badgeClassName: 'bg-amber-100 text-amber-700',
    },
  };

  const typeKey = (post?.type || post?.category || post?.opportunityType || 'update').toLowerCase();
  const meta = mapping[typeKey] ?? mapping.update;
  return { key: mapping[typeKey] ? typeKey : 'update', ...meta };
}

export function extractMediaAttachments(post) {
  const attachments = [];
  if (Array.isArray(post?.mediaAttachments)) {
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

  const legacyUrl = post?.imageUrl || post?.mediaUrl || post?.coverImage;
  if (legacyUrl) {
    attachments.push({
      id: `${post?.id ?? 'media'}-legacy`,
      type: legacyUrl.endsWith('.gif') ? 'gif' : 'image',
      url: legacyUrl,
      alt: post?.imageAlt || post?.title || 'Feed media attachment',
    });
  }

  return attachments;
}

export function normaliseReactionSummary(reactions) {
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

function resolveCountCandidate(values) {
  for (const candidate of values) {
    const numeric = Number.parseInt(candidate, 10);
    if (Number.isFinite(numeric) && numeric >= 0) {
      return numeric;
    }
  }
  return 0;
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
      post.User ||
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

  const shareCount = resolveCountCandidate([
    post.metrics?.shares,
    post.metrics?.shareCount,
    post.metrics?.share_count,
    post.shareCount,
    post.shares,
  ]);

  const commentCount = resolveCountCandidate([
    post.metrics?.comments,
    post.metrics?.commentCount,
    post.metrics?.comment_count,
    post.commentCount,
    post.commentsCount,
    Array.isArray(post.comments) ? post.comments.length : null,
  ]);

  const impressionCount = resolveCountCandidate([
    post.metrics?.impressions,
    post.metrics?.impressionCount,
    post.metrics?.views,
  ]);

  normalised.shareCount = shareCount;
  normalised.commentCount = commentCount;
  if (post.metrics || shareCount || commentCount || impressionCount) {
    normalised.metrics = {
      ...(post.metrics ?? {}),
      shares: shareCount,
      comments: commentCount,
      impressions: impressionCount,
    };
  }

  if (post.viewerHasCommented || (commentCount > 0 && post.comments?.some((comment) => comment.isViewer))) {
    normalised.viewerHasCommented = true;
  }

  return normalised;
}

export function normaliseCommentEntry(comment, { index = 0, prefix, fallbackAuthor } = {}) {
  if (!comment) {
    return null;
  }

  const basePrefix = prefix || 'comment';
  const user = comment.user ?? comment.User ?? {};
  const profile = user.Profile ?? user.profile ?? {};
  const id = comment.id ?? `${basePrefix}-${index + 1}`;
  const candidateAuthor =
    comment.author ??
    comment.authorName ??
    [user.firstName, user.lastName, user.name].filter(Boolean).join(' ');
  const author = (() => {
    if (typeof candidateAuthor === 'string' && candidateAuthor.trim().length) {
      return candidateAuthor.trim();
    }
    if (typeof fallbackAuthor?.name === 'string' && fallbackAuthor.name.trim().length) {
      return fallbackAuthor.name.trim();
    }
    return 'Community member';
  })();

  const candidateHeadline =
    comment.authorHeadline ??
    user.title ??
    user.role ??
    profile.headline ??
    profile.bio ??
    fallbackAuthor?.headline;
  const headline =
    typeof candidateHeadline === 'string' && candidateHeadline.trim().length
      ? candidateHeadline.trim()
      : 'Gigvora member';
  const message = (comment.body ?? comment.content ?? comment.message ?? comment.text ?? '').toString();
  const createdAt = comment.createdAt ?? comment.updatedAt ?? new Date().toISOString();
  const metadata = comment.metadata && typeof comment.metadata === 'object' ? comment.metadata : null;
  const metadataFlags = metadata ?? {};
  const insightTags = Array.isArray(comment.insightTags)
    ? comment.insightTags
    : Array.isArray(metadataFlags.insightTags)
    ? metadataFlags.insightTags
    : [];
  const isPinned = Boolean(comment.isPinned ?? metadataFlags.isPinned ?? metadataFlags.pinned);
  const isOfficial = Boolean(comment.isOfficial ?? metadataFlags.isOfficial ?? metadataFlags.official);
  const guidance = typeof (comment.guidance ?? metadataFlags.guidance) === 'string'
    ? (comment.guidance ?? metadataFlags.guidance)
    : null;
  const language = comment.language ?? metadataFlags.language ?? null;
  const avatarSeed =
    comment.authorAvatarSeed ??
    comment.avatarSeed ??
    profile.avatarSeed ??
    fallbackAuthor?.avatarSeed ??
    user.firstName ??
    author;
  const replies = Array.isArray(comment.replies)
    ? comment.replies
        .map((reply, replyIndex) =>
          normaliseCommentEntry(reply, {
            index: replyIndex,
            prefix: `${id}-reply`,
            fallbackAuthor: reply.user ?? fallbackAuthor ?? user,
          }),
        )
        .filter(Boolean)
    : [];

  return {
    id,
    author,
    headline,
    message,
    createdAt,
    replies,
    metadata,
    metadataFlags,
    insightTags,
    isPinned,
    isOfficial,
    guidance,
    language,
    avatarSeed,
  };
}

export function normaliseCommentList(comments, post) {
  if (!Array.isArray(comments)) {
    return [];
  }
  const prefixBase = `${post?.id ?? 'feed-post'}-comment`;
  return comments
    .map((comment, index) => normaliseCommentEntry(comment, { index, prefix: prefixBase, fallbackAuthor: comment?.user }))
    .filter(Boolean);
}

export function normaliseCommentsFromResponse(response, post) {
  if (!response) {
    return [];
  }
  if (Array.isArray(response)) {
    return normaliseCommentList(response, post);
  }
  if (Array.isArray(response.items)) {
    return normaliseCommentList(response.items, post);
  }
  if (Array.isArray(response.data)) {
    return normaliseCommentList(response.data, post);
  }
  if (Array.isArray(response.results)) {
    return normaliseCommentList(response.results, post);
  }
  if (Array.isArray(response.comments)) {
    return normaliseCommentList(response.comments, post);
  }
  const comments = Array.isArray(response?.comments)
    ? response.comments
    : Array.isArray(response?.data)
    ? response.data
    : [];
  if (comments.length) {
    return normaliseCommentList(comments, post);
  }
  return [];
}

export function normaliseSingleComment(response, post, fallbackAuthor, { prefix } = {}) {
  const list = normaliseCommentsFromResponse(response, post);
  if (list.length) {
    return list[0];
  }
  if (response && typeof response === 'object') {
    return normaliseCommentEntry(response, {
      index: 0,
      prefix: prefix ?? `${post?.id ?? 'feed-post'}-comment`,
      fallbackAuthor,
    });
  }
  return null;
}
