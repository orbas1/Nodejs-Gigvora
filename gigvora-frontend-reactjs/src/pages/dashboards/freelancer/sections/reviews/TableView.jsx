import { EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import StatusBadge from './StatusBadge.jsx';
import { formatDate } from './utils.js';
import FilterBar from './FilterBar.jsx';

function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) {
    return null;
  }

  const items = [];
  for (let index = 1; index <= totalPages; index += 1) {
    items.push(
      <button
        key={index}
        type="button"
        onClick={() => onPageChange(index)}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-semibold transition ${
          index === page
            ? 'border-blue-500 bg-blue-500 text-white'
            : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600'
        }`}
      >
        {index}
      </button>,
    );
  }

  return <div className="flex flex-wrap items-center gap-2">{items}</div>;
}

export default function TableView({
  reviews,
  filters,
  onFilterChange,
  onFilterReset,
  pagination,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  deletingId,
}) {
  const total = pagination?.total ?? reviews.length;
  const derivedPageSize = pagination?.pageSize;
  const pageSize = derivedPageSize != null ? derivedPageSize : Math.max(reviews.length, 1);
  const page = pagination?.page ?? 1;
  const totalPages = pagination?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = total ? Math.min(page * pageSize, total) : 0;

  return (
    <div className="space-y-5">
      <FilterBar filters={filters} onChange={onFilterChange} onReset={onFilterReset} />

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Client
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Title
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Rating
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Updated
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reviews.map((review) => (
              <tr key={review.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                  <div>{review.reviewerName || 'Client'}</div>
                  <div className="text-xs font-normal text-slate-500">{review.reviewerCompany || '—'}</div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">{review.title}</div>
                  {review.tags?.length ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {review.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-900">{review.rating ? review.rating.toFixed(1) : '—'}</td>
                <td className="px-4 py-4 text-sm text-slate-700">
                  <StatusBadge status={review.status} />
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">{formatDate(review.updatedAt ?? review.publishedAt ?? review.capturedAt)}</td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onView(review)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(review)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(review)}
                      disabled={deletingId === review.id}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-500 transition hover:border-rose-300 hover:text-rose-600 disabled:cursor-wait disabled:opacity-70"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!reviews.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                  No reviews match the filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Showing {start} - {end} of {total}
        </span>
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </div>
  );
}
