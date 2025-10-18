import PropTypes from 'prop-types';
import { CalendarDaysIcon, ClockIcon, VideoCameraIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatRelativeTime, formatAbsolute } from '../../../utils/date.js';

function formatType(type) {
  return type ? type.replace(/_/g, ' ') : 'scheduled';
}

function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return '—';
  const value = Number(minutes);
  if (!Number.isFinite(value) || value <= 0) {
    return '—';
  }
  return `${value} min`;
}

export default function InterviewsPanel({ interviews, applications, onCreate, onEdit, onDelete }) {
  const applicationLookup = new Map(applications.map((application) => [application.id, application]));

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Interviews</h2>
          <p className="text-sm text-slate-500">Upcoming and completed meetings</p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90"
        >
          Schedule interview
        </button>
      </div>

      <div className="flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="h-full overflow-auto px-6 py-6">
          {interviews.length === 0 ? (
            <p className="text-center text-sm text-slate-400">No interviews tracked yet.</p>
          ) : (
            <ul className="space-y-4">
              {interviews.map((interview) => {
                const scheduledAt = interview.scheduledAt ? new Date(interview.scheduledAt) : null;
                const application = applicationLookup.get(interview.applicationId);
                const title = application?.detail?.title ?? 'Opportunity';
                const company = application?.detail?.companyName ?? 'Company';
                return (
                  <li
                    key={interview.id}
                    className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-slate-50/60 p-5 transition hover:border-accent/40 hover:bg-white"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{title}</p>
                        <p className="text-xs uppercase tracking-wide text-slate-500">{company}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-3 py-1 text-slate-600">
                          <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
                          {scheduledAt ? formatRelativeTime(scheduledAt) : 'TBC'}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-3 py-1 text-slate-600">
                          <VideoCameraIcon className="h-4 w-4" aria-hidden="true" />
                          {formatType(interview.type)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-3 py-1 text-slate-600">
                          <ClockIcon className="h-4 w-4" aria-hidden="true" />
                          {formatDuration(interview.durationMinutes)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-slate-700">Status</span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          {formatType(interview.status)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(interview)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                        >
                          <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(interview)}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          <TrashIcon className="h-4 w-4" aria-hidden="true" />
                          Delete
                        </button>
                      </div>
                    </div>
                    {scheduledAt ? (
                      <p className="text-xs text-slate-400" title={formatAbsolute(scheduledAt)}>
                        Scheduled {formatAbsolute(scheduledAt)}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

InterviewsPanel.propTypes = {
  interviews: PropTypes.arrayOf(PropTypes.object).isRequired,
  applications: PropTypes.arrayOf(PropTypes.object).isRequired,
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
