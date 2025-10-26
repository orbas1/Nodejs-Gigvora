import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  CalendarDaysIcon,
  ClockIcon,
  DocumentIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  LinkIcon,
  MapPinIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import { EVENT_STATUS_OPTIONS, resolveStatusMeta, resolveTypeMeta } from './constants.js';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function formatDate(value, options = {}) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options,
  });
}

function formatReminder(reminderMinutesBefore) {
  if (reminderMinutesBefore == null) {
    return 'No reminder';
  }
  const value = Number(reminderMinutesBefore);
  if (Number.isNaN(value)) {
    return 'No reminder';
  }
  if (value < 60) {
    return `${value} minutes before`;
  }
  if (value % 60 === 0) {
    const hours = value / 60;
    if (hours >= 24) {
      const days = hours / 24;
      return `${days} day${days > 1 ? 's' : ''} before`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''} before`;
  }
  return `${value} minutes before`;
}

function renderMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }
  const entries = Object.entries(metadata).filter(([key]) => key != null && key !== '');
  if (!entries.length) {
    return null;
  }
  return (
    <dl className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
      {entries.map(([key, value]) => {
        const displayValue =
          value == null
            ? '—'
            : typeof value === 'object'
            ? JSON.stringify(value)
            : String(value);
        return (
          <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{key}</dt>
            <dd className="mt-1 break-words text-sm text-slate-700">{displayValue}</dd>
          </div>
        );
      })}
    </dl>
  );
}

function RelatedLink({ event }) {
  if (!event) {
    return null;
  }
  if (event.meetingUrl) {
    return (
      <a
        href={event.meetingUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
      >
        <LinkIcon className="h-4 w-4" /> Join meeting room
      </a>
    );
  }
  if (event.relatedEntityType && event.relatedEntityId) {
    return (
      <a
        href={`/dashboard/freelancer/${event.relatedEntityType}/${event.relatedEntityId}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
      >
        <DocumentIcon className="h-4 w-4" /> Open related workspace
      </a>
    );
  }
  return null;
}

export default function CalendarEventDetailsDrawer({
  open = false,
  event = null,
  onClose = null,
  onEdit = null,
  onDelete = null,
  onStatusChange = null,
  onDownload = null,
  canManage = false,
  statusUpdating = false,
  onDuplicate = null,
  downloading = false,
  downloadError = null,
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const lastEventIdRef = useRef(event?.id ?? null);

  useEffect(() => {
    if (!open) {
      setConfirmingDelete(false);
      setDeleteError(null);
    }
  }, [open]);

  useEffect(() => {
    if (lastEventIdRef.current !== event?.id) {
      lastEventIdRef.current = event?.id ?? null;
      setConfirmingDelete(false);
      setDeleteError(null);
    }
  }, [event?.id]);

  const typeMeta = useMemo(() => resolveTypeMeta(event?.eventType), [event?.eventType]);
  const statusMeta = useMemo(() => resolveStatusMeta(event?.status), [event?.status]);
  const viewerTimeZone = useMemo(
    () => event?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    [event?.timeZone],
  );

  const handleDelete = useCallback(async () => {
    if (!event || !canManage || statusUpdating) {
      return;
    }
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    try {
      setDeleteError(null);
      await onDelete?.(event);
      setConfirmingDelete(false);
    } catch (error) {
      setDeleteError(error?.message ?? 'Unable to delete the event. Please try again.');
    }
  }, [event, canManage, statusUpdating, confirmingDelete, onDelete]);

  const handleStatusChange = useCallback(
    (nextStatus) => {
      if (!event || !canManage || statusUpdating || event.status === nextStatus) {
        return;
      }
      onStatusChange?.(event, nextStatus);
    },
    [event, canManage, statusUpdating, onStatusChange],
  );

  const safeClose = useCallback(() => {
    if (statusUpdating) {
      return;
    }
    onClose?.();
  }, [statusUpdating, onClose]);

  const handleDuplicate = useCallback(() => {
    if (!canManage || statusUpdating || !event) {
      return;
    }
    onDuplicate?.(event);
  }, [canManage, statusUpdating, event, onDuplicate]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={safeClose}>
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

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-xl">
                  <div className="flex h-full flex-col overflow-y-auto rounded-l-3xl border border-slate-200 bg-white shadow-2xl">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Calendar briefing</p>
                        <Dialog.Title className="text-2xl font-semibold text-slate-900">{event?.title ?? 'Calendar event'}</Dialog.Title>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          <span className={classNames('inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold', typeMeta?.tone)}>
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: (event?.color ?? typeMeta?.color ?? '#2563eb') + '20' }}>
                              <CalendarDaysIcon className="h-4 w-4" style={{ color: event?.color ?? typeMeta?.color ?? '#2563eb' }} />
                            </span>
                            {typeMeta?.label ?? 'Event'}
                          </span>
                          <span className={classNames('inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold', statusMeta?.tone)}>
                            <ClockIcon className="h-4 w-4" /> {statusMeta?.label ?? 'Status'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={safeClose}
                        className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Close details"
                        disabled={statusUpdating}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex-1 space-y-6 p-6">
                      <section className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50/60 p-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1 text-sm text-slate-600">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Starts</p>
                            <p className="font-semibold text-slate-900">{formatDate(event?.startsAt)}</p>
                          </div>
                          <div className="space-y-1 text-sm text-slate-600">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ends</p>
                            <p className="font-semibold text-slate-900">{event?.isAllDay ? 'All day' : formatDate(event?.endsAt)}</p>
                          </div>
                          <div className="space-y-1 text-sm text-slate-600">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reminder</p>
                            <p className="font-semibold text-slate-900">{formatReminder(event?.reminderMinutesBefore)}</p>
                          </div>
                          <div className="space-y-1 text-sm text-slate-600">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timezone</p>
                            <p className="font-semibold text-slate-900">{viewerTimeZone}</p>
                          </div>
                        </div>
                      </section>

                      {event?.location ? (
                        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</p>
                          <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600">
                            <MapPinIcon className="h-5 w-5 text-slate-400" /> {event.location}
                          </p>
                        </section>
                      ) : null}

                      {event?.notes ? (
                        <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agenda & preparation</p>
                          <p className="text-sm leading-relaxed text-slate-700">{event.notes}</p>
                        </section>
                      ) : null}

                      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-center gap-3">
                          <GlobeAltIcon className="h-5 w-5 text-slate-400" />
                          <p className="text-sm font-semibold text-slate-900">Collaboration links</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <RelatedLink event={event} />
                          {event?.meetingUrl ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                              <LinkIcon className="h-4 w-4" /> Verified meeting link
                            </span>
                          ) : null}
                          {event?.relatedEntityName ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                              <DocumentIcon className="h-4 w-4" /> {event.relatedEntityName}
                            </span>
                          ) : null}
                        </div>
                      </section>

                      {renderMetadata(event?.metadata)}

                      <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Audit trail</p>
                        <div className="grid gap-3 text-xs text-slate-500 md:grid-cols-2">
                          <div className="inline-flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-slate-400" />
                            Created by {event?.createdById ? `ID ${event.createdById}` : 'you'}
                          </div>
                          <div className="inline-flex items-center gap-2">
                            <ClockIcon className="h-4 w-4 text-slate-400" />
                            Created {formatDate(event?.createdAt)}
                          </div>
                          <div className="inline-flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-slate-400" />
                            Updated by {event?.updatedById ? `ID ${event.updatedById}` : 'you'}
                          </div>
                          <div className="inline-flex items-center gap-2">
                            <ClockIcon className="h-4 w-4 text-slate-400" />
                            Updated {formatDate(event?.updatedAt)}
                          </div>
                        </div>
                      </section>
                    </div>

                    <div className="border-t border-slate-200 p-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                            Source: {event?.source ?? 'manual'}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                            <CalendarDaysIcon className="h-4 w-4" /> Syncs to freelancer mission control
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          {canManage ? (
                          <select
                            value={event?.status ?? 'confirmed'}
                            onChange={(eventChange) => handleStatusChange(eventChange.target.value)}
                            disabled={statusUpdating || !canManage}
                            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {EVENT_STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          ) : null}
                          {onDownload ? (
                            <button
                              type="button"
                              onClick={() => onDownload(event)}
                              className="inline-flex items-center gap-2 rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={downloading || statusUpdating}
                            >
                              <ArrowDownTrayIcon className="h-4 w-4" />
                              {downloading ? 'Preparing…' : 'Download invite'}
                            </button>
                          ) : null}
                          {canManage ? (
                            <button
                              type="button"
                              onClick={() => onEdit?.(event)}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
                              disabled={statusUpdating}
                            >
                              <PencilIcon className="h-4 w-4" /> Edit
                            </button>
                          ) : null}
                          {canManage ? (
                            <button
                              type="button"
                              onClick={handleDuplicate}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
                              disabled={statusUpdating}
                            >
                              <DocumentIcon className="h-4 w-4" /> Duplicate
                            </button>
                          ) : null}
                          {canManage ? (
                            <button
                              type="button"
                              onClick={handleDelete}
                              className={classNames(
                                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
                                confirmingDelete
                                  ? 'border-rose-500 bg-rose-500 text-white hover:border-rose-600 hover:bg-rose-600'
                                  : 'border-rose-200 text-rose-600 hover:border-rose-300 hover:text-rose-700',
                              )}
                              disabled={statusUpdating}
                            >
                              <TrashIcon className="h-4 w-4" /> {confirmingDelete ? 'Confirm delete' : 'Delete'}
                            </button>
                          ) : null}
                        </div>
                      </div>
                      {confirmingDelete ? (
                        <div className="mt-4 inline-flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-xs text-rose-700">
                          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5" />
                          <span>Deleting removes the event for everyone connected to this freelancer workspace.</span>
                        </div>
                      ) : null}
                      {deleteError ? (
                        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-xs text-rose-700">
                          {deleteError}
                        </div>
                      ) : null}
                      {downloadError ? (
                        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/80 px-4 py-3 text-xs text-blue-700">
                          {downloadError}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

CalendarEventDetailsDrawer.propTypes = {
  open: PropTypes.bool,
  event: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    subtitle: PropTypes.string,
    eventType: PropTypes.string,
    status: PropTypes.string,
    startsAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    endsAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    isAllDay: PropTypes.bool,
    reminderMinutesBefore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    location: PropTypes.string,
    notes: PropTypes.string,
    meetingUrl: PropTypes.string,
    metadata: PropTypes.object,
    relatedEntityId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    relatedEntityType: PropTypes.string,
    relatedEntityName: PropTypes.string,
    source: PropTypes.string,
    color: PropTypes.string,
    createdById: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    updatedById: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    timeZone: PropTypes.string,
  }),
  onClose: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onStatusChange: PropTypes.func,
  onDuplicate: PropTypes.func,
  onDownload: PropTypes.func,
  canManage: PropTypes.bool,
  statusUpdating: PropTypes.bool,
  downloading: PropTypes.bool,
  downloadError: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
};

