import {
  GlobeAltIcon,
  HandRaisedIcon,
  HandThumbUpIcon,
  HeartIcon,
  LightBulbIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const DEFAULT_EDIT_DRAFT = {
  title: '',
  content: '',
  link: '',
  type: 'update',
};

const POST_TYPE_META = {
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

const QUICK_REPLY_SUGGESTIONS = [
  'This is a fantastic milestone – congratulations! 👏',
  'Looping the team so we can amplify this right away.',
  'Let’s sync offline about how we can support the rollout.',
  'Added this into the launch tracker so nothing slips.',
];
const MAX_CONTENT_LENGTH = 2200;
const FEED_PAGE_SIZE = 12;
const DEFAULT_FEED_VIRTUAL_CHUNK_SIZE = 5;
const FEED_VIRTUAL_MIN_CHUNK_SIZE = 4;
const FEED_VIRTUAL_MAX_CHUNK_SIZE = 12;
const DEFAULT_VIEWPORT_HEIGHT = 900;
const FEED_VIRTUAL_THRESHOLD = 14;
const DEFAULT_CHUNK_ESTIMATE = 420;
const OPPORTUNITY_POST_TYPES = new Set(['job', 'gig', 'project', 'launchpad', 'volunteering', 'mentorship']);
const COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const COMPOSER_PERSONA_PROMPTS = {
  founder: [
    {
      id: 'founder-launch',
      headline: 'Celebrate a product or hiring milestone',
      body: 'Share the latest traction numbers, shout out collaborators, and include a CTA for the next customer cohort.',
    },
    {
      id: 'founder-ask',
      headline: 'Ask the community for targeted support',
      body: 'Explain the challenge, outline what type of partner or hire you need, and link to the best next step.',
    },
    {
      id: 'founder-reflection',
      headline: 'Reflect on a key learning',
      body: 'Summarise what changed, list the insights that will guide the next sprint, and invite mentors to respond.',
    },
  ],
  mentor: [
    {
      id: 'mentor-celebration',
      headline: 'Spotlight a mentee win',
      body: 'Describe the breakthrough moment, share the tactics that worked, and tag resources mentors can reuse.',
    },
    {
      id: 'mentor-guide',
      headline: 'Publish a practical guide',
      body: 'Outline the problem, provide three actionable steps, and link to a template or workshop recording.',
    },
    {
      id: 'mentor-open-hours',
      headline: 'Offer office hours',
      body: 'Share your availability, topics you can help with, and how founders can request a slot.',
    },
  ],
  recruiter: [
    {
      id: 'recruiter-opportunity',
      headline: 'Promote a priority role',
      body: 'Lead with the mission, detail the impact in the first 90 days, and mention perks or hybrid policies.',
    },
    {
      id: 'recruiter-pipeline',
      headline: 'Share pipeline insights',
      body: 'Highlight the talent trends you are seeing, key roles in demand, and where founders should focus outreach.',
    },
    {
      id: 'recruiter-success',
      headline: 'Celebrate a placement',
      body: 'Spotlight the candidate, the client win, and the metrics that prove the match was a success.',
    },
  ],
  investor: [
    {
      id: 'investor-thesis',
      headline: 'Publish a thesis update',
      body: 'Explain the market signal, how your portfolio is adapting, and invite founders who align to reach out.',
    },
    {
      id: 'investor-support',
      headline: 'Offer strategic support',
      body: 'Share the areas you can help portfolio founders with this quarter and provide a calendly or office hours link.',
    },
    {
      id: 'investor-spotlight',
      headline: 'Spotlight a portfolio win',
      body: 'Tell the story of the win, the team behind it, and the measurable outcomes that investors love to see.',
    },
  ],
  default: [
    {
      id: 'default-update',
      headline: 'Share a momentum update',
      body: 'Summarise the outcome, quantify the impact, and invite your network to engage or support.',
    },
    {
      id: 'default-question',
      headline: 'Pose a thoughtful question',
      body: 'Frame the challenge, outline what you have tried, and tag the disciplines you want feedback from.',
    },
    {
      id: 'default-resource',
      headline: 'Drop a resource worth bookmarking',
      body: 'Explain why it matters, who it is for, and the actionable insight readers will walk away with.',
    },
  ],
};

const COMPOSER_SUGGESTED_HASHTAGS = [
  '#hiring',
  '#fundraising',
  '#productupdate',
  '#communitywin',
  '#seekingadvice',
  '#launchpad',
  '#gigvora',
  '#talentmatch',
];

const COMPOSER_AUDIENCE_OPTIONS = [
  {
    id: 'network',
    label: 'Connections',
    description: 'Followers, partners, and teams you collaborate with.',
    icon: UserGroupIcon,
  },
  {
    id: 'mentors',
    label: 'Mentor council',
    description: 'Keep this update inside your mentor and advisor circle.',
    icon: SparklesIcon,
  },
  {
    id: 'public',
    label: 'Public',
    description: 'Share a polished version beyond Gigvora channels.',
    icon: GlobeAltIcon,
  },
];

const DEFAULT_ACTIVITY_FILTERS = {
  view: 'all',
  persona: 'all',
  search: '',
  tags: [],
  withMedia: false,
  withPolls: false,
  followingOnly: false,
  savedViewId: null,
  timeRange: '30d',
  sort: 'top',
  digestEligibleOnly: false,
  trendingOnly: false,
};

const ACTIVITY_QUICK_VIEWS = [
  { id: 'all', label: 'For you', description: 'Balanced mix of updates and opportunities.' },
  { id: 'opportunities', label: 'Opportunities', description: 'Roles, gigs, and collaborations ready now.' },
  { id: 'wins', label: 'Wins', description: 'Launches, milestones, and community celebrations.' },
  { id: 'knowledge', label: 'Insights', description: 'Deep dives, resources, and thought leadership.' },
];

const ACTIVITY_SORT_OPTIONS = [
  { id: 'top', label: 'Top', description: 'Highlights the highest engagement first.' },
  { id: 'recent', label: 'Recent', description: 'Newest stories at the top of your feed.' },
  { id: 'discussions', label: 'Discussions', description: 'Prioritises conversations with active threads.' },
];

const ACTIVITY_TIME_RANGES = [
  { id: '24h', label: '24h' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
  { id: 'any', label: 'Any time' },
];

const ACTIVITY_PERSONA_OPTIONS = [
  { id: 'all', label: 'All members' },
  { id: 'founder', label: 'Founders & operators' },
  { id: 'mentor', label: 'Mentors & advisors' },
  { id: 'investor', label: 'Investors & scouts' },
  { id: 'recruiter', label: 'Talent partners' },
];

const REACTION_OPTIONS = [
  {
    id: 'like',
    label: 'Appreciate',
    activeLabel: 'Appreciated',
    Icon: HandThumbUpIcon,
    activeClasses: 'border-sky-200 bg-sky-50 text-sky-700',
    dotClassName: 'bg-sky-500',
    description: 'Show gratitude or agreement.',
  },
  {
    id: 'celebrate',
    label: 'Celebrate',
    activeLabel: 'Celebrating',
    Icon: SparklesIcon,
    activeClasses: 'border-amber-200 bg-amber-50 text-amber-700',
    dotClassName: 'bg-amber-500',
    description: 'Mark major wins and launches.',
  },
  {
    id: 'support',
    label: 'Support',
    activeLabel: 'Supporting',
    Icon: HandRaisedIcon,
    activeClasses: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dotClassName: 'bg-emerald-500',
    description: 'Signal you have their back.',
  },
  {
    id: 'love',
    label: 'Champion',
    activeLabel: 'Championing',
    Icon: HeartIcon,
    activeClasses: 'border-rose-200 bg-rose-50 text-rose-700',
    dotClassName: 'bg-rose-500',
    description: 'Spotlight heartfelt wins and gratitude.',
  },
  {
    id: 'insightful',
    label: 'Insightful',
    activeLabel: 'Finding insightful',
    Icon: LightBulbIcon,
    activeClasses: 'border-violet-200 bg-violet-50 text-violet-700',
    dotClassName: 'bg-violet-500',
    description: 'Highlight thought leadership.',
  },
];

const REACTION_LOOKUP = REACTION_OPTIONS.reduce((map, option) => {
  map[option.id] = option;
  return map;
}, {});

const REACTION_ALIASES = {
  like: 'like',
  likes: 'like',
  heart: 'love',
  hearts: 'love',
  love: 'love',
  loved: 'love',
  celebrate: 'celebrate',
  celebration: 'celebrate',
  celebrations: 'celebrate',
  support: 'support',
  supportive: 'support',
  care: 'support',
  caring: 'support',
  insightful: 'insightful',
  insight: 'insightful',
  insights: 'insightful',
  curious: 'insightful',
  curiosity: 'insightful',
};

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

export function resolvePersonaKey(session) {
  if (!session) {
    return 'default';
  }
  const candidates = [
    session.primaryDashboard,
    session.primaryMembership,
    session.userType,
    Array.isArray(session.memberships) ? session.memberships[0] : null,
  ]
    .filter(Boolean)
    .map((value) => value.toString().toLowerCase());

  const persona = candidates.find((value) => value.includes('founder') || value.includes('entrepreneur'));
  if (persona) {
    return 'founder';
  }
  const mentor = candidates.find((value) => value.includes('mentor') || value.includes('advisor') || value.includes('coach'));
  if (mentor) {
    return 'mentor';
  }
  const recruiter = candidates.find(
    (value) => value.includes('talent') || value.includes('recruiter') || value.includes('hiring'),
  );
  if (recruiter) {
    return 'recruiter';
  }
  const investor = candidates.find((value) => value.includes('investor') || value.includes('venture'));
  if (investor) {
    return 'investor';
  }
  return candidates[0] ?? 'default';
}

export function normaliseTopic(value) {
  if (value == null) {
    return null;
  }
  const stringified = typeof value === 'string' ? value : String(value);
  const trimmed = stringified.trim();
  if (!trimmed) {
    return null;
  }
  const withoutHash = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
  const cleaned = withoutHash.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return cleaned.replace(/^_+|_+$/g, '') || null;
}

function extractHashtagsFromText(text) {
  if (typeof text !== 'string') {
    return [];
  }
  const matches = text.match(/#([a-z0-9_]{2,50})/gi);
  if (!matches) {
    return [];
  }
  return matches
    .map((match) => normaliseTopic(match))
    .filter(Boolean);
}

export function derivePostTopics(post) {
  const topics = new Set();
  const candidateCollections = [
    post?.tags,
    post?.topics,
    post?.labels,
    post?.categories,
    post?.focus,
    post?.hashtags,
    post?.sectors,
    post?.audiences,
  ];

  candidateCollections.forEach((collection) => {
    if (!collection) {
      return;
    }
    if (Array.isArray(collection)) {
      collection.forEach((item) => {
        const normalised = normaliseTopic(item);
        if (normalised) {
          topics.add(normalised);
        }
      });
      return;
    }
    if (typeof collection === 'string') {
      collection
        .split(/[,#]/)
        .map((item) => normaliseTopic(item))
        .filter(Boolean)
        .forEach((item) => topics.add(item));
    }
  });

  const textualSources = [post?.content, post?.summary, post?.title, post?.headline];
  textualSources.forEach((entry) => {
    extractHashtagsFromText(entry).forEach((tag) => topics.add(tag));
  });

  const type = normaliseTopic(post?.type || post?.category || post?.opportunityType);
  if (type) {
    topics.add(type);
  }

  const persona = normaliseTopic(post?.targetPersona || post?.persona || post?.audience || post?.primaryAudience);
  if (persona) {
    topics.add(persona);
  }

  return Array.from(topics);
}

export function computeCommentCount(post) {
  if (typeof post?.commentCount === 'number') {
    return post.commentCount;
  }
  if (!Array.isArray(post?.comments)) {
    return 0;
  }
  return post.comments.reduce((total, comment) => {
    const replies = Array.isArray(comment?.replies) ? comment.replies.length : 0;
    return total + 1 + replies;
  }, 0);
}

export function computeTotalReactions(post) {
  const reactions = post?.reactionSummary ?? post?.reactions ?? {};
  if (!reactions || typeof reactions !== 'object') {
    return 0;
  }
  return Object.values(reactions).reduce((total, value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? total + numeric : total;
  }, 0);
}

export function postMatchesQuickView(post, view) {
  if (!view || view === 'all') {
    return true;
  }
  const type = normaliseTopic(post?.type || post?.category || post?.opportunityType);
  const topics = derivePostTopics(post);
  if (view === 'opportunities') {
    return (
      (type && OPPORTUNITY_POST_TYPES.has(type)) ||
      topics.some((topic) =>
        ['opportunity', 'hiring', 'gig', 'project', 'mission', 'launchpad', 'mentorship', 'recruiting'].includes(topic),
      )
    );
  }
  if (view === 'wins') {
    const text = `${post?.title ?? ''} ${post?.summary ?? ''} ${post?.content ?? ''}`.toLowerCase();
    return (
      text.includes('win') ||
      text.includes('milestone') ||
      text.includes('celebrat') ||
      topics.some((topic) => ['win', 'milestone', 'celebration', 'launch', 'success'].includes(topic))
    );
  }
  if (view === 'knowledge') {
    return (
      type === 'news' ||
      topics.some((topic) => ['insight', 'guide', 'playbook', 'resource', 'webinar', 'case_study', 'knowledge'].includes(topic))
    );
  }
  return true;
}

export function postMatchesPersona(post, persona) {
  if (!persona || persona === 'all') {
    return true;
  }
  const personaKey = persona.toLowerCase();
  const topics = derivePostTopics(post);
  const targetPersona = normaliseTopic(
    post?.targetPersona || post?.persona || post?.audience || post?.primaryAudience || post?.intendedAudience,
  );
  const candidateSet = new Set(topics);
  if (targetPersona) {
    candidateSet.add(targetPersona);
  }
  if (personaKey === 'founder') {
    return (
      candidateSet.has('founder') ||
      candidateSet.has('entrepreneur') ||
      candidateSet.has('startup') ||
      candidateSet.has('builder')
    );
  }
  if (personaKey === 'mentor') {
    return candidateSet.has('mentor') || candidateSet.has('advisor') || candidateSet.has('coach');
  }
  if (personaKey === 'investor') {
    return candidateSet.has('investor') || candidateSet.has('vc') || candidateSet.has('angel');
  }
  if (personaKey === 'recruiter' || personaKey === 'talent') {
    return candidateSet.has('recruiter') || candidateSet.has('talent') || candidateSet.has('hiring');
  }
  return candidateSet.has(personaKey);
}

function matchesTimeRange(post, timeRange) {
  if (!timeRange || timeRange === 'any') {
    return true;
  }
  const timestamp = post?.createdAt || post?.publishedAt || post?.updatedAt;
  if (!timestamp) {
    return true;
  }
  const created = new Date(timestamp);
  if (Number.isNaN(created.getTime())) {
    return true;
  }
  const now = Date.now();
  const diffMs = now - created.getTime();
  const thresholds = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
  };
  const limit = thresholds[timeRange];
  if (!limit) {
    return true;
  }
  return diffMs <= limit;
}

export function postMatchesFilters(post, filters) {
  if (!post) {
    return false;
  }
  if (!postMatchesQuickView(post, filters.view)) {
    return false;
  }
  if (!postMatchesPersona(post, filters.persona)) {
    return false;
  }
  if (filters.withMedia) {
    if (!Array.isArray(post?.mediaAttachments) || post.mediaAttachments.length === 0) {
      return false;
    }
  }
  if (filters.withPolls) {
    const poll = post?.poll || (Array.isArray(post?.pollOptions) ? { options: post.pollOptions } : null);
    if (!poll || !Array.isArray(poll.options) || poll.options.length === 0) {
      return false;
    }
  }
  if (filters.followingOnly) {
    const relationship = (post?.relationship || post?.viewerRelationship || '').toString().toLowerCase();
    const fromConnection =
      post?.viewerFollowsAuthor ||
      post?.viewerIsConnection ||
      post?.viewerIsMember ||
      post?.isFromConnection ||
      relationship.includes('connection') ||
      relationship.includes('follow');
    if (!fromConnection) {
      return false;
    }
  }
  if (filters.digestEligibleOnly) {
    if (!post?.isDigestEligible && !post?.eligibleForDigest) {
      return false;
    }
  }
  if (filters.trendingOnly) {
    const metrics = post?.metrics ?? post?.analytics ?? {};
    const engagementScore = Number(metrics.engagementScore ?? metrics.score ?? metrics.engagement ?? 0);
    const trending = post?.isTrending || post?.trending === true || engagementScore >= 60;
    if (!trending) {
      return false;
    }
  }
  if (!matchesTimeRange(post, filters.timeRange)) {
    return false;
  }
  const query = filters.search?.trim();
  if (query) {
    const haystack = [
      post?.title,
      post?.summary,
      post?.content,
      post?.authorName,
      post?.authorHeadline,
      Array.isArray(post?.tags) ? post.tags.join(' ') : null,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(query.toLowerCase())) {
      return false;
    }
  }
  if (Array.isArray(filters.tags) && filters.tags.length) {
    const topicSet = new Set(derivePostTopics(post));
    const matchesTags = filters.tags.every((tag) => topicSet.has(normaliseTopic(tag)));
    if (!matchesTags) {
      return false;
    }
  }
  return true;
}

export function sortPostsByPreference(posts, filters) {
  const list = posts.slice();
  if (filters.sort === 'recent') {
    return list.sort((a, b) => {
      const dateA = new Date(a?.createdAt || a?.publishedAt || 0).getTime();
      const dateB = new Date(b?.createdAt || b?.publishedAt || 0).getTime();
      return dateB - dateA;
    });
  }
  if (filters.sort === 'discussions') {
    return list.sort((a, b) => computeCommentCount(b) - computeCommentCount(a));
  }
  return list.sort((a, b) => {
    const metricsA = a?.metrics ?? a?.analytics ?? {};
    const metricsB = b?.metrics ?? b?.analytics ?? {};
    const engagementA = Number(metricsA.engagementScore ?? metricsA.score ?? 0);
    const engagementB = Number(metricsB.engagementScore ?? metricsB.score ?? 0);
    const reactionsA = computeTotalReactions(a);
    const reactionsB = computeTotalReactions(b);
    const commentA = computeCommentCount(a);
    const commentB = computeCommentCount(b);
    const recencyA = new Date(a?.createdAt || a?.publishedAt || 0).getTime();
    const recencyB = new Date(b?.createdAt || b?.publishedAt || 0).getTime();
    const now = Date.now();
    const ageA = Number.isFinite(recencyA) ? now - recencyA : Number.POSITIVE_INFINITY;
    const ageB = Number.isFinite(recencyB) ? now - recencyB : Number.POSITIVE_INFINITY;
    const recencyBoostA = Number.isFinite(ageA) ? Math.max(0, 720 - ageA / (60 * 60 * 1000)) : 0;
    const recencyBoostB = Number.isFinite(ageB) ? Math.max(0, 720 - ageB / (60 * 60 * 1000)) : 0;
    const scoreA = engagementA * 2 + reactionsA * 1.5 + commentA * 1.25 + recencyBoostA;
    const scoreB = engagementB * 2 + reactionsB * 1.5 + commentB * 1.25 + recencyBoostB;
    return scoreB - scoreA;
  });
}

export function createFilterStorageKey(sessionId) {
  return `timeline:activity-filters:v2:${sessionId ?? 'guest'}`;
}

export function serializeFeedQuery(params = {}) {
  const entries = Object.entries(params).filter(([, value]) => {
    if (value == null) {
      return false;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return true;
  });
  return entries
    .sort(([aKey], [bKey]) => (aKey > bKey ? 1 : aKey < bKey ? -1 : 0))
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}=${value.join('|')}`;
      }
      if (typeof value === 'object') {
        return `${key}=${JSON.stringify(value)}`;
      }
      return `${key}=${value}`;
    })
    .join('&');
}

export function buildFeedQuery(filters) {
  const query = { limit: FEED_PAGE_SIZE };
  if (!filters) {
    return query;
  }
  if (filters.view === 'opportunities') {
    query.category = 'opportunity';
  } else if (filters.view === 'wins') {
    query.category = 'milestone';
  } else if (filters.view === 'knowledge') {
    query.category = 'insight';
  }
  if (filters.persona && filters.persona !== 'all') {
    query.persona = filters.persona;
  }
  if (filters.search) {
    query.search = filters.search.trim();
  }
  if (Array.isArray(filters.tags) && filters.tags.length) {
    query.tags = filters.tags.map((tag) => normaliseTopic(tag)).filter(Boolean).join(',');
  }
  if (filters.withMedia) {
    query.hasMedia = true;
  }
  if (filters.withPolls) {
    query.hasPoll = true;
  }
  if (filters.followingOnly) {
    query.relationship = 'connections';
  }
  if (filters.timeRange && filters.timeRange !== 'any') {
    query.since = filters.timeRange;
  }
  if (filters.sort && filters.sort !== 'top') {
    query.sort = filters.sort;
  }
  if (filters.digestEligibleOnly) {
    query.digestEligible = true;
  }
  if (filters.trendingOnly) {
    query.trending = true;
  }
  if (filters.savedViewId) {
    query.view = filters.savedViewId;
  }
  return query;
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

  return normalised;
}

function normaliseCommentEntry(comment, { index = 0, prefix, fallbackAuthor } = {}) {
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

export {
  DEFAULT_EDIT_DRAFT,
  POST_TYPE_META,
  QUICK_REPLY_SUGGESTIONS,
  MAX_CONTENT_LENGTH,
  FEED_PAGE_SIZE,
  DEFAULT_FEED_VIRTUAL_CHUNK_SIZE,
  FEED_VIRTUAL_MIN_CHUNK_SIZE,
  FEED_VIRTUAL_MAX_CHUNK_SIZE,
  DEFAULT_VIEWPORT_HEIGHT,
  FEED_VIRTUAL_THRESHOLD,
  DEFAULT_CHUNK_ESTIMATE,
  OPPORTUNITY_POST_TYPES,
  COMPACT_NUMBER_FORMATTER,
  COMPOSER_PERSONA_PROMPTS,
  COMPOSER_SUGGESTED_HASHTAGS,
  COMPOSER_AUDIENCE_OPTIONS,
  DEFAULT_ACTIVITY_FILTERS,
  ACTIVITY_QUICK_VIEWS,
  ACTIVITY_SORT_OPTIONS,
  ACTIVITY_TIME_RANGES,
  ACTIVITY_PERSONA_OPTIONS,
  REACTION_OPTIONS,
  REACTION_LOOKUP,
  REACTION_ALIASES,
};
