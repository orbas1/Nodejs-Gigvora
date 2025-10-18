import { useEffect, useMemo, useState } from 'react';
import RolePicker from './RolePicker.jsx';
import {
  APPLICATION_STATUS_OPTIONS,
} from '../constants.js';
import { formatDateInput, optionLabelFor, safeNumber } from '../utils.js';

export default function ApplicationForm({ value, onSubmit, onCancel, busy }) {
  const [role, setRole] = useState(value?.role ?? null);
  const [status, setStatus] = useState(value?.status ?? 'draft');
  const [availabilityStart, setAvailabilityStart] = useState(formatDateInput(value?.availabilityStart));
  const [availabilityHoursPerWeek, setAvailabilityHoursPerWeek] = useState(
    value?.availabilityHoursPerWeek != null ? String(value.availabilityHoursPerWeek) : '',
  );
  const [submittedAt, setSubmittedAt] = useState(formatDateInput(value?.submittedAt));
  const [decisionAt, setDecisionAt] = useState(formatDateInput(value?.decisionAt));
  const [motivation, setMotivation] = useState(value?.motivation ?? '');
  const [notes, setNotes] = useState(value?.notes ?? '');
  const [error, setError] = useState(null);

  useEffect(() => {
    setRole(value?.role ?? null);
    setStatus(value?.status ?? 'draft');
    setAvailabilityStart(formatDateInput(value?.availabilityStart));
    setAvailabilityHoursPerWeek(value?.availabilityHoursPerWeek != null ? String(value.availabilityHoursPerWeek) : '');
    setSubmittedAt(formatDateInput(value?.submittedAt));
    setDecisionAt(formatDateInput(value?.decisionAt));
    setMotivation(value?.motivation ?? '');
    setNotes(value?.notes ?? '');
    setError(null);
  }, [value]);

  const statusLabel = useMemo(() => optionLabelFor(status, APPLICATION_STATUS_OPTIONS), [status]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!role?.id) {
      setError('Pick a role');
      return;
    }
    setError(null);
    await onSubmit({
      volunteeringRoleId: role.id,
      status,
      availabilityStart: availabilityStart || null,
      availabilityHoursPerWeek: safeNumber(availabilityHoursPerWeek),
      submittedAt: submittedAt || null,
      decisionAt: decisionAt || null,
      motivation: motivation || null,
      notes: notes || null,
    });
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</label>
        <RolePicker value={role} onChange={setRole} disabled={busy} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Status
          <select
            className="rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            disabled={busy}
          >
            {APPLICATION_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">{statusLabel}</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Start date
          <input
            type="date"
            className="rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            value={availabilityStart}
            onChange={(event) => setAvailabilityStart(event.target.value)}
            disabled={busy}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Hours / week
          <input
            type="number"
            min="0"
            max="168"
            className="rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            value={availabilityHoursPerWeek}
            onChange={(event) => setAvailabilityHoursPerWeek(event.target.value)}
            disabled={busy}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Submitted
          <input
            type="date"
            className="rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            value={submittedAt}
            onChange={(event) => setSubmittedAt(event.target.value)}
            disabled={busy}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Decision
          <input
            type="date"
            className="rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            value={decisionAt}
            onChange={(event) => setDecisionAt(event.target.value)}
            disabled={busy}
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Motivation
        <textarea
          className="min-h-[90px] rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          value={motivation}
          onChange={(event) => setMotivation(event.target.value)}
          disabled={busy}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Notes
        <textarea
          className="min-h-[90px] rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={busy}
        />
      </label>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:bg-emerald-300"
          disabled={busy}
        >
          Save
        </button>
      </div>
    </form>
  );
}
