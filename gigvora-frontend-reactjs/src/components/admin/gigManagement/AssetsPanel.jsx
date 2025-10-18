import PropTypes from 'prop-types';
import { PlusIcon } from '@heroicons/react/24/outline';

function formatSize(bytes) {
  if (!bytes || Number.isNaN(Number(bytes))) {
    return '0 B';
  }
  const value = Number(bytes);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function AssetsPanel({ assets, projects, canManage, onAdd }) {
  const projectLookup = new Map(projects.map((project) => [Number(project.id), project]));
  const allAssets = assets.items ?? [];
  const brandAssets = assets.brandAssets ?? [];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assets</p>
          <p className="text-lg font-semibold text-slate-900">{allAssets.length} workspace files</p>
        </div>
        {canManage ? (
          <button
            type="button"
            onClick={onAdd}
            disabled={projects.length === 0}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusIcon className="h-4 w-4" />
            Add
          </button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{assets.summary?.total ?? 0}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Restricted</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{assets.summary?.restricted ?? 0}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Watermark</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {assets.summary?.watermarkCoverage != null
              ? `${Math.round(assets.summary.watermarkCoverage)}%`
              : '0%'}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Storage</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{formatSize(assets.summary?.storageBytes)}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {allAssets.map((asset) => {
          const project = projectLookup.get(Number(asset.projectId));
          return (
            <a
              key={`${asset.projectId}-${asset.id}`}
              href={asset.storageUrl}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{asset.label}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{asset.category || 'artifact'}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {asset.permissionLevel}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{project?.title ?? `Project ${asset.projectId}`}</span>
                <span>{formatSize(asset.sizeBytes)}</span>
              </div>
            </a>
          );
        })}
        {allAssets.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-500">
            No workspace assets yet.
          </div>
        ) : null}
      </div>

        {brandAssets.length ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Brand library</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {brandAssets.map((item) => (
              <a
                key={item.id}
                href={item.storageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-col rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs shadow-sm transition hover:border-slate-300"
              >
                <span className="text-sm font-semibold text-slate-900">{item.label}</span>
                <span className="mt-1 text-slate-500">{item.category}</span>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

AssetsPanel.propTypes = {
  assets: PropTypes.shape({
    items: PropTypes.array,
    summary: PropTypes.object,
    brandAssets: PropTypes.array,
  }).isRequired,
  projects: PropTypes.arrayOf(PropTypes.object).isRequired,
  canManage: PropTypes.bool,
  onAdd: PropTypes.func.isRequired,
};

AssetsPanel.defaultProps = {
  canManage: true,
};
