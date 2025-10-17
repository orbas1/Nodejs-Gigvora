import { useMemo, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/solid';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'action', label: 'Needs action' },
];

function ResponseRow({ response, onView, onEdit, onDelete, canManage }) {
  return (
    <li className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onView(response)}
            className="text-left text-lg font-semibold text-slate-900 hover:text-slate-700"
          >
            {response.responderName || 'Team member'}
          </button>
          <p className="text-sm text-slate-500">{response.applicationVolunteer || response.applicationName}</p>
          <p className="text-xs text-slate-500 line-clamp-2">{response.summary}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{response.responseType || 'Update'}</span>
          <span className="text-xs text-slate-400">
            {response.followUpAt ? new Date(response.followUpAt).toLocaleString() : 'No follow up'}
          </span>
          {response.requiresAction ? (
            <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Action</span>
          ) : null}
        </div>
      </div>
      {canManage ? (
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(response)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(response)}
            className="inline-flex items-center justify-center rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:text-rose-800"
          >
            Remove
          </button>
        </div>
      ) : null}
    </li>
  );
}

export default function ResponsesPane({
  responses = [],
  canManage,
  onCreate,
  onEdit,
  onDelete,
  onView,
  loading,
}) {
  const [filter, setFilter] = useState('all');
  const filteredResponses = useMemo(() => {
    if (filter === 'action') {
      return responses.filter((response) => response.requiresAction);
    }
    return responses;
  }, [responses, filter]);

  return (
    <section className="flex h-full flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Replies</h2>
          <p className="text-sm text-slate-500">{responses.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                filter === item.id
                  ? 'bg-slate-900 text-white shadow-soft'
                  : 'border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
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
        {filteredResponses.map((response) => (
          <ResponseRow
            key={response.id}
            response={response}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            canManage={canManage}
          />
        ))}
        {filteredResponses.length === 0 ? (
          <li className="rounded-3xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-500">
            {loading ? 'Loading…' : 'No responses in this view'}
          </li>
        ) : null}
      </ul>
    </section>
  );
}
