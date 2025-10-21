import PropTypes from 'prop-types';
import { formatRelativeTime } from '../../utils/date.js';

function formatStatus(status) {
  if (!status) return 'Scheduled';
  return status
    .toString()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function ProjectAgencyDelegation({ assignments = [] }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Agency delivery pod</p>
          <h4 className="text-lg font-semibold text-slate-900">Delegated team workload</h4>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          {assignments.length} members
        </span>
      </div>
      <div className="space-y-3">
        {assignments.length ? (
          assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm transition hover:border-accent/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{assignment.memberName}</p>
                  <p className="text-xs text-slate-500">{assignment.role}</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>{formatStatus(assignment.status)}</p>
                  {assignment.delegatedAt ? (
                    <p>Delegated {formatRelativeTime(assignment.delegatedAt)}</p>
                  ) : null}
                  {assignment.delegatedBy ? <p>By {assignment.delegatedBy}</p> : null}
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Capacity {assignment.capacityHours ?? 0} hrs</span>
                  <span>Allocated {assignment.allocatedHours ?? 0} hrs</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, Number(assignment.workloadPercent ?? 0)))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-500">
            Delegate project phases to agency teammates to balance workload.
          </div>
        )}
      </div>
    </div>
  );
}

ProjectAgencyDelegation.propTypes = {
  assignments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      memberName: PropTypes.string,
      role: PropTypes.string,
      status: PropTypes.string,
      delegatedAt: PropTypes.string,
      delegatedBy: PropTypes.string,
      capacityHours: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      allocatedHours: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      workloadPercent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    })
  ),
};

ProjectAgencyDelegation.defaultProps = {
  assignments: [],
};
