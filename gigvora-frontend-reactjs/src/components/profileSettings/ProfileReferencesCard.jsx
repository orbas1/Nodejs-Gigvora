import { CheckBadgeIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

export default function ProfileReferencesCard({
  references,
  onAddReference,
  onUpdateReference,
  onRemoveReference,
  canEdit,
}) {
  const items = Array.isArray(references) ? references : [];

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-900">Refs</h3>
        <CheckBadgeIcon className="h-6 w-6 text-accent" aria-hidden="true" />
      </header>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Log your go-to advocates.</p>
        <button
          type="button"
          onClick={onAddReference}
          disabled={!canEdit}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          <PlusCircleIcon className="h-4 w-4" aria-hidden="true" /> Add
        </button>
      </div>

      {items.length === 0 ? <p className="text-sm text-slate-500">Add a recent manager or client.</p> : null}

      <div className="space-y-4">
        {items.map((item, index) => (
          <details key={`reference-${index}`} className="rounded-3xl border border-slate-200 bg-white p-4" open={index === 0}>
            <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-slate-800">
              <span>{item.name || 'Reference'}</span>
              <span className="text-xs font-medium text-slate-500">{item.company || ''}</span>
            </summary>
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</span>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(event) => onUpdateReference(index, { name: event.target.value })}
                    disabled={!canEdit}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Relationship</span>
                  <input
                    type="text"
                    value={item.relationship}
                    onChange={(event) => onUpdateReference(index, { relationship: event.target.value })}
                    disabled={!canEdit}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Company</span>
                  <input
                    type="text"
                    value={item.company}
                    onChange={(event) => onUpdateReference(index, { company: event.target.value })}
                    disabled={!canEdit}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
                  <input
                    type="email"
                    value={item.email}
                    onChange={(event) => onUpdateReference(index, { email: event.target.value })}
                    disabled={!canEdit}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</span>
                  <input
                    type="tel"
                    value={item.phone}
                    onChange={(event) => onUpdateReference(index, { phone: event.target.value })}
                    disabled={!canEdit}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Weight</span>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={item.weight}
                    onChange={(event) => onUpdateReference(index, { weight: event.target.value })}
                    disabled={!canEdit}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last contact</span>
                  <input
                    type="date"
                    value={item.lastInteractedAt}
                    onChange={(event) => onUpdateReference(index, { lastInteractedAt: event.target.value })}
                    disabled={!canEdit}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verified</span>
                  <select
                    value={item.isVerified ? 'true' : 'false'}
                    onChange={(event) => onUpdateReference(index, { isVerified: event.target.value === 'true' })}
                    disabled={!canEdit}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    <option value="false">Pending</option>
                    <option value="true">Verified</option>
                  </select>
                </label>
              </div>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Endorsement</span>
                <textarea
                  rows={3}
                  value={item.endorsement}
                  onChange={(event) => onUpdateReference(index, { endorsement: event.target.value })}
                  disabled={!canEdit}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </label>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onRemoveReference(index)}
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
