export function normaliseCommentEntry(comment, { index = 0, prefix, fallbackAuthor } = {}) {
  if (!comment) {
    return null;
  }

  const id =
    comment.id ||
    comment.commentId ||
    comment.uuid ||
    comment.externalId ||
    (prefix ? `${prefix}-${index}` : `comment-${index}`);

  const user = comment.user || comment.author || comment.profile || fallbackAuthor || {};
  const profile = user.Profile || user.profile || {};
  const nameCandidate =
    comment.authorName ||
    `${[user.firstName, user.lastName].filter(Boolean).join(' ')}` ||
    user.name ||
    profile.name ||
    profile.displayName ||
    fallbackAuthor?.name;
  const author =
    typeof nameCandidate === 'string' && nameCandidate.trim().length
      ? nameCandidate.trim()
      : 'Gigvora member';

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
    user,
  };
}

export function normaliseCommentList(comments, post) {
  if (!Array.isArray(comments)) {
    return [];
  }
  const prefixBase = `${post?.id ?? 'feed-post'}-comment`;
  return comments
    .map((comment, index) =>
      normaliseCommentEntry(comment, { index, prefix: prefixBase, fallbackAuthor: comment?.user || post?.User }),
    )
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

export function countThreadComments(comments) {
  if (!Array.isArray(comments)) {
    return 0;
  }
  return comments.reduce((total, comment) => {
    const replyCount = Array.isArray(comment.replies) ? comment.replies.length : 0;
    return total + 1 + replyCount;
  }, 0);
}

export function sortComments(comments, { mode = 'recent' } = {}) {
  if (!Array.isArray(comments)) {
    return [];
  }
  const cloned = [...comments];
  if (mode === 'popular') {
      return cloned
        .map((comment) => ({
          ...comment,
          replies: sortComments(comment.replies, { mode }),
          __score:
            (comment.replies?.length ?? 0) * 2 +
            Math.min(6, (comment.message?.length ?? 0) / 280) +
            (new Date(comment.createdAt).getTime() || 0) / 1_000_000_000,
        }))
        .sort((a, b) => b.__score - a.__score)
        .map((comment) => {
          const { __score, ...rest } = comment;
          void __score;
          return rest;
        });
  }
  return cloned
    .map((comment) => ({
      ...comment,
      replies: sortComments(comment.replies, { mode }),
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
