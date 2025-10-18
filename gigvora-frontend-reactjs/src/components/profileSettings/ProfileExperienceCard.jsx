import { PlusCircleIcon } from '@heroicons/react/24/outline';

export default function ProfileExperienceCard({
  experience,
  onAddExperience,
  onUpdateExperience,
  onRemoveExperience,
  canEdit,
}) {
  const items = Array.isArray(experience) ? experience : [];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-900">Work</h3>
        <button
          type="button"
          onClick={onAddExperience}
          disabled={!canEdit}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          <PlusCircleIcon className="h-4 w-4" aria-hidden="true" /> Add
        </button>
      </div>

      {items.length === 0 ? <p className="text-sm text-slate-500">Add your latest role.</p> : null}

      <div className="space-y-4">
        {items.map((item, index) => (
          <details
            key={`experience-${index}`}
            className="group rounded-3xl border border-slate-200 bg-white p-4"
            open={index === 0}
          >
            <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-slate-800">
              <span>
                {item.role || 'Role'} · {item.organization || 'Organisation'}
              </span>
              <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
                {item.startDate || 'Start'} – {item.endDate || 'Present'}
              </span>
            </summary>
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Organisation</span>
                  <input
                    type="text"
                    value={item.organization}
                    onChange={(event) => onUpdateExperience(index, { organization: event.target.value })}
                    disabled={!canEdit}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</span>
                  <input
                    type="text"
                    value={item.role}
                    onChange={(event) => onUpdateExperience(index, { role: event.target.value })}
                    disabled={!canEdit}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start</span>
                  <input
                    type="date"
                    value={item.startDate}
                    onChange={(event) => onUpdateExperience(index, { startDate: event.target.value })}
                    disabled={!canEdit}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">End</span>
                  <input
                    type="date"
                    value={item.endDate}
                    onChange={(event) => onUpdateExperience(index, { endDate: event.target.value })}
                    disabled={!canEdit}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Highlights</span>
                <textarea
                  rows={3}
                  value={(item.highlights ?? []).join('\n')}
                  onChange={(event) =>
                    onUpdateExperience(index, {
                      highlights: event.target.value
                        .split('\n')
                        .map((line) => line.trim())
                        .filter((line) => line.length > 0),
                    })
                  }
                  disabled={!canEdit}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
                <textarea
                  rows={3}
                  value={item.description}
                  onChange={(event) => onUpdateExperience(index, { description: event.target.value })}
                  disabled={!canEdit}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </label>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onRemoveExperience(index)}
                  disabled={!canEdit}
                  className="text-xs font-semibold text-rose-500 transition hover:text-rose-600 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  Remove
                </button>
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
