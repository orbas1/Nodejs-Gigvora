import { Fragment, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Tab, Transition } from '@headlessui/react';
import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
  ClockIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon, ShareIcon, SparklesIcon } from '@heroicons/react/24/solid';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function formatDateTime(date, timezone, options = {}) {
  if (!date) return 'TBA';
  const formatter = new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
    ...options,
  });
  return formatter.format(date);
}

function formatDuration(event) {
  if (!event?.startsAt || !event?.endsAt) return null;
  const duration = Math.max(0, (event.endsAt.getTime() - event.startsAt.getTime()) / 60000);
  if (duration <= 0) return null;
  if (duration < 60) return `${duration} minutes`;
  if (duration % 60 === 0) return `${duration / 60} hours`;
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  return `${hours}h ${minutes}m`;
}

function formatRelative(start) {
  if (!start) return null;
  const now = new Date();
  const diff = Math.round((start.getTime() - now.getTime()) / 86400000);
  if (diff === 0) return 'Happening today';
  if (diff === 1) return 'Tomorrow';
  if (diff > 1 && diff <= 14) return `In ${diff} days`;
  if (diff < 0 && diff >= -2) return 'Just happened';
  if (diff < -2) return `Ended ${Math.abs(diff)} days ago`;
  return null;
}

function formatAgendaTime(start, end, timezone) {
  if (!start) return 'To be confirmed';
  const base = new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  });
  if (!end) {
    return base.format(start);
  }
  return `${base.format(start)} – ${base.format(end)}`;
}

function EventBadge({ tone = 'default', icon: Icon, children }) {
  const palette = {
    default: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-100 text-emerald-700',
    info: 'bg-sky-100 text-sky-700',
    accent: 'bg-accent/10 text-accent',
  };
  return (
    <span className={classNames('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', palette[tone])}>
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

EventBadge.propTypes = {
  tone: PropTypes.oneOf(['default', 'success', 'info', 'accent']),
  icon: PropTypes.elementType,
  children: PropTypes.node.isRequired,
};

EventBadge.defaultProps = {
  tone: 'default',
  icon: null,
};

function SpeakerCard({ speaker }) {
  return (
    <article className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
        {speaker.avatarUrl ? (
          <img src={speaker.avatarUrl} alt={speaker.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <UserGroupIcon className="h-6 w-6" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-900">{speaker.name}</p>
        <p className="text-xs text-slate-500">
          {[speaker.title, speaker.company].filter(Boolean).join(' • ')}
        </p>
        {speaker.bio ? <p className="text-xs text-slate-500">{speaker.bio.slice(0, 120)}</p> : null}
      </div>
    </article>
  );
}

SpeakerCard.propTypes = {
  speaker: PropTypes.shape({
    name: PropTypes.string,
    title: PropTypes.string,
    company: PropTypes.string,
    bio: PropTypes.string,
    avatarUrl: PropTypes.string,
  }).isRequired,
};

function ResourceLink({ resource }) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-accent/40 hover:text-accent"
    >
      <span className="flex items-center gap-3">
        <ArrowDownTrayIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
        {resource.label}
      </span>
      <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
    </a>
  );
}

ResourceLink.propTypes = {
  resource: PropTypes.shape({
    label: PropTypes.string,
    url: PropTypes.string,
  }).isRequired,
};

const TABS = [
  { key: 'about', label: 'Overview' },
  { key: 'agenda', label: 'Agenda' },
  { key: 'resources', label: 'Resources' },
  { key: 'community', label: 'Community' },
];

export default function EventDetailModal({
  open,
  event,
  onClose,
  onRsvp,
  onVolunteer,
  onAddToCalendar,
  onShare,
  busy,
  error,
}) {
  const resolvedEvent = useMemo(() => {
    if (!event) return null;
    return {
      ...event,
      startsAt: event.startsAt instanceof Date ? event.startsAt : event.startsAt ? new Date(event.startsAt) : null,
      endsAt: event.endsAt instanceof Date ? event.endsAt : event.endsAt ? new Date(event.endsAt) : null,
      timezone: event.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      agenda: Array.isArray(event.agenda)
        ? event.agenda.map((item, index) => ({
            id: item.id ?? `${event.id}-agenda-${index}`,
            title: item.title ?? `Agenda item ${index + 1}`,
            description: item.description ?? null,
            startsAt: item.startsAt instanceof Date ? item.startsAt : item.startsAt ? new Date(item.startsAt) : null,
            endsAt: item.endsAt instanceof Date ? item.endsAt : item.endsAt ? new Date(item.endsAt) : null,
            owner: item.owner ?? item.ownerName ?? null,
          }))
        : [],
      speakers: Array.isArray(event.speakers) ? event.speakers : [],
      resources: Array.isArray(event.resources) ? event.resources : [],
      recommendedPeers: Array.isArray(event.recommendedPeers) ? event.recommendedPeers : [],
    };
  }, [event]);

  const durationLabel = resolvedEvent ? formatDuration(resolvedEvent) : null;
  const relativeLabel = resolvedEvent ? formatRelative(resolvedEvent.startsAt) : null;

  return (
    <Transition show={open} as={Fragment} appear>
      <Dialog as="div" className="relative z-[90]" onClose={busy ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-5xl overflow-hidden rounded-4xl bg-white shadow-2xl">
                {resolvedEvent?.coverImageUrl ? (
                  <div className="relative h-64 w-full overflow-hidden">
                    <img
                      src={resolvedEvent.coverImageUrl}
                      alt={resolvedEvent.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 text-white">
                      <div className="space-y-2">
                        <Dialog.Title className="text-2xl font-semibold">{resolvedEvent.title}</Dialog.Title>
                        <p className="max-w-2xl text-sm text-white/80">{resolvedEvent.summary}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <EventBadge tone="accent" icon={SparklesIcon}>
                            {resolvedEvent.category?.replace(/_/g, ' ') || 'Community'}
                          </EventBadge>
                          {resolvedEvent.isVolunteer ? (
                            <EventBadge tone="success" icon={HeartIcon}>
                              Volunteer mission
                            </EventBadge>
                          ) : null}
                          {durationLabel ? <EventBadge tone="info">{durationLabel}</EventBadge> : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        className="hidden rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10 sm:inline-flex"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-6 py-6">
                    <div className="space-y-2">
                      <Dialog.Title className="text-2xl font-semibold text-slate-900">{resolvedEvent?.title}</Dialog.Title>
                      <p className="text-sm text-slate-600">{resolvedEvent?.summary}</p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Close
                    </button>
                  </div>
                )}

                <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                  <div className="space-y-6">
                    <Tab.Group>
                      <Tab.List className="flex flex-wrap items-center gap-3">
                        {TABS.map((tab) => (
                          <Tab key={tab.key} as={Fragment}>
                            {({ selected }) => (
                              <button
                                type="button"
                                className={classNames(
                                  'rounded-full px-4 py-2 text-sm font-semibold transition',
                                  selected ? 'bg-slate-900 text-white shadow-lg' : 'border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800',
                                )}
                              >
                                {tab.label}
                              </button>
                            )}
                          </Tab>
                        ))}
                      </Tab.List>
                      <Tab.Panels className="mt-6 space-y-6">
                        <Tab.Panel className="space-y-6">
                          <section className="rounded-3xl border border-slate-200 p-6 shadow-sm">
                            <header className="space-y-2">
                              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Event timeline</p>
                              <h3 className="text-lg font-semibold text-slate-900">Core details</h3>
                            </header>
                            <dl className="mt-4 grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
                              <div className="space-y-1">
                                <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                                  <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" /> When
                                </dt>
                                <dd>{formatDateTime(resolvedEvent?.startsAt, resolvedEvent?.timezone)}</dd>
                                {relativeLabel ? <dd className="text-xs text-emerald-600">{relativeLabel}</dd> : null}
                              </div>
                              <div className="space-y-1">
                                <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                                  <MapPinIcon className="h-4 w-4" aria-hidden="true" /> Where
                                </dt>
                                <dd>{resolvedEvent?.location || 'To be announced'}</dd>
                                {resolvedEvent?.format ? (
                                  <dd className="text-xs text-slate-400">{resolvedEvent.format}</dd>
                                ) : null}
                              </div>
                              <div className="space-y-1">
                                <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                                  <ClockIcon className="h-4 w-4" aria-hidden="true" /> Duration
                                </dt>
                                <dd>{durationLabel || 'To be confirmed'}</dd>
                                <dd className="text-xs text-slate-400">Timezone: {resolvedEvent?.timezone}</dd>
                              </div>
                              <div className="space-y-1">
                                <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                                  <UserGroupIcon className="h-4 w-4" aria-hidden="true" /> Capacity
                                </dt>
                                <dd>
                                  {resolvedEvent?.capacity
                                    ? `${resolvedEvent.attendeesCount ?? 0} / ${resolvedEvent.capacity}`
                                    : `${resolvedEvent?.attendeesCount ?? 0} confirmed`}
                                </dd>
                                {resolvedEvent?.volunteerSlots ? (
                                  <dd className="text-xs text-emerald-600">
                                    {resolvedEvent.volunteerSlots} volunteer spots ready
                                  </dd>
                                ) : null}
                              </div>
                            </dl>
                            {resolvedEvent?.host ? (
                              <div className="mt-6 flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-200">
                                  {resolvedEvent.host.avatarUrl ? (
                                    <img src={resolvedEvent.host.avatarUrl} alt={resolvedEvent.host.name} className="h-full w-full object-cover" loading="lazy" />
                                  ) : null}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">Hosted by {resolvedEvent.host.name || 'Community partner'}</p>
                                  <p className="text-xs text-slate-500">{resolvedEvent.hostCompany || resolvedEvent.host.title || 'Impact collective'}</p>
                                </div>
                              </div>
                            ) : null}
                          </section>

                          {resolvedEvent?.description ? (
                            <section className="rounded-3xl border border-slate-200 p-6 shadow-sm">
                              <header className="space-y-2">
                                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Narrative</p>
                                <h3 className="text-lg font-semibold text-slate-900">What to expect</h3>
                              </header>
                              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                                {resolvedEvent.description}
                              </p>
                            </section>
                          ) : null}
                        </Tab.Panel>

                        <Tab.Panel className="space-y-6">
                          <section className="rounded-3xl border border-slate-200 p-6 shadow-sm">
                            {resolvedEvent?.agenda?.length ? (
                              <ol className="space-y-4">
                                {resolvedEvent.agenda
                                  .slice()
                                  .sort((a, b) => {
                                    if (!a.startsAt || !b.startsAt) return 0;
                                    return a.startsAt - b.startsAt;
                                  })
                                  .map((item) => (
                                    <li key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                                      <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                                          {item.owner ? <p className="text-xs text-slate-500">Led by {item.owner}</p> : null}
                                        </div>
                                        <EventBadge tone="info">{formatAgendaTime(item.startsAt, item.endsAt, resolvedEvent.timezone)}</EventBadge>
                                      </div>
                                      {item.description ? (
                                        <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                                      ) : null}
                                    </li>
                                  ))}
                              </ol>
                            ) : (
                              <p className="text-sm text-slate-500">Agenda will be published once hosts finalise the experience arc.</p>
                            )}
                          </section>
                        </Tab.Panel>

                        <Tab.Panel className="space-y-6">
                          {resolvedEvent?.resources?.length ? (
                            <div className="space-y-3">
                              {resolvedEvent.resources.map((resource) => (
                                <ResourceLink key={resource.url || resource.label} resource={resource} />
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500">
                              Share run-of-show decks, facilitation toolkits, and post-event recordings so attendees can take action.
                            </p>
                          )}
                        </Tab.Panel>

                        <Tab.Panel className="space-y-6">
                          <section className="rounded-3xl border border-slate-200 p-6 shadow-sm">
                            <header className="space-y-2">
                              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Speakers & guides</p>
                              <h3 className="text-lg font-semibold text-slate-900">The people powering this session</h3>
                            </header>
                            {resolvedEvent?.speakers?.length ? (
                              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                {resolvedEvent.speakers.map((speaker) => (
                                  <SpeakerCard key={speaker.id || speaker.name} speaker={speaker} />
                                ))}
                              </div>
                            ) : (
                              <p className="mt-4 text-sm text-slate-500">Speaker lineup will be announced shortly. Expect industry operators, alumni mentors, and mission partners.</p>
                            )}
                          </section>

                          <section className="rounded-3xl border border-slate-200 p-6 shadow-sm">
                            <header className="space-y-2">
                              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Suggested peers</p>
                              <h3 className="text-lg font-semibold text-slate-900">Invite collaborators</h3>
                            </header>
                            {resolvedEvent?.recommendedPeers?.length ? (
                              <ul className="mt-4 space-y-3">
                                {resolvedEvent.recommendedPeers.map((peer) => (
                                  <li key={peer.id || peer.email} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                                    <div>
                                      <p className="font-semibold text-slate-900">{peer.name}</p>
                                      <p className="text-xs text-slate-500">{peer.headline || peer.email}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => onShare?.(peer)}
                                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent"
                                    >
                                      Invite
                                      <EnvelopeIcon className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-4 text-sm text-slate-500">Enable relationship intelligence to automatically pull allies and mentors who should be in the room.</p>
                            )}
                          </section>
                        </Tab.Panel>
                      </Tab.Panels>
                    </Tab.Group>
                  </div>

                  <aside className="space-y-6">
                    <div className="space-y-4 rounded-3xl border border-slate-200 p-6 shadow-sm">
                      <h3 className="text-sm font-semibold text-slate-900">Take action</h3>
                      <div className="flex flex-col gap-3">
                        <button
                          type="button"
                          onClick={() => onRsvp?.(resolvedEvent)}
                          disabled={busy}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/30 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                          RSVP now
                          <SparklesIcon className="h-4 w-4" aria-hidden="true" />
                        </button>
                        {resolvedEvent?.isVolunteer ? (
                          <button
                            type="button"
                            onClick={() => onVolunteer?.(resolvedEvent)}
                            disabled={busy}
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-500 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-600 hover:bg-emerald-100 disabled:cursor-not-allowed"
                          >
                            Join volunteer roster
                            <HeartIcon className="h-4 w-4" aria-hidden="true" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => onAddToCalendar?.(resolvedEvent)}
                          disabled={busy}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed"
                        >
                          Add to calendar
                          <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onShare?.(resolvedEvent)}
                          disabled={busy}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed"
                        >
                          Share with network
                          <ShareIcon className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
                    </div>

                    <div className="space-y-3 rounded-3xl border border-slate-200 p-6 shadow-sm">
                      <h3 className="text-sm font-semibold text-slate-900">Quick facts</h3>
                      <dl className="space-y-3 text-sm text-slate-600">
                        <div className="flex items-start justify-between gap-3">
                          <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Format</dt>
                          <dd>{resolvedEvent?.format || (resolvedEvent?.isHybrid ? 'Hybrid' : resolvedEvent?.location)}</dd>
                        </div>
                        {resolvedEvent?.livestreamUrl ? (
                          <div className="flex items-start justify-between gap-3">
                            <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Livestream</dt>
                            <dd className="flex items-center gap-2 text-sm text-sky-600">
                              <GlobeAltIcon className="h-4 w-4" aria-hidden="true" />
                              <a href={resolvedEvent.livestreamUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                Join broadcast
                              </a>
                            </dd>
                          </div>
                        ) : null}
                        {resolvedEvent?.volunteerSlots ? (
                          <div className="flex items-start justify-between gap-3">
                            <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Volunteer slots</dt>
                            <dd>{resolvedEvent.volunteerSlots}</dd>
                          </div>
                        ) : null}
                        {resolvedEvent?.tags?.length ? (
                          <div className="space-y-2">
                            <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Focus pillars</dt>
                            <dd className="flex flex-wrap items-center gap-2">
                              {resolvedEvent.tags.map((tag) => (
                                <span key={tag} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                  {tag}
                                </span>
                              ))}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    </div>

                    {resolvedEvent?.heroVideoUrl ? (
                      <a
                        href={resolvedEvent.heroVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-900 px-6 py-4 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800"
                      >
                        Watch teaser
                        <ArrowTopRightOnSquareIcon className="h-5 w-5" aria-hidden="true" />
                      </a>
                    ) : null}
                  </aside>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

EventDetailModal.propTypes = {
  open: PropTypes.bool.isRequired,
  event: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    summary: PropTypes.string,
    description: PropTypes.string,
    category: PropTypes.string,
    startsAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    endsAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    timezone: PropTypes.string,
    location: PropTypes.string,
    format: PropTypes.string,
    attendeesCount: PropTypes.number,
    capacity: PropTypes.number,
    volunteerSlots: PropTypes.number,
    coverImageUrl: PropTypes.string,
    heroVideoUrl: PropTypes.string,
    livestreamUrl: PropTypes.string,
    isVolunteer: PropTypes.bool,
    tags: PropTypes.arrayOf(PropTypes.string),
    agenda: PropTypes.arrayOf(PropTypes.object),
    speakers: PropTypes.arrayOf(PropTypes.object),
    resources: PropTypes.arrayOf(PropTypes.object),
    recommendedPeers: PropTypes.arrayOf(PropTypes.object),
    host: PropTypes.shape({
      name: PropTypes.string,
      title: PropTypes.string,
      company: PropTypes.string,
      avatarUrl: PropTypes.string,
    }),
  }),
  onClose: PropTypes.func.isRequired,
  onRsvp: PropTypes.func,
  onVolunteer: PropTypes.func,
  onAddToCalendar: PropTypes.func,
  onShare: PropTypes.func,
  busy: PropTypes.bool,
  error: PropTypes.string,
};

EventDetailModal.defaultProps = {
  event: null,
  onRsvp: null,
  onVolunteer: null,
  onAddToCalendar: null,
  onShare: null,
  busy: false,
  error: null,
};
