import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import TagInput from './TagInput.jsx';

export default function GdprRetentionPoliciesCard({
  policies = [],
  onAddPolicy,
  onUpdatePolicy,
  onRemovePolicy,
  disabled = false,
}) {
  return (
    <section id="gdpr-retention" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Retention policies</h3>
          <p className="text-sm text-slate-600">
            Track lifecycle limits for each data class and ensure automated deletion aligns with legal bases.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddPolicy}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-2xl border border-accent bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500"
        >
          <PlusIcon className="h-5 w-5" /> Add policy
        </button>
      </div>
      <div className="mt-5 space-y-6">
        {(!policies || policies.length === 0) && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            No retention policies captured yet. Add the first one to start governing data lifecycles.
          </div>
        )}
        {policies.map((policy) => (
          <article
            key={policy.id}
            className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 className="text-base font-semibold text-slate-900">{policy.name || 'Untitled policy'}</h4>
                <p className="text-xs uppercase tracking-wide text-slate-400">{policy.id}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemovePolicy?.(policy.id)}
                disabled={disabled}
                className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500"
              >
                <TrashIcon className="h-4 w-4" /> Remove
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Policy name</label>
                <input
                  value={policy.name ?? ''}
                  onChange={(event) => onUpdatePolicy?.(policy.id, { name: event.target.value })}
                  disabled={disabled}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="Account data"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Retention (days)</label>
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={policy.retentionDays ?? ''}
                  onChange={(event) => onUpdatePolicy?.(policy.id, { retentionDays: event.target.value })}
                  disabled={disabled}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="730"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Legal basis</label>
                <input
                  value={policy.legalBasis ?? ''}
                  onChange={(event) => onUpdatePolicy?.(policy.id, { legalBasis: event.target.value })}
                  disabled={disabled}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="Contractual necessity"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reviewer</label>
                <input
                  value={policy.reviewer ?? ''}
                  onChange={(event) => onUpdatePolicy?.(policy.id, { reviewer: event.target.value })}
                  disabled={disabled}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="Privacy Operations"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TagInput
                label="Data categories"
                values={policy.dataCategories ?? []}
                onChange={(values) => onUpdatePolicy?.(policy.id, { dataCategories: values })}
                disabled={disabled}
                placeholder="Add data category"
              />
              <TagInput
                label="Applies to"
                values={policy.appliesTo ?? []}
                onChange={(values) => onUpdatePolicy?.(policy.id, { appliesTo: values })}
                disabled={disabled}
                placeholder="Add cohort (e.g. members, companies)"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</label>
              <textarea
                rows={3}
                value={policy.notes ?? ''}
                onChange={(event) => onUpdatePolicy?.(policy.id, { notes: event.target.value })}
                disabled={disabled}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                placeholder="Describe the deletion workflow, including safeguards or anonymisation steps."
              />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Automated deletion enabled</p>
                <p className="text-xs text-slate-500">Indicates whether a scheduled job purges the data when the retention window ends.</p>
              </div>
              <label className="inline-flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {policy.autoDelete ? 'Enabled' : 'Disabled'}
                </span>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
                  checked={Boolean(policy.autoDelete)}
                  onChange={(event) => onUpdatePolicy?.(policy.id, { autoDelete: event.target.checked })}
                  disabled={disabled}
                />
              </label>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
