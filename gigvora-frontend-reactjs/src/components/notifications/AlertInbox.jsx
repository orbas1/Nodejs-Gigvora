import { useEffect, useMemo, useState } from 'react';
import {
  BellIcon,
  CheckIcon,
  InboxStackIcon,
  NoSymbolIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'delivered', label: 'Sent' },
  { key: 'read', label: 'Read' },
  { key: 'archived', label: 'Archived' },
];

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'system', label: 'System' },
  { key: 'project', label: 'Projects' },
  { key: 'message', label: 'Messages' },
  { key: 'financial', label: 'Finance' },
  { key: 'marketing', label: 'Marketing' },
];

const PRIORITY_BADGES = {
  low: 'bg-slate-100 text-slate-600',
  normal: 'bg-blue-100 text-blue-600',
  high: 'bg-amber-100 text-amber-600',
  critical: 'bg-red-100 text-red-600',
};

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function getStatusTone(status) {
  switch (status) {
    case 'pending':
      return 'text-amber-600';
    case 'delivered':
      return 'text-blue-600';
    case 'read':
      return 'text-emerald-600';
    case 'dismissed':
      return 'text-slate-500';
    default:
      return 'text-slate-500';
  }
}

export default function AlertInbox({
  items,
  stats,
  filters,
  onFiltersChange,
  onRefresh,
  onLoadMore,
  onSelect,
  selectedId,
  loading,
  error,
  pagination,
  onMarkRead,
  onArchive,
  onMarkAll,
  actionBusy,
  markAllBusy,
  onClearError,
}) {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const selectedItem = useMemo(() => {
    return items.find((item) => item.id === selectedId) ?? null;
  }, [items, selectedId]);

  const hasMore = pagination?.page && pagination?.totalPages ? pagination.page < pagination.totalPages : false;

  const handleFilterChange = (type, value) => {
    const next = { ...localFilters, [type]: value };
    setLocalFilters(next);
    onClearError?.();
    onFiltersChange?.(next);
  };

  const handleSelect = (item) => {
    onClearError?.();
    if (!item) {
      onSelect?.(null);
      return;
    }
    onSelect?.(item.id);
  };

  const renderItem = (item) => {
    const unread = !item.readAt && item.status !== 'dismissed';
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleSelect(item)}
        className={classNames(
          'group flex w-full flex-col gap-2 rounded-2xl border px-4 py-3 text-left transition',
          selectedId === item.id
            ? 'border-blue-400 bg-blue-50'
            : unread
            ? 'border-blue-100 bg-white hover:border-blue-200 hover:bg-blue-50/50'
            : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-blue-50/30',
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={classNames(
                'flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600',
                unread ? 'bg-blue-600 text-white' : '',
              )}
            >
              <BellIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500">{formatRelativeTime(item.createdAt)}</p>
            </div>
          </div>
          <span className={classNames('rounded-full px-2 py-0.5 text-xs font-semibold', PRIORITY_BADGES[item.priority])}>
            {item.priority?.charAt(0).toUpperCase() + item.priority?.slice(1)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="capitalize">{item.category || 'system'}</span>
          <span className={classNames('font-medium uppercase tracking-wide', getStatusTone(item.status))}>{item.status}</span>
        </div>
        {item.payload?.ctaUrl ? (
          <p className="text-xs text-blue-600 underline">{item.payload.ctaLabel || 'Open link'}</p>
        ) : null}
      </button>
    );
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <InboxStackIcon className="h-5 w-5 text-blue-500" />
          <span>{stats.unread ?? 0} unread</span>
          <span className="text-slate-400">|</span>
          <span>{stats.total ?? 0} total</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              onClearError?.();
              onRefresh?.();
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600"
          >
            <ArrowPathIcon className={classNames('h-4 w-4', loading ? 'animate-spin' : '')} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              onClearError?.();
              onMarkAll?.();
            }}
            disabled={markAllBusy || (stats.unread ?? 0) === 0}
            className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          >
            <CheckIcon className={classNames('h-4 w-4', markAllBusy ? 'animate-spin' : '')} />
            Mark all read
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => handleFilterChange('status', option.key)}
              className={classNames(
                'rounded-full border px-3 py-1 text-xs font-semibold transition',
                localFilters.status === option.key
                  ? 'border-blue-500 bg-blue-100 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => handleFilterChange('category', option.key)}
              className={classNames(
                'rounded-full border px-3 py-1 text-xs font-semibold transition',
                localFilters.category === option.key
                  ? 'border-blue-500 bg-blue-100 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-hidden">
        <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-3">
          <div className="flex flex-col gap-3">
            {loading && items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-slate-500">
                <ArrowPathIcon className="h-6 w-6 animate-spin text-blue-500" />
                <span>Loading alerts…</span>
              </div>
            ) : null}
            {!loading && items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-slate-500">
                <NoSymbolIcon className="h-6 w-6 text-slate-400" />
                <span>No alerts here yet.</span>
              </div>
            ) : null}
            {items.map(renderItem)}
          </div>
        </div>
        {hasMore ? (
          <button
            type="button"
            onClick={() => {
              onClearError?.();
              onLoadMore?.();
            }}
            disabled={loading}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        ) : null}
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error.message || 'Could not load alerts.'}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 rounded-3xl border border-slate-100 bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Details</h3>
          {selectedItem ? (
            <span className="text-xs text-slate-500">{formatAbsolute(selectedItem.createdAt)}</span>
          ) : null}
        </div>
        {selectedItem ? (
          <div className="flex flex-col gap-3 text-sm text-slate-700">
            <p className="text-base font-semibold text-slate-900">{selectedItem.title}</p>
            <p className="text-sm text-slate-600">{selectedItem.body}</p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1">{selectedItem.category}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">{selectedItem.priority}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">{selectedItem.status}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedItem.payload?.ctaUrl ? (
                <a
                  href={selectedItem.payload.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:border-blue-300 hover:bg-blue-100"
                >
                  Visit
                </a>
              ) : null}
              {selectedItem.payload?.thumbnailUrl ? (
                <img
                  src={selectedItem.payload.thumbnailUrl}
                  alt={selectedItem.payload.imageAlt || 'Alert media'}
                  className="h-24 w-full rounded-2xl object-cover sm:w-40"
                />
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              {selectedItem.status !== 'read' && selectedItem.status !== 'dismissed' ? (
                <button
                  type="button"
                  onClick={() => {
                    onClearError?.();
                    onMarkRead?.(selectedItem.id);
                  }}
                  disabled={actionBusy === selectedItem.id}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {actionBusy === selectedItem.id ? 'Updating…' : 'Mark read'}
                </button>
              ) : null}
              {selectedItem.status !== 'dismissed' ? (
                <button
                  type="button"
                  onClick={() => {
                    onClearError?.();
                    onArchive?.(selectedItem.id);
                  }}
                  disabled={actionBusy === selectedItem.id}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300 disabled:cursor-not-allowed disabled:bg-slate-200"
                >
                  {actionBusy === selectedItem.id ? 'Working…' : 'Archive'}
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-sm text-slate-500">
            <BellIcon className="h-6 w-6 text-slate-400" />
            <span>Select an alert to view details.</span>
          </div>
        )}
      </div>
    </div>
  );
}
