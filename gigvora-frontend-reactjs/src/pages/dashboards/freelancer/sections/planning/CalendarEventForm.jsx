import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Switch, Transition } from '@headlessui/react';
import {
  ArrowPathIcon,
  CalendarIcon,
  GlobeAltIcon,
  LinkIcon,
  MapPinIcon,
  PencilSquareIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import {
  EVENT_STATUS_OPTIONS,
  EVENT_TYPE_OPTIONS,
  RELATED_ENTITY_OPTIONS,
  REMINDER_OPTIONS,
  resolveStatusMeta,
  resolveTypeMeta,
} from './constants.js';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function formatDateTimeInput(value) {
  if (!value) {
    return '';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function parseDateTime(value) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function emptyMetadataEntry(index = 0) {
  return { id: `metadata-${index}`, key: '', value: '' };
}

function normalizeMetadataEntries(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return [emptyMetadataEntry(0)];
  }
  const entries = Object.entries(metadata)
    .filter(([key]) => key != null && key !== '')
    .map(([key, value], index) => ({ id: `metadata-${index}`, key, value: value == null ? '' : String(value) }));
  return entries.length ? entries : [emptyMetadataEntry(0)];
}

function buildInitialState(initialValues, defaults) {
  const base = {
    title: '',
    eventType: 'project',
    status: 'confirmed',
    startsAt: defaults.startsAt,
    endsAt: defaults.endsAt,
    isAllDay: false,
    location: '',
    meetingUrl: '',
    notes: '',
    relatedEntityType: '',
    relatedEntityId: '',
    relatedEntityName: '',
    reminderMinutesBefore: '',
    color: defaults.color,
    metadataEntries: [emptyMetadataEntry(0)],
  };

  if (!initialValues) {
    return base;
  }

  return {
    ...base,
    ...initialValues,
    startsAt: initialValues.startsAt ? formatDateTimeInput(initialValues.startsAt) : base.startsAt,
    endsAt: initialValues.endsAt ? formatDateTimeInput(initialValues.endsAt) : base.endsAt,
    reminderMinutesBefore:
      initialValues.reminderMinutesBefore == null ? base.reminderMinutesBefore : String(initialValues.reminderMinutesBefore),
    metadataEntries: normalizeMetadataEntries(initialValues.metadata ?? null),
  };
}

function sanitizeMetadata(entries) {
  const result = {};
  entries.forEach((entry) => {
    const key = entry.key?.trim();
    if (!key) {
      return;
    }
    result[key] = entry.value;
  });
  return Object.keys(result).length ? result : null;
}

function preparePayload(state) {
  const payload = {
    title: state.title.trim(),
    eventType: state.eventType,
    status: state.status,
    isAllDay: Boolean(state.isAllDay),
    location: state.location?.trim() || null,
    meetingUrl: state.meetingUrl?.trim() || null,
    notes: state.notes?.trim() || null,
    relatedEntityType: state.relatedEntityType || null,
    relatedEntityId: state.relatedEntityId?.trim() || null,
    relatedEntityName: state.relatedEntityName?.trim() || null,
    reminderMinutesBefore:
      state.reminderMinutesBefore === ''
        ? null
        : Math.max(0, Number.parseInt(state.reminderMinutesBefore, 10) || 0),
    color: state.color || null,
    metadata: sanitizeMetadata(state.metadataEntries),
  };

  const startsAt = parseDateTime(state.startsAt);
  const endsAt = parseDateTime(state.endsAt);
  payload.startsAt = startsAt ? startsAt.toISOString() : null;
  let computedEnd = endsAt;

  if (state.isAllDay && startsAt && !endsAt) {
    const nextDay = new Date(startsAt.getTime());
    nextDay.setDate(nextDay.getDate() + 1);
    computedEnd = nextDay;
  }

  payload.endsAt = computedEnd ? computedEnd.toISOString() : null;

  return payload;
}

export default function CalendarEventForm({
  open,
  mode,
  initialValues,
  onSubmit,
  onClose,
  submitting,
  error,
}) {
  const defaults = useMemo(() => {
    const baseStart = new Date();
    baseStart.setSeconds(0, 0);
    baseStart.setMinutes(Math.round(baseStart.getMinutes() / 15) * 15);
    const baseEnd = new Date(baseStart.getTime() + 60 * 60 * 1000);
    return {
      startsAt: formatDateTimeInput(baseStart),
      endsAt: formatDateTimeInput(baseEnd),
      color: resolveTypeMeta(initialValues?.eventType)?.color ?? '#2563eb',
    };
  }, [initialValues?.eventType]);

  const [state, setState] = useState(() => buildInitialState(initialValues, defaults));
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setState(buildInitialState(initialValues, defaults));
    setFormError(null);
  }, [open, initialValues, defaults]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setState((current) => ({
      ...current,
      [name]: value,
      ...(name === 'eventType' ? { color: resolveTypeMeta(value)?.color ?? current.color } : {}),
    }));
  };

  const handleToggleAllDay = (enabled) => {
    setState((current) => ({
      ...current,
      isAllDay: enabled,
      endsAt: enabled && current.startsAt ? '' : current.endsAt,
    }));
  };

  const handleMetadataChange = (id, field, value) => {
    setState((current) => ({
      ...current,
      metadataEntries: current.metadataEntries.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              [field]: value,
            }
          : entry,
      ),
    }));
  };

  const handleAddMetadata = () => {
    setState((current) => ({
      ...current,
      metadataEntries: [...current.metadataEntries, emptyMetadataEntry(current.metadataEntries.length)],
    }));
  };

  const handleRemoveMetadata = (id) => {
    setState((current) => {
      const nextEntries = current.metadataEntries.filter((entry) => entry.id !== id);
      return {
        ...current,
        metadataEntries: nextEntries.length ? nextEntries : [emptyMetadataEntry(0)],
      };
    });
  };

  const validate = () => {
    if (!state.title.trim()) {
      return 'A title is required.';
    }
    if (!state.startsAt) {
      return 'Start date and time is required.';
    }
    const startsAt = parseDateTime(state.startsAt);
    if (!startsAt) {
      return 'Start date and time must be valid.';
    }
    if (state.endsAt) {
      const endsAt = parseDateTime(state.endsAt);
      if (!endsAt) {
        return 'End date and time must be valid.';
      }
      if (endsAt.getTime() < startsAt.getTime()) {
        return 'End time must be after the start time.';
      }
    }
    if (state.meetingUrl) {
      try {
        const url = new URL(state.meetingUrl);
        if (!['http:', 'https:'].includes(url.protocol)) {
          return 'Meeting link must be a valid URL.';
        }
      } catch (error) {
        return 'Meeting link must be a valid URL.';
      }
    }
    if (state.relatedEntityType && !state.relatedEntityId.trim()) {
      return 'Reference the workspace ID for linked records.';
    }
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = validate();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }
    try {
      setFormError(null);
      await onSubmit?.(preparePayload(state));
    } catch (submitError) {
      setFormError(submitError.message ?? 'Unable to save calendar event.');
    }
  };

  const dialogTitle = mode === 'edit' ? 'Update calendar event' : 'Create calendar event';

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={() => (submitting ? null : onClose?.())}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-40 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-3xl transform overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-2xl transition-all sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Dialog.Title className="text-xl font-semibold text-slate-900">{dialogTitle}</Dialog.Title>
                    <p className="mt-1 text-sm text-slate-500">
                      Capture interviews, gigs, mentorship sessions, volunteering, and focus blocks with full context for the Gigvora team.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onClose?.()}
                    className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                    disabled={submitting}
                  >
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    <span className="sr-only">Close</span>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-3">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="title">
                        Event title
                      </label>
                      <input
                        id="title"
                        name="title"
                        type="text"
                        required
                        value={state.title}
                        onChange={handleFieldChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="e.g. Client kickoff, mentorship session, volunteering sprint"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="eventType">
                        Event type
                      </label>
                      <select
                        id="eventType"
                        name="eventType"
                        value={state.eventType}
                        onChange={handleFieldChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        {EVENT_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="status">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={state.status}
                        onChange={handleFieldChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        {EVENT_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="startsAt">
                        Starts
                      </label>
                      <div className="relative">
                        <input
                          id="startsAt"
                          name="startsAt"
                          type="datetime-local"
                          required
                          value={state.startsAt}
                          onChange={handleFieldChange}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 pr-12 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <CalendarIcon className="pointer-events-none absolute inset-y-0 right-3 my-auto h-5 w-5 text-slate-400" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="endsAt">
                          Ends
                        </label>
                        <Switch
                          checked={state.isAllDay}
                          onChange={handleToggleAllDay}
                          className={classNames(
                            state.isAllDay ? 'bg-blue-600' : 'bg-slate-200',
                            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                          )}
                        >
                          <span className="sr-only">Mark as all-day</span>
                          <span
                            aria-hidden="true"
                            className={classNames(
                              state.isAllDay ? 'translate-x-5' : 'translate-x-0',
                              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                            )}
                          />
                        </Switch>
                      </div>
                      <div className="relative">
                        <input
                          id="endsAt"
                          name="endsAt"
                          type="datetime-local"
                          value={state.endsAt}
                          onChange={handleFieldChange}
                          disabled={state.isAllDay}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 pr-12 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                        />
                        <CalendarIcon className="pointer-events-none absolute inset-y-0 right-3 my-auto h-5 w-5 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="location">
                        Location / venue
                      </label>
                      <div className="relative">
                        <input
                          id="location"
                          name="location"
                          type="text"
                          value={state.location}
                          onChange={handleFieldChange}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 pl-10 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          placeholder="Video, onsite, coworking, etc."
                        />
                        <MapPinIcon className="pointer-events-none absolute inset-y-0 left-3 my-auto h-5 w-5 text-slate-400" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="meetingUrl">
                        Meeting / external link
                      </label>
                      <div className="relative">
                        <input
                          id="meetingUrl"
                          name="meetingUrl"
                          type="url"
                          value={state.meetingUrl}
                          onChange={handleFieldChange}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 pl-10 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          placeholder="https://"
                        />
                        <LinkIcon className="pointer-events-none absolute inset-y-0 left-3 my-auto h-5 w-5 text-slate-400" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="reminderMinutesBefore">
                        Reminder
                      </label>
                      <select
                        id="reminderMinutesBefore"
                        name="reminderMinutesBefore"
                        value={state.reminderMinutesBefore}
                        onChange={handleFieldChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        {REMINDER_OPTIONS.map((option) => (
                          <option key={option.value ?? 'none'} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="notes">
                      Agenda & context
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={4}
                      value={state.notes}
                      onChange={handleFieldChange}
                      className="w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Share prep notes, attendees, desired outcomes, documents, or follow-up actions."
                    />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="relatedEntityType">
                        Related workspace
                      </label>
                      <select
                        id="relatedEntityType"
                        name="relatedEntityType"
                        value={state.relatedEntityType}
                        onChange={handleFieldChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                            {RELATED_ENTITY_OPTIONS.map((option) => (
                              <option key={option.value || 'none'} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="relatedEntityName">
                        Workspace / client name
                      </label>
                      <input
                        id="relatedEntityName"
                        name="relatedEntityName"
                        type="text"
                        value={state.relatedEntityName}
                        onChange={handleFieldChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Atlas Robotics, Launchpad sprint, Mentorship guild"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="relatedEntityId">
                        Workspace reference ID
                      </label>
                      <input
                        id="relatedEntityId"
                        name="relatedEntityId"
                        type="text"
                        value={state.relatedEntityId}
                        onChange={handleFieldChange}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Optional internal ID or slug"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Custom metadata</p>
                        <p className="text-xs text-slate-500">
                          Store lightweight context for automations, reminders, or handoffs. Leave blank if not needed.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddMetadata}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
                      >
                        <PlusIcon className="h-4 w-4" /> Add field
                      </button>
                    </div>

                    <div className="space-y-3">
                      {state.metadataEntries.map((entry) => (
                        <div key={entry.id} className="grid gap-3 rounded-2xl border border-slate-200 p-4 shadow-sm md:grid-cols-[1.2fr_1fr_auto]">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Key</label>
                            <input
                              type="text"
                              value={entry.key}
                              onChange={(event) => handleMetadataChange(entry.id, 'key', event.target.value)}
                              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              placeholder="e.g. zoomPasscode, deliverableUrl"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Value</label>
                            <input
                              type="text"
                              value={entry.value}
                              onChange={(event) => handleMetadataChange(entry.id, 'value', event.target.value)}
                              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              placeholder="Value"
                            />
                          </div>
                          <div className="flex items-end justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveMetadata(entry.id)}
                              className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                            >
                              <XMarkIcon className="h-4 w-4" /> Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="color">
                        Accent colour
                      </label>
                      <input
                        id="color"
                        name="color"
                        type="color"
                        value={state.color ?? '#2563eb'}
                        onChange={handleFieldChange}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white p-1"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
                      <div className="rounded-2xl border border-slate-200 p-4 shadow-inner">
                        <p className="text-sm font-semibold text-slate-900">{state.title || 'Calendar entry preview'}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {resolveTypeMeta(state.eventType)?.label ?? 'Event'} • {resolveStatusMeta(state.status)?.label ?? 'Status'}
                        </p>
                        <p className="mt-2 inline-flex items-center gap-2 text-xs text-slate-500">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: state.color ?? '#2563eb' }} />
                          {state.startsAt ? new Date(state.startsAt).toLocaleString() : 'Awaiting schedule'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Automation tips</p>
                      <ul className="space-y-2 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs text-blue-700">
                        <li className="flex items-start gap-2">
                          <ArrowPathIcon className="mt-0.5 h-4 w-4" /> Syncs instantly with connected client workspaces.
                        </li>
                        <li className="flex items-start gap-2">
                          <GlobeAltIcon className="mt-0.5 h-4 w-4" /> Share availability windows with referral partners.
                        </li>
                        <li className="flex items-start gap-2">
                          <PencilSquareIcon className="mt-0.5 h-4 w-4" /> Attach agendas to reduce prep and follow-up friction.
                        </li>
                      </ul>
                    </div>
                  </div>

                  {(formError || error) && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
                      {formError || error?.message || 'Unable to save the event. Please review the details and try again.'}
                    </div>
                  )}

                  <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                        <CalendarIcon className="h-4 w-4" />
                        {mode === 'edit' ? 'Updating existing record' : 'New calendar record'}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                        <GlobeAltIcon className="h-4 w-4" /> Visible in freelancer mission control
                      </span>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <button
                        type="button"
                        onClick={() => onClose?.()}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={submitting}
                      >
                        {submitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create event'}
                      </button>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

CalendarEventForm.propTypes = {
  open: PropTypes.bool,
  mode: PropTypes.oneOf(['create', 'edit']),
  initialValues: PropTypes.shape({
    title: PropTypes.string,
    eventType: PropTypes.string,
    status: PropTypes.string,
    startsAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    endsAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    isAllDay: PropTypes.bool,
    location: PropTypes.string,
    meetingUrl: PropTypes.string,
    notes: PropTypes.string,
    relatedEntityType: PropTypes.string,
    relatedEntityId: PropTypes.string,
    relatedEntityName: PropTypes.string,
    reminderMinutesBefore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    color: PropTypes.string,
    metadata: PropTypes.object,
  }),
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
  submitting: PropTypes.bool,
  error: PropTypes.shape({ message: PropTypes.string }),
};

CalendarEventForm.defaultProps = {
  open: false,
  mode: 'create',
  initialValues: null,
  onSubmit: null,
  onClose: null,
  submitting: false,
  error: null,
};
