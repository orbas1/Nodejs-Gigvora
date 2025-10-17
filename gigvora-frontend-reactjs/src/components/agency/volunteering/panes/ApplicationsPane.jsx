import { useMemo, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/solid';

function StageFilter({ stages, value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onChange('')}
        className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
          value === '' ? 'bg-slate-900 text-white shadow-soft' : 'border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
        }`}
      >
        All
      </button>
      {stages.map((stage) => (
        <button
          key={stage}
          type="button"
          onClick={() => onChange(stage)}
          className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
            value === stage ? 'bg-slate-900 text-white shadow-soft' : 'border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
          }`}
        >
          {stage.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}
        </button>
      ))}
    </div>
  );
}

function ApplicationRow({ application, onView, onEdit, onDelete, canManage }) {
  return (
    <li className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onView(application)}
            className="text-left text-lg font-semibold text-slate-900 hover:text-slate-700"
          >
            {application.volunteerName}
          </button>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{application.stage || 'New'}</span>
        </div>
        <p className="text-sm text-slate-500">{application.contractTitle || 'No contract'}</p>
      </div>
      {canManage ? (
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(application)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(application)}
            className="inline-flex items-center justify-center rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:text-rose-800"
          >
            Remove
          </button>
        </div>
      ) : null}
    </li>
  );
}

export default function ApplicationsPane({ applications = [], canManage, onCreate, onEdit, onDelete, onView, loading }) {
  const uniqueStages = useMemo(() => {
    const set = new Set();
    applications.forEach((application) => {
      if (application.stage) {
        set.add(application.stage);
      }
    });
    return Array.from(set);
  }, [applications]);

  const [stage, setStage] = useState('');
  const filteredApplications = useMemo(() => {
    if (!stage) {
      return applications;
    }
    return applications.filter((application) => application.stage === stage);
  }, [applications, stage]);

  return (
    <section className="flex h-full flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Apply</h2>
          <p className="text-sm text-slate-500">{applications.length} total</p>
        </div>
        <div className="flex items-center gap-3">
          <StageFilter stages={uniqueStages} value={stage} onChange={setStage} />
          {canManage ? (
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-700"
            >
              <PlusIcon className="h-4 w-4" /> New
            </button>
          ) : null}
        </div>
      </header>

      <ul className="grid gap-4">
        {filteredApplications.map((application) => (
          <ApplicationRow
            key={application.id}
            application={application}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            canManage={canManage}
          />
        ))}
        {filteredApplications.length === 0 ? (
          <li className="rounded-3xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-500">
            {loading ? 'Loading…' : 'No applications in this view'}
          </li>
        ) : null}
      </ul>
    </section>
  );
}
