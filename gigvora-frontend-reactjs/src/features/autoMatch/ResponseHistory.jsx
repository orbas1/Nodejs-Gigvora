import DataStatus from '../../components/DataStatus.jsx';
import { formatRelativeTime } from '../../utils/date.js';

const STATUS_LABELS = {
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
  reassigned: 'Reassigned',
};

const STATUS_TONES = {
  accepted: 'text-emerald-600',
  declined: 'text-rose-600',
  expired: 'text-slate-500',
  reassigned: 'text-violet-600',
};

function normalizeStatus(value) {
  if (!value) return '';
  return String(value).toLowerCase();
}

export default function ResponseHistory({ entries = [], loading, error, onRefresh }) {
  const rows = entries
    .map((entry) => ({
      ...entry,
      status: normalizeStatus(entry.status),
    }))
    .filter((entry) => entry.status && entry.status !== 'pending' && entry.status !== 'notified')
    .sort((a, b) => {
      const timeA = new Date(a.respondedAt ?? a.updatedAt ?? a.createdAt ?? 0).getTime();
      const timeB = new Date(b.respondedAt ?? b.updatedAt ?? b.createdAt ?? 0).getTime();
      return timeB - timeA;
    });

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">History</h2>
          <p className="text-sm text-slate-500">Latest responses</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
          disabled={loading}
        >
          Refresh
        </button>
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Match</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-700">
            {rows.map((entry) => {
              const statusLabel = STATUS_LABELS[entry.status] ?? entry.status;
              const tone = STATUS_TONES[entry.status] ?? 'text-slate-600';
              return (
                <tr key={entry.id ?? `${entry.targetId}-${entry.status}`}> 
                  <td className="px-4 py-3 font-medium text-slate-900">{entry.projectName ?? `Project ${entry.targetId}`}</td>
                  <td className={`px-4 py-3 font-semibold ${tone}`}>{statusLabel}</td>
                  <td className="px-4 py-3 text-sm">{entry.reasonLabel ?? entry.reasonCode ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{entry.responseNotes ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{formatRelativeTime(entry.respondedAt ?? entry.updatedAt ?? entry.createdAt)}</td>
                </tr>
              );
            })}
            {!rows.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                  No responses yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <DataStatus loading={loading} error={error} onRetry={onRefresh} />
    </section>
  );
}
