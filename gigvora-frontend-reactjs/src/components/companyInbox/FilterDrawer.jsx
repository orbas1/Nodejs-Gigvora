import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { classNames } from '../../utils/classNames.js';

export default function FilterDrawer({
  open,
  filters,
  onChange,
  onClose,
  onReset,
  channelOptions,
  stateOptions,
  statusOptions,
  labels,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      <button type="button" className="hidden flex-1 bg-slate-900/50 lg:block" onClick={onClose} aria-label="Close filters" />
      <div className="ml-auto flex h-full w-full max-w-md flex-col overflow-hidden rounded-l-3xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FunnelIcon className="h-5 w-5 text-accent" />
            Filters
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
          >
            <XMarkIcon className="h-4 w-4" />
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          <div className="space-y-6 text-sm text-slate-600">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Search
              <input
                type="search"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Subject or preview"
                value={filters.search}
                onChange={(event) => onChange('search', event.target.value)}
              />
            </label>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Channel</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {channelOptions.map((option) => {
                  const active = filters.channelTypes.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        onChange(
                          'channelTypes',
                          active
                            ? filters.channelTypes.filter((value) => value !== option.value)
                            : [...filters.channelTypes, option.value],
                        )
                      }
                      className={classNames(
                        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition',
                        active ? 'bg-accent text-white shadow-soft' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">State</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {stateOptions.map((option) => {
                  const active = filters.states.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        onChange(
                          'states',
                          active
                            ? filters.states.filter((value) => value !== option.value)
                            : [...filters.states, option.value],
                        )
                      }
                      className={classNames(
                        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition',
                        active ? 'bg-emerald-500 text-white shadow-soft' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Labels</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {labels.length ? (
                  labels.map((label) => {
                    const active = filters.labelIds.includes(label.id);
                    return (
                      <button
                        key={label.id}
                        type="button"
                        onClick={() =>
                          onChange(
                            'labelIds',
                            active
                              ? filters.labelIds.filter((value) => value !== label.id)
                              : [...filters.labelIds, label.id],
                          )
                        }
                        className={classNames(
                          'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition',
                          active ? 'bg-accent text-white shadow-soft' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                        )}
                      >
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color }} />
                        {label.name}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400">No labels yet.</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Support</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {statusOptions.map((option) => {
                  const active = filters.supportStatuses.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        onChange(
                          'supportStatuses',
                          active
                            ? filters.supportStatuses.filter((value) => value !== option.value)
                            : [...filters.supportStatuses, option.value],
                        )
                      }
                      className={classNames(
                        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition',
                        active ? 'bg-rose-500 text-white shadow-soft' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <input
                type="checkbox"
                checked={filters.unreadOnly}
                onChange={(event) => onChange('unreadOnly', event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              />
              Unread
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
