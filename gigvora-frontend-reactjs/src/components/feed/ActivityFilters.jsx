import PropTypes from 'prop-types';
import { ArrowPathIcon, FunnelIcon, SparklesIcon } from '@heroicons/react/24/outline';

const CHANNEL_OPTIONS = [
  {
    id: 'all',
    label: 'All activity',
    description: 'Chronological view of everything happening now.',
  },
  {
    id: 'opportunities',
    label: 'Opportunities',
    description: 'Jobs, gigs, projects, volunteering, and Launchpad cohorts.',
  },
  {
    id: 'media',
    label: 'Media & reels',
    description: 'Updates with decks, clips, or rich attachments.',
  },
  {
    id: 'announcements',
    label: 'Announcements',
    description: 'Company statements, platform news, and milestone wins.',
  },
];

const SIGNAL_OPTIONS = [
  {
    id: 'latest',
    label: 'Latest',
    description: 'Real-time ordering',
  },
  {
    id: 'top',
    label: 'Trending',
    description: 'Reactions + shares',
  },
  {
    id: 'discussions',
    label: 'Discussions',
    description: 'Active comment threads',
  },
];

const SCOPE_OPTIONS = [
  {
    id: 'global',
    label: 'Entire network',
  },
  {
    id: 'myPosts',
    label: 'Published by you',
  },
  {
    id: 'engaged',
    label: 'You engaged',
  },
];

export default function ActivityFilters({ value, onChange, metrics, disabled, loading, onRefresh }) {
  const handleChange = (partial) => {
    const next = { ...value, ...partial };
    if (typeof onChange === 'function') {
      onChange(next);
    }
  };

  const renderChannelOption = (option) => {
    const isActive = value.channel === option.id;
    const count = metrics?.[option.id];
    return (
      <button
        key={option.id}
        type="button"
        onClick={() => handleChange({ channel: option.id })}
        disabled={disabled}
        className={`flex min-w-[12rem] flex-1 flex-col rounded-2xl border px-4 py-3 text-left transition ${
          isActive
            ? 'border-accent bg-accentSoft text-accent shadow-sm'
            : 'border-slate-200 bg-white text-slate-600 hover:border-accent/50 hover:text-slate-900'
        }`}
      >
        <span className="text-sm font-semibold">{option.label}</span>
        <span className="mt-1 text-xs text-slate-500">{option.description}</span>
        {typeof count === 'number' ? (
          <span className="mt-3 inline-flex w-max items-center rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {count} entries
          </span>
        ) : null}
      </button>
    );
  };

  const renderSignalOption = (option) => {
    const isActive = value.signal === option.id;
    return (
      <button
        key={option.id}
        type="button"
        onClick={() => handleChange({ signal: option.id })}
        disabled={disabled}
        className={`flex flex-col rounded-xl px-3 py-2 text-left text-xs transition ${
          isActive
            ? 'bg-slate-900 text-white shadow'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
        }`}
      >
        <span className="text-sm font-semibold">{option.label}</span>
        <span className="mt-0.5 text-[11px] uppercase tracking-wide">{option.description}</span>
      </button>
    );
  };

  const renderScopeOption = (option) => {
    const isActive = value.scope === option.id;
    const count = metrics?.[option.id];
    return (
      <button
        key={option.id}
        type="button"
        onClick={() => handleChange({ scope: option.id })}
        disabled={disabled}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
          isActive
            ? 'bg-indigo-600 text-white shadow'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
        }`}
      >
        {option.label}
        {typeof count === 'number' ? <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] text-slate-600">{count}</span> : null}
      </button>
    );
  };

  const freshCount = metrics?.fresh ?? 0;
  const discussionsCount = metrics?.discussions ?? 0;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <FunnelIcon className="h-4 w-4" /> Timeline controls
          </p>
          <p className="text-xs text-slate-500">Dial in the feed to mirror the LinkedIn-class polish stakeholders expect.</p>
        </div>
        <button
          type="button"
          onClick={() => handleChange({ channel: 'all', signal: 'latest', scope: 'global' })}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-accent hover:text-accent"
        >
          Reset filters
        </button>
      </div>
      <div className="mt-5 grid gap-4">
        <div className="flex flex-wrap gap-3">{CHANNEL_OPTIONS.map(renderChannelOption)}</div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">{SIGNAL_OPTIONS.map(renderSignalOption)}</div>
          <div className="flex flex-wrap gap-2">{SCOPE_OPTIONS.map(renderScopeOption)}</div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-semibold text-slate-700 shadow-sm">
              <SparklesIcon className="h-4 w-4 text-accent" /> {freshCount} fresh posts today
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-semibold text-slate-700 shadow-sm">
              {discussionsCount} active discussions
            </span>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={disabled}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold transition ${
              loading ? 'bg-accent/40 text-white' : 'bg-accent text-white hover:bg-accentDark'
            }`}
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Syncing…' : 'Refresh feed'}
          </button>
        </div>
      </div>
    </section>
  );
}

ActivityFilters.propTypes = {
  value: PropTypes.shape({
    channel: PropTypes.string,
    signal: PropTypes.string,
    scope: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func,
  metrics: PropTypes.object,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  onRefresh: PropTypes.func,
};
