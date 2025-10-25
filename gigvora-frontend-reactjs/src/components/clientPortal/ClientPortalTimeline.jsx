import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';
import { classNames } from '../../utils/classNames.js';
import StatusBadge from '../common/StatusBadge.jsx';

function LoadingState() {
  return (
    <ul className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <li key={`timeline-loading-${index}`} className="animate-pulse rounded-2xl border border-slate-200 bg-slate-100/60 p-4">
          <div className="h-4 w-32 rounded-full bg-slate-200/70" />
          <div className="mt-2 h-3 w-full rounded-full bg-slate-200/60" />
          <div className="mt-2 h-3 w-2/3 rounded-full bg-slate-200/60" />
        </li>
      ))}
    </ul>
  );
}

export default function ClientPortalTimeline({ events = [], summary = {}, loading = false, className = '' }) {
  const overdueCount = summary?.overdueCount ?? 0;
  const atRiskEvents = summary?.atRiskEvents ?? [];

  return (
    <section className={classNames('rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Timeline &amp; approvals</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Real-time view of milestones and rituals your clients see. Everything syncs back to the internal workspace so there&apos;s
            never a status gap.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            <CalendarDaysIcon className="h-4 w-4" /> {summary?.totalCount ?? 0} milestones
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircleIcon className="h-4 w-4 text-emerald-500" /> {summary?.completedCount ?? 0} completed
            <span className="text-slate-300">|</span>
            <ExclamationTriangleIcon className={classNames('h-4 w-4', overdueCount ? 'text-amber-500' : 'text-slate-300')} />
            {overdueCount} overdue
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {atRiskEvents.length ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
              <ExclamationTriangleIcon className="h-4 w-4" /> Attention needed
            </p>
            <ul className="mt-3 space-y-2">
              {atRiskEvents.map((event) => (
                <li key={`at-risk-${event.id}`} className="text-sm text-amber-700">
                  <span className="font-semibold">{event.title}</span>
                  {event.dueDate ? ` · due ${formatRelativeTime(event.dueDate)}` : null}
                  {event.metadata?.riskNotes ? ` · ${event.metadata.riskNotes}` : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {loading ? (
          <LoadingState />
        ) : events.length ? (
          <ul className="space-y-4">
            {events.map((event) => (
              <li key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 transition hover:border-blue-200 hover:bg-blue-50/60">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={event.status} category="calendarEvent" uppercase={false} size="xs" />
                    <span className="text-sm font-semibold text-slate-900">{event.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {event.startDate ? (
                      <span>Started {formatAbsolute(event.startDate, { dateStyle: 'medium' })}</span>
                    ) : null}
                    {event.dueDate ? (
                      <span>
                        Due {formatRelativeTime(event.dueDate)} ({formatAbsolute(event.dueDate, { dateStyle: 'medium' })})
                      </span>
                    ) : null}
                  </div>
                </div>
                {event.description ? (
                  <p className="mt-3 text-sm text-slate-600">{event.description}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1">
                    <PlayIcon className="h-4 w-4 text-blue-500" /> {event.eventType}
                  </span>
                  {event.owner?.name ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1">
                      <UsersIcon className="h-4 w-4 text-blue-500" /> {event.owner.name}
                    </span>
                  ) : null}
                  {Array.isArray(event.metadata?.deliverables) && event.metadata.deliverables.length ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1">
                      Deliverables: {event.metadata.deliverables.join(', ')}
                    </span>
                  ) : null}
                  {Array.isArray(event.metadata?.dependencies) && event.metadata.dependencies.length ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1">
                      Dependencies: {event.metadata.dependencies.join(', ')}
                    </span>
                  ) : null}
                  {event.metadata?.riskNotes && !atRiskEvents.some((item) => item.id === event.id) ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-amber-700">
                      <ExclamationTriangleIcon className="h-4 w-4" /> {event.metadata.riskNotes}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
            <h3 className="text-sm font-semibold text-slate-700">No milestones shared yet</h3>
            <p className="mt-2 text-sm text-slate-500">
              As soon as you publish a timeline entry from the project workspace, it will appear here for the client.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
