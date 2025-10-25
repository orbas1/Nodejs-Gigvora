import { useMemo, useState } from 'react';
import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import { formatStatusLabel } from '../../../utils/format.js';

export default function ApplicantKanbanBoard({ columns, onSelectApplication, onMoveApplication }) {
  const [draggingId, setDraggingId] = useState(null);
  const [activeColumn, setActiveColumn] = useState(null);

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

  const statusOptions = useMemo(
    () =>
      normalisedColumns.map((column) => ({
        value: column.status,
        label: column.label ?? formatStatusLabel(column.status),
      })),
    [normalisedColumns],
  );

  const canMove = typeof onMoveApplication === 'function';

  const clearDragState = () => {
    setDraggingId(null);
    setActiveColumn(null);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {normalisedColumns.map((column) => (
        <div
          key={column.status}
          className={`flex h-full flex-col rounded-3xl border bg-white/60 p-4 shadow-sm transition ${
            activeColumn === column.status ? 'border-blue-300 shadow-blue-100 ring-2 ring-blue-200/60' : 'border-slate-200'
          }`}
          data-testid={`kanban-column-${column.status}`}
          onDragOver={(event) => {
            if (!canMove) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            setActiveColumn(column.status);
          }}
          onDragEnter={() => {
            if (!canMove) return;
            setActiveColumn(column.status);
          }}
          onDragLeave={(event) => {
            if (!canMove) return;
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setActiveColumn((current) => (current === column.status ? null : current));
            }
          }}
          onDrop={(event) => {
            if (!canMove) return;
            event.preventDefault();
            const payload = event.dataTransfer.getData('text/gigvora-application');
            if (!payload) {
              clearDragState();
              return;
            }
            try {
              const parsed = JSON.parse(payload);
              if (parsed?.id) {
                onMoveApplication(parsed.id, column.status);
              }
            } catch (error) {
              console.error('Unable to parse dropped application payload', error);
            } finally {
              clearDragState();
            }
          }}
        >
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
                  draggable={canMove}
                  onDragStart={(event) => {
                    if (!canMove) return;
                    try {
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData(
                        'text/gigvora-application',
                        JSON.stringify({ id: application.id, status: column.status }),
                      );
                      setDraggingId(application.id);
                    } catch (error) {
                      console.error('Unable to start drag interaction', error);
                    }
                  }}
                  onDragEnd={clearDragState}
                  className={`w-full rounded-2xl border bg-white px-3 py-2 text-left text-sm text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 ${
                    draggingId === application.id ? 'border-blue-300 ring-2 ring-blue-200/60' : 'border-slate-200'
                  }`}
                  data-testid={`kanban-application-${application.id}`}
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
                  {canMove ? (
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <label
                        htmlFor={`kanban-move-${column.status}-${application.id}`}
                        className="sr-only"
                      >
                        Move application for {application.candidateName ?? 'candidate'}
                      </label>
                      <select
                        id={`kanban-move-${column.status}-${application.id}`}
                        defaultValue=""
                        className="w-full rounded-xl border border-slate-200 px-2 py-1 text-xs text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          const nextStatus = event.target.value;
                          if (nextStatus) {
                            onMoveApplication(application.id, nextStatus);
                            event.target.value = '';
                          }
                        }}
                      >
                        <option value="" disabled>
                          Move to…
                        </option>
                        {statusOptions
                          .filter((option) => option.value !== column.status)
                          .map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                      </select>
                    </div>
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
