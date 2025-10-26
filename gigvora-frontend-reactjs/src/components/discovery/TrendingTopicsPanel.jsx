import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  AdjustmentsHorizontalIcon,
  ArrowTrendingUpIcon,
  ChatBubbleLeftRightIcon,
  MegaphoneIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';

import analytics from '../../services/analytics.js';
import classNames from '../../utils/classNames.js';

function TrendingTopicRow({ topic, index, onFollow, onView, onShare, analyticsSource }) {
  const rank = index + 1;

  const handleFollow = () => {
    onFollow?.(topic);
    analytics.track('discovery.topic.follow_toggled', {
      topicId: topic.id,
      followed: !topic.following,
      source: analyticsSource ?? 'web_app',
    });
  };

  const handleView = () => {
    onView?.(topic);
    analytics.track('discovery.topic.opened', {
      topicId: topic.id,
      source: analyticsSource ?? 'web_app',
      destination: topic.href ?? null,
    });
  };

  const handleShare = () => {
    onShare?.(topic);
    analytics.track('discovery.topic.shared', {
      topicId: topic.id,
      shareUrl: topic.shareUrl ?? null,
      source: analyticsSource ?? 'web_app',
    });
  };

  return (
    <div
      className={classNames(
        'group flex items-center gap-4 rounded-3xl border border-white/40 bg-white/60 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg',
        topic.highlighted ? 'ring-2 ring-blue-200 ring-offset-2' : 'ring-0',
      )}
    >
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-base font-semibold text-white shadow-sm">
        {rank}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-slate-900">{topic.title}</h3>
          {topic.category ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600">
              {topic.category}
            </span>
          ) : null}
        </div>
        {topic.summary ? <p className="mt-1 line-clamp-2 text-xs text-slate-500">{topic.summary}</p> : null}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          <span className="inline-flex items-center gap-1 text-blue-600">
            <ArrowTrendingUpIcon className="h-4 w-4" aria-hidden="true" />
            {topic.growthLabel ?? `${topic.growth}% spike`}
          </span>
          {topic.mentions != null ? <span>{topic.mentions} mentions</span> : null}
          {topic.sentiment ? <span>{topic.sentiment}</span> : null}
          {topic.geo ? <span>{topic.geo}</span> : null}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={handleFollow}
          className={classNames(
            'inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2',
            topic.following
              ? 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 focus:ring-emerald-300'
              : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:from-blue-600 hover:to-indigo-600 focus:ring-indigo-300',
          )}
        >
          {topic.following ? 'Following' : 'Follow'}
        </button>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-blue-500">
          <button
            type="button"
            onClick={handleView}
            className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white/80 px-3 py-1 transition hover:border-blue-300 hover:text-blue-600"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" aria-hidden="true" />
            View feed
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white/80 px-3 py-1 transition hover:border-blue-300 hover:text-blue-600"
          >
            <ShareIcon className="h-4 w-4" aria-hidden="true" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}

TrendingTopicRow.propTypes = {
  topic: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    summary: PropTypes.string,
    category: PropTypes.string,
    growth: PropTypes.number,
    growthLabel: PropTypes.string,
    mentions: PropTypes.number,
    sentiment: PropTypes.string,
    geo: PropTypes.string,
    following: PropTypes.bool,
    highlighted: PropTypes.bool,
    href: PropTypes.string,
    shareUrl: PropTypes.string,
  }).isRequired,
  index: PropTypes.number.isRequired,
  onFollow: PropTypes.func,
  onView: PropTypes.func,
  onShare: PropTypes.func,
  analyticsSource: PropTypes.string,
};

TrendingTopicRow.defaultProps = {
  onFollow: undefined,
  onView: undefined,
  onShare: undefined,
  analyticsSource: 'web_app',
};

export default function TrendingTopicsPanel({
  title,
  description,
  topics,
  loading,
  error,
  timeframes,
  activeTimeframe,
  onTimeframeChange,
  personas,
  activePersona,
  onPersonaChange,
  onFollow,
  onView,
  onShare,
  analyticsSource,
}) {
  const sortedTopics = useMemo(() => {
    const base = Array.isArray(topics) ? [...topics] : [];
    return base.sort((a, b) => (b.rank ?? b.growth ?? 0) - (a.rank ?? a.growth ?? 0));
  }, [topics]);

  return (
    <section className="space-y-6 rounded-[26px] border border-slate-100/80 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-6 shadow-2xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-indigo-500">
            <MegaphoneIcon className="h-4 w-4" aria-hidden="true" />
            Trending Signals
          </div>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">{title}</h2>
          {description ? <p className="mt-1 max-w-xl text-sm text-slate-600">{description}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {Array.isArray(personas) && personas.length ? (
            <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-3 py-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Persona</span>
              <select
                className="rounded-full border border-transparent bg-transparent text-xs font-semibold text-slate-600 focus:border-blue-200 focus:outline-none"
                value={activePersona ?? personas[0]?.id ?? ''}
                onChange={(event) => onPersonaChange?.(event.target.value)}
              >
                {personas.map((persona) => (
                  <option key={persona.id} value={persona.id}>
                    {persona.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {Array.isArray(timeframes) && timeframes.length ? (
            <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-3 py-1">
              <AdjustmentsHorizontalIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <select
                className="rounded-full border border-transparent bg-transparent text-xs font-semibold text-slate-600 focus:border-blue-200 focus:outline-none"
                value={activeTimeframe ?? timeframes[0]?.id ?? ''}
                onChange={(event) => onTimeframeChange?.(event.target.value)}
              >
                {timeframes.map((timeframe) => (
                  <option key={timeframe.id} value={timeframe.id}>
                    {timeframe.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      </header>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              className="h-20 animate-pulse rounded-3xl bg-white/60"
            />
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-5 text-sm text-rose-600">
          We were unable to load trending topics. Check your filters or try again shortly.
        </div>
      ) : null}

      {!loading && !error && !sortedTopics.length ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-8 text-center text-sm text-slate-500">
          No trending conversations for the selected filters. Adjust timeframe or persona to discover new insights.
        </div>
      ) : null}

      {sortedTopics.length ? (
        <div className="space-y-3">
          {sortedTopics.map((topic, index) => (
            <TrendingTopicRow
              key={topic.id}
              topic={topic}
              index={index}
              onFollow={onFollow}
              onView={onView}
              onShare={onShare}
              analyticsSource={analyticsSource}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

TrendingTopicsPanel.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  topics: PropTypes.arrayOf(TrendingTopicRow.propTypes.topic),
  loading: PropTypes.bool,
  error: PropTypes.bool,
  timeframes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  activeTimeframe: PropTypes.string,
  onTimeframeChange: PropTypes.func,
  personas: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  activePersona: PropTypes.string,
  onPersonaChange: PropTypes.func,
  onFollow: PropTypes.func,
  onView: PropTypes.func,
  onShare: PropTypes.func,
  analyticsSource: PropTypes.string,
};

TrendingTopicsPanel.defaultProps = {
  description: null,
  topics: [],
  loading: false,
  error: false,
  timeframes: null,
  activeTimeframe: null,
  onTimeframeChange: undefined,
  personas: null,
  activePersona: null,
  onPersonaChange: undefined,
  onFollow: undefined,
  onView: undefined,
  onShare: undefined,
  analyticsSource: 'web_app',
};
