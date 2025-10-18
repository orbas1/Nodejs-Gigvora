import { ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function GdprDpoCard({ data = {}, onChange, disabled = false }) {
  const handleFieldChange = (field) => (event) => {
    onChange?.(field, event.target.value);
  };

  return (
    <section id="gdpr-dpo" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <ShieldCheckIcon className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Data Protection Officer</h2>
              <p className="text-sm text-slate-600">
                Maintain clear contact details for the appointed DPO and communicate their availability for escalations.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="dpoName" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Name
          </label>
          <input
            id="dpoName"
            value={data.name ?? ''}
            onChange={handleFieldChange('name')}
            disabled={disabled}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="Jane Calder"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="dpoEmail" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Email
          </label>
          <input
            id="dpoEmail"
            type="email"
            value={data.email ?? ''}
            onChange={handleFieldChange('email')}
            disabled={disabled}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="privacy@gigvora.com"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="dpoPhone" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Phone
          </label>
          <input
            id="dpoPhone"
            value={data.phone ?? ''}
            onChange={handleFieldChange('phone')}
            disabled={disabled}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="+44 20 7123 4567"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="dpoTimezone" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Timezone
          </label>
          <input
            id="dpoTimezone"
            value={data.timezone ?? ''}
            onChange={handleFieldChange('timezone')}
            disabled={disabled}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="Europe/London"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="dpoOffice" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Office location
          </label>
          <input
            id="dpoOffice"
            value={data.officeLocation ?? ''}
            onChange={handleFieldChange('officeLocation')}
            disabled={disabled}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="London, United Kingdom"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="dpoAvailability" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Availability window
          </label>
          <input
            id="dpoAvailability"
            value={data.availability ?? ''}
            onChange={handleFieldChange('availability')}
            disabled={disabled}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="Monday to Friday, 09:00-17:00 GMT"
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label htmlFor="dpoAddress" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Mailing address
          </label>
          <textarea
            id="dpoAddress"
            rows={3}
            value={data.address ?? ''}
            onChange={handleFieldChange('address')}
            disabled={disabled}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="Gigvora Privacy Office, 20 Bishopsgate, London EC2N 4AG"
          />
        </div>
      </div>
    </section>
  );
}
