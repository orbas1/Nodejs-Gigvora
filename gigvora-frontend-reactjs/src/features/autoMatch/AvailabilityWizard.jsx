import { useEffect, useMemo, useState } from 'react';

const STEP_FLOW = [
  { id: 'status', label: 'Status' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'notify', label: 'Notify' },
];

const AVAILABILITY_CHOICES = [
  { value: 'available', label: 'On' },
  { value: 'snoozed', label: 'Pause' },
  { value: 'offline', label: 'Away' },
];

const MODE_CHOICES = [
  { value: 'always_on', label: 'Stream' },
  { value: 'business_hours', label: 'Hours' },
  { value: 'manual', label: 'Manual' },
];

function normalizePreference(preference) {
  if (!preference) {
    return {
      availabilityStatus: 'available',
      availabilityMode: 'always_on',
      timezone: '',
      dailyMatchLimit: '',
      autoAcceptThreshold: 70,
      quietHoursStart: '',
      quietHoursEnd: '',
      snoozedUntil: '',
      receiveEmailNotifications: true,
      receiveInAppNotifications: true,
      escalationContact: '',
      notes: '',
    };
  }

  return {
    availabilityStatus: preference.availabilityStatus ?? 'available',
    availabilityMode: preference.availabilityMode ?? 'always_on',
    timezone: preference.timezone ?? '',
    dailyMatchLimit:
      preference.dailyMatchLimit == null || Number.isNaN(Number(preference.dailyMatchLimit))
        ? ''
        : Number(preference.dailyMatchLimit),
    autoAcceptThreshold:
      preference.autoAcceptThreshold == null || Number.isNaN(Number(preference.autoAcceptThreshold))
        ? 70
        : Math.round(Number(preference.autoAcceptThreshold)),
    quietHoursStart: preference.quietHoursStart ?? '',
    quietHoursEnd: preference.quietHoursEnd ?? '',
    snoozedUntil: preference.snoozedUntil ? preference.snoozedUntil.slice(0, 16) : '',
    receiveEmailNotifications: Boolean(preference.receiveEmailNotifications ?? true),
    receiveInAppNotifications: Boolean(preference.receiveInAppNotifications ?? true),
    escalationContact: preference.escalationContact ?? '',
    notes: preference.notes ?? '',
  };
}

export default function AvailabilityWizard({ preference, onSubmit, saving = false, disabled = false }) {
  const [step, setStep] = useState(STEP_FLOW[0].id);
  const [formState, setFormState] = useState(() => normalizePreference(preference));
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setFormState(normalizePreference(preference));
  }, [preference]);

  const activeStepIndex = useMemo(() => STEP_FLOW.findIndex((item) => item.id === step), [step]);

  const availabilityLabel = useMemo(() => {
    return AVAILABILITY_CHOICES.find((choice) => choice.value === formState.availabilityStatus)?.label ?? 'On';
  }, [formState.availabilityStatus]);

  const handleChoiceChange = (key, value) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleFieldChange = (key) => (event) => {
    const { type, checked, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [key]: type === 'checkbox' ? checked : value,
    }));
  };

  const goToStep = (index) => {
    const target = STEP_FLOW[index];
    if (target) {
      setStep(target.id);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (disabled || saving) {
      return;
    }
    setFeedback(null);
    try {
      await onSubmit?.({
        ...formState,
        dailyMatchLimit:
          formState.dailyMatchLimit === '' || formState.dailyMatchLimit == null
            ? null
            : Number(formState.dailyMatchLimit),
        autoAcceptThreshold: Number(formState.autoAcceptThreshold),
        snoozedUntil: formState.snoozedUntil ? new Date(formState.snoozedUntil).toISOString() : null,
      });
      setFeedback({ type: 'success', message: 'Saved' });
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message ?? 'Update failed' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Availability</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{availabilityLabel}</p>
        </div>
        <nav className="flex gap-2 rounded-full bg-slate-100 p-1">
          {STEP_FLOW.map((item, index) => {
            const isActive = item.id === step;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => goToStep(index)}
                className={`rounded-full px-4 py-1 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                  isActive ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-blue-600'
                }`}
                disabled={disabled || saving}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
        {step === 'status' ? (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {AVAILABILITY_CHOICES.map((choice) => {
                const isActive = formState.availabilityStatus === choice.value;
                return (
                  <button
                    key={choice.value}
                    type="button"
                    onClick={() => handleChoiceChange('availabilityStatus', choice.value)}
                    className={`flex h-28 flex-col items-start justify-between rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                      isActive
                        ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-200 bg-white/70 text-slate-600 hover:border-blue-300'
                    }`}
                    disabled={disabled || saving}
                  >
                    <span className="text-sm font-semibold">{choice.label}</span>
                    <span className="text-xs text-slate-500">{choice.value === 'available' ? 'Visible now' : choice.value === 'snoozed' ? 'Hold invites' : 'Hidden'}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Mode</p>
              <div className="flex flex-wrap gap-2">
                {MODE_CHOICES.map((choice) => {
                  const isActive = formState.availabilityMode === choice.value;
                  return (
                    <button
                      key={choice.value}
                      type="button"
                      onClick={() => handleChoiceChange('availabilityMode', choice.value)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700'
                      }`}
                      disabled={disabled || saving}
                    >
                      {choice.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Auto accept threshold ({formState.autoAcceptThreshold}%)
              <input
                type="range"
                min="40"
                max="100"
                step="1"
                value={formState.autoAcceptThreshold}
                onChange={handleFieldChange('autoAcceptThreshold')}
                className="accent-blue-600"
                disabled={disabled || saving}
              />
            </label>
          </div>
        ) : null}

        {step === 'schedule' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Timezone
              <input
                type="text"
                placeholder="e.g. Europe/London"
                value={formState.timezone}
                onChange={handleFieldChange('timezone')}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                disabled={disabled || saving}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Daily invite cap
              <input
                type="number"
                min="0"
                placeholder="Unlimited"
                value={formState.dailyMatchLimit}
                onChange={handleFieldChange('dailyMatchLimit')}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                disabled={disabled || saving}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Quiet hours start
              <input
                type="time"
                value={formState.quietHoursStart}
                onChange={handleFieldChange('quietHoursStart')}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                disabled={disabled || saving}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Quiet hours end
              <input
                type="time"
                value={formState.quietHoursEnd}
                onChange={handleFieldChange('quietHoursEnd')}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                disabled={disabled || saving}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Pause until
              <input
                type="datetime-local"
                value={formState.snoozedUntil}
                onChange={handleFieldChange('snoozedUntil')}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                disabled={disabled || saving || formState.availabilityStatus !== 'snoozed'}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Notes
              <textarea
                rows={3}
                value={formState.notes}
                onChange={handleFieldChange('notes')}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                disabled={disabled || saving}
              />
            </label>
          </div>
        ) : null}

        {step === 'notify' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={formState.receiveEmailNotifications}
                onChange={handleFieldChange('receiveEmailNotifications')}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                disabled={disabled || saving}
              />
              Email alerts
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={formState.receiveInAppNotifications}
                onChange={handleFieldChange('receiveInAppNotifications')}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                disabled={disabled || saving}
              />
              In-app alerts
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Backup contact
              <input
                type="text"
                value={formState.escalationContact}
                onChange={handleFieldChange('escalationContact')}
                placeholder="Email or phone"
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                disabled={disabled || saving}
              />
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
              <p className="font-semibold text-slate-600">Reminders</p>
              <p className="mt-2">We send nudges if a match is idle longer than an hour.</p>
            </div>
          </div>
        ) : null}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-500">
          {feedback ? (
            <span className={feedback.type === 'error' ? 'text-rose-600' : 'text-emerald-600'}>{feedback.message}</span>
          ) : null}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => goToStep(Math.max(0, activeStepIndex - 1))}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={activeStepIndex <= 0 || disabled || saving}
          >
            Back
          </button>
          {activeStepIndex < STEP_FLOW.length - 1 ? (
            <button
              type="button"
              onClick={() => goToStep(Math.min(STEP_FLOW.length - 1, activeStepIndex + 1))}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={disabled || saving}
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={disabled || saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      </footer>
    </form>
  );
}
