import { formatAbsolute, formatRelativeTime } from '../../../utils/date.js';
import StatusBadge from '../../common/StatusBadge.jsx';

function TableRow({ item, onSelect }) {
  const displayName = item.fullName ?? item.user?.name ?? `${item.user?.firstName ?? ''} ${item.user?.lastName ?? ''}`.trim();
  const reviewerName = item.reviewer
    ? `${item.reviewer.firstName ?? ''} ${item.reviewer.lastName ?? ''}`.trim() || item.reviewer.email
    : 'Unassigned';
  return (
    <tr className="border-b border-slate-100 last:border-none">
      <td className="px-4 py-4">
        <div className="font-medium text-slate-900">{displayName || 'Workspace member'}</div>
        <div className="mt-1 text-xs text-slate-500">{item.user?.email ?? 'No email'}</div>
      </td>
      <td className="px-4 py-4">
        <StatusBadge status={item.status} category="identityVerification" uppercase={false} size="xs" />
      </td>
      <td className="px-4 py-4 text-sm text-slate-600">
        {item.submittedAt ? (
          <div>
            <div>{formatRelativeTime(item.submittedAt)}</div>
            <div className="text-xs text-slate-400">{formatAbsolute(item.submittedAt)}</div>
          </div>
        ) : (
          <span>—</span>
        )}
      </td>
      <td className="px-4 py-4 text-sm text-slate-600">{reviewerName}</td>
      <td className="px-4 py-4 text-sm text-slate-600">
        {item.updatedAt ? formatRelativeTime(item.updatedAt) : '—'}
      </td>
      <td className="px-4 py-4 text-right">
        <button
          type="button"
          onClick={() => onSelect?.(item)}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-accent transition hover:border-accent hover:bg-accent/10"
        >
          Open
        </button>
      </td>
    </tr>
  );
}

function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }
  const { page, totalPages } = pagination;
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
      <div>
        Page {page} of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange?.(Math.max(1, page - 1))}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function IdVerificationTable({ items = [], loading = false, error, onSelect, pagination, onPageChange }) {
  if (loading && !items.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Loading ID checks…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-6 text-sm text-rose-600">
        {error.message ?? 'Unable to load ID checks.'}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        No ID checks yet. Start one to track progress.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th scope="col" className="px-4 py-3">Person</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Submitted</th>
              <th scope="col" className="px-4 py-3">Reviewer</th>
              <th scope="col" className="px-4 py-3">Updated</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <TableRow key={item.id} item={item} onSelect={onSelect} />
            ))}
          </tbody>
        </table>
      </div>
      <Pagination pagination={pagination} onPageChange={onPageChange} />
    </div>
  );
}
