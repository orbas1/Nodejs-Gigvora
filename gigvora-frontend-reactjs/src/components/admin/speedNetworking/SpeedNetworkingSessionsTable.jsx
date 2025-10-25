import PropTypes from 'prop-types';
import StatusBadge from '../../common/StatusBadge.jsx';

function formatDate(value) {
  if (!value) return 'TBC';
  try {
    return new Date(value).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return value;
  }
}

const SPEED_STATUS_TONES = {
  draft: { tone: 'slate', variant: 'tint' },
  scheduled: { tone: 'blue', variant: 'tint' },
  in_progress: { tone: 'emerald', variant: 'tint' },
  completed: { tone: 'indigo', variant: 'tint' },
  cancelled: { tone: 'rose', variant: 'outline' },
  archived: { tone: 'slate', variant: 'outline' },
};

export default function SpeedNetworkingSessionsTable({
  sessions,
  loading,
  onSelect,
  onEdit,
  onDelete,
  pagination,
  onPageChange,
}) {
  const renderRows = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
            Loading sessions…
          </td>
        </tr>
      );
    }
    if (!sessions.length) {
      return (
        <tr>
          <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
            No sessions match these filters yet.
          </td>
        </tr>
      );
    }
    return sessions.map((session) => {
      const participantTotals = session.participantCounts ?? {};
      const totalParticipants = participantTotals.total ?? 0;
      const engaged = (participantTotals.checked_in ?? 0) + (participantTotals.active ?? 0) + (participantTotals.completed ?? 0);
      return (
        <tr key={session.id} className="border-t border-slate-100">
          <td className="px-6 py-4 text-sm text-slate-900">
            <button
              type="button"
              onClick={() => onSelect(session)}
              className="text-left font-semibold text-slate-900 transition hover:text-slate-600"
            >
              {session.title}
            </button>
            <p className="mt-1 text-xs text-slate-500">{session.description || 'No agenda provided yet.'}</p>
          </td>
          <td className="px-6 py-4 text-sm text-slate-600">
            <div className="flex flex-col">
              <span>{formatDate(session.scheduledStart)}</span>
              <span className="text-xs text-slate-400">Ends {formatDate(session.scheduledEnd)}</span>
            </div>
          </td>
          <td className="px-6 py-4 text-sm">
            <StatusBadge
              status={session.status}
              uppercase={false}
              size="xs"
              statusToneMap={SPEED_STATUS_TONES}
            />
          </td>
          <td className="px-6 py-4 text-sm text-slate-600">
            {session.host?.name ?? 'Unassigned'}
          </td>
          <td className="px-6 py-4 text-sm text-slate-600">
            <div className="flex flex-col">
              <span>{engaged} engaged</span>
              <span className="text-xs text-slate-400">{totalParticipants} total</span>
            </div>
          </td>
          <td className="px-6 py-4 text-right text-sm">
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => onEdit(session)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(session)}
                className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
              >
                Remove
              </button>
            </div>
          </td>
        </tr>
      );
    });
  };

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-2 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Scheduled sessions</h2>
          <p className="text-sm text-slate-500">Review every round, host assignment, and participant count at a glance.</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          {pagination?.total ?? 0} records
        </span>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Session
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Timing
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Host
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Participants
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">{renderRows()}</tbody>
        </table>
      </div>
      <footer className="flex flex-col gap-4 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-slate-500">
          Page {pagination?.page ?? 1} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={(pagination?.page ?? 1) <= 1}
            onClick={() => onPageChange(Math.max(1, (pagination?.page ?? 1) - 1))}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={(pagination?.page ?? 1) >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, (pagination?.page ?? 1) + 1))}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Next
          </button>
        </div>
      </footer>
    </section>
  );
}

SpeedNetworkingSessionsTable.propTypes = {
  sessions: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  pagination: PropTypes.shape({
    page: PropTypes.number,
    totalPages: PropTypes.number,
    total: PropTypes.number,
  }),
  onPageChange: PropTypes.func.isRequired,
};

SpeedNetworkingSessionsTable.defaultProps = {
  sessions: [],
  loading: false,
  pagination: null,
};
