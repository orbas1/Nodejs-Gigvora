import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { BookmarkIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function SavedSearchList({
  savedSearches,
  onApply,
  onDelete,
  loading,
  activeSearchId,
  canManageServerSearches,
}) {
  const sorted = useMemo(
    () =>
      [...savedSearches].sort((a, b) => {
        const nameA = a.name?.toLowerCase() ?? '';
        const nameB = b.name?.toLowerCase() ?? '';
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      }),
    [savedSearches],
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (!sorted.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        {canManageServerSearches
          ? 'Save your favourite filters to receive proactive launchpad and volunteer alerts.'
          : 'Create an account or sign in to sync saved searches across devices.'}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {sorted.map((search) => (
        <li key={search.id} className="group relative flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-accent">
          <button
            type="button"
            onClick={() => onApply(search)}
            className="flex flex-1 items-start gap-3 text-left"
          >
            <span
              className={`mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${
                activeSearchId === search.id
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}
            >
              <BookmarkIcon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{search.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {search.category ? search.category.charAt(0).toUpperCase() + search.category.slice(1) : 'Explorer'}
                {search.query ? ` • “${search.query}”` : ''}
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onDelete(search)}
            className="ml-4 rounded-full border border-transparent p-2 text-slate-400 transition hover:border-rose-100 hover:bg-rose-50 hover:text-rose-500"
          >
            <span className="sr-only">Delete saved search</span>
            <TrashIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

SavedSearchList.propTypes = {
  savedSearches: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      category: PropTypes.string,
      query: PropTypes.string,
    }),
  ),
  onApply: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  activeSearchId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  canManageServerSearches: PropTypes.bool,
};

SavedSearchList.defaultProps = {
  savedSearches: [],
  loading: false,
  activeSearchId: null,
  canManageServerSearches: false,
};
