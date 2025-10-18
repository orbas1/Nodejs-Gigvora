import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ClockIcon, EnvelopeIcon, LinkIcon, MapPinIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { attachmentsToText, formatDateForDisplay } from './timelineUtils.js';

export default function EventPreviewDialog({ event, open, onClose }) {
  if (!event) {
    return null;
  }

  const start = formatDateForDisplay(event.startDate) ?? 'Unset';
  const due = formatDateForDisplay(event.dueDate) ?? '—';
  const end = formatDateForDisplay(event.endDate) ?? '—';
  const attachmentsText = attachmentsToText(event.attachments);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 z-40 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-3xl bg-white p-6 shadow-xl transition-all">
                <div className="flex flex-col gap-4">
                  <header className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{event.eventType}</p>
                      <Dialog.Title className="mt-1 text-2xl font-semibold text-slate-900">{event.title}</Dialog.Title>
                      {event.summary ? <p className="mt-1 text-sm text-slate-600">{event.summary}</p> : null}
                    </div>
                    <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                      {event.status}
                    </span>
                  </header>

                  <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <ClockIcon className="h-4 w-4" />
                        Schedule
                      </dt>
                      <dd className="mt-2 space-y-1 text-sm text-slate-700">
                        <p>
                          <span className="font-semibold text-slate-900">Start:</span> {start}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-900">Due:</span> {due}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-900">End:</span> {end}
                        </p>
                      </dd>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-white p-4">
                      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <UserCircleIcon className="h-4 w-4" />
                        Owner
                      </dt>
                      <dd className="mt-2 space-y-1 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">{event.ownerName || 'Unassigned'}</p>
                        {event.ownerEmail ? (
                          <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <EnvelopeIcon className="h-4 w-4" />
                            {event.ownerEmail}
                          </p>
                        ) : null}
                        {event.ownerId ? <p className="text-xs text-slate-400">ID: {event.ownerId}</p> : null}
                      </dd>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-white p-4">
                      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <MapPinIcon className="h-4 w-4" />
                        Location
                      </dt>
                      <dd className="mt-2 text-sm text-slate-700">{event.location || 'Not set'}</dd>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-white p-4">
                      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <LinkIcon className="h-4 w-4" />
                        Call to action
                      </dt>
                      <dd className="mt-2 text-sm text-slate-700">
                        {event.ctaLabel || event.ctaUrl ? (
                          <div className="space-y-1">
                            {event.ctaLabel ? <p className="font-semibold text-slate-900">{event.ctaLabel}</p> : null}
                            {event.ctaUrl ? (
                              <a
                                className="inline-flex items-center gap-2 text-sm font-medium text-slate-900 underline decoration-slate-400 hover:decoration-slate-600"
                                href={event.ctaUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {event.ctaUrl}
                              </a>
                            ) : null}
                          </div>
                        ) : (
                          'Not set'
                        )}
                      </dd>
                    </div>
                  </section>

                  {event.description ? (
                    <section className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{event.description}</p>
                    </section>
                  ) : null}

                  {event.tags?.length ? (
                    <section className="rounded-2xl border border-slate-100 bg-white p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tags</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {event.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {attachmentsText ? (
                    <section className="rounded-2xl border border-slate-100 bg-white p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attachments</h3>
                      <pre className="mt-2 whitespace-pre-wrap rounded-2xl bg-slate-950/5 p-4 text-xs text-slate-700">{attachmentsText}</pre>
                    </section>
                  ) : null}

                  <div className="flex justify-end border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
