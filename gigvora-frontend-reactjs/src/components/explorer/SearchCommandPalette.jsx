import { Dialog, Transition } from '@headlessui/react';
import {
  BookmarkIcon,
  ClockIcon,
  CommandLineIcon,
  FireIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';

import classNames from '../../utils/classNames.js';
import { formatRelativeTime } from '../../utils/date.js';

const ICON_COMPONENTS = {
  saved: BookmarkIcon,
  recent: ClockIcon,
  suggestion: SparklesIcon,
  trending: FireIcon,
  category: Squares2X2Icon,
};

function normaliseText(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function buildPaletteEntries({
  savedSearches = [],
  recentSearches = [],
  suggestions = [],
  trendingTopics = [],
  categories = [],
  query = '',
  activeCategory = null,
}) {
  const lookupCategoryLabel = (categoryId) => {
    const match = categories.find((category) => category.id === categoryId);
    return match ? match.label : categoryId;
  };

  const normalisedQuery = normaliseText(query);
  const matchesQuery = (candidate) => {
    if (!normalisedQuery) {
      return true;
    }
    const haystack = [candidate.title, candidate.subtitle, candidate.description]
      .concat(candidate.keywords ?? [])
      .filter(Boolean)
      .map((value) => normaliseText(value));
    return haystack.some((entry) => entry.includes(normalisedQuery));
  };

  const sections = [];

  const savedEntries = savedSearches.slice(0, 8).map((search) => ({
    id: `saved:${search.id}`,
    type: 'saved-search',
    icon: 'saved',
    title: search.name,
    subtitle: search.query ? `“${search.query}”` : 'All results',
    description: lookupCategoryLabel(search.category ?? activeCategory ?? 'job'),
    keywords: [search.name, search.query, lookupCategoryLabel(search.category ?? '')],
    data: search,
    badge: search.sort && search.sort !== 'default' ? search.sort : null,
  }));
  if (savedEntries.length) {
    sections.push({ id: 'saved-searches', title: 'Saved searches', entries: savedEntries });
  }

  const recentEntries = recentSearches.slice(0, 8).map((recent) => ({
    id: `recent:${recent.id ?? `${recent.category}:${recent.query}`}`,
    type: 'recent-search',
    icon: 'recent',
    title: recent.query ? `“${recent.query}”` : 'Recent explorer session',
    subtitle: lookupCategoryLabel(recent.category ?? activeCategory ?? 'job'),
    description: recent.filtersLabel ?? null,
    keywords: [recent.query, lookupCategoryLabel(recent.category ?? '')],
    data: recent,
    badge: recent.performedAt ? formatRelativeTime(recent.performedAt) : null,
  }));
  if (recentEntries.length) {
    sections.push({ id: 'recent-searches', title: 'Recent searches', entries: recentEntries });
  }

  const suggestionEntries = suggestions.slice(0, 6).map((suggestion) => ({
    id: `suggestion:${suggestion.id}`,
    type: 'suggestion',
    icon: 'suggestion',
    title: suggestion.title,
    subtitle: suggestion.subtitle ?? suggestion.categoryLabel ?? lookupCategoryLabel(suggestion.category ?? ''),
    description: suggestion.description ?? null,
    keywords: [
      suggestion.title,
      suggestion.subtitle,
      suggestion.categoryLabel,
      suggestion.category,
      ...(Array.isArray(suggestion.context) ? suggestion.context : []),
    ],
    data: suggestion,
    badge: suggestion.reason ?? null,
  }));
  if (suggestionEntries.length) {
    sections.push({ id: 'suggestions', title: 'Suggested for you', entries: suggestionEntries });
  }

  const trendingEntries = trendingTopics.slice(0, 6).map((topic) => ({
    id: `trending:${topic.id}`,
    type: 'trending-topic',
    icon: 'trending',
    title: topic.title ?? topic.topic,
    subtitle: topic.summary ?? null,
    description: topic.category ? lookupCategoryLabel(topic.category) : null,
    keywords: [topic.title, topic.topic, topic.summary, topic.category],
    data: topic,
    badge: topic.growthLabel ?? topic.momentum ?? topic.rankLabel ?? null,
  }));
  if (trendingEntries.length) {
    sections.push({ id: 'trending-topics', title: 'Trending across the network', entries: trendingEntries });
  }

  const categoryEntries = categories.map((category) => ({
    id: `category:${category.id}`,
    type: 'category',
    icon: 'category',
    title: category.label,
    subtitle: category.tagline ?? null,
    description: category.placeholder ?? null,
    keywords: [category.label, category.placeholder, category.tagline],
    data: category,
    badge: category.id === activeCategory ? 'Active' : null,
  }));
  if (categoryEntries.length) {
    sections.push({ id: 'categories', title: 'Explorer categories', entries: categoryEntries });
  }

  const filteredSections = sections
    .map((section) => ({
      ...section,
      entries: section.entries.filter(matchesQuery),
    }))
    .filter((section) => section.entries.length);

  const flatEntries = filteredSections.flatMap((section) =>
    section.entries.map((entry, index) => ({ ...entry, sectionId: section.id, sectionIndex: index })),
  );

  return { sections: filteredSections, entries: flatEntries };
}

function ShortcutHint() {
  return (
    <span className="hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-500 sm:inline-flex">
      <span aria-hidden="true">⌘</span>
      <span aria-hidden="true">K</span>
      <span className="sr-only">Command + K</span>
    </span>
  );
}

function SearchCommandPalette({
  isOpen = false,
  onClose,
  onSelectEntry,
  query = '',
  onQueryChange,
  savedSearches = [],
  recentSearches = [],
  suggestions = [],
  trendingTopics = [],
  categories = [],
  activeCategory = null,
}) {
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { sections, entries } = useMemo(
    () =>
      buildPaletteEntries({
        savedSearches,
        recentSearches,
        suggestions,
        trendingTopics,
        categories,
        query,
        activeCategory,
      }),
    [savedSearches, recentSearches, suggestions, trendingTopics, categories, query, activeCategory],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setActiveIndex(0);
  }, [isOpen, query]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const element = inputRef.current;
    if (element) {
      element.focus();
      element.select?.();
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeIndex < 0 || activeIndex >= entries.length) {
      return;
    }
    const container = listRef.current;
    if (!container) {
      return;
    }
    const activeEntry = entries[activeIndex];
    const selectorId = (() => {
      if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
        return CSS.escape(activeEntry.id);
      }
      return String(activeEntry.id).replace(/"/g, '\\"');
    })();
    const node = container.querySelector(`[data-palette-entry-id="${selectorId}"]`);
    if (node && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, entries]);

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!entries.length) {
        return;
      }
      setActiveIndex((index) => {
        if (index < 0) {
          return 0;
        }
        return Math.min(entries.length - 1, index + 1);
      });
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!entries.length) {
        return;
      }
      setActiveIndex((index) => {
        if (index <= 0) {
          return entries.length - 1;
        }
        return index - 1;
      });
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const entry = entries[activeIndex];
      if (entry) {
        onSelectEntry?.(entry);
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose?.();
    }
  };

  const handleEntryClick = (entry) => {
    onSelectEntry?.(entry);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose} initialFocus={inputRef}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Dialog.Panel
              className="mx-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
              onKeyDown={handleKeyDown}
            >
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-inner focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
                  <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(event) => onQueryChange?.(event.target.value)}
                    type="text"
                    placeholder="Search saved, recent, or curated Explorer actions"
                    className="flex-1 border-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                  <ShortcutHint />
                </div>
              </div>

              <div ref={listRef} className="max-h-[27rem] overflow-y-auto px-2 py-4">
                {sections.length ? (
                  <div className="space-y-6">
                    {sections.map((section) => (
                      <div key={section.id}>
                        <h3 className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          {section.title}
                        </h3>
                        <ul className="mt-2 space-y-2">
                          {section.entries.map((entry, index) => {
                            const Icon = ICON_COMPONENTS[entry.icon] ?? CommandLineIcon;
                            const isActive = entries[activeIndex]?.id === entry.id;
                            return (
                              <li key={entry.id}>
                                <button
                                  type="button"
                                  className={classNames(
                                    'group relative flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-accent/30',
                                    isActive
                                      ? 'bg-slate-900 text-white shadow-lg'
                                      : 'bg-white/80 text-slate-900 hover:bg-slate-50',
                                  )}
                                  data-palette-entry-id={entry.id}
                                  onMouseEnter={() => setActiveIndex(entries.findIndex((item) => item.id === entry.id))}
                                  onFocus={() => setActiveIndex(entries.findIndex((item) => item.id === entry.id))}
                                  onClick={() => handleEntryClick(entry)}
                                >
                                  <span
                                    className={classNames(
                                      'flex h-10 w-10 flex-none items-center justify-center rounded-xl border text-sm font-semibold',
                                      isActive
                                        ? 'border-white/30 bg-white/20 text-white'
                                        : 'border-slate-200 bg-slate-100 text-slate-500',
                                    )}
                                  >
                                    <Icon className="h-5 w-5" aria-hidden="true" />
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold">
                                      {entry.title}
                                    </p>
                                    {entry.subtitle ? (
                                      <p
                                        className={classNames(
                                          'mt-1 line-clamp-1 text-xs',
                                          isActive ? 'text-slate-100' : 'text-slate-500',
                                        )}
                                      >
                                        {entry.subtitle}
                                      </p>
                                    ) : null}
                                    {entry.description ? (
                                      <p
                                        className={classNames(
                                          'mt-1 line-clamp-2 text-xs',
                                          isActive ? 'text-slate-200' : 'text-slate-500',
                                        )}
                                      >
                                        {entry.description}
                                      </p>
                                    ) : null}
                                  </div>
                                  {entry.badge ? (
                                    <span
                                      className={classNames(
                                        'flex-none rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                                        isActive
                                          ? 'border-white/40 bg-white/20 text-white'
                                          : 'border-slate-200 bg-slate-100 text-slate-500',
                                      )}
                                    >
                                      {entry.badge}
                                    </span>
                                  ) : null}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-12 text-center text-sm text-slate-500">
                    <p>No matches for “{query}”. Try a different keyword or reset filters.</p>
                  </div>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

SearchCommandPalette.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  onSelectEntry: PropTypes.func,
  query: PropTypes.string,
  onQueryChange: PropTypes.func,
  savedSearches: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      query: PropTypes.string,
      category: PropTypes.string,
      sort: PropTypes.string,
    }),
  ),
  recentSearches: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      category: PropTypes.string,
      query: PropTypes.string,
      filtersLabel: PropTypes.string,
      filters: PropTypes.object,
      sort: PropTypes.string,
      performedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    }),
  ),
  suggestions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      subtitle: PropTypes.string,
      description: PropTypes.string,
      category: PropTypes.string,
      categoryLabel: PropTypes.string,
      context: PropTypes.arrayOf(PropTypes.string),
      reason: PropTypes.string,
    }),
  ),
  trendingTopics: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string,
      topic: PropTypes.string,
      summary: PropTypes.string,
      category: PropTypes.string,
      growthLabel: PropTypes.string,
      momentum: PropTypes.string,
      rankLabel: PropTypes.string,
    }),
  ),
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      tagline: PropTypes.string,
      placeholder: PropTypes.string,
    }),
  ),
  activeCategory: PropTypes.string,
};

export default SearchCommandPalette;
