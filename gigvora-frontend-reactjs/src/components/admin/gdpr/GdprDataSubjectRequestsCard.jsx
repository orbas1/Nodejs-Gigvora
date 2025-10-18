import { BoltIcon } from '@heroicons/react/24/outline';
import TagInput from './TagInput.jsx';

export default function GdprDataSubjectRequestsCard({ data = {}, onChange, disabled = false }) {
  const handleFieldChange = (field) => (event) => {
    onChange?.(field, event.target.type === 'number' ? event.target.value : event.target.value);
  };

  const handleToggle = (field) => (event) => {
    onChange?.(field, event.target.checked);
  };

  const handleChannelsChange = (channels) => {
    onChange?.('intakeChannels', channels);
  };

  const handleExportsChange = (formats) => {
    onChange?.('exportFormats', formats);
  };

  return (
    <section id="gdpr-dsr" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
          <BoltIcon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Data subject requests</h3>
          <p className="text-sm text-slate-600">
            Control where requests are routed, the SLA applied, and which channels feed into the privacy portal.
          </p>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="dsrContactEmail" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Primary contact email
            </label>
            <input
              id="dsrContactEmail"
              type="email"
              value={data.contactEmail ?? ''}
              onChange={handleFieldChange('contactEmail')}
              disabled={disabled}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="privacy@gigvora.com"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="dsrEscalationEmail" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Escalation email
            </label>
            <input
              id="dsrEscalationEmail"
              type="email"
              value={data.escalationEmail ?? ''}
              onChange={handleFieldChange('escalationEmail')}
              disabled={disabled}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="legal@gigvora.com"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="dsrSla" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              SLA (days)
            </label>
            <input
              id="dsrSla"
              type="number"
              min="1"
              max="180"
              value={data.slaDays ?? ''}
              onChange={handleFieldChange('slaDays')}
              disabled={disabled}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="30"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="dsrPortalUrl" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Privacy portal URL
            </label>
            <input
              id="dsrPortalUrl"
              value={data.privacyPortalUrl ?? ''}
              onChange={handleFieldChange('privacyPortalUrl')}
              disabled={disabled}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="https://gigvora.com/privacy-portal"
            />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Automated intake</p>
            <p className="text-xs text-slate-500">
              Automatically capture requests submitted via the portal or support inbox.
            </p>
          </div>
          <label className="inline-flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {data.automatedIntake ? 'Enabled' : 'Disabled'}
            </span>
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
              checked={Boolean(data.automatedIntake)}
              onChange={handleToggle('automatedIntake')}
              disabled={disabled}
            />
          </label>
        </div>
        <TagInput
          label="Intake channels"
          values={data.intakeChannels ?? []}
          onChange={handleChannelsChange}
          disabled={disabled}
          placeholder="Add a channel (e.g. in-app portal, email, phone)"
          helperText="List all channels monitored by privacy operations."
        />
        <TagInput
          label="Export formats"
          values={data.exportFormats ?? []}
          onChange={handleExportsChange}
          disabled={disabled}
          placeholder="Add an export format (e.g. CSV, JSON)"
          helperText="Specify which export formats are available to data subjects."
        />
        <div className="space-y-2">
          <label htmlFor="dsrStatusUrl" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status dashboard URL
          </label>
          <input
            id="dsrStatusUrl"
            value={data.statusDashboardUrl ?? ''}
            onChange={handleFieldChange('statusDashboardUrl')}
            disabled={disabled}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="https://status.gigvora.com/privacy"
          />
        </div>
      </div>
    </section>
  );
}
