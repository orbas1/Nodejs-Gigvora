import PropTypes from 'prop-types';
import { PencilSquareIcon, ArchiveBoxArrowDownIcon } from '@heroicons/react/24/outline';
import { formatRelativeTime, formatAbsolute } from '../../../utils/date.js';

function formatSalary(detail) {
  const salary = detail?.salary ?? {};
  if (salary.min == null && salary.max == null) {
    return '—';
  }
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: salary.currency ?? 'USD',
    maximumFractionDigits: 0,
  });
  if (salary.min != null && salary.max != null) {
    return `${formatter.format(Number(salary.min))} – ${formatter.format(Number(salary.max))}`;
  }
  if (salary.min != null) {
    return `${formatter.format(Number(salary.min))}+`;
  }
  return formatter.format(Number(salary.max));
}

function formatStatus(status) {
  return status ? status.replace(/_/g, ' ') : 'unknown';
}

export default function ApplicationsPanel({ applications, onCreate, onEdit, onArchive }) {
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Applications</h2>
          <p className="text-sm text-slate-500">Active roles and stages</p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90"
        >
          New application
        </button>
      </div>

      <div className="flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="h-full overflow-auto">
          <table className="min-w-[760px] w-full table-fixed border-collapse">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Role</th>
                <th className="px-6 py-3 font-semibold">Company</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Applied</th>
                <th className="px-6 py-3 font-semibold">Salary</th>
                <th className="px-6 py-3 font-semibold">Source</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No applications yet. Start by adding a role.
                  </td>
                </tr>
              ) : (
                applications.map((application) => {
                  const detail = application.detail ?? {};
                  const appliedAt = application.submittedAt ? new Date(application.submittedAt) : null;
                  return (
                    <tr key={application.id} className="transition hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold text-slate-900">{detail.title ?? 'Opportunity'}</td>
                      <td className="px-6 py-4">{detail.companyName ?? '—'}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          {formatStatus(application.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {appliedAt ? (
                          <span title={formatAbsolute(appliedAt)}>{formatRelativeTime(appliedAt)}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-4">{formatSalary(detail)}</td>
                      <td className="px-6 py-4">{detail.source ?? application.sourceChannel ?? '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onEdit(application)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                          >
                            <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onArchive(application)}
                            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                          >
                            <ArchiveBoxArrowDownIcon className="h-4 w-4" aria-hidden="true" />
                            Archive
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

ApplicationsPanel.propTypes = {
  applications: PropTypes.arrayOf(PropTypes.object).isRequired,
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
};
