import { useEffect, useMemo, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ORDER_LOOKUP = DAYS_OF_WEEK.reduce((accumulator, day, index) => {
  accumulator[day] = index;
  return accumulator;
}, {});

function sortSlots(slots) {
  return [...slots].sort((slotA, slotB) => {
    const dayDelta = (DAY_ORDER_LOOKUP[slotA.day] ?? 0) - (DAY_ORDER_LOOKUP[slotB.day] ?? 0);
    if (dayDelta !== 0) {
      return dayDelta;
    }
    const startA = new Date(slotA.start).getTime();
    const startB = new Date(slotB.start).getTime();
    return startA - startB;
  });
}

function normaliseSlots(input = []) {
  return sortSlots(
    input.map((slot) => ({
      ...slot,
      id: slot.id ?? `${slot.day}-${slot.start}-${slot.end}-${slot.format ?? 'session'}`,
    })),
  );
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function AvailabilitySlot({ slot, onRemove }) {
  const formattedStart = useMemo(() => {
    try {
      return dateTimeFormatter.format(new Date(slot.start));
    } catch (error) {
      return slot.start;
    }
  }, [slot.start]);

  const formattedEnd = useMemo(() => {
    try {
      return dateTimeFormatter.format(new Date(slot.end));
    } catch (error) {
      return slot.end;
    }
  }, [slot.end]);

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
      <div>
        <p className="font-semibold text-slate-800">{slot.day}</p>
        <p className="text-xs text-slate-500">
          {formattedStart} – {formattedEnd} • {slot.format}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onRemove(slot.id)}
        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-rose-200 hover:text-rose-500"
      >
        Remove
      </button>
    </div>
  );
}

export default function MentorAvailabilityPlanner({
  availability = [],
  formats = ['1:1 session', 'Office hours', 'Cohort clinic'],
  onSave,
  saving = false,
  analytics,
}) {
  const [slots, setSlots] = useState(() => normaliseSlots(availability));
  const [formState, setFormState] = useState({
    day: DAYS_OF_WEEK[0],
    start: '',
    end: '',
    format: formats[0] ?? '1:1 session',
    capacity: 1,
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setSlots((previous) => {
      const next = normaliseSlots(availability);
      const hasChanged =
        previous.length !== next.length ||
        previous.some((slot, index) => {
          const compared = next[index];
          return (
            slot.id !== compared.id ||
            slot.start !== compared.start ||
            slot.end !== compared.end ||
            slot.day !== compared.day ||
            slot.format !== compared.format ||
            slot.capacity !== compared.capacity
          );
        });
      return hasChanged ? next : previous;
    });
  }, [availability]);

  const handleAddSlot = () => {
    setError(null);
    setSuccess(false);
    if (!formState.start || !formState.end) {
      setError('Select both a start and end time for the session.');
      return;
    }
    const startDate = new Date(formState.start);
    const endDate = new Date(formState.end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setError('Please provide valid start and end times.');
      return;
    }
    if (endDate <= startDate) {
      setError('End time must be later than the start time.');
      return;
    }
    const capacity = Math.max(1, Number.parseInt(formState.capacity, 10) || 1);
    const id = `${formState.day}-${startDate.toISOString()}-${endDate.toISOString()}-${formState.format}`;
    let added = false;
    setSlots((previous) => {
      const overlaps = previous.some((existing) => {
        if (existing.day !== formState.day) {
          return false;
        }
        const existingStart = new Date(existing.start).getTime();
        const existingEnd = new Date(existing.end).getTime();
        return startDate.getTime() < existingEnd && endDate.getTime() > existingStart;
      });
      if (overlaps) {
        setError('That slot overlaps with an existing availability window. Update the times or remove the original slot.');
        return previous;
      }
      added = true;
      return sortSlots([
        ...previous,
        {
          id,
          day: formState.day,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          format: formState.format,
          capacity,
        },
      ]);
    });
    if (!added) {
      return;
    }
    setFormState((current) => ({ ...current, start: '', end: '' }));
  };

  const handleRemoveSlot = (slotId) => {
    setSuccess(false);
    setSlots((previous) => previous.filter((slot) => slot.id !== slotId));
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    try {
      const payload = slots.map(({ id, ...rest }) => rest);
      if (typeof onSave === 'function') {
        await onSave(payload);
      }
      if (analytics?.track) {
        analytics.track('web_mentor_availability_saved', {
          slots: payload.length,
          totalCapacity: payload.reduce((total, slot) => total + (slot.capacity ?? 1), 0),
        });
      }
      setSuccess(true);
    } catch (saveError) {
      setError(saveError.message || 'Unable to save availability. Please try again.');
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Availability & formats</h3>
          <p className="mt-1 text-sm text-slate-500">
            Publish recurring office hours or ad-hoc mentorship sessions. These slots sync to Explorer and the mentee booking
            flow.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {saving ? 'Saving…' : 'Save availability'}
        </button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Day of week
          <select
            value={formState.day}
            onChange={(event) => setFormState((current) => ({ ...current, day: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {DAYS_OF_WEEK.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Session format
          <select
            value={formState.format}
            onChange={(event) => setFormState((current) => ({ ...current, format: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {formats.map((formatLabel) => (
              <option key={formatLabel} value={formatLabel}>
                {formatLabel}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Start
          <input
            type="datetime-local"
            value={formState.start}
            onChange={(event) => setFormState((current) => ({ ...current, start: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          End
          <input
            type="datetime-local"
            value={formState.end}
            onChange={(event) => setFormState((current) => ({ ...current, end: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Seats per slot
          <input
            type="number"
            min="1"
            value={formState.capacity}
            onChange={(event) => setFormState((current) => ({ ...current, capacity: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleAddSlot}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
          >
            <PlusIcon className="h-4 w-4" /> Add slot
          </button>
        </div>
      </div>
      {error ? (
        <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-2 text-sm text-rose-600" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-2 text-sm text-emerald-600" role="status" aria-live="polite">
          Availability updated.
        </p>
      ) : null}
      <div className="mt-6 space-y-3">
        {slots.length ? (
          sortSlots(slots).map((slot) => <AvailabilitySlot key={slot.id} slot={slot} onRemove={handleRemoveSlot} />)
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            No availability published yet. Add at least one slot to go live on Explorer.
          </p>
        )}
      </div>
    </section>
  );
}
