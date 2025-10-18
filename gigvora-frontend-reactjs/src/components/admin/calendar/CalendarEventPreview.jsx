import { CalendarDaysIcon, ClockIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/outline';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch (error) {
    return '—';
  }
}

export default function CalendarEventPreview({ event }) {
  if (!event) {
    return null;
  }
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-slate-900 px-6 py-6 text-white shadow-xl">
        <h2 className="text-xl font-semibold">{event.title}</h2>
        <p className="mt-2 text-sm text-slate-200">{event.description || '—'}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3 text-sm text-slate-200">
            <CalendarDaysIcon className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold uppercase tracking-wide text-slate-300">When</p>
              <p>{formatDate(event.startsAt)}</p>
              <p className="text-xs text-slate-300">{formatDate(event.endsAt)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-sm text-slate-200">
            <ClockIcon className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold uppercase tracking-wide text-slate-300">Status</p>
              <p className="capitalize">{event.status}</p>
              <p className="text-xs text-slate-300">{event.visibility}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-sm text-slate-200">
            <UserGroupIcon className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold uppercase tracking-wide text-slate-300">Owners</p>
              <p>{(event.allowedRoles || []).join(', ') || '—'}</p>
              <p className="text-xs text-slate-300">{(event.invitees || []).join(', ') || 'No invites'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-sm text-slate-200">
            <MapPinIcon className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold uppercase tracking-wide text-slate-300">Location</p>
              <p>{event.location || 'Virtual'}</p>
              <p className="text-xs text-slate-300 break-all">{event.meetingUrl || 'No link'}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Account</h3>
        <p className="mt-2 text-sm text-slate-600">
          {event.calendarAccount?.displayName || event.calendarAccount?.accountEmail || '—'}
        </p>
        <p className="mt-1 text-xs text-slate-400">Type: {event.template?.name || '—'}</p>
      </div>
    </div>
  );
}
