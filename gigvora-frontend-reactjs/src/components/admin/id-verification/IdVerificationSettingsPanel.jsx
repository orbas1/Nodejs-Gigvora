import { ArrowPathIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

function toCsv(values) {
  if (!Array.isArray(values)) {
    return '';
  }
  return values.join(', ');
}

function fromCsv(value) {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function IdVerificationSettingsPanel({
  draft,
  dirty,
  saving,
  onDraftChange,
  onAddProvider,
  onRemoveProvider,
  onReset,
  onSave,
  variant = 'card',
}) {
  const providers = Array.isArray(draft?.providers) ? draft.providers : [];
  const automation = draft?.automation ?? {};
  const documents = draft?.documents ?? {};
  const storage = draft?.storage ?? {};

  const Wrapper = variant === 'card' ? 'section' : 'div';
  const wrapperProps =
    variant === 'card'
      ? { id: 'idv-settings', className: 'space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8' }
      : { className: 'space-y-6' };

  return (
    <Wrapper {...wrapperProps}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Settings</h2>
          {dirty ? (
            <span className="mt-2 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
              Unsaved
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !dirty}
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Identity providers</h3>
          <button
            type="button"
            onClick={onAddProvider}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-sky-300 hover:text-sky-700"
          >
            <PlusIcon className="h-4 w-4" /> Add provider
          </button>
        </div>
        {providers.length === 0 ? (
          <p className="text-sm text-slate-500">No providers configured yet.</p>
        ) : (
          <div className="space-y-4">
            {providers.map((provider, index) => (
              <div key={provider.id ?? index} className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{provider.name || 'Provider'}</p>
                    <p className="text-xs text-slate-500">ID: {provider.id || '—'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <input
                        type="checkbox"
                        checked={Boolean(provider.enabled)}
                        onChange={(event) => onDraftChange?.(['providers', index, 'enabled'], event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      Enabled
                    </label>
                    <button
                      type="button"
                      onClick={() => onRemoveProvider?.(index)}
                      className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                    >
                      <TrashIcon className="h-4 w-4" /> Remove
                    </button>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <InputField
                    label="Provider name"
                    value={provider.name ?? ''}
                    onChange={(event) => onDraftChange?.(['providers', index, 'name'], event.target.value)}
                  />
                  <InputField
                    label="Provider key"
                    value={provider.id ?? ''}
                    onChange={(event) => onDraftChange?.(['providers', index, 'id'], event.target.value)}
                  />
                  <InputField
                    label="Webhook URL"
                    value={provider.webhookUrl ?? ''}
                    onChange={(event) => onDraftChange?.(['providers', index, 'webhookUrl'], event.target.value)}
                  />
                  <InputField
                    label="Risk policy"
                    value={provider.riskPolicy ?? ''}
                    onChange={(event) => onDraftChange?.(['providers', index, 'riskPolicy'], event.target.value)}
                  />
                  <InputField
                    label="API key"
                    value={provider.apiKey ?? ''}
                    onChange={(event) => onDraftChange?.(['providers', index, 'apiKey'], event.target.value)}
                  />
                  <InputField
                    label="API secret"
                    value={provider.apiSecret ?? ''}
                    onChange={(event) => onDraftChange?.(['providers', index, 'apiSecret'], event.target.value)}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Allowed documents
                    <textarea
                      rows={2}
                      value={toCsv(provider.allowedDocuments)}
                      onChange={(event) => onDraftChange?.(['providers', index, 'allowedDocuments'], fromCsv(event.target.value))}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      placeholder="passport, national_id, driver_license"
                    />
                  </label>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sandbox mode
                    <select
                      value={provider.sandbox ? 'true' : 'false'}
                      onChange={(event) => onDraftChange?.(['providers', index, 'sandbox'], event.target.value === 'true')}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Automation rules</h3>
            <button
              type="button"
              onClick={() => onDraftChange?.(['automation', 'autoAssignOldest'], !automation.autoAssignOldest)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-sky-300 hover:text-sky-700"
            >
              <ArrowPathIcon className="h-4 w-4" /> Toggle auto-assign
            </button>
          </div>
          <ToggleField
            label="Auto-assign oldest pending case"
            checked={Boolean(automation.autoAssignOldest)}
            onChange={(value) => onDraftChange?.(['automation', 'autoAssignOldest'], value)}
          />
          <ToggleField
            label="Auto-reject expired submissions"
            checked={Boolean(automation.autoRejectExpired)}
            onChange={(value) => onDraftChange?.(['automation', 'autoRejectExpired'], value)}
          />
          <ToggleField
            label="Auto-approve low risk"
            checked={Boolean(automation.autoApproveLowRisk)}
            onChange={(value) => onDraftChange?.(['automation', 'autoApproveLowRisk'], value)}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <InputField
              label="Escalation hours"
              type="number"
              min="1"
              value={automation.escalationHours ?? ''}
              onChange={(event) => onDraftChange?.(['automation', 'escalationHours'], event.target.value)}
            />
            <InputField
              label="Reminder hours"
              type="number"
              min="1"
              value={automation.reminderHours ?? ''}
              onChange={(event) => onDraftChange?.(['automation', 'reminderHours'], event.target.value)}
            />
            <InputField
              label="Risk tolerance"
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={automation.riskTolerance ?? ''}
              onChange={(event) => onDraftChange?.(['automation', 'riskTolerance'], event.target.value)}
            />
            <InputField
              label="Notify channel"
              value={automation.notifyChannel ?? ''}
              onChange={(event) => onDraftChange?.(['automation', 'notifyChannel'], event.target.value)}
            />
          </div>
        </div>
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
          <h3 className="text-base font-semibold text-slate-900">Document policies & storage</h3>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Individual requirements
            <textarea
              rows={2}
              value={toCsv(documents.individual)}
              onChange={(event) => onDraftChange?.(['documents', 'individual'], fromCsv(event.target.value))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="passport, national_id"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Business requirements
            <textarea
              rows={2}
              value={toCsv(documents.business)}
              onChange={(event) => onDraftChange?.(['documents', 'business'], fromCsv(event.target.value))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="certificate_of_incorporation, utility_bill"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Additional notes
            <textarea
              rows={3}
              value={documents.additionalNotes ?? ''}
              onChange={(event) => onDraftChange?.(['documents', 'additionalNotes'], event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <InputField
              label="Evidence bucket"
              value={storage.evidenceBucket ?? ''}
              onChange={(event) => onDraftChange?.(['storage', 'evidenceBucket'], event.target.value)}
            />
            <InputField
              label="Public base URL"
              value={storage.publicBaseUrl ?? ''}
              onChange={(event) => onDraftChange?.(['storage', 'publicBaseUrl'], event.target.value)}
            />
          </div>
        </div>
      </div>
    </Wrapper>
  );
}

function InputField({ label, value, onChange, type = 'text', min, max, step }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
      <input
        type={type}
        min={min}
        max={max}
        step={step}
        value={value ?? ''}
        onChange={onChange}
        className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
      />
    </label>
  );
}

function ToggleField({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange?.(event.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
      />
    </label>
  );
}
