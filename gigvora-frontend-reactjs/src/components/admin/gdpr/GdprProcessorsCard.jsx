import { BuildingOfficeIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import TagInput from './TagInput.jsx';

export default function GdprProcessorsCard({ processors = [], onAddProcessor, onUpdateProcessor, onRemoveProcessor, disabled = false }) {
  return (
    <section id="gdpr-processors" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Processors & sub-processors</h3>
          <p className="text-sm text-slate-600">
            Maintain the approved vendor roster, transfer mechanisms, and review cadence for every data processor.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddProcessor}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-2xl border border-accent bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500"
        >
          <BuildingOfficeIcon className="h-5 w-5" /> Add processor
        </button>
      </div>
      <div className="mt-5 space-y-6">
        {(!processors || processors.length === 0) && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            No processors recorded. Add each processor handling personal data so legal documentation stays audit-ready.
          </div>
        )}
        {processors.map((processor) => (
          <article key={processor.id} className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 className="text-base font-semibold text-slate-900">{processor.name || 'New processor'}</h4>
                <p className="text-xs uppercase tracking-wide text-slate-400">{processor.id}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemoveProcessor?.(processor.id)}
                disabled={disabled}
                className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500"
              >
                <ShieldExclamationIcon className="h-4 w-4" /> Remove
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Processor name</label>
                <input
                  value={processor.name ?? ''}
                  onChange={(event) => onUpdateProcessor?.(processor.id, { name: event.target.value })}
                  disabled={disabled}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="Amazon Web Services"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Purpose</label>
                <input
                  value={processor.purpose ?? ''}
                  onChange={(event) => onUpdateProcessor?.(processor.id, { purpose: event.target.value })}
                  disabled={disabled}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="Infrastructure hosting"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Region</label>
                <input
                  value={processor.region ?? ''}
                  onChange={(event) => onUpdateProcessor?.(processor.id, { region: event.target.value })}
                  disabled={disabled}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="eu-west-2"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Transfer mechanism</label>
                <input
                  value={processor.dataTransferMechanism ?? ''}
                  onChange={(event) => onUpdateProcessor?.(processor.id, { dataTransferMechanism: event.target.value })}
                  disabled={disabled}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="UK IDTA"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TagInput
                label="Data categories"
                values={processor.dataCategories ?? []}
                onChange={(values) => onUpdateProcessor?.(processor.id, { dataCategories: values })}
                disabled={disabled}
                placeholder="Add data category"
              />
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Security review date</label>
                <input
                  type="date"
                  value={processor.securityReviewDate ?? ''}
                  onChange={(event) => onUpdateProcessor?.(processor.id, { securityReviewDate: event.target.value })}
                  disabled={disabled}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                <select
                  value={processor.status ?? 'active'}
                  onChange={(event) => onUpdateProcessor?.(processor.id, { status: event.target.value })}
                  disabled={disabled}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="active">Active</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="decommissioning">Decommissioning</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact email</label>
                <input
                  type="email"
                  value={processor.contactEmail ?? ''}
                  onChange={(event) => onUpdateProcessor?.(processor.id, { contactEmail: event.target.value })}
                  disabled={disabled}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="privacy@vendor.com"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <label className="inline-flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">DPA signed</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
                  checked={Boolean(processor.dpaSigned)}
                  onChange={(event) => onUpdateProcessor?.(processor.id, { dpaSigned: event.target.checked })}
                  disabled={disabled}
                />
              </label>
              <label className="inline-flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Is sub-processor</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
                  checked={Boolean(processor.subprocessor)}
                  onChange={(event) => onUpdateProcessor?.(processor.id, { subprocessor: event.target.checked })}
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
