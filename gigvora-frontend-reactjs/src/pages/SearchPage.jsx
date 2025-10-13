import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, Switch, Transition } from '@headlessui/react';
import {
  AdjustmentsHorizontalIcon,
  BellIcon,
  BookmarkIcon,
  ExclamationCircleIcon,
  ListBulletIcon,
  MapIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import ExplorerMap from '../components/explorer/ExplorerMap.jsx';
import ExplorerFilterDrawer from '../components/explorer/ExplorerFilterDrawer.jsx';
import SavedSearchList from '../components/explorer/SavedSearchList.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import useCachedResource from '../hooks/useCachedResource.js';
import useDebounce from '../hooks/useDebounce.js';
import useSavedSearches from '../hooks/useSavedSearches.js';
import { apiClient } from '../services/apiClient.js';
import analytics from '../services/analytics.js';
import { formatAbsolute, formatRelativeTime } from '../utils/date.js';
import useSession from '../hooks/useSession.js';
import useEngagementSignals from '../hooks/useEngagementSignals.js';

const DEFAULT_CATEGORY = 'job';

const CATEGORIES = [
  {
    id: 'job',
    label: 'Jobs',
    tagline: 'Permanent, contract, and interim roles across the Gigvora network.',
    placeholder: 'Search roles, companies, or keywords',
  },
  {
    id: 'gig',
    label: 'Gigs',
    tagline: 'Short-term engagements with transparent budgets and timelines.',
    placeholder: 'Search gig keywords or delivery focus',
  },
  {
    id: 'project',
    label: 'Projects',
    tagline: 'Multi-disciplinary projects with status tracking and collaborators.',
    placeholder: 'Search project objectives or skills',
  },
  {
    id: 'launchpad',
    label: 'Experience Launchpad',
    tagline: 'Cohort-driven launchpad placements and growth programmes.',
    placeholder: 'Search tracks or launchpad cohorts',
  },
  {
    id: 'volunteering',
    label: 'Volunteering',
    tagline: 'Purpose-led missions from nonprofits and community partners.',
    placeholder: 'Search missions or causes',
  },
  {
    id: 'talent',
    label: 'Freelancers',
    tagline: 'Curated independent talent ready to collaborate.',
    placeholder: 'Search skills, disciplines, or locations',
  },
  {
    id: 'companies',
    label: 'Companies',
    tagline: 'Hiring teams and organisations across the Gigvora ecosystem.',
    placeholder: 'Search company names, sectors, or geographies',
  },
  {
    id: 'people',
    label: 'People',
    tagline: 'Find people in your wider network to connect with.',
    placeholder: 'Search names, specialties, or keywords',
  },
  {
    id: 'groups',
    label: 'Groups',
    tagline: 'Communities and collectives hosting specialised discussions.',
    placeholder: 'Search groups or focus areas',
  },
  {
    id: 'headhunter',
    label: 'Headhunters',
    tagline: 'Specialist partners for executive and niche searches.',
    placeholder: 'Search headhunter firms or expertise areas',
  },
  {
    id: 'agency',
    label: 'Agencies',
    tagline: 'Agency partners and collectives to co-deliver programmes.',
    placeholder: 'Search agency names, services, or regions',
  },
];

const SORT_OPTIONS = {
  job: [
    { id: 'default', label: 'Relevance' },
    { id: 'newest', label: 'Newest' },
    { id: 'alphabetical', label: 'A–Z' },
  ],
  gig: [
    { id: 'default', label: 'Relevance' },
    { id: 'budget', label: 'Budget (high → low)' },
    { id: 'newest', label: 'Newest' },
  ],
  project: [
    { id: 'default', label: 'Relevance' },
    { id: 'status', label: 'Status' },
    { id: 'alphabetical', label: 'A–Z' },
  ],
  launchpad: [
    { id: 'default', label: 'Relevance' },
    { id: 'alphabetical', label: 'A–Z' },
  ],
  volunteering: [
    { id: 'default', label: 'Relevance' },
    { id: 'alphabetical', label: 'A–Z' },
  ],
  talent: [
    { id: 'default', label: 'Match score' },
    { id: 'availability', label: 'Availability' },
    { id: 'alphabetical', label: 'A–Z' },
  ],
  companies: [
    { id: 'default', label: 'Relevance' },
    { id: 'alphabetical', label: 'A–Z' },
    { id: 'activity', label: 'Recent activity' },
  ],
  people: [
    { id: 'default', label: 'Relevance' },
    { id: 'alphabetical', label: 'A–Z' },
    { id: 'recent', label: 'Recently active' },
  ],
  groups: [
    { id: 'default', label: 'Relevance' },
    { id: 'members', label: 'Member count' },
    { id: 'recent', label: 'Recently active' },
  ],
  headhunter: [
    { id: 'default', label: 'Relevance' },
    { id: 'alphabetical', label: 'A–Z' },
  ],
  agency: [
    { id: 'default', label: 'Relevance' },
    { id: 'alphabetical', label: 'A–Z' },
    { id: 'impact', label: 'Programme impact' },
  ],
};

const DEFAULT_FILTERS = {
  employmentTypes: [],
  employmentCategories: [],
  durationCategories: [],
  budgetCurrencies: [],
  locations: [],
  countries: [],
  regions: [],
  cities: [],
  tracks: [],
  organizations: [],
  statuses: [],
  isRemote: null,
  updatedWithin: '30d',
};

const FRESHNESS_LABELS = {
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
};

function normaliseFilters(state = {}) {
  return { ...DEFAULT_FILTERS, ...state };
}

function cleanFilters(filters) {
  const normalised = normaliseFilters(filters);
  return Object.entries(normalised).reduce((acc, [key, value]) => {
    if (Array.isArray(value)) {
      if (value.length) {
        acc[key] = value;
      }
      return acc;
    }
    if (value === true || value === false) {
      acc[key] = value;
      return acc;
    }
    if (value) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

function hasFiltersApplied(filters) {
  const cleaned = cleanFilters(filters);
  return Object.keys(cleaned).length > 0;
}

function getCategoryById(id) {
  return CATEGORIES.find((category) => category.id === id) ?? CATEGORIES[0];
}

function buildCacheKey({ category, query, page, sort, filters, viewport }) {
  return [
    'explorer',
    category,
    query || '∅',
    sort || 'default',
    page,
    filters ? JSON.stringify(filters) : '∅',
    viewport ? JSON.stringify(viewport) : '∅',
  ].join('::');
}

function toResultMeta(item) {
  const tokens = [];
  if (item.location) {
    tokens.push(item.location);
  }
  if (item.employmentType) {
    tokens.push(item.employmentType);
  }
  if (item.duration) {
    tokens.push(item.duration);
  }
  if (item.status) {
    tokens.push(item.status);
  }
  if (item.track) {
    tokens.push(item.track);
  }
  if (item.organization) {
    tokens.push(item.organization);
  }
  if (item.isRemote) {
    tokens.push('Remote friendly');
  }
  return tokens;
}

const PAGE_SIZE = 20;

function resolveSuggestedName({ category, query }) {
  const categoryLabel = getCategoryById(category).label;
  if (query) {
    return `${categoryLabel}: ${query}`;
  }
  return `${categoryLabel} explorer`;
}

export default function SearchPage() {
  const { session } = useSession();
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORY);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('default');
  const [filters, setFilters] = useState(() => normaliseFilters());
  const [viewMode, setViewMode] = useState('list');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [viewportBounds, setViewportBounds] = useState(null);
  const [saveModalState, setSaveModalState] = useState({ open: false, mode: 'create', draft: null });
  const [activeSavedSearchId, setActiveSavedSearchId] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isSubmittingSavedSearch, setIsSubmittingSavedSearch] = useState(false);
  const debouncedQuery = useDebounce(query.trim(), 400);
  const lastTrackedQueryRef = useRef(null);

  const { items: savedSearches, loading: savedSearchesLoading, createSavedSearch, updateSavedSearch, deleteSavedSearch, canUseServer } =
    useSavedSearches({ enabled: true });
  const engagementSignals = useEngagementSignals({ session, limit: 6 });
  const activeSavedSearch = useMemo(
    () => savedSearches.find((search) => search.id === activeSavedSearchId) ?? null,
    [savedSearches, activeSavedSearchId],
  );

  const cleanedFilters = useMemo(() => cleanFilters(filters), [filters]);
  const filtersParam = useMemo(
    () => (Object.keys(cleanedFilters).length ? JSON.stringify(cleanedFilters) : undefined),
    [cleanedFilters],
  );
  const viewportParam = useMemo(
    () => (viewportBounds ? JSON.stringify({ boundingBox: viewportBounds }) : undefined),
    [viewportBounds],
  );

  useEffect(() => {
    setPage(1);
    setViewportBounds(null);
    setSort((current) => {
      const allowed = SORT_OPTIONS[selectedCategory] ?? [];
      const fallback = allowed[0]?.id ?? 'default';
      if (allowed.some((option) => option.id === current)) {
        return current;
      }
      return fallback;
    });
  }, [selectedCategory]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, filtersParam, sort, viewportParam]);

  const searchKey = useMemo(
    () =>
      buildCacheKey({
        category: selectedCategory,
        query: debouncedQuery,
        page,
        sort,
        filters: cleanedFilters,
        viewport: viewportBounds,
      }),
    [selectedCategory, debouncedQuery, page, sort, cleanedFilters, viewportBounds],
  );

  const searchState = useCachedResource(
    searchKey,
    ({ signal }) =>
      apiClient.get('/search/opportunities', {
        signal,
        params: {
          category: selectedCategory,
          q: debouncedQuery || undefined,
          page,
          pageSize: PAGE_SIZE,
          sort,
          filters: filtersParam,
          includeFacets: true,
          viewport: viewportParam,
        },
      }),
    {
      dependencies: [selectedCategory, debouncedQuery, page, sort, filtersParam, viewportParam],
      ttl: 60_000,
    },
  );

  const snapshotState = useCachedResource(
    'discovery:snapshot:v2',
    ({ signal }) => apiClient.get('/discovery/snapshot', { signal, params: { limit: 6 } }),
    { ttl: 120_000 },
  );

  useEffect(() => {
    if (!debouncedQuery || !searchState.data) {
      return;
    }
    const signature = `${selectedCategory}:${debouncedQuery}`;
    if (lastTrackedQueryRef.current === signature) {
      return;
    }
    analytics.track(
      'web_explorer_search_performed',
      {
        query: debouncedQuery,
        category: selectedCategory,
        filtersApplied: Object.keys(cleanedFilters).length,
        sort,
        totalResults: searchState.data.total ?? 0,
        page,
      },
      { source: 'web_app' },
    );
    lastTrackedQueryRef.current = signature;
  }, [debouncedQuery, searchState.data, selectedCategory, cleanedFilters, sort, page]);

  const results = searchState.data?.items ?? [];
  const totalResults = searchState.data?.total ?? 0;
  const totalPages = searchState.data?.totalPages ?? 1;
  const facets = searchState.data?.facets ?? null;
  const metrics = searchState.data?.metrics ?? null;

  const trendingAcrossCategories = useMemo(() => {
    if (!snapshotState.data) {
      return [];
    }
    return CATEGORIES.flatMap((category) => {
      const items = snapshotState.data?.[`${category.id}s`] ?? snapshotState.data?.[category.id];
      if (!items?.items?.length) {
        return [];
      }
      return items.items.slice(0, 2).map((item) => ({
        ...item,
        category: category.id,
        categoryLabel: category.label,
      }));
    });
  }, [snapshotState.data]);

  const handleCategoryChange = useCallback((categoryId) => {
    analytics.track('web_explorer_category_selected', { category: categoryId }, { source: 'web_app' });
    setSelectedCategory(categoryId);
    setActiveSavedSearchId(null);
    setFilters(normaliseFilters());
    setQuery('');
    lastTrackedQueryRef.current = null;
  }, []);

  const handleApplyFilters = useCallback((nextFilters) => {
    setFilters(normaliseFilters(nextFilters));
    setActiveSavedSearchId(null);
    analytics.track('web_explorer_filters_applied', { category: selectedCategory, filters: cleanFilters(nextFilters) });
  }, [selectedCategory]);

  const handleResetFilters = useCallback(() => {
    setFilters(normaliseFilters());
    setViewportBounds(null);
    setActiveSavedSearchId(null);
    analytics.track('web_explorer_filters_reset', { category: selectedCategory });
  }, [selectedCategory]);

  const handleRemoveFilterValue = useCallback(
    (key, value) => {
      setFilters((prev) => {
        const draft = normaliseFilters(prev);
        if (Array.isArray(draft[key])) {
          return { ...draft, [key]: draft[key].filter((item) => item !== value) };
        }
        return { ...draft, [key]: null };
      });
      setActiveSavedSearchId(null);
    },
    [],
  );

  const handleRemoveRemoteFilter = useCallback(() => {
    setFilters((prev) => ({ ...normaliseFilters(prev), isRemote: null }));
    setActiveSavedSearchId(null);
  }, []);

  const handleRemoveFreshnessFilter = useCallback(() => {
    setFilters((prev) => ({ ...normaliseFilters(prev), updatedWithin: null }));
    setActiveSavedSearchId(null);
  }, []);

  const handleClearViewport = useCallback(() => {
    setViewportBounds(null);
    setActiveSavedSearchId(null);
  }, []);

  const activeFilterChips = useMemo(() => {
    const chips = [];
    const currentFilters = normaliseFilters(filters);

    const arrayKeys = [
      ['employmentTypes', 'Employment type'],
      ['employmentCategories', 'Category'],
      ['durationCategories', 'Duration'],
      ['budgetCurrencies', 'Currency'],
      ['locations', 'Location'],
      ['countries', 'Country'],
      ['regions', 'Region'],
      ['cities', 'City'],
      ['tracks', 'Track'],
      ['organizations', 'Organisation'],
      ['statuses', 'Status'],
    ];

    arrayKeys.forEach(([key, label]) => {
      currentFilters[key].forEach((value) => {
        chips.push({ key, label, value, onRemove: () => handleRemoveFilterValue(key, value) });
      });
    });

    if (currentFilters.isRemote === true) {
      chips.push({ key: 'isRemote', label: 'Remote', value: 'Remote friendly', onRemove: handleRemoveRemoteFilter });
    } else if (currentFilters.isRemote === false) {
      chips.push({ key: 'isRemote', label: 'Remote', value: 'On-site', onRemove: handleRemoveRemoteFilter });
    }

    if (currentFilters.updatedWithin) {
      chips.push({
        key: 'updatedWithin',
        label: 'Freshness',
        value: FRESHNESS_LABELS[currentFilters.updatedWithin] ?? currentFilters.updatedWithin,
        onRemove: handleRemoveFreshnessFilter,
      });
    }

    if (viewportBounds) {
      chips.push({
        key: 'viewport',
        label: 'Map view',
        value: 'Within current map',
        onRemove: handleClearViewport,
      });
    }

    return chips;
  }, [filters, handleRemoveFilterValue, handleRemoveRemoteFilter, handleRemoveFreshnessFilter, viewportBounds, handleClearViewport]);

  const handleResultClick = useCallback(
    (item) => {
      analytics.track(
        'web_explorer_result_opened',
        {
          id: item.id,
          category: item.category,
          title: item.title,
          query: debouncedQuery || null,
          filters: cleanedFilters,
        },
        { source: 'web_app' },
      );
    },
    [debouncedQuery, cleanedFilters],
  );

  const handleViewportChange = useCallback((bounds) => {
    setViewportBounds(bounds);
    analytics.track('web_explorer_map_bounds_updated', { category: selectedCategory, bounds });
  }, [selectedCategory]);

  const openSaveModal = useCallback(
    (mode = 'create', draftOverrides = {}) => {
      const draft = {
        name: resolveSuggestedName({ category: selectedCategory, query: debouncedQuery }),
        notifyByEmail: false,
        notifyInApp: true,
        ...draftOverrides,
      };
      setSaveModalState({ open: true, mode, draft });
      setSaveError(null);
    },
    [selectedCategory, debouncedQuery],
  );

  const handleSaveSearch = useCallback(async () => {
    if (!saveModalState.open || !saveModalState.draft?.name?.trim()) {
      setSaveError('Name is required to save a search.');
      return;
    }
    setIsSubmittingSavedSearch(true);
    setSaveError(null);
    const payload = {
      name: saveModalState.draft.name.trim(),
      category: selectedCategory,
      query: debouncedQuery || '',
      filters: cleanedFilters,
      sort,
      notifyByEmail: saveModalState.draft.notifyByEmail,
      notifyInApp: saveModalState.draft.notifyInApp,
    };

    try {
      let record;
      if (saveModalState.mode === 'update' && saveModalState.draft.id) {
        record = await updateSavedSearch(saveModalState.draft.id, payload);
      } else {
        record = await createSavedSearch(payload);
      }
      setActiveSavedSearchId(record?.id ?? null);
      setSaveModalState({ open: false, mode: 'create', draft: null });
      analytics.track('web_explorer_search_saved', { category: selectedCategory, ...payload, id: record?.id });
    } catch (error) {
      setSaveError(error?.message || 'Unable to save search. Please try again.');
    } finally {
      setIsSubmittingSavedSearch(false);
    }
  }, [saveModalState, selectedCategory, debouncedQuery, cleanedFilters, sort, updateSavedSearch, createSavedSearch]);

  const handleCloseSaveModal = useCallback(() => {
    setSaveModalState({ open: false, mode: 'create', draft: null });
    setSaveError(null);
    setIsSubmittingSavedSearch(false);
  }, []);

  const handleApplySavedSearch = useCallback(
    (search) => {
      setSelectedCategory(search.category ?? DEFAULT_CATEGORY);
      setQuery(search.query ?? '');
      setFilters(normaliseFilters(search.filters));
      setSort(search.sort ?? 'default');
      setActiveSavedSearchId(search.id);
      setViewportBounds(null);
      setPage(1);
      lastTrackedQueryRef.current = null;
      analytics.track('web_explorer_saved_search_applied', { id: search.id, category: search.category });
    },
    [],
  );

  const handleDeleteSavedSearch = useCallback(async (search) => {
    await deleteSavedSearch(search);
    if (activeSavedSearchId === search.id) {
      setActiveSavedSearchId(null);
    }
    analytics.track('web_explorer_saved_search_deleted', { id: search.id });
  }, [deleteSavedSearch, activeSavedSearchId]);

  const handleEditSavedSearch = useCallback(
    (search) => {
      if (!search) {
        return;
      }
      openSaveModal('update', {
        id: search.id,
        name: search.name,
        notifyByEmail: search.notifyByEmail ?? false,
        notifyInApp: search.notifyInApp ?? true,
      });
    },
    [openSaveModal],
  );

  const handleSortChange = useCallback((event) => {
    const nextSort = event.target.value;
    setSort(nextSort);
    setActiveSavedSearchId(null);
    analytics.track('web_explorer_sort_changed', { category: selectedCategory, sort: nextSort });
  }, [selectedCategory]);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    analytics.track('web_explorer_view_mode_changed', { mode });
  }, []);

  const handlePageChange = useCallback(
    (nextPage) => {
      const clamped = Math.max(1, Math.min(totalPages, nextPage));
      setPage(clamped);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [totalPages],
  );

  const currentCategory = getCategoryById(selectedCategory);

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-6">
        <PageHeader
          eyebrow="Explorer"
          title="Search across the Gigvora ecosystem"
          description="Discover roles, gigs, projects, launchpad cohorts, and volunteer missions in one place. Saved searches and alerts keep you ahead of new opportunities."
          meta={
            <DataStatus
              loading={searchState.loading}
              fromCache={searchState.fromCache}
              lastUpdated={searchState.lastUpdated}
              onRefresh={() => searchState.refresh({ force: true })}
            />
          }
        />

        <div className="mt-8 grid gap-8 lg:grid-cols-[320px,minmax(0,1fr)]">
          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <p className="text-sm font-semibold text-slate-900">Saved searches</p>
              <p className="mt-1 text-xs text-slate-500">Sync filters across devices and receive proactive alerts.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openSaveModal('create')}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  <PlusIcon className="h-4 w-4" aria-hidden="true" /> Save current search
                </button>
                {activeSavedSearch ? (
                  <button
                    type="button"
                    onClick={() => handleEditSavedSearch(activeSavedSearch)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                  >
                    <BookmarkIcon className="h-4 w-4" aria-hidden="true" /> Edit active search
                  </button>
                ) : null}
              </div>
              <div className="mt-5">
                <SavedSearchList
                  savedSearches={savedSearches}
                  onApply={handleApplySavedSearch}
                  onDelete={handleDeleteSavedSearch}
                  loading={savedSearchesLoading}
                  activeSearchId={activeSavedSearchId}
                  canManageServerSearches={canUseServer}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <p className="text-sm font-semibold text-slate-900">Suggested connections</p>
              <p className="mt-1 text-xs text-slate-500">
                Based on your interest signals: {engagementSignals.interests.slice(0, 4).join(' • ') || 'community builders'}
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                {engagementSignals.connectionSuggestions.slice(0, 3).map((connection) => (
                  <li key={connection.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={connection.name} seed={connection.name} size="xs" showGlow={false} />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{connection.name}</p>
                        <p className="text-xs text-slate-500">{connection.headline}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{connection.reason}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <Link to="/connections" className="font-semibold text-accent hover:text-accentDark">
                  Open network centre
                </Link>
                <span>{engagementSignals.connectionSuggestions.length} tailored matches</span>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <p className="text-sm font-semibold text-slate-900">Groups to explore</p>
              <p className="mt-1 text-xs text-slate-500">
                Curated from your causes and teams you collaborate with.
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                {engagementSignals.groupSuggestions.slice(0, 3).map((group) => (
                  <li key={group.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{group.description}</p>
                    <p className="mt-2 text-xs text-slate-400">{group.members} members · {group.focus.slice(0, 2).join(' • ')}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-4 text-right text-xs text-accent">
                <Link to="/groups" className="font-semibold hover:text-accentDark">
                  View all groups
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <p className="text-sm font-semibold text-slate-900">Trending now</p>
              <p className="mt-1 text-xs text-slate-500">Fresh opportunities pulling in the most interest this week.</p>
              {snapshotState.loading ? (
                <div className="mt-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                  ))}
                </div>
              ) : (
                <ul className="mt-4 space-y-4">
                  {trendingAcrossCategories.slice(0, 5).map((item) => (
                    <li key={`${item.category}-${item.id}`} className="group flex items-start gap-3">
                      <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                        {item.categoryLabel?.charAt(0)}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-accent">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.description?.slice(0, 110) || 'Opportunity posted recently'}</p>
                      </div>
                    </li>
                  ))}
                  {!trendingAcrossCategories.length ? (
                    <li className="rounded-2xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">
                      Opportunities will appear here as soon as ingestion syncs complete.
                    </li>
                  ) : null}
                </ul>
              )}
            </div>
          </aside>

          <div>
            <form className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(event) => event.preventDefault()}>
              <label className="sr-only" htmlFor="explorer-search">
                Search keyword
              </label>
              <input
                id="explorer-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={currentCategory.placeholder}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm transition focus:border-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/30"
              />

              <div className="mt-6 flex flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryChange(category.id)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                      selectedCategory === category.id
                        ? 'bg-accent text-white shadow-soft'
                        : 'border border-slate-200 text-slate-600 hover:border-accent hover:text-accent'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              <p className="mt-6 text-xs text-slate-500">{currentCategory.tagline}</p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  <AdjustmentsHorizontalIcon className="h-4 w-4" aria-hidden="true" />
                  Refine filters
                  {hasFiltersApplied(filters) ? (
                    <span className="inline-flex h-5 min-w-[1.75rem] items-center justify-center rounded-full bg-accent/10 px-2 text-[0.6rem] font-semibold text-accent">
                      {activeFilterChips.length}
                    </span>
                  ) : null}
                </button>

                <div className="flex items-center gap-2 rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-600">
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('map')}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 transition ${
                      viewMode === 'map' ? 'bg-accent/10 text-accent' : 'text-slate-500 hover:text-accent'
                    }`}
                  >
                    <MapIcon className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Map view</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('list')}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 transition ${
                      viewMode === 'list' ? 'bg-accent/10 text-accent' : 'text-slate-500 hover:text-accent'
                    }`}
                  >
                    <ListBulletIcon className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">List view</span>
                  </button>
                </div>

                <label className="ml-auto flex items-center gap-2 text-xs text-slate-600">
                  Sort by
                  <select
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    value={sort}
                    onChange={handleSortChange}
                  >
                    {(SORT_OPTIONS[selectedCategory] ?? []).map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {activeFilterChips.length ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {activeFilterChips.map((chip) => (
                    <button
                      key={`${chip.key}-${chip.value}`}
                      type="button"
                      onClick={chip.onRemove}
                      className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[0.65rem] font-semibold text-accent transition hover:bg-accent hover:text-white"
                    >
                      {chip.label}: {chip.value}
                      <span aria-hidden="true">×</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-2 rounded-full border border-transparent bg-slate-100 px-3 py-1 text-[0.65rem] font-semibold text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                  >
                    Reset all
                  </button>
                </div>
              ) : null}
            </form>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="font-semibold text-slate-900">
                  Showing {Math.min(results.length, totalResults)} of {totalResults.toLocaleString()} results
                </span>
                {metrics?.processingTimeMs ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[0.65rem] text-slate-500">
                    <BellIcon className="h-3.5 w-3.5" aria-hidden="true" /> {metrics.processingTimeMs} ms via {metrics.source ?? 'search'}
                  </span>
                ) : null}
                {searchState.error ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[0.65rem] text-amber-700">
                    <ExclamationCircleIcon className="h-3.5 w-3.5" aria-hidden="true" /> Unable to refresh live data
                  </span>
                ) : null}
              </div>

              {searchState.loading && !results.length ? (
                <div className="mt-8 space-y-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-36 animate-pulse rounded-3xl bg-slate-100" />
                  ))}
                </div>
              ) : null}

              {!searchState.loading && !results.length ? (
                <div className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                  No results match your filters yet. Try adjusting the filters or expanding the map view.
                </div>
              ) : null}

              {results.length ? (
                viewMode === 'map' ? (
                  <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                    <ExplorerMap items={results} onViewportChange={handleViewportChange} className="h-[520px]" />
                    <div className="max-h-[520px] space-y-4 overflow-y-auto pr-1">
                      {results.map((item) => (
                        <article
                          key={`${item.category}-${item.id}`}
                          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-accent"
                        >
                          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-accentDark">
                            {getCategoryById(item.category).label}
                          </span>
                          <h2 className="mt-2 text-base font-semibold text-slate-900">{item.title}</h2>
                          <p className="mt-1 line-clamp-3 text-xs text-slate-500">{item.description}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-[0.65rem] text-slate-500">
                            {toResultMeta(item).map((meta) => (
                              <span key={meta} className="rounded-full border border-slate-200 px-3 py-1">
                                {meta}
                              </span>
                            ))}
                          </div>
                          <div className="mt-4 flex items-center justify-between text-[0.6rem] text-slate-400">
                            <span>Updated {formatRelativeTime(item.updatedAt)}</span>
                            <button
                              type="button"
                              onClick={() => handleResultClick(item)}
                              className="text-accent hover:text-accentDark"
                            >
                              View details →
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 grid gap-5 lg:grid-cols-2">
                    {results.map((item) => (
                      <article
                        key={`${item.category}-${item.id}`}
                        className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-accent hover:shadow-soft"
                      >
                        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-accentDark">
                          {getCategoryById(item.category).label}
                        </span>
                        <h2 className="mt-3 text-lg font-semibold text-slate-900">{item.title}</h2>
                        <p className="mt-2 flex-1 text-sm text-slate-600">{item.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                          {toResultMeta(item).map((meta) => (
                            <span key={meta} className="rounded-full border border-slate-200 px-3 py-1">
                              {meta}
                            </span>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                          <span>Updated {formatRelativeTime(item.updatedAt)}</span>
                          <button
                            type="button"
                            onClick={() => handleResultClick(item)}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                          >
                            View details <span aria-hidden="true">→</span>
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )
              ) : null}

              {totalPages > 1 && results.length ? (
                <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                  <button
                    type="button"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className={`rounded-full border px-4 py-2 font-semibold transition ${
                      page === 1
                        ? 'cursor-not-allowed border-slate-200 text-slate-300'
                        : 'border-slate-200 text-slate-600 hover:border-accent hover:text-accent'
                    }`}
                  >
                    Previous
                  </button>
                  <span className="font-semibold text-slate-900">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className={`rounded-full border px-4 py-2 font-semibold transition ${
                      page === totalPages
                        ? 'cursor-not-allowed border-slate-200 text-slate-300'
                        : 'border-slate-200 text-slate-600 hover:border-accent hover:text-accent'
                    }`}
                  >
                    Next
                  </button>
                </div>
              ) : null}

              {searchState.lastUpdated ? (
                <p className="mt-6 text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">
                  Snapshot {formatRelativeTime(searchState.lastUpdated)} • {formatAbsolute(searchState.lastUpdated)}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <ExplorerFilterDrawer
        category={selectedCategory}
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        facets={facets}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      <Transition.Root show={saveModalState.open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleCloseSaveModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/50" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95"
                enterTo="translate-y-0 opacity-100 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="translate-y-0 opacity-100 sm:scale-100"
                leaveTo="translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white p-6 shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">
                    {saveModalState.mode === 'update' ? 'Update saved search' : 'Save this search'}
                  </Dialog.Title>
                  <p className="mt-1 text-sm text-slate-500">
                    Saved searches sync to your account. Enable alerts to receive email and in-app notifications when new matches arrive.
                  </p>

                  <div className="mt-5 space-y-5">
                    <div>
                      <label htmlFor="saved-search-name" className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                        Name
                      </label>
                      <input
                        id="saved-search-name"
                        type="text"
                        value={saveModalState.draft?.name ?? ''}
                        onChange={(event) =>
                          setSaveModalState((prev) => ({
                            ...prev,
                            draft: { ...prev.draft, name: event.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm transition focus:border-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/30"
                        placeholder="e.g. Remote product design roles"
                      />
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Alert me when</p>
                      <Switch.Group as="div" className="mt-4 flex items-center justify-between">
                        <div>
                          <Switch.Label className="text-sm font-semibold text-slate-900">In-app notifications</Switch.Label>
                          <Switch.Description className="text-xs text-slate-500">
                            Receive alerts in the Gigvora notification centre.
                          </Switch.Description>
                        </div>
                        <Switch
                          checked={saveModalState.draft?.notifyInApp ?? true}
                          onChange={(value) =>
                            setSaveModalState((prev) => ({
                              ...prev,
                              draft: { ...prev.draft, notifyInApp: value },
                            }))
                          }
                          className={`${
                            saveModalState.draft?.notifyInApp ? 'bg-accent' : 'bg-slate-200'
                          } relative inline-flex h-6 w-11 items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-accent/30`}
                        >
                          <span
                            className={`${
                              saveModalState.draft?.notifyInApp ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                          />
                        </Switch>
                      </Switch.Group>

                      <Switch.Group as="div" className="mt-4 flex items-center justify-between">
                        <div>
                          <Switch.Label className="text-sm font-semibold text-slate-900">Email alerts</Switch.Label>
                          <Switch.Description className="text-xs text-slate-500">
                            Send a summary email when new matches are published.
                          </Switch.Description>
                        </div>
                        <Switch
                          checked={saveModalState.draft?.notifyByEmail ?? false}
                          onChange={(value) =>
                            setSaveModalState((prev) => ({
                              ...prev,
                              draft: { ...prev.draft, notifyByEmail: value },
                            }))
                          }
                          className={`${
                            saveModalState.draft?.notifyByEmail ? 'bg-accent' : 'bg-slate-200'
                          } relative inline-flex h-6 w-11 items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-accent/30`}
                        >
                          <span
                            className={`${
                              saveModalState.draft?.notifyByEmail ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                          />
                        </Switch>
                      </Switch.Group>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                      <p className="font-semibold text-slate-900">Summary</p>
                      <p className="mt-1">Category: {currentCategory.label}</p>
                      <p className="mt-1">Query: {debouncedQuery || '—'}</p>
                      <p className="mt-1">Filters: {activeFilterChips.length || 0}</p>
                    </div>

                    {saveError ? (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-600">{saveError}</div>
                    ) : null}
                  </div>

                  <div className="mt-6 flex justify-between">
                    <button
                      type="button"
                      onClick={handleCloseSaveModal}
                      className="text-sm font-semibold text-slate-500 transition hover:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSearch}
                      disabled={isSubmittingSavedSearch}
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {isSubmittingSavedSearch ? 'Saving…' : 'Save search'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </section>
  );
}
