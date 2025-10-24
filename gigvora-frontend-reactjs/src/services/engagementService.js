const TYPE_META = Object.freeze({
  update: { tag: 'Update', icon: '⚡️' },
  project: { tag: 'Project', icon: '🧭' },
  gig: { tag: 'Gig', icon: '🛠️' },
  job: { tag: 'Job', icon: '💼' },
  volunteering: { tag: 'Volunteer', icon: '🌱' },
  launchpad: { tag: 'Launchpad', icon: '🚀' },
  media: { tag: 'Media drop', icon: '🎬' },
  news: { tag: 'News', icon: '📰' },
});

function toArray(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  return [value].filter(Boolean);
}

function normaliseToken(value) {
  if (!value) {
    return null;
  }
  return `${value}`.trim().toLowerCase();
}

function formatToken(value) {
  const token = normaliseToken(value);
  if (!token) {
    return null;
  }
  return token
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function truncate(text, maxLength = 140) {
  if (!text) {
    return '';
  }
  const value = `${text}`.trim();
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}…`;
}

function buildAuthorFromPost(post) {
  const directAuthor = post?.author ?? {};
  const user = post?.User ?? post?.user ?? {};
  const profile = user?.Profile ?? user?.profile ?? {};
  const fallbackName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const name = directAuthor.name || post?.authorName || fallbackName || user?.name || 'Gigvora member';
  const headline =
    directAuthor.headline ||
    post?.authorHeadline ||
    profile.headline ||
    profile.bio ||
    user?.title ||
    'Active community member';
  const location = profile.location || profile.city || user?.location || post?.location || null;
  return { name, headline, location, profile };
}

function compileFeedTopics(feedPosts = []) {
  const topics = new Set();
  feedPosts.forEach((post) => {
    const type = normaliseToken(post?.type || post?.category);
    if (type) {
      topics.add(type);
    }
    toArray(post?.tags)
      .map(normaliseToken)
      .filter(Boolean)
      .forEach((tag) => topics.add(tag));
    if (post?.summary) {
      post.summary
        .split(/[,;/]|\band\b/i)
        .map(normaliseToken)
        .filter(Boolean)
        .forEach((token) => topics.add(token));
    }
  });
  return Array.from(topics);
}

function collectSessionTokens(session = {}) {
  const sources = [
    session.interests,
    session.skills,
    session.focusAreas,
    session.tags,
    session.causes,
    session.preferredCauses,
    session.preferredIndustries,
  ];
  const tokens = new Set();
  sources
    .flatMap(toArray)
    .map(normaliseToken)
    .filter(Boolean)
    .forEach((token) => tokens.add(token));

  if (Array.isArray(session.memberships)) {
    session.memberships
      .flatMap((membership) => toArray(membership?.focus ?? membership?.tags ?? membership?.topics ?? membership))
      .map(normaliseToken)
      .filter(Boolean)
      .forEach((token) => tokens.add(token));
  }

  if (session.primaryDashboard) {
    tokens.add(normaliseToken(session.primaryDashboard));
  }

  return Array.from(tokens).filter(Boolean);
}

export function resolveUserInterests(session, { feedPosts = [] } = {}) {
  const sessionTokens = collectSessionTokens(session);
  const feedTokens = compileFeedTopics(feedPosts);
  const combined = new Set([...sessionTokens, ...feedTokens].filter(Boolean));
  return Array.from(combined)
    .map(formatToken)
    .filter(Boolean)
    .slice(0, 12);
}

function buildConnectionCandidateFromPost(post, viewerId, viewerInterests = new Set()) {
  if (!post) {
    return null;
  }
  const author = buildAuthorFromPost(post);
  const user = post?.User ?? post?.user ?? {};
  const userId = user?.id ?? post?.userId ?? null;
  if (userId && viewerId && Number(userId) === Number(viewerId)) {
    return null;
  }

  const topics = new Set();
  const primaryTopic = normaliseToken(post?.type || post?.category);
  if (primaryTopic) {
    topics.add(primaryTopic);
  }
  toArray(post?.tags)
    .map(normaliseToken)
    .filter(Boolean)
    .forEach((topic) => topics.add(topic));

  const shared = Array.from(topics).filter((topic) => viewerInterests.has(topic));

  return {
    id: userId ? `user:${userId}` : `post:${post.id}`,
    userId: userId ?? null,
    name: author.name,
    headline: author.headline,
    location: author.location ?? 'Across the network',
    sharedTopics: Array.from(topics).map(formatToken).filter(Boolean),
    mutualConnections: shared.length,
    connectionUserId: userId ?? null,
    connectionHeadline: author.headline,
    connectionCompany: author.profile?.experienceEntries?.[0]?.company ?? null,
    status: userId ? 'available' : 'offline',
    connectable: Boolean(userId),
    reason:
      shared.length > 0
        ? `Posted about ${shared.map(formatToken).filter(Boolean).slice(0, 2).join(', ')} recently.`
        : 'Active on the timeline right now.',
    lastActivityAt: post?.createdAt || post?.updatedAt || new Date().toISOString(),
  };
}

export function generateConnectionSuggestions({
  session,
  feedPosts = [],
  limit = 6,
  interests,
} = {}) {
  const viewerId = session?.id ?? session?.userId ?? null;
  const interestTokens = interests ?? resolveUserInterests(session, { feedPosts });
  const interestSet = new Set(interestTokens.map(normaliseToken).filter(Boolean));

  const candidates = feedPosts
    .map((post) => buildConnectionCandidateFromPost(post, viewerId, interestSet))
    .filter(Boolean);

  const deduped = [];
  const seen = new Set();
  candidates.forEach((candidate) => {
    const key = candidate.userId ? `user:${candidate.userId}` : candidate.id;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    deduped.push(candidate);
  });

  deduped.sort((a, b) => {
    const sharedDiff = (b.mutualConnections ?? 0) - (a.mutualConnections ?? 0);
    if (sharedDiff !== 0) {
      return sharedDiff;
    }
    return (new Date(b.lastActivityAt).getTime() || 0) - (new Date(a.lastActivityAt).getTime() || 0);
  });

  return deduped.slice(0, limit).map(({ sharedTopics, lastActivityAt, ...rest }) => ({
    ...rest,
    sharedTopics,
  }));
}

function summariseFeedTopicCounts(feedPosts = []) {
  const counts = new Map();
  feedPosts.forEach((post) => {
    const topic = normaliseToken(post?.type || post?.category || 'community');
    if (!topic) {
      return;
    }
    counts.set(topic, (counts.get(topic) ?? 0) + 1);
  });
  return counts;
}

export function generateGroupSuggestions({
  session,
  feedPosts = [],
  limit = 4,
  interests,
} = {}) {
  const interestTokens = interests ?? resolveUserInterests(session, { feedPosts });
  const interestSet = new Set(interestTokens.map(normaliseToken).filter(Boolean));
  const membershipNames = new Set(
    Array.isArray(session?.memberships)
      ? session.memberships
          .map((membership) => normaliseToken(membership?.name ?? membership?.title ?? membership))
          .filter(Boolean)
      : [],
  );

  const topicCounts = summariseFeedTopicCounts(feedPosts);
  const suggestions = Array.from(topicCounts.entries()).map(([topic, count]) => {
    const formattedTopic = formatToken(topic) ?? 'Community';
    const status = membershipNames.has(topic) ? 'member' : 'available';
    const shared = interestSet.has(topic);
    return {
      id: `topic:${topic}`,
      groupId: null,
      name: `${formattedTopic} Collaborators`,
      summary: `Recent posts mention ${formattedTopic.toLowerCase()} ${count} time${count === 1 ? '' : 's'} today.`,
      focus: shared ? [formattedTopic] : [],
      location: 'Across the network',
      memberCount: count * 8,
      status,
      joinRequiresApproval: false,
      reason: shared
        ? `Aligns with your focus on ${formattedTopic.toLowerCase()}.`
        : 'Trending across the community right now.',
    };
  });

  return suggestions.slice(0, limit);
}

export function generateLiveMoments({ feedPosts = [], limit = 5 } = {}) {
  return feedPosts
    .slice(0, limit * 2)
    .map((post) => {
      const typeKey = normaliseToken(post?.type || post?.category) ?? 'update';
      const meta = TYPE_META[typeKey] ?? TYPE_META.update;
      const author = buildAuthorFromPost(post);
      const timestamp = post?.createdAt || post?.updatedAt || new Date().toISOString();
      const title = post?.title || truncate(post?.summary || post?.content || `${author.name} shared an update.`, 110);
      return {
        id: `post:${post?.id ?? Math.random().toString(36).slice(2)}`,
        tag: meta.tag,
        icon: meta.icon,
        title,
        timestamp,
        type: typeKey,
      };
    })
    .slice(0, limit);
}

export function generateNotificationStream({ session, feedPosts = [] } = {}) {
  const feedNotifications = feedPosts.slice(0, 4).map((post) => {
    const author = buildAuthorFromPost(post);
    const typeKey = normaliseToken(post?.type || post?.category) ?? 'update';
    const meta = TYPE_META[typeKey] ?? TYPE_META.update;
    return {
      id: `notification:${post?.id ?? Math.random().toString(36).slice(2)}`,
      type: 'activity',
      title: `${author.name} shared a ${meta.tag.toLowerCase()}`,
      body: truncate(post?.summary || post?.content, 160) || 'Jump in before the thread cools off.',
      timestamp: post?.createdAt || post?.updatedAt || new Date().toISOString(),
      action: { label: 'Open feed', href: '/feed' },
    };
  });

  const sessionNotifications = Array.isArray(session?.notifications)
    ? session.notifications.map((notification) => ({
        id: notification.id ?? `session:${Math.random().toString(36).slice(2)}`,
        type: notification.type ?? 'activity',
        title: notification.title ?? 'Community update',
        body: truncate(notification.body ?? notification.message, 160),
        timestamp: notification.timestamp ?? new Date().toISOString(),
        action: notification.action ?? { label: 'Review', href: '/feed' },
      }))
    : [];

  return [...sessionNotifications, ...feedNotifications].slice(0, 6);
}

export function generateMessageAlerts(session = {}) {
  if (Array.isArray(session?.messageThreads)) {
    return session.messageThreads.map((thread, index) => ({
      id: thread.id ?? `thread:${index}`,
      sender: thread.sender ?? thread.name ?? 'Gigvora member',
      preview: truncate(thread.preview ?? thread.lastMessage ?? ''),
      timestamp: thread.timestamp ?? thread.updatedAt ?? new Date().toISOString(),
      unread: thread.unread ?? Boolean(thread.isUnread),
      location: thread.location ?? 'inbox',
      route: thread.route ?? '/inbox',
    }));
  }
  return [];
}

export default {
  resolveUserInterests,
  generateConnectionSuggestions,
  generateGroupSuggestions,
  generateLiveMoments,
  generateNotificationStream,
  generateMessageAlerts,
};
