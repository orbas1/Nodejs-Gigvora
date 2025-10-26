import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  GlobeAltIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline';

const DEFAULT_AGENDA_TEMPLATES = [
  {
    id: 'kickoff',
    title: 'Kickoff alignment',
    description: 'Clarify goals, context, and desired momentum for the next 90 days.',
    agenda: ['Current role + mandate', 'North-star outcomes', 'Immediate blockers', 'Follow-up rituals'],
  },
  {
    id: 'growth_sprint',
    title: 'Growth sprint planning',
    description: 'Design a focused sprint across GTM, product, and ops levers.',
    agenda: ['Performance baseline review', 'Key experiments', 'Stakeholder alignment', 'Measurement + check-ins'],
  },
  {
    id: 'promotion_clinic',
    title: 'Promotion clinic',
    description: 'Audit portfolio and narrative to accelerate promotion readiness.',
    agenda: ['Wins & impact inventory', 'Gap analysis', 'Narrative rehearsal', 'Action commitments'],
  },
];

function normaliseTemplates(mentor, templates) {
  const mentorTemplates = Array.isArray(mentor?.sessionTemplates) ? mentor.sessionTemplates : [];
  const combined = [...mentorTemplates, ...(Array.isArray(templates) ? templates : []), ...DEFAULT_AGENDA_TEMPLATES];
  const seen = new Set();
  return combined
    .map((template, index) => {
      if (!template) {
        return null;
      }
      if (typeof template === 'string') {
        return {
          id: `template-${index}`,
          title: template,
          description: template,
          agenda: [],
        };
      }
      const id = template.id ?? template.slug ?? `template-${index}`;
      const agenda = Array.isArray(template.agenda)
        ? template.agenda
        : typeof template.body === 'string'
        ? template.body.split('\n').map((line) => line.trim()).filter(Boolean)
        : [];
      return {
        id,
        title: template.title ?? template.name ?? 'Mentor session',
        description: template.description ?? template.summary ?? '',
        agenda,
      };
    })
    .filter((template) => {
      if (!template || !template.id || seen.has(template.id)) {
        return false;
      }
      seen.add(template.id);
      return true;
    });
}

function normaliseSlots(availability, mentor, defaultTimezone) {
  const rawSlots = Array.isArray(availability)
    ? availability
    : mentor?.availability?.slots ?? mentor?.availableSlots ?? [];
  const fallbackTimezone =
    defaultTimezone ?? mentor?.availability?.timezone ?? mentor?.timezone ?? mentor?.preferredTimezone ?? 'UTC';

  return rawSlots
    .map((slot, index) => {
      if (!slot) {
        return null;
      }
      const startValue = slot.start ?? slot.startsAt ?? slot.begin ?? slot.beginAt ?? slot;
      const endValue = slot.end ?? slot.endsAt ?? slot.finish ?? slot.finishAt ?? null;
      const start = new Date(startValue);
      if (Number.isNaN(start.getTime())) {
        return null;
      }
      const end = endValue ? new Date(endValue) : null;
      const timezone = slot.timezone ?? slot.timeZone ?? fallbackTimezone;
      return {
        id: slot.id ?? slot.slotId ?? `${index}-${start.toISOString()}`,
        start,
        end,
        timezone,
        meetingUrl: slot.meetingUrl ?? slot.url ?? null,
        format: slot.format ?? slot.type ?? slot.mode ?? mentor?.preferredFormat ?? 'virtual',
        durationMinutes: slot.durationMinutes ?? slot.duration ?? mentor?.defaultSessionLength ?? 60,
        capacity: slot.capacity ?? slot.remainingCapacity ?? null,
        label: slot.label ?? slot.title ?? null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .filter((slot) => slot.start.getTime() > Date.now());
}

function formatDateKey(date, timezone) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function formatDateLabel(date, timezone) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatTimeLabel(date, timezone) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function buildTimezoneOptions(slots, defaultTimezone, viewerTimezone) {
  const options = new Map();
  if (viewerTimezone) {
    options.set(viewerTimezone, {
      value: viewerTimezone,
      label: `Your timezone (${viewerTimezone})`,
      priority: 0,
    });
  }
  slots.forEach((slot) => {
    if (!slot.timezone) {
      return;
    }
    if (!options.has(slot.timezone)) {
      options.set(slot.timezone, {
        value: slot.timezone,
        label: slot.timezone,
        priority: slot.timezone === defaultTimezone ? -1 : 1,
      });
    }
  });
  if (defaultTimezone && !options.has(defaultTimezone)) {
    options.set(defaultTimezone, {
      value: defaultTimezone,
      label: defaultTimezone,
      priority: -1,
    });
  }
  return Array.from(options.values()).sort((a, b) => a.priority - b.priority || a.value.localeCompare(b.value));
}

function formatLastSynced(timestamp, timezone) {
  if (!timestamp) {
    return null;
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function SessionScheduler({
  mentor,
  availability,
  defaultTimezone,
  viewerTimezone,
  sessionTemplates,
  onSchedule,
  pending = false,
  defaultDuration = 60,
}) {
  const slots = useMemo(() => normaliseSlots(availability, mentor, defaultTimezone), [availability, mentor, defaultTimezone]);
  const timezoneOptions = useMemo(
    () => buildTimezoneOptions(slots, defaultTimezone, viewerTimezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone),
    [slots, defaultTimezone, viewerTimezone],
  );
  const initialTimezone = timezoneOptions[0]?.value ?? defaultTimezone ?? viewerTimezone ?? 'UTC';
  const [timezone, setTimezone] = useState(initialTimezone);

  useEffect(() => {
    if (!timezoneOptions.length) {
      return;
    }
    if (!timezoneOptions.some((option) => option.value === timezone)) {
      setTimezone(timezoneOptions[0].value);
    }
  }, [timezoneOptions, timezone]);

  const groupedSlots = useMemo(() => {
    const map = new Map();
    slots.forEach((slot) => {
      const key = formatDateKey(slot.start, timezone);
      const entry = map.get(key) ?? [];
      entry.push(slot);
      map.set(key, entry);
    });
    return map;
  }, [slots, timezone]);

  const dateOptions = useMemo(
    () =>
      Array.from(groupedSlots.entries())
        .map(([key, slotList]) => ({
          key,
          label: formatDateLabel(slotList[0].start, timezone),
          slots: slotList.sort((a, b) => a.start.getTime() - b.start.getTime()),
        }))
        .sort((a, b) => a.slots[0].start.getTime() - b.slots[0].start.getTime()),
    [groupedSlots, timezone],
  );

  const [selectedDateKey, setSelectedDateKey] = useState(dateOptions[0]?.key ?? null);
  useEffect(() => {
    if (selectedDateKey && groupedSlots.has(selectedDateKey)) {
      return;
    }
    if (dateOptions[0]?.key) {
      setSelectedDateKey(dateOptions[0].key);
    } else {
      setSelectedDateKey(null);
    }
  }, [dateOptions, groupedSlots, selectedDateKey]);

  const slotsForSelectedDate = selectedDateKey ? groupedSlots.get(selectedDateKey) ?? [] : [];
  const [selectedSlotId, setSelectedSlotId] = useState(slotsForSelectedDate[0]?.id ?? null);
  useEffect(() => {
    if (!slotsForSelectedDate.length) {
      setSelectedSlotId(null);
      return;
    }
    if (!selectedSlotId || !slotsForSelectedDate.some((slot) => slot.id === selectedSlotId)) {
      setSelectedSlotId(slotsForSelectedDate[0].id);
    }
  }, [slotsForSelectedDate, selectedSlotId]);

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.id === selectedSlotId) ?? null,
    [slots, selectedSlotId],
  );

  const agendaTemplates = useMemo(() => {
    const templates = normaliseTemplates(mentor, sessionTemplates);
    return [
      { id: 'custom', title: 'Custom agenda', description: 'Compose your own agenda.', agenda: [] },
      ...templates,
    ];
  }, [mentor, sessionTemplates]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(agendaTemplates[0]?.id ?? 'custom');
  const [customAgenda, setCustomAgenda] = useState('');

  const [sessionFormat, setSessionFormat] = useState(selectedSlot?.format ?? mentor?.preferredFormat ?? 'virtual');
  const [durationMinutes, setDurationMinutes] = useState(selectedSlot?.durationMinutes ?? defaultDuration);

  useEffect(() => {
    setSessionFormat(selectedSlot?.format ?? mentor?.preferredFormat ?? 'virtual');
    setDurationMinutes(selectedSlot?.durationMinutes ?? defaultDuration);
  }, [selectedSlot, mentor?.preferredFormat, defaultDuration]);

  useEffect(() => {
    const template = agendaTemplates.find((entry) => entry.id === selectedTemplateId);
    if (!template || template.id === 'custom') {
      return;
    }
    const templateText = template.agenda.length ? template.agenda.join('\n') : template.description ?? '';
    setCustomAgenda(templateText);
  }, [agendaTemplates, selectedTemplateId]);

  const prepResources = useMemo(() => {
    const resources = Array.isArray(mentor?.prepResources) ? mentor.prepResources : [];
    const checklist = Array.isArray(mentor?.prepChecklist) ? mentor.prepChecklist : [];
    return resources.length ? resources : checklist;
  }, [mentor?.prepResources, mentor?.prepChecklist]);

  const lastSynced = formatLastSynced(mentor?.availability?.lastSynced ?? mentor?.availabilityLastSynced, timezone);
  const introVideoLink = mentor?.introVideoUrl ?? mentor?.videoIntroUrl ?? mentor?.previewVideoUrl ?? null;

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId);
    const template = agendaTemplates.find((entry) => entry.id === templateId);
    if (template?.id !== 'custom') {
      setCustomAgenda(template.agenda.length ? template.agenda.join('\n') : template.description ?? '');
    }
  };

  const handleSchedule = async () => {
    if (!selectedSlot) {
      return;
    }
    const template = agendaTemplates.find((entry) => entry.id === selectedTemplateId);
    const agendaText = customAgenda.trim();
    const payload = {
      mentorId: mentor?.id,
      slotId: selectedSlot.id,
      scheduledAt: selectedSlot.start.toISOString(),
      timezone,
      durationMinutes,
      meetingType: sessionFormat,
      meetingUrl: selectedSlot.meetingUrl ?? undefined,
      topic: template?.title ?? mentor?.headline ?? 'Mentorship session',
      agenda: agendaText || template?.agenda?.join('\n') || undefined,
      templateId: template?.id,
      format: selectedSlot.format,
      source: 'mentorship_session_scheduler',
    };
    await onSchedule?.(payload);
  };

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Schedule with</p>
          <h3 className="text-xl font-semibold text-slate-900">{mentor?.name ?? 'Mentor'}</h3>
          {mentor?.headline ? <p className="text-sm text-slate-500">{mentor.headline}</p> : null}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
          {lastSynced ? `Availability synced ${lastSynced}` : 'Live availability'}
        </div>
      </header>

      {!slots.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
          This mentor has not published open sessions yet. Request a time and we will alert you once new slots drop.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Timezone
              <div className="relative">
                <GlobeAltIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <select
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {timezoneOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Select a day</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {dateOptions.map((option) => {
                  const active = option.key === selectedDateKey;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setSelectedDateKey(option.key)}
                      className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? 'border-accent bg-white text-accent shadow-sm'
                          : 'border-transparent bg-slate-200 text-slate-600 hover:border-accent/40 hover:text-accent'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {slotsForSelectedDate.map((slot) => {
                  const active = slot.id === selectedSlotId;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`flex flex-col items-start rounded-2xl border px-4 py-3 text-left transition ${
                        active
                          ? 'border-accent bg-white text-accent shadow-sm'
                          : 'border-transparent bg-white text-slate-600 hover:border-accent/40 hover:text-accent'
                      }`}
                    >
                      <span className="text-sm font-semibold">{formatTimeLabel(slot.start, timezone)}</span>
                      {slot.label ? <span className="mt-1 text-xs text-slate-400">{slot.label}</span> : null}
                      {slot.capacity ? (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                          <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden="true" /> {slot.capacity} seats left
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Session overview</p>
              {selectedSlot ? (
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p className="flex items-center gap-2 text-slate-700">
                    <ClockIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    {formatDateLabel(selectedSlot.start, timezone)} • {formatTimeLabel(selectedSlot.start, timezone)}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                      Format
                      <select
                        value={sessionFormat}
                        onChange={(event) => setSessionFormat(event.target.value)}
                        className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600 focus:border-blue-500 focus:outline-none"
                      >
                        {['virtual', 'in_person', 'hybrid'].map((value) => (
                          <option key={value} value={value}>
                            {value.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                      Duration
                      <input
                        type="number"
                        min="15"
                        step="15"
                        value={durationMinutes}
                        onChange={(event) => setDurationMinutes(Number(event.target.value))}
                        className="w-16 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600 focus:border-blue-500 focus:outline-none"
                      />
                      mins
                    </label>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Select a time slot to preview session details.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Agenda templates</p>
              <div className="mt-3 grid gap-2">
                {agendaTemplates.map((template) => {
                  const active = template.id === selectedTemplateId;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => handleTemplateSelect(template.id)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        active
                          ? 'border-accent bg-accent/5 text-accent shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-accent/40 hover:text-accent'
                      }`}
                    >
                      <span className="font-semibold">{template.title}</span>
                      {template.description ? <p className="mt-1 text-xs text-slate-500">{template.description}</p> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Agenda notes
                <textarea
                  value={customAgenda}
                  onChange={(event) => setCustomAgenda(event.target.value)}
                  placeholder="Share context, questions, and resources so your mentor can prepare."
                  rows={5}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            {prepResources.length ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Prep checklist</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {prepResources.slice(0, 4).map((item, index) => (
                    <li key={`${item}-${index}`} className="flex items-start gap-2">
                      <CheckCircleIcon className="mt-0.5 h-4 w-4 text-emerald-500" aria-hidden="true" />
                      <span>{typeof item === 'string' ? item : item.title ?? item.description ?? 'Review supporting material'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {introVideoLink ? (
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && typeof window.open === 'function') {
                    window.open(introVideoLink, '_blank', 'noopener');
                  }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              >
                <PlayCircleIcon className="h-5 w-5" aria-hidden="true" /> Watch mentor intro
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleSchedule}
              disabled={pending || !selectedSlot}
              className="w-full rounded-2xl bg-accent py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? 'Scheduling…' : 'Book session'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

SessionScheduler.propTypes = {
  mentor: PropTypes.object.isRequired,
  availability: PropTypes.arrayOf(PropTypes.object),
  defaultTimezone: PropTypes.string,
  viewerTimezone: PropTypes.string,
  sessionTemplates: PropTypes.array,
  onSchedule: PropTypes.func,
  pending: PropTypes.bool,
  defaultDuration: PropTypes.number,
};

export default SessionScheduler;
