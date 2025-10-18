import { useEffect, useMemo, useState } from 'react';

function clampDecimal(value, precision = 2) {
  if (value === '' || value == null) {
    return '';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '';
  }
  const factor = 10 ** precision;
  return Math.max(0, Math.round(numeric * factor) / factor);
}

function clampDuration(value) {
  if (value === '' || value == null) {
    return '';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '';
  }
  return Math.min(520, Math.max(1, Math.round(numeric)));
}

function joinSkills(values) {
  if (!Array.isArray(values)) {
    return '';
  }
  return values.join(', ');
}

export default function AutoMatchSettingsForm({ project, onSubmit, submitting }) {
  const [form, setForm] = useState({
    enabled: false,
    autoAcceptEnabled: false,
    autoRejectEnabled: false,
    budgetMin: '',
    budgetMax: '',
    weeklyHoursMin: '',
    weeklyHoursMax: '',
    durationWeeksMin: '',
    durationWeeksMax: '',
    skills: '',
    notes: '',
  });

  const autoMatch = useMemo(() => project?.autoMatch ?? {}, [project]);

  useEffect(() => {
    setForm({
      enabled: Boolean(autoMatch.enabled),
      autoAcceptEnabled: Boolean(autoMatch.autoAcceptEnabled),
      autoRejectEnabled: Boolean(autoMatch.autoRejectEnabled),
      budgetMin: autoMatch.budgetMin ?? '',
      budgetMax: autoMatch.budgetMax ?? '',
      weeklyHoursMin: autoMatch.weeklyHoursMin ?? '',
      weeklyHoursMax: autoMatch.weeklyHoursMax ?? '',
      durationWeeksMin: autoMatch.durationWeeksMin ?? '',
      durationWeeksMax: autoMatch.durationWeeksMax ?? '',
      skills: joinSkills(autoMatch.skills),
      notes: autoMatch.notes ?? '',
    });
  }, [autoMatch]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      enabled: form.enabled,
      autoAcceptEnabled: form.autoAcceptEnabled,
      autoRejectEnabled: form.autoRejectEnabled,
      budgetMin: form.budgetMin === '' ? undefined : clampDecimal(form.budgetMin),
      budgetMax: form.budgetMax === '' ? undefined : clampDecimal(form.budgetMax),
      weeklyHoursMin: form.weeklyHoursMin === '' ? undefined : clampDecimal(form.weeklyHoursMin, 1),
      weeklyHoursMax: form.weeklyHoursMax === '' ? undefined : clampDecimal(form.weeklyHoursMax, 1),
      durationWeeksMin: form.durationWeeksMin === '' ? undefined : clampDuration(form.durationWeeksMin),
      durationWeeksMax: form.durationWeeksMax === '' ? undefined : clampDuration(form.durationWeeksMax),
      skills: form.skills
        .split(',')
        .map((skill) => skill.trim().toLowerCase())
        .filter((skill) => skill.length > 0)
        .slice(0, 50),
      notes: form.notes.trim() || undefined,
    };

    await onSubmit(payload);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 lg:grid-cols-3">
        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            name="enabled"
            checked={form.enabled}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
          />
          Auto-Match
        </label>
        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            name="autoAcceptEnabled"
            checked={form.autoAcceptEnabled}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
          />
          Auto-Accept
        </label>
        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            name="autoRejectEnabled"
            checked={form.autoRejectEnabled}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
          />
          Guardrails
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <label className="flex flex-col text-sm font-medium text-slate-700">
          Budget Min
          <input
            type="number"
            name="budgetMin"
            min="0"
            step="0.01"
            value={form.budgetMin}
            onChange={(event) =>
              handleChange({
                target: { name: 'budgetMin', value: clampDecimal(event.target.value) },
              })
            }
            className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-700">
          Budget Max
          <input
            type="number"
            name="budgetMax"
            min="0"
            step="0.01"
            value={form.budgetMax}
            onChange={(event) =>
              handleChange({
                target: { name: 'budgetMax', value: clampDecimal(event.target.value) },
              })
            }
            className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-700">
          Skills
          <input
            type="text"
            name="skills"
            value={form.skills}
            onChange={handleChange}
            placeholder="Design, react"
            className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <label className="flex flex-col text-sm font-medium text-slate-700">
          Hours Min
          <input
            type="number"
            name="weeklyHoursMin"
            min="0"
            step="0.5"
            value={form.weeklyHoursMin}
            onChange={(event) =>
              handleChange({
                target: { name: 'weeklyHoursMin', value: clampDecimal(event.target.value, 1) },
              })
            }
            className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-700">
          Hours Max
          <input
            type="number"
            name="weeklyHoursMax"
            min="0"
            step="0.5"
            value={form.weeklyHoursMax}
            onChange={(event) =>
              handleChange({
                target: { name: 'weeklyHoursMax', value: clampDecimal(event.target.value, 1) },
              })
            }
            className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-700">
          Duration Min
          <input
            type="number"
            name="durationWeeksMin"
            min="1"
            step="1"
            value={form.durationWeeksMin}
            onChange={(event) =>
              handleChange({
                target: { name: 'durationWeeksMin', value: clampDuration(event.target.value) },
              })
            }
            className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-700">
          Duration Max
          <input
            type="number"
            name="durationWeeksMax"
            min="1"
            step="1"
            value={form.durationWeeksMax}
            onChange={(event) =>
              handleChange({
                target: { name: 'durationWeeksMax', value: clampDuration(event.target.value) },
              })
            }
            className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
      </div>

      <label className="flex flex-col text-sm font-medium text-slate-700">
        Notes
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </label>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
