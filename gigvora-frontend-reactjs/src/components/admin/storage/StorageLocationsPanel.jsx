import PropTypes from 'prop-types';
import { PlusIcon } from '@heroicons/react/24/outline';

const STATUS_STYLES = {
  active: 'bg-emerald-100 text-emerald-700',
  maintenance: 'bg-amber-100 text-amber-700',
  disabled: 'bg-slate-200 text-slate-600',
};

function providerLabel(provider) {
  switch (provider) {
    case 'aws_s3':
      return 'Amazon S3';
    case 'azure_blob':
      return 'Azure Blob';
    case 'gcp_storage':
      return 'Google Cloud Storage';
    case 'digitalocean_spaces':
      return 'DigitalOcean Spaces';
    case 'cloudflare_r2':
      return 'Cloudflare R2';
    default:
      return provider;
  }
}

export default function StorageLocationsPanel({ locations, onAdd, onOpen }) {
  return (
    <section id="storage-locations" className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">Sites</h2>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
        >
          <PlusIcon className="h-5 w-5" aria-hidden="true" />
          New site
        </button>
      </div>

      {locations.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          No sites yet.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {locations.map((location) => {
            const statusClass = STATUS_STYLES[location.status] ?? STATUS_STYLES.disabled;
            return (
              <button
                key={location.id}
                type="button"
                onClick={() => onOpen(location)}
                className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-accent/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{location.name}</p>
                    <p className="text-sm text-slate-500">{providerLabel(location.provider)}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
                    {location.status}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Usage</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{location.metrics?.usageLabel}</p>
                    <p className="text-xs text-slate-500">{location.metrics?.objectLabel}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Daily flow</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{location.metrics?.ingestLabel}</p>
                    <p className="text-xs text-slate-500">{location.metrics?.egressLabel}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {location.isPrimary ? (
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Primary</span>
                  ) : null}
                  {location.versioningEnabled ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Versioning</span>
                  ) : null}
                  {location.replicationEnabled ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Replication</span>
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

StorageLocationsPanel.propTypes = {
  locations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      provider: PropTypes.string,
      status: PropTypes.string,
      isPrimary: PropTypes.bool,
      versioningEnabled: PropTypes.bool,
      replicationEnabled: PropTypes.bool,
      metrics: PropTypes.shape({
        usageLabel: PropTypes.string,
        objectLabel: PropTypes.string,
        ingestLabel: PropTypes.string,
        egressLabel: PropTypes.string,
      }),
    }),
  ),
  onAdd: PropTypes.func,
  onOpen: PropTypes.func,
};

StorageLocationsPanel.defaultProps = {
  locations: [],
  onAdd: undefined,
  onOpen: undefined,
};
