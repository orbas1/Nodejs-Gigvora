import PropTypes from 'prop-types';
import { PlusIcon } from '@heroicons/react/24/outline';

const STATUS_STYLES = {
  true: 'bg-emerald-100 text-emerald-700',
  false: 'bg-slate-200 text-slate-600',
};

function formatRoles(roles = []) {
  if (!roles.length) {
    return 'All roles';
  }
  return roles.join(', ');
}

function formatMimeTypes(types = []) {
  if (!types.length) {
    return 'Any type';
  }
  return types.slice(0, 3).join(', ') + (types.length > 3 ? '…' : '');
}

export default function StoragePresetsPanel({ presets = [], onAdd, onOpen } = {}) {
  return (
    <section id="storage-presets" className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">Presets</h2>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
        >
          <PlusIcon className="h-5 w-5" aria-hidden="true" />
          New preset
        </button>
      </div>

      {presets.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          No presets yet.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {presets.map((preset) => {
            const statusClass = STATUS_STYLES[preset.active] ?? STATUS_STYLES.false;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onOpen(preset)}
                className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-accent/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{preset.name}</p>
                    <p className="text-sm text-slate-500">{preset.locationName || 'All sites'}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
                    {preset.active ? 'Active' : 'Off'}
                  </span>
                </div>
                {preset.description ? (
                  <p className="mt-3 text-sm text-slate-600">{preset.description}</p>
                ) : null}
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Max size</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{preset.maxSizeLabel}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Expires</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{preset.expiresLabel}</p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-slate-600">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Mime types</p>
                  <p className="mt-1 font-semibold text-slate-900">{formatMimeTypes(preset.allowedMimeTypes)}</p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
                  <span className="rounded-full bg-slate-100 px-3 py-1">{formatRoles(preset.allowedRoles)}</span>
                  {preset.requireModeration ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Moderation</span>
                  ) : null}
                  {preset.encryption ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1">{preset.encryption}</span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

StoragePresetsPanel.propTypes = {
  presets: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      description: PropTypes.string,
      locationName: PropTypes.string,
      active: PropTypes.bool,
      maxSizeLabel: PropTypes.string,
      expiresLabel: PropTypes.string,
      allowedMimeTypes: PropTypes.arrayOf(PropTypes.string),
      allowedRoles: PropTypes.arrayOf(PropTypes.string),
      requireModeration: PropTypes.bool,
      encryption: PropTypes.string,
    }),
  ),
  onAdd: PropTypes.func,
  onOpen: PropTypes.func,
};

