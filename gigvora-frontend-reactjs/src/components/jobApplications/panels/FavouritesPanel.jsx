import PropTypes from 'prop-types';
import { HeartIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatRelativeTime } from '../../../utils/date.js';

function formatPriority(priority) {
  if (!priority) return 'watching';
  return priority.replace(/_/g, ' ');
}

function formatSalaryRange(favourite) {
  const min = favourite.salaryMin;
  const max = favourite.salaryMax;
  if (min == null && max == null) {
    return '—';
  }
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: favourite.currencyCode ?? 'USD',
    maximumFractionDigits: 0,
  });
  if (min != null && max != null) {
    return `${formatter.format(Number(min))} – ${formatter.format(Number(max))}`;
  }
  if (min != null) {
    return `${formatter.format(Number(min))}+`;
  }
  return formatter.format(Number(max));
}

export default function FavouritesPanel({ favourites, onCreate, onEdit, onDelete }) {
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Saved roles</h2>
          <p className="text-sm text-slate-500">Keep watchlist roles ready</p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90"
        >
          Save role
        </button>
      </div>

      <div className="flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="h-full overflow-auto px-6 py-6">
          {favourites.length === 0 ? (
            <p className="text-center text-sm text-slate-400">No saved roles yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {favourites.map((favourite) => (
                <article
                  key={favourite.id}
                  className="flex h-full flex-col justify-between gap-4 rounded-3xl border border-slate-100 bg-slate-50/60 p-5 transition hover:border-accent/40 hover:bg-white"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">{favourite.title}</h3>
                        <p className="text-xs uppercase tracking-wide text-slate-500">{favourite.companyName ?? '—'}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600">
                        <HeartIcon className="h-4 w-4" aria-hidden="true" />
                        {formatPriority(favourite.priority)}
                      </span>
                    </div>
                    <dl className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="rounded-2xl bg-white px-3 py-2">
                        <dt className="font-semibold uppercase tracking-wide text-slate-500">Salary</dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-900">{formatSalaryRange(favourite)}</dd>
                      </div>
                      <div className="rounded-2xl bg-white px-3 py-2">
                        <dt className="font-semibold uppercase tracking-wide text-slate-500">Location</dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-900">{favourite.location ?? '—'}</dd>
                      </div>
                    </dl>
                    {favourite.tags?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {favourite.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {favourite.notes ? <p className="text-sm text-slate-600">{favourite.notes}</p> : null}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {favourite.savedAt ? `Saved ${formatRelativeTime(new Date(favourite.savedAt))}` : 'Saved recently'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(favourite)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                      >
                        <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(favourite)}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-1.5 font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        <TrashIcon className="h-4 w-4" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

FavouritesPanel.propTypes = {
  favourites: PropTypes.arrayOf(PropTypes.object).isRequired,
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
