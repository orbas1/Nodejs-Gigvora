import PropTypes from 'prop-types';
import {
  PlusIcon,
  ArrowTopRightOnSquareIcon,
  PlayCircleIcon,
  TrashIcon,
  PencilSquareIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';
import { formatRelativeTime, formatAbsolute } from '../../../../utils/date.js';

function formatCategoryLabel(value) {
  if (!value) return 'Mixed opportunities';
  const normalised = `${value}`.toLowerCase();
  switch (normalised) {
    case 'job':
      return 'Jobs';
    case 'gig':
      return 'Gigs';
    case 'project':
      return 'Projects';
    case 'launchpad':
      return 'Launchpads';
    case 'volunteering':
      return 'Volunteering';
    case 'people':
      return 'People';
    case 'mixed':
      return 'Mixed';
    default:
      return normalised.charAt(0).toUpperCase() + normalised.slice(1);
  }
}

function formatFrequency(value) {
  if (!value) return 'Daily';
  const normalised = `${value}`.toLowerCase();
  switch (normalised) {
    case 'immediate':
      return 'Immediate';
    case 'daily':
      return 'Daily';
    case 'weekly':
      return 'Weekly';
    default:
      return normalised.charAt(0).toUpperCase() + normalised.slice(1);
  }
}

function SavedSearchSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-36 animate-pulse rounded-3xl bg-slate-100" />
      ))}
    </div>
  );
}

export default function TopSearchSavedSearches({
  savedSearches,
  loading,
  onCreate,
  onEdit,
  onDelete,
  onRun,
  onOpen,
  onSelect,
  runningId,
  actionError,
  permissions,
  showCreateButton,
}) {
  const canCreate = permissions?.canCreate ?? true;
  const canUpdate = permissions?.canUpdate ?? true;
  const canDelete = permissions?.canDelete ?? true;
  const canRun = permissions?.canRun ?? true;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Searches</h2>
        {canCreate && showCreateButton ? (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          >
            <PlusIcon className="h-5 w-5" aria-hidden="true" />
            New
          </button>
        ) : null}
      </div>

      {actionError ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">Action failed</div>
      ) : null}

      {loading ? (
        <div className="mt-6">
          <SavedSearchSkeleton />
        </div>
      ) : savedSearches.length ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {savedSearches.map((search) => {
            const lastRun = search.lastTriggeredAt ? formatRelativeTime(search.lastTriggeredAt) : 'Never';
            const nextRun = search.nextRunAt ? formatAbsolute(search.nextRunAt) : '—';
            return (
              <li
                key={search.id}
                className="group flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50/60 p-5 transition hover:border-accent/50 hover:bg-white"
              >
                <button
                  type="button"
                  onClick={() => onSelect?.(search)}
                  className="flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-accent">
                      {formatCategoryLabel(search.category)}
                    </span>
                    {search.filters?.isRemote ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                        Remote
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{search.name}</h3>
                  {search.query ? <p className="mt-1 truncate text-sm text-slate-500">“{search.query}”</p> : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1">
                      <BellAlertIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatFrequency(search.frequency)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1">Last {lastRun}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1">Next {nextRun}</span>
                  </div>

                  {Array.isArray(search.filters?.locations) && search.filters.locations.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {search.filters.locations.slice(0, 3).map((location) => (
                        <span
                          key={location}
                          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-600"
                        >
                          {location}
                        </span>
                      ))}
                      {search.filters.locations.length > 3 ? (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-500">
                          +{search.filters.locations.length - 3}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </button>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpen(search)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-accent/60 hover:text-accent"
                    >
                      <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Open</span>
                    </button>
                    {canRun ? (
                      <button
                        type="button"
                        onClick={() => onRun(search)}
                        disabled={runningId === search.id}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                      >
                        <PlayCircleIcon className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Run</span>
                      </button>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {canUpdate ? (
                      <button
                        type="button"
                        onClick={() => onEdit(search)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-accent/60 hover:text-accent"
                      >
                        <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Edit</span>
                      </button>
                    ) : null}
                    {canDelete ? (
                      <button
                        type="button"
                        onClick={() => onDelete(search)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 text-rose-600 transition hover:bg-rose-50"
                      >
                        <TrashIcon className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Delete</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
          {canCreate ? 'Create your first search.' : 'No searches available.'}
        </div>
      )}
    </div>
  );
}

TopSearchSavedSearches.propTypes = {
  savedSearches: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      category: PropTypes.string,
      query: PropTypes.string,
      frequency: PropTypes.string,
      filters: PropTypes.object,
      notifyByEmail: PropTypes.bool,
      notifyInApp: PropTypes.bool,
      lastTriggeredAt: PropTypes.string,
      nextRunAt: PropTypes.string,
    }),
  ),
  loading: PropTypes.bool,
  onCreate: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onRun: PropTypes.func,
  onOpen: PropTypes.func,
  onSelect: PropTypes.func,
  runningId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  actionError: PropTypes.string,
  permissions: PropTypes.shape({
    canCreate: PropTypes.bool,
    canUpdate: PropTypes.bool,
    canDelete: PropTypes.bool,
    canRun: PropTypes.bool,
  }),
  showCreateButton: PropTypes.bool,
};

TopSearchSavedSearches.defaultProps = {
  savedSearches: [],
  loading: false,
  onCreate: () => {},
  onEdit: () => {},
  onDelete: () => {},
  onRun: () => {},
  onOpen: () => {},
  onSelect: null,
  runningId: null,
  actionError: null,
  permissions: {
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canRun: true,
  },
  showCreateButton: true,
};
