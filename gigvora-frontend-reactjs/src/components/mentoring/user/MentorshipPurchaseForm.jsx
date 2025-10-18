import { useMemo, useState } from 'react';

function formatMentor(mentor) {
  if (!mentor) return '';
  const name = [mentor.firstName, mentor.lastName].filter(Boolean).join(' ') || `Mentor #${mentor.id}`;
  const headline = mentor.profile?.headline || mentor.profile?.missionStatement || null;
  return headline ? `${name} — ${headline}` : name;
}

const STATUS_OPTIONS = ['pending', 'active', 'completed', 'cancelled'];

export default function MentorshipPurchaseForm({ mentors = [], onSubmit, onCancel, initialValues = {}, submitting = false }) {
  const [formState, setFormState] = useState(() => ({
    mentorId: initialValues.mentorId ?? '',
    packageName: initialValues.packageName ?? '',
    packageDescription: initialValues.packageDescription ?? '',
    sessionsPurchased: initialValues.sessionsPurchased ?? 1,
    sessionsRedeemed: initialValues.sessionsRedeemed ?? 0,
    totalAmount: initialValues.totalAmount ?? '',
    currency: initialValues.currency ?? 'USD',
    status: initialValues.status ?? 'pending',
    purchasedAt: initialValues.purchasedAt ? initialValues.purchasedAt.slice(0, 16) : '',
    expiresAt: initialValues.expiresAt ? initialValues.expiresAt.slice(0, 16) : '',
    notes: initialValues.metadata?.notes ?? '',
  }));

  const mentorOptions = useMemo(() => {
    const seen = new Map();
    mentors.forEach((mentor) => {
      if (mentor && mentor.id && !seen.has(mentor.id)) {
        seen.set(mentor.id, mentor);
      }
    });
    return Array.from(seen.values());
  }, [mentors]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!onSubmit) return;
    const payload = {
      mentorId: Number(formState.mentorId),
      packageName: formState.packageName,
      packageDescription: formState.packageDescription || undefined,
      sessionsPurchased: Number(formState.sessionsPurchased || 1),
      sessionsRedeemed: Number(formState.sessionsRedeemed || 0),
      totalAmount: Number(formState.totalAmount || 0),
      currency: formState.currency || 'USD',
      status: formState.status,
      purchasedAt: formState.purchasedAt ? new Date(formState.purchasedAt).toISOString() : undefined,
      expiresAt: formState.expiresAt ? new Date(formState.expiresAt).toISOString() : undefined,
      metadata: formState.notes ? { notes: formState.notes } : undefined,
    };
    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Mentor</span>
          <select
            name="mentorId"
            value={formState.mentorId}
            onChange={handleChange}
            required
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
          >
            <option value="">Select mentor…</option>
            {mentorOptions.map((mentor) => (
              <option key={mentor.id} value={mentor.id}>
                {formatMentor(mentor)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Status</span>
          <select
            name="status"
            value={formState.status}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-slate-700">Package name</span>
        <input
          name="packageName"
          value={formState.packageName}
          onChange={handleChange}
          required
          placeholder="Interview fast-track credits"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-slate-700">Package description</span>
        <textarea
          name="packageDescription"
          value={formState.packageDescription}
          onChange={handleChange}
          rows="3"
          placeholder="Detail the outcomes or inclusions agreed with the mentor."
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Sessions purchased</span>
          <input
            type="number"
            min="1"
            name="sessionsPurchased"
            value={formState.sessionsPurchased}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Sessions used</span>
          <input
            type="number"
            min="0"
            name="sessionsRedeemed"
            value={formState.sessionsRedeemed}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Total amount</span>
          <input
            type="number"
            min="0"
            step="0.01"
            name="totalAmount"
            value={formState.totalAmount}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
            required
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Currency</span>
          <input
            name="currency"
            value={formState.currency}
            onChange={handleChange}
            maxLength={3}
            className="rounded-xl border border-slate-300 px-3 py-2 uppercase text-sm shadow-inner focus:border-accent focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Purchased at</span>
          <input
            type="datetime-local"
            name="purchasedAt"
            value={formState.purchasedAt}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Expires at</span>
          <input
            type="datetime-local"
            name="expiresAt"
            value={formState.expiresAt}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-slate-700">Internal notes</span>
        <textarea
          name="notes"
          value={formState.notes}
          onChange={handleChange}
          rows="3"
          placeholder="Record commitments, entitlements, or renewal reminders."
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
        />
      </label>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            disabled={submitting}
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? 'Saving…' : 'Save package'}
        </button>
      </div>
    </form>
  );
}
