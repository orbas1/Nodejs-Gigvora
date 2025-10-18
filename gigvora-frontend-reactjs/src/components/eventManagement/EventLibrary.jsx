import { CalendarDaysIcon, EllipsisVerticalIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

function formatDate(value) {
  if (!value) return 'Not set';
  try {
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

function formatLabel(value) {
  if (!value) return '';
  return value
    .toString()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function EventLibrary({
  events,
  selectedEventId,
  onSelect,
  onOpenWorkspace,
  onEdit,
  onDelete,
  onCreate,
  canManage,
}) {
  const hasEvents = events?.length > 0;
  return (
    <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Events</h3>
        <p className="text-sm text-slate-500">{hasEvents ? `${events.length} scheduled` : 'Create your first event'}</p>
      </div>
      {hasEvents ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => {
            const isSelected = selectedEventId === event.id;
            return (
              <article
                key={event.id}
                className={`group flex flex-col justify-between rounded-3xl border px-5 py-4 transition shadow-sm ${
                  isSelected ? 'border-slate-900 bg-slate-900/5' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onSelect(event.id)}
                    className="text-left text-base font-semibold text-slate-900 transition hover:text-slate-700"
                  >
                    {event.title ?? 'Untitled event'}
                  </button>
                  {canManage ? (
                    <Menu as="div" className="relative inline-block text-left">
                      <Menu.Button className="rounded-full p-1 text-slate-500 hover:bg-white hover:text-slate-900">
                        <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                      </Menu.Button>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform scale-95 opacity-0"
                        enterTo="transform scale-100 opacity-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform scale-100 opacity-100"
                        leaveTo="transform scale-95 opacity-0"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                          <div className="py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  type="button"
                                  onClick={() => onEdit(event.id)}
                                  className={`w-full px-4 py-2 text-left text-sm font-medium ${
                                    active ? 'bg-slate-900 text-white' : 'text-slate-700'
                                  }`}
                                >
                                  Edit
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  type="button"
                                  onClick={() => onDelete(event.id)}
                                  className={`w-full px-4 py-2 text-left text-sm font-medium ${
                                    active ? 'bg-rose-500 text-white' : 'text-rose-600'
                                  }`}
                                >
                                  Delete
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  ) : null}
                </div>
                <dl className="mt-4 space-y-2 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
                    <span>{formatDate(event.startAt)}</span>
                  </div>
                  {event.location ? (
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4" aria-hidden="true" />
                      <span>{event.location}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-4 w-4" aria-hidden="true" />
                    <span>{`${event.guests?.length ?? 0} guests`}</span>
                  </div>
                </dl>
                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    {formatLabel(event.status)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenWorkspace(event.id)}
                    className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Manage
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 py-16">
          <p className="text-base font-semibold text-slate-900">No events yet</p>
          <p className="mt-2 max-w-sm text-center text-sm text-slate-500">
            Plan launches, tours, and community moments with a single workspace.
          </p>
          {canManage ? (
            <button
              type="button"
              onClick={onCreate}
              className="mt-6 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create your first event
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

