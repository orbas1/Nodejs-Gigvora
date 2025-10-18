import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { formatRelativeTime } from '../../utils/date.js';

function titleCase(value) {
  if (!value) {
    return '';
  }
  return value
    .toString()
    .split(/[_\s-]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function resolveTypeLabel(type, catalog) {
  const match = catalog.find((entry) => entry.type === type);
  return match?.label ?? titleCase(type);
}

function formatStatus(status) {
  return titleCase(status);
}

function formatVisibility(value) {
  if (!value) {
    return 'Private';
  }
  const formatted = titleCase(value);
  if (value === 'connections') {
    return 'Connections only';
  }
  return formatted;
}

export default function CreationStudioItemList({
  items,
  summary,
  catalog,
  onSelectItem,
  onArchiveItem,
  onCreateNew,
  variant,
  onClose,
}) {
  const safeItems = Array.isArray(items) ? items : [];
  const hasItems = safeItems.length > 0;
  const containerClassName =
    variant === 'panel'
      ? 'flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm'
      : 'flex h-full flex-col gap-4';
  const tableWrapperClassName =
    variant === 'drawer'
      ? 'max-h-[60vh] overflow-y-auto rounded-2xl border border-slate-200'
      : 'overflow-x-auto rounded-2xl border border-slate-200';

  return (
    <div className={containerClassName}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Archive</h3>
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/user/creation-studio?create=1"
            className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white transition hover:bg-accent/90"
            onClick={onClose}
          >
            New
          </Link>
          <button
            type="button"
            onClick={() => onCreateNew?.()}
            className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/40 hover:text-accent"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: 'Drafts', value: summary?.drafts ?? 0 },
          { label: 'Scheduled', value: summary?.scheduled ?? 0 },
          { label: 'Live', value: summary?.published ?? 0 },
          { label: 'Types', value: Object.keys(summary?.byType ?? {}).length },
        ].map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">{metric.label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className={tableWrapperClassName}>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="pb-3 pr-4 font-semibold">Title</th>
              <th className="pb-3 pr-4 font-semibold">Type</th>
              <th className="pb-3 pr-4 font-semibold">Status</th>
              <th className="pb-3 pr-4 font-semibold">Visibility</th>
              <th className="pb-3 pr-4 font-semibold">Updated</th>
              <th className="pb-3 pr-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {hasItems ? (
              safeItems.map((item) => (
                <tr key={item.id} className="transition hover:bg-accentSoft/40">
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-slate-900">{item.title || 'Untitled'}</p>
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{resolveTypeLabel(item.type, catalog)}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700'
                          : item.status === 'scheduled'
                            ? 'bg-amber-50 text-amber-700'
                            : item.status === 'archived'
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-sky-50 text-sky-700'
                      }`}
                    >
                      {formatStatus(item.status)}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{formatVisibility(item.visibility)}</td>
                  <td className="py-3 pr-4 text-slate-500">{item.updatedAt ? formatRelativeTime(item.updatedAt) : '—'}</td>
                  <td className="py-3 pr-0 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectItem?.(item.id)}
                        className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/40 hover:text-accent"
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => onArchiveItem?.(item.id)}
                        className="inline-flex items-center rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300"
                      >
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-6 text-center text-sm text-slate-500">
                  Empty archive.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

CreationStudioItemList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  summary: PropTypes.shape({
    drafts: PropTypes.number,
    scheduled: PropTypes.number,
    published: PropTypes.number,
    byType: PropTypes.object,
  }),
  catalog: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      label: PropTypes.string,
    }),
  ),
  onSelectItem: PropTypes.func,
  onArchiveItem: PropTypes.func,
  onCreateNew: PropTypes.func,
  variant: PropTypes.oneOf(['panel', 'drawer']),
  onClose: PropTypes.func,
};

CreationStudioItemList.defaultProps = {
  items: [],
  summary: {},
  catalog: [],
  onSelectItem: undefined,
  onArchiveItem: undefined,
  onCreateNew: undefined,
  variant: 'panel',
  onClose: undefined,
};
