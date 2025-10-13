import { useMemo, useState } from 'react';

const ROTATION_OPTIONS = [
  { label: '2 minutes', value: 120 },
  { label: '3 minutes', value: 180 },
  { label: '5 minutes', value: 300 },
];

const SESSION_LENGTH_OPTIONS = [
  { label: '20 minutes (10 rotations)', value: 20 },
  { label: '30 minutes (15 rotations)', value: 30 },
  { label: '45 minutes (22 rotations)', value: 45 },
  { label: '60 minutes (30 rotations)', value: 60 },
];

export default function NetworkingSessionDesigner({ onCreateSession, defaultValues = {}, disabled }) {
  const [form, setForm] = useState(() => ({
    title: defaultValues.title ?? 'Speed networking showcase',
    description:
      defaultValues.description ??
      'Give each attendee five minutes to pitch, exchange digital business cards, and queue warm follow-ups.',
    startTime: defaultValues.startTime ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    sessionLengthMinutes: defaultValues.sessionLengthMinutes ?? 30,
    rotationDurationSeconds: defaultValues.rotationDurationSeconds ?? 180,
    joinLimit: defaultValues.joinLimit ?? 40,
    waitlistLimit: defaultValues.waitlistLimit ?? 30,
    accessType: defaultValues.accessType ?? 'free',
    price: defaultValues.price ?? 0,
    requiresApproval: defaultValues.requiresApproval ?? false,
    lobbyInstructions:
      defaultValues.lobbyInstructions ??
      'Join five minutes early. Cameras on, mic ready. Use chat to drop intro and digital business card.',
    followUpActions:
      defaultValues.followUpActions ?? {
        reminders: ['Send follow-up deck via Gigvora chat', 'Log priority connections in CRM tab'],
      },
    penaltyRules: defaultValues.penaltyRules ?? { noShowThreshold: 2, cooldownDays: 14 },
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const rotationOption = useMemo(
    () => ROTATION_OPTIONS.find((option) => option.value === Number(form.rotationDurationSeconds)) ?? ROTATION_OPTIONS[1],
    [form.rotationDurationSeconds],
  );

  const sessionLengthOption = useMemo(
    () =>
      SESSION_LENGTH_OPTIONS.find((option) => option.value === Number(form.sessionLengthMinutes)) ?? SESSION_LENGTH_OPTIONS[1],
    [form.sessionLengthMinutes],
  );

  const totalRotations = useMemo(() => {
    const minutes = Number(form.sessionLengthMinutes) || 0;
    const rotationSeconds = Number(form.rotationDurationSeconds) || 1;
    return Math.max(1, Math.floor((minutes * 60) / rotationSeconds));
  }, [form.sessionLengthMinutes, form.rotationDurationSeconds]);

  const handleChange = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!onCreateSession) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...form,
        joinLimit: Number(form.joinLimit) || null,
        waitlistLimit: Number(form.waitlistLimit) || null,
        sessionLengthMinutes: Number(form.sessionLengthMinutes) || 30,
        rotationDurationSeconds: Number(form.rotationDurationSeconds) || 180,
        price: Number(form.price) || 0,
        startTime: form.startTime ? new Date(form.startTime).toISOString() : null,
      };
      await onCreateSession(payload);
    } catch (submissionError) {
      setError(submissionError.message || 'Failed to create session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <header className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Design a networking session</h2>
        <p className="text-sm text-slate-600">
          Configure timing, join limits, pricing, and lobby instructions. Attendees will enter a warm lobby, cycle through
          timed rotations, and exchange Gigvora digital business cards.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Session title</span>
          <input
            type="text"
            value={form.title}
            onChange={(event) => handleChange('title', event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="Speed networking for founders"
            disabled={disabled || isSubmitting}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Start time</span>
          <input
            type="datetime-local"
            value={form.startTime}
            onChange={(event) => handleChange('startTime', event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            disabled={disabled || isSubmitting}
            required
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Description</span>
        <textarea
          value={form.description}
          onChange={(event) => handleChange('description', event.target.value)}
          rows={3}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          disabled={disabled || isSubmitting}
        />
      </label>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Session length</span>
          <select
            value={sessionLengthOption.value}
            onChange={(event) => handleChange('sessionLengthMinutes', Number(event.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            disabled={disabled || isSubmitting}
          >
            {SESSION_LENGTH_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">{totalRotations} rotations at current slot length.</p>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Rotation duration</span>
          <select
            value={rotationOption.value}
            onChange={(event) => handleChange('rotationDurationSeconds', Number(event.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            disabled={disabled || isSubmitting}
          >
            {ROTATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">Automated shuffling keeps meetings crisp.</p>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Join limit</span>
          <input
            type="number"
            min="2"
            value={form.joinLimit}
            onChange={(event) => handleChange('joinLimit', event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            disabled={disabled || isSubmitting}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Waitlist limit</span>
          <input
            type="number"
            min="0"
            value={form.waitlistLimit}
            onChange={(event) => handleChange('waitlistLimit', event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            disabled={disabled || isSubmitting}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Access type</span>
          <select
            value={form.accessType}
            onChange={(event) => handleChange('accessType', event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            disabled={disabled || isSubmitting}
          >
            <option value="free">Free</option>
            <option value="paid">Paid</option>
            <option value="invite_only">Invite only</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Ticket price (USD)</span>
          <input
            type="number"
            min="0"
            step="1"
            value={form.price}
            onChange={(event) => handleChange('price', event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            disabled={disabled || form.accessType !== 'paid' || isSubmitting}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Lobby instructions</span>
          <textarea
            value={form.lobbyInstructions}
            onChange={(event) => handleChange('lobbyInstructions', event.target.value)}
            rows={3}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            disabled={disabled || isSubmitting}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Penalty policy</span>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-500">No-show threshold</p>
              <input
                type="number"
                min="1"
                value={form.penaltyRules.noShowThreshold}
                onChange={(event) =>
                  handleChange('penaltyRules', {
                    ...form.penaltyRules,
                    noShowThreshold: Number(event.target.value) || 1,
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                disabled={disabled || isSubmitting}
              />
            </div>
            <div>
              <p className="text-xs text-slate-500">Cooldown days</p>
              <input
                type="number"
                min="1"
                value={form.penaltyRules.cooldownDays}
                onChange={(event) =>
                  handleChange('penaltyRules', {
                    ...form.penaltyRules,
                    cooldownDays: Number(event.target.value) || 1,
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                disabled={disabled || isSubmitting}
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <input
              id="requires-approval"
              type="checkbox"
              checked={form.requiresApproval}
              onChange={(event) => handleChange('requiresApproval', event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              disabled={disabled || isSubmitting}
            />
            <label htmlFor="requires-approval" className="text-slate-600">
              Require host approval before attendees can join
            </label>
          </div>
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={disabled || isSubmitting}
        >
          {isSubmitting ? 'Creating…' : 'Create session'}
        </button>
      </div>
    </form>
  );
}
