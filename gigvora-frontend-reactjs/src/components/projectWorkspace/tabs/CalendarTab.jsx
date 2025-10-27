import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  CalendarDaysIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const INITIAL_FORM = {
  title: '',
  category: 'event',
  startAt: '',
  endAt: '',
  allDay: false,
  location: '',
  metadata: '',
};

const CATEGORY_OPTIONS = [
  { value: 'event', label: 'Event' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'focus', label: 'Focus block' },
];

const CATEGORY_BADGES = {
  event: 'bg-sky-100 text-sky-700',
  workshop: 'bg-violet-100 text-violet-700',
  deadline: 'bg-amber-100 text-amber-700',
  holiday: 'bg-emerald-100 text-emerald-700',
  focus: 'bg-cyan-100 text-cyan-700',
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function humanizeKey(key) {
  if (!key) return '';
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (character) => character.toUpperCase());
}

function toInputDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
}

function toLocalDateTime(date, { hours = 9, minutes = 0 } = {}) {
  if (!date) return '';
  const instance = new Date(date);
  if (Number.isNaN(instance.getTime())) return '';
  instance.setHours(hours, minutes, 0, 0);
  return instance.toISOString().slice(0, 16);
}

function formatDateTime(value) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatTimeRange({ startAt, endAt, allDay }) {
  if (allDay) {
    return 'All day';
  }
  if (!startAt) {
    return 'Time TBD';
  }
  const start = new Date(startAt);
  if (Number.isNaN(start.getTime())) {
    return 'Time TBD';
  }
  const startLabel = start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (!endAt) {
    return startLabel;
  }
  const end = new Date(endAt);
  if (Number.isNaN(end.getTime())) {
    return startLabel;
  }
  const endLabel = end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${startLabel} – ${endLabel}`;
}

function computeDurationHours(startAt, endAt) {
  if (!startAt) {
    return 0;
  }
  const start = new Date(startAt);
  if (Number.isNaN(start.getTime())) {
    return 0;
  }
  if (!endAt) {
    return 1;
  }
  const end = new Date(endAt);
  if (Number.isNaN(end.getTime())) {
    return 1;
  }
  const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return diff > 0 ? diff : 1;
}

function addDays(date, days) {
  const instance = new Date(date);
  instance.setDate(instance.getDate() + days);
  return instance;
}

function resolveMetadata(metadata) {
  if (!metadata) {
    return null;
  }
  if (typeof metadata === 'object') {
    return metadata;
  }
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch (error) {
      return { notes: metadata };
    }
  }
  return null;
}

export default function CalendarTab({ project, actions, canManage }) {
  const events = Array.isArray(project.calendarEvents) ? project.calendarEvents : [];
  const tasks = Array.isArray(project.tasks) ? project.tasks : [];
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.startAt || 0) - new Date(b.startAt || 0));
  }, [events]);

  const [form, setForm] = useState(() => ({ ...INITIAL_FORM }));
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState(() => ({ ...INITIAL_FORM }));
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [prefillTaskId, setPrefillTaskId] = useState(null);

  const insights = useMemo(() => {
    const now = new Date();
    const timelineMap = new Map();
    const scheduledTaskIds = new Set();
    const upcomingEvents = [];
    let focusHours = 0;
    let totalHours = 0;

    sortedEvents.forEach((eventRecord) => {
      const metadata = resolveMetadata(eventRecord.metadata);
      const start = eventRecord.startAt ? new Date(eventRecord.startAt) : null;
      const end = eventRecord.endAt ? new Date(eventRecord.endAt) : null;

      if (metadata?.taskId !== undefined && metadata?.taskId !== null) {
        scheduledTaskIds.add(String(metadata.taskId));
        scheduledTaskIds.add(Number(metadata.taskId));
      }

      if (eventRecord.startAt && start && !Number.isNaN(start.getTime())) {
        const dayKey = start.toISOString().slice(0, 10);
        if (!timelineMap.has(dayKey)) {
          timelineMap.set(dayKey, { date: start, events: [] });
        }
        timelineMap.get(dayKey).events.push(eventRecord);

        if (start >= now && start <= addDays(now, 14)) {
          upcomingEvents.push(eventRecord);
        }
      }

      const durationHours = computeDurationHours(eventRecord.startAt, eventRecord.endAt);
      totalHours += durationHours;
      if (eventRecord.category === 'focus') {
        focusHours += durationHours;
      }
    });

    const tasksWithDueDate = tasks.filter((task) => Boolean(task?.dueDate));
    const scheduledTasks = tasksWithDueDate.filter((task) =>
      scheduledTaskIds.has(task.id) || scheduledTaskIds.has(String(task.id)),
    );
    const unscheduledTasks = tasksWithDueDate.filter(
      (task) => !(scheduledTaskIds.has(task.id) || scheduledTaskIds.has(String(task.id))),
    );

    const dueSoonThreshold = addDays(now, 7);
    const dueSoon = [];
    const overdue = [];

    unscheduledTasks.forEach((task) => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      if (!dueDate || Number.isNaN(dueDate.getTime())) {
        return;
      }
      if (dueDate < now) {
        overdue.push(task);
      } else if (dueDate <= dueSoonThreshold) {
        dueSoon.push(task);
      }
    });

    const autoplanCandidates = [...dueSoon, ...overdue].sort((a, b) => {
      const aDate = a.dueDate ? new Date(a.dueDate) : new Date(0);
      const bDate = b.dueDate ? new Date(b.dueDate) : new Date(0);
      return aDate - bDate;
    });

    const timeline = Array.from(timelineMap.entries())
      .sort((a, b) => a[1].date - b[1].date)
      .slice(0, 5)
      .map(([dayKey, bucket]) => ({
        dayKey,
        dateLabel: bucket.date.toLocaleDateString('en-GB', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        events: bucket.events
          .slice()
          .sort((a, b) => new Date(a.startAt || 0) - new Date(b.startAt || 0)),
      }));

    const upcoming = upcomingEvents
      .sort((a, b) => new Date(a.startAt || 0) - new Date(b.startAt || 0))
      .slice(0, 4);

    const focusCoverage = totalHours > 0 ? clamp(Math.round((focusHours / totalHours) * 100), 0, 100) : 0;
    const taskCoverage = tasksWithDueDate.length
      ? clamp(Math.round((scheduledTasks.length / tasksWithDueDate.length) * 100), 0, 100)
      : 0;

    return {
      taskCoverage,
      focusCoverage,
      focusHours: Math.round(focusHours),
      overdue: overdue.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0)),
      dueSoon: dueSoon.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0)),
      autoplanCandidates,
      timeline,
      upcoming,
      scheduledTasksCount: scheduledTasks.length,
      tasksWithDueDate: tasksWithDueDate.length,
    };
  }, [sortedEvents, tasks]);

  const handleChange = (event, setter) => {
    const { name, type, checked, value } = event.target;
    setter((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const parseMetadata = (value) => {
    if (!value?.trim()) return undefined;
    const trimmed = value.trim();
    try {
      return JSON.parse(trimmed);
    } catch (error) {
      throw new Error('Metadata must be valid JSON.');
    }
  };

  const buildPayload = (payload) => {
    const startDate = payload.startAt ? new Date(payload.startAt) : null;
    const endDate = payload.endAt ? new Date(payload.endAt) : null;

    if (startDate && Number.isNaN(startDate.getTime())) {
      throw new Error('Start time must be a valid date.');
    }

    if (endDate && Number.isNaN(endDate.getTime())) {
      throw new Error('End time must be a valid date.');
    }

    if (startDate && endDate && endDate <= startDate) {
      throw new Error('End time must be after the start time.');
    }

    return {
      title: payload.title,
      category: payload.category,
      startAt: startDate ? startDate.toISOString() : undefined,
      endAt: endDate ? endDate.toISOString() : undefined,
      allDay: Boolean(payload.allDay),
      location: payload.location || undefined,
      metadata: parseMetadata(payload.metadata),
    };
  };

  const handleScheduleFromTask = (task) => {
    if (!task) {
      return;
    }

    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const startDate = task.startDate ? new Date(task.startDate) : null;
    const estimatedHours = Number.isFinite(Number(task.estimatedHours))
      ? Number(task.estimatedHours)
      : null;

    const preferredStart = startDate && !Number.isNaN(startDate.getTime()) ? startDate : dueDate;
    const startAt = preferredStart ? toLocalDateTime(preferredStart, { hours: 9 }) : '';

    let endAt = '';
    if (startAt) {
      const endCandidate = new Date(startAt);
      if (!Number.isNaN(endCandidate.getTime())) {
        const duration = estimatedHours && estimatedHours > 0 ? Math.min(estimatedHours, 8) : 1;
        endCandidate.setHours(endCandidate.getHours() + duration);
        endAt = endCandidate.toISOString().slice(0, 16);
      }
    } else if (dueDate && !Number.isNaN(dueDate.getTime())) {
      const fallback = new Date(dueDate);
      fallback.setHours(10, 0, 0, 0);
      endAt = fallback.toISOString().slice(0, 16);
    }

    const metadata = {
      taskId: task.id ?? null,
      taskPriority: task.priority ?? null,
      taskStatus: task.status ?? null,
      taskDueDate: task.dueDate ?? null,
      taskEstimatedHours: task.estimatedHours ?? null,
    };

    if (task.owner) {
      metadata.taskOwner = task.owner;
    }
    if (task.description) {
      metadata.taskSummary = task.description;
    }

    setForm((current) => ({
      ...current,
      title: task.title || current.title || '',
      category: task.status === 'completed' ? 'event' : 'deadline',
      startAt: startAt || '',
      endAt: endAt || '',
      allDay: !startAt && Boolean(task.dueDate),
      metadata: JSON.stringify(metadata, null, 2),
    }));
    setPrefillTaskId(task.id ?? null);
    setFeedback({ status: 'info', message: 'Task context loaded into the scheduler — review and save.' });
  };

  const resetForm = () => {
    setForm({ ...INITIAL_FORM });
    setPrefillTaskId(null);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const payload = buildPayload(form);
      await actions.createCalendarEvent(project.id, payload);
      resetForm();
      setFeedback({ status: 'success', message: 'Calendar event created.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to create event.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (eventRecord) => {
    setEditingId(eventRecord.id);
    const metadata = resolveMetadata(eventRecord.metadata);
    setEditingForm({
      title: eventRecord.title || '',
      category: eventRecord.category || 'event',
      startAt: toInputDateTime(eventRecord.startAt),
      endAt: toInputDateTime(eventRecord.endAt),
      allDay: Boolean(eventRecord.allDay),
      location: eventRecord.location || '',
      metadata: metadata ? JSON.stringify(metadata, null, 2) : '',
    });
    setPrefillTaskId(metadata?.taskId ?? null);
    setFeedback(null);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const payload = buildPayload(editingForm);
      await actions.updateCalendarEvent(project.id, editingId, payload);
      setEditingId(null);
      setFeedback({ status: 'success', message: 'Event updated.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to update event.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.deleteCalendarEvent(project.id, eventId);
      setFeedback({ status: 'success', message: 'Event removed.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to remove event.' });
    } finally {
      setPrefillTaskId(null);
      setSubmitting(false);
    }
  };

  const totalAllDay = events.filter((eventRecord) => eventRecord.allDay).length;
  const unscheduledCount = Math.max(
    (insights.tasksWithDueDate || 0) - (insights.scheduledTasksCount || 0),
    0,
  );
  const autoplanDisplay = insights.autoplanCandidates.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Calendar commitments</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{events.length}</p>
              <p className="mt-1 text-xs text-slate-500">{totalAllDay} all-day holds</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <CalendarDaysIcon className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Focus coverage</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{insights.focusHours}</p>
              <p className="mt-1 text-xs text-slate-500">
                hours planned • {insights.focusCoverage}% of schedule
              </p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <ClockIcon className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <span
              className="block h-full rounded-full bg-accent transition-all"
              style={{ width: `${insights.focusCoverage}%` }}
            />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Task coverage</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {insights.taskCoverage}
                <span className="ml-1 text-base font-medium text-slate-500">%</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {insights.scheduledTasksCount} / {insights.tasksWithDueDate || 0} dated tasks time-boxed
              </p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <SparklesIcon className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <span
              className="block h-full rounded-full bg-amber-400 transition-all"
              style={{ width: `${insights.taskCoverage}%` }}
            />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">At-risk tasks</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{insights.overdue.length}</p>
              <p className="mt-1 text-xs text-slate-500">{insights.dueSoon.length} due in next 7 days</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>
          {unscheduledCount ? (
            <p className="mt-3 text-xs font-medium text-rose-600">
              {unscheduledCount} dated tasks still unscheduled
            </p>
          ) : (
            <p className="mt-3 text-xs text-emerald-600">Every dated task is on the calendar.</p>
          )}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
        <section className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-base font-semibold text-slate-900">Rhythm for the next sprint</h4>
              <span className="text-xs text-slate-500">Auto-sorted by start time</span>
            </div>
            {insights.timeline.length ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {insights.timeline.map((bucket) => (
                  <article
                    key={bucket.dayKey}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <p className="text-xs uppercase tracking-wide text-slate-500">{bucket.dateLabel}</p>
                    <ul className="mt-3 space-y-3">
                      {bucket.events.map((eventItem) => {
                        const metadata = resolveMetadata(eventItem.metadata);
                        const linkedTask = metadata?.taskId;
                        const categoryClass = CATEGORY_BADGES[eventItem.category] ?? 'bg-slate-200 text-slate-700';
                        return (
                          <li
                            key={`${eventItem.id ?? eventItem.title}-${eventItem.startAt ?? 'tbd'}`}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{eventItem.title}</p>
                                <p className="text-xs text-slate-500">{formatTimeRange(eventItem)}</p>
                              </div>
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${categoryClass}`}
                              >
                                {eventItem.category?.replace(/_/g, ' ') || 'event'}
                              </span>
                            </div>
                            {eventItem.location ? (
                              <p className="mt-1 text-xs text-slate-500">📍 {eventItem.location}</p>
                            ) : null}
                            {linkedTask ? (
                              <p className="mt-1 text-xs font-medium text-accent">Linked task #{linkedTask}</p>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-500">
                No dated events yet. Once you schedule rituals or deadlines, they will align into this sprint view.
              </p>
            )}
          </div>

          <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="text-base font-semibold text-slate-900">Add project event</h4>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col text-sm text-slate-700">
                Title
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={(event) => handleChange(event, setForm)}
                  required
                  disabled={!canManage || submitting}
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  placeholder="Design sprint kickoff"
                />
              </label>
              <label className="flex flex-col text-sm text-slate-700">
                Category
                <select
                  name="category"
                  value={form.category}
                  onChange={(event) => handleChange(event, setForm)}
                  disabled={!canManage || submitting}
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col text-sm text-slate-700">
                Starts
                <input
                  type="datetime-local"
                  name="startAt"
                  value={form.startAt}
                  onChange={(event) => handleChange(event, setForm)}
                  required
                  disabled={!canManage || submitting}
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </label>
              <label className="flex flex-col text-sm text-slate-700">
                Ends
                <input
                  type="datetime-local"
                  name="endAt"
                  value={form.endAt}
                  onChange={(event) => handleChange(event, setForm)}
                  disabled={!canManage || submitting || form.allDay}
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="allDay"
                  checked={form.allDay}
                  onChange={(event) => handleChange(event, setForm)}
                  disabled={!canManage || submitting}
                  className="h-4 w-4 rounded border border-slate-300 text-accent focus:ring-accent"
                />
                All-day event
              </label>
              <label className="flex flex-col text-sm text-slate-700">
                Location
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={(event) => handleChange(event, setForm)}
                  placeholder="Hybrid - HQ Boardroom"
                  disabled={!canManage || submitting}
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </label>
              <label className="flex flex-col text-sm text-slate-700 md:col-span-2">
                Metadata (JSON)
                <textarea
                  name="metadata"
                  value={form.metadata}
                  onChange={(event) => handleChange(event, setForm)}
                  rows={3}
                  placeholder='{"capacity": 12, "stream": "Zoom"}'
                  disabled={!canManage || submitting}
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
              {feedback ? (
                <p
                  className={`text-sm ${
                    feedback.status === 'error'
                      ? 'text-rose-600'
                      : feedback.status === 'info'
                      ? 'text-slate-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {feedback.message}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={!canManage || submitting}
                className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add event
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-base font-semibold text-slate-900">Task time-boxing</h4>
                <p className="mt-1 text-xs text-slate-500">
                  {unscheduledCount
                    ? `${unscheduledCount} dated tasks still need dedicated focus windows.`
                    : 'Every dated task has a matching calendar block.'}
                </p>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                <SparklesIcon className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            {autoplanDisplay.length ? (
              <ul className="mt-4 space-y-3">
                {autoplanDisplay.map((task) => {
                  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                  const dueLabel =
                    dueDate && !Number.isNaN(dueDate.getTime())
                      ? dueDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
                      : 'No due date';
                  const isOverdue = dueDate && !Number.isNaN(dueDate.getTime()) && dueDate < new Date();
                  const highlight =
                    prefillTaskId !== null && String(prefillTaskId) === String(task.id ?? '');
                  return (
                    <li
                      key={task.id ?? task.title}
                      className={`rounded-2xl border px-4 py-3 ${
                        highlight
                          ? 'border-accent bg-accent/5'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{task.title}</p>
                          <p className="text-xs text-slate-500">
                            Due {dueLabel}
                            {isOverdue ? ' • overdue' : ''}
                            {task.priority ? ` • ${task.priority.replace(/_/g, ' ')}` : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleScheduleFromTask(task)}
                          disabled={!canManage || submitting}
                          className="inline-flex items-center justify-center rounded-full border border-accent px-3 py-1 text-xs font-semibold text-accent transition hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Schedule block
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">
                Every dated task has calendar coverage. Keep capturing new work to maintain momentum.
              </p>
            )}
            {insights.autoplanCandidates.length > autoplanDisplay.length ? (
              <p className="mt-3 text-xs text-slate-500">
                +{insights.autoplanCandidates.length - autoplanDisplay.length} more tasks waiting for time-boxing
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-slate-900">Next 14 days</h4>
              <span className="text-xs text-slate-500">
                {insights.upcoming.length ? `${insights.upcoming.length} commitments` : 'Open runway'}
              </span>
            </div>
            {insights.upcoming.length ? (
              <ul className="mt-4 space-y-3">
                {insights.upcoming.map((eventItem) => {
                  const metadata = resolveMetadata(eventItem.metadata);
                  const categoryClass = CATEGORY_BADGES[eventItem.category] ?? 'bg-slate-200 text-slate-700';
                  const linkedTask = metadata?.taskId;
                  return (
                    <li
                      key={`${eventItem.id ?? eventItem.title}-upcoming-${eventItem.startAt ?? 'tbd'}`}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{eventItem.title}</p>
                          <p className="text-xs text-slate-500">{formatDateTime(eventItem.startAt)}</p>
                          <p className="text-xs text-slate-500">{formatTimeRange(eventItem)}</p>
                          {eventItem.location ? (
                            <p className="text-xs text-slate-500">📍 {eventItem.location}</p>
                          ) : null}
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${categoryClass}`}
                        >
                          {eventItem.category?.replace(/_/g, ' ') || 'event'}
                        </span>
                      </div>
                      {linkedTask ? (
                        <p className="mt-2 text-xs text-slate-500">
                          Task #{linkedTask}
                          {metadata?.taskStatus ? ` • ${metadata.taskStatus.replace(/_/g, ' ')}` : ''}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white/60 p-4 text-sm text-slate-500">
                Open runway. Use the scheduler to sequence workshops, reviews, and focus blocks.
              </p>
            )}
          </div>
        </aside>
      </div>

      <div className="space-y-4">
        {sortedEvents.length ? (
          sortedEvents.map((eventRecord) => {
            const metadata = resolveMetadata(eventRecord.metadata);
            const metadataEntries = metadata ? Object.entries(metadata).slice(0, 6) : [];
            const linkedTaskId = metadata?.taskId;
            const categoryClass = CATEGORY_BADGES[eventRecord.category] ?? 'bg-slate-200 text-slate-700';
            const highlight =
              linkedTaskId !== undefined && linkedTaskId !== null &&
              String(linkedTaskId) === String(prefillTaskId ?? '');
            return (
              <article
                key={eventRecord.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                  highlight ? 'border-accent/60 ring-2 ring-accent/20' : 'border-slate-200'
                }`}
              >
                {editingId === eventRecord.id ? (
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="flex flex-col text-sm text-slate-700">
                        Title
                        <input
                          type="text"
                          name="title"
                          value={editingForm.title}
                          onChange={(event) => handleChange(event, setEditingForm)}
                          required
                          disabled={!canManage || submitting}
                          className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="flex flex-col text-sm text-slate-700">
                        Category
                        <select
                          name="category"
                          value={editingForm.category}
                          onChange={(event) => handleChange(event, setEditingForm)}
                          disabled={!canManage || submitting}
                          className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        >
                          {CATEGORY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col text-sm text-slate-700">
                        Starts
                        <input
                          type="datetime-local"
                          name="startAt"
                          value={editingForm.startAt}
                          onChange={(event) => handleChange(event, setEditingForm)}
                          required
                          disabled={!canManage || submitting}
                          className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="flex flex-col text-sm text-slate-700">
                        Ends
                        <input
                          type="datetime-local"
                          name="endAt"
                          value={editingForm.endAt}
                          onChange={(event) => handleChange(event, setEditingForm)}
                          disabled={!canManage || submitting || editingForm.allDay}
                          className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          name="allDay"
                          checked={editingForm.allDay}
                          onChange={(event) => handleChange(event, setEditingForm)}
                          disabled={!canManage || submitting}
                          className="h-4 w-4 rounded border border-slate-300 text-accent focus:ring-accent"
                        />
                        All-day event
                      </label>
                      <label className="flex flex-col text-sm text-slate-700">
                        Location
                        <input
                          type="text"
                          name="location"
                          value={editingForm.location}
                          onChange={(event) => handleChange(event, setEditingForm)}
                          disabled={!canManage || submitting}
                          className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="flex flex-col text-sm text-slate-700 md:col-span-2">
                        Metadata (JSON)
                        <textarea
                          name="metadata"
                          value={editingForm.metadata}
                          onChange={(event) => handleChange(event, setEditingForm)}
                          rows={3}
                          disabled={!canManage || submitting}
                          className="mt-1 rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/40 hover:text-accent"
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!canManage || submitting}
                        className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Save event
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${categoryClass}`}
                        >
                          {eventRecord.category?.replace(/_/g, ' ') || 'event'}
                        </span>
                        {eventRecord.allDay ? (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            All-day
                          </span>
                        ) : null}
                        {linkedTaskId ? (
                          <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                            Task #{linkedTaskId}
                          </span>
                        ) : null}
                      </div>
                      <h4 className="text-base font-semibold text-slate-900">{eventRecord.title}</h4>
                      <p className="text-sm text-slate-600">
                        {formatDateTime(eventRecord.startAt)}
                        {eventRecord.endAt ? ` → ${formatDateTime(eventRecord.endAt)}` : ''}
                      </p>
                      {eventRecord.location ? (
                        <p className="text-xs text-slate-500">Location: {eventRecord.location}</p>
                      ) : null}
                      {metadataEntries.length ? (
                        <dl className="mt-2 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                          {metadataEntries.map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between gap-2">
                              <dt className="font-medium text-slate-600">{humanizeKey(key)}</dt>
                              <dd className="text-right text-slate-500">
                                {typeof value === 'string' || typeof value === 'number'
                                  ? value
                                  : Array.isArray(value)
                                  ? value.join(', ')
                                  : JSON.stringify(value)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 self-start">
                      <button
                        type="button"
                        onClick={() => handleEdit(eventRecord)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!canManage || submitting}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(eventRecord.id)}
                        className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!canManage || submitting}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
            Your project calendar is empty. Capture ceremonies, deadlines, and focus blocks to keep everyone aligned.
          </p>
        )}
      </div>
    </div>
  );
}

CalendarTab.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    calendarEvents: PropTypes.arrayOf(PropTypes.object),
    tasks: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  actions: PropTypes.shape({
    createCalendarEvent: PropTypes.func.isRequired,
    updateCalendarEvent: PropTypes.func.isRequired,
    deleteCalendarEvent: PropTypes.func.isRequired,
  }).isRequired,
  canManage: PropTypes.bool,
};

CalendarTab.defaultProps = {
  canManage: true,
};
