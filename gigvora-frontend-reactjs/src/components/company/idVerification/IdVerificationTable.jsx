import { formatAbsolute, formatRelativeTime } from '../../../utils/date.js';

const STATUS_TOKENS = {
  pending: { label: 'Pending', tone: 'bg-amber-100 text-amber-800 border-amber-200' },
  submitted: { label: 'Submitted', tone: 'bg-sky-100 text-sky-800 border-sky-200' },
  in_review: { label: 'In review', tone: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  verified: { label: 'Verified', tone: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  rejected: { label: 'Rejected', tone: 'bg-rose-100 text-rose-800 border-rose-200' },
  expired: { label: 'Expired', tone: 'bg-slate-200 text-slate-700 border-slate-300' },
};

function StatusBadge({ status }) {
  const token = STATUS_TOKENS[status] ?? { label: status, tone: 'bg-slate-100 text-slate-700 border-slate-200' };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${token.tone}`}>
      {token.label}
    </span>
  );
}

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
        <StatusBadge status={item.status} />
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
