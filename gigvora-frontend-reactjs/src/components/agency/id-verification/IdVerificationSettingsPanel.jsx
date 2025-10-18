import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function IdVerificationSettingsPanel({
  form,
  onChange,
  onSubmit,
  busy,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-4xl border border-slate-200 bg-white/95 p-8 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">Automation rules</h2>
            <p className="mt-1 text-sm text-slate-500">Define routing, reminders, and allowed documents.</p>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:opacity-50"
          >
            {busy ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />} Save
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <span>Auto approve low risk</span>
            <input
              type="checkbox"
              checked={form.automationEnabled}
              onChange={(event) => onChange({ ...form, automationEnabled: event.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
            />
          </label>
          <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <span>Require selfie match</span>
            <input
              type="checkbox"
              checked={form.requireSelfie}
              onChange={(event) => onChange({ ...form, requireSelfie: event.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
            />
          </label>
          <Field
            label="Assign to reviewer"
            type="number"
            value={form.autoAssignReviewerId}
            onChange={(event) => onChange({ ...form, autoAssignReviewerId: event.target.value })}
            placeholder="Reviewer user ID"
          />
          <Field
            label="Reminder cadence (hrs)"
            type="number"
            value={form.reminderCadenceHours}
            onChange={(event) => onChange({ ...form, reminderCadenceHours: Number(event.target.value) })}
            min={1}
            max={720}
          />
          <Field
            label="Manual review threshold"
            type="number"
            value={form.manualReviewThreshold}
            onChange={(event) => onChange({ ...form, manualReviewThreshold: Number(event.target.value) })}
            min={0}
            max={1000}
          />
          <Field
            label="Escalate after (hrs)"
            type="number"
            value={form.escalateAfterHours}
            onChange={(event) => onChange({ ...form, escalateAfterHours: Number(event.target.value) })}
            min={1}
            max={1440}
          />
          <Field
            label="Reminder channels"
            type="text"
            value={form.reminderChannels}
            onChange={(event) => onChange({ ...form, reminderChannels: event.target.value })}
            placeholder="email,sms"
          />
          <Field
            label="Auto archive (days)"
            type="number"
            value={form.autoArchiveAfterDays}
            onChange={(event) => onChange({ ...form, autoArchiveAfterDays: Number(event.target.value) })}
            min={30}
            max={3650}
          />
          <Field
            label="Allowed ID types"
            type="text"
            value={form.allowedDocumentTypes}
            onChange={(event) => onChange({ ...form, allowedDocumentTypes: event.target.value })}
            placeholder="passport,driver_license"
          />
          <Field
            label="Reminder template"
            type="text"
            value={form.autoReminderTemplateKey}
            onChange={(event) => onChange({ ...form, autoReminderTemplateKey: event.target.value })}
            placeholder="templates/compliance/reminder"
          />
          <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <span>Allow provisional pass</span>
            <input
              type="checkbox"
              checked={form.allowProvisionalPass}
              onChange={(event) => onChange({ ...form, allowProvisionalPass: event.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
            />
          </label>
        </div>
      </div>
    </form>
  );
}

function Field({ label, ...rest }) {
  return (
    <label className="space-y-2 text-sm text-slate-700">
      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{label}</span>
      <input
        {...rest}
        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
      />
    </label>
  );
}
