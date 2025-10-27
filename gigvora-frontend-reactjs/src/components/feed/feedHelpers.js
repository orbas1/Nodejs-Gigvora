import { REACTION_ALIASES, REACTION_LOOKUP, REACTION_OPTIONS } from './reactionsConfig.js';

export const MAX_CONTENT_LENGTH = 2200;

export const DEFAULT_EDIT_DRAFT = {
  title: '',
  content: '',
  link: '',
  type: 'update',
};

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

export const OPPORTUNITY_POST_TYPES = new Set([
  'job',
  'gig',
  'project',
  'launchpad',
  'volunteering',
  'mentorship',
]);

export const QUICK_REPLY_SUGGESTIONS = [
  'This is a fantastic milestone – congratulations! 👏',
  'Looping the team so we can amplify this right away.',
  'Let’s sync offline about how we can support the rollout.',
  'Added this into the launch tracker so nothing slips.',
];

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
  const typeKey = (post?.type || post?.category || post?.opportunityType || 'update').toLowerCase();
  const meta = POST_TYPE_META[typeKey] ?? POST_TYPE_META.update;
  return { key: POST_TYPE_META[typeKey] ? typeKey : 'update', ...meta };
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

export function normaliseCommentEntry(comment, { index = 0, prefix, fallbackAuthor } = {}) {
  if (!comment || typeof comment !== 'object') {
    return null;
  }

  const user = comment.user ?? comment.User ?? fallbackAuthor ?? {};
  const profile = user.profile ?? user.Profile ?? {};

  const authorName =
    comment.authorName ||
    [comment.author?.firstName, comment.author?.lastName].filter(Boolean).join(' ') ||
    [user.firstName, user.lastName, user.name].filter(Boolean).join(' ') ||
    'Gigvora member';

  const headline =
    comment.authorHeadline ||
    comment.headline ||
    user.headline ||
    user.title ||
    profile.headline ||
    profile.bio ||
    'Shared on Gigvora';

  return {
    id: comment.id ?? `${prefix ?? 'comment'}-${index + 1}`,
    author: authorName,
    headline,
    message: comment.message ?? comment.content ?? comment.body ?? '',
    createdAt: comment.createdAt ? new Date(comment.createdAt).toISOString() : new Date().toISOString(),
    replies: Array.isArray(comment.replies)
      ? comment.replies
          .map((reply, replyIndex) =>
            normaliseCommentEntry(reply, {
              index: replyIndex,
              prefix: `${comment.id ?? prefix ?? 'comment'}-reply`,
              fallbackAuthor: reply.user,
            }),
          )
          .filter(Boolean)
      : [],
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

  const attachments = extractMediaAttachments(post);

  return {
    ...post,
    id: post.id ?? `feed-${createdAt}`,
    createdAt,
    publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : createdAt,
    content: post.content ?? post.summary ?? '',
    summary: post.summary ?? post.content ?? '',
    title: post.title ?? null,
    authorName: derivedAuthorName,
    authorHeadline: post.authorHeadline ?? post.authorTitle ?? post.authorRole ?? null,
    authorAvatarSeed:
      post.authorAvatarSeed || post.authorAvatar || post.authorImage || derivedAuthorName || fallbackSession?.avatarSeed,
    type: normalisedType,
    reactionSummary: reactionsMap,
    mediaAttachments: attachments,
  };
}
