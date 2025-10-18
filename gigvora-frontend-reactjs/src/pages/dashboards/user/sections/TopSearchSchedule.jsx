import PropTypes from 'prop-types';
import { ClockIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import { formatAbsolute, formatRelativeTime } from '../../../../utils/date.js';

function statusTone(status) {
  if (status === 'overdue') {
    return 'border-rose-200 bg-rose-50 text-rose-600';
  }
  return 'border-emerald-200 bg-emerald-50 text-emerald-600';
}

export default function TopSearchSchedule({ upcomingRuns }) {
  const items = Array.isArray(upcomingRuns) ? upcomingRuns : [];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Runs</h3>
        <ClockIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
      </div>

      {items.length ? (
        <ul className="mt-4 space-y-3">
          {items.map((run) => (
            <li key={run.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{run.name}</p>
                <p className="text-xs text-slate-500">{formatAbsolute(run.nextRunAt)}</p>
                <p className="text-xs text-slate-400">{formatRelativeTime(run.nextRunAt)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${statusTone(run.status)}`}>
                  {run.status === 'overdue' ? 'Overdue' : 'Scheduled'}
                </span>
                <div className="flex items-center gap-2">
                  {run.notifyByEmail ? (
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                      <BellAlertIcon className="h-4 w-4" aria-hidden="true" />
                    </span>
                  ) : null}
                  {run.notifyInApp ? (
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                      <BellAlertIcon className="h-4 w-4" aria-hidden="true" />
                    </span>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center text-sm text-slate-500">
          No runs yet.
        </p>
      )}
    </div>
  );
}

TopSearchSchedule.propTypes = {
  upcomingRuns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      nextRunAt: PropTypes.string.isRequired,
      frequency: PropTypes.string,
      notifyByEmail: PropTypes.bool,
      notifyInApp: PropTypes.bool,
      status: PropTypes.string,
    }),
  ),
};

TopSearchSchedule.defaultProps = {
  upcomingRuns: [],
};
