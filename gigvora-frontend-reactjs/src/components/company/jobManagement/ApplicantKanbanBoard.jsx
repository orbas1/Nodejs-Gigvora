import { useMemo } from 'react';
import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';

function formatStatusLabel(value) {
  if (!value) return 'Status';
  return value
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export default function ApplicantKanbanBoard({ columns, onSelectApplication }) {
  const normalisedColumns = useMemo(() => {
    if (!Array.isArray(columns) || !columns.length) {
      return [
        { status: 'submitted', label: 'Submitted', applications: [] },
        { status: 'interview', label: 'Interview', applications: [] },
        { status: 'offered', label: 'Offered', applications: [] },
        { status: 'hired', label: 'Hired', applications: [] },
      ];
    }
    return columns.map((column) => ({
      status: column.status,
      label: column.label ?? formatStatusLabel(column.status),
      applications: Array.isArray(column.applications) ? column.applications : [],
    }));
  }, [columns]);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {normalisedColumns.map((column) => (
        <div key={column.status} className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white/60 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">{column.label}</h4>
              <p className="text-xs text-slate-500">{column.applications.length} in stage</p>
            </div>
          </div>
          <div className="mt-3 space-y-3 overflow-y-auto">
            {column.applications.length ? (
              column.applications.map((application) => (
                <button
                  key={application.id}
                  type="button"
                  onClick={() => onSelectApplication?.(application)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{application.candidateName ?? 'Candidate'}</p>
                      <p className="text-xs text-slate-500">{application.jobTitle ?? 'Application'}</p>
                    </div>
                    <ArrowRightCircleIcon className="h-4 w-4 text-slate-400" />
                  </div>
                  {application.submittedAt ? (
                    <p className="mt-1 text-xs text-slate-500">{new Date(application.submittedAt).toLocaleDateString()}</p>
                  ) : null}
                </button>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">None</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
