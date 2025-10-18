import { useEffect, useState } from 'react';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  PlusIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return Number(value).toLocaleString();
}

export default function IdVerificationFilters({
  workspaceOptions = [],
  currentWorkspaceId,
  onWorkspaceChange,
  segments = [],
  activeSegment = 'all',
  onSegmentChange,
  sortOptions = [],
  currentSort = 'recent',
  onSortChange,
  searchValue = '',
  onSearchChange,
  onCreate,
  onRefresh,
  loading = false,
}) {
  const [search, setSearch] = useState(searchValue ?? '');
  const [mobileOpen, setMobileOpen] = useState(false);
  const resolvedSortOptions = sortOptions.length
    ? sortOptions
    : [
        { value: 'recent', label: 'Most recent' },
        { value: 'oldest', label: 'Oldest' },
      ];

  useEffect(() => {
    setSearch(searchValue ?? '');
  }, [searchValue]);

  const activeKey = segments.some((segment) => segment.key === activeSegment) ? activeSegment : 'all';

  function handleSearchChange(event) {
    const value = event.target.value;
    setSearch(value);
    onSearchChange?.(value);
  }

  function handleWorkspaceSelect(event) {
    const value = event.target.value;
    onWorkspaceChange?.(value ? Number(value) : undefined);
  }

  function handleSegmentClick(key) {
    onSegmentChange?.(key);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  }

  function handleSortChange(event) {
    onSortChange?.(event.target.value);
  }

  function handleRefreshClick() {
    onRefresh?.();
  }

  function handleCreateClick() {
    onCreate?.();
    if (mobileOpen) {
      setMobileOpen(false);
    }
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  const FiltersContent = ({ onClose }) => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Filters</h2>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            aria-label="Close filters"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="workspace-select" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Workspace
        </label>
        <select
          id="workspace-select"
          value={currentWorkspaceId ?? ''}
          onChange={handleWorkspaceSelect}
          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          <option value="">Select workspace</option>
          {workspaceOptions.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
        <div className="mt-2 grid gap-2">
          {segments.length ? (
            segments.map((segment) => {
              const isActive = activeKey === segment.key;
              return (
                <button
                  key={segment.key}
                  type="button"
                  onClick={() => handleSegmentClick(segment.key)}
                  className={classNames(
                    'flex items-center justify-between rounded-2xl border px-3 py-2 text-sm font-semibold transition',
                    isActive
                      ? 'border-accent bg-accent/10 text-accent shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-accent/40 hover:text-accent',
                  )}
                >
                  <span>{segment.label}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                    {formatNumber(segment.count)}
                  </span>
                </button>
              );
            })
          ) : (
            <span className="text-xs text-slate-400">No presets available.</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="id-verification-search" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Search
        </label>
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="id-verification-search"
            type="search"
            value={search}
            onChange={handleSearchChange}
            placeholder="Name, email, or ID"
            className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="id-verification-sort" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Sort
        </label>
        <div className="relative">
          <AdjustmentsHorizontalIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <select
            id="id-verification-sort"
            value={currentSort}
            onChange={handleSortChange}
            className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {resolvedSortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={handleCreateClick}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90"
        >
          <PlusIcon className="h-4 w-4" />
          New check
        </button>
        <button
          type="button"
          onClick={handleRefreshClick}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/40 hover:text-accent"
        >
          <ArrowPathIcon className={classNames('h-4 w-4', loading ? 'animate-spin' : '')} />
          Refresh
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-accent/40 hover:text-accent"
        >
          <FunnelIcon className="h-4 w-4" />
          Filters
        </button>
        <button
          type="button"
          onClick={handleCreateClick}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90"
        >
          <PlusIcon className="h-4 w-4" />
          New check
        </button>
      </div>

      {mobileOpen ? (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 bg-slate-900/40" onClick={closeMobile} aria-hidden="true" />
            <div className="absolute inset-y-0 right-0 flex w-full max-w-xs">
              <div className="ml-auto h-full w-full rounded-l-3xl bg-white p-6 shadow-xl">
                <FiltersContent onClose={closeMobile} />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <aside className="hidden lg:block">
        <div className="sticky top-24 flex max-h-[calc(100vh-8rem)] flex-col gap-6 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <FiltersContent />
        </div>
      </aside>
    </>
  );
}
