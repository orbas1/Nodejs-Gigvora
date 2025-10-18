import PropTypes from 'prop-types';
import { Fragment } from 'react';
import { MagnifyingGlassIcon, PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { CREATION_STUDIO_STATUSES, getCreationStatus, getCreationType } from '../../../constants/creationStudio.js';
import { formatAbsolute, formatRelativeTime } from '../../../utils/date.js';

function StatusFilters({ value, onChange }) {
  const options = [{ id: 'all', label: 'All' }, ...CREATION_STUDIO_STATUSES];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              active ? 'bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {option.label ?? option.id}
          </button>
        );
      })}
    </div>
  );
}

StatusFilters.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

function SubTypeTabs({ options, value, onChange }) {
  if (!Array.isArray(options) || options.length <= 1) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 p-1 text-xs font-semibold text-slate-600">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`rounded-full px-3 py-1 transition ${
            value === option.id ? 'bg-white text-slate-900 shadow' : 'hover:text-slate-900'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

SubTypeTabs.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string.isRequired, label: PropTypes.string.isRequired }),
  ),
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

SubTypeTabs.defaultProps = {
  options: [],
};

function ItemCard({ item, onPreview, onEdit, onPublish, onDelete, canManage }) {
  const type = getCreationType(item.type);
  const status = getCreationStatus(item.status);
  const budget = item.budgetAmount && item.budgetCurrency ? `${item.budgetCurrency} ${item.budgetAmount}` : null;
  const compensation =
    item.compensationMin && item.compensationMax
      ? `${item.compensationCurrency ?? ''} ${item.compensationMin} - ${item.compensationMax}`.trim()
      : null;
  return (
    <article className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-500">{type?.label ?? item.type}</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">{item.title}</h3>
          </div>
          {status ? (
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.badge}`}>{status.label}</span>
          ) : null}
        </div>
        {item.summary ? <p className="text-sm text-slate-600 line-clamp-3">{item.summary}</p> : null}
        <dl className="grid grid-cols-2 gap-3 text-xs text-slate-500">
          {item.location ? (
            <Fragment>
              <dt className="font-semibold text-slate-600">Location</dt>
              <dd>{item.location}</dd>
            </Fragment>
          ) : null}
          {item.launchDate ? (
            <Fragment>
              <dt className="font-semibold text-slate-600">Launch</dt>
              <dd>{formatAbsolute(item.launchDate)}</dd>
            </Fragment>
          ) : null}
          {item.publishAt ? (
            <Fragment>
              <dt className="font-semibold text-slate-600">Publish</dt>
              <dd>{formatAbsolute(item.publishAt)}</dd>
            </Fragment>
          ) : null}
          {item.updatedAt ? (
            <Fragment>
              <dt className="font-semibold text-slate-600">Updated</dt>
              <dd>{formatRelativeTime(item.updatedAt)}</dd>
            </Fragment>
          ) : null}
          {budget ? (
            <Fragment>
              <dt className="font-semibold text-slate-600">Budget</dt>
              <dd>{budget}</dd>
            </Fragment>
          ) : null}
          {compensation ? (
            <Fragment>
              <dt className="font-semibold text-slate-600">Comp</dt>
              <dd>{compensation}</dd>
            </Fragment>
          ) : null}
        </dl>
        {Array.isArray(item.tags) && item.tags.length ? (
          <div className="flex flex-wrap gap-2">
            {item.tags.slice(0, 6).map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPreview(item)}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          Preview
        </button>
        {canManage ? (
          <>
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              Edit
            </button>
            {item.status !== 'published' ? (
              <button
                type="button"
                onClick={() => onPublish(item)}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
              >
                Publish
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
            >
              Delete
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}

ItemCard.propTypes = {
  item: PropTypes.object.isRequired,
  onPreview: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onPublish: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  canManage: PropTypes.bool,
};

ItemCard.defaultProps = {
  canManage: false,
};

export default function CreationStudioBoard({
  items,
  loading,
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  onResetSearch,
  onCreate,
  onPreview,
  onEdit,
  onPublish,
  onDelete,
  canManage,
  activeType,
  subTypes,
  onTypeChange,
}) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search"
                className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              />
            </div>
            <button
              type="button"
              onClick={onResetSearch}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:border-slate-300 hover:text-slate-700"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Reset
            </button>
          </div>
          <StatusFilters value={statusFilter} onChange={onStatusFilterChange} />
          <SubTypeTabs options={subTypes} value={activeType} onChange={onTypeChange} />
        </div>
        {canManage ? (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 self-start rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90"
          >
            <PlusIcon className="h-4 w-4" />
            New
          </button>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex items-center justify-center rounded-3xl border border-slate-200 bg-white/60 p-12 text-sm text-slate-500">
            Loading...
          </div>
        ) : null}
        {!loading && (!items || items.length === 0) ? (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-200 bg-white/60 p-12 text-center text-sm text-slate-500">
            No items yet. {canManage ? 'Create your first one to get started.' : ''}
          </div>
        ) : null}
        {items?.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            onPreview={onPreview}
            onEdit={onEdit}
            onPublish={onPublish}
            onDelete={onDelete}
            canManage={canManage}
          />
        ))}
      </div>
    </section>
  );
}

CreationStudioBoard.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  statusFilter: PropTypes.string.isRequired,
  onStatusFilterChange: PropTypes.func.isRequired,
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onResetSearch: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  onPreview: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onPublish: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  canManage: PropTypes.bool,
  activeType: PropTypes.string.isRequired,
  subTypes: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string.isRequired, label: PropTypes.string.isRequired }),
  ),
  onTypeChange: PropTypes.func.isRequired,
};

CreationStudioBoard.defaultProps = {
  items: [],
  loading: false,
  canManage: false,
  subTypes: [],
};
