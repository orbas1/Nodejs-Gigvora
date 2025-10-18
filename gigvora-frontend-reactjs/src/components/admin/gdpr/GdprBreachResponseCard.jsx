import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import TagInput from './TagInput.jsx';

export default function GdprBreachResponseCard({ data = {}, onChange, disabled = false }) {
  const handleFieldChange = (field) => (event) => {
    onChange?.(field, event.target.value);
  };

  const handleNumberChange = (field) => (event) => {
    onChange?.(field, event.target.value);
  };

  const handleToolsChange = (tools) => {
    onChange?.('tooling', tools);
  };

  return (
    <section id="gdpr-breach" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <ExclamationTriangleIcon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Breach response</h3>
          <p className="text-sm text-slate-600">
            Ensure the incident bridge, notification commitments, and counsel contacts are ready for a GDPR breach event.
          </p>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="breachNotification" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Notification window (hours)
            </label>
            <input
              id="breachNotification"
              type="number"
              min="1"
              max="168"
              value={data.notificationWindowHours ?? ''}
              onChange={handleNumberChange('notificationWindowHours')}
              disabled={disabled}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="72"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="breachOnCall" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              On-call contact
            </label>
            <input
              id="breachOnCall"
              value={data.onCallContact ?? ''}
              onChange={handleFieldChange('onCallContact')}
              disabled={disabled}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="security@gigvora.com"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="breachRunbook" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Incident runbook URL
            </label>
            <input
              id="breachRunbook"
              value={data.incidentRunbookUrl ?? ''}
              onChange={handleFieldChange('incidentRunbookUrl')}
              disabled={disabled}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="https://gigvora.com/runbooks/gdpr-breach"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="breachTabletop" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Last tabletop exercise
            </label>
            <input
              id="breachTabletop"
              type="date"
              value={data.tabletopLastRun ?? ''}
              onChange={handleFieldChange('tabletopLastRun')}
              disabled={disabled}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>
        </div>
        <TagInput
          label="Incident tooling"
          values={data.tooling ?? []}
          onChange={handleToolsChange}
          disabled={disabled}
          placeholder="Add a platform (e.g. PagerDuty, Slack, Jira)"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="breachCounsel" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Legal counsel
            </label>
            <input
              id="breachCounsel"
              value={data.legalCounsel ?? ''}
              onChange={handleFieldChange('legalCounsel')}
              disabled={disabled}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="counsel@gigvora.com"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="breachComms" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Communications contact
            </label>
            <input
              id="breachComms"
              value={data.communicationsContact ?? ''}
              onChange={handleFieldChange('communicationsContact')}
              disabled={disabled}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="press@gigvora.com"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
