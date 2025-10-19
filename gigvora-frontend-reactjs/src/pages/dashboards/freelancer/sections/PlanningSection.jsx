import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import SectionShell from '../../SectionShell.jsx';
import DataStatus from '../../../../components/DataStatus.jsx';
import useSession from '../../../../hooks/useSession.js';
import useFreelancerCalendar from '../../../../hooks/useFreelancerCalendar.js';
import { EVENT_TYPE_OPTIONS, TYPE_COLOR_MAP } from './planning/constants.js';

function formatEventTime(event) {
  if (!event?.startsAt) {
    return 'No time set';
  }
  const start = new Date(event.startsAt);
  return start.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function nextEvents(events) {
  if (!Array.isArray(events)) {
    return [];
  }
  const now = Date.now();
  return [...events]
    .filter((event) => {
      if (!event?.startsAt) {
        return true;
      }
      const start = new Date(event.startsAt).getTime();
      return Number.isFinite(start) && start >= now;
    })
    .sort((a, b) => {
      const first = a?.startsAt ? new Date(a.startsAt).getTime() : Number.MAX_SAFE_INTEGER;
      const second = b?.startsAt ? new Date(b.startsAt).getTime() : Number.MAX_SAFE_INTEGER;
      return first - second;
    })
    .slice(0, 4);
}

export default function PlanningSection() {
  const { session } = useSession();
  const freelancerId = session?.id ?? null;

  const { events, metrics, loading, error, lastUpdated, refresh } = useFreelancerCalendar({
    freelancerId,
    enabled: true,
    lookbackDays: 3,
    lookaheadDays: 30,
  });

  const upcoming = useMemo(() => nextEvents(events), [events]);

  const summary = useMemo(
    () => [
      {
        label: 'Next',
        value: metrics?.nextEvent?.title ?? 'None scheduled',
        caption: metrics?.nextEvent ? formatEventTime(metrics.nextEvent) : 'Add your next booking',
      },
      {
        label: 'Total',
        value: metrics?.total ?? events?.length ?? 0,
        caption: `${metrics?.upcomingCount ?? 0} upcoming`,
      },
      {
        label: 'Due',
        value: metrics?.overdueCount ?? 0,
        caption: metrics?.overdueCount ? 'Action required' : 'All clear',
      },
    ],
    [events?.length, metrics?.nextEvent, metrics?.overdueCount, metrics?.total, metrics?.upcomingCount],
  );

  const typeChips = useMemo(() => {
    const counts = metrics?.typeCounts ?? {};
    return EVENT_TYPE_OPTIONS.map((option) => ({
      ...option,
      count: counts[option.value] ?? 0,
    })).filter((option) => option.count > 0);
  }, [metrics?.typeCounts]);

  return (
    <SectionShell
      id="planning"
      title="Planner"
      description="Fast access to the next interviews, gigs, mentorship, and volunteering commitments."
      actions={[
        <Link
          key="planner"
          to="/dashboard/freelancer/planner"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
        >
          Open planner <ArrowRightIcon className="h-4 w-4" />
        </Link>,
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <DataStatus
              loading={loading}
              error={error}
              lastUpdated={lastUpdated}
              statusLabel="Planner snapshot"
              onRefresh={() => refresh({ force: true })}
            />
            <div className="grid grid-cols-3 gap-3">
              {summary.map((card) => (
                <div
                  key={card.label}
                  className="flex h-24 flex-col justify-center rounded-3xl border border-slate-200 bg-slate-50/70 px-4 text-left"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</span>
                  <span className="mt-2 text-xl font-semibold text-slate-900">{card.value}</span>
                  <span className="mt-1 text-xs text-slate-500">{card.caption}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <CalendarDaysIcon className="h-4 w-4" /> Upcoming
            </p>
            {upcoming.length ? (
              <ul className="space-y-3">
                {upcoming.map((event) => {
                  const color = TYPE_COLOR_MAP[event.eventType] ?? '#64748b';
                  return (
                    <li
                      key={event.id ?? event.title}
                      className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex h-8 w-8 items-center justify-center rounded-2xl text-xs font-semibold"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          {event.eventType ? event.eventType.split('_')[0].slice(0, 2).toUpperCase() : 'EV'}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">{event.title}</p>
                          <p className="text-xs text-slate-500">{formatEventTime(event)}</p>
                        </div>
                      </div>
                      <Link
                        to="/dashboard/freelancer/planner"
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
                      >
                        View <ArrowRightIcon className="h-3 w-3" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                No upcoming items. Add your next milestone from the planner.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <ClockIcon className="h-4 w-4" /> Focus areas
          </p>
          {typeChips.length ? (
            <div className="flex flex-wrap gap-2">
              {typeChips.map((chip) => (
                <span
                  key={chip.value}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: TYPE_COLOR_MAP[chip.value] ?? '#64748b' }}
                  />
                  {chip.label}
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] text-slate-500">{chip.count}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No recent activity captured yet.</p>
          )}
        </div>
      </div>
    </SectionShell>
  );
}
