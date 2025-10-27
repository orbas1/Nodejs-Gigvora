import PropTypes from 'prop-types';
import { MagnifyingGlassIcon, PhotoIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useMemo } from 'react';

const OPPORTUNITY_TYPES = new Set(['job', 'gig', 'project', 'launchpad', 'volunteering', 'mentorship']);
const CELEBRATION_KEYWORDS = ['congrats', 'congratulations', 'milestone', 'celebrat', 'achievement', 'win', 'shipped'];
const KNOWLEDGE_KEYWORDS = ['guide', 'insight', 'tips', 'how to', 'playbook', 'strategy', 'framework', 'deep dive'];
const NEWS_KEYWORDS = ['press', 'announcement', 'breaking', 'news', 'coverage', 'headline'];
const NETWORK_KEYWORDS = {
  workspace: ['workspace', 'studio', 'collective', 'agency'],
  following: ['following', 'followed', 'subscribed'],
};

const DEFAULT_ACTIVITY_FILTERS = Object.freeze({
  mode: 'top',
  category: 'all',
  network: 'network',
  search: '',
  mediaOnly: false,
});

const MODE_OPTIONS = [
  { id: 'top', label: 'Top', description: 'Ranked by traction' },
  { id: 'recent', label: 'Recent', description: 'Latest activity' },
  { id: 'conversations', label: 'Conversations', description: 'Most discussed' },
];

const CATEGORY_OPTIONS = [
  { id: 'all', label: 'All stories' },
  { id: 'opportunity', label: 'Opportunities' },
  { id: 'celebration', label: 'Celebrations' },
  { id: 'knowledge', label: 'Knowledge' },
  { id: 'news', label: 'News & PR' },
];

const NETWORK_OPTIONS = [
  { id: 'network', label: 'Whole network' },
  { id: 'workspaces', label: 'Workspaces' },
  { id: 'following', label: 'Following' },
  { id: 'curated', label: 'Curated' },
];

const numberFormatter = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

function collectTextSegments(post) {
  const segments = [
    post.title,
    post.summary,
    post.content,
    post.authorName,
    post.authorHeadline,
    post.workspaceName,
    post.source,
  ];
  if (Array.isArray(post.tags)) {
    segments.push(post.tags.join(' '));
  }
  if (Array.isArray(post.metadata?.tags)) {
    segments.push(post.metadata.tags.join(' '));
  }
  if (Array.isArray(post.topics)) {
    segments.push(post.topics.join(' '));
  }
  return segments.filter(Boolean).join(' ').toLowerCase();
}

function countComments(comments) {
  if (!Array.isArray(comments)) {
    return 0;
  }
  return comments.reduce((total, comment) => {
    const replyCount = Array.isArray(comment.replies) ? comment.replies.length : 0;
    return total + 1 + replyCount;
  }, 0);
}

function sumReactions(reactions) {
  if (!reactions || typeof reactions !== 'object') {
    return 0;
  }
  return Object.values(reactions).reduce((total, value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? total + numeric : total;
  }, 0);
}

function classifyFeedPost(post, { viewerId } = {}) {
  const typeKey = (post?.type || post?.category || '').toLowerCase();
  const searchText = collectTextSegments(post);
  const categories = new Set();

  if (OPPORTUNITY_TYPES.has(typeKey) || searchText.includes('hiring') || searchText.includes('opportunit')) {
    categories.add('opportunity');
  }
  if (CELEBRATION_KEYWORDS.some((keyword) => searchText.includes(keyword))) {
    categories.add('celebration');
  }
  if (KNOWLEDGE_KEYWORDS.some((keyword) => searchText.includes(keyword))) {
    categories.add('knowledge');
  }
  if (typeKey === 'news' || NEWS_KEYWORDS.some((keyword) => searchText.includes(keyword))) {
    categories.add('news');
  }
  if (!categories.size) {
    categories.add('general');
  }

  const hasMedia = Array.isArray(post?.mediaAttachments) && post.mediaAttachments.some((attachment) => attachment?.url);
  const commentCount = countComments(post?.comments);
  const reactionTotal = sumReactions(post?.reactionSummary ?? post?.reactions);
  const shareCount = Number(post?.shareCount ?? post?.metrics?.shares ?? 0);
  const conversationScore = commentCount;
  const engagementScore = reactionTotal * 2 + commentCount * 3 + shareCount * 4;
  const createdAt = post?.createdAt ? new Date(post.createdAt).getTime() : Date.now();

  const networkSignals = {
    network: true,
    workspaces:
      Boolean(post?.workspaceId || post?.workspaceName) ||
      NETWORK_KEYWORDS.workspace.some((keyword) => searchText.includes(keyword)),
    following:
      Boolean(post?.viewerIsFollowingAuthor || post?.relationship === 'following' || post?.relationship === 'follower') ||
      NETWORK_KEYWORDS.following.some((keyword) => searchText.includes(keyword)),
    curated: Boolean(post?.isCurated || categories.has('news') || post?.source === 'Gigvora editorial'),
  };

  if (viewerId && post?.authorId === viewerId) {
    networkSignals.following = true;
  }

  return {
    categories,
    hasMedia,
    searchText,
    conversationScore,
    engagementScore,
    createdAt,
    networkSignals,
  };
}

function buildActivityFilterSummary(posts, { classificationMap } = {}) {
  const summary = {
    totals: { posts: posts.length, media: 0 },
    categories: {
      all: posts.length,
      opportunity: 0,
      celebration: 0,
      knowledge: 0,
      news: 0,
    },
    network: {
      network: posts.length,
      workspaces: 0,
      following: 0,
      curated: 0,
    },
    modes: {
      top: posts.length,
      recent: posts.length,
      conversations: posts.length,
    },
  };

  posts.forEach((post) => {
    const classification = classificationMap?.get(post.id) ?? classifyFeedPost(post);
    if (!classification) {
      return;
    }
    if (classification.hasMedia) {
      summary.totals.media += 1;
    }
    classification.categories.forEach((category) => {
      if (summary.categories[category] != null) {
        summary.categories[category] += 1;
      }
    });
    if (classification.networkSignals.workspaces) {
      summary.network.workspaces += 1;
    }
    if (classification.networkSignals.following) {
      summary.network.following += 1;
    }
    if (classification.networkSignals.curated) {
      summary.network.curated += 1;
    }
  });

  return summary;
}

function applyActivityFilters(posts, filters, { classificationMap, editingPostId } = {}) {
  if (!Array.isArray(posts) || !posts.length) {
    return [];
  }
  const prepared = posts.map((post) => ({
    post,
    meta: classificationMap?.get(post.id) ?? classifyFeedPost(post),
  }));
  const trimmedSearch = filters.search?.trim().toLowerCase() ?? '';

  const filtered = prepared.filter(({ post, meta }) => {
    if (!meta) {
      return false;
    }
    if (filters.category !== 'all' && !meta.categories.has(filters.category)) {
      if (!(editingPostId && post.id === editingPostId)) {
        return false;
      }
    }
    if (filters.network === 'workspaces' && !meta.networkSignals.workspaces) {
      if (!(editingPostId && post.id === editingPostId)) {
        return false;
      }
    }
    if (filters.network === 'following' && !meta.networkSignals.following) {
      if (!(editingPostId && post.id === editingPostId)) {
        return false;
      }
    }
    if (filters.network === 'curated' && !meta.networkSignals.curated) {
      if (!(editingPostId && post.id === editingPostId)) {
        return false;
      }
    }
    if (filters.mediaOnly && !meta.hasMedia) {
      if (!(editingPostId && post.id === editingPostId)) {
        return false;
      }
    }
    if (trimmedSearch && !meta.searchText.includes(trimmedSearch)) {
      if (!(editingPostId && post.id === editingPostId)) {
        return false;
      }
    }
    return true;
  });

  const sorter = ({ meta: aMeta, post: a }, { meta: bMeta, post: b }) => {
    if (filters.mode === 'recent') {
      return bMeta.createdAt - aMeta.createdAt;
    }
    if (filters.mode === 'conversations') {
      if (bMeta.conversationScore !== aMeta.conversationScore) {
        return bMeta.conversationScore - aMeta.conversationScore;
      }
      return bMeta.createdAt - aMeta.createdAt;
    }
    if (filters.mode === 'top') {
      if (bMeta.engagementScore !== aMeta.engagementScore) {
        return bMeta.engagementScore - aMeta.engagementScore;
      }
      return bMeta.createdAt - aMeta.createdAt;
    }
    return bMeta.createdAt - aMeta.createdAt;
  };

  filtered.sort(sorter);

  return filtered.map(({ post }) => post);
}

function ActivityFilters({ filters, onChange, summary }) {
  const mediaLabel = useMemo(() => {
    if (!summary?.totals) {
      return 'Media focus';
    }
    const countLabel = numberFormatter.format(summary.totals.media ?? 0);
    return `Media focus (${countLabel})`;
  }, [summary]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-accentSoft px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-accent">
            <SparklesIcon className="h-4 w-4" /> Curate your timeline
          </p>
          <p className="mt-3 max-w-xl text-sm text-slate-600">
            Tune the feed to surface the right wins, launches, and opportunities while keeping editing flows within reach.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {MODE_OPTIONS.map((option) => {
            const isActive = filters.mode === option.id;
            const count = summary?.modes?.[option.id];
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange({ ...filters, mode: option.id })}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-accent text-white shadow-soft'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span className="block text-left leading-tight">
                  {option.label}
                  <span className="block text-[0.6rem] font-normal uppercase tracking-wide">
                    {option.description}
                    {typeof count === 'number' ? ` · ${numberFormatter.format(count)}` : ''}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr),minmax(0,18rem)]">
        <div className="space-y-4">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-inner focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
            <MagnifyingGlassIcon className="h-5 w-5" />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => onChange({ ...filters, search: event.target.value })}
              className="w-full border-none bg-transparent p-0 text-sm text-slate-800 focus:outline-none"
              placeholder="Search posts, authors, tags, or missions"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((option) => {
              const isActive = filters.category === option.id;
              const count = summary?.categories?.[option.id];
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onChange({ ...filters, category: option.id })}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-soft'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {option.label}
                  {typeof count === 'number' ? (
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[0.6rem] font-semibold text-slate-500">
                      {numberFormatter.format(count)}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Network focus</p>
          <div className="flex flex-wrap gap-2">
            {NETWORK_OPTIONS.map((option) => {
              const isActive = filters.network === option.id;
              const count = summary?.network?.[option.id];
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onChange({ ...filters, network: option.id })}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-accent text-white shadow-soft'
                      : 'bg-white text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {option.label}
                  {typeof count === 'number' ? (
                    <span className="rounded-full bg-black/10 px-2 py-0.5 text-[0.6rem] font-semibold text-slate-500">
                      {numberFormatter.format(count)}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...filters, mediaOnly: !filters.mediaOnly })}
            className={`inline-flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-semibold transition ${
              filters.mediaOnly
                ? 'border-accent bg-white text-accent shadow-soft'
                : 'border-transparent bg-white text-slate-600 hover:border-slate-200 hover:text-slate-900'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <PhotoIcon className="h-4 w-4" />
              {mediaLabel}
            </span>
            <span className="text-[0.6rem] uppercase tracking-wide text-slate-400">
              {filters.mediaOnly ? 'On' : 'Off'}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

ActivityFilters.propTypes = {
  filters: PropTypes.shape({
    mode: PropTypes.oneOf(['top', 'recent', 'conversations']).isRequired,
    category: PropTypes.string.isRequired,
    network: PropTypes.oneOf(['network', 'workspaces', 'following', 'curated']).isRequired,
    search: PropTypes.string.isRequired,
    mediaOnly: PropTypes.bool.isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  summary: PropTypes.shape({
    totals: PropTypes.shape({
      posts: PropTypes.number,
      media: PropTypes.number,
    }),
    categories: PropTypes.object,
    network: PropTypes.object,
    modes: PropTypes.object,
  }),
};

ActivityFilters.defaultProps = {
  summary: null,
};

export default ActivityFilters;
export {
  DEFAULT_ACTIVITY_FILTERS,
  classifyFeedPost,
  buildActivityFilterSummary,
  applyActivityFilters,
};
