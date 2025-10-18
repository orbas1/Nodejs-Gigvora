import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { formatRelativeTime } from '../../utils/date.js';
import formatDateTime from '../../utils/formatDateTime.js';
import classNames from '../../utils/classNames.js';
import { formatStatusLabel, resolveSessionLabel } from './utils.js';

const FILTERS = [
  { id: 'All', predicate: () => true },
  {
    id: 'Upcoming',
    predicate: (booking) => {
      const start = booking.session?.startTime ? new Date(booking.session.startTime) : null;
      return start && start.getTime() > Date.now();
    },
  },
  {
    id: 'Past',
    predicate: (booking) => {
      const end = booking.session?.endTime ? new Date(booking.session.endTime) : null;
      if (end && end.getTime() < Date.now()) {
        return true;
      }
      return Boolean(booking.completedAt);
    },
  },
  {
    id: 'Checked',
    predicate: (booking) => Boolean(booking.checkedInAt),
  },
];

function StatusBadge({ status }) {
  const label = formatStatusLabel(status);
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{label}</span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string,
};

StatusBadge.defaultProps = {
  status: 'Unknown',
};

function FilterBar({ active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => {
        const isActive = filter.id === active;
        return (
          <button
            key={filter.id}
            type="button"
            className={classNames(
              'rounded-full px-3 py-1 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2',
              isActive
                ? 'bg-slate-900 text-white shadow-sm focus:ring-slate-200'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 focus:ring-slate-300',
            )}
            onClick={() => onChange(filter.id)}
          >
            {filter.id}
          </button>
        );
      })}
    </div>
  );
}

FilterBar.propTypes = {
  active: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default function NetworkingSessionsPanel({
  bookings,
  activeFilter,
  onChangeFilter,
  onCreate,
  onEdit,
  onOpen,
}) {
  const filterDefinition = useMemo(
    () => FILTERS.find((filter) => filter.id === activeFilter) ?? FILTERS[0],
    [activeFilter],
  );

  const filteredBookings = useMemo(
    () => bookings.filter((booking) => filterDefinition.predicate(booking)),
    [bookings, filterDefinition],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar active={filterDefinition.id} onChange={onChangeFilter} />
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
            onClick={onCreate}
          >
            Add
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filteredBookings.length ? (
          filteredBookings.map((booking) => {
            const sessionLabel = resolveSessionLabel(booking.session, booking.sessionId);
            const start = booking.session?.startTime ? formatDateTime(booking.session.startTime) : 'TBC';
            const joinUrl = booking.joinUrl;
            return (
              <div key={booking.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{sessionLabel}</p>
                    <p className="text-xs text-slate-500">{start}</p>
                    {booking.session?.startTime ? (
                      <p className="text-[11px] text-slate-400">{formatRelativeTime(booking.session.startTime)}</p>
                    ) : null}
                  </div>
                  <StatusBadge status={booking.status} />
                </div>

                <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                  <div>
                    <span className="block font-semibold text-slate-500">Seat</span>
                    <span>{booking.seatNumber ?? '—'}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-500">Check-in</span>
                    <span>{booking.checkedInAt ? formatRelativeTime(booking.checkedInAt) : 'Pending'}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-500">Completion</span>
                    <span>{booking.completedAt ? formatRelativeTime(booking.completedAt) : 'Open'}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-500">Access</span>
                    <span className="break-all text-slate-500">{joinUrl || '—'}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    onClick={() => onOpen(booking)}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                    onClick={() => onEdit(booking)}
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center text-sm text-slate-500">
            No bookings yet. Use Add to log your first session.
          </div>
        )}
      </div>
    </div>
  );
}

NetworkingSessionsPanel.propTypes = {
  bookings: PropTypes.arrayOf(PropTypes.object),
  activeFilter: PropTypes.string.isRequired,
  onChangeFilter: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onOpen: PropTypes.func.isRequired,
};

NetworkingSessionsPanel.defaultProps = {
  bookings: [],
};
