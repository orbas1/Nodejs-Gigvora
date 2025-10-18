import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  CalendarDaysIcon,
  ClockIcon,
  LinkIcon,
  MapPinIcon,
  TrashIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

function formatDate(value, { includeTime = true } = {}) {
  if (!value) {
    return 'Unscheduled';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unscheduled';
  }

  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: includeTime ? 'numeric' : undefined,
    minute: includeTime ? '2-digit' : undefined,
  });

  return dateFormatter.format(date);
}

function joinName(firstName, lastName, email) {
  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(' ');
  }
  return email || 'Team member';
}

export default function AgencyCalendarEventDrawer({
  open,
  event,
  onClose,
  onEdit,
  onDelete,
  collaborators = [],
}) {
  if (!event) {
    return null;
  }

  const collaboratorLookup = new Map(
    collaborators
      .filter((collaborator) => collaborator.id != null)
      .map((collaborator) => [String(collaborator.id), collaborator]),
  );

  const mappedCollaborators = (event.metadata?.collaboratorIds ?? [])
    .map((id) => collaboratorLookup.get(String(id)))
    .filter(Boolean);

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="duration-200 ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="duration-150 ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-200"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-150"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                  <div className="flex h-full flex-col overflow-y-auto bg-white shadow-2xl">
                    {event.coverImageUrl ? (
                      <img src={event.coverImageUrl} alt="Event" className="h-48 w-full object-cover" />
                    ) : null}

                    <div className="flex flex-1 flex-col gap-6 px-6 pb-8 pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Dialog.Title className="text-2xl font-semibold text-slate-900">{event.title}</Dialog.Title>
                          <p className="mt-1 text-sm text-slate-500">
                            {(event.eventType || '').replace(/_/g, ' ')} · {event.status}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => onEdit?.(event)}
                            className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete?.(event)}
                            className="inline-flex items-center gap-1 rounded-full border border-transparent bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-600"
                          >
                            <TrashIcon className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <CalendarDaysIcon className="h-5 w-5 text-slate-400" />
                          <span>
                            {formatDate(event.startsAt)}
                            {event.endsAt && !event.isAllDay ? ` · ${formatDate(event.endsAt, { includeTime: true })}` : ''}
                          </span>
                        </div>
                        {event.location ? (
                          <div className="flex items-center gap-3 text-sm text-slate-600">
                            <MapPinIcon className="h-5 w-5 text-slate-400" />
                            <span>{event.location}</span>
                          </div>
                        ) : null}
                        {event.meetingUrl ? (
                          <div className="flex items-center gap-3 text-sm text-slate-600">
                            <LinkIcon className="h-5 w-5 text-slate-400" />
                            <a
                              href={event.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent hover:text-accentDark"
                            >
                              Join meeting
                            </a>
                          </div>
                        ) : null}
                        {event.reminderOffsets?.length ? (
                          <div className="flex items-center gap-3 text-sm text-slate-600">
                            <ClockIcon className="h-5 w-5 text-slate-400" />
                            <span>Reminders: {event.reminderOffsets.join(', ')} min</span>
                          </div>
                        ) : null}
                      </div>

                      {event.description ? (
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Agenda</h3>
                          <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{event.description}</p>
                        </div>
                      ) : null}

                      {event.notes ? (
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Notes</h3>
                          <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{event.notes}</p>
                        </div>
                      ) : null}

                      {event.attachments?.length ? (
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Files</h3>
                          <ul className="mt-2 space-y-2 text-sm text-slate-700">
                            {event.attachments.map((attachment, index) => (
                              <li key={attachment.url ?? index}>
                                <a
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-accent hover:text-accentDark"
                                >
                                  {attachment.label || attachment.url}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {event.guestEmails?.length || mappedCollaborators.length ? (
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">People</h3>
                          <ul className="space-y-2 text-sm text-slate-700">
                            {mappedCollaborators.map((collaborator) => (
                              <li key={collaborator.id ?? collaborator.email} className="flex items-center gap-2">
                                <UsersIcon className="h-4 w-4 text-slate-400" />
                                <span>
                                  {joinName(collaborator.firstName, collaborator.lastName, collaborator.email)}
                                  {collaborator.role ? (
                                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                                      {collaborator.role}
                                    </span>
                                  ) : null}
                                </span>
                              </li>
                            ))}
                            {event.guestEmails?.map((email) => (
                              <li key={email} className="flex items-center gap-2">
                                <UsersIcon className="h-4 w-4 text-slate-400" />
                                <span>{email}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <div className="mt-auto flex flex-wrap gap-3">
                        {event.relatedEntityType ? (
                          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Linked: {event.relatedEntityType.replace(/_/g, ' ')} {event.relatedEntityId ?? ''}
                          </span>
                        ) : null}
                        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Visibility: {event.visibility}
                        </span>
                        {event.timezone ? (
                          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {event.timezone}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

