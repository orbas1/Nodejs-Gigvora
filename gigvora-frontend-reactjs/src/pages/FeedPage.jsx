import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  BookmarkIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronDownIcon,
  ChatBubbleOvalLeftIcon,
  ClockIcon,
  FaceSmileIcon,
  FireIcon,
  GlobeAltIcon,
  HandRaisedIcon,
  HandThumbUpIcon,
  HashtagIcon,
  LightBulbIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  HeartIcon,
  ShareIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import UserAvatar from '../components/UserAvatar.jsx';
import EmojiQuickPickerPopover from '../components/popovers/EmojiQuickPickerPopover.jsx';
import GifSuggestionPopover from '../components/popovers/GifSuggestionPopover.jsx';
import useCachedResource from '../hooks/useCachedResource.js';
import { apiClient } from '../services/apiClient.js';
import {
  listFeedPosts,
  createFeedPost,
  updateFeedPost,
  deleteFeedPost,
  reactToFeedPost,
  listFeedComments,
  createFeedComment,
  createFeedReply,
} from '../services/liveFeed.js';
import analytics from '../services/analytics.js';
import { formatRelativeTime } from '../utils/date.js';
import useSession from '../hooks/useSession.js';
import useEngagementSignals from '../hooks/useEngagementSignals.js';
import {
  ContentModerationError,
  moderateFeedComposerPayload,
  sanitiseExternalLink,
} from '../utils/contentModeration.js';
import { ALLOWED_FEED_MEMBERSHIPS, COMPOSER_OPTIONS } from '../constants/feedMeta.js';

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

function resolvePersonaKey(session) {
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

function normaliseTopic(value) {
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

function derivePostTopics(post) {
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

function computeCommentCount(post) {
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

function computeTotalReactions(post) {
  const reactions = post?.reactionSummary ?? post?.reactions ?? {};
  if (!reactions || typeof reactions !== 'object') {
    return 0;
  }
  return Object.values(reactions).reduce((total, value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? total + numeric : total;
  }, 0);
}

function postMatchesQuickView(post, view) {
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

function postMatchesPersona(post, persona) {
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

function postMatchesFilters(post, filters) {
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

function sortPostsByPreference(posts, filters) {
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

function createFilterStorageKey(sessionId) {
  return `timeline:activity-filters:v2:${sessionId ?? 'guest'}`;
}

function serializeFeedQuery(params = {}) {
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

function buildFeedQuery(filters) {
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

function normaliseReactionSummary(reactions) {
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

function normaliseCommentList(comments, post) {
  if (!Array.isArray(comments)) {
    return [];
  }
  const prefixBase = `${post?.id ?? 'feed-post'}-comment`;
  return comments
    .map((comment, index) => normaliseCommentEntry(comment, { index, prefix: prefixBase, fallbackAuthor: comment?.user }))
    .filter(Boolean);
}

function normaliseCommentsFromResponse(response, post) {
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

function normaliseSingleComment(response, post, fallbackAuthor, { prefix } = {}) {
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

function MediaAttachmentPreview({ attachment, onRemove }) {
  if (!attachment) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner">
      <div className="relative">
        <img
          src={attachment.url}
          alt={attachment.alt || 'Feed media attachment'}
          className="h-48 w-full object-cover"
          loading="lazy"
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-4 top-4 inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-white"
        >
          Remove media
        </button>
      </div>
      {attachment.alt ? (
        <p className="border-t border-slate-200 px-4 py-2 text-xs text-slate-500">{attachment.alt}</p>
      ) : null}
    </div>
  );
}

function FeedComposer({ onCreate, session }) {
  const personaKey = useMemo(() => resolvePersonaKey(session), [session]);
  const personaPrompts = useMemo(
    () => COMPOSER_PERSONA_PROMPTS[personaKey] ?? COMPOSER_PERSONA_PROMPTS.default,
    [personaKey],
  );
  const defaultPromptId = personaPrompts[0]?.id ?? null;
  const [mode, setMode] = useState('update');
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [attachmentAlt, setAttachmentAlt] = useState('');
  const [audience, setAudience] = useState('network');
  const [shareToDigest, setShareToDigest] = useState(false);
  const [scheduleMode, setScheduleMode] = useState('now');
  const [scheduledFor, setScheduledFor] = useState('');
  const [selectedHashtags, setSelectedHashtags] = useState([]);
  const [selectedPromptId, setSelectedPromptId] = useState(defaultPromptId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [draftStatus, setDraftStatus] = useState('loading');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [showGifTray, setShowGifTray] = useState(false);
  const textareaId = useId();
  const linkInputId = useId();
  const mediaAltId = useId();
  const scheduleInputId = useId();
  const composerStorageKey = useMemo(() => `timeline:composer:${session?.id ?? 'guest'}`, [session?.id]);
  const storageReadyRef = useRef(false);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      storageReadyRef.current = true;
      setDraftStatus('clean');
      return;
    }
    try {
      const raw = window.localStorage.getItem(composerStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setMode(parsed.mode ?? 'update');
        setContent(parsed.content ?? '');
        setLink(parsed.link ?? '');
        setAttachment(parsed.attachment ?? null);
        setAttachmentAlt(parsed.attachmentAlt ?? '');
        setAudience(parsed.audience ?? 'network');
        setShareToDigest(Boolean(parsed.shareToDigest));
        setScheduleMode(parsed.scheduleMode ?? 'now');
        setScheduledFor(parsed.scheduledFor ?? '');
        setSelectedHashtags(Array.isArray(parsed.hashtags) ? parsed.hashtags : []);
        setSelectedPromptId(parsed.promptId ?? defaultPromptId ?? null);
        if (parsed.updatedAt) {
          const updatedAt = new Date(parsed.updatedAt);
          if (!Number.isNaN(updatedAt.getTime())) {
            setLastSavedAt(updatedAt);
          }
        }
        setDraftStatus('saved');
      } else {
        setDraftStatus('clean');
      }
    } catch (storageError) {
      setDraftStatus('error');
    } finally {
      storageReadyRef.current = true;
    }
  }, [composerStorageKey, defaultPromptId]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!storageReadyRef.current || typeof window === 'undefined') {
      return undefined;
    }
    setDraftStatus((previous) => (previous === 'loading' ? 'loading' : 'saving'));
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      try {
        const payload = {
          mode,
          content,
          link,
          attachment: attachment
            ? {
                id: attachment.id ?? null,
                type: attachment.type ?? null,
                url: attachment.url ?? null,
                alt: attachment.alt ?? attachmentAlt ?? null,
              }
            : null,
          attachmentAlt,
          audience,
          shareToDigest,
          scheduleMode,
          scheduledFor,
          hashtags: selectedHashtags,
          promptId: selectedPromptId,
          updatedAt: new Date().toISOString(),
        };
        window.localStorage.setItem(composerStorageKey, JSON.stringify(payload));
        const savedAt = new Date(payload.updatedAt);
        if (!Number.isNaN(savedAt.getTime())) {
          setLastSavedAt(savedAt);
        }
        setDraftStatus('saved');
      } catch (storageError) {
        setDraftStatus('error');
      }
    }, 600);
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    attachment,
    attachmentAlt,
    audience,
    composerStorageKey,
    content,
    link,
    mode,
    scheduleMode,
    scheduledFor,
    selectedHashtags,
    selectedPromptId,
    shareToDigest,
  ]);

  const selectedOption = useMemo(
    () => COMPOSER_OPTIONS.find((option) => option.id === mode) ?? COMPOSER_OPTIONS[0],
    [mode],
  );
  const remainingCharacters = Math.max(0, MAX_CONTENT_LENGTH - content.length);

  const toggleHashtag = useCallback((tag) => {
    setSelectedHashtags((previous) => {
      if (previous.includes(tag)) {
        return previous.filter((existing) => existing !== tag);
      }
      setContent((current) => {
        if (!current.toLowerCase().includes(tag.toLowerCase())) {
          return current ? `${current} ${tag}` : tag;
        }
        return current;
      });
      return [...previous, tag];
    });
    setError(null);
  }, []);

  const handlePromptInsert = useCallback((prompt) => {
    if (!prompt) {
      return;
    }
    setSelectedPromptId(prompt.id);
    setContent((current) => {
      if (!current.trim()) {
        return `${prompt.headline}\n\n${prompt.body}`;
      }
      if (current.includes(prompt.body)) {
        return current;
      }
      return `${current.trim()}\n\n${prompt.body}`;
    });
    setError(null);
  }, []);

  const handleClearDraft = useCallback(() => {
    setMode('update');
    setContent('');
    setLink('');
    setAttachment(null);
    setAttachmentAlt('');
    setAudience('network');
    setShareToDigest(false);
    setScheduleMode('now');
    setScheduledFor('');
    setSelectedHashtags([]);
    setSelectedPromptId(defaultPromptId ?? null);
    setDraftStatus('clean');
    setLastSavedAt(null);
    setShowEmojiTray(false);
    setShowGifTray(false);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(composerStorageKey);
    }
  }, [composerStorageKey, defaultPromptId]);

  const scheduledTimestamp =
    scheduleMode === 'schedule' && scheduledFor ? new Date(scheduledFor).toISOString() : null;

  const publishDisabled =
    submitting || !content.trim() || (scheduleMode === 'schedule' && !scheduledTimestamp);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting || publishDisabled) {
      if (!content.trim()) {
        setError({ message: 'Compose an update before publishing.' });
      }
      if (scheduleMode === 'schedule' && !scheduledTimestamp) {
        setError({ message: 'Choose a future time to schedule your post.' });
      }
      return;
    }

    if (scheduleMode === 'schedule' && scheduledTimestamp) {
      const scheduledDate = new Date(scheduledTimestamp);
      if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
        setError({ message: 'Scheduled time must be in the future.' });
        return;
      }
    }

    const draftPayload = {
      type: mode,
      content,
      summary: content,
      link: sanitiseExternalLink(link),
      mediaAttachments: attachment
        ? [
            {
              id: attachment.id,
              type: attachment.type,
              url: attachment.url,
              alt: attachmentAlt?.trim() || attachment.alt,
            },
          ]
        : [],
    };

    let moderated;
    try {
      moderated = moderateFeedComposerPayload(draftPayload);
    } catch (moderationError) {
      if (moderationError instanceof ContentModerationError) {
        setError({
          message: moderationError.message,
          reasons: moderationError.reasons,
        });
        return;
      }
      setError({
        message: moderationError?.message || 'We could not publish your update. Please try again in a moment.',
      });
      return;
    }

    const payload = {
      type: mode,
      content: moderated.content,
      link: moderated.link,
      mediaAttachments: moderated.attachments,
      hashtags: selectedHashtags,
      visibility: audience === 'public' ? 'public' : audience === 'mentors' ? 'mentors' : 'connections',
      shareToDigest,
      scheduleMode,
      scheduledFor: scheduledTimestamp,
      promptId: selectedPromptId,
      composerPersona: personaKey,
    };

    if (!payload.scheduledFor) {
      delete payload.scheduledFor;
    }

    setSubmitting(true);
    setError(null);
    try {
      await Promise.resolve(onCreate(payload));
      handleClearDraft();
    } catch (composerError) {
      if (composerError instanceof ContentModerationError) {
        setError({ message: composerError.message, reasons: composerError.reasons });
      } else {
        const message =
          composerError?.message || 'We could not publish your update. Please try again in a moment.';
        setError({ message });
      }
    } finally {
      setSubmitting(false);
      setShowEmojiTray(false);
      setShowGifTray(false);
    }
  };

  const activeAudience =
    COMPOSER_AUDIENCE_OPTIONS.find((option) => option.id === audience) ?? COMPOSER_AUDIENCE_OPTIONS[0];
  const publishLabel = scheduleMode === 'schedule' ? 'Schedule update' : 'Publish to timeline';
  const personaInsight =
    personaPrompts.find((prompt) => prompt.id === selectedPromptId) ?? personaPrompts[0] ?? null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <UserAvatar name={session?.name} seed={session?.avatarSeed ?? session?.name} size="md" />
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-800">
                {personaInsight ? personaInsight.headline : 'Share with your network'}
              </p>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
                {activeAudience.label}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {personaInsight
                ? personaInsight.body
                : 'Celebrate a win, spotlight an opportunity, or invite the community to collaborate.'}
            </div>
            <div className="relative">
              <label htmlFor={textareaId} className="sr-only">
                Compose timeline update
              </label>
              <textarea
                id={textareaId}
                value={content}
                onChange={(event) => {
                  setContent(event.target.value.slice(0, MAX_CONTENT_LENGTH));
                  setError(null);
                }}
                rows={5}
                maxLength={MAX_CONTENT_LENGTH}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-base text-slate-900 shadow-inner transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20"
                placeholder={`Share an update about ${selectedOption.label.toLowerCase()}…`}
                disabled={submitting}
              />
              <div className="pointer-events-none absolute bottom-3 right-4 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
                {remainingCharacters}
              </div>
            </div>
            <p className="text-xs text-slate-500">{selectedOption.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-y border-slate-200 py-4">
          {COMPOSER_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = option.id === mode;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  if (!submitting) {
                    setMode(option.id);
                  }
                }}
                disabled={submitting}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-accent text-white shadow-soft'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </button>
            );
          })}
        </div>
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
            <div className="space-y-2">
              <label htmlFor={linkInputId} className="text-xs font-medium text-slate-600">
                Attach a resource (deck, doc, or listing URL)
              </label>
              <input
                id={linkInputId}
                value={link}
                onChange={(event) => {
                  setLink(event.target.value);
                  setError(null);
                }}
                placeholder="https://"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                disabled={submitting}
              />
            </div>
            <div className="space-y-2 text-xs text-slate-500">
              <p className="font-medium text-slate-600">Need inspiration?</p>
              <p>
                Opportunity posts automatically appear inside Explorer with the right filters so talent can discover them alongside
                jobs, gigs, projects, volunteering missions, and Launchpad cohorts.
              </p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tailored prompts</p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {personaPrompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    type="button"
                    onClick={() => handlePromptInsert(prompt)}
                    className={`flex h-full flex-col justify-between rounded-2xl border px-4 py-3 text-left transition ${
                      selectedPromptId === prompt.id
                        ? 'border-accent bg-accent/5 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-accent/40 hover:shadow-sm'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{prompt.headline}</p>
                      <p className="mt-2 text-xs text-slate-500 line-clamp-3">{prompt.body}</p>
                    </div>
                    <span className="mt-3 inline-flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-wide text-accent">
                      <SparklesIcon className="h-3.5 w-3.5" />
                      Insert prompt
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Suggested hashtags</p>
              <div className="flex flex-wrap gap-2">
                {COMPOSER_SUGGESTED_HASHTAGS.map((tag) => {
                  const isActive = selectedHashtags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleHashtag(tag)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.7rem] font-semibold transition ${
                        isActive
                          ? 'border-accent bg-accent text-white shadow-sm'
                          : 'border-slate-200 bg-slate-100 text-slate-600 hover:border-accent/40 hover:text-accent'
                      }`}
                    >
                      <HashtagIcon className="h-3.5 w-3.5" />
                      {tag.replace('#', '')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Audience</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {COMPOSER_AUDIENCE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = option.id === audience;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setAudience(option.id);
                        setError(null);
                      }}
                      className={`flex h-full flex-col items-start gap-2 rounded-2xl border px-4 py-3 text-left transition ${
                        isActive
                          ? 'border-accent bg-accent/5 text-accent shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-accent/40 hover:shadow-sm'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs font-semibold text-slate-800">{option.label}</span>
                      <span className="text-[0.7rem] text-slate-500">{option.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Delivery</p>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-inner">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleMode('now');
                      setError(null);
                    }}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide transition ${
                      scheduleMode === 'now'
                        ? 'bg-accent text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    <ClockIcon className="h-3.5 w-3.5" />
                    Share now
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleMode('schedule');
                      setError(null);
                    }}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide transition ${
                      scheduleMode === 'schedule'
                        ? 'bg-accent text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    <CalendarDaysIcon className="h-3.5 w-3.5" />
                    Schedule
                  </button>
                </div>
                {scheduleMode === 'schedule' ? (
                  <div className="mt-3 space-y-2">
                    <label htmlFor={scheduleInputId} className="text-xs font-medium text-slate-600">
                      Pick a time (local timezone)
                    </label>
                    <input
                      id={scheduleInputId}
                      type="datetime-local"
                      min={new Date().toISOString().slice(0, 16)}
                      value={scheduledFor}
                      onChange={(event) => {
                        setScheduledFor(event.target.value);
                        setError(null);
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => setShareToDigest((previous) => !previous)}
                  className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide transition ${
                    shareToDigest ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                  Include in weekly digest
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowGifTray(false);
                  setShowEmojiTray((previous) => !previous);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-transparent bg-slate-100 px-3 py-2 font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <FaceSmileIcon className="h-4 w-4" />
                Emoji
              </button>
              <EmojiQuickPickerPopover
                open={showEmojiTray}
                onClose={() => setShowEmojiTray(false)}
                onSelect={(emoji) => setContent((previous) => `${previous}${emoji}`)}
                labelledBy="composer-emoji-trigger"
              />
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowEmojiTray(false);
                  setShowGifTray((previous) => !previous);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-transparent bg-slate-100 px-3 py-2 font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <PhotoIcon className="h-4 w-4" />
                GIF & media
              </button>
              <GifSuggestionPopover
                open={showGifTray}
                onClose={() => setShowGifTray(false)}
                onSelect={(gif) => {
                  setAttachment({ id: gif.id, type: 'gif', url: gif.url, alt: gif.tone });
                  setAttachmentAlt(gif.tone);
                  setError(null);
                }}
                labelledBy="composer-gif-trigger"
              />
            </div>
          </div>
          {attachment ? (
            <div className="space-y-2">
              <label htmlFor={mediaAltId} className="text-xs font-medium text-slate-600">
                Media alt text
              </label>
              <input
                id={mediaAltId}
                value={attachmentAlt}
                onChange={(event) => setAttachmentAlt(event.target.value)}
                maxLength={120}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-inner focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="Describe the media for improved accessibility"
              />
              <MediaAttachmentPreview
                attachment={{ ...attachment, alt: attachmentAlt }}
                onRemove={() => {
                  setAttachment(null);
                  setAttachmentAlt('');
                }}
              />
            </div>
          ) : null}
          {error ? (
            <div
              className="space-y-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-inner"
              role="alert"
            >
              <p className="font-semibold">{error.message}</p>
              {Array.isArray(error.reasons) && error.reasons.length ? (
                <ul className="list-disc space-y-1 pl-5 text-xs text-rose-600">
                  {error.reasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
            <span>
              {draftStatus === 'saving'
                ? 'Saving draft…'
                : draftStatus === 'error'
                ? 'Draft not saved'
                : lastSavedAt
                ? `Saved ${formatRelativeTime(lastSavedAt)}`
                : 'Autosave ready'}
            </span>
            <button
              type="button"
              onClick={handleClearDraft}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500 transition hover:border-rose-200 hover:text-rose-500"
            >
              Clear draft
            </button>
          </div>
          <button
            type="submit"
            disabled={publishDisabled}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white shadow-soft transition ${
              publishDisabled ? 'cursor-not-allowed bg-accent/50' : 'bg-accent hover:bg-accentDark'
            }`}
          >
            {submitting ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <ShareIcon className="h-4 w-4" />}
            {submitting ? (scheduleMode === 'schedule' ? 'Scheduling…' : 'Publishing…') : publishLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
function ActivityFilters({
  filters,
  onChange,
  onReset,
  savedViews,
  onSaveView,
  onSelectSavedView,
  onDeleteSavedView,
  suggestedTopics = [],
  trendingHashtags = [],
}) {
  const [savingView, setSavingView] = useState(false);
  const [viewName, setViewName] = useState('');
  const quickViewIconMap = {
    all: SparklesIcon,
    opportunities: BookmarkIcon,
    wins: FireIcon,
    knowledge: LightBulbIcon,
  };
  const selectedTags = Array.isArray(filters.tags) ? filters.tags : [];
  const selectedView = savedViews.find((view) => view.id === filters.savedViewId) ?? null;

  const handleTagToggle = (tag) => {
    const cleaned = tag.startsWith('#') ? tag : `#${tag}`;
    const exists = selectedTags.some((entry) => entry.toLowerCase() === cleaned.toLowerCase());
    const nextTags = exists
      ? selectedTags.filter((entry) => entry.toLowerCase() !== cleaned.toLowerCase())
      : [...selectedTags, cleaned];
    onChange({ tags: nextTags, savedViewId: null });
  };

  const handleSaveView = (event) => {
    event.preventDefault();
    onSaveView(viewName.trim());
    setViewName('');
    setSavingView(false);
  };

  const activeToggleClasses = (active) =>
    `inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide transition ${
      active ? 'bg-accent text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
    }`;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Curate your timeline</h2>
          <p className="mt-1 text-xs text-slate-500">
            Fine-tune the feed with quick presets, persona filters, and saved views tailored to your goals.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-rose-200 hover:text-rose-500"
        >
          <AdjustmentsHorizontalIcon className="h-4 w-4" />
          Reset filters
        </button>
      </div>

      <div className="mt-6 space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Quick views</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {ACTIVITY_QUICK_VIEWS.map((view) => {
              const Icon = quickViewIconMap[view.id] ?? AdjustmentsHorizontalIcon;
              const isActive = filters.view === view.id;
              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => onChange({ view: view.id, savedViewId: null })}
                  className={`flex h-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                    isActive
                      ? 'border-accent bg-accent/5 text-accent shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-accent/40 hover:shadow-sm'
                  }`}
                >
                  <Icon className="mt-1 h-4 w-4" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{view.label}</p>
                    <p className="mt-1 text-[0.7rem] text-slate-500">{view.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="timeline-search">
              Search timeline
            </label>
            <div className="relative">
              <input
                id="timeline-search"
                value={filters.search ?? ''}
                onChange={(event) => onChange({ search: event.target.value, savedViewId: null })}
                placeholder="Search updates, people, or tags"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20"
              />
            </div>
            {trendingHashtags.length ? (
              <div className="flex flex-wrap gap-2">
                {trendingHashtags.map((tag) => {
                  const isActive = selectedTags.some((entry) => entry.toLowerCase() === tag.toLowerCase());
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide transition ${
                        isActive
                          ? 'border-accent bg-accent text-white shadow-sm'
                          : 'border-slate-200 bg-slate-100 text-slate-600 hover:border-accent/40 hover:text-accent'
                      }`}
                    >
                      <HashtagIcon className="h-3.5 w-3.5" />
                      {tag.replace('#', '')}
                    </button>
                  );
                })}
              </div>
            ) : null}
            {suggestedTopics.length ? (
              <div className="flex flex-wrap gap-2 text-[0.65rem] text-slate-500">
                {suggestedTopics.map((topic) => {
                  const label = topic.replace(/_/g, ' ');
                  const tag = topic.startsWith('#') ? topic : `#${topic}`;
                  const isActive = selectedTags.some((entry) => entry.toLowerCase() === tag.toLowerCase());
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`rounded-full border px-3 py-1 font-semibold uppercase tracking-wide transition ${
                        isActive
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-slate-200 bg-white hover:border-accent/40 hover:text-accent'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Saved views</p>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filters.savedViewId ?? ''}
                onChange={(event) => onSelectSavedView(event.target.value || null)}
                className="w-full max-w-[220px] rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                <option value="">Active filters</option>
                {savedViews.map((view) => (
                  <option key={view.id} value={view.id}>
                    {view.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  if (savingView) {
                    setSavingView(false);
                    setViewName('');
                    return;
                  }
                  setSavingView(true);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500 transition hover:border-accent/40 hover:text-accent"
              >
                {savingView ? 'Cancel' : 'Save current'}
              </button>
              {filters.savedViewId ? (
                <button
                  type="button"
                  onClick={() => onDeleteSavedView(filters.savedViewId)}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-wide text-rose-600 transition hover:bg-rose-50"
                >
                  Remove view
                </button>
              ) : null}
            </div>
            {savingView ? (
              <form onSubmit={handleSaveView} className="flex flex-wrap items-center gap-2 text-sm">
                <input
                  value={viewName}
                  onChange={(event) => setViewName(event.target.value)}
                  placeholder="Name this view"
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-soft transition hover:bg-accentDark"
                >
                  Save view
                </button>
              </form>
            ) : null}
            {selectedView ? (
              <p className="text-xs text-slate-500">
                Viewing saved filter: <span className="font-semibold text-slate-700">{selectedView.name}</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Persona focus</p>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_PERSONA_OPTIONS.map((option) => {
                const isActive = filters.persona === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onChange({ persona: option.id, savedViewId: null })}
                    className={activeToggleClasses(isActive)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Highlights</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onChange({ withMedia: !filters.withMedia, savedViewId: null })}
                className={activeToggleClasses(filters.withMedia)}
              >
                Media
              </button>
              <button
                type="button"
                onClick={() => onChange({ withPolls: !filters.withPolls, savedViewId: null })}
                className={activeToggleClasses(filters.withPolls)}
              >
                Polls
              </button>
              <button
                type="button"
                onClick={() => onChange({ followingOnly: !filters.followingOnly, savedViewId: null })}
                className={activeToggleClasses(filters.followingOnly)}
              >
                Connections
              </button>
              <button
                type="button"
                onClick={() => onChange({ trendingOnly: !filters.trendingOnly, savedViewId: null })}
                className={activeToggleClasses(filters.trendingOnly)}
              >
                Trending
              </button>
              <button
                type="button"
                onClick={() => onChange({ digestEligibleOnly: !filters.digestEligibleOnly, savedViewId: null })}
                className={activeToggleClasses(filters.digestEligibleOnly)}
              >
                Digest ready
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sort order</p>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_SORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onChange({ sort: option.id, savedViewId: null })}
                  className={activeToggleClasses(filters.sort === option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Time range</p>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_TIME_RANGES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onChange({ timeRange: option.id, savedViewId: null })}
                  className={activeToggleClasses(filters.timeRange === option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


function FeedCommentThread({ comment, onReply }) {
  const [replying, setReplying] = useState(false);
  const [replyDraft, setReplyDraft] = useState('');
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const replyTextareaId = useId();

  const totalReplies = Array.isArray(comment.replies) ? comment.replies.length : 0;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!replyDraft.trim()) {
      return;
    }
    onReply?.(comment.id, replyDraft.trim());
    setReplyDraft('');
    setShowEmojiTray(false);
    setReplying(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 text-sm text-slate-700">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <span className="font-semibold text-slate-700">{comment.author}</span>
        <span>{formatRelativeTime(comment.createdAt)}</span>
      </div>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{comment.headline}</p>
      <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{comment.message}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <button
          type="button"
          onClick={() => {
            setReplying(true);
          }}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 transition hover:border-accent/60 hover:text-accent"
        >
          <ChatBubbleOvalLeftIcon className="h-4 w-4" /> Reply
        </button>
        {totalReplies ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
            {totalReplies} {totalReplies === 1 ? 'reply' : 'replies'}
          </span>
        ) : null}
      </div>
      {Array.isArray(comment.replies) && comment.replies.length ? (
        <div className="mt-3 space-y-2 border-l-2 border-accent/30 pl-4">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="rounded-2xl bg-white/90 p-3 text-sm text-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                <span className="font-semibold text-slate-700">{reply.author}</span>
                <span>{formatRelativeTime(reply.createdAt)}</span>
              </div>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{reply.headline}</p>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{reply.message}</p>
            </div>
          ))}
        </div>
      ) : null}
      {replying ? (
        <form onSubmit={handleSubmit} className="relative mt-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-soft">
          <label htmlFor={replyTextareaId} className="sr-only">
            Reply to comment
          </label>
          <textarea
            id={replyTextareaId}
            value={replyDraft}
            onChange={(event) => setReplyDraft(event.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder="Compose a thoughtful reply…"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiTray((previous) => !previous)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
              >
                <FaceSmileIcon className="h-4 w-4" />
                Emoji
              </button>
              <EmojiQuickPickerPopover
                open={showEmojiTray}
                onClose={() => setShowEmojiTray(false)}
                onSelect={(emoji) => setReplyDraft((previous) => `${previous}${emoji}`)}
                labelledBy="comment-emoji-trigger"
              />
            </div>
            <div className="flex items-center gap-2">
              {QUICK_REPLY_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setReplying(true);
                    setReplyDraft((previous) => (previous ? `${previous}\n${suggestion}` : suggestion));
                  }}
                  className="hidden rounded-full border border-slate-200 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500 transition hover:border-accent/60 hover:text-accent lg:inline-flex"
                >
                  {suggestion.slice(0, 14)}…
                </button>
              ))}
              <button
                type="submit"
                disabled={!replyDraft.trim()}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold text-white transition ${
                  replyDraft.trim() ? 'bg-accent hover:bg-accentDark' : 'cursor-not-allowed bg-accent/40'
                }`}
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                Reply
              </button>
            </div>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function MediaAttachmentGrid({ attachments }) {
  if (!attachments?.length) {
    return null;
  }
  const columns = attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2';
  return (
    <div className={`grid gap-4 ${columns}`}>
      {attachments.map((attachment) => (
        <figure
          key={attachment.id}
          className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-inner"
        >
          <img
            src={attachment.url}
            alt={attachment.alt || 'Feed media attachment'}
            className="h-64 w-full object-cover"
            loading="lazy"
          />
          {attachment.alt ? (
            <figcaption className="border-t border-slate-200 px-4 py-2 text-xs text-slate-500">
              {attachment.alt}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
}

function FeedLoadingSkeletons({ count = 2 }) {
  return (
    <div className="space-y-4" role="status" aria-live="polite" aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={`loading-${index}`}
          className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="h-3 w-32 rounded bg-slate-200" />
            <span className="h-3 w-16 rounded bg-slate-200" />
          </div>
          <div className="mt-4 h-4 w-48 rounded bg-slate-200" />
          <div className="mt-3 space-y-2">
            <div className="h-3 rounded bg-slate-200" />
            <div className="h-3 w-3/4 rounded bg-slate-200" />
            <div className="h-3 w-2/3 rounded bg-slate-200" />
          </div>
        </article>
      ))}
    </div>
  );
}

function VirtualFeedChunk({
  chunk,
  chunkIndex,
  renderPost,
  estimatedHeight,
  onHeightChange,
  forceVisible = false,
}) {
  const wrapperRef = useRef(null);
  const [inView, setInView] = useState(forceVisible);
  const lastReportedHeightRef = useRef(estimatedHeight ?? DEFAULT_CHUNK_ESTIMATE);

  useEffect(() => {
    if (forceVisible) {
      setInView(true);
      return undefined;
    }
    if (typeof window === 'undefined') {
      setInView(true);
      return undefined;
    }
    const element = wrapperRef.current;
    if (!element) {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === element) {
            setInView(entry.isIntersecting);
          }
        });
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [forceVisible]);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) {
      return undefined;
    }
    if (!inView && !forceVisible) {
      if (estimatedHeight && lastReportedHeightRef.current !== estimatedHeight) {
        lastReportedHeightRef.current = estimatedHeight;
      }
      onHeightChange(chunkIndex, estimatedHeight ?? chunk.length * DEFAULT_CHUNK_ESTIMATE);
      return undefined;
    }

    const reportHeight = () => {
      if (!element) {
        return;
      }
      const height = element.offsetHeight || estimatedHeight || chunk.length * DEFAULT_CHUNK_ESTIMATE;
      if (!Number.isFinite(height)) {
        return;
      }
      if (Math.abs((lastReportedHeightRef.current ?? 0) - height) > 4) {
        lastReportedHeightRef.current = height;
        onHeightChange(chunkIndex, height);
      }
    };

    reportHeight();

    if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(reportHeight);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [chunk.length, chunkIndex, estimatedHeight, forceVisible, inView, onHeightChange]);

  const shouldRender = forceVisible || inView;
  const placeholderHeight = estimatedHeight ?? chunk.length * DEFAULT_CHUNK_ESTIMATE;

  return (
    <div
      ref={wrapperRef}
      className={
        shouldRender
          ? 'space-y-6'
          : 'rounded-xl border border-accent/40 bg-accentSoft px-6 py-8 text-accent shadow-inner transition'
      }
      style={shouldRender ? undefined : { minHeight: placeholderHeight }}
      data-chunk-index={chunkIndex}
      aria-busy={!shouldRender}
    >
      {shouldRender ? (
        chunk.map((post) => renderPost(post))
      ) : (
        <div className="flex h-full min-h-[inherit] items-center justify-center text-[0.65rem] font-semibold uppercase tracking-wide">
          Stay close—fresh updates unlock as you scroll
        </div>
      )}
    </div>
  );
}

function FeedPostCard({
  post,
  onShare,
  canManage = false,
  viewer,
  onEditStart,
  onEditCancel,
  onDelete,
  isEditing = false,
  editDraft = DEFAULT_EDIT_DRAFT,
  onEditDraftChange,
  onEditSubmit,
  editSaving = false,
  editError = null,
  deleteLoading = false,
  onReactionChange,
}) {
  const author = resolveAuthor(post);
  const postType = resolvePostType(post);
  const isNewsPost = postType.key === 'news';
  const heading = isNewsPost ? post.title || post.summary || post.content || author.name : author.name;
  const bodyText = isNewsPost ? post.summary || post.content || '' : post.content || '';
  const linkLabel = isNewsPost ? 'Read full story' : 'View attached resource';
  const publishedTimestamp = post.publishedAt || post.createdAt;
  const viewerName = viewer?.name ?? 'You';
  const viewerHeadline = viewer?.title ?? viewer?.headline ?? 'Shared via Gigvora';
  const viewerAvatarSeed = viewer?.avatarSeed ?? viewer?.name ?? viewerName;
  const computedReactionSummary = useMemo(
    () => normaliseReactionSummary(post.reactionSummary ?? post.reactions ?? {}),
    [post.reactionSummary, post.reactions],
  );
  const [reactionSummary, setReactionSummary] = useState(computedReactionSummary);
  useEffect(() => {
    setReactionSummary(computedReactionSummary);
  }, [computedReactionSummary]);

  const [activeReaction, setActiveReaction] = useState(
    () => post.viewerReaction ?? (post.viewerHasLiked ? 'like' : null),
  );
  useEffect(() => {
    setActiveReaction(post.viewerReaction ?? (post.viewerHasLiked ? 'like' : null));
  }, [post.viewerHasLiked, post.viewerReaction]);

  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const reactionPickerRef = useRef(null);
  const [comments, setComments] = useState(() => normaliseCommentList(post?.comments ?? [], post));
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');

  useEffect(() => {
    if (!reactionPickerOpen) {
      return undefined;
    }
    const handlePointerDown = (event) => {
      if (!reactionPickerRef.current) {
        return;
      }
      if (!reactionPickerRef.current.contains(event.target)) {
        setReactionPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [reactionPickerOpen]);

  const totalReactions = useMemo(() => {
    if (!reactionSummary) {
      return 0;
    }
    return Object.values(reactionSummary).reduce((total, value) => {
      const numeric = Number(value);
      return total + (Number.isFinite(numeric) ? numeric : 0);
    }, 0);
  }, [reactionSummary]);

  const topReactions = useMemo(() => {
    if (!reactionSummary) {
      return [];
    }
    return Object.entries(reactionSummary)
      .filter(([, count]) => Number(count) > 0)
      .map(([id, count]) => ({ id, count: Number(count), option: REACTION_LOOKUP[id] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [reactionSummary]);

  const activeReactionOption = activeReaction ? REACTION_LOOKUP[activeReaction] : null;
  const reactionButtonLabel = activeReactionOption?.activeLabel ?? 'React';
  const reactionButtonClasses = activeReactionOption
    ? activeReactionOption.activeClasses
    : 'border-slate-200 hover:border-accent/60 hover:text-accent';
  const ReactionIcon = activeReactionOption?.Icon ?? HandThumbUpIcon;
  const reactionMenuId = useMemo(() => `reaction-menu-${post.id}`, [post.id]);

  useEffect(() => {
    setComments(normaliseCommentList(post?.comments ?? [], post));
  }, [post?.comments, post?.id]);

  useEffect(() => {
    if (!post?.id) {
      setComments([]);
      return undefined;
    }
    let ignore = false;
    const controller = new AbortController();

    const loadComments = async () => {
      setCommentsLoading(true);
      try {
        const response = await listFeedComments(post.id, { signal: controller.signal });
        if (ignore) {
          return;
        }
        const fetched = normaliseCommentsFromResponse(response, post);
        if (fetched.length) {
          setComments(fetched);
        }
        setCommentsError(null);
      } catch (error) {
        if (ignore || controller.signal.aborted) {
          return;
        }
        setCommentsError(error);
      } finally {
        if (!ignore) {
          setCommentsLoading(false);
        }
      }
    };

    loadComments();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [post?.id]);

  const totalConversationCount = useMemo(
    () =>
      comments.reduce(
        (total, comment) => total + 1 + (Array.isArray(comment.replies) ? comment.replies.length : 0),
        0,
      ),
    [comments],
  );

  const handleReactionSelect = useCallback(
    (reactionId) => {
      setActiveReaction((previous) => {
        const willActivate = previous !== reactionId;
        setReactionSummary((current) => {
          const updated = { ...(current ?? {}) };
          if (previous && typeof updated[previous] === 'number') {
            updated[previous] = Math.max(0, updated[previous] - 1);
          }
          if (willActivate) {
            updated[reactionId] = (updated[reactionId] ?? 0) + 1;
          }
          return updated;
        });
        analytics.track(
          'web_feed_reaction_click',
          { postId: post.id, reaction: reactionId, active: willActivate },
          { source: 'web_app' },
        );
        if (typeof onReactionChange === 'function') {
          onReactionChange(post, { next: willActivate ? reactionId : null, previous });
        }
        return willActivate ? reactionId : null;
      });
      setReactionPickerOpen(false);
    },
    [onReactionChange, post],
  );

  const handleReactionButtonClick = useCallback(() => {
    handleReactionSelect(activeReaction ?? 'like');
  }, [activeReaction, handleReactionSelect]);

  const reactionSummaryLabel = useMemo(() => {
    if (!totalReactions) {
      return null;
    }
    return `${totalReactions} ${totalReactions === 1 ? 'appreciation' : 'appreciations'}`;
  }, [totalReactions]);

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    const trimmed = commentDraft.trim();
    if (!trimmed) {
      return;
    }
    const optimisticId = `${post.id ?? 'feed-post'}-draft-${Date.now()}`;
    const optimisticComment = {
      id: optimisticId,
      author: viewerName,
      headline: viewerHeadline,
      message: trimmed,
      createdAt: new Date().toISOString(),
      replies: [],
    };
    setComments((previous) => [optimisticComment, ...previous]);
    setCommentDraft('');
    setCommentsError(null);
    analytics.track('web_feed_comment_submit', { postId: post.id }, { source: 'web_app' });

    try {
      const response = await createFeedComment(post.id, { message: trimmed });
      const persisted = normaliseSingleComment(response, post, {
        name: viewerName,
        headline: viewerHeadline,
      });
      if (persisted) {
        setComments((previous) => {
          const replaced = previous.map((existing) => (existing.id === optimisticId ? persisted : existing));
          if (!replaced.some((comment) => comment.id === persisted.id)) {
            return [persisted, ...replaced.filter((comment) => comment.id !== optimisticId)];
          }
          return replaced;
        });
      }
    } catch (error) {
      setComments((previous) => previous.filter((existing) => existing.id !== optimisticId));
      setCommentsError(error);
    }
  };

  const handleAddReply = async (commentId, replyMessage) => {
    const trimmed = (replyMessage ?? '').trim();
    if (!trimmed) {
      return;
    }
    const replyId = `${commentId}-reply-${Date.now()}`;
    const optimisticReply = {
      id: replyId,
      author: viewerName,
      headline: viewerHeadline,
      message: trimmed,
      createdAt: new Date().toISOString(),
    };

    setComments((previous) =>
      previous.map((existing) => {
        if (existing.id !== commentId) {
          return existing;
        }
        return {
          ...existing,
          replies: [optimisticReply, ...(existing.replies ?? [])],
        };
      }),
    );
    setCommentsError(null);
    analytics.track('web_feed_reply_submit', { postId: post.id, commentId }, { source: 'web_app' });

    try {
      const response = await createFeedReply(post.id, commentId, { message: trimmed });
      const persisted = normaliseSingleComment(
        response,
        post,
        {
          name: viewerName,
          headline: viewerHeadline,
        },
        { prefix: `${commentId}-reply` },
      );
      if (persisted) {
        setComments((previous) =>
          previous.map((existing) => {
            if (existing.id !== commentId) {
              return existing;
            }
            const updatedReplies = (existing.replies ?? []).map((reply) =>
              reply.id === replyId ? { ...persisted, id: persisted.id ?? replyId } : reply,
            );
            const hasPersisted = updatedReplies.some((reply) => reply.id === persisted.id);
            return {
              ...existing,
              replies: hasPersisted ? updatedReplies : [persisted, ...updatedReplies.filter((reply) => reply.id !== replyId)],
            };
          }),
        );
      }
    } catch (error) {
      setComments((previous) =>
        previous.map((existing) => {
          if (existing.id !== commentId) {
            return existing;
          }
          return {
            ...existing,
            replies: (existing.replies ?? []).filter((reply) => reply.id !== replyId),
          };
        }),
      );
      setCommentsError(error);
    }
  };

  return (
    <article className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3 text-xs text-slate-400">
        <span className="inline-flex items-center gap-2">
          <UserAvatar name={author.name} seed={author.avatarSeed} size="xs" showGlow={false} />
          <span>{author.headline}</span>
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span>{formatRelativeTime(publishedTimestamp)}</span>
          {canManage ? (
            isEditing ? (
              <button
                type="button"
                onClick={() => onEditCancel?.(post)}
                className="rounded-full border border-slate-200 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500 transition hover:border-rose-200 hover:text-rose-500"
                disabled={editSaving}
              >
                Cancel edit
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onEditStart?.(post)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500 transition hover:border-accent hover:text-accent"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete?.(post)}
                  className={`rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide transition ${
                    deleteLoading
                      ? 'border-rose-200 bg-rose-100 text-rose-500'
                      : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                  }`}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Removing…' : 'Delete'}
                </button>
              </>
            )
          ) : null}
        </div>
      </div>
      {isEditing ? (
        <form onSubmit={(event) => onEditSubmit?.(event, post)} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Title</span>
              <input
                type="text"
                value={editDraft?.title ?? ''}
                onChange={(event) => onEditDraftChange?.('title', event.target.value)}
                placeholder="Optional headline"
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:ring-2 focus:ring-accent/20"
                disabled={editSaving}
              />
            </label>
            <label className="block text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Type</span>
              <select
                value={editDraft?.type ?? 'update'}
                onChange={(event) => onEditDraftChange?.('type', event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20"
                disabled={editSaving}
              >
                {COMPOSER_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">External link</span>
            <input
              type="url"
              value={editDraft?.link ?? ''}
              onChange={(event) => onEditDraftChange?.('link', event.target.value)}
              placeholder="https://example.com/resource"
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:ring-2 focus:ring-accent/20"
              disabled={editSaving}
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Content</span>
            <textarea
              value={editDraft?.content ?? ''}
              onChange={(event) => onEditDraftChange?.('content', event.target.value)}
              rows={6}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 shadow-inner focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="Share the full context for this update…"
              disabled={editSaving}
            />
          </label>
          {editError ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{editError}</p>
          ) : null}
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onEditCancel?.(post)}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300"
              disabled={editSaving}
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={editSaving}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition ${
                editSaving ? 'bg-accent/50' : 'bg-accent hover:bg-accentDark'
              }`}
            >
              {editSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900">{heading}</h2>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${postType.badgeClassName}`}>
              {postType.label}
            </span>
            {isNewsPost && post.source ? (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-600">
                {post.source}
              </span>
            ) : null}
          </div>
          {OPPORTUNITY_POST_TYPES.has(postType.key) ? (
            <div className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
              <SparklesIcon className="h-4 w-4" /> Opportunity spotlight — invite warm intros or referrals.
            </div>
          ) : null}
          {bodyText ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{bodyText}</p>
          ) : null}
          {isNewsPost && author.name && heading !== author.name ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{author.name}</p>
          ) : null}
          <MediaAttachmentGrid attachments={post.mediaAttachments} />
          {post.link ? (
            <a
              href={post.link}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-accent transition hover:border-accent/50 hover:bg-white"
            >
              <ArrowPathIcon className="h-4 w-4" />
              {linkLabel}
            </a>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <div ref={reactionPickerRef} className="relative inline-flex items-center">
              <button
                type="button"
                onClick={handleReactionButtonClick}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 transition ${reactionButtonClasses}`}
                aria-pressed={Boolean(activeReactionOption)}
              >
                <ReactionIcon className="h-4 w-4" />
                {reactionButtonLabel}
                {totalReactions ? (
                  <span className="ml-1 text-[0.65rem] font-semibold text-slate-400">· {totalReactions}</span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => setReactionPickerOpen((previous) => !previous)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setReactionPickerOpen((previous) => !previous);
                  }
                  if (event.key === 'Escape') {
                    setReactionPickerOpen(false);
                  }
                }}
                className={`ml-1 inline-flex items-center justify-center rounded-full border px-2 py-2 transition ${
                  reactionPickerOpen
                    ? 'border-accent text-accent'
                    : 'border-slate-200 text-slate-500 hover:border-accent/60 hover:text-accent'
                }`}
                aria-label="Open reaction palette"
                aria-haspopup="true"
                aria-controls={reactionMenuId}
                aria-expanded={reactionPickerOpen}
              >
                <ChevronDownIcon className="h-4 w-4" />
              </button>
              {reactionPickerOpen ? (
                <div
                  id={reactionMenuId}
                  className="absolute left-0 top-full z-30 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
                  role="menu"
                >
                  {REACTION_OPTIONS.map((option) => {
                    const isActive = option.id === activeReaction;
                    const optionCount = reactionSummary?.[option.id] ?? 0;
                    const OptionIcon = option.Icon;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleReactionSelect(option.id)}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                          isActive ? 'bg-slate-100 text-accent' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                        role="menuitem"
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-white ${option.dotClassName}`}
                          >
                            <OptionIcon className="h-4 w-4" />
                          </span>
                          <span className="flex flex-col items-start">
                            <span>{option.label}</span>
                            <span className="text-[0.65rem] font-medium text-slate-400">{option.description}</span>
                          </span>
                        </span>
                        <span className="text-xs font-semibold text-slate-400">{optionCount}</span>
                      </button>
                    );
                  })}
                  <p className="px-3 pt-2 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
                    Tailor your response for the community.
                  </p>
                </div>
              ) : null}
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-slate-500">
              <ChatBubbleOvalLeftIcon className="h-4 w-4" /> {totalConversationCount}{' '}
              {totalConversationCount === 1 ? 'comment' : 'conversations'}
            </span>
            <button
              type="button"
              onClick={() => {
                analytics.track('web_feed_share_click', { postId: post.id, location: 'feed_item' }, { source: 'web_app' });
                if (typeof onShare === 'function') {
                  onShare(post);
                }
              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 transition hover:border-accent hover:text-accent"
            >
              <ShareIcon className="h-4 w-4" /> Share externally
            </button>
          </div>
          {reactionSummaryLabel ? (
            <div
              className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.7rem] font-semibold text-slate-600"
              aria-live="polite"
            >
              <div className="flex -space-x-1">
                {topReactions.map(({ id, option }) => {
                  const OptionIcon = option?.Icon ?? ReactionIcon;
                  const toneClass = option?.dotClassName ?? 'bg-slate-400';
                  return (
                    <span
                      key={id}
                      className={`flex h-5 w-5 items-center justify-center rounded-full border border-white text-white ${toneClass}`}
                      aria-hidden="true"
                    >
                      <OptionIcon className="h-3 w-3" />
                    </span>
                  );
                })}
              </div>
              <span>{reactionSummaryLabel}</span>
            </div>
          ) : null}
          <form onSubmit={handleCommentSubmit} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <label htmlFor={`comment-${post.id}`} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Join the conversation
            </label>
            <div className="mt-2 flex gap-3">
              <UserAvatar name={viewerName} seed={viewerAvatarSeed} size="sm" showGlow={false} />
              <textarea
                id={`comment-${post.id}`}
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="Offer context, signal interest, or tag a collaborator…"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-wide text-slate-400">
                {QUICK_REPLY_SUGGESTIONS.slice(0, 2).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setCommentDraft((previous) => (previous ? `${previous}\n${suggestion}` : suggestion))}
                    className="rounded-full border border-slate-200 px-3 py-1 font-semibold transition hover:border-accent/60 hover:text-accent"
                  >
                    {suggestion.slice(0, 22)}…
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={!commentDraft.trim()}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white transition ${
                  commentDraft.trim() ? 'bg-accent hover:bg-accentDark' : 'cursor-not-allowed bg-accent/40'
                }`}
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                Comment
              </button>
            </div>
          </form>
          {commentsError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
              {commentsError?.message || 'We could not load the latest conversation. Please try again soon.'}
            </div>
          ) : null}
          {commentsLoading ? (
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-white/80 p-4 text-xs text-slate-500">
              <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
            </div>
          ) : null}
          <div className="space-y-3">
            {comments.map((comment) => (
              <FeedCommentThread key={comment.id} comment={comment} onReply={handleAddReply} />
            ))}
            {!commentsLoading && !comments.length ? (
              <p className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-xs text-slate-500">
                Spark the conversation with the first reply.
              </p>
            ) : null}
          </div>
        </>
      )}
    </article>
  );
}

function FeedIdentityRail({ session, interests = [] }) {
  const followerTotal = session?.followers ?? '—';
  const connectionTotal = session?.connections ?? '—';

  return (
    <aside className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <UserAvatar name={session?.name ?? 'Member'} seed={session?.avatarSeed ?? session?.name} size="lg" />
          <div>
            <p className="text-lg font-semibold text-slate-900">{session?.name ?? 'Gigvora member'}</p>
            <p className="text-sm text-slate-500">{session?.title ?? 'Marketplace professional'}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Network reach</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Followers</dt>
              <dd className="mt-2 text-2xl font-semibold text-slate-900">{followerTotal}</dd>
            </div>
            <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Connections</dt>
              <dd className="mt-2 text-2xl font-semibold text-slate-900">{connectionTotal}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 space-y-5 text-sm text-slate-600">
          {Array.isArray(session?.companies) && session.companies.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Companies</p>
              <ul className="mt-3 space-y-2">
                {session.companies.map((company) => (
                  <li key={company} className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
                    {company}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {Array.isArray(session?.agencies) && session.agencies.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agencies & collectives</p>
              <ul className="mt-3 space-y-2">
                {session.agencies.map((agency) => (
                  <li key={agency} className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
                    {agency}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {Array.isArray(session?.accountTypes) && session.accountTypes.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account types</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {session.accountTypes.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center rounded-full border border-accent/40 bg-accentSoft px-3 py-1 text-[11px] font-semibold text-accent"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {interests.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Interest signals</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {interests.slice(0, 8).map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function FeedInsightsRail({
  connectionSuggestions = [],
  groupSuggestions = [],
  liveMoments = [],
  generatedAt = null,
}) {
  const hasSuggestions = connectionSuggestions.length || groupSuggestions.length;
  const hasLiveMoments = liveMoments.length > 0;

  const formatMemberCount = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return null;
    }
    return COMPACT_NUMBER_FORMATTER.format(numeric);
  };

  return (
    <aside className="space-y-6">
      {hasLiveMoments ? (
        <div className="rounded-[28px] bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-500 p-[1px] shadow-lg shadow-indigo-500/30">
          <div className="rounded-[26px] bg-white/95 p-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-slate-900">Live signals</p>
              {generatedAt ? (
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Updated {formatRelativeTime(generatedAt)}
                </span>
              ) : null}
            </div>
            <ul className="mt-4 space-y-3">
              {liveMoments.slice(0, 4).map((moment) => (
                <li
                  key={moment.id}
                  className="flex items-start gap-3 rounded-2xl bg-white/85 p-3 shadow-sm ring-1 ring-white/60 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="text-xl" aria-hidden="true">
                    {moment.icon ?? '⚡️'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{moment.title}</p>
                    {moment.preview ? (
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">{moment.preview}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-indigo-500">
                      {moment.tag ? <span>{moment.tag}</span> : null}
                      {moment.timestamp ? (
                        <span className="text-slate-400">{formatRelativeTime(moment.timestamp)}</span>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
      {connectionSuggestions.length ? (
        <div className="rounded-[28px] border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-lg shadow-slate-200/40">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Suggested connections</p>
            <Link to="/connections" className="text-xs font-semibold text-accent transition hover:text-accentDark">
              View all
            </Link>
          </div>
          <ul className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            {connectionSuggestions.slice(0, 4).map((connection) => {
              const mutualLabel = connection.mutualConnections === 1
                ? '1 mutual'
                : `${connection.mutualConnections ?? 0} mutual`;
              return (
                <li
                  key={connection.id}
                  className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:-translate-y-1 hover:border-accent/30 hover:shadow-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <span
                        className="pointer-events-none absolute -inset-1 rounded-full bg-gradient-to-br from-accent/30 via-transparent to-violet-400/40 opacity-0 blur-md transition group-hover:opacity-100"
                        aria-hidden="true"
                      />
                      <UserAvatar
                        name={connection.name}
                        seed={connection.avatarSeed ?? connection.name}
                        size="xs"
                        className="relative ring-2 ring-white"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 line-clamp-1">{connection.name}</p>
                      {connection.headline ? (
                        <p className="mt-1 text-xs text-slate-500 line-clamp-2">{connection.headline}</p>
                      ) : null}
                    </div>
                  </div>
                  {connection.reason ? (
                    <p className="mt-3 text-xs text-slate-500 line-clamp-2">{connection.reason}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {connection.location ? <span>{connection.location}</span> : null}
                    <span>{mutualLabel}</span>
                  </div>
                  <Link
                    to={`/connections?suggested=${encodeURIComponent(connection.id)}`}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent to-accentDark px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:shadow"
                  >
                    Start introduction
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {groupSuggestions.length ? (
        <div className="rounded-[28px] border border-slate-100 bg-white/95 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Groups to join</p>
            <Link to="/groups" className="text-xs font-semibold text-accent transition hover:text-accentDark">
              Explore groups
            </Link>
          </div>
          <ul className="mt-4 grid gap-4 text-sm">
            {groupSuggestions.slice(0, 4).map((group) => {
              const membersLabel = formatMemberCount(group.members);
              return (
                <li
                  key={group.id}
                  className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm transition hover:-translate-y-1 hover:border-accent/30 hover:shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900 line-clamp-1">{group.name}</p>
                    {membersLabel ? (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">
                        {membersLabel} members
                      </span>
                    ) : null}
                  </div>
                  {group.description ? (
                    <p className="mt-2 text-xs text-slate-500 line-clamp-3">{group.description}</p>
                  ) : null}
                  {group.focus?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {group.focus.slice(0, 3).map((focus) => (
                        <span
                          key={focus}
                          className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600"
                        >
                          {focus}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {group.reason ? (
                    <p className="mt-3 text-xs font-semibold text-slate-400 line-clamp-2">{group.reason}</p>
                  ) : null}
                  <Link
                    to={`/groups/${encodeURIComponent(group.id)}?ref=feed-suggestion`}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-accent hover:text-accent"
                  >
                    Request invite
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Explorer consolidation</p>
        <p className="mt-2 text-sm text-slate-600">
          Jobs, gigs, projects, Experience Launchpad cohorts, volunteer opportunities, and talent discovery now live inside the Explorer. Use filters to pivot between freelancers, companies, people, groups, headhunters, and agencies without leaving your flow.
        </p>
        <Link
          to="/search"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-accentDark"
        >
          Open Explorer
        </Link>
      </div>
      {!hasSuggestions ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">No new suggestions just yet</p>
          <p className="mt-2 text-sm">As soon as the community shifts, you’ll see fresh connections and groups to explore.</p>
        </div>
      ) : null}
    </aside>
  );
}

export default function FeedPage() {
  const analyticsTrackedRef = useRef(false);
  const navigate = useNavigate();
  const { session, isAuthenticated } = useSession();
  const filtersStorageKey = useMemo(
    () => createFilterStorageKey(session?.id ?? session?.userId ?? null),
    [session?.id, session?.userId],
  );
  const [filtersReady, setFiltersReady] = useState(false);
  const [activeFilters, setActiveFilters] = useState(DEFAULT_ACTIVITY_FILTERS);
  const [savedFilterViews, setSavedFilterViews] = useState([]);
  const [localPosts, setLocalPosts] = useState([]);
  const [remotePosts, setRemotePosts] = useState([]);
  const [remoteSuggestions, setRemoteSuggestions] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingDraft, setEditingDraft] = useState(DEFAULT_EDIT_DRAFT);
  const [editSaving, setEditSaving] = useState(false);
  const [editingError, setEditingError] = useState(null);
  const [removingPostId, setRemovingPostId] = useState(null);
  const [feedActionError, setFeedActionError] = useState(null);
  const [pagination, setPagination] = useState({ nextCursor: null, nextPage: null, hasMore: false });
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(null);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    setFiltersReady(false);
    if (typeof window === 'undefined') {
      setFiltersReady(true);
      setActiveFilters(DEFAULT_ACTIVITY_FILTERS);
      setSavedFilterViews([]);
      return;
    }
    try {
      const raw = window.localStorage.getItem(filtersStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const nextActive = {
          ...DEFAULT_ACTIVITY_FILTERS,
          ...(parsed?.active ?? parsed?.filters ?? {}),
        };
        setActiveFilters(nextActive);
        setSavedFilterViews(Array.isArray(parsed?.saved) ? parsed.saved : []);
      } else {
        setActiveFilters(DEFAULT_ACTIVITY_FILTERS);
        setSavedFilterViews([]);
      }
    } catch (error) {
      setActiveFilters(DEFAULT_ACTIVITY_FILTERS);
      setSavedFilterViews([]);
    } finally {
      setFiltersReady(true);
    }
  }, [filtersStorageKey]);

  useEffect(() => {
    if (!filtersReady || typeof window === 'undefined') {
      return;
    }
    try {
      const payload = {
        active: activeFilters,
        saved: savedFilterViews,
      };
      window.localStorage.setItem(filtersStorageKey, JSON.stringify(payload));
    } catch (error) {
      // ignore persistence failures
    }
  }, [activeFilters, filtersReady, filtersStorageKey, savedFilterViews]);

  const feedQuery = useMemo(() => buildFeedQuery(activeFilters), [activeFilters]);
  const serializedFeedQuery = useMemo(() => serializeFeedQuery(feedQuery), [feedQuery]);

  const { data, error, loading, fromCache, refresh } = useCachedResource(
    `feed:posts:v3:${serializedFeedQuery}`,
    ({ signal }) => listFeedPosts({ signal, params: feedQuery }),
    { ttl: 1000 * 60 * 2, enabled: filtersReady, dependencies: [serializedFeedQuery] },
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!data) {
      if (!loading) {
        setRemotePosts([]);
        setRemoteSuggestions(null);
        setPagination((previous) => ({ ...previous, nextCursor: null, nextPage: null, hasMore: false }));
      }
      return;
    }

    const items = Array.isArray(data.items)
      ? data.items
      : Array.isArray(data.data)
      ? data.data
      : Array.isArray(data.results)
      ? data.results
      : Array.isArray(data.feed)
      ? data.feed
      : Array.isArray(data)
      ? data
      : [];

    const normalisedFetched = items.map((post) => normaliseFeedPost(post, session)).filter(Boolean);
    setRemotePosts(normalisedFetched);
    setRemoteSuggestions(data.suggestions ?? null);
    setPagination({
      nextCursor: data.nextCursor ?? null,
      nextPage: data.nextPage ?? null,
      hasMore: Boolean(data.hasMore),
    });
    setLoadMoreError(null);
  }, [data, loading, session]);

  const allPosts = useMemo(() => {
    const merged = [...localPosts, ...remotePosts];
    const deduped = [];
    const seen = new Set();
    merged.forEach((post) => {
      if (!post) {
        return;
      }
      const identifier = post.id ?? `${post.createdAt}:${deduped.length}`;
      if (seen.has(identifier)) {
        return;
      }
      seen.add(identifier);
      deduped.push(post);
    });
    return deduped;
  }, [localPosts, remotePosts]);

  const filteredPosts = useMemo(() => {
    const base = allPosts.filter((post) => postMatchesFilters(post, activeFilters));
    return sortPostsByPreference(base, activeFilters);
  }, [activeFilters, allPosts]);

  const virtualizationEnabled = filteredPosts.length > FEED_VIRTUAL_THRESHOLD;
  const [virtualChunkSize, setVirtualChunkSize] = useState(DEFAULT_FEED_VIRTUAL_CHUNK_SIZE);

  const trendingTopics = useMemo(() => {
    const counts = new Map();
    allPosts.forEach((post) => {
      derivePostTopics(post).forEach((topic) => {
        if (!topic) {
          return;
        }
        counts.set(topic, (counts.get(topic) ?? 0) + 1);
      });
    });
    const blocked = new Set(['update', 'updates', 'post', 'posts', 'feed', 'timeline', 'news']);
    return Array.from(counts.entries())
      .filter(([, count]) => count > 0)
      .filter(([topic]) => !blocked.has(topic))
      .sort((a, b) => b[1] - a[1])
      .map(([topic]) => topic)
      .slice(0, 8);
  }, [allPosts]);

  const trendingHashtags = useMemo(
    () =>
      trendingTopics.map((topic) => {
        const cleaned = topic.startsWith('#') ? topic.slice(1) : topic;
        return `#${cleaned.replace(/_/g, '')}`;
      }),
    [trendingTopics],
  );

  const handleFiltersChange = useCallback(
    (next) => {
      setActiveFilters((previous) => ({ ...previous, ...next }));
    },
    [],
  );

  const handleResetFilters = useCallback(() => {
    setActiveFilters(DEFAULT_ACTIVITY_FILTERS);
  }, []);

  const handleSaveView = useCallback(
    (name) => {
      const trimmed = (name || '').trim();
      const viewId = `view-${Date.now()}`;
      const view = {
        id: viewId,
        name: trimmed || `Saved view ${savedFilterViews.length + 1}`,
        filters: { ...activeFilters, savedViewId: null },
      };
      setSavedFilterViews((previous) => [view, ...previous]);
      setActiveFilters((previous) => ({ ...previous, savedViewId: viewId }));
    },
    [activeFilters, savedFilterViews.length],
  );

  const handleSelectSavedView = useCallback(
    (viewId) => {
      if (!viewId) {
        setActiveFilters((previous) => ({ ...previous, savedViewId: null }));
        return;
      }
      const target = savedFilterViews.find((view) => view.id === viewId);
      if (target) {
        setActiveFilters({ ...target.filters, savedViewId: target.id });
      } else {
        setActiveFilters((previous) => ({ ...previous, savedViewId: null }));
      }
    },
    [savedFilterViews],
  );

  const handleDeleteSavedView = useCallback((viewId) => {
    if (!viewId) {
      return;
    }
    setSavedFilterViews((previous) => previous.filter((view) => view.id !== viewId));
    setActiveFilters((previous) => {
      if (previous.savedViewId === viewId) {
        return { ...previous, savedViewId: null };
      }
      return previous;
    });
  }, []);

  const feedChunks = useMemo(() => {
    if (!filteredPosts.length) {
      return [];
    }
    const chunkSize = virtualizationEnabled
      ? Math.min(
          filteredPosts.length,
          Math.max(FEED_VIRTUAL_MIN_CHUNK_SIZE, Math.min(FEED_VIRTUAL_MAX_CHUNK_SIZE, virtualChunkSize)),
        )
      : filteredPosts.length;
    const chunks = [];
    for (let index = 0; index < filteredPosts.length; index += chunkSize) {
      chunks.push({
        startIndex: index,
        posts: filteredPosts.slice(index, index + chunkSize),
      });
    }
    return chunks;
  }, [filteredPosts, virtualChunkSize, virtualizationEnabled]);

  const [chunkHeights, setChunkHeights] = useState({});

  const averageChunkHeight = useMemo(() => {
    const values = Object.values(chunkHeights).filter((value) => Number.isFinite(value) && value > 0);
    if (!values.length) {
      return DEFAULT_CHUNK_ESTIMATE;
    }
    const total = values.reduce((sum, value) => sum + value, 0);
    const average = total / values.length;
    return Math.min(720, Math.max(280, average));
  }, [chunkHeights]);

  useEffect(() => {
    if (!virtualizationEnabled) {
      setVirtualChunkSize(DEFAULT_FEED_VIRTUAL_CHUNK_SIZE);
      return undefined;
    }

    const resolveViewportHeight = () => {
      if (typeof window === 'undefined' || !Number.isFinite(window.innerHeight)) {
        return DEFAULT_VIEWPORT_HEIGHT;
      }
      return Math.max(640, window.innerHeight);
    };

    const updateChunkSize = () => {
      const viewportHeight = resolveViewportHeight();
      const estimatedHeight = Number.isFinite(averageChunkHeight)
        ? averageChunkHeight
        : DEFAULT_CHUNK_ESTIMATE;
      const proposedSize = Math.round(viewportHeight / estimatedHeight) + 1;
      const nextSize = Math.max(
        FEED_VIRTUAL_MIN_CHUNK_SIZE,
        Math.min(FEED_VIRTUAL_MAX_CHUNK_SIZE, proposedSize),
      );
      setVirtualChunkSize((previous) => (previous === nextSize ? previous : nextSize));
    };

    updateChunkSize();

    if (typeof window === 'undefined') {
      return undefined;
    }

    window.addEventListener('resize', updateChunkSize);
    return () => window.removeEventListener('resize', updateChunkSize);
  }, [averageChunkHeight, virtualizationEnabled]);

  useEffect(() => {
    if (!virtualizationEnabled) {
      setChunkHeights({});
      return;
    }
    setChunkHeights((previous) => {
      const next = {};
      feedChunks.forEach((_, index) => {
        if (previous[index]) {
          next[index] = previous[index];
        }
      });
      return next;
    });
  }, [feedChunks, virtualizationEnabled]);

  const updateChunkHeight = useCallback(
    (index, height) => {
      if (!virtualizationEnabled || !Number.isFinite(height)) {
        return;
      }
      setChunkHeights((previous) => {
        const current = previous[index];
        if (current && Math.abs(current - height) < 4) {
          return previous;
        }
        return { ...previous, [index]: height };
      });
    },
    [virtualizationEnabled],
  );

  const forcedChunkIndices = useMemo(() => {
    if (!virtualizationEnabled) {
      return new Set();
    }
    const forced = new Set([0]);
    if (editingPostId) {
      const editingIndex = feedChunks.findIndex((chunk) =>
        chunk.posts.some((post) => post.id === editingPostId),
      );
      if (editingIndex >= 0) {
        forced.add(editingIndex);
      }
    }
    return forced;
  }, [virtualizationEnabled, feedChunks, editingPostId]);

  const fetchNextPage = useCallback(async () => {
    if (loadingMore || !pagination.hasMore) {
      return;
    }
    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const params = { ...feedQuery };
      params.limit = params.limit ?? FEED_PAGE_SIZE;
      if (pagination.nextCursor) {
        params.cursor = pagination.nextCursor;
      }
      if (pagination.nextPage != null) {
        params.page = pagination.nextPage;
      }
      const response = await listFeedPosts({ params });
      const items = Array.isArray(response.items)
        ? response.items
        : Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.results)
        ? response.results
        : Array.isArray(response.feed)
        ? response.feed
        : Array.isArray(response)
        ? response
        : [];
      const normalised = items.map((post) => normaliseFeedPost(post, session)).filter(Boolean);
      setRemotePosts((previous) => {
        const combined = [...previous, ...normalised];
        const deduped = [];
        const seen = new Set();
        combined.forEach((post) => {
          if (!post) {
            return;
          }
          const identifier = post.id ?? `${post.createdAt}:${deduped.length}`;
          if (identifier && !seen.has(identifier)) {
            seen.add(identifier);
            deduped.push(post);
          }
        });
        return deduped;
      });
      if (response?.suggestions) {
        setRemoteSuggestions(response.suggestions);
      }
      setPagination({
        nextCursor: response.nextCursor ?? null,
        nextPage: response.nextPage ?? null,
        hasMore: Boolean(response.hasMore),
      });
    } catch (loadError) {
      setLoadMoreError(loadError);
    } finally {
      setLoadingMore(false);
    }
  }, [feedQuery, loadingMore, pagination.hasMore, pagination.nextCursor, pagination.nextPage, session]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !pagination.hasMore) {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            fetchNextPage();
          }
        });
      },
      { rootMargin: '200px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, pagination.hasMore]);

  const engagementSignals = useEngagementSignals({ session, feedPosts: filteredPosts, suggestions: remoteSuggestions });
  const {
    interests = [],
    connectionSuggestions = [],
    groupSuggestions = [],
    liveMoments = [],
    generatedAt: suggestionsGeneratedAt = null,
  } = engagementSignals ?? {};

  const membershipList = useMemo(() => {
    const memberships = new Set();
    if (Array.isArray(session?.memberships)) {
      session.memberships.filter(Boolean).forEach((membership) => memberships.add(membership));
    }
    if (Array.isArray(session?.accountTypes)) {
      session.accountTypes.filter(Boolean).forEach((membership) => memberships.add(membership));
    }
    if (session?.primaryMembership) {
      memberships.add(session.primaryMembership);
    }
    if (session?.primaryDashboard) {
      memberships.add(session.primaryDashboard);
    }
    if (session?.userType) {
      memberships.add(session.userType);
    }
    return Array.from(memberships);
  }, [session]);

  const sessionIdentifier = useMemo(() => session?.userId ?? session?.id ?? null, [session?.id, session?.userId]);

  const isAdminUser = useMemo(
    () => membershipList.some((membership) => `${membership}`.toLowerCase() === 'admin'),
    [membershipList],
  );

  const canManagePost = useCallback(
    (post) => {
      if (!post) {
        return false;
      }
      if (isAdminUser) {
        return true;
      }
      if (!sessionIdentifier) {
        return false;
      }
      const authorId =
        post?.User?.id ??
        post?.userId ??
        post?.authorId ??
        post?.author?.id ??
        post?.User?.userId ??
        null;
      if (authorId == null) {
        return false;
      }
      return String(authorId) === String(sessionIdentifier);
    },
    [isAdminUser, sessionIdentifier],
  );

  const hasFeedAccess = useMemo(
    () => membershipList.some((membership) => ALLOWED_FEED_MEMBERSHIPS.has(`${membership}`.toLowerCase())),
    [membershipList],
  );

  useEffect(() => {
    if (!analyticsTrackedRef.current && !loading && filteredPosts.length) {
      analytics.track('web_feed_viewed', { postCount: filteredPosts.length, cacheHit: fromCache }, { source: 'web_app' });
      analyticsTrackedRef.current = true;
    }
  }, [filteredPosts.length, filteredPosts, loading, fromCache]);

  const handleShareClick = useCallback(() => {
    analytics.track('web_feed_share_click', { location: 'feed_page' }, { source: 'web_app' });
  }, []);

  const trackOpportunityTelemetry = useCallback(
    (phase, payload) => {
      if (!payload?.type || !OPPORTUNITY_POST_TYPES.has(payload.type)) {
        return;
      }
      analytics.track(
        'web_feed_opportunity_composer',
        {
          phase,
          type: payload.type,
          hasLink: Boolean(payload.link),
          hasMedia: Array.isArray(payload.mediaAttachments) && payload.mediaAttachments.length > 0,
          viewerMembership:
            session?.primaryMembership ??
            session?.primaryDashboard ??
            session?.userType ??
            (Array.isArray(session?.memberships) && session.memberships.length ? session.memberships[0] : 'unknown'),
        },
        { source: 'web_app', userId: session?.id ?? session?.userId ?? undefined },
      );
    },
    [session],
  );

  const handleComposerCreate = useCallback(
    async (payload) => {
      if (!hasFeedAccess) {
        throw new Error('Your current workspace role cannot publish to the timeline. Switch roles to continue.');
      }

      if (!session?.id) {
        throw new Error('We could not confirm your account. Please sign in again and retry.');
      }

      const optimisticId = `local-${Date.now()}`;
      const author = {
        name: session?.name ?? 'You',
        headline: session?.title ?? 'Shared via Gigvora',
        avatarSeed: session?.avatarSeed ?? session?.name ?? 'You',
      };
      const optimisticPost = {
        id: optimisticId,
        content: payload.content,
        summary: payload.content,
        type: payload.type,
        link: payload.link,
        createdAt: new Date().toISOString(),
        authorName: author.name,
        authorHeadline: author.headline,
        reactions: { likes: 0 },
        comments: [],
        mediaAttachments: payload.mediaAttachments ?? [],
        hashtags: Array.isArray(payload.hashtags) ? payload.hashtags : [],
        visibility: payload.visibility ?? 'connections',
        scheduledFor: payload.scheduledFor ?? null,
        User: {
          firstName: session?.name,
          Profile: {
            avatarSeed: session?.avatarSeed,
            headline: session?.title,
          },
        },
      };

      setLocalPosts((previous) => [optimisticPost, ...previous]);
      analytics.track('web_feed_post_created', { type: payload.type, optimistic: true }, { source: 'web_app' });
      trackOpportunityTelemetry('submitted', payload);

      try {
        const requestPayload = {
          userId: session.id,
          content: payload.content,
          visibility: payload.visibility ?? 'public',
          type: payload.type,
          link: payload.link,
          mediaAttachments: payload.mediaAttachments,
        };
        if (Array.isArray(payload.hashtags) && payload.hashtags.length) {
          requestPayload.hashtags = payload.hashtags;
        }
        if (payload.shareToDigest) {
          requestPayload.shareToDigest = true;
        }
        if (payload.scheduledFor) {
          requestPayload.scheduledFor = payload.scheduledFor;
          requestPayload.scheduleMode = payload.scheduleMode ?? 'schedule';
        }
        const metadata = {
          promptId: payload.promptId ?? null,
          composerPersona: payload.composerPersona ?? null,
        };
        if (metadata.promptId || metadata.composerPersona) {
          requestPayload.metadata = metadata;
        }

        const response = await createFeedPost(requestPayload, {
          headers: { 'X-Feature-Surface': 'web-feed-composer' },
        });

        const normalised = normaliseFeedPost(response, session);

        if (normalised) {
          setLocalPosts((previous) =>
            previous.map((post) => {
              if (post.id !== optimisticId) {
                return post;
              }
              return {
                ...post,
                ...normalised,
                id: normalised.id ?? optimisticId,
                createdAt: normalised.createdAt ?? post.createdAt,
                mediaAttachments: normalised.mediaAttachments?.length
                  ? normalised.mediaAttachments
                  : post.mediaAttachments,
                reactions: normalised.reactions ?? post.reactions,
              };
            }),
          );
        }

        analytics.track(
          'web_feed_post_synced',
          { type: payload.type, visibility: payload.visibility ?? 'public', scheduled: Boolean(payload.scheduledFor) },
          { source: 'web_app' },
        );
        await refresh({ force: true });
        trackOpportunityTelemetry('synced', payload);
      } catch (composerError) {
        setLocalPosts((previous) => previous.filter((post) => post.id !== optimisticId));
        analytics.track(
          'web_feed_post_failed',
          {
            type: payload.type,
            status:
              composerError instanceof apiClient.ApiError ? composerError.status ?? 'api_error' : 'unknown_error',
          },
          { source: 'web_app' },
        );
        trackOpportunityTelemetry('failed', payload);

        if (composerError instanceof ContentModerationError) {
          throw composerError;
        }

        if (composerError instanceof apiClient.ApiError) {
          if (
            composerError.status === 422 &&
            Array.isArray(composerError.body?.details?.reasons) &&
            composerError.body.details.reasons.length
          ) {
            throw new ContentModerationError(
              composerError.body?.message || 'The timeline service rejected your update.',
              {
                reasons: composerError.body.details.reasons,
                signals: composerError.body.details.signals ?? [],
              },
            );
          }

          throw new Error(
            composerError.body?.message || 'The timeline service rejected your update. Please try again.',
          );
        }

        throw new Error('We were unable to reach the timeline service. Check your connection and retry.');
      }
    },
    [hasFeedAccess, session, refresh],
  );

  const handleEditStart = useCallback(
    (post) => {
      if (!post) {
        return;
      }
      if (!canManagePost(post)) {
        setFeedActionError('You can only edit posts that belong to your workspace.');
        return;
      }
      setEditingPostId(post.id);
      setEditingDraft({
        title: post.title ?? '',
        content: post.content ?? post.summary ?? '',
        link: post.link ?? '',
        type: post.type ?? post.category ?? 'update',
      });
      setEditingError(null);
      setFeedActionError(null);
    },
    [canManagePost],
  );

  const handleEditCancel = useCallback(() => {
    setEditingPostId(null);
    setEditingDraft(DEFAULT_EDIT_DRAFT);
    setEditingError(null);
  }, []);

  const handleEditDraftChange = useCallback((field, value) => {
    setEditingDraft((draft) => ({ ...draft, [field]: value }));
  }, []);

  const handleEditSubmit = useCallback(
    async (event, post) => {
      event.preventDefault();
      if (!post?.id || editingPostId !== post.id) {
        return;
      }
      if (!canManagePost(post)) {
        setFeedActionError('You can only update posts that you created or manage.');
        return;
      }

      const trimmedContent = (editingDraft.content ?? '').trim();
      if (!trimmedContent) {
        setEditingError('Share a few more details before saving this update.');
        return;
      }

      const preparedLink = editingDraft.link ? sanitiseExternalLink(editingDraft.link) : null;
      const payload = {
        content: trimmedContent,
        summary: trimmedContent,
        title: editingDraft.title?.trim() || undefined,
        link: preparedLink || undefined,
        type: (editingDraft.type || 'update').toLowerCase(),
      };

      try {
        setEditSaving(true);
        setEditingError(null);
        setFeedActionError(null);
        moderateFeedComposerPayload({ ...payload, mediaAttachments: [] });
        const response = await updateFeedPost(post.id, payload, {
          headers: { 'X-Feature-Surface': 'web-feed-editor' },
        });
        const normalised = normaliseFeedPost(response, session);
        if (normalised) {
          setLocalPosts((previous) => previous.filter((existing) => existing.id !== normalised.id));
        }
        analytics.track('web_feed_post_updated', { postId: post.id, type: payload.type }, { source: 'web_app' });
        await refresh({ force: true });
        setLocalPosts((previous) => previous.filter((existing) => `${existing.id}`.startsWith('local-')));
        setEditingPostId(null);
        setEditingDraft(DEFAULT_EDIT_DRAFT);
      } catch (submitError) {
        const message =
          submitError instanceof ContentModerationError
            ? submitError.message
            : submitError instanceof apiClient.ApiError
            ? submitError.body?.message ?? 'Unable to update the post right now.'
            : submitError?.message ?? 'Unable to update the post right now.';
        setEditingError(message);
        setFeedActionError(message);
      } finally {
        setEditSaving(false);
      }
    },
    [canManagePost, editingDraft, editingPostId, refresh, session],
  );

  const handleDeletePost = useCallback(
    async (post) => {
      if (!post?.id) {
        return;
      }
      if (!canManagePost(post)) {
        setFeedActionError('You can only remove posts that you created or manage.');
        return;
      }
      if (removingPostId) {
        return;
      }
      if (typeof window !== 'undefined' && !window.confirm('Remove this update from the live feed?')) {
        return;
      }
      setRemovingPostId(post.id);
      setFeedActionError(null);
      try {
        await deleteFeedPost(post.id, { headers: { 'X-Feature-Surface': 'web-feed-editor' } });
        setLocalPosts((previous) => previous.filter((existing) => existing.id !== post.id));
        analytics.track('web_feed_post_deleted', { postId: post.id }, { source: 'web_app' });
        await refresh({ force: true });
        if (editingPostId === post.id) {
          setEditingPostId(null);
          setEditingDraft(DEFAULT_EDIT_DRAFT);
        }
      } catch (deleteError) {
        const message =
          deleteError instanceof apiClient.ApiError
            ? deleteError.body?.message ?? 'Unable to remove the post right now.'
            : deleteError?.message ?? 'Unable to remove the post right now.';
        setFeedActionError(message);
      } finally {
        setRemovingPostId(null);
      }
    },
    [canManagePost, editingPostId, refresh, removingPostId],
  );

  const handleReactionChange = useCallback(async (post, { next, previous }) => {
    if (!post?.id) {
      return;
    }
    const operations = [];
    if (previous && (!next || next !== previous)) {
      operations.push(reactToFeedPost(post.id, previous, { active: false }));
    }
    if (next && next !== previous) {
      operations.push(reactToFeedPost(post.id, next, { active: true }));
    }
    if (!operations.length) {
      return;
    }
    try {
      await Promise.all(operations);
    } catch (reactionError) {
      console.warn('Failed to sync reaction', reactionError);
    }
  }, []);

  const renderSkeleton = () => (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <article key={index} className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="h-3 w-32 rounded bg-slate-200" />
            <span className="h-3 w-16 rounded bg-slate-200" />
          </div>
          <div className="mt-4 h-4 w-48 rounded bg-slate-200" />
          <div className="mt-3 space-y-2">
            <div className="h-3 rounded bg-slate-200" />
            <div className="h-3 w-3/4 rounded bg-slate-200" />
            <div className="h-3 w-2/3 rounded bg-slate-200" />
          </div>
        </article>
      ))}
    </div>
  );

  const renderFeedPost = useCallback(
    (post) => (
      <FeedPostCard
        key={post.id}
        post={post}
        onShare={handleShareClick}
        canManage={canManagePost(post)}
        viewer={session}
        onEditStart={handleEditStart}
        onEditCancel={handleEditCancel}
        onDelete={handleDeletePost}
        isEditing={editingPostId === post.id}
        editDraft={editingPostId === post.id ? editingDraft : DEFAULT_EDIT_DRAFT}
        onEditDraftChange={handleEditDraftChange}
        onEditSubmit={handleEditSubmit}
        editSaving={editSaving}
        editError={editingPostId === post.id ? editingError : null}
        deleteLoading={removingPostId === post.id}
        onReactionChange={handleReactionChange}
      />
    ),
    [
      canManagePost,
      editSaving,
      editingDraft,
      editingError,
      editingPostId,
      handleDeletePost,
      handleEditCancel,
      handleEditDraftChange,
      handleEditStart,
      handleEditSubmit,
      handleShareClick,
      handleReactionChange,
      removingPostId,
      session,
    ],
  );

  const renderPosts = () => {
    if (!filteredPosts.length) {
      return (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          {loading
            ? 'Syncing timeline…'
            : 'No updates match your filters yet. Share something or adjust your filters to see more activity.'}
        </div>
      );
    }

    if (!virtualizationEnabled) {
      return (
        <div className="space-y-6">
          {filteredPosts.map((post) => renderFeedPost(post))}
          <div ref={loadMoreRef} aria-hidden="true" />
          {loadingMore ? <FeedLoadingSkeletons /> : null}
          {loadMoreError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
              {loadMoreError?.message || 'We could not load more updates. Try again soon.'}
              <button
                type="button"
                onClick={fetchNextPage}
                className="ml-3 inline-flex items-center gap-2 rounded-full border border-amber-200 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-amber-700 transition hover:border-amber-300 hover:text-amber-600"
              >
                Retry
              </button>
            </div>
          ) : null}
          {!pagination.hasMore && filteredPosts.length ? (
            <p className="text-center text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">
              You’re all caught up.
            </p>
          ) : null}
        </div>
      );
    }

    const virtualisedChunks = feedChunks.map((chunk, chunkIndex) => (
      <VirtualFeedChunk
        key={`feed-chunk-${chunk.startIndex}`}
        chunk={chunk.posts}
        chunkIndex={chunkIndex}
        renderPost={renderFeedPost}
        estimatedHeight={chunkHeights[chunkIndex] ?? chunk.posts.length * DEFAULT_CHUNK_ESTIMATE}
        onHeightChange={updateChunkHeight}
        forceVisible={forcedChunkIndices.has(chunkIndex)}
      />
    ));

    return (
      <div className="space-y-6">
        {virtualisedChunks}
        <div ref={loadMoreRef} aria-hidden="true" />
        {loadingMore ? <FeedLoadingSkeletons /> : null}
        {loadMoreError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            {loadMoreError?.message || 'We could not load more updates. Try again soon.'}
            <button
              type="button"
              onClick={fetchNextPage}
              className="ml-3 inline-flex items-center gap-2 rounded-full border border-amber-200 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-amber-700 transition hover:border-amber-300 hover:text-amber-600"
            >
              Retry
            </button>
          </div>
        ) : null}
        {!pagination.hasMore && filteredPosts.length ? (
          <p className="text-center text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">
            You’re all caught up.
          </p>
        ) : null}
      </div>
    );
  };

  if (!isAuthenticated) {
    return null;
  }

  if (!hasFeedAccess) {
    return (
      <section className="relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
        <div className="absolute -right-20 top-24 h-72 w-72 rounded-full bg-accent/15 blur-[140px]" aria-hidden="true" />
        <div className="absolute -left-16 bottom-10 h-80 w-80 rounded-full bg-indigo-200/20 blur-[140px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-6">
          <PageHeader
            eyebrow="Timeline"
            title="Switch to an eligible workspace"
            description="Your current role does not grant access to the timeline. Swap to a user, freelancer, agency, mentor, headhunter, or company workspace to engage in real time."
            actions={
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
                >
                  Manage memberships
                </Link>
                <Link
                  to="/dashboard/user"
                  className="inline-flex items-center gap-2 rounded-full border border-accent/50 bg-white px-5 py-2 text-sm font-semibold text-accent transition hover:border-accent"
                >
                  Open dashboards
                </Link>
              </div>
            }
            meta={
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {Array.from(ALLOWED_FEED_MEMBERSHIPS).map((role) => {
                  const readable = role.replace(/_/g, ' ');
                  const formatted = readable.charAt(0).toUpperCase() + readable.slice(1);
                  return (
                    <span
                      key={role}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-slate-500"
                    >
                      <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                      {formatted}
                    </span>
                  );
                })}
              </div>
            }
          />
          <div className="mt-10 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Why access is restricted</h2>
            <p className="mt-3 text-sm text-slate-600">
              The timeline hosts sensitive operating updates. Restricting access keeps launches safe. Switch to an eligible membership or contact support for a review.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <main className="bg-[#f3f2ef] pb-12 pt-6 sm:pt-10">
      <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6 2xl:px-12">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          <div className="order-2 space-y-6 lg:order-1 lg:col-span-3">
            <FeedIdentityRail session={session} interests={interests} />
          </div>
          <div className="order-1 space-y-6 lg:order-2 lg:col-span-6">
            <FeedComposer onCreate={handleComposerCreate} session={session} />
            <ActivityFilters
              filters={activeFilters}
              onChange={handleFiltersChange}
              onReset={handleResetFilters}
              savedViews={savedFilterViews}
              onSaveView={handleSaveView}
              onSelectSavedView={handleSelectSavedView}
              onDeleteSavedView={handleDeleteSavedView}
              suggestedTopics={trendingTopics}
              trendingHashtags={trendingHashtags}
            />
            {error && !loading ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                We’re showing the latest cached updates while we reconnect. {error.message || 'Please try again shortly.'}
              </div>
            ) : null}
            {feedActionError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {feedActionError}
              </div>
            ) : null}
            {loading && !filteredPosts.length ? renderSkeleton() : renderPosts()}
          </div>
          <div className="order-3 space-y-6 lg:col-span-3">
            <FeedInsightsRail
              connectionSuggestions={connectionSuggestions}
              groupSuggestions={groupSuggestions}
              liveMoments={liveMoments}
              generatedAt={suggestionsGeneratedAt}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
