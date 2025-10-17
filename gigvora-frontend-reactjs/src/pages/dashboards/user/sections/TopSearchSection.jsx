import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { MagnifyingGlassCircleIcon } from '@heroicons/react/24/outline';
import TopSearchMetrics from './TopSearchMetrics.jsx';
import TopSearchSavedSearches from './TopSearchSavedSearches.jsx';
import TopSearchSchedule from './TopSearchSchedule.jsx';
import TopSearchRecommendations from './TopSearchRecommendations.jsx';
import TopSearchEditorDialog from './TopSearchEditorDialog.jsx';
import TopSearchKeywords from './TopSearchKeywords.jsx';
import TopSearchDetailDrawer from './TopSearchDetailDrawer.jsx';
import { buildExplorerSearchUrl } from '../../../../utils/explorer.js';

function computeKeywordHighlights(savedSearches, limit = 6) {
  const tokens = new Map();
  savedSearches.forEach((search) => {
    if (!search.query) return;
    const parts = `${search.query}`
      .split(/\s+/)
      .map((part) => part.replace(/[^\w#\+\-]/g, '').toLowerCase())
      .filter((part) => part.length >= 3);
    parts.forEach((part) => {
      tokens.set(part, (tokens.get(part) ?? 0) + 1);
    });
  });
  return Array.from(tokens.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([keyword, count]) => ({ keyword, count }));
}

function buildCategoryFallback(distributionCategories) {
  if (!Array.isArray(distributionCategories) || !distributionCategories.length) {
    return [];
  }

  return distributionCategories.slice(0, 3).map((item) => ({
    id: item.key,
    label: item.label,
    totalRoles: item.count,
    insight:
      item.count === 1
        ? 'Tracked in 1 saved search.'
        : `Tracked in ${item.count} saved searches.`,
  }));
}

function buildLocationFallback(savedSearches) {
  const locationCounts = new Map();
  let remoteEnabled = 0;

  savedSearches.forEach((search) => {
    if (search?.filters?.isRemote) {
      remoteEnabled += 1;
    }

    const locations = Array.isArray(search?.filters?.locations) ? search.filters.locations : [];
    locations.forEach((location) => {
      const trimmed = `${location}`.trim();
      if (!trimmed) {
        return;
      }
      locationCounts.set(trimmed, (locationCounts.get(trimmed) ?? 0) + 1);
    });
  });

  const entries = Array.from(locationCounts.entries())
    .map(([location, count]) => ({
      location,
      totalRoles: count,
      insight: count === 1 ? 'Tracked in one saved search.' : `Tracked in ${count} saved searches.`,
    }))
    .sort((a, b) => b.totalRoles - a.totalRoles)
    .slice(0, 3);

  if (!entries.length && remoteEnabled > 0) {
    entries.push({
      location: 'Remote friendly',
      totalRoles: remoteEnabled,
      insight: 'Remote-first filters applied across your saved searches.',
    });
  }

  return entries;
}

function buildGigFallback(savedSearches) {
  const gigSearches = savedSearches.filter(
    (search) => `${search?.category ?? ''}`.toLowerCase() === 'gig',
  );
  if (!gigSearches.length) {
    return [];
  }

  return gigSearches.slice(0, 3).map((search) => {
    const organizations = Array.isArray(search?.filters?.organizations)
      ? search.filters.organizations
      : [];
    const locations = Array.isArray(search?.filters?.locations) ? search.filters.locations : [];
    const organizationLabel = organizations.slice(0, 2).join(', ');
    const locationLabel = locations.slice(0, 2).join(', ');

    let insight = 'Monitoring gig marketplace opportunities.';
    if (organizationLabel) {
      const suffix = organizations.length > 2 ? ` +${organizations.length - 2}` : '';
      insight = `Watching teams like ${organizationLabel}${suffix}.`;
    } else if (locationLabel) {
      const suffix = locations.length > 2 ? ` +${locations.length - 2}` : '';
      insight = `Focused on gigs near ${locationLabel}${suffix}.`;
    } else if (search?.query) {
      insight = `Tracking gigs for “${search.query}”.`;
    }

    return {
      id: search.id,
      label: search.name ?? 'Gig saved search',
      totalListings: Math.max(organizations.length || locations.length || 0, 1),
      insight,
    };
  });
}

function mergeRecommendations({ savedSearches, stats, recommendations }) {
  const base = {
    categoryHighlights: Array.isArray(recommendations?.categoryHighlights)
      ? recommendations.categoryHighlights
      : [],
    locationHighlights: Array.isArray(recommendations?.locationHighlights)
      ? recommendations.locationHighlights
      : [],
    gigHighlights: Array.isArray(recommendations?.gigHighlights)
      ? recommendations.gigHighlights
      : [],
  };

  if (!base.categoryHighlights.length) {
    base.categoryHighlights = buildCategoryFallback(stats?.distribution?.categories);
  }

  if (!base.locationHighlights.length) {
    base.locationHighlights = buildLocationFallback(savedSearches);
  }

  if (!base.gigHighlights.length) {
    base.gigHighlights = buildGigFallback(savedSearches);
  }

  return base;
}

function computeLocalStats(savedSearches, fallbackStats) {
  const totals = {
    saved: savedSearches.length,
    withEmailAlerts: 0,
    withInAppAlerts: 0,
    remoteEnabled: 0,
  };
  const categories = new Map();
  let overdue = 0;
  let dueSoon = 0;
  let nextRunAt = null;
  let lastTriggeredAt = null;
  const now = new Date();
  const dueSoonThreshold = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  savedSearches.forEach((search) => {
    const category = (search.category ?? 'mixed').toLowerCase();
    categories.set(category, (categories.get(category) ?? 0) + 1);

    if (search.notifyByEmail) totals.withEmailAlerts += 1;
    if (search.notifyInApp) totals.withInAppAlerts += 1;
    if (search.filters?.isRemote) totals.remoteEnabled += 1;

    if (search.lastTriggeredAt) {
      const last = new Date(search.lastTriggeredAt);
      if (!Number.isNaN(last.getTime())) {
        if (!lastTriggeredAt || last > lastTriggeredAt) {
          lastTriggeredAt = last;
        }
      }
    }

    if (search.nextRunAt) {
      const next = new Date(search.nextRunAt);
      if (!Number.isNaN(next.getTime())) {
        if (!nextRunAt || next < nextRunAt) {
          nextRunAt = next;
        }
        if (next < now) overdue += 1;
        else if (next <= dueSoonThreshold) dueSoon += 1;
      }
    }
  });

  const distributionCategories = Array.from(categories.entries())
    .map(([key, count]) => ({ key, label: key.charAt(0).toUpperCase() + key.slice(1), count }))
    .sort((a, b) => b.count - a.count);

  const keywordHighlights = fallbackStats?.keywordHighlights?.length
    ? fallbackStats.keywordHighlights
    : computeKeywordHighlights(savedSearches);

  return {
    totals: {
      ...fallbackStats?.totals,
      ...totals,
    },
    distribution: {
      ...fallbackStats?.distribution,
      categories: distributionCategories.length
        ? distributionCategories
        : fallbackStats?.distribution?.categories ?? [],
    },
    schedule: {
      nextRunAt: nextRunAt ? nextRunAt.toISOString() : fallbackStats?.schedule?.nextRunAt ?? null,
      lastTriggeredAt:
        lastTriggeredAt ? lastTriggeredAt.toISOString() : fallbackStats?.schedule?.lastTriggeredAt ?? null,
      overdue,
      dueSoon,
    },
    keywordHighlights,
  };
}

function computeUpcomingRuns(savedSearches, fallbackRuns) {
  const runs = savedSearches
    .map((search) => {
      if (!search.nextRunAt) return null;
      const next = new Date(search.nextRunAt);
      if (Number.isNaN(next.getTime())) return null;
      return {
        id: search.id,
        name: search.name,
        nextRunAt: next.toISOString(),
        frequency: search.frequency,
        notifyByEmail: Boolean(search.notifyByEmail),
        notifyInApp: Boolean(search.notifyInApp),
        status: next < new Date() ? 'overdue' : 'scheduled',
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.nextRunAt) - new Date(b.nextRunAt));

  if (runs.length) {
    return runs;
  }
  return Array.isArray(fallbackRuns) ? fallbackRuns : [];
}

export default function TopSearchSection({
  data,
  savedSearches,
  savedSearchesLoading,
  onCreateSavedSearch,
  onUpdateSavedSearch,
  onDeleteSavedSearch,
  onRunSavedSearch,
  onOpenExplorer,
}) {
  const [editorState, setEditorState] = useState({ open: false, mode: 'create', target: null });
  const [actionState, setActionState] = useState({ runningId: null, error: null });
  const [activeTab, setActiveTab] = useState('search');
  const [selectedSearch, setSelectedSearch] = useState(null);
  const [keywordFilter, setKeywordFilter] = useState([]);

  const savedSearchList = useMemo(() => {
    if (Array.isArray(savedSearches) && savedSearches.length) {
      return savedSearches;
    }
    if (Array.isArray(data?.savedSearches)) {
      return data.savedSearches;
    }
    return [];
  }, [savedSearches, data?.savedSearches]);

  const stats = useMemo(
    () => computeLocalStats(savedSearchList, data?.stats ?? null),
    [savedSearchList, data?.stats],
  );

  const upcomingRuns = useMemo(
    () => computeUpcomingRuns(savedSearchList, data?.upcomingRuns),
    [savedSearchList, data?.upcomingRuns],
  );

  const recommendations = data?.recommendations ?? null;
  const permissions = data?.permissions ?? { canCreate: true, canUpdate: true, canDelete: true, canRun: true };

  const normalizedRecommendations = useMemo(
    () =>
      mergeRecommendations({
        savedSearches: savedSearchList,
        stats,
        recommendations,
      }),
    [recommendations, savedSearchList, stats],
  );

  const filteredSavedSearches = useMemo(() => {
    if (!keywordFilter.length) {
      return savedSearchList;
    }
    const keywords = keywordFilter.map((item) => `${item}`.toLowerCase());
    return savedSearchList.filter((search) => {
      if (!search?.query) return false;
      const query = `${search.query}`.toLowerCase();
      return keywords.some((keyword) => query.includes(keyword));
    });
  }, [keywordFilter, savedSearchList]);

  const openCreateModal = useCallback(
    () => setEditorState({ open: true, mode: 'create', target: null }),
    [],
  );

  const openEditModal = useCallback((search) => {
    setEditorState({ open: true, mode: 'edit', target: search });
  }, []);

  const handleCloseEditor = useCallback(() => {
    setEditorState({ open: false, mode: 'create', target: null });
  }, []);

  const handleEditorSubmit = useCallback(
    async (payload) => {
      if (editorState.mode === 'edit' && editorState.target) {
        await onUpdateSavedSearch?.(editorState.target.id, payload);
      } else {
        await onCreateSavedSearch?.(payload);
      }
    },
    [editorState, onCreateSavedSearch, onUpdateSavedSearch],
  );

  const handleRun = useCallback(
    async (search) => {
      if (!onRunSavedSearch) return;
      try {
        setActionState({ runningId: search.id, error: null });
        await onRunSavedSearch(search.id);
        setActionState({ runningId: null, error: null });
      } catch (error) {
        setActionState({ runningId: null, error: error?.message ?? 'Unable to trigger the saved search.' });
      }
    },
    [onRunSavedSearch],
  );

  const handleDelete = useCallback(
    async (search) => {
      if (!onDeleteSavedSearch) return;
      let confirmed = true;
      if (typeof window !== 'undefined' && window.confirm) {
        confirmed = window.confirm(`Delete “${search.name}”? This action cannot be undone.`);
      }
      if (!confirmed) {
        return;
      }
      try {
        await onDeleteSavedSearch(search.id);
        setActionState((state) => ({ ...state, error: null }));
        setSelectedSearch((current) => (current?.id === search.id ? null : current));
      } catch (error) {
        setActionState({ runningId: null, error: error?.message ?? 'Unable to delete the saved search.' });
      }
    },
    [onDeleteSavedSearch],
  );

  const handleOpenExplorer = useCallback(
    (search) => {
      const url = buildExplorerSearchUrl(search);
      if (onOpenExplorer) {
        onOpenExplorer(url, search);
        return;
      }
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    [onOpenExplorer],
  );

  const handleSelectSearch = useCallback((search) => {
    setSelectedSearch(search);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedSearch(null);
  }, []);

  const handleKeywordSelection = useCallback((keywords) => {
    setKeywordFilter(keywords);
    if (keywords.length) {
      setActiveTab('search');
    }
  }, []);

  const tabs = [
    { id: 'search', label: 'Search' },
    { id: 'runs', label: 'Runs' },
    { id: 'signals', label: 'Signals' },
    { id: 'keywords', label: 'Keywords' },
  ];

  return (
    <section id="top-search" className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-accentSoft/40 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Dashboard / Search</p>
            <h1 className="mt-2 flex items-center gap-2 text-3xl font-semibold text-slate-900">
              <MagnifyingGlassCircleIcon className="h-8 w-8 text-accent" aria-hidden="true" />
              Search
            </h1>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            New search
          </button>
        </div>
      </div>

      <TopSearchMetrics stats={stats} />

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-accent text-white shadow'
                : 'border border-slate-200 text-slate-600 hover:border-accent/60 hover:text-accent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'search' ? (
        <TopSearchSavedSearches
          savedSearches={filteredSavedSearches}
          loading={savedSearchesLoading}
          onCreate={openCreateModal}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onRun={handleRun}
          onOpen={handleOpenExplorer}
          onSelect={handleSelectSearch}
          runningId={actionState.runningId}
          actionError={actionState.error}
          permissions={permissions}
          showCreateButton={false}
        />
      ) : null}

      {activeTab === 'runs' ? <TopSearchSchedule upcomingRuns={upcomingRuns} /> : null}

      {activeTab === 'signals' ? (
        <TopSearchRecommendations recommendations={normalizedRecommendations} />
      ) : null}

      {activeTab === 'keywords' ? (
        <TopSearchKeywords keywords={stats.keywordHighlights} onSelectionChange={handleKeywordSelection} />
      ) : null}

      <TopSearchEditorDialog
        open={editorState.open}
        mode={editorState.mode}
        initialValue={editorState.target}
        onClose={handleCloseEditor}
        onSubmit={handleEditorSubmit}
      />

      <TopSearchDetailDrawer
        open={Boolean(selectedSearch)}
        search={selectedSearch}
        onClose={handleCloseDrawer}
        onOpen={handleOpenExplorer}
        onRun={handleRun}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />
    </section>
  );
}

TopSearchSection.propTypes = {
  data: PropTypes.shape({
    savedSearches: PropTypes.array,
    stats: PropTypes.object,
    upcomingRuns: PropTypes.array,
    recommendations: PropTypes.object,
    permissions: PropTypes.object,
  }),
  savedSearches: PropTypes.array,
  savedSearchesLoading: PropTypes.bool,
  onCreateSavedSearch: PropTypes.func,
  onUpdateSavedSearch: PropTypes.func,
  onDeleteSavedSearch: PropTypes.func,
  onRunSavedSearch: PropTypes.func,
  onOpenExplorer: PropTypes.func,
};

TopSearchSection.defaultProps = {
  data: null,
  savedSearches: null,
  savedSearchesLoading: false,
  onCreateSavedSearch: async () => {},
  onUpdateSavedSearch: async () => {},
  onDeleteSavedSearch: async () => {},
  onRunSavedSearch: async () => {},
  onOpenExplorer: null,
};
