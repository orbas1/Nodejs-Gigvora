import PropTypes from 'prop-types';
import { PlusIcon } from '@heroicons/react/24/outline';

const STATUS_STYLES = {
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
  disabled: 'bg-slate-200 text-slate-600',
};

function formatTransition(rule) {
  if (!rule.transitionAfterDays && !rule.transitionStorageClass) {
    return 'No transition';
  }
  if (!rule.transitionStorageClass) {
    return `After ${rule.transitionAfterDays} days`;
  }
  if (!rule.transitionAfterDays) {
    return rule.transitionStorageClass;
  }
  return `After ${rule.transitionAfterDays} days → ${rule.transitionStorageClass}`;
}

function formatExpiration(rule) {
  if (!rule.expireAfterDays) {
    return rule.deleteExpiredObjects ? 'Immediate delete' : 'Keep';
  }
  return `${rule.expireAfterDays} days${rule.deleteExpiredObjects ? ' • delete' : ''}`;
}

export default function StorageRulesPanel({ rules = [], onAdd, onOpen } = {}) {
  return (
    <section id="storage-rules" className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">Rules</h2>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
        >
          <PlusIcon className="h-5 w-5" aria-hidden="true" />
          New rule
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          No rules yet.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {rules.map((rule) => {
            const statusClass = STATUS_STYLES[rule.status] ?? STATUS_STYLES.disabled;
            return (
              <button
                key={rule.id}
                type="button"
                onClick={() => onOpen(rule)}
                className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-accent/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{rule.name}</p>
                    <p className="text-sm text-slate-500">{rule.locationName || 'All sites'}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
                    {rule.status}
                  </span>
                </div>
                {rule.description ? (
                  <p className="mt-3 text-sm text-slate-600">{rule.description}</p>
                ) : null}
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Transition</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{formatTransition(rule)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Expiration</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{formatExpiration(rule)}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
                  {rule.compressObjects ? <span className="rounded-full bg-slate-100 px-3 py-1">Compression</span> : null}
                  {rule.deleteExpiredObjects ? <span className="rounded-full bg-slate-100 px-3 py-1">Delete</span> : null}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

StorageRulesPanel.propTypes = {
  rules: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      locationName: PropTypes.string,
      status: PropTypes.string,
      transitionAfterDays: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      transitionStorageClass: PropTypes.string,
      expireAfterDays: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      deleteExpiredObjects: PropTypes.bool,
      compressObjects: PropTypes.bool,
      description: PropTypes.string,
    }),
  ),
  onAdd: PropTypes.func,
  onOpen: PropTypes.func,
};

