import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowRightIcon,
  BoltIcon,
  CheckBadgeIcon,
  ChevronDownIcon,
  ClockIcon,
  EnvelopeOpenIcon,
  HeartIcon,
  MapPinIcon,
  SparklesIcon,
  UserCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { ChatBubbleLeftRightIcon, FireIcon, StarIcon } from '@heroicons/react/24/solid';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeVolunteer(volunteer) {
  return {
    id: volunteer.id ?? volunteer.userId ?? volunteer.email ?? Math.random().toString(36).slice(2),
    name: volunteer.name ?? volunteer.fullName ?? 'Volunteer',
    headline: volunteer.headline ?? volunteer.title ?? 'Community member',
    avatarUrl: volunteer.avatarUrl ?? volunteer.photoUrl ?? null,
    location: volunteer.location ?? volunteer.city ?? null,
    timezone: volunteer.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    role: volunteer.role ?? volunteer.preferredRole ?? 'Contributor',
    status: volunteer.status ?? volunteer.availabilityStatus ?? 'active',
    availability: Array.isArray(volunteer.availability) ? volunteer.availability : [],
    skills: Array.isArray(volunteer.skills) ? volunteer.skills : [],
    focusAreas: Array.isArray(volunteer.focusAreas)
      ? volunteer.focusAreas
      : volunteer.causes
      ? [].concat(volunteer.causes)
      : [],
    languages: Array.isArray(volunteer.languages) ? volunteer.languages : [],
    missionsCompleted: volunteer.missionsCompleted ?? volunteer.completedMissions ?? 0,
    hoursContributed: volunteer.hoursContributed ?? volunteer.hoursTotal ?? 0,
    hoursThisMonth: volunteer.hoursThisMonth ?? volunteer.hoursCycle ?? 0,
    commitment: volunteer.commitment ?? volunteer.commitmentLevel ?? 'Flexible',
    preferences: volunteer.preferences ?? {},
    lastActiveAt: toDate(volunteer.lastActiveAt ?? volunteer.lastSeenAt),
    nextShiftAt: toDate(volunteer.nextShiftAt ?? volunteer.nextAssignmentAt),
    score: volunteer.engagementScore ?? volunteer.score ?? 0,
    impactNotes: volunteer.impactNotes ?? volunteer.highlights ?? [],
    missions: Array.isArray(volunteer.missions) ? volunteer.missions : [],
  };
}

function formatRelative(date) {
  if (!date) return '—';
  const now = new Date();
  const diff = Math.round((date.getTime() - now.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff > 1 && diff <= 7) return `In ${diff} days`;
  if (diff < 0 && diff >= -2) return 'Recently';
  if (diff < -2) return `${Math.abs(diff)} days ago`;
  return date.toLocaleDateString();
}

function countAvailability(volunteer) {
  if (!Array.isArray(volunteer.availability)) return 0;
  return volunteer.availability.filter((slot) => slot === 'ready_now' || slot === 'available').length;
}

function formatHours(hours) {
  if (!hours) return '0h';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours % 1 === 0) return `${hours}h`;
  return `${hours.toFixed(1)}h`;
}

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'standby', label: 'Standby' },
  { key: 'draft', label: 'Draft' },
  { key: 'graduated', label: 'Graduated' },
];

export default function VolunteerRoster({
  volunteers,
  featuredStories,
  onAssign,
  onMessage,
  onViewProfile,
}) {
  const normalized = useMemo(() => (Array.isArray(volunteers) ? volunteers.map(normalizeVolunteer) : []), [volunteers]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [focusFilter, setFocusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  const roles = useMemo(() => {
    const counts = normalized.reduce((accumulator, volunteer) => {
      accumulator.set(volunteer.role, (accumulator.get(volunteer.role) ?? 0) + 1);
      return accumulator;
    }, new Map());
    return Array.from(counts.entries());
  }, [normalized]);

  const focusAreas = useMemo(() => {
    const counts = normalized.reduce((accumulator, volunteer) => {
      volunteer.focusAreas.forEach((focus) => {
        accumulator.set(focus, (accumulator.get(focus) ?? 0) + 1);
      });
      return accumulator;
    }, new Map());
    return Array.from(counts.entries());
  }, [normalized]);

  const totalHours = normalized.reduce((sum, volunteer) => sum + volunteer.hoursContributed, 0);
  const hoursThisMonth = normalized.reduce((sum, volunteer) => sum + volunteer.hoursThisMonth, 0);
  const readyNowCount = normalized.filter((volunteer) => volunteer.availability.includes('ready_now')).length;
  const highImpactCount = normalized.filter((volunteer) => volunteer.missionsCompleted > 5).length;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return normalized.filter((volunteer) => {
      if (statusFilter !== 'all' && volunteer.status !== statusFilter) return false;
      if (roleFilter !== 'all' && volunteer.role !== roleFilter) return false;
      if (focusFilter !== 'all' && !volunteer.focusAreas.includes(focusFilter)) return false;
      if (availabilityFilter !== 'all') {
        if (availabilityFilter === 'ready_now' && !volunteer.availability.includes('ready_now')) {
          return false;
        }
        if (
          availabilityFilter === 'weekend' &&
          !volunteer.availability.some((slot) => slot === 'weekend' || slot === 'sat_sun')
        ) {
          return false;
        }
      }
      if (query) {
        const haystack = [
          volunteer.name,
          volunteer.headline,
          volunteer.skills.join(' '),
          volunteer.focusAreas.join(' '),
          volunteer.location,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [normalized, statusFilter, roleFilter, focusFilter, availabilityFilter, search]);

  const spotlight = useMemo(() => {
    return [...normalized]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((volunteer) => ({
        id: volunteer.id,
        name: volunteer.name,
        headline: volunteer.headline,
        highlight: volunteer.impactNotes?.[0] ?? `${volunteer.hoursContributed} lifetime hours`,
      }));
  }, [normalized]);

  const missions = useMemo(() => {
    return normalized
      .flatMap((volunteer) => volunteer.missions.map((mission) => ({ volunteer, mission })))
      .filter((item) => item.mission && item.mission.status === 'active')
      .slice(0, 4);
  }, [normalized]);

  return (
    <section className="space-y-8 rounded-4xl border border-slate-200 bg-white p-8 shadow-xl ring-1 ring-black/5">
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-500">Volunteer command center</p>
          <h2 className="text-2xl font-semibold text-slate-900">Mission-ready roster</h2>
          <p className="max-w-2xl text-sm text-slate-500">
            Deploy the right operators across mentorship salons, volunteer activations, and community pop-ups. Filter by role, availability, or focus area to design cross-functional squads in seconds.
          </p>
        </div>
        <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total hours</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{formatHours(totalHours)}</p>
            <p className="text-xs text-slate-500">{formatHours(hoursThisMonth)} contributed this month</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Activation pulse</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{readyNowCount} ready now</p>
            <p className="text-xs text-slate-500">{highImpactCount} high-impact alumni</p>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/60 p-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {STATUS_FILTERS.map((status) => (
                <button
                  key={status.key}
                  type="button"
                  onClick={() => setStatusFilter(status.key)}
                  className={classNames(
                    'inline-flex items-center justify-between gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition',
                    statusFilter === status.key
                      ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                      : 'border-transparent bg-white text-slate-600 hover:border-slate-200 hover:text-slate-900',
                  )}
                >
                  <span>{status.label}</span>
                  <UsersIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  className="w-full appearance-none rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="all">All roles</option>
                  {roles.map(([role, count]) => (
                    <option key={role} value={role}>
                      {role} ({count})
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              </div>
              <div className="relative">
                <select
                  value={focusFilter}
                  onChange={(event) => setFocusFilter(event.target.value)}
                  className="w-full appearance-none rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="all">All pillars</option>
                  {focusAreas.map(([focus, count]) => (
                    <option key={focus} value={focus}>
                      {focus} ({count})
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              </div>
              <div className="relative">
                <select
                  value={availabilityFilter}
                  onChange={(event) => setAvailabilityFilter(event.target.value)}
                  className="w-full appearance-none rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="all">Availability</option>
                  <option value="ready_now">Ready now</option>
                  <option value="weekend">Weekend</option>
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              </div>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search skills, name, city"
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
                <HeartIcon className="h-12 w-12 text-emerald-500" aria-hidden="true" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900">No volunteers match the current filters</h3>
                  <p className="text-sm text-slate-500">
                    Broaden your availability filters or invite alumni champions to keep the roster energised.
                  </p>
                </div>
              </div>
            ) : (
              filtered.map((volunteer) => (
                <article
                  key={volunteer.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="h-16 w-16 overflow-hidden rounded-3xl bg-slate-100">
                        {volunteer.avatarUrl ? (
                          <img src={volunteer.avatarUrl} alt={volunteer.name} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <UserCircleIcon className="h-8 w-8" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-900">{volunteer.name}</h3>
                          <EventStatusBadge status={volunteer.status} />
                          {volunteer.missionsCompleted > 8 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                              <StarIcon className="h-4 w-4" aria-hidden="true" />
                              Impact leader
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm text-slate-600">{volunteer.headline}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          {volunteer.location ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPinIcon className="h-4 w-4" aria-hidden="true" />
                              {volunteer.location}
                            </span>
                          ) : null}
                          <span className="inline-flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" aria-hidden="true" />
                            {formatHours(volunteer.hoursThisMonth)} this month
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <BoltIcon className="h-4 w-4" aria-hidden="true" />
                            {countAvailability(volunteer)} active slots
                          </span>
                          {volunteer.lastActiveAt ? (
                            <span className="inline-flex items-center gap-1">
                              <FireIcon className="h-4 w-4 text-rose-500" aria-hidden="true" />
                              {formatRelative(volunteer.lastActiveAt)}
                            </span>
                          ) : null}
                        </div>
                        {volunteer.skills.length ? (
                          <div className="flex flex-wrap items-center gap-2">
                            {volunteer.skills.slice(0, 6).map((skill) => (
                              <span
                                key={skill}
                                className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                              >
                                {skill}
                              </span>
                            ))}
                            {volunteer.skills.length > 6 ? (
                              <span className="text-xs text-slate-400">+{volunteer.skills.length - 6} more</span>
                            ) : null}
                          </div>
                        ) : null}
                        {volunteer.focusAreas.length ? (
                          <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-600">
                            <CheckBadgeIcon className="h-4 w-4" aria-hidden="true" />
                            {volunteer.focusAreas.join(' • ')}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right text-xs text-slate-500">
                        <p className="font-semibold uppercase tracking-[0.3em] text-slate-400">Next shift</p>
                        <p className="text-sm text-slate-900">{formatRelative(volunteer.nextShiftAt)}</p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onMessage?.(volunteer)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        >
                          Message
                          <ChatBubbleLeftRightIcon className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onAssign?.(volunteer)}
                          className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-600"
                        >
                          Assign to mission
                          <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onViewProfile?.(volunteer)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        >
                          View profile
                          <EnvelopeOpenIcon className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="space-y-4 rounded-3xl border border-slate-200 p-6 shadow-sm">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Spotlight</p>
                <h3 className="text-lg font-semibold text-slate-900">Top catalysts</h3>
              </div>
              <SparklesIcon className="h-6 w-6 text-emerald-500" aria-hidden="true" />
            </header>
            <ul className="space-y-3">
              {spotlight.map((item) => (
                <li key={item.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.headline}</p>
                  <p className="mt-2 text-xs text-emerald-600">{item.highlight}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 p-6 shadow-sm">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Live missions</p>
                <h3 className="text-lg font-semibold text-slate-900">Where help is flowing</h3>
              </div>
              <FireIcon className="h-6 w-6 text-rose-500" aria-hidden="true" />
            </header>
            <ul className="space-y-3">
              {missions.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
                  Invite programme owners to submit volunteer briefs to populate live missions.
                </li>
              ) : (
                missions.map(({ volunteer, mission }) => (
                  <li key={`${volunteer.id}-${mission.id}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">{mission.title}</p>
                    <p className="text-xs text-slate-500">{volunteer.name} • {mission.location || 'Hybrid'} • {formatRelative(toDate(mission.nextCheckpointAt))}</p>
                  </li>
                ))
              )}
            </ul>
          </div>

          {Array.isArray(featuredStories) && featuredStories.length ? (
            <div className="space-y-4 rounded-3xl border border-slate-200 p-6 shadow-sm">
              <header className="space-y-2">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Stories</p>
                <h3 className="text-lg font-semibold text-slate-900">Volunteer impact reels</h3>
              </header>
              <div className="space-y-3">
                {featuredStories.map((story) => (
                  <article key={story.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">{story.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{story.description}</p>
                    <a
                      href={story.url}
                      className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      Watch recap
                      <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

VolunteerRoster.propTypes = {
  volunteers: PropTypes.arrayOf(PropTypes.object),
  featuredStories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
      description: PropTypes.string,
      url: PropTypes.string,
    }),
  ),
  onAssign: PropTypes.func,
  onMessage: PropTypes.func,
  onViewProfile: PropTypes.func,
};

VolunteerRoster.defaultProps = {
  volunteers: [],
  featuredStories: [],
  onAssign: null,
  onMessage: null,
  onViewProfile: null,
};

function EventStatusBadge({ status }) {
  const palette = {
    active: 'bg-emerald-100 text-emerald-700',
    standby: 'bg-amber-100 text-amber-700',
    draft: 'bg-slate-100 text-slate-500',
    graduated: 'bg-purple-100 text-purple-700',
  };
  const label = {
    active: 'Active',
    standby: 'Standby',
    draft: 'Draft',
    graduated: 'Alumni',
  }[status] || 'Active';
  return (
    <span className={classNames('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', palette[status] ?? palette.active)}>
      {label}
    </span>
  );
}

EventStatusBadge.propTypes = {
  status: PropTypes.string,
};

EventStatusBadge.defaultProps = {
  status: 'active',
};
