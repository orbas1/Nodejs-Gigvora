import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  GlobeAltIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { addDays, format, isAfter, isBefore, parseISO } from 'date-fns';

function normalizeSlot(slot) {
  if (!slot) return null;
  if (typeof slot === 'string') {
    const start = parseISO(slot);
    return {
      id: slot,
      start,
      end: addDays(start, 0),
      label: format(start, 'p'),
    };
  }
  const start = typeof slot.start === 'string' ? parseISO(slot.start) : slot.start;
  const end = slot.end ? (typeof slot.end === 'string' ? parseISO(slot.end) : slot.end) : addDays(start, 0);
  return {
    id: slot.id ?? `${start.toISOString()}-${end.toISOString?.() ?? ''}`,
    start,
    end,
    label: slot.label ?? `${format(start, 'p')} - ${format(end, 'p')}`,
    metadata: slot.metadata,
  };
}

function groupSlots(availability = []) {
  return availability
    .map(normalizeSlot)
    .filter(Boolean)
    .reduce((acc, slot) => {
      const key = format(slot.start, 'yyyy-MM-dd');
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(slot);
      return acc;
    }, {});
}

function SessionTypeOption({ option, isActive, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option)}
      className={clsx(
        'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition',
        isActive
          ? 'border-sky-400 bg-sky-50 text-sky-700 shadow-[0_10px_30px_rgba(56,189,248,0.35)]'
          : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-600',
      )}
    >
      <div className="space-y-1">
        <p className="text-base font-semibold text-slate-900">{option.label}</p>
        {option.description ? <p className="text-xs text-slate-500">{option.description}</p> : null}
      </div>
      <div className="text-right text-xs font-semibold text-slate-500">
        {option.duration ? <p>{option.duration}</p> : null}
        {option.price ? <p className="text-slate-900">{option.price}</p> : null}
      </div>
    </button>
  );
}

SessionTypeOption.propTypes = {
  option: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    duration: PropTypes.string,
    price: PropTypes.string,
  }).isRequired,
  isActive: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};

export default function SessionScheduler({
  availability,
  timezoneOptions,
  defaultTimezone,
  sessionTypes,
  onSchedule,
  onTrack,
  mentor,
  isSubmitting = false,
  schedulingWindow = 21,
  emptyCopy = 'Mentor is updating availability. Check back soon.',
  analyticsContext,
}) {
  const [startDate, setStartDate] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [selectedSessionType, setSelectedSessionType] = useState(() => sessionTypes?.[0] ?? null);
  const [selectedTimezone, setSelectedTimezone] = useState(defaultTimezone ?? timezoneOptions?.[0]);
  const [notes, setNotes] = useState('');

  const slotsByDay = useMemo(() => groupSlots(availability), [availability]);
  const orderedDates = useMemo(() => Object.keys(slotsByDay).sort(), [slotsByDay]);
  const activeDateKey = selectedDateKey ?? orderedDates[0] ?? null;

  const visibleWeek = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => addDays(startDate, index));
  }, [startDate]);

  const activeSlots = useMemo(() => {
    if (!activeDateKey) return [];
    return (slotsByDay[activeDateKey] ?? []).sort((a, b) => a.start - b.start);
  }, [activeDateKey, slotsByDay]);

  const selectedSlot = useMemo(() => {
    if (!selectedSlotId) return null;
    return Object.values(slotsByDay)
      .flat()
      .find((slot) => slot.id === selectedSlotId);
  }, [selectedSlotId, slotsByDay]);

  useEffect(() => {
    if (!activeDateKey && orderedDates.length) {
      setSelectedDateKey(orderedDates[0]);
    }
  }, [orderedDates, activeDateKey]);

  useEffect(() => {
    onTrack?.({
      type: 'scheduler:viewed',
      mentorId: mentor?.id,
      availableDates: orderedDates.length,
      context: analyticsContext,
    });
  }, [mentor?.id, orderedDates.length, analyticsContext, onTrack]);

  const goToPreviousWeek = () => {
    const next = addDays(startDate, -7);
    setStartDate(next);
    onTrack?.({ type: 'scheduler:navigate-week', direction: 'previous', mentorId: mentor?.id });
  };

  const goToNextWeek = () => {
    const next = addDays(startDate, 7);
    setStartDate(next);
    onTrack?.({ type: 'scheduler:navigate-week', direction: 'next', mentorId: mentor?.id });
  };

  const isDateWithinWindow = (date) => {
    if (!schedulingWindow) return true;
    const now = new Date();
    const upperBound = addDays(now, schedulingWindow);
    return !isBefore(date, now) && !isAfter(date, upperBound);
  };

  const handleSchedule = () => {
    if (!selectedSlot || !selectedSessionType) return;
    const resolvedMentorId = mentor?.userId ?? mentor?.id ?? null;
    onSchedule?.({
      mentorId: resolvedMentorId,
      mentorProfileId: mentor?.id ?? null,
      mentor,
      slot: selectedSlot,
      sessionType: selectedSessionType,
      timezone: selectedTimezone,
      notes,
    });
  };

  const hasAvailability = orderedDates.length > 0;

  return (
    <section className="flex w-full flex-col gap-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Book a session</h2>
          <div className="flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
            <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
            <span>{mentor ? `With ${mentor.firstName ?? mentor.displayName ?? 'mentor'}` : 'Mentorship'}</span>
          </div>
        </div>
        <p className="text-sm text-slate-500">
          Reserve premium 1:1 time with tailored preparation notes. Availability is refreshed in real-time with timezone-aware
          syncing so you never double-book.
        </p>
      </header>

      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
            <button
              type="button"
              onClick={goToPreviousWeek}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-sky-200 hover:text-sky-600"
              aria-label="Previous week"
            >
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
              <CalendarDaysIcon className="h-5 w-5 text-sky-500" aria-hidden="true" />
              <span>{format(startDate, 'MMM d')} – {format(addDays(startDate, 6), 'MMM d')}</span>
            </div>
            <button
              type="button"
              onClick={goToNextWeek}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-sky-200 hover:text-sky-600"
              aria-label="Next week"
            >
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {visibleWeek.map((date) => {
              const key = format(date, 'yyyy-MM-dd');
              const isActive = activeDateKey === key;
              const hasSlots = (slotsByDay[key] ?? []).length > 0;
              const withinWindow = isDateWithinWindow(date);
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => {
                    if (!hasSlots || !withinWindow) return;
                    setSelectedDateKey(key);
                    setSelectedSlotId(null);
                    onTrack?.({ type: 'scheduler:select-date', mentorId: mentor?.id, key });
                  }}
                  className={clsx(
                    'flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2',
                    isActive
                      ? 'border-sky-400 bg-sky-50 text-sky-700 shadow-[0_15px_40px_rgba(56,189,248,0.35)]'
                      : hasSlots && withinWindow
                        ? 'border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-600'
                        : 'border-dashed border-slate-200 bg-slate-50 text-slate-400',
                  )}
                  disabled={!hasSlots || !withinWindow}
                >
                  <span className="font-semibold uppercase tracking-wide">{format(date, 'EEE')}</span>
                  <span className="text-base font-semibold">{format(date, 'd')}</span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {hasSlots ? `${slotsByDay[key].length} slots` : '—'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Available slots</h3>
            {activeSlots.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {activeSlots.map((slot) => (
                  <button
                    type="button"
                    key={slot.id}
                    onClick={() => {
                      setSelectedSlotId(slot.id);
                      onTrack?.({ type: 'scheduler:select-slot', mentorId: mentor?.id, slotId: slot.id });
                    }}
                    className={clsx(
                      'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition',
                      selectedSlotId === slot.id
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-[0_15px_40px_rgba(16,185,129,0.25)]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-600',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <ClockIcon className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                      <div className="text-left">
                        <p className="font-semibold text-slate-900">{slot.label}</p>
                        {slot.metadata?.note ? <p className="text-xs text-slate-400">{slot.metadata.note}</p> : null}
                      </div>
                    </div>
                    <CheckCircleIcon
                      className={clsx('h-5 w-5', selectedSlotId === slot.id ? 'text-emerald-500' : 'text-slate-300')}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                {hasAvailability
                  ? 'Select a date to see times.'
                  : emptyCopy}
              </div>
            )}
          </div>
        </div>

        <div className="w-full space-y-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-5 lg:w-80">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Session type</h3>
            <div className="space-y-2">
              {sessionTypes?.length ? (
                sessionTypes.map((option) => (
                  <SessionTypeOption
                    key={option.id}
                    option={option}
                    isActive={selectedSessionType?.id === option.id}
                    onSelect={(value) => {
                      setSelectedSessionType(value);
                      onTrack?.({ type: 'scheduler:select-session-type', mentorId: mentor?.id, sessionTypeId: value.id });
                    }}
                  />
                ))
              ) : (
                <p className="rounded-2xl border border-slate-100 bg-white/70 p-4 text-xs text-slate-500">
                  Session types will appear here once the mentor publishes offerings.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500" htmlFor="session-timezone">
              Timezone
            </label>
            <div className="relative">
              <GlobeAltIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <select
                id="session-timezone"
                value={selectedTimezone?.value ?? selectedTimezone}
                onChange={(event) => {
                  const value = event.target.value;
                  const option = timezoneOptions?.find((item) => item.value === value) ?? value;
                  setSelectedTimezone(option);
                  onTrack?.({ type: 'scheduler:select-timezone', mentorId: mentor?.id, value });
                }}
                className="w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-10 text-sm font-semibold text-slate-600 shadow-inner focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-300/40"
              >
                {(timezoneOptions ?? []).map((option) => (
                  <option key={option.value ?? option} value={option.value ?? option}>
                    {option.label ?? option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500" htmlFor="session-notes">
              Notes for mentor
            </label>
            <textarea
              id="session-notes"
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Share goals, context, or materials to review ahead of time."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-inner placeholder:text-slate-400 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-300/40"
            />
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-100 bg-white/70 p-4 text-xs text-slate-500">
            <div className="flex items-center gap-2 text-slate-600">
              <InformationCircleIcon className="h-4 w-4 text-sky-500" aria-hidden="true" />
              <p className="font-semibold uppercase tracking-wide">Session guarantee</p>
            </div>
            <p>
              We hold the slot for 15 minutes after booking and send calendar invites instantly. Reschedule up to 24 hours before
              start time with no penalties.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSchedule}
            disabled={!selectedSlot || !selectedSessionType || isSubmitting}
            className={clsx(
              'flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2',
              !selectedSlot || !selectedSessionType || isSubmitting ? 'opacity-70' : 'hover:shadow-xl',
            )}
          >
            <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
            {isSubmitting ? 'Scheduling...' : 'Confirm session'}
          </button>

          <p className="text-[11px] text-slate-400">
            By scheduling, you agree to mentorship community guidelines and consent to reminders via email & push.
          </p>
        </div>
      </div>
    </section>
  );
}

SessionScheduler.propTypes = {
  availability: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        start: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
        end: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
        label: PropTypes.string,
        metadata: PropTypes.shape({ note: PropTypes.string }),
      }),
    ]),
  ),
  timezoneOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string,
    }),
  ),
  defaultTimezone: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string }),
  ]),
  sessionTypes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      duration: PropTypes.string,
      price: PropTypes.string,
    }),
  ),
  onSchedule: PropTypes.func,
  onTrack: PropTypes.func,
  mentor: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    firstName: PropTypes.string,
    displayName: PropTypes.string,
  }),
  isSubmitting: PropTypes.bool,
  schedulingWindow: PropTypes.number,
  emptyCopy: PropTypes.string,
  analyticsContext: PropTypes.object,
};
