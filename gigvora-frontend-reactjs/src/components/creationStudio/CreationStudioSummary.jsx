import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { SparklesIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
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

export default function CreationStudioSummary({ data }) {
  const summary = data?.summary ?? {};
  const items = Array.isArray(data?.items) ? data.items : [];
  const catalog = Array.isArray(data?.catalog) ? data.catalog : [];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Studio</p>
          <h2 className="text-xl font-semibold text-slate-900">Launch fast</h2>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/user/creation-studio?create=1"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent/90"
          >
            <SparklesIcon className="h-4 w-4" aria-hidden="true" />
            New
          </Link>
          <Link
            to="/dashboard/user/creation-studio"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent/40 hover:text-accent"
          >
            Open
            <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Drafts</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{summary.drafts ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Scheduled</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{summary.scheduled ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Live</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{summary.published ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Types</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{Object.keys(summary.byType ?? {}).length}</p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {items.length ? (
          items.slice(0, 4).map((item) => {
            const type = catalog.find((entry) => entry.type === item.type)?.label ?? titleCase(item.type);
            return (
              <Link
                key={item.id}
                to={`/dashboard/user/creation-studio?item=${item.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 transition hover:border-accent/40 hover:text-accent"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{item.title || 'Untitled'}</p>
                  <p className="text-xs text-slate-500">{titleCase(item.status)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs text-slate-500">
                  <span>{type}</span>
                  {item.updatedAt ? <span>{formatRelativeTime(item.updatedAt)}</span> : null}
                </div>
              </Link>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-4 text-center text-xs text-slate-500">
            No entries yet.
          </div>
        )}
      </div>
    </div>
  );
}

CreationStudioSummary.propTypes = {
  data: PropTypes.shape({
    summary: PropTypes.shape({
      drafts: PropTypes.number,
      scheduled: PropTypes.number,
      published: PropTypes.number,
      byType: PropTypes.object,
    }),
    items: PropTypes.arrayOf(PropTypes.object),
    catalog: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
        label: PropTypes.string,
      }),
    ),
  }),
};

CreationStudioSummary.defaultProps = {
  data: { summary: {}, items: [], catalog: [] },
};
