import { useState } from 'react';
import {
  AdjustmentsHorizontalIcon,
  BookmarkIcon,
  FireIcon,
  HashtagIcon,
  LightBulbIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import {
  ACTIVITY_PERSONA_OPTIONS,
  ACTIVITY_QUICK_VIEWS,
  ACTIVITY_SORT_OPTIONS,
  ACTIVITY_TIME_RANGES,
} from './feedUtils.js';

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


export default ActivityFilters;
