import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function CalendarTemplatesPanel({ templates, onCreate, onEdit, onDelete }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Types</h2>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          <PlusIcon className="h-4 w-4" />
          New type
        </button>
      </div>

      <div className="space-y-4">
        {templates.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-100 px-6 py-10 text-center text-sm text-slate-500">
            No types yet
          </div>
        ) : (
          templates.map((template) => (
            <div key={template.id} className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{template.defaultEventType}</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">{template.name}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2">{template.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                      template.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {template.isActive ? 'Active' : 'Paused'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onEdit(template)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(template)}
                    className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </div>
              <dl className="mt-5 grid gap-4 text-xs text-slate-500 md:grid-cols-4">
                <div>
                  <dt className="font-semibold uppercase tracking-wide text-slate-400">Duration</dt>
                  <dd className="mt-1 text-sm text-slate-600">{template.durationMinutes} min</dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase tracking-wide text-slate-400">Visibility</dt>
                  <dd className="mt-1 text-sm text-slate-600">{template.defaultVisibility}</dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase tracking-wide text-slate-400">Roles</dt>
                  <dd className="mt-1 text-sm text-slate-600">
                    {(template.defaultAllowedRoles || []).join(', ') || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase tracking-wide text-slate-400">Reminder</dt>
                  <dd className="mt-1 text-sm text-slate-600">
                    {Array.isArray(template.reminderMinutes)
                      ? template.reminderMinutes.join(', ')
                      : template.reminderMinutes || '—'}
                  </dd>
                </div>
              </dl>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
