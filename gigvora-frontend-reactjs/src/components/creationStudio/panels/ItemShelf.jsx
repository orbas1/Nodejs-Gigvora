import PropTypes from 'prop-types';
import { STATUS_OPTIONS, CREATION_TYPES } from '../config.js';

function StatusBadge({ status }) {
  const palette = {
    draft: 'bg-slate-100 text-slate-600',
    review: 'bg-amber-100 text-amber-700',
    scheduled: 'bg-indigo-100 text-indigo-700',
    published: 'bg-emerald-100 text-emerald-700',
    archived: 'bg-slate-200 text-slate-600',
  };
  const label = STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${palette[status] ?? palette.draft}`}>{label}</span>;
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};

const itemShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  title: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  updatedAt: PropTypes.string,
  visibility: PropTypes.string,
});

function ItemRow({ item, onOpen, onPreview }) {
  const typeLabel = CREATION_TYPES.find((type) => type.id === item.type)?.name ?? item.type;
  return (
    <li className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-3">
          <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
          <StatusBadge status={item.status} />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span>{typeLabel}</span>
          {item.updatedAt ? <span>Updated {new Date(item.updatedAt).toLocaleDateString()}</span> : null}
          {item.visibility ? <span>{item.visibility}</span> : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => onPreview(item)}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          Peek
        </button>
        <button
          type="button"
          onClick={() => onOpen(item)}
          className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          Edit
        </button>
      </div>
    </li>
  );
}

ItemRow.propTypes = {
  item: itemShape.isRequired,
  onOpen: PropTypes.func.isRequired,
  onPreview: PropTypes.func.isRequired,
};

export default function ItemShelf({
  items,
  loading,
  filters: filtersProp,
  onFilterChange,
  onOpenItem,
  onPreviewItem,
  onStartNew,
  onRefresh,
}) {
  const filters = filtersProp ?? {};
  const statusValue = filters.status ?? 'all';
  const typeValue = filters.type ?? 'all';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Work</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={onStartNew}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            New
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        <label className="flex items-center gap-2">
          <span className="font-medium text-slate-600">Status</span>
          <select
            value={statusValue}
            onChange={(event) => onFilterChange({ status: event.target.value === 'all' ? null : event.target.value })}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="font-medium text-slate-600">Type</span>
          <select
            value={typeValue}
            onChange={(event) => onFilterChange({ type: event.target.value === 'all' ? null : event.target.value })}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            {CREATION_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ul className="space-y-3">
        {items.length === 0 && !loading ? (
          <li className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Nothing here yet. Start by creating something on the left.
          </li>
        ) : null}
        {items.map((item) => (
          <ItemRow key={item.id} item={item} onOpen={onOpenItem} onPreview={onPreviewItem} />
        ))}
      </ul>
      {loading ? <p className="text-xs font-medium text-slate-500">Loading...</p> : null}
    </div>
  );
}

ItemShelf.propTypes = {
  items: PropTypes.arrayOf(itemShape).isRequired,
  loading: PropTypes.bool,
  filters: PropTypes.shape({
    status: PropTypes.string,
    type: PropTypes.string,
  }),
  onFilterChange: PropTypes.func.isRequired,
  onOpenItem: PropTypes.func.isRequired,
  onPreviewItem: PropTypes.func.isRequired,
  onStartNew: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
};
